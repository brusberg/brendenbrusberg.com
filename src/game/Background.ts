/**
 * Background - Manages background layers and rendering
 * Supports hand-drawn background image scaled 2x with dark mode tinting
 */

import type { Sprite, Color } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { TextureLoader } from '@/engine/TextureLoader';
import { WORLD_WIDTH, WORLD_HEIGHT } from './WorldLayout';
import { getDarkMode } from './DarkMode';

interface BackgroundLayer {
  sprite: Sprite | null;
  parallaxFactor: number; // 0 = static, 1 = moves with camera
  offsetX: number;
  offsetY: number;
}

// Background image scale (4096 image -> 8192 world)
const BACKGROUND_SCALE = 2;

export class Background {
  private readonly _textureLoader: TextureLoader;
  private readonly _layers: BackgroundLayer[] = [];

  // Main background image (hand-drawn)
  private _backgroundSprite: Sprite | null = null;
  private _backgroundLoaded: boolean = false;

  // Grid settings for placeholder background (fallback)
  private readonly _gridSize: number = 128;
  private readonly _gridColor1: Color = { r: 0.12, g: 0.12, b: 0.2, a: 1 };
  private readonly _gridColor2: Color = { r: 0.15, g: 0.15, b: 0.25, a: 1 };

  // World bounds
  private readonly _worldWidth: number = WORLD_WIDTH;
  private readonly _worldHeight: number = WORLD_HEIGHT;

  constructor(textureLoader: TextureLoader) {
    this._textureLoader = textureLoader;
    // Auto-load the background image
    this._loadBackgroundImage();
  }

  /**
   * Load the main background image
   */
  private async _loadBackgroundImage(): Promise<void> {
    try {
      this._backgroundSprite = await this._textureLoader.loadSprite('/assets/sprites/background.png');
      this._backgroundLoaded = true;
      console.log('Background image loaded successfully');
    } catch (error) {
      console.warn('Background image not found, using grid fallback:', error);
      this._backgroundLoaded = false;
    }
  }

  /**
   * Add a background layer from an image
   */
  async addLayer(imageUrl: string, parallaxFactor: number = 1): Promise<void> {
    try {
      const sprite = await this._textureLoader.loadSprite(imageUrl);
      this._layers.push({
        sprite,
        parallaxFactor,
        offsetX: 0,
        offsetY: 0,
      });
    } catch (error) {
      console.warn('Failed to load background layer:', imageUrl, error);
    }
  }

  /**
   * Render all background layers
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number, screenWidth: number, screenHeight: number): void {
    // If main background is loaded, render it
    if (this._backgroundLoaded && this._backgroundSprite) {
      this._renderBackgroundImage(batch, offsetX, offsetY, screenWidth, screenHeight);
      return;
    }

    // If parallax layers loaded, render those
    if (this._layers.length > 0) {
      for (const layer of this._layers) {
        if (!layer.sprite) continue;
        const x = layer.offsetX + offsetX * layer.parallaxFactor;
        const y = layer.offsetY + offsetY * layer.parallaxFactor;
        batch.draw(layer.sprite, x, y);
      }
      return;
    }

    // Fallback to grid placeholder
    this._renderGridBackground(batch, offsetX, offsetY, screenWidth, screenHeight);
  }

  /**
   * Render the main background image with dark mode tinting
   */
  private _renderBackgroundImage(batch: SpriteBatch, offsetX: number, offsetY: number, screenWidth: number, screenHeight: number): void {
    if (!this._backgroundSprite) return;

    const darkMode = getDarkMode();
    
    // Calculate the scaled dimensions
    const scaledWidth = this._backgroundSprite.width * BACKGROUND_SCALE;
    const scaledHeight = this._backgroundSprite.height * BACKGROUND_SCALE;

    // Calculate visible area to potentially optimize (but we draw the whole thing for simplicity)
    // The WebGL viewport clipping will handle not drawing off-screen pixels
    
    // Dark mode tinting: in dark mode, make white areas grey
    // The background is black lines on white, so we tint white -> grey
    let tint: Color;
    if (darkMode.isDark) {
      // Dark mode: tint white to dark grey (lines stay visible as they're black)
      tint = { r: 0.15, g: 0.15, b: 0.2, a: 1 };
    } else {
      // Light mode: show as-is (white background)
      tint = { r: 1, g: 1, b: 1, a: 1 };
    }

    // Draw the background at world origin (0,0), scaled 2x
    batch.draw(
      this._backgroundSprite,
      offsetX, // Position includes camera offset
      offsetY,
      scaledWidth,
      scaledHeight,
      0,
      tint
    );
  }

  /**
   * Render a grid background as placeholder
   */
  private _renderGridBackground(batch: SpriteBatch, offsetX: number, offsetY: number, screenWidth: number, screenHeight: number): void {
    // Calculate visible grid range based on actual screen size
    const startX = Math.floor(-offsetX / this._gridSize) - 1;
    const startY = Math.floor(-offsetY / this._gridSize) - 1;
    const endX = startX + Math.ceil(screenWidth / this._gridSize) + 3;
    const endY = startY + Math.ceil(screenHeight / this._gridSize) + 3;

    // Clamp to world bounds (convert to grid coords)
    const worldStartX = 0;
    const worldStartY = 0;
    const worldEndX = Math.ceil(this._worldWidth / this._gridSize);
    const worldEndY = Math.ceil(this._worldHeight / this._gridSize);

    // Draw grid cells
    for (let gridY = Math.max(startY, worldStartY); gridY < Math.min(endY, worldEndY); gridY++) {
      for (let gridX = Math.max(startX, worldStartX); gridX < Math.min(endX, worldEndX); gridX++) {
        const x = gridX * this._gridSize + offsetX;
        const y = gridY * this._gridSize + offsetY;

        // Checkerboard pattern
        const isEven = (gridX + gridY) % 2 === 0;
        const color = isEven ? this._gridColor1 : this._gridColor2;

        batch.drawRect(x, y, this._gridSize, this._gridSize, color);
      }
    }

    // Draw world boundary indicator
    this._renderWorldBoundary(batch, offsetX, offsetY);
  }

  /**
   * Draw a subtle indicator at world boundaries
   */
  private _renderWorldBoundary(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    const borderColor: Color = { r: 0.3, g: 0.3, b: 0.5, a: 0.6 };
    const borderWidth = 8;

    // Top border
    batch.drawRect(offsetX, offsetY, this._worldWidth, borderWidth, borderColor);
    // Bottom border
    batch.drawRect(offsetX, this._worldHeight - borderWidth + offsetY, this._worldWidth, borderWidth, borderColor);
    // Left border
    batch.drawRect(offsetX, offsetY, borderWidth, this._worldHeight, borderColor);
    // Right border
    batch.drawRect(this._worldWidth - borderWidth + offsetX, offsetY, borderWidth, this._worldHeight, borderColor);
  }

  /**
   * Get world dimensions
   */
  get worldWidth(): number {
    return this._worldWidth;
  }

  get worldHeight(): number {
    return this._worldHeight;
  }
}

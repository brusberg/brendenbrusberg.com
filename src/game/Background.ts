/**
 * Background - Manages background layers and rendering
 * EXPANDED for larger world (4800x3600)
 */

import type { Sprite, Color } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { TextureLoader } from '@/engine/TextureLoader';
import { WORLD_WIDTH, WORLD_HEIGHT } from './WorldLayout';

interface BackgroundLayer {
  sprite: Sprite | null;
  parallaxFactor: number; // 0 = static, 1 = moves with camera
  offsetX: number;
  offsetY: number;
}

export class Background {
  private readonly _textureLoader: TextureLoader;
  private readonly _layers: BackgroundLayer[] = [];

  // Grid settings for placeholder background (3x scale)
  private readonly _gridSize: number = 128; // Larger grid cells
  private readonly _gridColor1: Color = { r: 0.12, g: 0.12, b: 0.2, a: 1 };
  private readonly _gridColor2: Color = { r: 0.15, g: 0.15, b: 0.25, a: 1 };

  // World bounds
  private readonly _worldWidth: number = WORLD_WIDTH;
  private readonly _worldHeight: number = WORLD_HEIGHT;

  constructor(textureLoader: TextureLoader) {
    this._textureLoader = textureLoader;
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
    // If no layers loaded, render grid placeholder
    if (this._layers.length === 0) {
      this._renderGridBackground(batch, offsetX, offsetY, screenWidth, screenHeight);
      return;
    }

    // Render each layer with parallax
    for (const layer of this._layers) {
      if (!layer.sprite) continue;

      const x = layer.offsetX + offsetX * layer.parallaxFactor;
      const y = layer.offsetY + offsetY * layer.parallaxFactor;

      batch.draw(layer.sprite, x, y);
    }
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

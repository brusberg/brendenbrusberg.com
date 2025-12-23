/**
 * Character - Player stick figure with 8-directional movement and animation
 * SCALED 3x for readability (144x192 pixels)
 */

import type { Vector2, Sprite, Color, Direction, AnimationState } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { TextureLoader } from '@/engine/TextureLoader';
import { InputManager } from '@/input/InputManager';

// Animation configuration
const FRAME_DURATION = 150; // ms per frame
const WALK_FRAMES = 4; // frames per walk animation

// Scale factor (3x for readability)
const SCALE = 3;

export class Character {
  private readonly _textureLoader: TextureLoader;

  // Position and movement
  position: Vector2 = { x: 0, y: 0 };
  private _speed: number = 400; // pixels per second (increased for larger world)

  // Visual (3x scale: 48*3 = 144, 64*3 = 192)
  private readonly _width: number = 48 * SCALE;
  private readonly _height: number = 64 * SCALE;

  // Animation state
  private _state: AnimationState = 'idle';
  private _direction: Direction = 's'; // facing south by default
  private _animationTime: number = 0;
  private _currentFrame: number = 0;

  // Placeholder sprite (colored rectangle until real sprites are loaded)
  private _placeholderSprite: Sprite | null = null;

  // Interaction range (scaled up for larger world)
  readonly interactRange: number = 200;

  constructor(textureLoader: TextureLoader) {
    this._textureLoader = textureLoader;
    this._createPlaceholder();
  }

  /**
   * Create placeholder sprite for development
   */
  private _createPlaceholder(): void {
    this._placeholderSprite = this._textureLoader.createPlaceholderSprite(
      this._width,
      this._height,
      0.3, 0.7, 0.9 // Light blue color
    );
  }

  /**
   * Update character state and position
   */
  update(deltaTime: number, direction: Vector2): void {
    const isMoving = direction.x !== 0 || direction.y !== 0;

    // Update position
    if (isMoving) {
      this.position.x += direction.x * this._speed * deltaTime;
      this.position.y += direction.y * this._speed * deltaTime;

      // Update facing direction
      const dirName = InputManager.directionToName(direction);
      if (dirName) {
        this._direction = dirName as Direction;
      }

      this._state = 'walk';
    } else {
      this._state = 'idle';
    }

    // Update animation
    this._updateAnimation(deltaTime);
  }

  /**
   * Update animation frame
   */
  private _updateAnimation(deltaTime: number): void {
    this._animationTime += deltaTime * 1000; // Convert to ms

    if (this._state === 'walk') {
      if (this._animationTime >= FRAME_DURATION) {
        this._animationTime -= FRAME_DURATION;
        this._currentFrame = (this._currentFrame + 1) % WALK_FRAMES;
      }
    } else {
      // Idle - reset animation
      this._currentFrame = 0;
      this._animationTime = 0;
    }
  }

  /**
   * Render the character
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    if (!this._placeholderSprite) return;

    // Calculate screen position (centered on character position)
    const screenX = this.position.x - this._width / 2 + offsetX;
    const screenY = this.position.y - this._height / 2 + offsetY;

    // Get color based on direction (visual feedback for testing)
    const color = this._getDirectionColor();

    // Draw character
    batch.draw(
      this._placeholderSprite,
      screenX,
      screenY,
      this._width,
      this._height,
      0,
      color
    );

    // Draw direction indicator (small triangle showing facing direction)
    this._drawDirectionIndicator(batch, screenX, screenY);

    // Draw "feet" animation (simple visual for walking)
    if (this._state === 'walk') {
      this._drawWalkingFeet(batch, screenX, screenY);
    }
  }

  /**
   * Get color based on current direction
   */
  private _getDirectionColor(): Color {
    const colors: Record<Direction, Color> = {
      'n': { r: 0.4, g: 0.8, b: 0.4, a: 1 },   // Green
      'ne': { r: 0.5, g: 0.8, b: 0.5, a: 1 },
      'e': { r: 0.8, g: 0.4, b: 0.4, a: 1 },   // Red
      'se': { r: 0.8, g: 0.5, b: 0.5, a: 1 },
      's': { r: 0.4, g: 0.4, b: 0.8, a: 1 },   // Blue
      'sw': { r: 0.5, g: 0.5, b: 0.8, a: 1 },
      'w': { r: 0.8, g: 0.8, b: 0.4, a: 1 },   // Yellow
      'nw': { r: 0.6, g: 0.8, b: 0.4, a: 1 },
    };
    return colors[this._direction];
  }

  /**
   * Draw a small indicator showing facing direction
   */
  private _drawDirectionIndicator(batch: SpriteBatch, screenX: number, screenY: number): void {
    const s = SCALE;
    // Direction offsets for indicator position (scaled)
    const offsets: Record<Direction, { x: number; y: number }> = {
      'n': { x: this._width / 2 - 6 * s, y: -12 * s },
      'ne': { x: this._width - 6 * s, y: -6 * s },
      'e': { x: this._width, y: this._height / 2 - 6 * s },
      'se': { x: this._width - 6 * s, y: this._height - 6 * s },
      's': { x: this._width / 2 - 6 * s, y: this._height },
      'sw': { x: -6 * s, y: this._height - 6 * s },
      'w': { x: -12 * s, y: this._height / 2 - 6 * s },
      'nw': { x: -6 * s, y: -6 * s },
    };

    const offset = offsets[this._direction];
    batch.drawRect(
      screenX + offset.x,
      screenY + offset.y,
      12 * s,
      12 * s,
      { r: 1, g: 1, b: 1, a: 0.8 }
    );
  }

  /**
   * Draw simple walking animation effect
   */
  private _drawWalkingFeet(batch: SpriteBatch, screenX: number, screenY: number): void {
    const s = SCALE;
    // Alternate left/right foot offset based on frame
    const footOffset = this._currentFrame % 2 === 0 ? -5 * s : 5 * s;
    const footY = screenY + this._height - 6 * s;

    // Left foot
    batch.drawRect(
      screenX + this._width / 2 - 16 * s + footOffset,
      footY,
      12 * s,
      6 * s,
      { r: 0.2, g: 0.2, b: 0.2, a: 1 }
    );

    // Right foot
    batch.drawRect(
      screenX + this._width / 2 + 4 * s - footOffset,
      footY,
      12 * s,
      6 * s,
      { r: 0.2, g: 0.2, b: 0.2, a: 1 }
    );
  }

  /**
   * Get the current animation state
   */
  get state(): AnimationState {
    return this._state;
  }

  /**
   * Get the current facing direction
   */
  get direction(): Direction {
    return this._direction;
  }

  /**
   * Set movement speed
   */
  set speed(value: number) {
    this._speed = value;
  }

  get speed(): number {
    return this._speed;
  }

  /**
   * Get character dimensions
   */
  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }
}

/**
 * TouchInput - Handle touch input for mobile devices
 * Tap anywhere to move character toward that point
 * 
 * FIXED: Now properly converts screen coordinates to world coordinates
 * by accounting for camera offset
 */

import type { Vector2 } from '@/types';

export class TouchInput {
  private _targetPosition: Vector2 | null = null; // World coordinates
  private _interact: boolean = false;
  private _canvas: HTMLCanvasElement;
  private _characterPosition: Vector2 = { x: 0, y: 0 };
  
  // Camera offset (needed to convert screen -> world coordinates)
  private _cameraX: number = 0;
  private _cameraY: number = 0;

  // Threshold distance to stop moving (in pixels, scaled for 3x)
  private readonly _arrivalThreshold: number = 30;

  // Double tap detection for interact
  private _lastTapTime: number = 0;
  private _doubleTapThreshold: number = 300; // ms

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._setupEventListeners();
  }

  private _setupEventListeners(): void {
    this._canvas.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    this._canvas.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    this._canvas.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });

    // Also support mouse for testing on desktop
    this._canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private _screenToWorld(screenX: number, screenY: number): Vector2 {
    return {
      x: screenX + this._cameraX,
      y: screenY + this._cameraY,
    };
  }

  private _getTouchPosition(event: TouchEvent): Vector2 {
    const touch = event.touches[0];
    if (!touch) {
      return { x: 0, y: 0 };
    }

    const rect = this._canvas.getBoundingClientRect();
    const scaleX = this._canvas.width / rect.width;
    const scaleY = this._canvas.height / rect.height;
    
    // Get screen position
    const screenX = (touch.clientX - rect.left) * scaleX;
    const screenY = (touch.clientY - rect.top) * scaleY;
    
    // Convert to world position
    return this._screenToWorld(screenX, screenY);
  }

  private _getMousePosition(event: MouseEvent): Vector2 {
    const rect = this._canvas.getBoundingClientRect();
    const scaleX = this._canvas.width / rect.width;
    const scaleY = this._canvas.height / rect.height;

    // Get screen position
    const screenX = (event.clientX - rect.left) * scaleX;
    const screenY = (event.clientY - rect.top) * scaleY;

    // Convert to world position
    return this._screenToWorld(screenX, screenY);
  }

  private _onTouchStart(event: TouchEvent): void {
    event.preventDefault();

    const now = Date.now();
    const pos = this._getTouchPosition(event);

    // Double tap detection
    if (now - this._lastTapTime < this._doubleTapThreshold) {
      this._interact = true;
      this._targetPosition = null; // Cancel movement on interact
    } else {
      this._targetPosition = pos;
    }

    this._lastTapTime = now;
  }

  private _onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    // Update target position while dragging
    this._targetPosition = this._getTouchPosition(event);
  }

  private _onTouchEnd(_event: TouchEvent): void {
    // Keep target position so character continues moving to it
    // Target will be cleared when character arrives
  }

  private _onMouseDown(event: MouseEvent): void {
    if (event.button === 0) {
      // Left click - move
      this._targetPosition = this._getMousePosition(event);
    } else if (event.button === 2) {
      // Right click - interact
      this._interact = true;
    }
  }

  /**
   * Update the current character position and camera offset
   */
  setCharacterPosition(position: Vector2): void {
    this._characterPosition = { ...position };

    // Check if we've arrived at target
    if (this._targetPosition) {
      const dx = this._targetPosition.x - this._characterPosition.x;
      const dy = this._targetPosition.y - this._characterPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this._arrivalThreshold) {
        this._targetPosition = null;
      }
    }
  }

  /**
   * Update camera position (needed for screen->world conversion)
   */
  setCameraOffset(cameraX: number, cameraY: number): void {
    this._cameraX = cameraX;
    this._cameraY = cameraY;
  }

  /**
   * Get direction vector from character to tap target
   * Returns normalized direction, or zero if no target
   */
  getDirection(): Vector2 {
    if (!this._targetPosition) {
      return { x: 0, y: 0 };
    }

    // Now both positions are in world coordinates
    const dx = this._targetPosition.x - this._characterPosition.x;
    const dy = this._targetPosition.y - this._characterPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this._arrivalThreshold) {
      this._targetPosition = null;
      return { x: 0, y: 0 };
    }

    // Normalize
    return {
      x: dx / distance,
      y: dy / distance,
    };
  }

  /**
   * Check if interact was triggered (double tap) and consume it
   */
  consumeInteract(): boolean {
    const wasPressed = this._interact;
    this._interact = false;
    return wasPressed;
  }

  /**
   * Clear current movement target
   */
  clearTarget(): void {
    this._targetPosition = null;
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    this._canvas.removeEventListener('touchstart', this._onTouchStart.bind(this));
    this._canvas.removeEventListener('touchmove', this._onTouchMove.bind(this));
    this._canvas.removeEventListener('touchend', this._onTouchEnd.bind(this));
    this._canvas.removeEventListener('mousedown', this._onMouseDown.bind(this));
  }
}

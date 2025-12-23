/**
 * KeyboardInput - Handle keyboard input for WASD and arrow keys
 */

import type { Vector2 } from '@/types';

export class KeyboardInput {
  private _keys: Set<string> = new Set();
  private _interact: boolean = false;

  constructor() {
    this._setupEventListeners();
  }

  private _setupEventListeners(): void {
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  private _onKeyDown(event: KeyboardEvent): void {
    // Prevent default for game keys
    const gameKeys = ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    if (gameKeys.includes(event.key)) {
      event.preventDefault();
    }

    this._keys.add(event.key.toLowerCase());

    // Space triggers interact
    if (event.key === ' ') {
      this._interact = true;
    }
  }

  private _onKeyUp(event: KeyboardEvent): void {
    this._keys.delete(event.key.toLowerCase());

    // Also handle uppercase for arrow keys
    if (event.key.startsWith('Arrow')) {
      this._keys.delete(event.key);
    }
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this._keys.has(key.toLowerCase());
  }

  /**
   * Get the current direction vector based on key presses
   * Returns normalized direction for consistent movement speed
   */
  getDirection(): Vector2 {
    let x = 0;
    let y = 0;

    // Horizontal
    if (this.isKeyDown('a') || this.isKeyDown('arrowleft')) {
      x -= 1;
    }
    if (this.isKeyDown('d') || this.isKeyDown('arrowright')) {
      x += 1;
    }

    // Vertical (remember: screen Y is inverted, up = negative)
    if (this.isKeyDown('w') || this.isKeyDown('arrowup')) {
      y -= 1;
    }
    if (this.isKeyDown('s') || this.isKeyDown('arrowdown')) {
      y += 1;
    }

    // Normalize diagonal movement so it's not faster
    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }

  /**
   * Check if interact was pressed this frame and consume the input
   */
  consumeInteract(): boolean {
    const wasPressed = this._interact;
    this._interact = false;
    return wasPressed;
  }

  /**
   * Check if interact key is currently held
   */
  isInteractPressed(): boolean {
    return this._keys.has(' ');
  }

  /**
   * Clean up event listeners
   */
  dispose(): void {
    window.removeEventListener('keydown', this._onKeyDown.bind(this));
    window.removeEventListener('keyup', this._onKeyUp.bind(this));
  }
}




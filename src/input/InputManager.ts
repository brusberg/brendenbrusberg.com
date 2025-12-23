/**
 * InputManager - Unified input handling for keyboard and touch
 * Provides a single API for getting player input regardless of device
 */

import type { Vector2, InputState } from '@/types';
import { KeyboardInput } from './KeyboardInput';
import { TouchInput } from './TouchInput';

export class InputManager {
  private readonly _keyboard: KeyboardInput;
  private readonly _touch: TouchInput;

  constructor(canvas: HTMLCanvasElement) {
    this._keyboard = new KeyboardInput();
    this._touch = new TouchInput(canvas);
  }

  /**
   * Update touch input with current character position
   * Call this each frame before getting direction
   */
  update(characterPosition: Vector2): void {
    this._touch.setCharacterPosition(characterPosition);
  }

  /**
   * Update camera offset for proper screen->world coordinate conversion
   * Call this each frame with the current camera position
   */
  setCameraOffset(cameraX: number, cameraY: number): void {
    this._touch.setCameraOffset(cameraX, cameraY);
  }

  /**
   * Get the combined direction from all input sources
   * Keyboard takes priority over touch
   */
  getDirection(): Vector2 {
    // Get keyboard direction first
    const keyboardDir = this._keyboard.getDirection();

    // If keyboard is active, use it exclusively
    if (keyboardDir.x !== 0 || keyboardDir.y !== 0) {
      // Clear touch target when using keyboard
      this._touch.clearTarget();
      return keyboardDir;
    }

    // Otherwise use touch
    return this._touch.getDirection();
  }

  /**
   * Check if interact was triggered this frame
   */
  consumeInteract(): boolean {
    return this._keyboard.consumeInteract() || this._touch.consumeInteract();
  }

  /**
   * Get the full input state
   */
  getState(): InputState {
    return {
      direction: this.getDirection(),
      interact: false, // Use consumeInteract() for one-shot actions
    };
  }

  /**
   * Convert direction vector to 8-way direction name
   */
  static directionToName(dir: Vector2): string | null {
    if (dir.x === 0 && dir.y === 0) return null;

    // Determine primary direction based on angle
    const angle = Math.atan2(dir.y, dir.x);
    const degrees = angle * (180 / Math.PI);

    // Map angle to 8 directions
    // 0° = East, 90° = South, -90° = North, 180° = West
    if (degrees > -22.5 && degrees <= 22.5) return 'e';
    if (degrees > 22.5 && degrees <= 67.5) return 'se';
    if (degrees > 67.5 && degrees <= 112.5) return 's';
    if (degrees > 112.5 && degrees <= 157.5) return 'sw';
    if (degrees > 157.5 || degrees <= -157.5) return 'w';
    if (degrees > -157.5 && degrees <= -112.5) return 'nw';
    if (degrees > -112.5 && degrees <= -67.5) return 'n';
    if (degrees > -67.5 && degrees <= -22.5) return 'ne';

    return null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this._keyboard.dispose();
    this._touch.dispose();
  }
}

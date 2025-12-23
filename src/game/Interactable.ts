/**
 * Interactable - Interactive elements in the game world
 */

import type { Vector2, Rect, InteractEvent, Color } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';

/**
 * Single interactable object in the world
 */
export interface InteractableData {
  id: string;
  position: Vector2;
  hitbox: Rect;
  event: InteractEvent;
}

/**
 * Runtime state for an interactable
 */
interface InteractableState {
  data: InteractableData;
  isTriggered: boolean;
  triggerTime: number;
  visualEffect: number; // 0-1 for animation progress
}

/**
 * Manages all interactables in the game
 */
export class InteractableManager {
  private readonly _interactables: Map<string, InteractableState> = new Map();

  // Visual effect duration in seconds
  private readonly _effectDuration: number = 0.5;

  /**
   * Add an interactable to the world
   */
  add(data: InteractableData): void {
    this._interactables.set(data.id, {
      data,
      isTriggered: false,
      triggerTime: 0,
      visualEffect: 0,
    });
  }

  /**
   * Remove an interactable
   */
  remove(id: string): void {
    this._interactables.delete(id);
  }

  /**
   * Get an interactable by ID
   */
  get(id: string): InteractableData | undefined {
    return this._interactables.get(id)?.data;
  }

  /**
   * Check if player can interact with any object and trigger it
   * Returns the triggered interactable or null
   */
  checkInteraction(playerPos: Vector2, range: number): InteractableData | null {
    for (const state of this._interactables.values()) {
      if (this._isInRange(playerPos, state.data, range)) {
        this._trigger(state);
        return state.data;
      }
    }
    return null;
  }

  /**
   * Check if player position is within range of an interactable
   */
  private _isInRange(playerPos: Vector2, data: InteractableData, range: number): boolean {
    // Calculate distance from player to center of hitbox
    const centerX = data.hitbox.x + data.hitbox.width / 2;
    const centerY = data.hitbox.y + data.hitbox.height / 2;

    const dx = playerPos.x - centerX;
    const dy = playerPos.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= range;
  }

  /**
   * Trigger an interactable's event
   */
  private _trigger(state: InteractableState): void {
    state.isTriggered = true;
    state.triggerTime = 0;
    state.visualEffect = 1;

    // Handle different event types
    const event = state.data.event;
    switch (event.type) {
      case 'visual':
        // Visual effects are handled in render
        console.log(`Visual effect: ${event.effect}`);
        break;

      case 'dialog':
        // TODO: Implement dialog system
        console.log(`Dialog: ${event.text}`);
        this._showTemporaryMessage(event.text);
        break;

      case 'link':
        // TODO: Implement link navigation
        console.log(`Link: ${event.url}`);
        break;

      case 'animation':
        // TODO: Implement animation triggers
        console.log(`Animation: ${event.name}`);
        break;
    }
  }

  /**
   * Show a temporary message (placeholder for dialog system)
   */
  private _showTemporaryMessage(text: string): void {
    // Create a temporary DOM element for the message
    const message = document.createElement('div');
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      z-index: 1000;
      animation: fadeInOut 2s forwards;
    `;

    // Add animation keyframes if not already added
    if (!document.getElementById('interact-animation-style')) {
      const style = document.createElement('style');
      style.id = 'interact-animation-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
          20% { opacity: 1; transform: translateX(-50%) translateY(0); }
          80% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(message);

    // Remove after animation
    setTimeout(() => message.remove(), 2000);
  }

  /**
   * Update all interactables (for visual effects)
   */
  update(deltaTime: number): void {
    for (const state of this._interactables.values()) {
      if (state.visualEffect > 0) {
        state.triggerTime += deltaTime;
        state.visualEffect = Math.max(0, 1 - state.triggerTime / this._effectDuration);

        if (state.visualEffect <= 0) {
          state.isTriggered = false;
        }
      }
    }
  }

  /**
   * Render all interactables
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number, playerPos: Vector2): void {
    for (const state of this._interactables.values()) {
      const { data, visualEffect } = state;
      const hitbox = data.hitbox;

      // Check if player is in range (for highlight)
      const inRange = this._isInRange(playerPos, data, 80);

      // Calculate visual properties
      let color: Color;
      let scale = 1;

      if (visualEffect > 0) {
        // Triggered effect: pulse and glow
        const pulse = Math.sin(visualEffect * Math.PI * 4) * 0.1;
        scale = 1 + pulse + visualEffect * 0.2;
        color = {
          r: 0.9 + visualEffect * 0.1,
          g: 0.7 + visualEffect * 0.3,
          b: 0.3,
          a: 0.9,
        };
      } else if (inRange) {
        // In range: subtle highlight
        color = { r: 0.7, g: 0.5, b: 0.2, a: 0.9 };
      } else {
        // Default: muted color
        color = { r: 0.5, g: 0.4, b: 0.3, a: 0.8 };
      }

      // Calculate scaled dimensions
      const scaledWidth = hitbox.width * scale;
      const scaledHeight = hitbox.height * scale;
      const scaledX = hitbox.x - (scaledWidth - hitbox.width) / 2;
      const scaledY = hitbox.y - (scaledHeight - hitbox.height) / 2;

      // Draw the interactable
      batch.drawRect(
        scaledX + offsetX,
        scaledY + offsetY,
        scaledWidth,
        scaledHeight,
        color
      );

      // Draw interaction indicator when in range
      if (inRange && visualEffect <= 0) {
        // Small pulsing indicator above the object
        const time = performance.now() / 500;
        const bobOffset = Math.sin(time) * 4;

        batch.drawRect(
          hitbox.x + hitbox.width / 2 - 6 + offsetX,
          hitbox.y - 16 + bobOffset + offsetY,
          12,
          8,
          { r: 1, g: 1, b: 1, a: 0.7 }
        );
      }
    }
  }

  /**
   * Get all interactables
   */
  getAll(): InteractableData[] {
    return Array.from(this._interactables.values()).map(s => s.data);
  }

  /**
   * Clear all interactables
   */
  clear(): void {
    this._interactables.clear();
  }
}




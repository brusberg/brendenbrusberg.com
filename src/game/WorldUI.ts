/**
 * WorldUI - Manages HTML elements positioned in world-space
 * Used for displaying complex content like PDFs that need to scroll with the world
 */

import type { Vector2 } from '@/types';

export interface WorldUIElement {
  id: string;
  element: HTMLElement;
  worldPosition: Vector2;
  anchor?: 'center' | 'top-left' | 'bottom-center';
}

export class WorldUI {
  private readonly _container: HTMLElement;
  private readonly _elements: Map<string, WorldUIElement> = new Map();
  private _cameraX: number = 0;
  private _cameraY: number = 0;
  private _canvasWidth: number = 800;
  private _canvasHeight: number = 600;
  private _canvas: HTMLCanvasElement | null = null;

  constructor() {
    // Create container for world-positioned UI elements
    this._container = document.createElement('div');
    this._container.id = 'world-ui-container';
    this._container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      pointer-events: none;
      overflow: visible;
      z-index: 10;
    `;
    
    // Get reference to canvas for coordinate conversion
    this._canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    
    document.body.appendChild(this._container);
  }

  /**
   * Add an HTML element at a world position
   */
  addElement(
    id: string, 
    element: HTMLElement, 
    worldPosition: Vector2,
    anchor: 'center' | 'top-left' | 'bottom-center' = 'center'
  ): void {
    // Style the element for world positioning
    element.style.position = 'fixed';
    element.style.pointerEvents = 'auto';
    
    this._container.appendChild(element);
    
    this._elements.set(id, {
      id,
      element,
      worldPosition,
      anchor,
    });
    
    // Position immediately
    this._updateElementPosition(id);
  }

  /**
   * Remove an element from world UI
   */
  removeElement(id: string): void {
    const item = this._elements.get(id);
    if (item) {
      item.element.remove();
      this._elements.delete(id);
    }
  }

  /**
   * Update element's world position
   */
  setElementPosition(id: string, worldPosition: Vector2): void {
    const item = this._elements.get(id);
    if (item) {
      item.worldPosition = worldPosition;
      this._updateElementPosition(id);
    }
  }

  /**
   * Update camera position (call each frame)
   */
  updateCamera(cameraX: number, cameraY: number, canvasWidth: number, canvasHeight: number): void {
    // Only update if values actually changed (performance optimization)
    const changed = 
      this._cameraX !== cameraX || 
      this._cameraY !== cameraY ||
      this._canvasWidth !== canvasWidth ||
      this._canvasHeight !== canvasHeight;
    
    this._cameraX = cameraX;
    this._cameraY = cameraY;
    this._canvasWidth = canvasWidth || 800;  // Fallback to prevent divide by zero
    this._canvasHeight = canvasHeight || 600;
    
    // Update reference to canvas if not set
    if (!this._canvas) {
      this._canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    }
    
    // Update all element positions
    if (changed) {
      for (const id of this._elements.keys()) {
        this._updateElementPosition(id);
      }
    }
  }

  /**
   * Update a single element's screen position
   */
  private _updateElementPosition(id: string): void {
    const item = this._elements.get(id);
    if (!item) return;
    
    // Get canvas dimensions and scale
    let scaleX = 1;
    let scaleY = 1;
    let canvasLeft = 0;
    let canvasTop = 0;
    
    if (this._canvas) {
      const rect = this._canvas.getBoundingClientRect();
      canvasLeft = rect.left;
      canvasTop = rect.top;
      // Scale from WebGL coordinates to CSS pixels
      if (this._canvasWidth > 0 && this._canvasHeight > 0) {
        scaleX = rect.width / this._canvasWidth;
        scaleY = rect.height / this._canvasHeight;
      }
    }
    
    // Convert world position to screen position (in CSS pixels, relative to viewport)
    const screenX = canvasLeft + (item.worldPosition.x - this._cameraX) * scaleX;
    const screenY = canvasTop + (item.worldPosition.y - this._cameraY) * scaleY;
    
    // Apply position directly using left/top (more stable than transform for this use case)
    item.element.style.left = `${screenX}px`;
    item.element.style.top = `${screenY}px`;
    
    // Apply anchor offset via transform
    switch (item.anchor) {
      case 'center':
        item.element.style.transform = 'translate(-50%, -50%)';
        break;
      case 'top-left':
        item.element.style.transform = '';
        break;
      case 'bottom-center':
        item.element.style.transform = 'translate(-50%, -100%)';
        break;
    }
    
    // Hide if off-screen (optimization)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const bounds = item.element.getBoundingClientRect();
    const isVisible = 
      bounds.right > 0 && 
      bounds.left < viewportWidth &&
      bounds.bottom > 0 && 
      bounds.top < viewportHeight;
    
    item.element.style.visibility = isVisible ? 'visible' : 'hidden';
  }

  /**
   * Get an element by ID
   */
  getElement(id: string): WorldUIElement | undefined {
    return this._elements.get(id);
  }

  /**
   * Check if an element exists
   */
  hasElement(id: string): boolean {
    return this._elements.has(id);
  }

  /**
   * Clean up all elements
   */
  dispose(): void {
    this._elements.forEach(item => item.element.remove());
    this._elements.clear();
    this._container.remove();
  }
}

// Singleton instance
let worldUIInstance: WorldUI | null = null;

export function getWorldUI(): WorldUI {
  if (!worldUIInstance) {
    worldUIInstance = new WorldUI();
  }
  return worldUIInstance;
}


/**
 * Shared TypeScript interfaces and types for the WebGL Stick Figure project
 */

// ============================================================================
// Vector Types
// ============================================================================

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Rendering Types
// ============================================================================

export interface Sprite {
  readonly texture: WebGLTexture;
  readonly width: number;
  readonly height: number;
  readonly u0: number;  // Texture coordinates
  readonly v0: number;
  readonly u1: number;
  readonly v1: number;
}

export interface SpriteInstance {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  sprite: Sprite;
  tint: Color;
}

export interface Color {
  r: number;  // 0-1
  g: number;
  b: number;
  a: number;
}

// ============================================================================
// Animation Types
// ============================================================================

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export type AnimationState = 'idle' | 'walk';

export interface AnimationFrame {
  sprite: Sprite;
  duration: number;  // milliseconds
}

export interface Animation {
  frames: readonly AnimationFrame[];
  loop: boolean;
}

// ============================================================================
// Game Entity Types
// ============================================================================

export interface Renderable {
  update(deltaTime: number): void;
  render(batch: SpriteBatchInterface): void;
}

export interface SpriteBatchInterface {
  begin(): void;
  draw(sprite: Sprite, x: number, y: number, width?: number, height?: number, rotation?: number, tint?: Color): void;
  end(): void;
}

// ============================================================================
// Interactable Types
// ============================================================================

export type InteractEventType = 'visual' | 'dialog' | 'link' | 'animation';

export interface VisualEvent {
  type: 'visual';
  effect: string;
}

export interface DialogEvent {
  type: 'dialog';
  text: string;
}

export interface LinkEvent {
  type: 'link';
  url: string;
}

export interface AnimationEvent {
  type: 'animation';
  name: string;
}

export type InteractEvent = VisualEvent | DialogEvent | LinkEvent | AnimationEvent;

export interface Interactable {
  readonly id: string;
  readonly position: Vector2;
  readonly hitbox: Rect;
  readonly event: InteractEvent;
  isPlayerInRange(playerPos: Vector2, range: number): boolean;
  trigger(): void;
}

// ============================================================================
// Input Types
// ============================================================================

export interface InputState {
  direction: Vector2;
  interact: boolean;
}

// ============================================================================
// Game State Types
// ============================================================================

export interface GameState {
  playerPosition: Vector2;
  cameraOffset: Vector2;
  currentBackground: string;
}




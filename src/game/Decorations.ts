/**
 * Decorations - Manages decorative elements (trees, grass, flowers, fountain)
 * SCALED 3x for larger world
 */

import type { Sprite, Color } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { SpriteLoader } from '@/engine/SpriteLoader';
import { DECORATION_PLACEMENTS, INTERACTIVE_LOCATIONS, type DecorationPlacement } from './WorldLayout';

interface DecorationInstance {
  placement: DecorationPlacement;
  sprite: Sprite;
  animationOffset: number; // For subtle animation variations
}

export class Decorations {
  private readonly _spriteLoader: SpriteLoader;
  private _instances: DecorationInstance[] = [];
  private _fountainSprite: Sprite | null = null;
  private _fountainAnimTime: number = 0;

  constructor(spriteLoader: SpriteLoader) {
    this._spriteLoader = spriteLoader;
    this._initDecorations();
  }

  /**
   * Initialize all decoration instances
   */
  private _initDecorations(): void {
    for (const placement of DECORATION_PLACEMENTS) {
      let sprite: Sprite;

      switch (placement.type) {
        case 'tree':
          sprite = this._spriteLoader.getSprite('tree');
          break;
        case 'grass':
          sprite = this._spriteLoader.getSprite('grass');
          break;
        case 'flower':
          sprite = this._spriteLoader.getSprite('flower');
          break;
        default:
          continue;
      }

      this._instances.push({
        placement,
        sprite,
        animationOffset: Math.random() * Math.PI * 2, // Random phase offset
      });
    }

    // Load fountain sprite separately (for special animation)
    this._fountainSprite = this._spriteLoader.getSprite('fountain');
  }

  /**
   * Update decorations (for animations)
   */
  update(deltaTime: number): void {
    this._fountainAnimTime += deltaTime;
  }

  /**
   * Render all decorations
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    const time = performance.now() / 1000;

    // Render fountain first (it's a landmark)
    this._renderFountain(batch, offsetX, offsetY);

    // Sort by Y position for depth ordering
    const sorted = [...this._instances].sort(
      (a, b) => a.placement.position.y - b.placement.position.y
    );

    for (const instance of sorted) {
      this._renderDecoration(batch, instance, offsetX, offsetY, time);
    }
  }

  /**
   * Render a single decoration
   */
  private _renderDecoration(
    batch: SpriteBatch,
    instance: DecorationInstance,
    offsetX: number,
    offsetY: number,
    time: number
  ): void {
    const { placement, sprite, animationOffset } = instance;
    const pos = placement.position;
    const scale = placement.scale ?? 1;

    // Calculate position (anchor at bottom center)
    const w = sprite.width * scale;
    const h = sprite.height * scale;
    let x = pos.x - w / 2 + offsetX;
    let y = pos.y - h + offsetY;

    // Subtle sway animation for trees and flowers
    if (placement.type === 'tree' || placement.type === 'flower') {
      const sway = Math.sin(time * 1.5 + animationOffset) * 4; // Increased sway for 3x scale
      x += sway * (placement.type === 'tree' ? 1 : 0.5);
    }

    // Subtle color tint based on type
    let tint: Color = { r: 1, g: 1, b: 1, a: 1 };
    if (placement.type === 'grass') {
      // Slight variation in grass color
      const greenVar = 0.9 + Math.sin(animationOffset) * 0.1;
      tint = { r: 0.9, g: greenVar, b: 0.9, a: 1 };
    }

    batch.draw(sprite, x, y, w, h, 0, tint);
  }

  /**
   * Render the fountain with animation
   */
  private _renderFountain(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    if (!this._fountainSprite) return;

    // Get fountain position from WorldLayout
    const fountainLoc = INTERACTIVE_LOCATIONS.find(l => l.id === 'fountain');
    if (!fountainLoc) return;

    const FOUNTAIN_POS = fountainLoc.position;

    const sprite = this._fountainSprite;
    const x = FOUNTAIN_POS.x - sprite.width / 2 + offsetX;
    const y = FOUNTAIN_POS.y - sprite.height + offsetY;

    // Subtle shimmer effect on fountain
    const shimmer = Math.sin(this._fountainAnimTime * 3) * 0.05;
    const tint: Color = { r: 1, g: 1 + shimmer, b: 1 + shimmer * 2, a: 1 };

    batch.draw(sprite, x, y, sprite.width, sprite.height, 0, tint);

    // Draw animated water particles (scaled up)
    this._renderWaterParticles(batch, FOUNTAIN_POS.x + offsetX, FOUNTAIN_POS.y - sprite.height / 2 + offsetY);
  }

  /**
   * Render animated water particles for fountain (scaled 3x)
   */
  private _renderWaterParticles(batch: SpriteBatch, centerX: number, centerY: number): void {
    const time = this._fountainAnimTime;
    const particleCount = 8; // More particles

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time;
      const radius = 50 + Math.sin(time * 2 + i) * 12; // Larger radius
      const height = Math.sin(time * 3 + i * 0.5) * 25; // Larger height variation

      const x = centerX + Math.cos(angle) * radius - 5;
      const y = centerY - 50 + height - 5;

      // Water droplet (larger for 3x scale)
      const alpha = 0.5 + Math.sin(time * 4 + i) * 0.3;
      batch.drawRect(x, y, 10, 10, { r: 0.5, g: 0.8, b: 1, a: alpha });
    }
  }

  /**
   * Get decoration at a position (for collision/interaction)
   */
  getDecorationAt(x: number, y: number, radius: number): DecorationInstance | null {
    for (const instance of this._instances) {
      const pos = instance.placement.position;
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        return instance;
      }
    }
    return null;
  }
}

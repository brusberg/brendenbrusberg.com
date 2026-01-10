/**
 * MockupTextureLoader - Load mockup sprites as WebGL textures
 * Generates textures from canvas drawings at runtime
 */

import type { Sprite } from '@/types';
import { 
  generateMockupCanvas, 
  SPRITE_CONFIGS, 
  type SpriteName 
} from '@/utils/MockupSprites';

export class MockupTextureLoader {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _spriteCache: Map<SpriteName, Sprite> = new Map();

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
  }

  /**
   * Get a mockup sprite by name
   */
  getSprite(name: SpriteName): Sprite {
    // Check cache first
    const cached = this._spriteCache.get(name);
    if (cached) {
      return cached;
    }

    // Generate the sprite
    const config = SPRITE_CONFIGS[name];
    const canvas = generateMockupCanvas(config);
    const texture = this._createTextureFromCanvas(canvas);

    const sprite: Sprite = {
      texture,
      width: config.width,
      height: config.height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };

    this._spriteCache.set(name, sprite);
    return sprite;
  }

  /**
   * Preload all mockup sprites
   */
  preloadAll(): void {
    const names = Object.keys(SPRITE_CONFIGS) as SpriteName[];
    for (const name of names) {
      this.getSprite(name);
    }
  }

  /**
   * Create a WebGL texture from a canvas
   */
  private _createTextureFromCanvas(canvas: HTMLCanvasElement): WebGLTexture {
    const gl = this._gl;
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error('Failed to create texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload canvas as texture
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      canvas
    );

    // Texture settings for pixel art
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  /**
   * Clean up all cached textures
   */
  dispose(): void {
    for (const sprite of this._spriteCache.values()) {
      this._gl.deleteTexture(sprite.texture);
    }
    this._spriteCache.clear();
  }
}




/**
 * TextureLoader - Load images as WebGL textures
 */

import type { Sprite } from '@/types';

export class TextureLoader {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _textureCache: Map<string, WebGLTexture> = new Map();

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
  }

  /**
   * Load an image from URL and create a WebGL texture
   */
  async loadTexture(url: string): Promise<WebGLTexture> {
    // Check cache first
    const cached = this._textureCache.get(url);
    if (cached) {
      return cached;
    }

    const image = await this._loadImage(url);
    const texture = this._createTextureFromImage(image);
    this._textureCache.set(url, texture);
    return texture;
  }

  /**
   * Load image as a Sprite (texture with dimensions)
   */
  async loadSprite(url: string): Promise<Sprite> {
    const image = await this._loadImage(url);
    const texture = this._createTextureFromImage(image);
    this._textureCache.set(url, texture);

    return {
      texture,
      width: image.width,
      height: image.height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };
  }

  /**
   * Create a solid color texture (useful for placeholders)
   */
  createSolidColorTexture(r: number, g: number, b: number, a: number = 1): WebGLTexture {
    const gl = this._gl;
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error('Failed to create texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Create 1x1 pixel texture
    const pixel = new Uint8Array([
      Math.floor(r * 255),
      Math.floor(g * 255),
      Math.floor(b * 255),
      Math.floor(a * 255),
    ]);

    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1, 1, 0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixel
    );

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  /**
   * Create a placeholder sprite (solid color)
   */
  createPlaceholderSprite(width: number, height: number, r: number, g: number, b: number): Sprite {
    const texture = this.createSolidColorTexture(r, g, b, 1);
    return {
      texture,
      width,
      height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };
  }

  /**
   * Load an image element from URL
   */
  private _loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      image.src = url;
    });
  }

  /**
   * Create a WebGL texture from an image element
   */
  private _createTextureFromImage(image: HTMLImageElement): WebGLTexture {
    const gl = this._gl;
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error('Failed to create texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Upload the image
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    // Check if dimensions are power of 2
    const isPowerOf2 = (value: number): boolean => (value & (value - 1)) === 0;
    
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Generate mipmaps for power-of-2 textures
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      // Non-power-of-2 textures need specific settings
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  /**
   * Delete a texture and remove from cache
   */
  deleteTexture(url: string): void {
    const texture = this._textureCache.get(url);
    if (texture) {
      this._gl.deleteTexture(texture);
      this._textureCache.delete(url);
    }
  }

  /**
   * Clean up all textures
   */
  dispose(): void {
    for (const texture of this._textureCache.values()) {
      this._gl.deleteTexture(texture);
    }
    this._textureCache.clear();
  }
}




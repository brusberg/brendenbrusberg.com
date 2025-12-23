/**
 * SpriteBatch - Efficient batched sprite rendering for WebGL
 * Collects multiple draw calls and renders them in a single batch
 */

import type { Sprite, Color } from '@/types';
import { ShaderProgram } from './ShaderProgram';

// Shader sources (imported as raw strings by Vite)
import vertexShaderSource from '@/shaders/sprite.vert?raw';
import fragmentShaderSource from '@/shaders/sprite.frag?raw';

// Maximum sprites per batch
const MAX_SPRITES = 1000;
const VERTICES_PER_SPRITE = 4;
const INDICES_PER_SPRITE = 6;
const FLOATS_PER_VERTEX = 8; // x, y, u, v, r, g, b, a

export class SpriteBatch {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _shader: ShaderProgram;
  private readonly _vao: WebGLVertexArrayObject;
  private readonly _vertexBuffer: WebGLBuffer;
  private readonly _indexBuffer: WebGLBuffer;
  private readonly _vertices: Float32Array;
  private readonly _whiteTexture: WebGLTexture;

  private _spriteCount: number = 0;
  private _drawing: boolean = false;
  private _currentTexture: WebGLTexture | null = null;
  private _projectionMatrix: Float32Array;
  
  // Global tint applied to all sprites (for dark mode)
  private _globalTint: Color = { r: 1, g: 1, b: 1, a: 1 };

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
    this._shader = new ShaderProgram(gl, vertexShaderSource, fragmentShaderSource);
    
    // Create vertex array object
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Failed to create VAO');
    this._vao = vao;

    // Create vertex buffer
    const vbo = gl.createBuffer();
    if (!vbo) throw new Error('Failed to create vertex buffer');
    this._vertexBuffer = vbo;

    // Create index buffer
    const ibo = gl.createBuffer();
    if (!ibo) throw new Error('Failed to create index buffer');
    this._indexBuffer = ibo;

    // Allocate vertex data array
    this._vertices = new Float32Array(MAX_SPRITES * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX);

    // Initialize projection matrix (will be updated each frame)
    this._projectionMatrix = new Float32Array(16);

    // Create 1x1 white texture for solid color rendering
    this._whiteTexture = this._createWhiteTexture();

    this._setupBuffers();
  }

  /**
   * Create a 1x1 white texture for solid color sprites
   */
  private _createWhiteTexture(): WebGLTexture {
    const gl = this._gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Failed to create white texture');

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RGBA,
      1, 1, 0,
      gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255])
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  /**
   * Setup vertex and index buffers
   */
  private _setupBuffers(): void {
    const gl = this._gl;

    gl.bindVertexArray(this._vao);

    // Setup vertex buffer (dynamic, will be updated each frame)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this._vertices.byteLength, gl.DYNAMIC_DRAW);

    // Vertex attributes
    const stride = FLOATS_PER_VERTEX * 4; // 4 bytes per float

    // Position (vec2)
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

    // TexCoord (vec2)
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 8);

    // Color (vec4)
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);

    // Setup index buffer (static, quad indices)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    const indices = new Uint16Array(MAX_SPRITES * INDICES_PER_SPRITE);
    for (let i = 0; i < MAX_SPRITES; i++) {
      const offset = i * INDICES_PER_SPRITE;
      const vertex = i * VERTICES_PER_SPRITE;
      // Two triangles per quad
      indices[offset + 0] = vertex + 0;
      indices[offset + 1] = vertex + 1;
      indices[offset + 2] = vertex + 2;
      indices[offset + 3] = vertex + 2;
      indices[offset + 4] = vertex + 3;
      indices[offset + 5] = vertex + 0;
    }
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
  }

  /**
   * Set the projection matrix for rendering
   */
  setProjectionMatrix(matrix: Float32Array): void {
    this._projectionMatrix = matrix;
  }

  /**
   * Set global tint applied to all sprites (useful for dark mode)
   */
  setGlobalTint(tint: Color): void {
    this._globalTint = tint;
  }

  /**
   * Get current global tint
   */
  getGlobalTint(): Color {
    return { ...this._globalTint };
  }

  /**
   * Begin a new batch
   */
  begin(): void {
    if (this._drawing) {
      throw new Error('SpriteBatch.begin() called while already drawing');
    }
    this._drawing = true;
    this._spriteCount = 0;
    this._currentTexture = null;
  }

  /**
   * Draw a sprite
   */
  draw(
    sprite: Sprite,
    x: number,
    y: number,
    width?: number,
    height?: number,
    _rotation: number = 0,
    tint: Color = { r: 1, g: 1, b: 1, a: 1 }
  ): void {
    if (!this._drawing) {
      throw new Error('SpriteBatch.draw() called without begin()');
    }

    // Flush if texture changes or batch is full
    if (this._currentTexture !== sprite.texture || this._spriteCount >= MAX_SPRITES) {
      this._flush();
      this._currentTexture = sprite.texture;
    }

    const w = width ?? sprite.width;
    const h = height ?? sprite.height;

    // TODO: Apply rotation (for now, skip rotation)
    // For rotated sprites, we'd transform each vertex position

    // Calculate vertex positions (unrotated for now)
    const x1 = x;
    const y1 = y;
    const x2 = x + w;
    const y2 = y + h;

    // Texture coordinates
    const u0 = sprite.u0;
    const v0 = sprite.v0;
    const u1 = sprite.u1;
    const v1 = sprite.v1;

    // Color - apply global tint
    const r = tint.r * this._globalTint.r;
    const g = tint.g * this._globalTint.g;
    const b = tint.b * this._globalTint.b;
    const a = tint.a * this._globalTint.a;

    // Write vertex data
    const idx = this._spriteCount * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX;

    // Top-left
    this._vertices[idx + 0] = x1;
    this._vertices[idx + 1] = y1;
    this._vertices[idx + 2] = u0;
    this._vertices[idx + 3] = v0;
    this._vertices[idx + 4] = r;
    this._vertices[idx + 5] = g;
    this._vertices[idx + 6] = b;
    this._vertices[idx + 7] = a;

    // Top-right
    this._vertices[idx + 8] = x2;
    this._vertices[idx + 9] = y1;
    this._vertices[idx + 10] = u1;
    this._vertices[idx + 11] = v0;
    this._vertices[idx + 12] = r;
    this._vertices[idx + 13] = g;
    this._vertices[idx + 14] = b;
    this._vertices[idx + 15] = a;

    // Bottom-right
    this._vertices[idx + 16] = x2;
    this._vertices[idx + 17] = y2;
    this._vertices[idx + 18] = u1;
    this._vertices[idx + 19] = v1;
    this._vertices[idx + 20] = r;
    this._vertices[idx + 21] = g;
    this._vertices[idx + 22] = b;
    this._vertices[idx + 23] = a;

    // Bottom-left
    this._vertices[idx + 24] = x1;
    this._vertices[idx + 25] = y2;
    this._vertices[idx + 26] = u0;
    this._vertices[idx + 27] = v1;
    this._vertices[idx + 28] = r;
    this._vertices[idx + 29] = g;
    this._vertices[idx + 30] = b;
    this._vertices[idx + 31] = a;

    this._spriteCount++;
  }

  /**
   * Draw a colored rectangle (no texture)
   */
  drawRect(x: number, y: number, width: number, height: number, color: Color): void {
    // Create a temporary sprite using the white texture
    const sprite: Sprite = {
      texture: this._whiteTexture,
      width,
      height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };
    this.draw(sprite, x, y, width, height, 0, color);
  }

  /**
   * End the batch and flush to GPU
   */
  end(): void {
    if (!this._drawing) {
      throw new Error('SpriteBatch.end() called without begin()');
    }
    this._flush();
    this._drawing = false;
  }

  /**
   * Flush current batch to GPU
   */
  private _flush(): void {
    if (this._spriteCount === 0) return;

    const gl = this._gl;

    // Use shader program
    this._shader.use();
    this._shader.setUniformMatrix4fv('u_projection', this._projectionMatrix);
    this._shader.setUniform1i('u_texture', 0);
    this._shader.setUniform1f('u_useTexture', this._currentTexture ? 1.0 : 0.0);

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._currentTexture ?? this._whiteTexture);

    // Upload vertex data
    gl.bindVertexArray(this._vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
    
    // Only upload the portion we're using
    const dataSize = this._spriteCount * VERTICES_PER_SPRITE * FLOATS_PER_VERTEX;
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices.subarray(0, dataSize));

    // Draw
    const indexCount = this._spriteCount * INDICES_PER_SPRITE;
    gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);

    gl.bindVertexArray(null);

    // Reset for next batch
    this._spriteCount = 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    const gl = this._gl;
    gl.deleteBuffer(this._vertexBuffer);
    gl.deleteBuffer(this._indexBuffer);
    gl.deleteVertexArray(this._vao);
    gl.deleteTexture(this._whiteTexture);
    this._shader.dispose();
  }
}




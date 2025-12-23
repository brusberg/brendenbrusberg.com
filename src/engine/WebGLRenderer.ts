/**
 * WebGLRenderer - Core WebGL 2.0 context management
 * Handles canvas setup, viewport, and basic rendering operations
 */

import type { Color } from '@/types';

export class WebGLRenderer {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _gl: WebGL2RenderingContext;
  private _width: number = 0;
  private _height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    
    // Request WebGL 2.0 context
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error('WebGL 2.0 is not supported by your browser');
    }

    this._gl = gl;
    this._setupGL();
    this._setupResizeHandler();
    this._resize();
  }

  /**
   * Get the WebGL 2.0 rendering context
   */
  get gl(): WebGL2RenderingContext {
    return this._gl;
  }

  /**
   * Get canvas width in pixels
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get canvas height in pixels
   */
  get height(): number {
    return this._height;
  }

  /**
   * Get the aspect ratio (width / height)
   */
  get aspectRatio(): number {
    return this._width / this._height;
  }

  /**
   * Initial WebGL state setup
   */
  private _setupGL(): void {
    const gl = this._gl;

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Disable depth testing (2D rendering)
    gl.disable(gl.DEPTH_TEST);

    // Disable face culling (we might have flipped sprites)
    gl.disable(gl.CULL_FACE);
  }

  /**
   * Setup window resize handler
   */
  private _setupResizeHandler(): void {
    window.addEventListener('resize', () => this._resize());
  }

  /**
   * Handle canvas resize to match window
   */
  private _resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = Math.floor(this._canvas.clientWidth * dpr);
    const displayHeight = Math.floor(this._canvas.clientHeight * dpr);

    if (this._canvas.width !== displayWidth || this._canvas.height !== displayHeight) {
      this._canvas.width = displayWidth;
      this._canvas.height = displayHeight;
      this._width = displayWidth;
      this._height = displayHeight;
      this._gl.viewport(0, 0, displayWidth, displayHeight);
    }
  }

  /**
   * Clear the canvas with a solid color
   */
  clear(color: Color = { r: 0.1, g: 0.1, b: 0.18, a: 1 }): void {
    this._gl.clearColor(color.r, color.g, color.b, color.a);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);
  }

  /**
   * Create an orthographic projection matrix for 2D rendering
   * Origin at top-left, Y increases downward (screen coordinates)
   */
  createProjectionMatrix(): Float32Array {
    const left = 0;
    const right = this._width;
    const bottom = this._height;
    const top = 0;
    const near = -1;
    const far = 1;

    // Orthographic projection matrix (column-major order for WebGL)
    return new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -2 / (far - near), 0,
      -(right + left) / (right - left), -(top + bottom) / (top - bottom), -(far + near) / (far - near), 1,
    ]);
  }

  /**
   * Force a viewport update (call after major resize events)
   */
  updateViewport(): void {
    this._resize();
  }

  /**
   * Cleanup WebGL resources
   */
  dispose(): void {
    // Remove resize listener would require storing the handler reference
    // For now, this is a minimal cleanup
    const gl = this._gl;
    const loseContext = gl.getExtension('WEBGL_lose_context');
    if (loseContext) {
      loseContext.loseContext();
    }
  }
}




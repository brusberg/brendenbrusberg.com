/**
 * ShaderProgram - Manages WebGL shader compilation and linking
 */

export class ShaderProgram {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _program: WebGLProgram;
  private readonly _uniforms: Map<string, WebGLUniformLocation> = new Map();
  private readonly _attributes: Map<string, number> = new Map();

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this._gl = gl;

    // Compile shaders
    const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    // Create and link program
    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create shader program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${log}`);
    }

    // Clean up individual shaders (they're linked into the program now)
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this._program = program;
    this._cacheLocations();
  }

  /**
   * Compile a single shader
   */
  private _compileShader(type: number, source: string): WebGLShader {
    const gl = this._gl;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error(`Failed to create shader of type ${type}`);
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      const shaderType = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
      throw new Error(`${shaderType} shader compilation failed: ${log}`);
    }

    return shader;
  }

  /**
   * Cache all uniform and attribute locations for fast access
   */
  private _cacheLocations(): void {
    const gl = this._gl;
    const program = this._program;

    // Cache uniforms
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        const location = gl.getUniformLocation(program, info.name);
        if (location) {
          this._uniforms.set(info.name, location);
        }
      }
    }

    // Cache attributes
    const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
    for (let i = 0; i < attributeCount; i++) {
      const info = gl.getActiveAttrib(program, i);
      if (info) {
        const location = gl.getAttribLocation(program, info.name);
        if (location >= 0) {
          this._attributes.set(info.name, location);
        }
      }
    }
  }

  /**
   * Use this shader program for rendering
   */
  use(): void {
    this._gl.useProgram(this._program);
  }

  /**
   * Get a uniform location by name
   */
  getUniformLocation(name: string): WebGLUniformLocation | null {
    return this._uniforms.get(name) ?? null;
  }

  /**
   * Get an attribute location by name
   */
  getAttributeLocation(name: string): number {
    return this._attributes.get(name) ?? -1;
  }

  /**
   * Set a mat4 uniform
   */
  setUniformMatrix4fv(name: string, value: Float32Array): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniformMatrix4fv(location, false, value);
    }
  }

  /**
   * Set a vec4 uniform
   */
  setUniform4f(name: string, x: number, y: number, z: number, w: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform4f(location, x, y, z, w);
    }
  }

  /**
   * Set an int uniform (for texture samplers)
   */
  setUniform1i(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform1i(location, value);
    }
  }

  /**
   * Set a float uniform
   */
  setUniform1f(name: string, value: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform1f(location, value);
    }
  }

  /**
   * Set a vec2 uniform
   */
  setUniform2f(name: string, x: number, y: number): void {
    const location = this.getUniformLocation(name);
    if (location) {
      this._gl.uniform2f(location, x, y);
    }
  }

  /**
   * Clean up shader program
   */
  dispose(): void {
    this._gl.deleteProgram(this._program);
    this._uniforms.clear();
    this._attributes.clear();
  }
}




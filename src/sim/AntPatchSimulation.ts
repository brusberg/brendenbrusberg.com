import {
  AntModel,
  FIELD_SIZE,
  FRAME_STEP,
  GRID_HEIGHT,
  GRID_WIDTH,
  MAX_DELTA,
  NEST_ENTRANCE,
  SURFACE_ROWS,
  type AntPatchSnapshot,
  type TaskAllocation,
} from './AntModel';

export type { AntPatchSnapshot } from './AntModel';

interface AntPatchOptions {
  reducedMotion: boolean;
}

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision mediump float;

uniform sampler2D u_scene;
uniform vec2 u_worldSize;
uniform vec2 u_cameraOrigin;
uniform vec2 u_cameraSize;
in vec2 v_uv;
out vec4 out_color;

void main() {
  vec2 cameraUv = vec2(v_uv.x, 1.0 - v_uv.y);
  vec2 uv = (u_cameraOrigin + cameraUv * u_cameraSize) / u_worldSize;
  out_color = texture(u_scene, uv);
}
`;

export class AntPatchSimulation {
  private readonly canvas: HTMLCanvasElement;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly texture: WebGLTexture;
  private readonly vertexArray: WebGLVertexArrayObject;
  private readonly model = new AntModel();
  private readonly scene = new Uint8Array(FIELD_SIZE * 4);
  private readonly noise = new Uint8Array(FIELD_SIZE);

  private frameId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private snapshotPublishTimer = 0;
  private reducedMotion: boolean;
  private worldSizeLocation: WebGLUniformLocation | null = null;
  private cameraOriginLocation: WebGLUniformLocation | null = null;
  private cameraSizeLocation: WebGLUniformLocation | null = null;
  private cameraCenterX = NEST_ENTRANCE.x;
  private cameraCenterY = GRID_HEIGHT * 0.52;
  private cameraViewWidth = GRID_WIDTH;
  private cameraViewHeight = GRID_HEIGHT;
  private activePointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private readonly pressedPanKeys = new Set<string>();
  private resizeObserver: ResizeObserver;
  private readonly snapshotElement: HTMLScriptElement;

  constructor(canvas: HTMLCanvasElement, options: AntPatchOptions) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      throw new Error('WebGL 2 unavailable');
    }

    this.canvas = canvas;
    this.gl = gl;
    this.reducedMotion = options.reducedMotion;
    this.program = this.createProgram();
    this.texture = this.createTexture();
    this.vertexArray = this.createVertexArray();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.snapshotElement = this.createSnapshotElement();

    this.seedNoise();
    this.resizeObserver.observe(canvas);
    window.addEventListener('resize', this.handleViewportResize);
    window.visualViewport?.addEventListener('resize', this.handleViewportResize);
    this.addCameraInputListeners();
    this.resize();
    this.publishSnapshot();
    this.draw();
  }

  start(): void {
    if (this.frameId !== 0) {
      return;
    }

    this.lastTime = performance.now();
    this.frameId = window.requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frameId === 0) {
      return;
    }

    window.cancelAnimationFrame(this.frameId);
    this.frameId = 0;
  }

  dispose(): void {
    this.stop();
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.handleViewportResize);
    window.visualViewport?.removeEventListener('resize', this.handleViewportResize);
    this.removeCameraInputListeners();
    this.gl.deleteTexture(this.texture);
    this.gl.deleteVertexArray(this.vertexArray);
    this.gl.deleteProgram(this.program);
    this.snapshotElement.remove();
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
  }

  snapshot(): AntPatchSnapshot {
    return this.model.snapshot();
  }

  setTaskAllocation(allocation: Partial<TaskAllocation>): void {
    this.model.setTaskAllocation(allocation);
    this.publishSnapshot();
  }

  private createSnapshotElement(): HTMLScriptElement {
    const existing = document.getElementById('ant-sim-snapshot');

    if (existing instanceof HTMLScriptElement) {
      existing.remove();
    }

    const element = document.createElement('script');
    element.id = 'ant-sim-snapshot';
    element.type = 'application/json';
    element.hidden = true;
    document.body.append(element);
    return element;
  }

  private publishSnapshot(): void {
    this.snapshotElement.textContent = JSON.stringify(this.snapshot());
  }

  private readonly tick = (time: number): void => {
    const delta = Math.min((time - this.lastTime) / 1000, MAX_DELTA);
    this.lastTime = time;

    if (this.reducedMotion) {
      this.update(FRAME_STEP * 0.2);
    } else {
      this.accumulator += delta;

      while (this.accumulator >= FRAME_STEP) {
        this.update(FRAME_STEP);
        this.accumulator -= FRAME_STEP;
      }
    }

    this.draw();
    this.frameId = window.requestAnimationFrame(this.tick);
  };

  private seedNoise(): void {
    let seed = 0x8f2d3a4b;

    for (let index = 0; index < FIELD_SIZE; index += 1) {
      seed = (seed + 0x6d2b79f5) | 0;
      let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
      this.noise[index] = ((value ^ (value >>> 14)) >>> 0) & 255;
    }
  }

  private update(delta: number): void {
    this.model.update(delta);
    this.snapshotPublishTimer += delta;

    if (this.snapshotPublishTimer >= 0.25) {
      this.snapshotPublishTimer = 0;
      this.publishSnapshot();
    }
  }

  private draw(): void {
    this.paintCells();
    this.paintFood();
    this.paintStorage();
    this.paintQueenAndLarvae();
    this.paintAnts();
    this.uploadScene();
    this.renderTexture();
  }

  private paintCells(): void {
    for (const cell of this.model.cells) {
      const index = this.model.index(cell.x, cell.y);
      const noise = this.noise[index] ?? 0;

      if (cell.zone === 'outside') {
        this.setPixel(index, 33 + noise * 0.04, 48 + noise * 0.075, 37 + noise * 0.04);
      } else if (cell.terrain === 'tunnel') {
        this.setPixel(index, 65 + noise * 0.025, 53 + noise * 0.025, 42 + noise * 0.018);
      } else {
        const depth = (cell.y - SURFACE_ROWS) / (GRID_HEIGHT - SURFACE_ROWS);
        this.setPixel(index, 29 + depth * 16 + noise * 0.022, 28 + depth * 9 + noise * 0.018, 29 + depth * 7 + noise * 0.014);
      }

      if (cell.digProgress > 0) {
        this.mixPixel(index, 145, 112, 72, Math.min(0.62, 0.22 + cell.digProgress * 0.55));
      }

      if (cell.pheromoneFood > 0.02) {
        this.mixPixel(index, 116, 188, 128, Math.min(0.45, cell.pheromoneFood * 0.42));
      }

      if (cell.pheromoneHome > 0.08) {
        this.mixPixel(index, 224, 198, 118, Math.min(0.16, cell.pheromoneHome * 0.12));
      }

      if (cell.y === SURFACE_ROWS - 1 || cell.y === SURFACE_ROWS) {
        this.mixPixel(index, 106, 89, 58, 0.34);
      }
    }
  }

  private paintFood(): void {
    for (const food of this.model.food) {
      const radius = 1 + Math.sqrt(food.amount) * 0.48;
      const palette = this.foodPalette(food.kind);
      this.paintDisc(food.x + 0.4, food.y + 0.6, radius + 0.9, [14, 20, 14], 0.18);

      for (let morsel = 0; morsel < food.amount; morsel += 1) {
        const angle = food.id * 1.731 + morsel * 2.211;
        const spread = radius * (0.18 + ((food.id + morsel * 3) % 7) * 0.085);
        const tint = ((food.id * 13 + morsel * 17) % 23) - 11;
        this.paintDisc(
          food.x + Math.cos(angle) * spread,
          food.y + Math.sin(angle * 1.17) * spread * 0.82,
          0.55 + (morsel % 3) * 0.12,
          [palette[0] + tint, palette[1] + tint * 0.7, palette[2] + tint * 0.35],
          0.8,
        );
      }
    }
  }

  private paintStorage(): void {
    this.paintDisc(NEST_ENTRANCE.x, NEST_ENTRANCE.y, 3.5, [20, 18, 15], 0.8);

    for (const site of this.model.storageSites) {
      const fullness = site.stored / site.capacity;
      this.paintDisc(site.x, site.y, 1.8 + fullness * 1.5, [19, 16, 13], 0.18 + fullness * 0.18);
    }

    for (const pellet of this.model.storedFoodPellets) {
      const palette = this.foodPalette(pellet.kind);
      this.paintDisc(
        pellet.x,
        pellet.y,
        0.58,
        palette,
        0.78,
      );
    }
  }

  private paintQueenAndLarvae(): void {
    for (const larva of this.model.larvae) {
      const hungerTint = Math.round(larva.hunger * 26);
      const growthGlow = Math.min(22, larva.fedProgress * 7);
      this.paintDisc(larva.x, larva.y, 0.85, [216 + hungerTint, 204 + growthGlow - hungerTint * 0.25, 150 - hungerTint * 0.4], 0.82);
    }

    const queen = this.model.queen;
    const forward = { x: Math.cos(queen.heading), y: Math.sin(queen.heading) };
    const side = { x: -forward.y, y: forward.x };
    const pixel = (forwardOffset: number, sideOffset: number, color: [number, number, number], alpha: number): void => {
      const x = Math.round(queen.x + forward.x * forwardOffset + side.x * sideOffset);
      const y = Math.round(queen.y + forward.y * forwardOffset + side.y * sideOffset);
      this.paintRect(x, y, 1, 1, color, alpha);
    };

    pixel(-1.45, 0, [6, 7, 5], 0.98);
    pixel(-0.55, 0, [12, 13, 9], 0.98);
    pixel(0.25, 0, [6, 7, 5], 0.98);
    pixel(-0.45, -0.9, [6, 7, 5], 0.9);
    pixel(-0.45, 0.9, [6, 7, 5], 0.9);
    pixel(1.18, 0, queen.hunger > 0.58 ? [235, 191, 76] : [214, 174, 63], 0.96);
  }

  private paintAnts(): void {
    for (const ant of this.model.ants) {
      const taskMarker: [number, number, number] | null = ant.task === 'dig' ? [104, 151, 164] : ant.task === 'nurse' ? [154, 126, 178] : null;
      const x = Math.round(ant.x);
      const y = Math.round(ant.y);

      if (taskMarker && !ant.carryingFood) {
        this.paintDisc(x, y, 1.4, taskMarker, 0.22);
      }

      if (ant.origin === 'hatched' && ant.age < 45) {
        this.paintDisc(x, y, 1.25, [211, 189, 122], 0.16);
      }

      this.paintRect(x - 1, y, 2, 1, [18, 20, 16], 0.96);
      this.paintRect(x + Math.round(Math.cos(ant.heading)), y + Math.round(Math.sin(ant.heading)), 1, 1, [7, 8, 6], 0.9);

      if (ant.carryingFood) {
        this.paintRect(x, y - 1, 1, 1, this.foodPalette(ant.carriedFoodKind ?? 'crumb'), 0.95);
      } else if (ant.carryingCareFood) {
        this.paintRect(x, y - 1, 1, 1, [230, 209, 147], 0.95);
      }
    }
  }

  private foodPalette(kind: 'crumb' | 'seed' | 'leaf'): [number, number, number] {
    return kind === 'crumb' ? [205, 177, 101] : kind === 'seed' ? [132, 151, 82] : [82, 130, 75];
  }

  private uploadScene(): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRID_WIDTH, GRID_HEIGHT, gl.RGBA, gl.UNSIGNED_BYTE, this.scene);
  }

  private renderTexture(): void {
    const gl = this.gl;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.useProgram(this.program);
    this.setCameraUniforms();
    gl.bindVertexArray(this.vertexArray);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    this.gl.useProgram(this.program);
    this.updateCameraWindow();
    this.setCameraUniforms();
  }

  private addCameraInputListeners(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerEnd);
    this.canvas.addEventListener('pointercancel', this.handlePointerEnd);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('blur', this.handleBlur);
  }

  private removeCameraInputListeners(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('blur', this.handleBlur);
  }

  private readonly handleViewportResize = (): void => {
    this.resize();
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.activePointerId = event.pointerId;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus({ preventScroll: true });
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const deltaX = event.clientX - this.lastPointerX;
    const deltaY = event.clientY - this.lastPointerY;
    this.lastPointerX = event.clientX;
    this.lastPointerY = event.clientY;
    this.panCamera((-deltaX / Math.max(1, rect.width)) * this.cameraViewWidth, (-deltaY / Math.max(1, rect.height)) * this.cameraViewHeight);
  };

  private readonly handlePointerEnd = (event: PointerEvent): void => {
    if (this.activePointerId !== event.pointerId) {
      return;
    }

    this.activePointerId = null;
    this.canvas.releasePointerCapture(event.pointerId);
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const deltaX = (event.deltaX / Math.max(1, rect.width)) * this.cameraViewWidth;
    const deltaY = (event.deltaY / Math.max(1, rect.height)) * this.cameraViewHeight;
    this.panCamera(deltaX, deltaY);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.panKeyDirection(event.key)) {
      return;
    }

    this.pressedPanKeys.add(event.key.toLowerCase());
    this.panFromPressedKeys(event.shiftKey ? 9 : 4);
    event.preventDefault();
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.panKeyDirection(event.key)) {
      return;
    }

    this.pressedPanKeys.delete(event.key.toLowerCase());
    event.preventDefault();
  };

  private readonly handleBlur = (): void => {
    this.pressedPanKeys.clear();
  };

  private panCamera(deltaX: number, deltaY: number): void {
    this.cameraCenterX += deltaX;
    this.cameraCenterY += deltaY;
    this.clampCamera();
    this.setCameraUniforms();
  }

  private panFromPressedKeys(step: number): void {
    let deltaX = 0;
    let deltaY = 0;

    for (const key of this.pressedPanKeys) {
      const direction = this.panKeyDirection(key);

      if (direction) {
        deltaX += direction.x;
        deltaY += direction.y;
      }
    }

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    const length = Math.hypot(deltaX, deltaY);
    this.panCamera((deltaX / length) * step, (deltaY / length) * step);
  }

  private panKeyDirection(key: string): { x: number; y: number } | null {
    const normalized = key.toLowerCase();

    if (normalized === 'arrowleft' || normalized === 'a') {
      return { x: -1, y: 0 };
    }

    if (normalized === 'arrowright' || normalized === 'd') {
      return { x: 1, y: 0 };
    }

    if (normalized === 'arrowup' || normalized === 'w') {
      return { x: 0, y: -1 };
    }

    if (normalized === 'arrowdown' || normalized === 's') {
      return { x: 0, y: 1 };
    }

    return null;
  }

  private updateCameraWindow(): void {
    const canvasWidth = this.canvas.clientWidth;
    const canvasHeight = Math.max(1, this.canvas.clientHeight);
    const aspect = canvasWidth / canvasHeight;
    const worldAspect = GRID_WIDTH / GRID_HEIGHT;
    const narrowness = Math.max(0, Math.min(1, (760 - Math.min(canvasWidth, canvasHeight)) / 420));
    const portraitness = Math.max(0, Math.min(1, (worldAspect - aspect) / worldAspect));
    const verticalPanReserve = Math.min(0.14, portraitness * 0.45 + narrowness * 0.04);
    const zoom = 1 - narrowness * 0.02;
    let fitWidth: number;
    let fitHeight: number;

    if (aspect < worldAspect) {
      fitHeight = GRID_HEIGHT * (1 - verticalPanReserve);
      fitWidth = fitHeight * aspect;
    } else {
      fitWidth = GRID_WIDTH;
      fitHeight = GRID_WIDTH / aspect;
    }

    this.cameraViewWidth = Math.min(GRID_WIDTH, Math.max(34, fitWidth * zoom));
    this.cameraViewHeight = Math.min(GRID_HEIGHT, Math.max(34, fitHeight * zoom));
    this.clampCamera();
  }

  private clampCamera(): void {
    const halfWidth = this.cameraViewWidth * 0.5;
    const halfHeight = this.cameraViewHeight * 0.5;
    this.cameraCenterX = Math.max(halfWidth, Math.min(GRID_WIDTH - halfWidth, this.cameraCenterX));
    this.cameraCenterY = Math.max(halfHeight, Math.min(GRID_HEIGHT - halfHeight, this.cameraCenterY));
  }

  private setCameraUniforms(): void {
    this.gl.uniform2f(this.worldSizeLocation, GRID_WIDTH, GRID_HEIGHT);
    this.gl.uniform2f(
      this.cameraOriginLocation,
      this.cameraCenterX - this.cameraViewWidth * 0.5,
      this.cameraCenterY - this.cameraViewHeight * 0.5,
    );
    this.gl.uniform2f(this.cameraSizeLocation, this.cameraViewWidth, this.cameraViewHeight);
  }

  private createProgram(): WebGLProgram {
    const gl = this.gl;
    const vertexShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();

    if (!program) {
      throw new Error('Unable to create WebGL program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const message = gl.getProgramInfoLog(program) ?? 'Unknown shader link error';
      gl.deleteProgram(program);
      throw new Error(message);
    }

    const sceneLocation = gl.getUniformLocation(program, 'u_scene');
    this.worldSizeLocation = gl.getUniformLocation(program, 'u_worldSize');
    this.cameraOriginLocation = gl.getUniformLocation(program, 'u_cameraOrigin');
    this.cameraSizeLocation = gl.getUniformLocation(program, 'u_cameraSize');
    gl.useProgram(program);
    gl.uniform1i(sceneLocation, 0);
    gl.uniform2f(this.worldSizeLocation, GRID_WIDTH, GRID_HEIGHT);
    gl.uniform2f(this.cameraOriginLocation, 0, 0);
    gl.uniform2f(this.cameraSizeLocation, GRID_WIDTH, GRID_HEIGHT);

    return program;
  }

  private createShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type);

    if (!shader) {
      throw new Error('Unable to create WebGL shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(shader) ?? 'Unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(message);
    }

    return shader;
  }

  private createTexture(): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();

    if (!texture) {
      throw new Error('Unable to create WebGL texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID_WIDTH, GRID_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.scene);

    return texture;
  }

  private createVertexArray(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vertexArray = gl.createVertexArray();
    const vertexBuffer = gl.createBuffer();
    const positionLocation = gl.getAttribLocation(this.program, 'a_position');

    if (!vertexArray || !vertexBuffer || positionLocation < 0) {
      throw new Error('Unable to create WebGL geometry');
    }

    gl.bindVertexArray(vertexArray);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return vertexArray;
  }

  private setPixel(index: number, r: number, g: number, b: number): void {
    const offset = index * 4;
    this.scene[offset] = this.byte(r);
    this.scene[offset + 1] = this.byte(g);
    this.scene[offset + 2] = this.byte(b);
    this.scene[offset + 3] = 255;
  }

  private mixPixel(index: number, r: number, g: number, b: number, alpha: number): void {
    const offset = index * 4;
    const inverse = 1 - alpha;
    this.scene[offset] = this.byte((this.scene[offset] ?? 0) * inverse + r * alpha);
    this.scene[offset + 1] = this.byte((this.scene[offset + 1] ?? 0) * inverse + g * alpha);
    this.scene[offset + 2] = this.byte((this.scene[offset + 2] ?? 0) * inverse + b * alpha);
  }

  private paintDisc(x: number, y: number, radius: number, color: [number, number, number], alpha: number): void {
    const minX = Math.max(0, Math.floor(x - radius));
    const maxX = Math.min(GRID_WIDTH - 1, Math.ceil(x + radius));
    const minY = Math.max(0, Math.floor(y - radius));
    const maxY = Math.min(GRID_HEIGHT - 1, Math.ceil(y + radius));
    const radiusSquared = radius * radius;

    for (let py = minY; py <= maxY; py += 1) {
      for (let px = minX; px <= maxX; px += 1) {
        const distanceSquared = (px - x) ** 2 + (py - y) ** 2;

        if (distanceSquared <= radiusSquared) {
          const fade = 1 - distanceSquared / radiusSquared;
          this.mixPixel(this.model.index(px, py), color[0], color[1], color[2], alpha * (0.4 + fade * 0.6));
        }
      }
    }
  }

  private paintRect(x: number, y: number, width: number, height: number, color: [number, number, number], alpha: number): void {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        if (px >= 0 && py >= 0 && px < GRID_WIDTH && py < GRID_HEIGHT) {
          this.mixPixel(this.model.index(px, py), color[0], color[1], color[2], alpha);
        }
      }
    }
  }

  private byte(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }
}

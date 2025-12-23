# WebGL Stick Figure Project - Complete Learning Guide

This tutorial explains every file in the project, in a logical learning order, with code snippets and explanations of how everything works together.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Configuration Files](#2-configuration-files)
3. [Entry Points](#3-entry-points)
4. [Type Definitions](#4-type-definitions)
5. [WebGL Engine Layer](#5-webgl-engine-layer)
6. [Input System](#6-input-system)
7. [Game Logic Layer](#7-game-logic-layer)
8. [How It All Connects](#8-how-it-all-connects)
9. [Learning Resources](#9-learning-resources)

---

## 1. Project Overview

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html                              │
│                    (Canvas Element)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       main.ts                                │
│              (Application Entry Point)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Game.ts                                │
│           (Game Loop - Update & Render Cycle)                │
└───────┬─────────────────┼─────────────────┬─────────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ InputManager  │ │   Character   │ │ Interactable  │
│ (Keyboard +   │ │ (Player with  │ │ (Clickable    │
│  Touch)       │ │  Animation)   │ │  Objects)     │
└───────────────┘ └───────┬───────┘ └───────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     SpriteBatch                              │
│              (Batches Draw Calls)                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    WebGLRenderer                             │
│            (Raw WebGL 2.0 Context)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   ShaderProgram                              │
│            (Vertex + Fragment Shaders)                       │
└─────────────────────────────────────────────────────────────┘
```

### File Organization

```
website/
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Build tool configuration
├── index.html            # HTML entry point with canvas
│
├── src/
│   ├── main.ts           # Application bootstrap
│   ├── vite-env.d.ts     # Vite type declarations
│   │
│   ├── types/
│   │   └── index.ts      # All TypeScript interfaces
│   │
│   ├── engine/           # WebGL rendering layer
│   │   ├── WebGLRenderer.ts
│   │   ├── ShaderProgram.ts
│   │   ├── SpriteBatch.ts
│   │   └── TextureLoader.ts
│   │
│   ├── shaders/          # GLSL shader code
│   │   ├── sprite.vert
│   │   └── sprite.frag
│   │
│   ├── input/            # User input handling
│   │   ├── InputManager.ts
│   │   ├── KeyboardInput.ts
│   │   └── TouchInput.ts
│   │
│   └── game/             # Game logic
│       ├── Game.ts
│       ├── Character.ts
│       ├── Background.ts
│       └── Interactable.ts
│
└── public/
    └── assets/           # Static assets (sprites, etc.)
```

---

## 2. Configuration Files

These files configure the development environment. You typically set them up once.

### 2.1 `package.json` - Project Manifest

This file tells Node.js what packages to install and what scripts to run.

```json
{
  "name": "webgl-stick-figure",
  "version": "0.1.0",
  "type": "module",           // Use ES modules (import/export)
  "scripts": {
    "dev": "vite",            // Start development server
    "build": "tsc && vite build",  // Compile & bundle for production
    "preview": "vite preview" // Preview production build
  },
  "devDependencies": {
    "typescript": "^5.3.3",   // TypeScript compiler
    "vite": "^5.0.10"         // Build tool & dev server
  }
}
```

**Key Concepts:**
- `"type": "module"` enables modern ES6 imports
- `devDependencies` are only needed during development, not in production

**Learn More:**
- [npm package.json documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json)

---

### 2.2 `tsconfig.json` - TypeScript Configuration

Controls how TypeScript compiles your code.

```json
{
  "compilerOptions": {
    "target": "ES2020",       // Output modern JavaScript
    "strict": true,           // Enable all strict type checks
    "noUnusedLocals": true,   // Error on unused variables
    "noUncheckedIndexedAccess": true,  // Array access returns T | undefined
    
    // Path aliases for cleaner imports
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]        // @/game/Game → src/game/Game
    }
  }
}
```

**Key Concept - Strict Mode:**

Strict mode catches many common bugs at compile time:

```typescript
// Without strict mode - this compiles but crashes at runtime
function greet(name: string) {
  console.log(name.toUpperCase());
}
greet(undefined); // Runtime error!

// With strict mode - TypeScript catches this
greet(undefined); // Compile error: Argument of type 'undefined' is not assignable
```

**Learn More:**
- [TypeScript tsconfig reference](https://www.typescriptlang.org/tsconfig)
- [TypeScript strict mode explained](https://www.typescriptlang.org/tsconfig#strict)

---

### 2.3 `vite.config.ts` - Vite Build Configuration

```typescript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/',  // Base URL for deployed site
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),  // Enable @/ imports
    },
  },
  
  server: {
    port: 3000,  // Development server port
    open: true,  // Auto-open browser
  },
  
  // Treat shader files as raw text (not processed)
  assetsInclude: ['**/*.vert', '**/*.frag'],
});
```

**Why Vite?**
- Instant server start (no bundling during dev)
- Hot Module Replacement (changes appear without refresh)
- Optimized production builds
- Native TypeScript support

**Learn More:**
- [Vite Official Guide](https://vitejs.dev/guide/)
- [Vite Configuration Reference](https://vitejs.dev/config/)

---

## 3. Entry Points

### 3.1 `index.html` - The HTML Shell

The single HTML file that hosts the entire application.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Stick Figure World</title>
  <style>
    /* Reset default browser styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* Full-screen canvas */
    html, body { width: 100%; height: 100%; overflow: hidden; }
    #game-canvas { display: block; width: 100%; height: 100%; }
    
    /* Disable touch scrolling on mobile */
    body { touch-action: none; }
  </style>
</head>
<body>
  <!-- Loading screen (hidden when game starts) -->
  <div id="loading">
    <div class="loader"></div>
    <p>Loading...</p>
  </div>
  
  <!-- Error screen (shown if WebGL fails) -->
  <div id="error-message">
    <h1>WebGL 2.0 Not Supported</h1>
  </div>
  
  <!-- The canvas where WebGL renders -->
  <canvas id="game-canvas"></canvas>
  
  <!-- Load TypeScript (Vite compiles it automatically) -->
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

**Key Concepts:**
- `touch-action: none` prevents mobile browser gestures
- `type="module"` enables ES6 imports in the script
- Canvas is the only HTML element WebGL renders to

---

### 3.2 `src/main.ts` - Application Bootstrap

The TypeScript entry point that initializes everything.

```typescript
import { Game } from '@/game/Game';

let game: Game | null = null;

function init(): void {
  // Get the canvas element from HTML
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  
  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // Create and start the game
    game = new Game(canvas);
    game.start();
  } catch (error) {
    // Show error message if WebGL fails
    console.error('Failed to initialize game:', error);
    document.getElementById('error-message')?.classList.add('visible');
  }
}

// Initialize when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();  // DOM already loaded
}

// Pause game when tab is hidden (saves battery/CPU)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game?.stop();
  } else {
    game?.start();
  }
});
```

**Key Pattern - Null Safety:**

```typescript
// The `as` keyword is a type assertion
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

// We check for null before using it
if (!canvas) return;

// Now TypeScript knows canvas is definitely HTMLCanvasElement
canvas.width = 800;  // Safe!
```

---

## 4. Type Definitions

### 4.1 `src/types/index.ts` - Shared Interfaces

TypeScript interfaces define the "shape" of data. They're like contracts.

```typescript
// A 2D point or direction
export interface Vector2 {
  x: number;
  y: number;
}

// A rectangle (position + size)
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// RGBA color (values 0-1, not 0-255)
export interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

// A texture with UV coordinates for sprite sheets
export interface Sprite {
  readonly texture: WebGLTexture;  // GPU texture reference
  readonly width: number;
  readonly height: number;
  readonly u0: number;  // Texture coordinate left
  readonly v0: number;  // Texture coordinate top
  readonly u1: number;  // Texture coordinate right
  readonly v1: number;  // Texture coordinate bottom
}

// The 8 cardinal directions
export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

// Animation states
export type AnimationState = 'idle' | 'walk';

// Event types for interactable objects
export type InteractEvent = 
  | { type: 'visual'; effect: string }
  | { type: 'dialog'; text: string }
  | { type: 'link'; url: string }
  | { type: 'animation'; name: string };
```

**Key Concept - Union Types:**

```typescript
// InteractEvent can be ONE of these four shapes
type InteractEvent = 
  | { type: 'visual'; effect: string }
  | { type: 'dialog'; text: string };

// TypeScript narrows the type based on the discriminant
function handle(event: InteractEvent) {
  if (event.type === 'visual') {
    console.log(event.effect);  // TypeScript knows 'effect' exists here
  } else {
    console.log(event.text);    // TypeScript knows 'text' exists here
  }
}
```

**Learn More:**
- [TypeScript Handbook - Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
- [Discriminated Unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)

---

## 5. WebGL Engine Layer

This is the core rendering system using raw WebGL 2.0.

### 5.1 `src/engine/WebGLRenderer.ts` - Context Management

Initializes WebGL and manages the canvas.

```typescript
export class WebGLRenderer {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _gl: WebGL2RenderingContext;  // The WebGL context
  private _width: number = 0;
  private _height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    
    // Request WebGL 2.0 context with specific options
    const gl = canvas.getContext('webgl2', {
      alpha: false,           // No transparency in canvas background
      antialias: true,        // Smooth edges
      premultipliedAlpha: false,
    });

    if (!gl) {
      throw new Error('WebGL 2.0 is not supported');
    }

    this._gl = gl;
    this._setupGL();
  }

  private _setupGL(): void {
    const gl = this._gl;

    // Enable alpha blending for transparent sprites
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Disable depth testing (we're doing 2D)
    gl.disable(gl.DEPTH_TEST);
  }

  // Clear the screen with a color
  clear(color: Color): void {
    this._gl.clearColor(color.r, color.g, color.b, color.a);
    this._gl.clear(this._gl.COLOR_BUFFER_BIT);
  }

  // Create orthographic projection for 2D rendering
  // This converts pixel coordinates to WebGL's -1 to 1 range
  createProjectionMatrix(): Float32Array {
    const left = 0;
    const right = this._width;
    const bottom = this._height;
    const top = 0;
    
    // Column-major 4x4 matrix
    return new Float32Array([
      2 / (right - left), 0, 0, 0,
      0, 2 / (top - bottom), 0, 0,
      0, 0, -1, 0,
      -(right + left) / (right - left), 
      -(top + bottom) / (top - bottom), 
      0, 1,
    ]);
  }
}
```

**Key Concepts:**

1. **WebGL Context**: The `gl` object is your interface to the GPU
2. **Blending**: `SRC_ALPHA, ONE_MINUS_SRC_ALPHA` is standard transparency
3. **Projection Matrix**: Converts screen pixels (0,0 to 1920,1080) to GPU coordinates (-1 to 1)

**Learn More:**
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- [MDN WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)

---

### 5.2 `src/engine/ShaderProgram.ts` - Shader Compilation

Shaders are programs that run on the GPU. We need two types:
- **Vertex Shader**: Positions vertices (corners of triangles)
- **Fragment Shader**: Colors each pixel

```typescript
export class ShaderProgram {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _program: WebGLProgram;
  
  // Cache uniform/attribute locations for performance
  private readonly _uniforms: Map<string, WebGLUniformLocation> = new Map();

  constructor(gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) {
    this._gl = gl;

    // Compile both shaders
    const vertexShader = this._compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this._compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    // Link them into a program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Shader linking failed: ${gl.getProgramInfoLog(program)}`);
    }

    this._program = program;
  }

  private _compileShader(type: number, source: string): WebGLShader {
    const gl = this._gl;
    const shader = gl.createShader(type)!;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      throw new Error(`Shader compilation failed: ${log}`);
    }

    return shader;
  }

  // Activate this shader for rendering
  use(): void {
    this._gl.useProgram(this._program);
  }

  // Set a 4x4 matrix uniform (like projection matrix)
  setUniformMatrix4fv(name: string, value: Float32Array): void {
    const location = this._uniforms.get(name);
    if (location) {
      this._gl.uniformMatrix4fv(location, false, value);
    }
  }
}
```

---

### 5.3 Shader Files - GLSL Code

#### `src/shaders/sprite.vert` - Vertex Shader

```glsl
#version 300 es

// Input attributes (per vertex)
layout(location = 0) in vec2 a_position;  // X, Y position
layout(location = 1) in vec2 a_texCoord;  // Texture coordinates
layout(location = 2) in vec4 a_color;     // Tint color

// Uniform (same for all vertices)
uniform mat4 u_projection;  // Converts pixels to clip space

// Output to fragment shader
out vec2 v_texCoord;
out vec4 v_color;

void main() {
  v_texCoord = a_texCoord;
  v_color = a_color;
  
  // Transform position from pixels to clip space (-1 to 1)
  gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}
```

#### `src/shaders/sprite.frag` - Fragment Shader

```glsl
#version 300 es
precision mediump float;

// Input from vertex shader
in vec2 v_texCoord;
in vec4 v_color;

// Texture sampler
uniform sampler2D u_texture;
uniform float u_useTexture;  // 0 = solid color, 1 = textured

// Output color
out vec4 fragColor;

void main() {
  if (u_useTexture > 0.5) {
    // Sample texture and multiply by tint
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_color;
  } else {
    // Just use the color (for placeholders)
    fragColor = v_color;
  }
  
  // Discard transparent pixels
  if (fragColor.a < 0.01) {
    discard;
  }
}
```

**Key Concepts:**

1. **Attributes**: Per-vertex data (position, color, etc.)
2. **Uniforms**: Global data (projection matrix, textures)
3. **Varyings** (`out`/`in`): Data passed from vertex to fragment shader
4. **`gl_Position`**: Built-in output for vertex position

**Learn More:**
- [The Book of Shaders](https://thebookofshaders.com/) - Beautiful shader tutorial
- [WebGL2 Fundamentals - Shaders](https://webgl2fundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)

---

### 5.4 `src/engine/SpriteBatch.ts` - Efficient Rendering

Drawing each sprite individually is slow. SpriteBatch collects multiple sprites and draws them all at once.

```typescript
const MAX_SPRITES = 1000;
const FLOATS_PER_VERTEX = 8;  // x, y, u, v, r, g, b, a

export class SpriteBatch {
  private readonly _vertices: Float32Array;  // CPU buffer
  private _spriteCount: number = 0;
  private _drawing: boolean = false;

  constructor(gl: WebGL2RenderingContext) {
    // Pre-allocate buffer for maximum sprites
    this._vertices = new Float32Array(MAX_SPRITES * 4 * FLOATS_PER_VERTEX);
    // ... setup VAO, VBO, etc.
  }

  // Start collecting sprites
  begin(): void {
    this._drawing = true;
    this._spriteCount = 0;
  }

  // Add a sprite to the batch
  draw(sprite: Sprite, x: number, y: number, width?: number, height?: number): void {
    if (this._spriteCount >= MAX_SPRITES) {
      this._flush();  // Draw current batch and start new one
    }

    const w = width ?? sprite.width;
    const h = height ?? sprite.height;

    // Write 4 vertices (corners of the quad)
    const idx = this._spriteCount * 4 * FLOATS_PER_VERTEX;
    
    // Top-left vertex
    this._vertices[idx + 0] = x;      // position x
    this._vertices[idx + 1] = y;      // position y
    this._vertices[idx + 2] = sprite.u0;  // texture u
    this._vertices[idx + 3] = sprite.v0;  // texture v
    this._vertices[idx + 4] = 1;      // color r
    this._vertices[idx + 5] = 1;      // color g
    this._vertices[idx + 6] = 1;      // color b
    this._vertices[idx + 7] = 1;      // color a
    
    // ... (3 more vertices for other corners)
    
    this._spriteCount++;
  }

  // Send batch to GPU and render
  end(): void {
    this._flush();
    this._drawing = false;
  }

  private _flush(): void {
    if (this._spriteCount === 0) return;
    
    // Upload vertex data to GPU
    // Draw all sprites with one draw call
    gl.drawElements(gl.TRIANGLES, this._spriteCount * 6, gl.UNSIGNED_SHORT, 0);
    
    this._spriteCount = 0;
  }
}
```

**Key Concept - Batching:**

```
Without batching:
  Draw sprite 1 → GPU call
  Draw sprite 2 → GPU call
  Draw sprite 3 → GPU call
  (100 sprites = 100 GPU calls = SLOW)

With batching:
  Collect sprite 1, 2, 3... 100
  Draw all at once → 1 GPU call = FAST
```

---

## 6. Input System

### 6.1 `src/input/KeyboardInput.ts` - Keyboard Handling

```typescript
export class KeyboardInput {
  private _keys: Set<string> = new Set();  // Currently pressed keys

  constructor() {
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));
  }

  private _onKeyDown(event: KeyboardEvent): void {
    // Store lowercase key name
    this._keys.add(event.key.toLowerCase());
    
    // Prevent default for game keys (so page doesn't scroll)
    if (['w', 'a', 's', 'd', ' ', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private _onKeyUp(event: KeyboardEvent): void {
    this._keys.delete(event.key.toLowerCase());
  }

  // Get movement direction as a vector
  getDirection(): Vector2 {
    let x = 0, y = 0;

    if (this._keys.has('a') || this._keys.has('arrowleft'))  x -= 1;
    if (this._keys.has('d') || this._keys.has('arrowright')) x += 1;
    if (this._keys.has('w') || this._keys.has('arrowup'))    y -= 1;
    if (this._keys.has('s') || this._keys.has('arrowdown'))  y += 1;

    // Normalize diagonal movement
    // Without this, diagonal would be √2 ≈ 1.41x faster!
    if (x !== 0 && y !== 0) {
      const magnitude = Math.sqrt(x * x + y * y);
      x /= magnitude;
      y /= magnitude;
    }

    return { x, y };
  }
}
```

**Key Concept - Normalized Diagonal Movement:**

```
Cardinal (up):      direction = (0, -1)     length = 1
Diagonal (up+right): direction = (1, -1)    length = √2 ≈ 1.41

After normalization:
Diagonal (up+right): direction = (0.707, -0.707)  length = 1
```

---

### 6.2 `src/input/TouchInput.ts` - Mobile Tap-to-Move

```typescript
export class TouchInput {
  private _targetPosition: Vector2 | null = null;
  private _characterPosition: Vector2 = { x: 0, y: 0 };

  constructor(canvas: HTMLCanvasElement) {
    canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
  }

  private _onTouchStart(event: TouchEvent): void {
    event.preventDefault();  // Prevent scrolling
    
    const touch = event.touches[0]!;
    const rect = this._canvas.getBoundingClientRect();
    
    // Convert touch position to canvas coordinates
    this._targetPosition = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  // Calculate direction from character to tap point
  getDirection(): Vector2 {
    if (!this._targetPosition) return { x: 0, y: 0 };

    const dx = this._targetPosition.x - this._characterPosition.x;
    const dy = this._targetPosition.y - this._characterPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Stop when close enough
    if (distance < 10) {
      this._targetPosition = null;
      return { x: 0, y: 0 };
    }

    // Return normalized direction
    return { x: dx / distance, y: dy / distance };
  }
}
```

---

### 6.3 `src/input/InputManager.ts` - Unified Input API

Combines keyboard and touch into one interface.

```typescript
export class InputManager {
  private readonly _keyboard: KeyboardInput;
  private readonly _touch: TouchInput;

  constructor(canvas: HTMLCanvasElement) {
    this._keyboard = new KeyboardInput();
    this._touch = new TouchInput(canvas);
  }

  // Get direction from whichever input is active
  getDirection(): Vector2 {
    // Keyboard takes priority
    const keyboardDir = this._keyboard.getDirection();
    if (keyboardDir.x !== 0 || keyboardDir.y !== 0) {
      return keyboardDir;
    }
    
    // Fall back to touch
    return this._touch.getDirection();
  }

  // Convert direction vector to compass direction name
  static directionToName(dir: Vector2): Direction | null {
    if (dir.x === 0 && dir.y === 0) return null;

    const angle = Math.atan2(dir.y, dir.x) * (180 / Math.PI);
    
    // Map angle to 8 directions
    if (angle > -22.5 && angle <= 22.5) return 'e';
    if (angle > 22.5 && angle <= 67.5) return 'se';
    if (angle > 67.5 && angle <= 112.5) return 's';
    // ... etc
  }
}
```

**Learn More:**
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)

---

## 7. Game Logic Layer

### 7.1 `src/game/Game.ts` - The Game Loop

The heart of any game: update state, then render, repeat.

```typescript
export class Game {
  private _lastTime: number = 0;
  private _running: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this._renderer = new WebGLRenderer(canvas);
    this._batch = new SpriteBatch(this._renderer.gl);
    this._input = new InputManager(canvas);
    this._character = new Character();
  }

  start(): void {
    this._running = true;
    this._lastTime = performance.now();
    this._loop();
  }

  // The game loop - runs 60 times per second
  private _loop = (): void => {
    if (!this._running) return;

    // Calculate time since last frame
    const now = performance.now();
    const deltaTime = (now - this._lastTime) / 1000;  // Convert to seconds
    this._lastTime = now;

    // Update game state
    this._update(deltaTime);
    
    // Render to screen
    this._render();

    // Schedule next frame
    requestAnimationFrame(this._loop);
  };

  private _update(deltaTime: number): void {
    // Get player input
    const direction = this._input.getDirection();
    
    // Update character position
    this._character.update(deltaTime, direction);
    
    // Check for interactions
    if (this._input.consumeInteract()) {
      this._interactables.checkInteraction(this._character.position);
    }
  }

  private _render(): void {
    // Clear screen
    this._renderer.clear({ r: 0.1, g: 0.1, b: 0.18, a: 1 });

    // Begin batch
    this._batch.begin();
    
    // Draw everything
    this._background.render(this._batch);
    this._character.render(this._batch);
    this._interactables.render(this._batch);
    
    // Send to GPU
    this._batch.end();
  }
}
```

**Key Concept - Delta Time:**

```typescript
// BAD: Movement speed depends on frame rate
character.x += 5;  // 5 pixels per frame
// At 60 FPS: 300 px/sec
// At 30 FPS: 150 px/sec (slower!)

// GOOD: Movement speed is consistent
character.x += speed * deltaTime;  // speed = 300 pixels per second
// At 60 FPS: 300 * 0.0167 = 5 px/frame
// At 30 FPS: 300 * 0.0333 = 10 px/frame
// Both travel 300 px/sec!
```

**Learn More:**
- [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html)
- [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/)

---

### 7.2 `src/game/Character.ts` - Player Entity

```typescript
export class Character {
  position: Vector2 = { x: 0, y: 0 };
  private _speed: number = 200;  // pixels per second
  private _state: AnimationState = 'idle';
  private _direction: Direction = 's';
  private _animationFrame: number = 0;
  private _animationTime: number = 0;

  update(deltaTime: number, inputDirection: Vector2): void {
    const isMoving = inputDirection.x !== 0 || inputDirection.y !== 0;

    if (isMoving) {
      // Move character
      this.position.x += inputDirection.x * this._speed * deltaTime;
      this.position.y += inputDirection.y * this._speed * deltaTime;

      // Update facing direction
      const dirName = InputManager.directionToName(inputDirection);
      if (dirName) this._direction = dirName;

      this._state = 'walk';
    } else {
      this._state = 'idle';
    }

    // Advance animation
    this._updateAnimation(deltaTime);
  }

  private _updateAnimation(deltaTime: number): void {
    const FRAME_DURATION = 0.15;  // seconds per frame
    
    if (this._state === 'walk') {
      this._animationTime += deltaTime;
      if (this._animationTime >= FRAME_DURATION) {
        this._animationTime -= FRAME_DURATION;
        this._animationFrame = (this._animationFrame + 1) % 4;  // 4 frames
      }
    } else {
      this._animationFrame = 0;
    }
  }

  render(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    // Draw character at position with current animation frame
    batch.draw(
      this._currentSprite,
      this.position.x - this._width / 2 + offsetX,
      this.position.y - this._height / 2 + offsetY
    );
  }
}
```

---

### 7.3 `src/game/Interactable.ts` - Event System

```typescript
export class InteractableManager {
  private readonly _interactables: Map<string, InteractableState> = new Map();

  // Add an interactable object
  add(data: InteractableData): void {
    this._interactables.set(data.id, {
      data,
      isTriggered: false,
      visualEffect: 0,
    });
  }

  // Check if player can interact with anything nearby
  checkInteraction(playerPos: Vector2, range: number): InteractableData | null {
    for (const state of this._interactables.values()) {
      if (this._isInRange(playerPos, state.data, range)) {
        this._trigger(state);
        return state.data;
      }
    }
    return null;
  }

  private _trigger(state: InteractableState): void {
    state.isTriggered = true;
    state.visualEffect = 1;  // Start visual feedback

    const event = state.data.event;
    
    // Handle different event types
    switch (event.type) {
      case 'visual':
        console.log(`Visual effect: ${event.effect}`);
        break;
      case 'dialog':
        this._showMessage(event.text);
        break;
      case 'link':
        window.open(event.url, '_blank');
        break;
    }
  }

  // Check distance between player and object
  private _isInRange(playerPos: Vector2, data: InteractableData, range: number): boolean {
    const dx = playerPos.x - data.position.x;
    const dy = playerPos.y - data.position.y;
    return Math.sqrt(dx * dx + dy * dy) <= range;
  }
}
```

---

## 8. How It All Connects

### Data Flow (Each Frame)

```
1. INPUT
   └── KeyboardInput.getDirection() → { x: 1, y: -1 }
   └── InputManager normalizes → { x: 0.707, y: -0.707 }

2. UPDATE (Game._update)
   └── Character.update(deltaTime, direction)
       └── position.x += 0.707 * 200 * 0.016 = 2.26 pixels
       └── position.y += -0.707 * 200 * 0.016 = -2.26 pixels
       └── direction = 'ne'
       └── state = 'walk'
       └── animationFrame cycles 0→1→2→3→0...

3. RENDER (Game._render)
   └── renderer.clear()
   └── batch.begin()
   └── background.render(batch) → queues grid quads
   └── character.render(batch) → queues character quad
   └── interactables.render(batch) → queues object quads
   └── batch.end()
       └── Upload Float32Array to GPU
       └── gl.drawElements() → GPU draws all quads
```

### Class Relationships

```
Game (orchestrator)
├── owns → WebGLRenderer (WebGL context)
├── owns → SpriteBatch (batched rendering)
│           └── uses → ShaderProgram
│           └── uses → WebGLRenderer.gl
├── owns → InputManager
│           ├── owns → KeyboardInput
│           └── owns → TouchInput
├── owns → Character
│           └── uses → SpriteBatch (for rendering)
├── owns → Background
│           └── uses → SpriteBatch
└── owns → InteractableManager
            └── uses → SpriteBatch
```

---

## 9. Learning Resources

### TypeScript

| Resource | Description |
|----------|-------------|
| [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) | Official comprehensive guide |
| [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/) | Free book, very detailed |
| [Total TypeScript](https://www.totaltypescript.com/tutorials) | Modern tutorials by Matt Pocock |
| [Execute Program](https://www.executeprogram.com/courses/typescript) | Interactive exercises |

### WebGL

| Resource | Description |
|----------|-------------|
| [WebGL2 Fundamentals](https://webgl2fundamentals.org/) | Best beginner tutorial for WebGL 2.0 |
| [Learn WebGL](http://learnwebgl.brown37.net/) | Academic but thorough |
| [The Book of Shaders](https://thebookofshaders.com/) | Beautiful shader programming guide |
| [Shadertoy](https://www.shadertoy.com/) | See amazing shaders, learn by example |

### Vite

| Resource | Description |
|----------|-------------|
| [Vite Official Docs](https://vitejs.dev/guide/) | Start here |
| [Vite in 100 Seconds](https://www.youtube.com/watch?v=KCrXgy8qtjM) | Quick overview video |

### Game Development Patterns

| Resource | Description |
|----------|-------------|
| [Game Programming Patterns](https://gameprogrammingpatterns.com/) | Free book, essential reading |
| [Fix Your Timestep](https://gafferongames.com/post/fix_your_timestep/) | Understanding delta time |
| [Lazy Devs Academy](https://www.youtube.com/@LazyDevs) | Practical game dev tutorials |

### Math for Games

| Resource | Description |
|----------|-------------|
| [3Blue1Brown Linear Algebra](https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab) | Visual intro to matrices/vectors |
| [Immersive Math](http://immersivemath.com/ila/index.html) | Interactive linear algebra |

---

## Next Steps

1. **Add your sprites**: Replace placeholder rectangles with your hand-drawn images
2. **Expand animations**: Add more animation states (running, idle variations)
3. **Build the world**: Create more backgrounds and interactable objects
4. **Deploy**: Run `pnpm build` and host on GitHub Pages

Happy coding! 🎮




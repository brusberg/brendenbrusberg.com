/**
 * Game - Main game loop and orchestration
 * Integrates all game systems: rendering, input, interactables, and features
 * 
 * UPDATED: Camera bounds, 3x scale, in-world elements (no popups except resume fullscreen)
 */

import { WebGLRenderer } from '@/engine/WebGLRenderer';
import { SpriteBatch } from '@/engine/SpriteBatch';
import { TextureLoader } from '@/engine/TextureLoader';
import { MockupTextureLoader } from '@/engine/MockupTextureLoader';
import { InputManager } from '@/input/InputManager';
import { Character } from './Character';
import { Background } from './Background';
import { InteractableManager } from './Interactable';
import { Decorations } from './Decorations';
import { TodoAreas } from './TodoAreas';
import { getDarkMode } from './DarkMode';
import { getWizardBattle } from './WizardBattle';
import { WorldStats } from './WorldStats';
import { getWorldUI } from './WorldUI';
import { getWorldResume } from './WorldResume';
import { 
  WORLD_CENTER, 
  WORLD_WIDTH,
  WORLD_HEIGHT,
  INTERACTIVE_LOCATIONS, 
  TODO_LOCATIONS,
} from './WorldLayout';
import type { Color, Sprite } from '@/types';

// Scaled interaction distances
const INTERACT_RANGE = 200; // 3x scale
const HIGHLIGHT_RANGE = 250;

export class Game {
  private readonly _renderer: WebGLRenderer;
  private readonly _batch: SpriteBatch;
  private readonly _textureLoader: TextureLoader;
  private readonly _mockupLoader: MockupTextureLoader;
  private readonly _input: InputManager;
  private readonly _character: Character;
  private readonly _background: Background;
  private readonly _interactables: InteractableManager;
  private readonly _decorations: Decorations;
  private readonly _todoAreas: TodoAreas;
  private readonly _worldStats: WorldStats;
  private readonly _canvas: HTMLCanvasElement;

  private _lastTime: number = 0;
  private _running: boolean = false;

  // Camera offset (for scrolling/following character)
  private _cameraX: number = 0;
  private _cameraY: number = 0;

  // Sprites for interactive elements
  private _lightswitchOnSprite: Sprite | null = null;
  private _lightswitchOffSprite: Sprite | null = null;
  private _wizardSprite: Sprite | null = null;

  // Dark mode state (start in light mode - ON)
  private _isDarkMode: boolean = false;


  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    
    // Initialize dark mode first
    const darkMode = getDarkMode();
    this._isDarkMode = darkMode.isDark;
    darkMode.onChange((mode) => {
      this._isDarkMode = mode === 'dark';
    });

    // Initialize engine
    this._renderer = new WebGLRenderer(canvas);
    this._batch = new SpriteBatch(this._renderer.gl);
    this._textureLoader = new TextureLoader(this._renderer.gl);
    this._mockupLoader = new MockupTextureLoader(this._renderer.gl);

    // Preload all mockup sprites
    this._mockupLoader.preloadAll();
    this._loadSprites();

    // Initialize input
    this._input = new InputManager(canvas);

    // Initialize game objects
    this._character = new Character(this._textureLoader);
    this._background = new Background(this._textureLoader);
    this._interactables = new InteractableManager();
    this._decorations = new Decorations(this._mockupLoader);
    this._todoAreas = new TodoAreas(this._mockupLoader);
    this._worldStats = new WorldStats(this._renderer.gl);

    // Set character at world center
    this._character.position = {
      x: WORLD_CENTER.x,
      y: WORLD_CENTER.y,
    };

    // Setup interactive elements
    this._setupInteractables();
    
    // Setup click handler for in-world click interactions
    this._setupClickHandler();
    
    // Initialize in-world resume (actual PDF display)
    getWorldResume();
  }

  /**
   * Load sprite references
   */
  private _loadSprites(): void {
    this._lightswitchOnSprite = this._mockupLoader.getSprite('lightswitch_on');
    this._lightswitchOffSprite = this._mockupLoader.getSprite('lightswitch_off');
    this._wizardSprite = this._mockupLoader.getSprite('wizard');
  }

  /**
   * Setup click handler for clicking on in-world elements
   */
  private _setupClickHandler(): void {
    this._canvas.addEventListener('click', () => {
      // Handle wizard battle clicks
      const wizardBattle = getWizardBattle(this._mockupLoader);
      if (wizardBattle.isActive) {
        wizardBattle.handleClick();
        return;
      }
      
      // Note: Resume clicking is now handled by WorldResume directly
    });
  }

  /**
   * Setup interactive elements from world layout (3x scaled hitboxes)
   */
  private _setupInteractables(): void {
    // Light switch (96x144 at 3x scale)
    const lightswitch = INTERACTIVE_LOCATIONS.find(l => l.id === 'lightswitch');
    if (lightswitch) {
      this._interactables.add({
        id: 'lightswitch',
        position: lightswitch.position,
        hitbox: {
          x: lightswitch.position.x - 48,
          y: lightswitch.position.y - 72,
          width: 96,
          height: 144,
        },
        event: { type: 'visual', effect: 'toggle-dark-mode' },
      });
    }

    // Resume - NO space bar interaction, only click on sprite
    // (handled in click handler above)

    // Wizard (144x192 at 3x scale)
    const wizard = INTERACTIVE_LOCATIONS.find(l => l.id === 'wizard');
    if (wizard) {
      this._interactables.add({
        id: 'wizard',
        position: wizard.position,
        hitbox: {
          x: wizard.position.x - 72,
          y: wizard.position.y - 96,
          width: 144,
          height: 192,
        },
        event: { type: 'animation', name: 'wizard-battle' },
      });
    }

    // TODO locations as interactables (192x144 at 3x scale)
    for (const todo of TODO_LOCATIONS) {
      this._interactables.add({
        id: todo.id,
        position: todo.position,
        hitbox: {
          x: todo.position.x - 96,
          y: todo.position.y - 72,
          width: 192,
          height: 144,
        },
        event: { type: 'dialog', text: todo.id },
      });
    }
  }

  /**
   * Handle interaction with game elements
   */
  private _handleInteraction(id: string): void {
    const wizardBattle = getWizardBattle(this._mockupLoader);
    
    switch (id) {
      case 'lightswitch':
        getDarkMode().toggle();
        break;

      case 'wizard':
        // Start wizard battle - wizard stays at original position, player moves right
        const wizardLoc = INTERACTIVE_LOCATIONS.find(l => l.id === 'wizard');
        if (wizardLoc) {
          wizardBattle.start(this._character.position, wizardLoc.position);
        }
        break;

      // TODO areas
      case 'projects':
      case 'gallery':
      case 'house':
      case 'inspiration':
      case 'mentors':
        this._todoAreas.toggle(id);
        break;

      default:
        console.log('Unknown interaction:', id);
    }
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this._running) return;

    this._running = true;
    this._lastTime = performance.now();
    this._loop();

    // Hide loading screen
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this._running = false;
  }

  /**
   * Main game loop
   */
  private _loop = (): void => {
    if (!this._running) return;

    const now = performance.now();
    const deltaTime = (now - this._lastTime) / 1000;
    this._lastTime = now;

    this._update(deltaTime);
    this._render();

    requestAnimationFrame(this._loop);
  };

  /**
   * Update game state
   */
  private _update(deltaTime: number): void {
    const wizardBattle = getWizardBattle(this._mockupLoader);
    
    // Don't process movement if a modal is open OR wizard battle is active
    const modalOpen = 
      getWorldResume().isFullscreen || 
      this._todoAreas.isOpen;
    
    const battleActive = wizardBattle.isActive;

    // Update wizard battle
    if (battleActive) {
      wizardBattle.update(deltaTime);
    }

    // Update camera offset for input manager (MUST be before getting direction)
    this._input.setCameraOffset(this._cameraX, this._cameraY);
    
    // Update input manager with character position
    this._input.update(this._character.position);

    if (!modalOpen && !battleActive) {
      // Get input direction
      const direction = this._input.getDirection();

      // Update character
      this._character.update(deltaTime, direction);
      
      // Clamp character to world bounds
      this._clampCharacterToWorld();
    }

    // Check for interact input (space bar)
    if (this._input.consumeInteract() && !modalOpen) {
      if (battleActive) {
        // During battle, space pushes lightning
        wizardBattle.playerPush();
      } else {
        // Check interactables
        const triggered = this._interactables.checkInteraction(
          this._character.position,
          INTERACT_RANGE
        );
        if (triggered) {
          this._handleInteraction(triggered.id);
        }

        // Check TODO areas
        const todoArea = this._todoAreas.getAreaAt(
          this._character.position.x,
          this._character.position.y,
          INTERACT_RANGE
        );
        if (todoArea) {
          this._handleInteraction(todoArea);
        }
      }
    }

    // Update systems
    this._interactables.update(deltaTime);
    this._decorations.update(deltaTime);
    this._worldStats.update(deltaTime);

    // Update camera to follow character (or lock during battle)
    if (battleActive) {
      this._updateCameraBattle(deltaTime);
    } else {
      this._updateCamera(deltaTime);
    }
  }

  /**
   * Clamp character position to world bounds
   */
  private _clampCharacterToWorld(): void {
    const halfWidth = this._character.width / 2;
    const halfHeight = this._character.height / 2;
    
    this._character.position.x = Math.max(halfWidth, Math.min(WORLD_WIDTH - halfWidth, this._character.position.x));
    this._character.position.y = Math.max(halfHeight, Math.min(WORLD_HEIGHT - halfHeight, this._character.position.y));
  }

  /**
   * Update camera to follow character with world bounds clamping
   */
  private _updateCamera(_deltaTime: number): void {
    const screenWidth = this._renderer.width;
    const screenHeight = this._renderer.height;
    
    // Target camera position (center on character)
    let targetX = this._character.position.x - screenWidth / 2;
    let targetY = this._character.position.y - screenHeight / 2;

    // Clamp to world bounds (camera can't see beyond world edges)
    targetX = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, targetX));
    targetY = Math.max(0, Math.min(WORLD_HEIGHT - screenHeight, targetY));

    // Smooth camera follow
    const smoothing = 0.12;
    this._cameraX += (targetX - this._cameraX) * smoothing;
    this._cameraY += (targetY - this._cameraY) * smoothing;
    
    // Clamp after smoothing to prevent jitter at edges
    this._cameraX = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, this._cameraX));
    this._cameraY = Math.max(0, Math.min(WORLD_HEIGHT - screenHeight, this._cameraY));
    
    // Update WorldUI with camera position
    getWorldUI().updateCamera(this._cameraX, this._cameraY, screenWidth, screenHeight);
  }

  /**
   * Update camera during wizard battle (center on battle)
   */
  private _updateCameraBattle(_deltaTime: number): void {
    const wizardBattle = getWizardBattle(this._mockupLoader);
    const screenWidth = this._renderer.width;
    const screenHeight = this._renderer.height;
    
    // Center camera on the battle (between wizard and player positions)
    const battleCenterX = (wizardBattle.wizardPosition.x + wizardBattle.playerPosition.x) / 2;
    const battleCenterY = (wizardBattle.wizardPosition.y + wizardBattle.playerPosition.y) / 2;
    
    let targetX = battleCenterX - screenWidth / 2;
    let targetY = battleCenterY - screenHeight / 2;

    // Clamp to world bounds
    targetX = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, targetX));
    targetY = Math.max(0, Math.min(WORLD_HEIGHT - screenHeight, targetY));

    // Smoother transition for battle camera
    const smoothing = 0.08;
    this._cameraX += (targetX - this._cameraX) * smoothing;
    this._cameraY += (targetY - this._cameraY) * smoothing;
    
    // Update WorldUI with camera position
    getWorldUI().updateCamera(this._cameraX, this._cameraY, screenWidth, screenHeight);
  }

  /**
   * Render the game
   */
  private _render(): void {
    const wizardBattle = getWizardBattle(this._mockupLoader);
    
    // Clear with theme-appropriate color
    const darkMode = getDarkMode();
    this._renderer.clear(darkMode.colors.background);

    // Update projection matrix
    this._batch.setProjectionMatrix(this._renderer.createProjectionMatrix());
    
    // Apply global tint based on dark mode
    this._batch.setGlobalTint(darkMode.getSpriteTint());

    // Begin batch
    this._batch.begin();

    // Camera offset
    const offsetX = -this._cameraX;
    const offsetY = -this._cameraY;

    // Render background
    this._background.render(this._batch, offsetX, offsetY, this._renderer.width, this._renderer.height);

    // Render decorations (trees, grass, flowers, fountain)
    this._decorations.render(this._batch, offsetX, offsetY);

    // Render interactive elements (skip wizard during battle)
    this._renderInteractiveElements(offsetX, offsetY, wizardBattle.isActive);

    // Render TODO signs
    this._todoAreas.render(this._batch, offsetX, offsetY, this._character.position);

    // Render in-world stats (live age, etc.)
    this._worldStats.render(this._batch, offsetX, offsetY);

    // Render interactable highlights
    this._interactables.render(this._batch, offsetX, offsetY, this._character.position);

    // Render character (skip during battle as it's rendered by battle)
    if (!wizardBattle.isActive) {
      this._character.render(this._batch, offsetX, offsetY);
    } else {
      // Render character at battle position during battle
      const battlePos = wizardBattle.playerPosition;
      const savedPos = { ...this._character.position };
      this._character.position = battlePos;
      this._character.render(this._batch, offsetX, offsetY);
      this._character.position = savedPos;
    }

    // Render wizard battle (in-world)
    if (wizardBattle.isActive) {
      wizardBattle.render(this._batch, offsetX, offsetY);
    }

    // End batch
    this._batch.end();
  }

  /**
   * Render interactive element sprites
   */
  private _renderInteractiveElements(offsetX: number, offsetY: number, skipWizard: boolean = false): void {
    const playerPos = this._character.position;

    // Light switch
    const lightswitch = INTERACTIVE_LOCATIONS.find(l => l.id === 'lightswitch');
    if (lightswitch) {
      const sprite = this._isDarkMode ? this._lightswitchOffSprite : this._lightswitchOnSprite;
      if (sprite) {
        const x = lightswitch.position.x - sprite.width / 2 + offsetX;
        const y = lightswitch.position.y - sprite.height + offsetY;
        const isNear = this._isNearPosition(playerPos, lightswitch.position, HIGHLIGHT_RANGE);
        const tint: Color = isNear ? { r: 1.2, g: 1.2, b: 1, a: 1 } : { r: 1, g: 1, b: 1, a: 1 };
        this._batch.draw(sprite, x, y, sprite.width, sprite.height, 0, tint);
      }
    }

    // Note: Resume is now rendered as an in-world HTML element (WorldResume)

    // Wizard (skip during battle)
    if (!skipWizard) {
      const wizard = INTERACTIVE_LOCATIONS.find(l => l.id === 'wizard');
      if (wizard && this._wizardSprite) {
        const sprite = this._wizardSprite;
        const x = wizard.position.x - sprite.width / 2 + offsetX;
        const y = wizard.position.y - sprite.height + offsetY;
        const isNear = this._isNearPosition(playerPos, wizard.position, HIGHLIGHT_RANGE);
        
        // Wizard has a purple-ish tint
        const tint: Color = isNear 
          ? { r: 1.1, g: 0.9, b: 1.3, a: 1 } 
          : { r: 0.9, g: 0.8, b: 1.1, a: 1 };
        this._batch.draw(sprite, x, y, sprite.width, sprite.height, 0, tint);

        // Draw "⚡" indicator if near (scaled)
        if (isNear) {
          const time = performance.now() / 400;
          const bob = Math.sin(time) * 8;
          this._batch.drawRect(
            wizard.position.x - 15 + offsetX,
            wizard.position.y - sprite.height - 40 + bob + offsetY,
            30, 20,
            { r: 0.8, g: 0.5, b: 1, a: 0.9 }
          );
        }
      }
    }
  }

  /**
   * Check if player is near a position
   */
  private _isNearPosition(playerPos: { x: number; y: number }, targetPos: { x: number; y: number }, range: number): boolean {
    const dx = playerPos.x - targetPos.x;
    const dy = playerPos.y - targetPos.y;
    return Math.sqrt(dx * dx + dy * dy) < range;
  }

  /**
   * Get character color based on direction (for visual feedback)
   */
  getDebugColor(directionName: string | null): Color {
    const colors: Record<string, Color> = {
      'n': { r: 0.2, g: 0.8, b: 0.2, a: 1 },
      'ne': { r: 0.4, g: 0.8, b: 0.4, a: 1 },
      'e': { r: 0.8, g: 0.2, b: 0.2, a: 1 },
      'se': { r: 0.8, g: 0.4, b: 0.4, a: 1 },
      's': { r: 0.2, g: 0.2, b: 0.8, a: 1 },
      'sw': { r: 0.4, g: 0.4, b: 0.8, a: 1 },
      'w': { r: 0.8, g: 0.8, b: 0.2, a: 1 },
      'nw': { r: 0.6, g: 0.8, b: 0.2, a: 1 },
    };
    return directionName ? (colors[directionName] ?? { r: 0.5, g: 0.5, b: 0.5, a: 1 }) : { r: 0.5, g: 0.5, b: 0.5, a: 1 };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this._input.dispose();
    this._batch.dispose();
    this._textureLoader.dispose();
    this._mockupLoader.dispose();
    this._renderer.dispose();
    this._todoAreas.dispose();
    this._worldStats.dispose();
    getWorldResume().dispose();
    getWorldUI().dispose();
    getWizardBattle(this._mockupLoader).dispose();
  }
}

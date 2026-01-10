/**
 * WizardBattle - IN-WORLD minigame with Perlin noise lightning
 * Tug-of-war style game: wizard pushes lightning toward player
 * Player presses space/click/tap to push back
 * 
 * UPDATED: Renders in game world (not as popup overlay)
 */

import type { Sprite, Color, Vector2 } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { SpriteLoader } from '@/engine/SpriteLoader';
import { generateLightningPath } from '@/utils/PerlinNoise';

export type BattleState = 'idle' | 'active' | 'playerWin' | 'wizardWin';

// Battle settings (Easy difficulty)
// Direction: 0 = player wins (pushed to wizard), 1 = wizard wins (pushed to player)
const WIZARD_PUSH_SPEED = 0.25;   // Units per second (toward player, increases position)
const PLAYER_PUSH_AMOUNT = 0.07; // Units per press (toward wizard, decreases position)
const WIN_THRESHOLD = 0.08;      // Player wins when lightning reaches wizard (low position)
const LOSE_THRESHOLD = 0.92;     // Wizard wins when lightning reaches player (high position)

// Visual settings (scaled for 3x world)
const BATTLE_SPACING = 600;      // Distance between wizard and player during battle
const LIGHTNING_SEGMENTS = 50;
const LIGHTNING_AMPLITUDE = 60;  // Scaled for 3x

export class WizardBattle {
  private _wizardSprite: Sprite | null = null;

  // Battle state
  private _state: BattleState = 'idle';
  private _lightningPosition: number = 0.5; // 0 = wizard wins, 1 = player wins
  private _noiseTime: number = 0;
  private _resultTimer: number = 0;
  
  // World position where battle takes place
  private _battleCenterX: number = 0;
  private _battleCenterY: number = 0;
  private _wizardWorldPos: Vector2 = { x: 0, y: 0 };
  private _playerWorldPos: Vector2 = { x: 0, y: 0 };

  // Input handling
  private _playerPushPending: boolean = false;
  private _keyHandler: ((e: KeyboardEvent) => void) | null = null;

  // Result message
  private _resultMessage: string = '';
  private _resultColor: Color = { r: 1, g: 1, b: 1, a: 1 };

  constructor(spriteLoader: SpriteLoader) {
    this._wizardSprite = spriteLoader.getSprite('wizard');
  }

  /**
   * Get current battle state
   */
  get state(): BattleState {
    return this._state;
  }

  /**
   * Check if battle is active
   */
  get isActive(): boolean {
    return this._state === 'active' || this._state === 'playerWin' || this._state === 'wizardWin';
  }

  /**
   * Legacy compatibility - always false since no popup
   */
  get isOpen(): boolean {
    return false;
  }

  /**
   * Get wizard world position during battle
   */
  get wizardPosition(): Vector2 {
    return this._wizardWorldPos;
  }

  /**
   * Get player world position during battle
   */
  get playerPosition(): Vector2 {
    return this._playerWorldPos;
  }

  /**
   * Start the wizard battle minigame
   * Wizard stays at its original position, player moves to the right
   */
  start(_playerPos?: Vector2, wizardPos?: Vector2): void {
    if (this._state === 'active') return;

    this._state = 'active';
    this._lightningPosition = 0.5;
    this._noiseTime = Math.random() * 100;
    this._resultTimer = 0;
    this._resultMessage = '';

    // Wizard stays at original position
    if (wizardPos) {
      this._wizardWorldPos = { ...wizardPos };
    }
    
    // Player moves to the right of wizard for battle
    this._playerWorldPos = {
      x: this._wizardWorldPos.x + BATTLE_SPACING,
      y: this._wizardWorldPos.y,
    };
    
    // Battle center is between them
    this._battleCenterX = (this._wizardWorldPos.x + this._playerWorldPos.x) / 2;
    this._battleCenterY = this._wizardWorldPos.y;

    this._setupInputHandlers();
  }

  /**
   * End the battle
   */
  end(): void {
    this._state = 'idle';
    this._removeInputHandlers();
  }

  /**
   * Player pushes the lightning
   */
  playerPush(): void {
    if (this._state !== 'active') return;
    this._playerPushPending = true;
  }

  /**
   * Setup keyboard handler for battle
   */
  private _setupInputHandlers(): void {
    this._keyHandler = (event: KeyboardEvent): void => {
      if (event.key === ' ') {
        event.preventDefault();
        this.playerPush();
      } else if (event.key === 'Escape') {
        this.end();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
  }

  /**
   * Remove input handlers
   */
  private _removeInputHandlers(): void {
    if (this._keyHandler) {
      window.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  }

  /**
   * Handle click/tap on screen during battle
   */
  handleClick(): void {
    if (this._state === 'active') {
      this.playerPush();
    } else if (this._state === 'playerWin' || this._state === 'wizardWin') {
      // Click to dismiss result
      this.end();
    }
  }

  /**
   * Update battle state (call from Game.update)
   */
  update(deltaTime: number): void {
    if (this._state !== 'active' && this._state !== 'playerWin' && this._state !== 'wizardWin') {
      return;
    }

    // Handle result display timer
    if (this._state === 'playerWin' || this._state === 'wizardWin') {
      this._resultTimer += deltaTime;
      if (this._resultTimer > 3) {
        this.end();
      }
      return;
    }

    this._noiseTime += deltaTime * 2;

    // Wizard pushes toward player (increases position toward 1)
    this._lightningPosition += WIZARD_PUSH_SPEED * deltaTime;

    // Player push toward wizard (decreases position toward 0)
    if (this._playerPushPending) {
      this._lightningPosition -= PLAYER_PUSH_AMOUNT;
      this._playerPushPending = false;
    }

    // Clamp position
    this._lightningPosition = Math.max(0, Math.min(1, this._lightningPosition));

    // Check win/lose conditions
    // Player wins when lightning pushed to wizard (position <= WIN_THRESHOLD)
    // Wizard wins when lightning pushed to player (position >= LOSE_THRESHOLD)
    if (this._lightningPosition <= WIN_THRESHOLD) {
      this._onPlayerWin();
    } else if (this._lightningPosition >= LOSE_THRESHOLD) {
      this._onWizardWin();
    }
  }

  /**
   * Render the battle in world space
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    if (this._state === 'idle') return;

    // Draw battle background effect (subtle glow)
    this._renderBattleBackground(batch, offsetX, offsetY);

    // Draw wizard sprite
    if (this._wizardSprite) {
      const wx = this._wizardWorldPos.x - this._wizardSprite.width / 2 + offsetX;
      const wy = this._wizardWorldPos.y - this._wizardSprite.height / 2 + offsetY;
      const wizardTint: Color = { r: 1.1, g: 0.8, b: 1.3, a: 1 };
      batch.draw(this._wizardSprite, wx, wy, this._wizardSprite.width, this._wizardSprite.height, 0, wizardTint);
    }

    // Draw lightning
    this._renderLightning(batch, offsetX, offsetY);

    // Draw position indicator bar
    this._renderPositionBar(batch, offsetX, offsetY);

    // Draw instructions
    this._renderInstructions(batch, offsetX, offsetY);

    // Draw result message if game ended
    if (this._resultMessage) {
      this._renderResultMessage(batch, offsetX, offsetY);
    }
  }

  /**
   * Render battle background glow
   */
  private _renderBattleBackground(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    // Purple glow around battle area
    const cx = this._battleCenterX + offsetX;
    const cy = this._battleCenterY + offsetY;
    
    // Outer glow
    batch.drawRect(
      cx - BATTLE_SPACING / 2 - 50,
      cy - 150,
      BATTLE_SPACING + 100,
      300,
      { r: 0.3, g: 0.1, b: 0.4, a: 0.3 }
    );
  }

  /**
   * Render lightning bolt using Perlin noise
   */
  private _renderLightning(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    const startX = this._wizardWorldPos.x + 50;
    const endX = this._playerWorldPos.x - 50;
    const midY = this._battleCenterY;

    // Generate lightning path
    const points = generateLightningPath(
      startX, midY,
      endX, midY,
      LIGHTNING_SEGMENTS,
      LIGHTNING_AMPLITUDE,
      this._noiseTime
    );

    // Calculate midpoint based on battle position
    const midpointX = startX + (endX - startX) * this._lightningPosition;

    // Draw lightning segments
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (!p1 || !p2) continue;

      // Determine color based on position
      const isWizardSide = p1.x < midpointX;
      const color: Color = isWizardSide
        ? { r: 1, g: 0.3, b: 0.3, a: 1 }  // Red (wizard's lightning)
        : { r: 0.3, g: 0.5, b: 1, a: 1 }; // Blue (player's lightning)

      // Draw thick line segment using rectangles
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const thickness = 8;

      // Draw as rectangle (approximate line)
      batch.drawRect(
        p1.x + offsetX - thickness / 2,
        p1.y + offsetY - thickness / 2,
        len + thickness,
        thickness,
        color
      );
    }

    // Draw midpoint (collision point) - larger and brighter
    // Blue when player is winning (low position), red when wizard is winning (high position)
    const midColor: Color = this._lightningPosition < 0.5
      ? { r: 0.5, g: 0.8, b: 1, a: 1 }   // Blue - player winning
      : { r: 1, g: 0.5, b: 0.5, a: 1 };  // Red - wizard winning
    
    batch.drawRect(
      midpointX + offsetX - 15,
      midY + offsetY - 15,
      30, 30,
      midColor
    );

    // Outer glow
    batch.drawRect(
      midpointX + offsetX - 25,
      midY + offsetY - 25,
      50, 50,
      { ...midColor, a: 0.3 }
    );
  }

  /**
   * Render position indicator bar
   */
  private _renderPositionBar(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    const barWidth = BATTLE_SPACING - 100;
    const barHeight = 16;
    const barX = this._battleCenterX - barWidth / 2 + offsetX;
    const barY = this._battleCenterY + 120 + offsetY;

    // Background
    batch.drawRect(barX, barY, barWidth, barHeight, { r: 0.1, g: 0.1, b: 0.15, a: 0.8 });

    // Blue side (player's territory - left side, toward wizard)
    const blueWidth = barWidth * this._lightningPosition;
    batch.drawRect(barX, barY, blueWidth, barHeight, { r: 0.2, g: 0.3, b: 0.8, a: 0.6 });

    // Red side (wizard's territory - right side, toward player)
    batch.drawRect(barX + blueWidth, barY, barWidth - blueWidth, barHeight, { r: 0.8, g: 0.2, b: 0.2, a: 0.6 });

    // Position marker
    const markerX = barX + blueWidth;
    batch.drawRect(markerX - 3, barY - 4, 6, barHeight + 8, { r: 1, g: 1, b: 1, a: 1 });

    // Labels - Wizard on left (player pushes toward), You on right (wizard pushes toward)
    batch.drawRect(barX - 80, barY + 2, 60, 12, { r: 0.8, g: 0.3, b: 0.3, a: 0.9 }); // "WIZARD" - left
    batch.drawRect(barX + barWidth + 20, barY + 2, 40, 12, { r: 0.3, g: 0.4, b: 0.9, a: 0.9 }); // "YOU" - right
  }

  /**
   * Render instructions
   */
  private _renderInstructions(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    // Draw instruction background
    const instX = this._battleCenterX + offsetX;
    const instY = this._battleCenterY - 180 + offsetY;

    batch.drawRect(instX - 200, instY - 10, 400, 30, { r: 0.1, g: 0.1, b: 0.2, a: 0.8 });
    
    // Pulsing indicator
    const pulse = Math.sin(performance.now() / 200) * 0.3 + 0.7;
    batch.drawRect(instX - 150, instY, 300, 10, { r: pulse, g: pulse, b: pulse, a: 0.9 });
  }

  /**
   * Render result message
   */
  private _renderResultMessage(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    const cx = this._battleCenterX + offsetX;
    const cy = this._battleCenterY + offsetY;

    // Background
    batch.drawRect(cx - 200, cy - 50, 400, 100, { r: 0, g: 0, b: 0, a: 0.9 });

    // Result color bar
    batch.drawRect(cx - 180, cy - 20, 360, 40, this._resultColor);
  }

  /**
   * Handle player win
   */
  private _onPlayerWin(): void {
    this._state = 'playerWin';
    this._resultMessage = 'YOU WIN!';
    this._resultColor = { r: 0.3, g: 0.9, b: 0.3, a: 1 };
    this._resultTimer = 0;
  }

  /**
   * Handle wizard win
   */
  private _onWizardWin(): void {
    this._state = 'wizardWin';
    this._resultMessage = 'WIZARD WINS';
    this._resultColor = { r: 0.9, g: 0.3, b: 0.3, a: 1 };
    this._resultTimer = 0;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.end();
  }
}

// Singleton instance
let _instance: WizardBattle | null = null;

export function getWizardBattle(spriteLoader: SpriteLoader): WizardBattle {
  if (!_instance) {
    _instance = new WizardBattle(spriteLoader);
  }
  return _instance;
}

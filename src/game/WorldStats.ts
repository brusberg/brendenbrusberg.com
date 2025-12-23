/**
 * WorldStats - In-world stats display rendered as WebGL text
 * Shows live-updating age and other stats at a fixed world position
 */

import type { Sprite } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import { TextRenderer } from '@/engine/TextRenderer';
import { formatAge } from '@/utils/AgeCalculator';
import { INTERACTIVE_LOCATIONS } from './WorldLayout';
import { getDarkMode } from './DarkMode';

export interface StatsConfig {
  countriesVisited: number;
  currentCity: string;
  numberOfSpoons: number;
}

const DEFAULT_CONFIG: StatsConfig = {
  countriesVisited: 5,
  currentCity: 'New York, NY',
  numberOfSpoons: 0,
};

export class WorldStats {
  private readonly _textRenderer: TextRenderer;
  private _sprite: Sprite | null = null;
  private _lastAge: string = '';
  private _config: StatsConfig;
  private _updateTimer: number = 0;
  private readonly _updateInterval: number = 0.05; // Update every 50ms

  constructor(gl: WebGL2RenderingContext, config: Partial<StatsConfig> = {}) {
    this._textRenderer = new TextRenderer(gl);
    this._config = { ...DEFAULT_CONFIG, ...config };
    this._updateStats();
  }

  /**
   * Update the stats display
   */
  private _updateStats(): void {
    const age = formatAge(10);
    
    // Only re-render if age changed (which it will every frame at 10 decimals)
    if (age === this._lastAge && this._sprite) {
      return;
    }
    this._lastAge = age;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    const stats = [
      { label: 'Current age', value: `${age} years` },
      { label: 'Countries visited', value: String(this._config.countriesVisited) },
      { label: 'Current city', value: this._config.currentCity },
      { label: 'Number of spoons', value: String(this._config.numberOfSpoons), highlight: true },
    ];

    this._sprite = this._textRenderer.renderStats(
      stats,
      'STATS',
      {
        fontSize: 28,
        fontFamily: "'Courier New', monospace",
        color: isDark ? '#00d9ff' : '#2563eb',
        backgroundColor: isDark ? 'rgba(20, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        padding: 24,
        lineHeight: 1.6,
      }
    );
  }

  /**
   * Update (call every frame)
   */
  update(deltaTime: number): void {
    this._updateTimer += deltaTime;
    
    if (this._updateTimer >= this._updateInterval) {
      this._updateTimer = 0;
      this._updateStats();
    }
  }

  /**
   * Render the stats in the world
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number): void {
    if (!this._sprite) return;

    // Get stats position from WorldLayout
    const statsLoc = INTERACTIVE_LOCATIONS.find(l => l.id === 'statsbillboard');
    if (!statsLoc) return;

    const x = statsLoc.position.x - this._sprite.width / 2 + offsetX;
    const y = statsLoc.position.y - this._sprite.height + offsetY;

    batch.draw(this._sprite, x, y, this._sprite.width, this._sprite.height);
  }

  /**
   * Update config
   */
  updateConfig(config: Partial<StatsConfig>): void {
    this._config = { ...this._config, ...config };
    this._lastAge = ''; // Force re-render
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this._textRenderer.dispose();
  }
}


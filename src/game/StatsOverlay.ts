/**
 * StatsOverlay - Always-visible stats HUD displayed on screen
 * Shows live-updating stats about the person and website
 */

import { formatAge } from '@/utils/AgeCalculator';
import { getDarkMode } from './DarkMode';

export interface StatsData {
  name: string;
  countriesVisited: number;
  currentCity: string;
  // GitHub stats (placeholder for now)
  githubStars?: number;
  githubWatchers?: number;
  githubForks?: number;
  githubIssues?: number;
  // Fun stats
  numberOfSpoons: number;
  linterWarnings?: number;
  lastUpdated: string;
  typescriptLines?: number;
}

const DEFAULT_STATS: StatsData = {
  name: 'Brenden',
  countriesVisited: 5,
  currentCity: 'New York, NY',
  numberOfSpoons: 0,
  lastUpdated: new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }),
  // Placeholders - can be populated via GitHub API or build-time
  githubStars: undefined,
  githubWatchers: undefined,
  githubForks: undefined,
  githubIssues: undefined,
  linterWarnings: undefined,
  typescriptLines: undefined,
};

export class StatsOverlay {
  private _container: HTMLDivElement | null = null;
  private _ageElement: HTMLSpanElement | null = null;
  private _stats: StatsData;
  private _updateInterval: number | null = null;
  private _isVisible: boolean = true;

  constructor(stats: Partial<StatsData> = {}) {
    this._stats = { ...DEFAULT_STATS, ...stats };
    this._create();
    this._startUpdates();

    // Listen for theme changes
    getDarkMode().onChange(() => this._updateTheme());
  }

  /**
   * Create the stats overlay DOM
   */
  private _create(): void {
    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    this._container = document.createElement('div');
    this._container.id = 'stats-overlay';
    this._container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isDark ? 'rgba(15, 20, 30, 0.92)' : 'rgba(255, 255, 255, 0.95)'};
      color: ${isDark ? '#e8e8e8' : '#1a1a2e'};
      border: 1px solid ${isDark ? 'rgba(0, 217, 255, 0.3)' : 'rgba(44, 62, 80, 0.3)'};
      border-radius: 12px;
      padding: 16px 20px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      z-index: 500;
      min-width: 280px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(8px);
      transition: all 0.3s ease;
    `;

    this._updateContent();
    document.body.appendChild(this._container);
  }

  /**
   * Update the overlay content
   */
  private _updateContent(): void {
    if (!this._container) return;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;
    const accent = isDark ? '#00d9ff' : '#2563eb';
    const muted = isDark ? '#888' : '#666';
    const highlight = isDark ? '#ff6b6b' : '#dc2626';

    this._container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h3 style="margin: 0 0 8px 0; font-size: 11px; color: ${muted}; text-transform: uppercase; letter-spacing: 1px;">
          Some stats about me
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Current age</td>
            <td style="padding: 3px 0; text-align: right; color: ${accent};">
              <span id="live-age" style="font-family: monospace;"></span>
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Countries visited</td>
            <td style="padding: 3px 0; text-align: right;">${this._stats.countriesVisited}</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Current city</td>
            <td style="padding: 3px 0; text-align: right;">${this._stats.currentCity}</td>
          </tr>
        </table>
      </div>
      
      <div>
        <h3 style="margin: 0 0 8px 0; font-size: 11px; color: ${muted}; text-transform: uppercase; letter-spacing: 1px;">
          Some stats about this site
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Stars this repository has on github</td>
            <td style="padding: 3px 0; text-align: right; text-decoration: ${this._stats.githubStars ? 'underline' : 'none'}; text-decoration-style: dotted;">
              ${this._stats.githubStars ?? '—'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Number of people watching this repository</td>
            <td style="padding: 3px 0; text-align: right; text-decoration: ${this._stats.githubWatchers ? 'underline' : 'none'}; text-decoration-style: dotted;">
              ${this._stats.githubWatchers ?? '—'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Number of forks</td>
            <td style="padding: 3px 0; text-align: right; text-decoration: ${this._stats.githubForks ? 'underline' : 'none'}; text-decoration-style: dotted;">
              ${this._stats.githubForks ?? '—'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Number of spoons</td>
            <td style="padding: 3px 0; text-align: right; color: ${highlight}; font-weight: bold;">
              ${this._stats.numberOfSpoons}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Number of linter warnings</td>
            <td style="padding: 3px 0; text-align: right;">
              ${this._stats.linterWarnings ?? '—'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Open github issues</td>
            <td style="padding: 3px 0; text-align: right;">
              ${this._stats.githubIssues ?? '—'}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Last updated at</td>
            <td style="padding: 3px 0; text-align: right; text-decoration: underline; text-decoration-style: dotted;">
              ${this._stats.lastUpdated}
            </td>
          </tr>
          <tr>
            <td style="padding: 3px 0; color: ${muted};">Lines of TypeScript powering this website</td>
            <td style="padding: 3px 0; text-align: right; text-decoration: ${this._stats.typescriptLines ? 'underline' : 'none'}; text-decoration-style: dotted;">
              ${this._stats.typescriptLines?.toLocaleString() ?? '—'}
            </td>
          </tr>
        </table>
      </div>
      
      <button id="stats-toggle" style="
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: ${muted};
        font-size: 14px;
        cursor: pointer;
        padding: 2px 6px;
        opacity: 0.6;
      " title="Toggle stats">−</button>
    `;

    // Get age element reference
    this._ageElement = document.getElementById('live-age') as HTMLSpanElement;
    this._updateAge();

    // Setup toggle button
    const toggleBtn = document.getElementById('stats-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleMinimize());
    }
  }

  /**
   * Start the live update interval
   */
  private _startUpdates(): void {
    // Update age every 50ms for smooth display
    this._updateInterval = window.setInterval(() => {
      this._updateAge();
    }, 50);
  }

  /**
   * Update the live age display
   */
  private _updateAge(): void {
    if (this._ageElement) {
      this._ageElement.textContent = formatAge(10);
    }
  }

  /**
   * Update theme colors
   */
  private _updateTheme(): void {
    if (!this._container) return;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    this._container.style.background = isDark 
      ? 'rgba(15, 20, 30, 0.92)' 
      : 'rgba(255, 255, 255, 0.95)';
    this._container.style.color = isDark ? '#e8e8e8' : '#1a1a2e';
    this._container.style.borderColor = isDark 
      ? 'rgba(0, 217, 255, 0.3)' 
      : 'rgba(44, 62, 80, 0.3)';

    // Rebuild content with new colors
    this._updateContent();
  }

  /**
   * Toggle minimize/expand
   */
  toggleMinimize(): void {
    if (!this._container) return;

    this._isVisible = !this._isVisible;
    
    if (this._isVisible) {
      this._updateContent();
    } else {
      // Minimized state - just show title
      const darkMode = getDarkMode();
      const isDark = darkMode.isDark;
      const muted = isDark ? '#888' : '#666';

      this._container.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 11px; color: ${muted}; text-transform: uppercase; letter-spacing: 1px;">
            Stats
          </span>
          <button id="stats-toggle" style="
            background: none;
            border: none;
            color: ${muted};
            font-size: 14px;
            cursor: pointer;
            padding: 2px 6px;
          " title="Expand stats">+</button>
        </div>
      `;

      const toggleBtn = document.getElementById('stats-toggle');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleMinimize());
      }
    }
  }

  /**
   * Update stats data
   */
  updateStats(stats: Partial<StatsData>): void {
    this._stats = { ...this._stats, ...stats };
    if (this._isVisible) {
      this._updateContent();
    }
  }

  /**
   * Show the overlay
   */
  show(): void {
    if (this._container) {
      this._container.style.display = 'block';
    }
  }

  /**
   * Hide the overlay
   */
  hide(): void {
    if (this._container) {
      this._container.style.display = 'none';
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }
}

// Singleton instance
let _instance: StatsOverlay | null = null;

export function getStatsOverlay(): StatsOverlay {
  if (!_instance) {
    _instance = new StatsOverlay();
  }
  return _instance;
}


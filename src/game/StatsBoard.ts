/**
 * StatsBoard - Interactive stats display panel
 * Shows live-updating stats about the person and website
 */

import { createLiveAgeElement, stopLiveAgeElement } from '@/utils/AgeCalculator';
import { getDarkMode } from './DarkMode';

export interface StatsData {
  name: string;
  birthDate: string;
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
  birthDate: 'May 11, 1999',
  countriesVisited: 5,
  currentCity: 'New York, NY',
  numberOfSpoons: 0,
  lastUpdated: new Date().toLocaleDateString(),
  // These will be populated dynamically or via build
  githubStars: undefined,
  githubWatchers: undefined,
  githubForks: undefined,
  githubIssues: undefined,
  linterWarnings: undefined,
  typescriptLines: undefined,
};

export class StatsBoard {
  private _isOpen: boolean = false;
  private _container: HTMLDivElement | null = null;
  private _liveAgeElement: HTMLSpanElement | null = null;
  private _stats: StatsData;
  private _updateInterval: number | null = null;

  constructor(stats: Partial<StatsData> = {}) {
    this._stats = { ...DEFAULT_STATS, ...stats };
  }

  /**
   * Check if stats panel is currently open
   */
  get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Open the stats panel
   */
  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._createPanel();
  }

  /**
   * Close the stats panel
   */
  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._destroyPanel();
  }

  /**
   * Toggle the stats panel
   */
  toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Update stats data
   */
  updateStats(stats: Partial<StatsData>): void {
    this._stats = { ...this._stats, ...stats };
    if (this._isOpen) {
      this._updatePanelContent();
    }
  }

  /**
   * Create the stats panel DOM
   */
  private _createPanel(): void {
    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    // Create container
    this._container = document.createElement('div');
    this._container.id = 'stats-panel';
    this._container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${isDark ? 'rgba(20, 25, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
      color: ${isDark ? '#e8e8e8' : '#1a1a2e'};
      border: 2px solid ${isDark ? '#00d9ff' : '#2c3e50'};
      border-radius: 12px;
      padding: 24px 32px;
      min-width: 380px;
      max-width: 90vw;
      max-height: 80vh;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: statsSlideIn 0.3s ease-out;
    `;

    // Add animation styles
    this._addAnimationStyles();

    // Create content
    this._updatePanelContent();

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      background: none;
      border: none;
      color: ${isDark ? '#888' : '#666'};
      font-size: 24px;
      cursor: pointer;
      padding: 4px 8px;
      line-height: 1;
    `;
    closeBtn.addEventListener('click', () => this.close());
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = isDark ? '#fff' : '#000';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = isDark ? '#888' : '#666';
    });
    this._container.appendChild(closeBtn);

    // Add to DOM
    document.body.appendChild(this._container);

    // Close on escape key
    this._setupEscapeHandler();

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this._handleOutsideClick);
    }, 100);
  }

  /**
   * Update the panel content
   */
  private _updatePanelContent(): void {
    if (!this._container) return;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;
    const accent = isDark ? '#00d9ff' : '#2563eb';

    // Clear existing content (except close button)
    const closeBtn = this._container.querySelector('button');
    this._container.innerHTML = '';
    if (closeBtn) this._container.appendChild(closeBtn);

    // Title
    const title = document.createElement('h2');
    title.textContent = '📊 Stats';
    title.style.cssText = `
      margin: 0 0 20px 0;
      font-size: 20px;
      color: ${accent};
      border-bottom: 1px solid ${isDark ? '#333' : '#ddd'};
      padding-bottom: 12px;
    `;
    this._container.appendChild(title);

    // Stats sections
    this._container.appendChild(this._createSection('About Me', [
      { label: 'Name', value: this._stats.name },
      { label: 'Current Age', value: this._createAgeValue(), isElement: true },
      { label: 'Countries Visited', value: String(this._stats.countriesVisited) },
      { label: 'Current City', value: this._stats.currentCity },
    ]));

    this._container.appendChild(this._createSection('About This Site', [
      { label: 'GitHub Stars', value: this._stats.githubStars?.toString() ?? '—' },
      { label: 'Watchers', value: this._stats.githubWatchers?.toString() ?? '—' },
      { label: 'Forks', value: this._stats.githubForks?.toString() ?? '—' },
      { label: 'Number of Spoons', value: String(this._stats.numberOfSpoons), highlight: true },
      { label: 'Linter Warnings', value: this._stats.linterWarnings?.toString() ?? '—' },
      { label: 'Open Issues', value: this._stats.githubIssues?.toString() ?? '—' },
      { label: 'Last Updated', value: this._stats.lastUpdated },
      { label: 'Lines of TypeScript', value: this._stats.typescriptLines?.toLocaleString() ?? '—' },
    ]));

    // Footer hint
    const hint = document.createElement('p');
    hint.textContent = 'Press ESC or click outside to close';
    hint.style.cssText = `
      margin: 16px 0 0 0;
      font-size: 11px;
      color: ${isDark ? '#666' : '#999'};
      text-align: center;
    `;
    this._container.appendChild(hint);
  }

  /**
   * Create a stats section
   */
  private _createSection(
    title: string, 
    items: Array<{ label: string; value: string | HTMLElement; isElement?: boolean; highlight?: boolean }>
  ): HTMLDivElement {
    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    const section = document.createElement('div');
    section.style.marginBottom = '16px';

    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      margin: 0 0 8px 0;
      font-size: 13px;
      color: ${isDark ? '#888' : '#666'};
      text-transform: uppercase;
      letter-spacing: 1px;
    `;
    section.appendChild(sectionTitle);

    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
    `;

    for (const item of items) {
      const row = document.createElement('tr');
      
      const labelCell = document.createElement('td');
      labelCell.textContent = item.label;
      labelCell.style.cssText = `
        padding: 4px 12px 4px 0;
        color: ${isDark ? '#aaa' : '#555'};
      `;

      const valueCell = document.createElement('td');
      valueCell.style.cssText = `
        padding: 4px 0;
        text-align: right;
        color: ${item.highlight ? '#ff6b6b' : (isDark ? '#fff' : '#000')};
        font-weight: ${item.highlight ? 'bold' : 'normal'};
      `;

      if (item.isElement && item.value instanceof HTMLElement) {
        valueCell.appendChild(item.value);
      } else {
        valueCell.textContent = item.value as string;
      }

      row.appendChild(labelCell);
      row.appendChild(valueCell);
      table.appendChild(row);
    }

    section.appendChild(table);
    return section;
  }

  /**
   * Create live age value element
   */
  private _createAgeValue(): HTMLElement {
    // Clean up previous element
    if (this._liveAgeElement) {
      stopLiveAgeElement(this._liveAgeElement);
    }

    this._liveAgeElement = createLiveAgeElement(10);
    this._liveAgeElement.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #00d9ff;
    `;

    const container = document.createElement('span');
    container.appendChild(this._liveAgeElement);
    container.appendChild(document.createTextNode(' years'));

    return container;
  }

  /**
   * Add animation styles
   */
  private _addAnimationStyles(): void {
    if (document.getElementById('stats-animation-style')) return;

    const style = document.createElement('style');
    style.id = 'stats-animation-style';
    style.textContent = `
      @keyframes statsSlideIn {
        from {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handle click outside panel
   */
  private _handleOutsideClick = (event: MouseEvent): void => {
    if (this._container && !this._container.contains(event.target as Node)) {
      this.close();
    }
  };

  /**
   * Setup escape key handler
   */
  private _setupEscapeHandler(): void {
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', handler);
    
    // Store handler for cleanup
    (this._container as HTMLDivElement & { _escHandler?: (e: KeyboardEvent) => void })._escHandler = handler;
  }

  /**
   * Destroy the panel
   */
  private _destroyPanel(): void {
    if (this._liveAgeElement) {
      stopLiveAgeElement(this._liveAgeElement);
      this._liveAgeElement = null;
    }

    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }

    document.removeEventListener('click', this._handleOutsideClick);

    if (this._container) {
      const escHandler = (this._container as HTMLDivElement & { _escHandler?: (e: KeyboardEvent) => void })._escHandler;
      if (escHandler) {
        window.removeEventListener('keydown', escHandler);
      }
      this._container.remove();
      this._container = null;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.close();
  }
}

// Singleton instance
let _instance: StatsBoard | null = null;

export function getStatsBoard(): StatsBoard {
  if (!_instance) {
    _instance = new StatsBoard();
  }
  return _instance;
}


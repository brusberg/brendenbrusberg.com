/**
 * DarkMode - Theme system with light/dark mode toggle
 * Affects background colors, UI elements, and provides tint values for sprites
 */

import type { Color } from '@/types';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: Color;
  backgroundAlt: Color;
  text: Color;
  textMuted: Color;
  accent: Color;
  uiBackground: Color;
  uiBorder: Color;
}

const LIGHT_THEME: ThemeColors = {
  background: { r: 0.85, g: 0.9, b: 0.95, a: 1 },      // Light blue-gray
  backgroundAlt: { r: 0.8, g: 0.85, b: 0.9, a: 1 },    // Slightly darker
  text: { r: 0.1, g: 0.1, b: 0.15, a: 1 },             // Dark text
  textMuted: { r: 0.4, g: 0.4, b: 0.45, a: 1 },        // Muted text
  accent: { r: 0.2, g: 0.6, b: 0.9, a: 1 },            // Blue accent
  uiBackground: { r: 1, g: 1, b: 1, a: 0.95 },         // White UI
  uiBorder: { r: 0.7, g: 0.7, b: 0.75, a: 1 },         // Light border
};

const DARK_THEME: ThemeColors = {
  background: { r: 0.1, g: 0.1, b: 0.18, a: 1 },       // Dark blue
  backgroundAlt: { r: 0.12, g: 0.12, b: 0.22, a: 1 },  // Slightly lighter
  text: { r: 0.95, g: 0.95, b: 0.98, a: 1 },           // Light text
  textMuted: { r: 0.6, g: 0.6, b: 0.65, a: 1 },        // Muted text
  accent: { r: 0, g: 0.85, b: 1, a: 1 },               // Cyan accent
  uiBackground: { r: 0.15, g: 0.15, b: 0.2, a: 0.95 }, // Dark UI
  uiBorder: { r: 0.3, g: 0.3, b: 0.35, a: 1 },         // Dark border
};

const STORAGE_KEY = 'theme-mode';

export class DarkMode {
  private _mode: ThemeMode;
  private _colors: ThemeColors;
  private _listeners: Set<(mode: ThemeMode) => void> = new Set();

  constructor() {
    // Load saved preference or default to light (ON = lights are on)
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    this._mode = saved ?? 'light';
    this._colors = this._mode === 'dark' ? DARK_THEME : LIGHT_THEME;
    
    // Apply initial theme
    this._applyThemeToDOM();
  }

  /**
   * Get current theme mode
   */
  get mode(): ThemeMode {
    return this._mode;
  }

  /**
   * Get current theme colors
   */
  get colors(): ThemeColors {
    return this._colors;
  }

  /**
   * Check if dark mode is active
   */
  get isDark(): boolean {
    return this._mode === 'dark';
  }

  /**
   * Toggle between light and dark mode
   */
  toggle(): void {
    this.setMode(this._mode === 'dark' ? 'light' : 'dark');
  }

  /**
   * Set specific theme mode
   */
  setMode(mode: ThemeMode): void {
    if (this._mode === mode) return;

    this._mode = mode;
    this._colors = mode === 'dark' ? DARK_THEME : LIGHT_THEME;

    // Save preference
    localStorage.setItem(STORAGE_KEY, mode);

    // Apply to DOM
    this._applyThemeToDOM();

    // Notify listeners
    for (const listener of this._listeners) {
      listener(mode);
    }
  }

  /**
   * Subscribe to theme changes
   */
  onChange(callback: (mode: ThemeMode) => void): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  /**
   * Apply theme to DOM elements (CSS variables)
   */
  private _applyThemeToDOM(): void {
    const root = document.documentElement;
    const c = this._colors;

    root.style.setProperty('--bg-color', this._colorToCSS(c.background));
    root.style.setProperty('--bg-alt-color', this._colorToCSS(c.backgroundAlt));
    root.style.setProperty('--text-color', this._colorToCSS(c.text));
    root.style.setProperty('--text-muted-color', this._colorToCSS(c.textMuted));
    root.style.setProperty('--accent-color', this._colorToCSS(c.accent));
    root.style.setProperty('--ui-bg-color', this._colorToCSS(c.uiBackground));
    root.style.setProperty('--ui-border-color', this._colorToCSS(c.uiBorder));

    // Also set body background for loading states
    document.body.style.backgroundColor = this._colorToCSS(c.background);
  }

  /**
   * Convert Color to CSS rgba string
   */
  private _colorToCSS(color: Color): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${color.a})`;
  }

  /**
   * Get a tint color for sprites based on current theme
   * This can be used to slightly tint sprites in light/dark mode
   */
  getSpriteTint(): Color {
    if (this._mode === 'dark') {
      // Slightly blue tint in dark mode
      return { r: 0.9, g: 0.9, b: 1.0, a: 1 };
    } else {
      // Warm tint in light mode
      return { r: 1.0, g: 0.98, b: 0.95, a: 1 };
    }
  }
}

// Singleton instance
let _instance: DarkMode | null = null;

export function getDarkMode(): DarkMode {
  if (!_instance) {
    _instance = new DarkMode();
  }
  return _instance;
}


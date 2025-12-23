/**
 * TodoAreas - Coming Soon areas with placeholder content
 * 5 areas: Projects, Art/Poetry Gallery, House, Inspiration, Mentors
 */

import type { Sprite, Color, Vector2 } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import type { MockupTextureLoader } from '@/engine/MockupTextureLoader';
import { TODO_LOCATIONS } from './WorldLayout';
import { getDarkMode } from './DarkMode';

export interface TodoAreaContent {
  title: string;
  description: string;
  placeholderContent: string;
  icon: string;
}

const AREA_CONTENT: Record<string, TodoAreaContent> = {
  projects: {
    title: 'Projects',
    description: 'Coming Soon',
    placeholderContent: `
      <h3>🚀 Featured Project</h3>
      <div class="project-card">
        <h4>Example Project Name</h4>
        <p>A brief description of an amazing project that showcases skills in TypeScript, WebGL, and creative coding.</p>
        <div class="tags">
          <span class="tag">TypeScript</span>
          <span class="tag">WebGL</span>
          <span class="tag">Creative</span>
        </div>
      </div>
      <p class="hint">More projects coming soon...</p>
    `,
    icon: '🚀',
  },
  gallery: {
    title: 'Art & Poetry',
    description: 'Coming Soon',
    placeholderContent: `
      <h3>🎨 Gallery</h3>
      <div class="article-preview">
        <h4>Sample Article Title</h4>
        <p class="date">January 1, 2025</p>
        <p>This is a preview of what articles and poetry will look like. Markdown support coming soon...</p>
        <blockquote>"A sample quote or poem excerpt would go here."</blockquote>
      </div>
      <p class="hint">Articles, poetry, and paintings coming soon...</p>
    `,
    icon: '🎨',
  },
  house: {
    title: 'House',
    description: 'Home Base',
    placeholderContent: `
      <h3>🏠 Welcome Home</h3>
      <p>This is your home base in the game world.</p>
      <p>Future features:</p>
      <ul>
        <li>Character customization</li>
        <li>Achievement display</li>
        <li>Settings and preferences</li>
      </ul>
      <p class="hint">Make yourself at home...</p>
    `,
    icon: '🏠',
  },
  inspiration: {
    title: 'Inspiration',
    description: 'Coming Soon',
    placeholderContent: `
      <h3>💡 Inspiration</h3>
      <div class="quote-card">
        <blockquote>
          "The only way to do great work is to love what you do."
        </blockquote>
        <cite>— Steve Jobs</cite>
      </div>
      <p class="hint">More quotes and inspiration coming soon...</p>
    `,
    icon: '💡',
  },
  mentors: {
    title: 'Mentors',
    description: 'Coming Soon',
    placeholderContent: `
      <h3>👥 Mentors</h3>
      <div class="mentor-card">
        <div class="mentor-avatar">👤</div>
        <div class="mentor-info">
          <h4>Mentor Name</h4>
          <p class="role">Role / Company</p>
          <p>A brief tribute to people who have helped along the way.</p>
        </div>
      </div>
      <p class="hint">Gratitude section coming soon...</p>
    `,
    icon: '👥',
  },
};

export class TodoAreas {
  private _signSprite: Sprite | null = null;
  private _openPanel: string | null = null;
  private _panelContainer: HTMLDivElement | null = null;

  constructor(mockupLoader: MockupTextureLoader) {
    this._signSprite = mockupLoader.getSprite('sign');
    this._addStyles();
  }

  /**
   * Add CSS styles for TODO panels
   */
  private _addStyles(): void {
    if (document.getElementById('todo-area-styles')) return;

    const style = document.createElement('style');
    style.id = 'todo-area-styles';
    style.textContent = `
      .todo-panel {
        font-family: 'Courier New', monospace;
      }
      .todo-panel h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        border-bottom: 1px solid var(--ui-border-color, #333);
        padding-bottom: 8px;
      }
      .todo-panel h4 {
        margin: 0 0 8px 0;
        font-size: 15px;
      }
      .todo-panel p {
        margin: 8px 0;
        line-height: 1.5;
      }
      .todo-panel .hint {
        font-style: italic;
        opacity: 0.6;
        font-size: 12px;
        margin-top: 16px;
      }
      .todo-panel .project-card,
      .todo-panel .article-preview,
      .todo-panel .quote-card,
      .todo-panel .mentor-card {
        background: rgba(128, 128, 128, 0.1);
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0;
      }
      .todo-panel .tags {
        display: flex;
        gap: 6px;
        margin-top: 8px;
      }
      .todo-panel .tag {
        background: var(--accent-color, #00d9ff);
        color: #000;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
      }
      .todo-panel blockquote {
        border-left: 3px solid var(--accent-color, #00d9ff);
        margin: 12px 0;
        padding-left: 12px;
        font-style: italic;
      }
      .todo-panel cite {
        display: block;
        text-align: right;
        opacity: 0.7;
        font-size: 12px;
      }
      .todo-panel .date {
        font-size: 11px;
        opacity: 0.6;
      }
      .todo-panel ul {
        margin: 8px 0;
        padding-left: 20px;
      }
      .todo-panel li {
        margin: 4px 0;
      }
      .todo-panel .mentor-card {
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .todo-panel .mentor-avatar {
        font-size: 32px;
      }
      .todo-panel .mentor-info .role {
        font-size: 12px;
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Check if an area panel is currently open
   */
  get isOpen(): boolean {
    return this._openPanel !== null;
  }

  /**
   * Get the currently open area ID
   */
  get openAreaId(): string | null {
    return this._openPanel;
  }

  /**
   * Open a TODO area panel
   */
  open(areaId: string): void {
    if (this._openPanel === areaId) return;
    if (this._openPanel) this.close();

    const content = AREA_CONTENT[areaId];
    if (!content) return;

    this._openPanel = areaId;
    this._createPanel(content);
  }

  /**
   * Close the current panel
   */
  close(): void {
    if (!this._openPanel) return;
    this._openPanel = null;
    this._destroyPanel();
  }

  /**
   * Toggle an area panel
   */
  toggle(areaId: string): void {
    if (this._openPanel === areaId) {
      this.close();
    } else {
      this.open(areaId);
    }
  }

  /**
   * Create the panel DOM
   */
  private _createPanel(content: TodoAreaContent): void {
    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    this._panelContainer = document.createElement('div');
    this._panelContainer.className = 'todo-panel';
    this._panelContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${isDark ? 'rgba(20, 25, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)'};
      color: ${isDark ? '#e8e8e8' : '#1a1a2e'};
      border: 2px solid ${isDark ? '#00d9ff' : '#2c3e50'};
      border-radius: 12px;
      padding: 24px 32px;
      min-width: 350px;
      max-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: todoSlideIn 0.3s ease-out;
    `;

    // Add animation
    this._addAnimationStyles();

    // Title with icon
    const title = document.createElement('div');
    title.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    `;

    const titleText = document.createElement('h2');
    titleText.textContent = `${content.icon} ${content.title}`;
    titleText.style.cssText = `
      margin: 0;
      font-size: 20px;
      color: ${isDark ? '#00d9ff' : '#2c3e50'};
    `;
    title.appendChild(titleText);

    // Coming Soon badge
    const badge = document.createElement('span');
    badge.textContent = content.description;
    badge.style.cssText = `
      background: ${isDark ? '#442244' : '#ffe4e4'};
      color: ${isDark ? '#ff88ff' : '#884444'};
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: bold;
    `;
    title.appendChild(badge);

    this._panelContainer.appendChild(title);

    // Content
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = content.placeholderContent;
    this._panelContainer.appendChild(contentDiv);

    // Close button
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
    this._panelContainer.appendChild(closeBtn);

    // Hint to close
    const hint = document.createElement('p');
    hint.textContent = 'Press ESC or click outside to close';
    hint.style.cssText = `
      margin: 16px 0 0 0;
      font-size: 11px;
      color: ${isDark ? '#666' : '#999'};
      text-align: center;
    `;
    this._panelContainer.appendChild(hint);

    document.body.appendChild(this._panelContainer);

    // Event handlers
    this._setupEventHandlers();
  }

  /**
   * Add animation styles
   */
  private _addAnimationStyles(): void {
    if (document.getElementById('todo-animation-style')) return;

    const style = document.createElement('style');
    style.id = 'todo-animation-style';
    style.textContent = `
      @keyframes todoSlideIn {
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
   * Setup event handlers
   */
  private _setupEventHandlers(): void {
    const escHandler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        this.close();
      }
    };
    window.addEventListener('keydown', escHandler);

    if (this._panelContainer) {
      (this._panelContainer as HTMLDivElement & { _escHandler?: (e: KeyboardEvent) => void })._escHandler = escHandler;
    }

    setTimeout(() => {
      document.addEventListener('click', this._handleOutsideClick);
    }, 100);
  }

  /**
   * Handle click outside panel
   */
  private _handleOutsideClick = (event: MouseEvent): void => {
    if (this._panelContainer && !this._panelContainer.contains(event.target as Node)) {
      this.close();
    }
  };

  /**
   * Destroy the panel
   */
  private _destroyPanel(): void {
    document.removeEventListener('click', this._handleOutsideClick);

    if (this._panelContainer) {
      const escHandler = (this._panelContainer as HTMLDivElement & { _escHandler?: (e: KeyboardEvent) => void })._escHandler;
      if (escHandler) {
        window.removeEventListener('keydown', escHandler);
      }
      this._panelContainer.remove();
      this._panelContainer = null;
    }
  }

  /**
   * Render all TODO signs in the world
   */
  render(batch: SpriteBatch, offsetX: number, offsetY: number, playerPos: Vector2): void {
    if (!this._signSprite) return;

    for (const location of TODO_LOCATIONS) {
      const pos = location.position;
      const sprite = this._signSprite;

      // Position sign (anchor at bottom center)
      const x = pos.x - sprite.width / 2 + offsetX;
      const y = pos.y - sprite.height + offsetY;

      // Check if player is nearby
      const dx = playerPos.x - pos.x;
      const dy = playerPos.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isNearby = dist < 250; // Increased for 3x scale

      // Highlight if nearby
      let tint: Color = { r: 1, g: 1, b: 1, a: 1 };
      if (isNearby) {
        tint = { r: 1.2, g: 1.1, b: 0.9, a: 1 };
      }

      batch.draw(sprite, x, y, sprite.width, sprite.height, 0, tint);

      // Draw label above sign
      this._renderLabel(batch, pos.x + offsetX, pos.y - sprite.height - 10 + offsetY, location.label ?? location.id, isNearby);

      // Draw interaction hint if nearby
      if (isNearby && !this._openPanel) {
        const time = performance.now() / 500;
        const bob = Math.sin(time) * 3;
        batch.drawRect(
          pos.x - 6 + offsetX,
          pos.y - sprite.height - 24 + bob + offsetY,
          12,
          8,
          { r: 1, g: 1, b: 1, a: 0.8 }
        );
      }
    }
  }

  /**
   * Render a text label (using colored rectangles as placeholder)
   */
  private _renderLabel(
    batch: SpriteBatch,
    x: number,
    y: number,
    _text: string,
    highlight: boolean
  ): void {
    // Simple colored bar as label placeholder
    const color: Color = highlight
      ? { r: 1, g: 0.9, b: 0.5, a: 0.9 }
      : { r: 0.6, g: 0.6, b: 0.6, a: 0.7 };

    batch.drawRect(x - 25, y, 50, 6, color);
  }

  /**
   * Get area at position (for interaction)
   */
  getAreaAt(x: number, y: number, radius: number): string | null {
    for (const location of TODO_LOCATIONS) {
      const pos = location.position;
      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        return location.id;
      }
    }
    return null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.close();
  }
}


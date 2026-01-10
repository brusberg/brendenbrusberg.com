/**
 * ContentPanel - Reusable panel system for rendering text/image content
 * Similar to WorldStats but more flexible for various content types
 */

import type { Sprite, Color } from '@/types';
import type { SpriteBatch } from '@/engine/SpriteBatch';
import { TextRenderer } from '@/engine/TextRenderer';
import { getDarkMode } from './DarkMode';

export interface ContentPanelConfig {
  title: string;
  width?: number;
  maxHeight?: number;
  fontSize?: number;
  showBorder?: boolean;
}

export interface TextContent {
  type: 'text';
  title?: string;
  body: string;
  links?: Array<{ label: string; url: string; icon?: string }>;
}

export interface PoemContent {
  type: 'poem';
  title: string;
  date?: string;
  lines: string[];
}

export interface ImageContent {
  type: 'image';
  title: string;
  description?: string;
  imageUrl: string;
}

export type PanelContent = TextContent | PoemContent | ImageContent;

const DEFAULT_CONFIG: Required<ContentPanelConfig> = {
  title: 'Content',
  width: 400,
  maxHeight: 500,
  fontSize: 16,
  showBorder: true,
};

export class ContentPanel {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _textRenderer: TextRenderer;
  private _sprite: Sprite | null = null;
  private _config: Required<ContentPanelConfig>;
  private _content: PanelContent | null = null;
  private _needsUpdate: boolean = true;

  constructor(gl: WebGL2RenderingContext, config: ContentPanelConfig) {
    this._gl = gl;
    this._textRenderer = new TextRenderer(gl);
    this._config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set the content to display
   */
  setContent(content: PanelContent): void {
    this._content = content;
    this._needsUpdate = true;
  }

  /**
   * Update panel (re-render if needed)
   */
  update(): void {
    if (!this._needsUpdate || !this._content) return;
    this._needsUpdate = false;
    this._renderContent();
  }

  /**
   * Render content to texture
   */
  private _renderContent(): void {
    if (!this._content) return;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    switch (this._content.type) {
      case 'text':
        this._renderTextContent(this._content, isDark);
        break;
      case 'poem':
        this._renderPoemContent(this._content, isDark);
        break;
      case 'image':
        this._renderImageContent(this._content, isDark);
        break;
    }
  }

  /**
   * Render text content panel
   */
  private _renderTextContent(content: TextContent, isDark: boolean): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 20;
    const lineHeight = this._config.fontSize * 1.5;
    const titleHeight = content.title ? 40 : 0;
    
    // Measure text
    ctx.font = `${this._config.fontSize}px 'Courier New', monospace`;
    const words = content.body.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    const maxWidth = this._config.width - padding * 2;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    // Add links section
    const linkLines: string[] = [];
    if (content.links && content.links.length > 0) {
      linkLines.push(''); // spacer
      for (const link of content.links) {
        linkLines.push(`${link.icon || '→'} ${link.label}`);
      }
    }

    const totalLines = lines.length + linkLines.length;
    const height = Math.min(
      titleHeight + totalLines * lineHeight + padding * 2,
      this._config.maxHeight
    );

    canvas.width = this._config.width;
    canvas.height = height;

    // Background
    ctx.fillStyle = isDark ? 'rgba(20, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    if (this._config.showBorder) {
      ctx.strokeStyle = isDark ? '#00d9ff' : '#2563eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    // Title
    let y = padding;
    if (content.title) {
      ctx.font = `bold ${this._config.fontSize * 1.2}px 'Courier New', monospace`;
      ctx.fillStyle = isDark ? '#00d9ff' : '#2563eb';
      ctx.fillText(content.title, padding, y + this._config.fontSize);
      y += titleHeight;
    }

    // Body text
    ctx.font = `${this._config.fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = isDark ? '#e0e0e0' : '#333333';
    for (const line of lines) {
      ctx.fillText(line, padding, y + this._config.fontSize);
      y += lineHeight;
    }

    // Links
    if (linkLines.length > 0) {
      ctx.fillStyle = isDark ? '#00d9ff' : '#2563eb';
      for (const line of linkLines) {
        if (line) {
          ctx.fillText(line, padding, y + this._config.fontSize);
        }
        y += lineHeight;
      }
    }

    this._createSpriteFromCanvas(canvas);
  }

  /**
   * Render poem content panel
   */
  private _renderPoemContent(content: PoemContent, isDark: boolean): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 24;
    const lineHeight = this._config.fontSize * 1.8;
    const titleHeight = 50;
    const dateHeight = content.date ? 25 : 0;

    const height = Math.min(
      titleHeight + dateHeight + content.lines.length * lineHeight + padding * 2,
      this._config.maxHeight
    );

    canvas.width = this._config.width;
    canvas.height = height;

    // Background
    ctx.fillStyle = isDark ? 'rgba(25, 20, 35, 0.95)' : 'rgba(255, 252, 248, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border (poetic style)
    if (this._config.showBorder) {
      ctx.strokeStyle = isDark ? '#a855f7' : '#7c3aed';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    let y = padding;

    // Title
    ctx.font = `italic bold ${this._config.fontSize * 1.3}px Georgia, serif`;
    ctx.fillStyle = isDark ? '#a855f7' : '#7c3aed';
    ctx.fillText(content.title, padding, y + this._config.fontSize);
    y += titleHeight;

    // Date
    if (content.date) {
      ctx.font = `${this._config.fontSize * 0.8}px 'Courier New', monospace`;
      ctx.fillStyle = isDark ? '#888888' : '#666666';
      ctx.fillText(content.date, padding, y);
      y += dateHeight;
    }

    // Poem lines
    ctx.font = `italic ${this._config.fontSize}px Georgia, serif`;
    ctx.fillStyle = isDark ? '#d0d0d0' : '#2a2a2a';
    for (const line of content.lines) {
      ctx.fillText(line, padding, y + this._config.fontSize);
      y += lineHeight;
    }

    this._createSpriteFromCanvas(canvas);
  }

  /**
   * Render image content panel (placeholder for now)
   */
  private _renderImageContent(content: ImageContent, isDark: boolean): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 20;
    const titleHeight = 40;
    const descHeight = content.description ? 60 : 0;
    const imageHeight = 200;

    canvas.width = this._config.width;
    canvas.height = titleHeight + imageHeight + descHeight + padding * 2;

    // Background
    ctx.fillStyle = isDark ? 'rgba(20, 25, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    if (this._config.showBorder) {
      ctx.strokeStyle = isDark ? '#f59e0b' : '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }

    let y = padding;

    // Title
    ctx.font = `bold ${this._config.fontSize * 1.2}px 'Courier New', monospace`;
    ctx.fillStyle = isDark ? '#f59e0b' : '#d97706';
    ctx.fillText(content.title, padding, y + this._config.fontSize);
    y += titleHeight;

    // Image placeholder
    ctx.fillStyle = isDark ? 'rgba(50, 50, 60, 0.5)' : 'rgba(200, 200, 200, 0.5)';
    ctx.fillRect(padding, y, canvas.width - padding * 2, imageHeight);
    ctx.strokeStyle = isDark ? '#666' : '#ccc';
    ctx.strokeRect(padding, y, canvas.width - padding * 2, imageHeight);
    
    // Placeholder text
    ctx.font = `${this._config.fontSize}px 'Courier New', monospace`;
    ctx.fillStyle = isDark ? '#888' : '#999';
    ctx.textAlign = 'center';
    ctx.fillText('🖼 Image', canvas.width / 2, y + imageHeight / 2);
    ctx.textAlign = 'left';
    y += imageHeight + 10;

    // Description
    if (content.description) {
      ctx.font = `${this._config.fontSize * 0.9}px 'Courier New', monospace`;
      ctx.fillStyle = isDark ? '#aaaaaa' : '#555555';
      ctx.fillText(content.description, padding, y + this._config.fontSize);
    }

    this._createSpriteFromCanvas(canvas);
  }

  /**
   * Create WebGL sprite from canvas
   */
  private _createSpriteFromCanvas(canvas: HTMLCanvasElement): void {
    const gl = this._gl;
    
    let texture = gl.createTexture();
    if (!texture) return;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    this._sprite = {
      texture,
      width: canvas.width,
      height: canvas.height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };
  }

  /**
   * Render the panel at a world position
   */
  render(batch: SpriteBatch, worldX: number, worldY: number, offsetX: number, offsetY: number): void {
    if (!this._sprite) return;

    const x = worldX - this._sprite.width / 2 + offsetX;
    const y = worldY - this._sprite.height + offsetY;

    batch.draw(this._sprite, x, y, this._sprite.width, this._sprite.height);
  }

  /**
   * Get sprite dimensions
   */
  get width(): number {
    return this._sprite?.width ?? 0;
  }

  get height(): number {
    return this._sprite?.height ?? 0;
  }

  /**
   * Force re-render on next update
   */
  invalidate(): void {
    this._needsUpdate = true;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this._sprite?.texture) {
      this._gl.deleteTexture(this._sprite.texture);
    }
    this._textRenderer.dispose();
  }
}




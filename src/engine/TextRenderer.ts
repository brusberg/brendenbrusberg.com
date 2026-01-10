/**
 * TextRenderer - Renders text to a canvas and converts to WebGL texture
 * Used for in-world text rendering (stats, labels, etc.)
 */

import type { Sprite } from '@/types';

export interface TextStyle {
  font?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  padding?: number;
  lineHeight?: number;
  maxWidth?: number;
}

const DEFAULT_STYLE: Required<TextStyle> = {
  font: '',
  fontSize: 24,
  fontFamily: "'Courier New', monospace",
  color: '#ffffff',
  backgroundColor: 'transparent',
  padding: 16,
  lineHeight: 1.4,
  maxWidth: 800,
};

export class TextRenderer {
  private readonly _gl: WebGL2RenderingContext;
  private readonly _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D;
  private _texture: WebGLTexture | null = null;
  private _width: number = 0;
  private _height: number = 0;
  private _lastText: string = '';

  constructor(gl: WebGL2RenderingContext) {
    this._gl = gl;
    this._canvas = document.createElement('canvas');
    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context for TextRenderer');
    this._ctx = ctx;
  }

  /**
   * Render text to texture and return a sprite
   */
  renderText(text: string, style: TextStyle = {}): Sprite {
    const s = { ...DEFAULT_STYLE, ...style };
    const font = s.font || `${s.fontSize}px ${s.fontFamily}`;
    
    // Measure text to determine canvas size
    this._ctx.font = font;
    const lines = this._wrapText(text, s.maxWidth - s.padding * 2);
    
    // Calculate dimensions
    let maxLineWidth = 0;
    for (const line of lines) {
      const metrics = this._ctx.measureText(line);
      maxLineWidth = Math.max(maxLineWidth, metrics.width);
    }
    
    const lineHeightPx = s.fontSize * s.lineHeight;
    const textHeight = lines.length * lineHeightPx;
    
    this._width = Math.ceil(maxLineWidth + s.padding * 2);
    this._height = Math.ceil(textHeight + s.padding * 2);
    
    // Resize canvas
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    
    // Clear and draw background
    this._ctx.clearRect(0, 0, this._width, this._height);
    if (s.backgroundColor !== 'transparent') {
      this._ctx.fillStyle = s.backgroundColor;
      this._ctx.fillRect(0, 0, this._width, this._height);
    }
    
    // Draw text
    this._ctx.font = font;
    this._ctx.fillStyle = s.color;
    this._ctx.textBaseline = 'top';
    
    let y = s.padding;
    for (const line of lines) {
      this._ctx.fillText(line, s.padding, y);
      y += lineHeightPx;
    }
    
    // Update texture
    this._updateTexture();
    this._lastText = text;
    
    return this._createSprite();
  }

  /**
   * Render multiple lines with labels and values (for stats)
   */
  renderStats(
    stats: Array<{ label: string; value: string; highlight?: boolean }>,
    title: string,
    style: TextStyle = {}
  ): Sprite {
    const s = { ...DEFAULT_STYLE, ...style };
    const titleFont = `bold ${s.fontSize * 1.2}px ${s.fontFamily}`;
    const labelFont = `${s.fontSize}px ${s.fontFamily}`;
    const valueFont = `bold ${s.fontSize}px ${s.fontFamily}`;
    
    // Calculate dimensions
    this._ctx.font = titleFont;
    const titleMetrics = this._ctx.measureText(title);
    
    this._ctx.font = labelFont;
    let maxLabelWidth = 0;
    let maxValueWidth = 0;
    for (const stat of stats) {
      const labelMetrics = this._ctx.measureText(stat.label + ':');
      const valueMetrics = this._ctx.measureText(stat.value);
      maxLabelWidth = Math.max(maxLabelWidth, labelMetrics.width);
      maxValueWidth = Math.max(maxValueWidth, valueMetrics.width);
    }
    
    const lineHeightPx = s.fontSize * s.lineHeight;
    const titleHeight = s.fontSize * 1.5;
    const gap = 40; // Gap between label and value columns
    
    this._width = Math.ceil(Math.max(titleMetrics.width, maxLabelWidth + gap + maxValueWidth) + s.padding * 2);
    this._height = Math.ceil(titleHeight + stats.length * lineHeightPx + s.padding * 2);
    
    // Resize canvas
    this._canvas.width = this._width;
    this._canvas.height = this._height;
    
    // Clear and draw background
    this._ctx.clearRect(0, 0, this._width, this._height);
    if (s.backgroundColor !== 'transparent') {
      this._ctx.fillStyle = s.backgroundColor;
      this._ctx.fillRect(0, 0, this._width, this._height);
    }
    
    // Draw title
    this._ctx.font = titleFont;
    this._ctx.fillStyle = style.color || '#888888';
    this._ctx.textBaseline = 'top';
    this._ctx.fillText(title, s.padding, s.padding);
    
    // Draw stats
    let y = s.padding + titleHeight;
    for (const stat of stats) {
      // Label
      this._ctx.font = labelFont;
      this._ctx.fillStyle = '#aaaaaa';
      this._ctx.fillText(stat.label + ':', s.padding, y);
      
      // Value
      this._ctx.font = valueFont;
      this._ctx.fillStyle = stat.highlight ? '#ff6b6b' : (style.color || '#ffffff');
      this._ctx.textAlign = 'right';
      this._ctx.fillText(stat.value, this._width - s.padding, y);
      this._ctx.textAlign = 'left';
      
      y += lineHeightPx;
    }
    
    // Update texture
    this._updateTexture();
    
    return this._createSprite();
  }

  /**
   * Wrap text to fit within maxWidth
   */
  private _wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = text.split('\n');
    
    for (const paragraph of paragraphs) {
      const words = paragraph.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const metrics = this._ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
    }
    
    return lines;
  }

  /**
   * Update the WebGL texture from canvas
   */
  private _updateTexture(): void {
    const gl = this._gl;
    
    if (!this._texture) {
      const texture = gl.createTexture();
      if (!texture) throw new Error('Failed to create text texture');
      this._texture = texture;
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this._canvas
    );
    
    // Use linear filtering for smoother text
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  /**
   * Create a sprite from the current texture
   */
  private _createSprite(): Sprite {
    if (!this._texture) {
      throw new Error('No texture available');
    }
    
    return {
      texture: this._texture,
      width: this._width,
      height: this._height,
      u0: 0,
      v0: 0,
      u1: 1,
      v1: 1,
    };
  }

  /**
   * Get current dimensions
   */
  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /**
   * Check if text has changed
   */
  hasChanged(text: string): boolean {
    return text !== this._lastText;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this._texture) {
      this._gl.deleteTexture(this._texture);
      this._texture = null;
    }
  }
}




/**
 * ResumeViewer - PDF display modal with fullscreen and download options
 */

import { getDarkMode } from './DarkMode';

// Note: filename has space - URL encoded
const DEFAULT_RESUME_PATH = '/assets/Brenden_Brusberg_Resume%20(1).pdf';

export class ResumeViewer {
  private _isOpen: boolean = false;
  private _isFullscreen: boolean = false;
  private _container: HTMLDivElement | null = null;
  private _resumePath: string;

  constructor(resumePath: string = DEFAULT_RESUME_PATH) {
    this._resumePath = resumePath;
  }

  /**
   * Check if viewer is currently open
   */
  get isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Check if viewer is in fullscreen mode
   */
  get isFullscreen(): boolean {
    return this._isFullscreen;
  }

  /**
   * Open the resume viewer
   */
  open(): void {
    if (this._isOpen) return;
    this._isOpen = true;
    this._createViewer();
  }

  /**
   * Close the resume viewer
   */
  close(): void {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._isFullscreen = false;
    this._destroyViewer();
  }

  /**
   * Toggle the resume viewer
   */
  toggle(): void {
    if (this._isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Enter fullscreen mode
   */
  enterFullscreen(): void {
    if (!this._container) return;
    
    this._isFullscreen = true;
    this._container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 2000;
      display: flex;
      flex-direction: column;
    `;

    // Update buttons
    this._updateButtonStates();
  }

  /**
   * Exit fullscreen mode
   */
  exitFullscreen(): void {
    if (!this._container) return;
    
    this._isFullscreen = false;
    this._applyDefaultStyles();
    this._updateButtonStates();
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen(): void {
    if (this._isFullscreen) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen();
    }
  }

  /**
   * Download the resume PDF
   */
  download(): void {
    const link = document.createElement('a');
    link.href = this._resumePath;
    link.download = 'resume.pdf';
    link.click();
  }

  /**
   * Create the viewer DOM
   */
  private _createViewer(): void {
    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    // Create container
    this._container = document.createElement('div');
    this._container.id = 'resume-viewer';
    this._applyDefaultStyles();

    // Add animation styles
    this._addAnimationStyles();

    // Header with controls
    const header = this._createHeader(isDark);
    this._container.appendChild(header);

    // PDF iframe
    const iframe = document.createElement('iframe');
    iframe.src = this._resumePath;
    iframe.style.cssText = `
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    `;
    iframe.title = 'Resume';
    this._container.appendChild(iframe);

    // Error fallback
    iframe.onerror = () => {
      iframe.style.display = 'none';
      const errorMsg = document.createElement('div');
      errorMsg.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        color: ${isDark ? '#888' : '#666'};
        font-family: 'Courier New', monospace;
      `;
      errorMsg.innerHTML = `
        <p style="font-size: 18px; margin-bottom: 16px;">📄 Resume not found</p>
        <p style="font-size: 14px;">Place your resume at: ${this._resumePath}</p>
      `;
      this._container?.appendChild(errorMsg);
    };

    // Add to DOM
    document.body.appendChild(this._container);

    // Setup event handlers
    this._setupEventHandlers();
  }

  /**
   * Apply default (non-fullscreen) styles
   */
  private _applyDefaultStyles(): void {
    if (!this._container) return;

    const darkMode = getDarkMode();
    const isDark = darkMode.isDark;

    this._container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80vw;
      max-width: 900px;
      height: 85vh;
      background: ${isDark ? '#1a1a2e' : '#f5f5f5'};
      border: 2px solid ${isDark ? '#00d9ff' : '#2c3e50'};
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      animation: resumeSlideIn 0.3s ease-out;
    `;
  }

  /**
   * Create header with controls
   */
  private _createHeader(isDark: boolean): HTMLDivElement {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: ${isDark ? '#141420' : '#e8e8e8'};
      border-bottom: 1px solid ${isDark ? '#333' : '#ccc'};
    `;

    // Title
    const title = document.createElement('span');
    title.textContent = '📄 Resume';
    title.style.cssText = `
      font-family: 'Courier New', monospace;
      font-size: 16px;
      font-weight: bold;
      color: ${isDark ? '#00d9ff' : '#2c3e50'};
    `;
    header.appendChild(title);

    // Buttons container
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '8px';

    // Download button
    const downloadBtn = this._createButton('⬇ Download', isDark, () => this.download());
    downloadBtn.id = 'resume-download-btn';
    buttons.appendChild(downloadBtn);

    // Fullscreen button
    const fullscreenBtn = this._createButton('⛶ Fullscreen', isDark, () => this.toggleFullscreen());
    fullscreenBtn.id = 'resume-fullscreen-btn';
    buttons.appendChild(fullscreenBtn);

    // Close button
    const closeBtn = this._createButton('✕ Close', isDark, () => this.close());
    closeBtn.style.background = isDark ? '#442222' : '#ffdddd';
    buttons.appendChild(closeBtn);

    header.appendChild(buttons);
    return header;
  }

  /**
   * Create a styled button
   */
  private _createButton(
    text: string, 
    isDark: boolean, 
    onClick: () => void
  ): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      background: ${isDark ? '#2a2a3e' : '#ddd'};
      color: ${isDark ? '#e8e8e8' : '#333'};
      border: 1px solid ${isDark ? '#444' : '#bbb'};
      border-radius: 6px;
      padding: 6px 12px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    btn.addEventListener('mouseenter', () => {
      btn.style.background = isDark ? '#3a3a4e' : '#ccc';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = isDark ? '#2a2a3e' : '#ddd';
    });
    btn.addEventListener('click', onClick);

    return btn;
  }

  /**
   * Update button states based on fullscreen mode
   */
  private _updateButtonStates(): void {
    const fullscreenBtn = document.getElementById('resume-fullscreen-btn');
    if (fullscreenBtn) {
      fullscreenBtn.textContent = this._isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    }
  }

  /**
   * Setup event handlers
   */
  private _setupEventHandlers(): void {
    // Escape key to close
    const escHandler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (this._isFullscreen) {
          this.exitFullscreen();
        } else {
          this.close();
        }
      }
    };
    window.addEventListener('keydown', escHandler);

    // Store handler for cleanup
    if (this._container) {
      (this._container as HTMLDivElement & { _escHandler?: (e: KeyboardEvent) => void })._escHandler = escHandler;
    }

    // Click outside to close (but not in fullscreen)
    setTimeout(() => {
      document.addEventListener('click', this._handleOutsideClick);
    }, 100);
  }

  /**
   * Handle click outside viewer
   */
  private _handleOutsideClick = (event: MouseEvent): void => {
    if (this._isFullscreen) return;
    if (this._container && !this._container.contains(event.target as Node)) {
      this.close();
    }
  };

  /**
   * Add animation styles
   */
  private _addAnimationStyles(): void {
    if (document.getElementById('resume-animation-style')) return;

    const style = document.createElement('style');
    style.id = 'resume-animation-style';
    style.textContent = `
      @keyframes resumeSlideIn {
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
   * Destroy the viewer
   */
  private _destroyViewer(): void {
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
let _instance: ResumeViewer | null = null;

export function getResumeViewer(): ResumeViewer {
  if (!_instance) {
    _instance = new ResumeViewer();
  }
  return _instance;
}


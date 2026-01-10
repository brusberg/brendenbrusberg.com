/**
 * WorldResume - Displays the actual PDF resume in the game world
 * The PDF is rendered as an iframe that scrolls with the world
 * Clicking on it opens a fullscreen viewer for better reading
 */

import { getWorldUI } from './WorldUI';
import { INTERACTIVE_LOCATIONS } from './WorldLayout';
import { getDarkMode } from './DarkMode';

const RESUME_PATH = '/assets/Brenden_Brusberg_Resume (1).pdf';

// Size of the in-world resume display (scaled 3x)
const RESUME_WIDTH = 450;
const RESUME_HEIGHT = 600;

export class WorldResume {
  private _container: HTMLElement | null = null;
  private _fullscreenOverlay: HTMLElement | null = null;
  private _isFullscreen: boolean = false;

  constructor() {
    this._createInWorldResume();
    this._createFullscreenOverlay();
    
    // Listen for dark mode changes
    getDarkMode().onChange(() => this._updateTheme());
  }

  /**
   * Create the in-world resume display
   */
  private _createInWorldResume(): void {
    const resumeLocation = INTERACTIVE_LOCATIONS.find(l => l.id === 'resume');
    if (!resumeLocation) return;

    // Create container
    this._container = document.createElement('div');
    this._container.id = 'world-resume';
    this._container.style.cssText = `
      width: ${RESUME_WIDTH}px;
      height: ${RESUME_HEIGHT}px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    `;

    // Create iframe for PDF
    const iframe = document.createElement('iframe');
    iframe.src = RESUME_PATH;
    iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      pointer-events: none;
    `;
    this._container.appendChild(iframe);

    // Create overlay hint
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      text-align: center;
      pointer-events: none;
    `;
    hint.textContent = 'Click to view fullscreen';
    this._container.appendChild(hint);

    // Hover effect
    this._container.addEventListener('mouseenter', () => {
      if (this._container) {
        this._container.style.transform = 'scale(1.02)';
        this._container.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.4)';
      }
    });
    this._container.addEventListener('mouseleave', () => {
      if (this._container) {
        this._container.style.transform = '';
        this._container.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
      }
    });

    // Click to open fullscreen
    this._container.addEventListener('click', () => this.openFullscreen());

    // Add to world UI
    getWorldUI().addElement('resume', this._container, resumeLocation.position, 'bottom-center');
  }

  /**
   * Create the fullscreen overlay for better PDF viewing
   */
  private _createFullscreenOverlay(): void {
    this._fullscreenOverlay = document.createElement('div');
    this._fullscreenOverlay.id = 'resume-fullscreen-overlay';
    this._fullscreenOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
      box-sizing: border-box;
    `;

    // Header with close button and download
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      max-width: 900px;
      margin-bottom: 16px;
    `;

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Resume';
    title.style.cssText = `
      color: white;
      font-family: 'Courier New', monospace;
      font-size: 24px;
      margin: 0;
    `;
    header.appendChild(title);

    // Button container
    const buttons = document.createElement('div');
    buttons.style.cssText = `display: flex; gap: 12px;`;

    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.href = RESUME_PATH;
    downloadBtn.download = 'Brenden_Brusberg_Resume.pdf';
    downloadBtn.textContent = '⬇ Download';
    downloadBtn.style.cssText = `
      padding: 10px 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    `;
    downloadBtn.addEventListener('mouseenter', () => {
      downloadBtn.style.background = '#1d4ed8';
    });
    downloadBtn.addEventListener('mouseleave', () => {
      downloadBtn.style.background = '#2563eb';
    });
    buttons.appendChild(downloadBtn);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕ Close';
    closeBtn.style.cssText = `
      padding: 10px 20px;
      background: #374151;
      color: white;
      border: none;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    closeBtn.addEventListener('click', () => this.closeFullscreen());
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = '#4b5563';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = '#374151';
    });
    buttons.appendChild(closeBtn);

    header.appendChild(buttons);
    this._fullscreenOverlay.appendChild(header);

    // PDF iframe
    const pdfFrame = document.createElement('iframe');
    pdfFrame.src = RESUME_PATH;
    pdfFrame.style.cssText = `
      width: 100%;
      max-width: 900px;
      height: calc(100vh - 120px);
      border: none;
      border-radius: 8px;
      background: white;
    `;
    this._fullscreenOverlay.appendChild(pdfFrame);

    // Click outside to close
    this._fullscreenOverlay.addEventListener('click', (e) => {
      if (e.target === this._fullscreenOverlay) {
        this.closeFullscreen();
      }
    });

    // ESC to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isFullscreen) {
        this.closeFullscreen();
      }
    });

    document.body.appendChild(this._fullscreenOverlay);
  }

  /**
   * Update theme based on dark mode
   */
  private _updateTheme(): void {
    const isDark = getDarkMode().isDark;
    if (this._container) {
      this._container.style.boxShadow = isDark 
        ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
        : '0 8px 32px rgba(0, 0, 0, 0.3)';
    }
  }

  /**
   * Open fullscreen viewer
   */
  openFullscreen(): void {
    if (this._fullscreenOverlay) {
      this._fullscreenOverlay.style.display = 'flex';
      this._isFullscreen = true;
    }
  }

  /**
   * Close fullscreen viewer
   */
  closeFullscreen(): void {
    if (this._fullscreenOverlay) {
      this._fullscreenOverlay.style.display = 'none';
      this._isFullscreen = false;
    }
  }

  /**
   * Check if fullscreen is open
   */
  get isFullscreen(): boolean {
    return this._isFullscreen;
  }

  /**
   * Clean up
   */
  dispose(): void {
    if (this._container) {
      getWorldUI().removeElement('resume');
      this._container = null;
    }
    if (this._fullscreenOverlay) {
      this._fullscreenOverlay.remove();
      this._fullscreenOverlay = null;
    }
  }
}

// Singleton instance
let worldResumeInstance: WorldResume | null = null;

export function getWorldResume(): WorldResume {
  if (!worldResumeInstance) {
    worldResumeInstance = new WorldResume();
  }
  return worldResumeInstance;
}




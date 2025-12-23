/**
 * Main entry point for the WebGL Stick Figure game
 */

import { Game } from '@/game/Game';

// Application state
let game: Game | null = null;

/**
 * Initialize the application
 */
function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  const loading = document.getElementById('loading');
  const errorMessage = document.getElementById('error-message');

  if (!canvas) {
    console.error('Canvas element not found');
    return;
  }

  try {
    // Create game instance (this also initializes WebGL)
    game = new Game(canvas);

    // Start the game loop
    game.start();

    // Log controls for developers
    console.log('%c🎮 Stick Figure World', 'font-size: 20px; font-weight: bold; color: #00d9ff;');
    console.log('%cControls:', 'font-weight: bold; color: #fff;');
    console.log('  WASD or Arrow Keys - Move');
    console.log('  Space - Interact');
    console.log('  Click/Tap - Move to location');
    console.log('  Double-tap - Interact (mobile)');

  } catch (error) {
    console.error('Failed to initialize game:', error);

    // Show error message
    if (loading) {
      loading.classList.add('hidden');
    }
    if (errorMessage) {
      errorMessage.classList.add('visible');
    }
  }
}

/**
 * Cleanup on page unload
 */
function cleanup(): void {
  if (game) {
    game.dispose();
    game = null;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on unload
window.addEventListener('beforeunload', cleanup);

// Prevent context menu on canvas (for right-click interact)
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLCanvasElement) {
    e.preventDefault();
  }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game?.stop();
  } else {
    game?.start();
  }
});




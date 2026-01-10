/**
 * MockupSprites - Generate placeholder sprites with pink backgrounds (3x SCALE)
 * These can be replaced with actual hand-drawn art later
 */

// Scale factor for all sprites (3x for readability)
const SCALE = 3;

// Pink background color for all mockups
const PINK_BG = '#FF69B4';
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY = '#666666';
const DARK_GRAY = '#333333';

interface SpriteConfig {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

/**
 * Generate a mockup sprite as a canvas, which can be used as a WebGL texture
 * Includes prominent "MOCKUP" label and sprite name for easy identification
 */
export function generateMockupCanvas(config: SpriteConfig, name?: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = config.width;
  canvas.height = config.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');

  // Pink background
  ctx.fillStyle = PINK_BG;
  ctx.fillRect(0, 0, config.width, config.height);

  // Draw the sprite
  config.draw(ctx, config.width, config.height);

  // Add "MOCKUP" label at top
  const labelHeight = Math.min(20, config.height * 0.15);
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
  ctx.fillRect(0, 0, config.width, labelHeight);
  
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${Math.max(10, labelHeight * 0.7)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('MOCKUP', config.width / 2, labelHeight * 0.75);
  
  // Add sprite name at bottom if provided
  if (name) {
    const bottomLabelHeight = Math.min(16, config.height * 0.12);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, config.height - bottomLabelHeight, config.width, bottomLabelHeight);
    
    ctx.fillStyle = '#00FF00';
    ctx.font = `bold ${Math.max(8, bottomLabelHeight * 0.7)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(name.toUpperCase(), config.width / 2, config.height - bottomLabelHeight * 0.25);
  }
  
  ctx.textAlign = 'left';

  return canvas;
}

/**
 * Character mockup - simple stick figure (3x scale: 144x192)
 */
export const CHARACTER_CONFIG: SpriteConfig = {
  width: 48 * SCALE,  // 144
  height: 64 * SCALE, // 192
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.fillStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;
    ctx.lineCap = 'round';

    const centerX = w / 2;
    const s = SCALE;
    
    // Head
    ctx.beginPath();
    ctx.arc(centerX, 12 * s, 8 * s, 0, Math.PI * 2);
    ctx.stroke();

    // Body
    ctx.beginPath();
    ctx.moveTo(centerX, 20 * s);
    ctx.lineTo(centerX, 42 * s);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    ctx.moveTo(centerX - 12 * s, 28 * s);
    ctx.lineTo(centerX, 26 * s);
    ctx.lineTo(centerX + 12 * s, 28 * s);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(centerX, 42 * s);
    ctx.lineTo(centerX - 10 * s, 58 * s);
    ctx.moveTo(centerX, 42 * s);
    ctx.lineTo(centerX + 10 * s, 58 * s);
    ctx.stroke();

    // Label
    ctx.font = `${8 * s}px monospace`;
    ctx.fillText('CHAR', 8 * s, h - 2 * s);
  },
};

/**
 * Wizard mockup - stick figure with hat and staff (3x scale: 144x192)
 */
export const WIZARD_CONFIG: SpriteConfig = {
  width: 48 * SCALE,
  height: 64 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.fillStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;
    ctx.lineCap = 'round';

    const centerX = w / 2;
    const s = SCALE;

    // Wizard hat
    ctx.beginPath();
    ctx.moveTo(centerX - 10 * s, 10 * s);
    ctx.lineTo(centerX, -2 * s + 10);
    ctx.lineTo(centerX + 10 * s, 10 * s);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = DARK_GRAY;
    ctx.fill();

    // Head
    ctx.fillStyle = BLACK;
    ctx.beginPath();
    ctx.arc(centerX, 16 * s, 6 * s, 0, Math.PI * 2);
    ctx.stroke();

    // Body (robe)
    ctx.beginPath();
    ctx.moveTo(centerX, 22 * s);
    ctx.lineTo(centerX - 12 * s, 52 * s);
    ctx.lineTo(centerX + 12 * s, 52 * s);
    ctx.closePath();
    ctx.stroke();

    // Staff
    ctx.beginPath();
    ctx.moveTo(centerX + 14 * s, 8 * s);
    ctx.lineTo(centerX + 18 * s, 56 * s);
    ctx.stroke();
    
    // Staff orb
    ctx.beginPath();
    ctx.arc(centerX + 14 * s, 6 * s, 4 * s, 0, Math.PI * 2);
    ctx.fillStyle = '#8844FF';
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = BLACK;
    ctx.font = `${8 * s}px monospace`;
    ctx.fillText('WIZ', 10 * s, h - 2 * s);
  },
};

/**
 * Tree mockup (3x scale: 192x288)
 */
export const TREE_CONFIG: SpriteConfig = {
  width: 64 * SCALE,
  height: 96 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Trunk
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - 6 * s, 50 * s, 12 * s, 40 * s);
    ctx.strokeRect(centerX - 6 * s, 50 * s, 12 * s, 40 * s);

    // Foliage (triangle tree)
    ctx.fillStyle = '#228B22';
    ctx.beginPath();
    ctx.moveTo(centerX, 5 * s);
    ctx.lineTo(centerX - 25 * s, 55 * s);
    ctx.lineTo(centerX + 25 * s, 55 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Label
    ctx.fillStyle = BLACK;
    ctx.font = `${8 * s}px monospace`;
    ctx.fillText('TREE', 18 * s, h - 2 * s);
  },
};

/**
 * Grass tuft mockup (3x scale: 96x48)
 */
export const GRASS_CONFIG: SpriteConfig = {
  width: 32 * SCALE,
  height: 16 * SCALE,
  draw: (ctx, w, _h) => {
    ctx.strokeStyle = '#228B22';
    ctx.fillStyle = '#228B22';
    ctx.lineWidth = 2 * SCALE;
    ctx.lineCap = 'round';

    const centerX = w / 2;
    const s = SCALE;

    // Three blades of grass
    ctx.beginPath();
    ctx.moveTo(centerX - 8 * s, 14 * s);
    ctx.quadraticCurveTo(centerX - 10 * s, 4 * s, centerX - 6 * s, 2 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, 14 * s);
    ctx.quadraticCurveTo(centerX, 2 * s, centerX + 2 * s, 1 * s);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX + 8 * s, 14 * s);
    ctx.quadraticCurveTo(centerX + 10 * s, 4 * s, centerX + 6 * s, 2 * s);
    ctx.stroke();
  },
};

/**
 * Flower mockup (3x scale: 72x72)
 */
export const FLOWER_CONFIG: SpriteConfig = {
  width: 24 * SCALE,
  height: 24 * SCALE,
  draw: (ctx, w, h) => {
    const s = SCALE;
    ctx.lineWidth = 1 * s;
    const centerX = w / 2;

    // Stem
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(centerX, h - 2 * s);
    ctx.lineTo(centerX, 10 * s);
    ctx.stroke();

    // Petals
    ctx.fillStyle = '#FF6B6B';
    const petalRadius = 4 * s;
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
      const px = centerX + Math.cos(angle) * 5 * s;
      const py = 8 * s + Math.sin(angle) * 5 * s;
      ctx.beginPath();
      ctx.arc(px, py, petalRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, 8 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
  },
};

/**
 * Fountain mockup (3x scale: 288x240)
 */
export const FOUNTAIN_CONFIG: SpriteConfig = {
  width: 96 * SCALE,
  height: 80 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Base pool
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(centerX, h - 15 * s, 40 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pedestal
    ctx.fillStyle = GRAY;
    ctx.fillRect(centerX - 8 * s, 35 * s, 16 * s, 30 * s);
    ctx.strokeRect(centerX - 8 * s, 35 * s, 16 * s, 30 * s);

    // Top basin
    ctx.fillStyle = '#4A90D9';
    ctx.beginPath();
    ctx.ellipse(centerX, 35 * s, 15 * s, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Water spout
    ctx.strokeStyle = '#87CEEB';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(centerX, 30 * s);
    ctx.quadraticCurveTo(centerX - 5 * s, 15 * s, centerX - 15 * s, 25 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, 30 * s);
    ctx.quadraticCurveTo(centerX + 5 * s, 15 * s, centerX + 15 * s, 25 * s);
    ctx.stroke();

    // Label
    ctx.fillStyle = BLACK;
    ctx.font = `${8 * s}px monospace`;
    ctx.fillText('FOUNTAIN', 22 * s, h - 2 * s);
  },
};

/**
 * Light switch ON mockup (3x scale: 96x144)
 */
export const LIGHTSWITCH_ON_CONFIG: SpriteConfig = {
  width: 32 * SCALE,
  height: 48 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Switch plate
    ctx.fillStyle = WHITE;
    ctx.fillRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);
    ctx.strokeRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);

    // Switch toggle (up = on)
    ctx.fillStyle = '#44AA44';
    ctx.fillRect(centerX - 4 * s, 12 * s, 8 * s, 14 * s);
    ctx.strokeRect(centerX - 4 * s, 12 * s, 8 * s, 14 * s);

    // ON label
    ctx.fillStyle = BLACK;
    ctx.font = `bold ${8 * s}px monospace`;
    ctx.fillText('ON', centerX - 8 * s, h - 12 * s);
  },
};

/**
 * Light switch OFF mockup (3x scale: 96x144)
 */
export const LIGHTSWITCH_OFF_CONFIG: SpriteConfig = {
  width: 32 * SCALE,
  height: 48 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Switch plate
    ctx.fillStyle = WHITE;
    ctx.fillRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);
    ctx.strokeRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);

    // Switch toggle (down = off)
    ctx.fillStyle = '#AA4444';
    ctx.fillRect(centerX - 4 * s, 22 * s, 8 * s, 14 * s);
    ctx.strokeRect(centerX - 4 * s, 22 * s, 8 * s, 14 * s);

    // OFF label - centered
    ctx.fillStyle = BLACK;
    ctx.font = `bold ${6 * s}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('OFF', centerX, h - 14 * s);
    ctx.textAlign = 'left';
  },
};

/**
 * Sign mockup for TODO areas (3x scale: 192x144)
 */
export const SIGN_CONFIG: SpriteConfig = {
  width: 64 * SCALE,
  height: 48 * SCALE,
  draw: (ctx, w, _h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Post
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(centerX - 3 * s, 28 * s, 6 * s, 18 * s);
    ctx.strokeRect(centerX - 3 * s, 28 * s, 6 * s, 18 * s);

    // Sign board
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(6 * s, 4 * s, w - 12 * s, 26 * s);
    ctx.strokeRect(6 * s, 4 * s, w - 12 * s, 26 * s);

    // Text placeholder
    ctx.fillStyle = BLACK;
    ctx.font = `${10 * s}px monospace`;
    ctx.fillText('TODO', 16 * s, 22 * s);
  },
};

/**
 * Resume stand mockup (3x scale: 192x240)
 */
export const RESUME_STAND_CONFIG: SpriteConfig = {
  width: 64 * SCALE,
  height: 80 * SCALE,
  draw: (ctx, w, h) => {
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2 * SCALE;

    const centerX = w / 2;
    const s = SCALE;

    // Easel legs
    ctx.fillStyle = '#8B4513';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(centerX - 20 * s, h - 4 * s);
    ctx.lineTo(centerX - 5 * s, 30 * s);
    ctx.lineTo(centerX + 5 * s, 30 * s);
    ctx.lineTo(centerX + 20 * s, h - 4 * s);
    ctx.stroke();

    // Back leg
    ctx.beginPath();
    ctx.moveTo(centerX, 35 * s);
    ctx.lineTo(centerX, h - 4 * s);
    ctx.stroke();

    // Document/Resume - larger and more readable
    ctx.fillStyle = WHITE;
    ctx.fillRect(centerX - 22 * s, 4 * s, 44 * s, 55 * s);
    ctx.strokeRect(centerX - 22 * s, 4 * s, 44 * s, 55 * s);

    // Text lines on resume
    ctx.fillStyle = BLACK;
    ctx.font = `bold ${7 * s}px monospace`;
    ctx.fillText('RESUME', centerX - 18 * s, 14 * s);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(centerX - 18 * s, 20 * s, 36 * s, 2 * s);
    ctx.fillRect(centerX - 18 * s, 28 * s, 28 * s, 2 * s);
    ctx.fillRect(centerX - 18 * s, 36 * s, 32 * s, 2 * s);
    ctx.fillRect(centerX - 18 * s, 44 * s, 24 * s, 2 * s);
    
    // Click hint
    ctx.fillStyle = '#666';
    ctx.font = `${5 * s}px monospace`;
    ctx.fillText('CLICK TO VIEW', centerX - 18 * s, 54 * s);
  },
};

/**
 * All sprite configurations for easy access
 */
export const SPRITE_CONFIGS = {
  character: CHARACTER_CONFIG,
  wizard: WIZARD_CONFIG,
  tree: TREE_CONFIG,
  grass: GRASS_CONFIG,
  flower: FLOWER_CONFIG,
  fountain: FOUNTAIN_CONFIG,
  lightswitch_on: LIGHTSWITCH_ON_CONFIG,
  lightswitch_off: LIGHTSWITCH_OFF_CONFIG,
  sign: SIGN_CONFIG,
  resume_stand: RESUME_STAND_CONFIG,
} as const;

export type SpriteName = keyof typeof SPRITE_CONFIGS;

// Export scale for use elsewhere
export const SPRITE_SCALE = SCALE;

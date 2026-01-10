/**
 * Generate PNG sprites with white backgrounds
 * Run with: node scripts/generate-sprites.mjs
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'assets', 'sprites');

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const SCALE = 3;
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY = '#666666';
const DARK_GRAY = '#333333';

const SPRITES = {
  character: {
    width: 48 * SCALE,
    height: 64 * SCALE,
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
    }
  },

  wizard: {
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
    }
  },

  tree: {
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
    }
  },

  grass: {
    width: 32 * SCALE,
    height: 16 * SCALE,
    draw: (ctx, w, h) => {
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
    }
  },

  flower: {
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
    }
  },

  fountain: {
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
    }
  },

  lightswitch_on: {
    width: 32 * SCALE,
    height: 48 * SCALE,
    draw: (ctx, w, h) => {
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 2 * SCALE;

      const centerX = w / 2;
      const s = SCALE;

      // Switch plate
      ctx.fillStyle = '#EEEEEE';
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
    }
  },

  lightswitch_off: {
    width: 32 * SCALE,
    height: 48 * SCALE,
    draw: (ctx, w, h) => {
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 2 * SCALE;

      const centerX = w / 2;
      const s = SCALE;

      // Switch plate
      ctx.fillStyle = '#EEEEEE';
      ctx.fillRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);
      ctx.strokeRect(4 * s, 8 * s, w - 8 * s, h - 16 * s);

      // Switch toggle (down = off)
      ctx.fillStyle = '#AA4444';
      ctx.fillRect(centerX - 4 * s, 22 * s, 8 * s, 14 * s);
      ctx.strokeRect(centerX - 4 * s, 22 * s, 8 * s, 14 * s);

      // OFF label
      ctx.fillStyle = BLACK;
      ctx.font = `bold ${6 * s}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('OFF', centerX, h - 14 * s);
      ctx.textAlign = 'left';
    }
  },

  sign: {
    width: 64 * SCALE,
    height: 48 * SCALE,
    draw: (ctx, w, h) => {
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
    }
  },

  resume_stand: {
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

      // Document/Resume
      ctx.fillStyle = WHITE;
      ctx.fillRect(centerX - 22 * s, 4 * s, 44 * s, 55 * s);
      ctx.strokeStyle = BLACK;
      ctx.lineWidth = 2 * SCALE;
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
    }
  }
};

// Generate all sprites (as _mockup.png to not overwrite real art)
console.log('🎨 Generating mockup sprites...\n');

let generated = 0;
let skipped = 0;

for (const [name, config] of Object.entries(SPRITES)) {
  const realArtPath = join(OUTPUT_DIR, `${name}.png`);
  const mockupPath = join(OUTPUT_DIR, `${name}_mockup.png`);
  
  // Check if real art already exists - if so, skip
  if (existsSync(realArtPath)) {
    console.log(`  ⏭️  ${name}.png exists (real art) - skipping`);
    skipped++;
    continue;
  }
  
  // Check if mockup already exists - if so, skip
  if (existsSync(mockupPath)) {
    console.log(`  ⏭️  ${name}_mockup.png exists - skipping`);
    skipped++;
    continue;
  }
  
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d');
  
  // Transparent background (canvas is transparent by default)
  // Draw sprite
  config.draw(ctx, config.width, config.height);
  
  // Save as _mockup.png
  const buffer = canvas.toBuffer('image/png');
  writeFileSync(mockupPath, buffer);
  
  console.log(`  ✅ ${name}_mockup.png (${config.width}×${config.height})`);
  generated++;
}

console.log(`\n🎉 Done! Generated: ${generated}, Skipped: ${skipped}`);
console.log(`📁 Output: ${OUTPUT_DIR}`);
console.log('\n💡 Workflow:');
console.log('   1. Edit <name>_mockup.png and save as <name>.png');
console.log('   2. The game will automatically use <name>.png if it exists');


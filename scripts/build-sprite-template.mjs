#!/usr/bin/env node
/*
 * Builds a pixel-art template sheet for the isometric train scene, plus the
 * atlas manifest the renderer would read. No dependencies: the PNG is encoded
 * here with node's built-in zlib.
 *
 *   node scripts/build-sprite-template.mjs
 *   node scripts/build-sprite-template.mjs --scale 4     # 4x working copy
 *
 * Outputs:
 *   public/art/train-atlas-template.png      1x, draw directly into this
 *   public/art/train-atlas-template@4x.png   4x, easier to work in
 *   public/art/train-atlas.json              name -> {x,y,w,h} for the renderer
 *
 * The geometry is taken from the scene itself, not invented: the projection is
 * declared 2:1 in index.html (`tileWidthToHeight: '2:1'`, tileH = tileW * 0.5)
 * and the eight directions are the ones the code already names in
 * `this.trainSpriteDirs` = E SE S SW W NW N NE.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const scaleArg = argv.indexOf('--scale');
const SCALES = scaleArg === -1 ? [1, 4] : [Number(argv[scaleArg + 1]) || 1];

// ---------------------------------------------------------------- the atlas

const CELL_W = 64;   // one tile footprint
const CELL_H = 32;   // 2:1
const PAD = 2;       // transparent gutter so neighbours never bleed
const LABEL_H = 7;   // room for the cell name above each board

// cols are in cell units; `tall` cells get extra height for anything that
// stands above the tile floor (buildings, signals, trees).
const GROUPS = [
  {
    name: 'TERRAIN',
    cells: [
      ['grass', 1, 1], ['grass2', 1, 1], ['dirt', 1, 1], ['sand', 1, 1],
      ['water', 1, 1], ['field', 1, 1], ['field2', 1, 1], ['rock', 1, 1],
    ],
  },
  {
    name: 'TRACK',
    cells: [
      ['rail-ne-sw', 1, 1], ['rail-nw-se', 1, 1], ['rail-curve-n', 1, 1], ['rail-curve-e', 1, 1],
      ['rail-curve-s', 1, 1], ['rail-curve-w', 1, 1], ['crossing', 1, 1], ['buffer', 1, 1],
    ],
  },
  {
    name: 'STRUCTURES',
    cells: [
      ['station', 2, 2], ['depot', 2, 2], ['signal', 1, 2], ['water-tower', 1, 2],
      ['house', 1, 2], ['factory', 2, 2], ['tree', 1, 2], ['lamp', 1, 2],
    ],
  },
  {
    name: 'LOCOMOTIVE',
    cells: [
      ['loco-e', 1, 2], ['loco-se', 1, 2], ['loco-s', 1, 2], ['loco-sw', 1, 2],
      ['loco-w', 1, 2], ['loco-nw', 1, 2], ['loco-n', 1, 2], ['loco-ne', 1, 2],
    ],
  },
  {
    name: 'WAGON',
    cells: [
      ['wagon-e', 1, 2], ['wagon-se', 1, 2], ['wagon-s', 1, 2], ['wagon-sw', 1, 2],
      ['wagon-w', 1, 2], ['wagon-nw', 1, 2], ['wagon-n', 1, 2], ['wagon-ne', 1, 2],
    ],
  },
];

const COLS = 8;

/** Lay the groups out on a grid and return {width,height,rects}. */
function layout() {
  const rects = {};
  let y = PAD;
  const rows = [];
  for (const group of GROUPS) {
    y += LABEL_H + 1;                       // group heading band
    let col = 0;
    let rowTop = y;
    let rowTall = 1;
    for (const [name, wCells, hCells] of group.cells) {
      if (col + wCells > COLS) {
        y = rowTop + rowTall * CELL_H + LABEL_H + PAD * 2;
        rowTop = y;
        rowTall = 1;
        col = 0;
      }
      const x = PAD + col * (CELL_W + PAD);
      rects[name] = {
        x,
        y: rowTop + LABEL_H,
        w: CELL_W * wCells + PAD * (wCells - 1),
        h: CELL_H * hCells,
        anchorX: Math.round((CELL_W * wCells) / 2),
        anchorY: CELL_H * hCells - Math.round(CELL_H / 2),
        group: group.name,
      };
      rowTall = Math.max(rowTall, hCells);
      col += wCells;
    }
    y = rowTop + rowTall * CELL_H + LABEL_H + PAD * 3;
    rows.push(group.name);
  }
  const width = PAD + COLS * (CELL_W + PAD);
  return { width, height: y + PAD, rects };
}

// ------------------------------------------------------------- tiny 3x5 font

// A 3px-wide font could not keep A, M and N apart (it rendered "SAND" as
// "SMMO"), so the glyphs are 4px wide. Each digit below is one row, 4 bits.
const GLYPH_W = 4;
const FONT = {
  A: [6, 9, 15, 9, 9],   B: [14, 9, 14, 9, 14], C: [7, 8, 8, 8, 7],
  D: [14, 9, 9, 9, 14],  E: [15, 8, 14, 8, 15], F: [15, 8, 14, 8, 8],
  G: [7, 8, 11, 9, 7],   H: [9, 9, 15, 9, 9],   I: [7, 2, 2, 2, 7],
  J: [1, 1, 1, 9, 6],    K: [9, 10, 12, 10, 9], L: [8, 8, 8, 8, 15],
  M: [9, 15, 15, 9, 9],  N: [9, 13, 11, 9, 9],  O: [6, 9, 9, 9, 6],
  P: [14, 9, 14, 8, 8],  Q: [6, 9, 9, 10, 5],   R: [14, 9, 14, 10, 9],
  S: [7, 8, 6, 1, 14],   T: [15, 4, 4, 4, 4],   U: [9, 9, 9, 9, 6],
  V: [9, 9, 9, 6, 6],    W: [9, 9, 15, 15, 9],  X: [9, 9, 6, 9, 9],
  Y: [9, 9, 6, 6, 6],    Z: [15, 1, 6, 8, 15],
  0: [6, 9, 11, 9, 6],   1: [4, 12, 4, 4, 14],  2: [14, 1, 6, 8, 15],
  3: [14, 1, 6, 1, 14],  4: [9, 9, 15, 1, 1],   5: [15, 8, 14, 1, 14],
  6: [7, 8, 14, 9, 6],   7: [15, 1, 2, 4, 4],   8: [6, 9, 6, 9, 6],
  9: [6, 9, 7, 1, 14],
  '-': [0, 0, 15, 0, 0], '@': [6, 9, 11, 8, 7], '.': [0, 0, 0, 0, 4],
  ' ': [0, 0, 0, 0, 0],
};

function glyphRows(ch) {
  return FONT[ch] ?? FONT[' '];
}

// ------------------------------------------------------------------ raster

class Raster {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8Array(w * h * 4); // transparent
  }

  px(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    // simple source-over so guides can overlap softly
    const sa = a / 255;
    const da = this.data[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa === 0) return;
    this.data[i] = Math.round((r * sa + this.data[i] * da * (1 - sa)) / oa);
    this.data[i + 1] = Math.round((g * sa + this.data[i + 1] * da * (1 - sa)) / oa);
    this.data[i + 2] = Math.round((b * sa + this.data[i + 2] * da * (1 - sa)) / oa);
    this.data[i + 3] = Math.round(oa * 255);
  }

  rect(x, y, w, h, color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, color);
  }

  frame(x, y, w, h, color) {
    for (let i = 0; i < w; i++) { this.px(x + i, y, color); this.px(x + i, y + h - 1, color); }
    for (let j = 0; j < h; j++) { this.px(x, y + j, color); this.px(x + w - 1, y + j, color); }
  }

  /** Bresenham, so the 2:1 diamond lands on exact pixels. */
  line(x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    for (;;) {
      this.px(x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  text(str, x, y, color) {
    let cx = x;
    for (const ch of str.toUpperCase()) {
      const rows = glyphRows(ch);
      rows.forEach((bits, ry) => {
        for (let bx = 0; bx < GLYPH_W; bx++) {
          if (bits & (1 << (GLYPH_W - 1 - bx))) this.px(cx + bx, y + ry, color);
        }
      });
      cx += GLYPH_W + 1;
    }
    return cx - x;
  }
}

// ------------------------------------------------------------------- png

function png(raster) {
  const { w, h, data } = raster;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filter: none
    Buffer.from(data.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

// ------------------------------------------------------------------ draw

const GUIDE = [214, 189, 104, 120];   // tile footprint diamond
const BOARD = [120, 132, 110, 150];   // cell border
const LABEL = [200, 206, 190, 220];
const HEAD = [214, 189, 104, 255];
const ANCHOR = [224, 135, 92, 220];

function drawSheet() {
  const { width, height, rects } = layout();
  const r = new Raster(width, height);

  // group headings
  const seen = new Set();
  for (const [name, rect] of Object.entries(rects)) {
    if (!seen.has(rect.group)) {
      seen.add(rect.group);
      r.text(rect.group, PAD, rect.y - LABEL_H - LABEL_H - 1, HEAD);
    }
    void name;
  }

  for (const [name, rect] of Object.entries(rects)) {
    r.frame(rect.x, rect.y, rect.w, rect.h, BOARD);
    r.text(name, rect.x + 1, rect.y - LABEL_H + 1, LABEL);

    // 2:1 footprint diamond at the base of the cell
    const cx = rect.x + rect.w / 2;
    const baseY = rect.y + rect.h - CELL_H;
    r.line(Math.round(cx), baseY, rect.x + rect.w - 1, Math.round(baseY + CELL_H / 2), GUIDE);
    r.line(rect.x + rect.w - 1, Math.round(baseY + CELL_H / 2), Math.round(cx), baseY + CELL_H - 1, GUIDE);
    r.line(Math.round(cx), baseY + CELL_H - 1, rect.x, Math.round(baseY + CELL_H / 2), GUIDE);
    r.line(rect.x, Math.round(baseY + CELL_H / 2), Math.round(cx), baseY, GUIDE);

    // anchor cross: where the renderer pins the sprite to the tile centre
    const ax = rect.x + rect.anchorX;
    const ay = rect.y + rect.anchorY;
    r.line(ax - 2, ay, ax + 2, ay, ANCHOR);
    r.line(ax, ay - 2, ax, ay + 2, ANCHOR);
  }

  return { raster: r, rects, width, height };
}

function upscale(raster, scale) {
  const out = new Raster(raster.w * scale, raster.h * scale);
  for (let y = 0; y < raster.h; y++) {
    for (let x = 0; x < raster.w; x++) {
      const i = (y * raster.w + x) * 4;
      const color = [raster.data[i], raster.data[i + 1], raster.data[i + 2], raster.data[i + 3]];
      if (color[3] === 0) continue;
      out.rect(x * scale, y * scale, scale, scale, color);
    }
  }
  return out;
}

// ------------------------------------------------------------------ main

const { raster, rects, width, height } = drawSheet();
const outDir = join(ROOT, 'public', 'art');
mkdirSync(outDir, { recursive: true });

for (const scale of SCALES) {
  const img = scale === 1 ? raster : upscale(raster, scale);
  const file = join(outDir, scale === 1 ? 'train-atlas-template.png' : `train-atlas-template@${scale}x.png`);
  writeFileSync(file, png(img));
  console.log(`wrote ${file}  ${img.w}x${img.h}`);
}

const manifest = {
  note: 'Generated by scripts/build-sprite-template.mjs. Coordinates are 1x pixels.',
  projection: { tileWidthToHeight: '2:1', cell: { w: CELL_W, h: CELL_H } },
  directions: ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'],
  sheet: { width, height },
  sprites: Object.fromEntries(
    Object.entries(rects).map(([k, v]) => [k, { x: v.x, y: v.y, w: v.w, h: v.h, anchorX: v.anchorX, anchorY: v.anchorY }]),
  ),
};
const manifestPath = join(outDir, 'train-atlas.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${manifestPath}  ${Object.keys(rects).length} cells`);

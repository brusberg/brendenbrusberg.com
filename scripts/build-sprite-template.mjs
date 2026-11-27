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
 *   art-source/train-atlas-template.png      1x guides, for reference
 *   art-source/train-atlas-template@4x.png   4x, easier to read on screen
 *   art-source/train-atlas-blank.png         1x, empty: paint the real atlas here
 *   art-source/train-atlas-working.ora       layered working file: Krita, GIMP
 *   art-source/train-atlas-working.pxo       layered working file: Pixelorama.
 *                                            Its own format, because ORA is
 *                                            import-only there -- it can open
 *                                            a .ora but cannot save one back.
 *   art-source/train-atlas.json              name -> {x,y,w,h}, and the geometry
 *                                            scripts/capture-current-atlas.js bakes to
 *
 * These live in art-source/ and NOT in public/, because vite copies public/
 * wholesale into dist/ and these are working files. A 56KB .ora and two
 * reference sheets have no reason to be served to visitors.
 *
 * Draw in the .ora, not in the template. The guide lines, cell frames, labels
 * and anchor crosses are ordinary pixels in the template PNG, so anything
 * painted straight into it ships with the art. The .ora keeps them on their own
 * locked layer underneath an empty one; hide the guides and export to get a
 * clean atlas at exactly the size and offsets train-atlas.json promises.
 *
 * The geometry is taken from the scene itself, not invented: the projection is
 * declared 2:1 in index.html (`tileWidthToHeight: '2:1'`, tileH = tileW * 0.5)
 * and the eight directions are the ones the code already names in
 * `this.trainSpriteDirs` = E SE S SW W NW N NE.
 */

import { deflateSync, deflateRawSync, inflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GEOMETRY, GROUPS, DIRECTIONS, layout } from './lib/atlas-cells.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const scaleArg = argv.indexOf('--scale');
const SCALES = scaleArg === -1 ? [1, 4] : [Number(argv[scaleArg + 1]) || 1];

// ---------------------------------------------------------------- the atlas

// The cell list and its geometry live in one place now, shared with the
// capture script, so the blank template and the baked reference sheet come out
// the same size with the same boxes.
const { cellW: CELL_W, tileH: CELL_H, gap: GAP, artH: ART_H, labelH: LABEL_H,
        headH: HEAD_H, pad: PAD, footerH: FOOTER_H, floorUp: FLOOR_UP } = GEOMETRY;

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
  '&': [6, 9, 6, 11, 7],  ' ': [0, 0, 0, 0, 0],
};

/**
 * Throw rather than fall back to a blank. A missing glyph used to render as
 * nothing at all, so "NATURE & YARD" came out as "NATURE  YARD" and no one
 * found out until they looked closely at a sheet. A build that stops is a
 * cheaper way to learn that than a caption with a hole in it.
 */
function glyphRows(ch) {
  const rows = FONT[ch];
  if (!rows) throw new Error(`no glyph for ${JSON.stringify(ch)} — add one to FONT in ${import.meta.url}`);
  return rows;
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

/** The 3x5 font has no clipping, so trim a name to what its cell can hold. */
function fitLabel(name, maxPx) {
  const per = GLYPH_W + 1;
  const max = Math.floor((maxPx + 1) / per);
  return name.length <= max ? name : `${name.slice(0, Math.max(1, max - 1))}.`;
}

function drawSheet() {
  const { width, height, rows, rects, groups } = layout();
  const r = new Raster(width, height);

  for (const row of rows) {
    if (row.group) r.text(row.group, PAD, row.headY + 3, HEAD);
    for (const item of row.items) {
      const rect = rects[item.name];
      r.text(fitLabel(item.name, rect.w - 2), rect.x + 1, row.labelY + 2, LABEL);
      r.frame(rect.x, rect.y, rect.w, rect.h, BOARD);

      // the 64x32 footprint, drawn where the floor actually sits
      // always ONE tile across, even in a double-width cell -- the diamond is
      // the unit of scale, not the size of the box it is drawn in.
      const cx = Math.round(rect.x + rect.w / 2);
      const fy = rect.y + rect.h - FLOOR_UP;
      const half = CELL_H / 2;
      const halfW = CELL_W / 2;
      r.line(cx, fy - half, cx + halfW, fy, GUIDE);
      r.line(cx + halfW, fy, cx, fy + half, GUIDE);
      r.line(cx, fy + half, cx - halfW, fy, GUIDE);
      r.line(cx - halfW, fy, cx, fy - half, GUIDE);

      // anchor cross: where the renderer pins the sprite to the tile centre
      const ax = rect.x + rect.anchorX;
      const ay = rect.y + rect.anchorY;
      r.line(ax - 2, ay, ax + 2, ay, ANCHOR);
      r.line(ax, ay - 2, ax, ay + 2, ANCHOR);
    }
  }

  return { raster: r, rects, width, height, groups };
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

// ------------------------------------------------------------------- ora

/** Nearest-neighbour downscale, enough for an ORA thumbnail. */
function downscale(raster, maxW, maxH) {
  const scale = Math.min(maxW / raster.w, maxH / raster.h, 1);
  const w = Math.max(1, Math.round(raster.w * scale));
  const h = Math.max(1, Math.round(raster.h * scale));
  const out = new Raster(w, h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(raster.h - 1, Math.floor((y + 0.5) / scale));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(raster.w - 1, Math.floor((x + 0.5) / scale));
      const i = (sy * raster.w + sx) * 4;
      const j = (y * w + x) * 4;
      out.data[j] = raster.data[i];
      out.data[j + 1] = raster.data[i + 1];
      out.data[j + 2] = raster.data[i + 2];
      out.data[j + 3] = raster.data[i + 3];
    }
  }
  return out;
}

/**
 * Minimal ZIP writer. OpenRaster is a zip, and this script has no dependencies,
 * so here is just enough of the format: local headers, central directory, EOCD.
 * Timestamps are pinned to the epoch the format starts at, so rebuilding an
 * unchanged sheet produces an identical file instead of a spurious diff.
 */
function zip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  const DOS_DATE = 0x0021; // 1980-01-01
  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const crc = crc32(entry.data) >>> 0;
    // The mimetype entry must be stored, not deflated, and must come first.
    const body = entry.store ? entry.data : deflateRawSync(entry.data, { level: 9 });
    const method = entry.store ? 0 : 8;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, body);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(method, 10);
    cen.writeUInt16LE(DOS_DATE, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(body.length, 20);
    cen.writeUInt32LE(entry.data.length, 24);
    cen.writeUInt16LE(name.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, name);

    offset += local.length + name.length + body.length;
  }
  const dir = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(dir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, dir, eocd]);
}

/**
 * An OpenRaster working file: an empty layer to paint on, over a locked layer
 * of guides. ORA is the interchange format Krita, Pixelorama and GIMP all read,
 * which is why it is this and not any one app's native format.
 */
function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function ora(guides, blank, referencePng) {
  const { w, h } = guides;
  // Layers are listed top first. The reference is the baked current art with
  // no chrome of its own, so the remake can be traced straight over what the
  // scene draws today and the guides above it are the only labels on screen.
  const layers = [
    '    <layer name="atlas" src="data/atlas.png" x="0" y="0" opacity="1.0" visibility="visible" composite-op="svg:src-over"/>',
    '    <layer name="guides (hide before export)" src="data/guides.png" x="0" y="0" opacity="1.0" visibility="visible" composite-op="svg:src-over" edit-locked="true"/>',
  ];
  const files = [
    { name: 'mimetype', data: Buffer.from('image/openraster', 'ascii'), store: true },
    { name: 'data/atlas.png', data: png(blank) },
    { name: 'data/guides.png', data: png(guides) },
    // Nothing is painted yet, so the flattened preview is just the guides.
    // Apps re-render the real stack on open; this is only for readers that do not.
    { name: 'mergedimage.png', data: png(guides) },
    { name: 'Thumbnails/thumbnail.png', data: png(downscale(guides, 256, 256)) },
  ];
  if (referencePng) {
    layers.push('    <layer name="reference: current art" src="data/reference.png" x="0" y="0" opacity="1.0" visibility="visible" composite-op="svg:src-over" edit-locked="true"/>');
    // Embedded verbatim: it is already a PNG of exactly the right size, so
    // there is nothing to decode and nothing that can be lost re-encoding it.
    files.push({ name: 'data/reference.png', data: referencePng });
  }
  const stack = `<?xml version='1.0' encoding='UTF-8'?>
<image version="0.0.3" w="${w}" h="${h}" xres="72" yres="72">
  <stack>
${layers.join('\n')}
  </stack>
</image>
`;
  files.splice(1, 0, { name: 'stack.xml', data: Buffer.from(stack, 'utf8') });
  return zip(files);
}

// ------------------------------------------------------------------- pxo

/**
 * Minimal PNG reader: 8-bit, non-interlaced, RGB or RGBA. Enough to turn the
 * baked reference sheet back into raw pixels, and no more. ORA embeds PNGs
 * verbatim so it never needed this; Pixelorama stores a cel as bare bytes.
 */
function decodePng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let pos = 8;
  let w = 0, h = 0, depth = 0, color = 0, interlace = 0;
  const idat = [];
  while (pos + 8 <= buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; color = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (color !== 6 && color !== 2)) {
    throw new Error(`unsupported PNG: bit depth ${depth}, colour type ${color}, interlace ${interlace}`);
  }
  const ch = color === 6 ? 4 : 3;
  const stride = w * ch;
  const raw = inflateSync(Buffer.concat(idat));
  const out = Buffer.alloc(w * h * 4);
  const line = Buffer.alloc(stride);
  let prev = Buffer.alloc(stride);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[p++];
    raw.copy(line, 0, p, p + stride);
    p += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const q = a + b - c;
        const pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      line[i] = v & 0xff;
    }
    for (let x = 0; x < w; x++) {
      const si = x * ch;
      const di = (y * w + x) * 4;
      out[di] = line[si]; out[di + 1] = line[si + 1]; out[di + 2] = line[si + 2];
      out[di + 3] = ch === 4 ? line[si + 3] : 255;
    }
    prev = Buffer.from(line);
  }
  return { w, h, data: out };
}

/**
 * Pixelorama's own project format, so the editor both opens AND saves without
 * converting. ORA is import-only there -- v1.2.4's export list is PNG, WEBP,
 * JPEG, SVG, EXR, GIF, ASE, APNG and the video formats, with no ORA -- so a
 * .ora working file is a one-way trip into the app.
 *
 * A plain ZIP of one data.json plus one RAW RGBA8 buffer per cel. No mimetype
 * to store first, no PNG anywhere: Image.create_from_data() reads the bytes
 * straight, so a cel is exactly w*h*4, row-major from the top left.
 *
 * pxo_version MUST be 8. The loader reads it as dict.get("pxo_version", 1) and
 * anything below 8 takes a compatibility path that calls shrink_to_content()
 * on every cel -- cropping the guides and the reference to their own ink and
 * silently throwing away the alignment this toolchain exists to guarantee.
 */
function pxo(guides, blank, referencePng) {
  const { w, h } = guides;
  // Index 0 is the BOTTOM layer, so this is the ORA stack upside down.
  const layers = [];
  const cels = [];
  const add = (name, data, locked) => {
    layers.push({ name, type: 0, new_cels_linked: false, visible: true, locked, opacity: 1.0 });
    cels.push(Buffer.from(data));
  };
  if (referencePng) {
    const ref = decodePng(referencePng);
    if (ref.w !== w || ref.h !== h) throw new Error(`reference is ${ref.w}x${ref.h}, sheet is ${w}x${h}`);
    add('reference: current art', ref.data, true);
  }
  add('guides (hide before export)', guides.data, true);
  add('atlas', blank.data, false);

  const doc = {
    pxo_version: 8,
    size_x: w,
    size_y: h,
    color_mode: 5,                     // Image.FORMAT_RGBA8
    layers,
    // cels are positional: cels[i] is the cel of layers[i], same length.
    frames: [{ cels: layers.map(() => ({ opacity: 1 })) }],
    current_layer: layers.length - 1,  // open with the paintable layer selected
  };

  const files = [{ name: 'data.json', data: Buffer.from(JSON.stringify(doc), 'utf8') }];
  // 1-based in the path, 0-based in the arrays.
  cels.forEach((data, i) => files.push({ name: `image_data/frames/1/layer_${i + 1}`, data }));
  return zip(files);
}

// ------------------------------------------------------------------ main

const { raster, rects, width, height, groups } = drawSheet();
const outDir = join(ROOT, 'art-source');
mkdirSync(outDir, { recursive: true });

for (const scale of SCALES) {
  const img = scale === 1 ? raster : upscale(raster, scale);
  const file = join(outDir, scale === 1 ? 'train-atlas-template.png' : `train-atlas-template@${scale}x.png`);
  writeFileSync(file, png(img));
  console.log(`wrote ${file}  ${img.w}x${img.h}`);
}

const manifest = {
  note: 'Generated by scripts/build-sprite-template.mjs. Coordinates are 1x pixels. Cell names match scripts/capture-current-atlas.js.',
  projection: { tileWidthToHeight: '2:1', cell: { w: CELL_W, h: CELL_H } },
  directions: DIRECTIONS,
  sheet: { width, height },
  // Heading positions and per-cell label baselines ride along so that
  // scripts/capture-current-atlas.js can draw its sheet straight from this
  // file. It used to recompute the layout itself and the two drifted apart.
  groups,
  sprites: Object.fromEntries(
    Object.entries(rects).map(([k, v]) => [
      k,
      { x: v.x, y: v.y, w: v.w, h: v.h, anchorX: v.anchorX, anchorY: v.anchorY, labelY: v.labelY },
    ]),
  ),
};
const manifestPath = join(outDir, 'train-atlas.json');
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`wrote ${manifestPath}  ${Object.keys(rects).length} cells`);

// The surface the real atlas gets painted on: same size and offsets as the
// template, no guides baked in.
const blank = new Raster(width, height);
const blankPath = join(outDir, 'train-atlas-blank.png');
writeFileSync(blankPath, png(blank));
console.log(`wrote ${blankPath}  ${width}x${height} transparent`);

// If the current art has been baked (scripts/capture-current-atlas.js), put it
// in as the bottom layer so the remake can be traced directly over it.
//
// This is the ART ONLY, on transparency. The labelled sheet that script also
// writes (train-atlas-current.png) must never go in here: it carries its own
// background, labels, frames and footprint diamonds, so layering it under the
// guides draws every caption twice in two different fonts.
const referencePath = join(outDir, 'train-atlas-art.png');
let reference = null;
if (existsSync(referencePath)) {
  const buf = readFileSync(referencePath);
  const size = pngSize(buf);
  if (size && size.w === width && size.h === height) reference = buf;
  else console.warn(`  skipped reference layer: ${referencePath} is ${size ? `${size.w}x${size.h}` : 'not a PNG'}, sheet is ${width}x${height}`);
}

/**
 * A working file is the one with artwork in it. Regenerating hands back an
 * empty atlas layer, so never clobber a changed one without being told twice.
 * Identical output is a silent no-op, so a rerun that changes nothing is quiet.
 */
const FORCE = process.argv.includes('--force');
function writeWorking(path, data, label) {
  if (existsSync(path)) {
    if (readFileSync(path).equals(data)) {
      console.log(`unchanged ${path}  ${label}`);
      return;
    }
    if (!FORCE) {
      const alt = path.replace(/(\.[^.]+)$/, '-new$1');
      writeFileSync(alt, data);
      console.warn(`KEPT ${path} — it differs from a fresh build, so anything drawn in it is safe.`);
      console.warn(`     the new one is ${alt}; pass --force to overwrite instead.`);
      return;
    }
  }
  writeFileSync(path, data);
  console.log(`wrote ${path}  ${label}`);
}

const layerCount = reference ? 3 : 2;
writeWorking(join(outDir, 'train-atlas-working.ora'), ora(raster, blank, reference),
  `${layerCount} layers — Krita, GIMP, and Pixelorama can open it`);
writeWorking(join(outDir, 'train-atlas-working.pxo'), pxo(raster, blank, reference),
  `${layerCount} layers — Pixelorama's own format, the one it can also SAVE`);

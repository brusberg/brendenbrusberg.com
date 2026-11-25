#!/usr/bin/env node
/*
 * Build the web-sized portrait from the full-resolution original.
 *
 *   node scripts/build-portrait.mjs          # writes public/art/laplacian-web.png
 *   node scripts/build-portrait.mjs --check  # CI: fails if the asset is stale or oversized
 *
 * The original is 2048x1536 and 3.2MB, displayed in a 400x300 figure -- 26
 * times more pixels than the slot can show, and enough of a decode that the
 * browser paints the alt text first. That is the broken-looking image.
 *
 * Why lossless and greyscale rather than a JPEG: the picture is a Laplacian
 * edge pass, which is high-frequency black-and-white speckle. That is the worst
 * case for JPEG -- every speck gets its own ringing -- and the image carries no
 * colour at all, so two of its four channels are a copy of the first and the
 * fourth is a constant. Dropping to 8-bit greyscale is exact, not lossy.
 *
 * No image library. sips (macOS, built in) does the resample; the greyscale
 * re-encode is done here with node:zlib, the same approach
 * scripts/build-sprite-template.mjs uses to write its atlas.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'public/art/laplacian.png');
const OUT = path.join(ROOT, 'public/art/laplacian-web.png');
const WIDTH = 800;          // 2x the 400px slot, for retina
const MAX_KB = 500;         // a portrait has no business being larger than this

// --- minimal PNG read ------------------------------------------------------
function readPng(file) {
  const raw = fs.readFileSync(file);
  if (raw.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file} is not a PNG`);
  let i = 8;
  let ihdr = null;
  const idat = [];
  while (i < raw.length) {
    const len = raw.readUInt32BE(i);
    const type = raw.toString('ascii', i + 4, i + 8);
    const body = raw.subarray(i + 8, i + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: body.readUInt32BE(0), height: body.readUInt32BE(4),
        depth: body[8], colour: body[9], interlace: body[12],
      };
    } else if (type === 'IDAT') idat.push(body);
    i += 12 + len;
  }
  if (!ihdr) throw new Error('no IHDR');
  if (ihdr.depth !== 8) throw new Error(`only 8-bit input supported, got ${ihdr.depth}`);
  if (ihdr.interlace) throw new Error('interlaced PNG not supported');
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.colour];
  if (!channels) throw new Error(`unsupported colour type ${ihdr.colour}`);
  const data = zlib.inflateSync(Buffer.concat(idat));

  // Undo the per-scanline filters. Straight out of the spec; the only subtlety
  // is that Paeth and Sub reach back by the pixel width, not by one byte.
  const { width, height } = ihdr;
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y += 1) {
    const f = data[y * (stride + 1)];
    const line = data.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 255;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { ...ihdr, channels, pixels: out };
}

// --- minimal PNG write, 8-bit greyscale ------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, tail]);
}
function writeGrey(width, height, grey) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 0; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  // Filter 1 (Sub) beats None comfortably on speckle and costs nothing to try;
  // a real encoder would pick per row, and the gain from that is small here.
  const rows = Buffer.alloc((width + 1) * height);
  for (let y = 0; y < height; y += 1) {
    rows[y * (width + 1)] = 1;
    for (let x = 0; x < width; x += 1) {
      const v = grey[y * width + x];
      const left = x > 0 ? grey[y * width + x - 1] : 0;
      rows[y * (width + 1) + 1 + x] = (v - left) & 255;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- main ------------------------------------------------------------------
const check = process.argv.includes('--check');

if (!fs.existsSync(SRC)) {
  console.error(`missing ${path.relative(ROOT, SRC)}`);
  process.exit(1);
}

if (check) {
  if (!fs.existsSync(OUT)) {
    console.error('public/art/laplacian-web.png is missing — run node scripts/build-portrait.mjs');
    process.exit(1);
  }
  const kb = fs.statSync(OUT).size / 1024;
  const meta = readPng(OUT);
  const problems = [];
  if (kb > MAX_KB) problems.push(`${kb.toFixed(0)}KB exceeds the ${MAX_KB}KB budget`);
  if (meta.width !== WIDTH) problems.push(`is ${meta.width}px wide, expected ${WIDTH}`);
  if (meta.colour !== 0) problems.push(`colour type ${meta.colour}, expected 0 (greyscale)`);
  if (problems.length) {
    console.error('portrait check FAILED: ' + problems.join('; '));
    process.exit(1);
  }
  console.log(`portrait OK — ${meta.width}x${meta.height} greyscale, ${kb.toFixed(0)}KB`);
  process.exit(0);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portrait-'));
const resized = path.join(tmp, 'resized.png');
execFileSync('sips', ['-Z', String(WIDTH), SRC, '--out', resized], { stdio: 'ignore' });

const img = readPng(resized);
const { width, height, channels, pixels } = img;
const grey = Buffer.alloc(width * height);
let colourful = 0;
let translucent = 0;
for (let i = 0, p = 0; i < width * height; i += 1, p += channels) {
  if (channels >= 3) {
    const r = pixels[p], g = pixels[p + 1], b = pixels[p + 2];
    if (r !== g || g !== b) colourful += 1;
    // Rec. 709 luma, for the pixels that are not already neutral.
    grey[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    if (channels === 4 && pixels[p + 3] !== 255) translucent += 1;
  } else {
    grey[i] = pixels[p];
    if (channels === 2 && pixels[p + 1] !== 255) translucent += 1;
  }
}

const png = writeGrey(width, height, grey);
fs.writeFileSync(OUT, png);

const before = fs.statSync(SRC).size / 1024;
const after = png.length / 1024;
const src = readPng(SRC);
console.log(`\n  source   ${src.width}x${src.height}  ${before.toFixed(0)}KB  colour type ${src.colour}`);
console.log(`  web      ${width}x${height}  ${after.toFixed(0)}KB  greyscale`);
console.log(`  ${(before / after).toFixed(1)}x smaller, and still lossless for this image\n`);
console.log(`  pixels that carried any colour: ${colourful} (${(colourful / (width * height) * 100).toFixed(2)}%)`);
console.log(`  pixels that were not fully opaque: ${translucent} (${(translucent / (width * height) * 100).toFixed(2)}%)`);
if (colourful / (width * height) > 0.01) {
  console.log('  NOTE: this image is not actually neutral — greyscale is NOT lossless here.');
}
console.log('');
fs.rmSync(tmp, { recursive: true, force: true });

#!/usr/bin/env node
/*
 * Palette lock for the train simulation (proposal P5, "palette lock first").
 *
 *   node scripts/palette-lock.mjs            # report: what is there now
 *   node scripts/palette-lock.mjs --plan     # the full mapping table
 *   node scripts/palette-lock.mjs --apply    # rewrite index.html
 *   node scripts/palette-lock.mjs --check    # CI: every colour is in the palette
 *   node scripts/palette-lock.mjs --size 20  # try a different palette size
 *
 * WHY A SOURCE REWRITE RATHER THAN A RUNTIME SHIM
 * An audit of the scene found 240 fillStyle/strokeStyle assignments, 231 of
 * them hard-coded literals, so there is no source-level choke point to wrap.
 * There IS a runtime one -- every colour reaches the canvas through fillStyle
 * or strokeStyle, with no gradients, patterns, shadowColor or ctx.filter
 * anywhere in the scene -- but that context is SHARED with the Mandelbrot
 * fallback banner and the art panel's cards, so a shim on it would quantise
 * two scenes nobody asked to change. Rewriting the literals inside the train
 * scene's own class body is exactly scoped, costs nothing at runtime, and is
 * checkable in CI.
 *
 * WHY LEXICAL ANCHORS RATHER THAN LINE NUMBERS
 * index.html is edited constantly and line numbers rot within the hour.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = path.join(ROOT, 'index.html');

const START_RE = /^\s*class OpenTTDScene extends Scene \{/m;
const END_RE = /^\s*class ArtScene extends Scene \{/m;

// Colours that must survive byte-identical, and why.
const FIXED = {
  '#d6bd68': 'gold — site identity, 11 uses in the page CSS',
  '#fff8e8': 'cream — site identity, 14 uses in the page CSS',
  '#a64435': 'signal DANGER — an affordance, not decoration',
  '#a8c77d': 'signal CLEAR — must stay in a different hue sector from DANGER'
};

// Hand overrides. Nearest-neighbour in OKLab is right almost everywhere; these
// are the places where "nearest" is wrong for a reason a distance cannot see.
const OVERRIDES = {
  // Warm lamp, headlight and the coal-2 livery. Nearest would be cream, which
  // strips the chroma off a lit lamp; gold would collide with the coal-1 and
  // ore-2 liveries. A pale warm yellow keeps both the warmth and the identity.
  '#fff0a3': '#fff8e8',
  // The wood-2 livery. Nearest is the same pale green as wood-1, which would
  // merge two trains the reservation overlay distinguishes by colour.
  '#b7c98b': '#6c7e45',
  '#889c78': '#6c7e45', // map-label border: a desaturated green must stay green
  '#a8d0d3': '#8fa9aa', // pale cyan glass: stays cool, does not become bone
  '#566e67': '#6c7e45', // green-grey roof: stays green, does not become water
  '#423720': '#5d4b2c', // dark olive-brown: stays earth
  '#403824': '#5d4b2c'
};

// The seven trains carry identity colours that the reservation-path overlay
// uses to show whose route a piece of track belongs to. Two of them already
// share gold, so the scene ships six distinct liveries for seven trains; the
// lock must not take that below six.
const LIVERIES = ['#d6bd68', '#fff0a3', '#91b682', '#b7c98b', '#b08345', '#d6bd68', '#9cb1a7'];

const COLOUR_RE = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.]+\s*)?\)/g;

// --- colour maths ----------------------------------------------------------
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function oklab([r, g, b]) {
  const R = srgbToLinear(r / 255), G = srgbToLinear(g / 255), B = srgbToLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
}
const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function parse(token) {
  const t = token.trim().toLowerCase();
  if (t.startsWith('#')) {
    const h = t.slice(1);
    if (h.length === 3) return { rgb: [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16)), alpha: null };
    if (h.length === 6) return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: null };
    if (h.length === 8) return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: parseInt(h.slice(6, 8), 16) / 255 };
  }
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(t);
  if (m) return { rgb: [+m[1], +m[2], +m[3]].map(Math.round), alpha: m[4] === undefined ? null : +m[4] };
  return null;
}
const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

// A tiny seeded PRNG so clustering is reproducible run to run.
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- extraction ------------------------------------------------------------
function trainSceneSpan(src) {
  const s = START_RE.exec(src);
  const e = END_RE.exec(src);
  if (!s) throw new Error('could not find "class OpenTTDScene extends Scene {"');
  if (!e || e.index < s.index) throw new Error('could not find "class ArtScene extends Scene {" after it');
  return [s.index, e.index];
}

// Weights come from PAINTED AREA, not from how many times a colour is written.
// Those are wildly different: the five terrain greens appear once each in a
// palette array and cover 33% of the canvas, while a window highlight appears
// once and covers four pixels. Weighted by source occurrences the clustering
// spent its green slots on building trim and collapsed the terrain into
// grey-olive -- visibly worse than the scene it replaced.
//
// palette-weights.json is a histogram of the rendered canvas, captured with:
//   const c = document.getElementById('stage2d');
//   const d = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
//   ...count by rgb...
// It is one viewport, one zoom, one camera position: representative, not
// exhaustive. A colour that only appears at another zoom level falls back to
// the floor weight below rather than to zero.
const WEIGHTS = (() => {
  const f = path.join(ROOT, 'scripts', 'palette-weights.json');
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, 'utf8')).histogram;
})();
const WEIGHT_FLOOR = 40;   // ~0.005% of the canvas: enough that an unseen
                           // colour still exists, not enough to pull a centre

function collect(src) {
  const [a, b] = trainSceneSpan(src);
  const body = src.slice(a, b);
  const counts = new Map();
  for (const tok of body.match(COLOUR_RE) || []) {
    const p = parse(tok);
    if (!p) continue;
    const key = hex(p.rgb);
    const rec = counts.get(key) || { key, rgb: p.rgb, n: 0, uses: 0, tokens: new Set() };
    rec.uses += 1;
    rec.tokens.add(tok.toLowerCase());
    counts.set(key, rec);
  }
  for (const rec of counts.values()) {
    rec.n = WEIGHTS ? Math.max(WEIGHT_FLOOR, WEIGHTS[rec.key] || 0) : rec.uses;
  }
  return { span: [a, b], body, counts };
}

// --- palette ---------------------------------------------------------------
function buildPalette(counts, size) {
  const items = [...counts.values()].map((c) => ({ ...c, lab: oklab(c.rgb) }));
  const fixedKeys = Object.keys(FIXED);
  const centres = fixedKeys.map((k) => ({ key: k, lab: oklab(parse(k).rgb), fixed: true }));

  // k-means++ seeding over the remaining budget, weighted by how often a colour
  // is actually used, so a colour painted on 200 tiles pulls a centre and one
  // painted on a single window does not.
  const rnd = mulberry32(0x5eed);
  const want = Math.max(fixedKeys.length, size) - centres.length;
  for (let k = 0; k < want; k += 1) {
    let total = 0;
    const w = items.map((it) => {
      const d = Math.min(...centres.map((c) => dist2(it.lab, c.lab)));
      const v = d * it.n;
      total += v;
      return v;
    });
    let pick = rnd() * total;
    let idx = 0;
    while (idx < w.length - 1 && (pick -= w[idx]) > 0) idx += 1;
    centres.push({ key: items[idx].key, lab: items[idx].lab, fixed: false });
  }

  // Lloyd iterations; fixed centres never move.
  for (let iter = 0; iter < 60; iter += 1) {
    const sums = centres.map(() => [0, 0, 0, 0]);
    for (const it of items) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < centres.length; c += 1) {
        const d = dist2(it.lab, centres[c].lab);
        if (d < bd) { bd = d; best = c; }
      }
      const s = sums[best];
      s[0] += it.lab[0] * it.n; s[1] += it.lab[1] * it.n; s[2] += it.lab[2] * it.n; s[3] += it.n;
    }
    for (let c = 0; c < centres.length; c += 1) {
      if (centres[c].fixed || !sums[c][3]) continue;
      centres[c].lab = [sums[c][0] / sums[c][3], sums[c][1] / sums[c][3], sums[c][2] / sums[c][3]];
    }
  }

  // Snap each free centre to the real colour nearest it, so every palette entry
  // is a colour the scene already uses rather than an invented average.
  for (const c of centres) {
    if (c.fixed) continue;
    let best = null, bd = Infinity;
    for (const it of items) {
      const d = dist2(it.lab, c.lab);
      if (d < bd) { bd = d; best = it; }
    }
    c.key = best.key;
    c.lab = best.lab;
  }

  // Deduplicate: two centres can snap to the same real colour.
  const seen = new Set();
  const palette = [];
  for (const c of centres) {
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    palette.push(c);
  }
  return { palette, items };
}

function buildMapping(palette, items) {
  // An override that names a colour the palette does not contain quietly
  // reintroduces a 17th, 18th, 19th colour -- which is the one thing this
  // script exists to prevent. Five of them did exactly that after the weights
  // changed and the palette moved underneath them.
  const entries = new Set(palette.map((p) => p.key));
  const bad = Object.entries(OVERRIDES).filter(([, to]) => !entries.has(to));
  if (bad.length) {
    console.error('OVERRIDE targets that are not palette entries:');
    for (const [from, to] of bad) console.error(`  ${from} -> ${to}`);
    console.error('\npalette is:\n  ' + [...entries].join('\n  '));
    process.exit(1);
  }
  const map = new Map();
  let worst = { d: 0 };
  for (const it of items) {
    let best = palette[0], bd = Infinity;
    for (const p of palette) {
      const d = dist2(it.lab, p.lab);
      if (d < bd) { bd = d; best = p; }
    }
    const to = OVERRIDES[it.key] || best.key;
    map.set(it.key, to);
    const d = Math.sqrt(dist2(it.lab, oklab(parse(to).rgb)));
    if (d > worst.d) worst = { d, from: it.key, to, n: it.n };
  }
  for (const p of palette) map.set(p.key, p.key);
  for (const k of Object.keys(FIXED)) map.set(k, k);
  // Area-weighted mean perceptual shift: how much the scene actually moves,
  // with each colour counted by the pixels it covers rather than by how often
  // it is written. This is the number to compare across palette sizes.
  let wsum = 0, esum = 0;
  for (const it of items) {
    const to = map.get(it.key);
    const d = Math.sqrt(dist2(it.lab, oklab(parse(to).rgb)));
    esum += d * it.n;
    wsum += it.n;
  }
  return { map, worst, meanShift: wsum ? esum / wsum : 0 };
}

// --- apply -----------------------------------------------------------------
function rewrite(src, map) {
  const [a, b] = trainSceneSpan(src);
  let changed = 0;
  const body = src.slice(a, b).replace(COLOUR_RE, (tok) => {
    const p = parse(tok);
    if (!p) return tok;
    const to = map.get(hex(p.rgb));
    if (!to) return tok;
    const out = p.alpha === null
      ? to
      : `rgba(${parseInt(to.slice(1, 3), 16)}, ${parseInt(to.slice(3, 5), 16)}, ${parseInt(to.slice(5, 7), 16)}, ${p.alpha})`;
    if (out.toLowerCase() !== tok.toLowerCase()) changed += 1;
    return out;
  });
  return { src: src.slice(0, a) + body + src.slice(b), changed };
}

// --- main ------------------------------------------------------------------
const argv = process.argv.slice(2);
const sizeArg = argv.indexOf('--size');
const SIZE = sizeArg >= 0 ? Number(argv[sizeArg + 1]) : 16;

const src = fs.readFileSync(FILE, 'utf8');
const { counts } = collect(src);
const { palette, items } = buildPalette(counts, SIZE);
const { map, worst, meanShift } = buildMapping(palette, items);

const totalUses = items.reduce((n, i) => n + i.uses, 0);
const LOCK_FILE = path.join(ROOT, 'scripts', 'train-palette.json');

// --check must compare against the palette that was APPLIED, not against one
// re-derived from the current source. Re-deriving is circular: once the source
// has been rewritten, clustering the new colours produces a different palette
// and the check fails on a file that is in fact perfectly locked.
if (argv.includes('--check')) {
  if (!fs.existsSync(LOCK_FILE)) {
    console.error('no scripts/train-palette.json — run --apply first');
    process.exit(1);
  }
  const locked = new Set(JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')).palette);
  const present = [...collect(fs.readFileSync(FILE, 'utf8')).counts.values()];
  const strays = present.filter((i) => !locked.has(i.key));
  if (!strays.length) {
    console.log(`palette lock OK — the train scene uses ${present.length} colours, all of them in the ${locked.size}-entry palette`);
    process.exit(0);
  }
  console.error(`palette lock FAILED — ${strays.length} colours outside the locked palette:`);
  for (const s of strays.slice(0, 20)) console.error(`  ${s.key}  x${s.uses}`);
  process.exit(1);
}

const inPalette = new Set(palette.map((p) => p.key));

const liveryAfter = LIVERIES.map((c) => map.get(c) || c);
const liveryDistinctBefore = new Set(LIVERIES).size;
const liveryDistinctAfter = new Set(liveryAfter).size;

if (argv.includes('--liveries') || liveryDistinctAfter < liveryDistinctBefore) {
  console.log(`\ntrain liveries: ${liveryDistinctBefore} distinct before, ${liveryDistinctAfter} after`);
  LIVERIES.forEach((c, i) => console.log(`  train ${i}  ${c} -> ${liveryAfter[i]}`));
  if (liveryDistinctAfter < liveryDistinctBefore) {
    console.error('\nREFUSING: the palette would merge trains the reservation overlay tells apart.');
    console.error('Add an override above, or raise --size.');
    process.exit(1);
  }
}

if (argv.includes('--apply')) {
  const out = rewrite(src, map);
  fs.writeFileSync(FILE, out.src);
  fs.writeFileSync(LOCK_FILE, JSON.stringify({
    generatedBy: 'scripts/palette-lock.mjs --apply',
    size: palette.length,
    meanShiftOklab: Number(meanShift.toFixed(4)),
    palette: palette.map((p) => p.key),
    fixed: Object.keys(FIXED),
    liveries: LIVERIES.map((c, i) => ({ train: i, from: c, to: map.get(c) || c }))
  }, null, 2) + '\n');
  console.log(`rewrote ${out.changed} colour literals in the train scene; ${items.length} distinct -> ${palette.length}`);
  console.log(`wrote scripts/train-palette.json`);
  process.exit(0);
}

console.log(`\ntrain scene: ${items.length} distinct colours across ${totalUses} uses`);
console.log(`palette size requested ${SIZE}, produced ${palette.length}\n`);
const byUse = [...items].sort((x, y) => y.n - x.n);
console.log('palette');
for (const p of palette) {
  const uses = items.filter((i) => map.get(i.key) === p.key).reduce((n, i) => n + i.uses, 0);
  const area = items.filter((i) => map.get(i.key) === p.key).reduce((n, i) => n + (WEIGHTS ? (WEIGHTS[i.key] || 0) : 0), 0);
  const sources = items.filter((i) => map.get(i.key) === p.key).length;
  console.log(`  ${p.key}  ${p.fixed ? 'FIXED' : '     '}  absorbs ${String(sources).padStart(3)} colours / ${String(uses).padStart(4)} uses / ${(area / 736542 * 100).toFixed(1).padStart(5)}% of canvas`);
}
console.log(`\narea-weighted mean perceptual shift: ${meanShift.toFixed(4)} dOKLab   (weights: ${WEIGHTS ? 'rendered canvas' : 'SOURCE OCCURRENCES -- run the histogram capture'})`);
console.log(`worst single mapping: ${worst.from} -> ${worst.to} (dOKLab ${worst.d.toFixed(3)})`);
console.log(`most used colours: ${byUse.slice(0, 8).map((c) => `${c.key}x${c.n}`).join('  ')}`);
if (argv.includes('--plan')) {
  console.log('\nfull mapping (from -> to, uses):');
  for (const it of byUse) {
    const to = map.get(it.key);
    if (to === it.key) continue;
    const d = Math.sqrt(dist2(it.lab, oklab(parse(to).rgb)));
    console.log(`  ${it.key} -> ${to}  x${String(it.n).padStart(3)}  d=${d.toFixed(3)}${OVERRIDES[it.key] ? '  (override)' : ''}`);
  }
}
console.log('');

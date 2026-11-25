#!/usr/bin/env node
/*
 * Design tokens for the site's CSS.
 *
 *   node scripts/build-tokens.mjs                 # report: what is there now
 *   node scripts/build-tokens.mjs --clusters      # what would merge, and how far
 *   node scripts/build-tokens.mjs --threshold 0.015
 *
 * The site's own audit says there is no token layer: 87 distinct colours and 54
 * distinct font sizes across five sources, and three custom properties in the
 * whole site, none of which is a colour or a size. 67% of the colours are used
 * exactly once.
 *
 * The shape of the problem is not "too many colours". It is that there are two
 * parallel colour systems trying to be the same one -- the page chrome uses
 * #fff8e8 / #08100b, the ant page uses #fff9e9 / #11140f -- which drifted apart
 * rather than being designed apart.
 *
 * SCOPE. This only ever touches CSS. index.html holds both a <style> block and
 * an ~8000-line <script> full of canvas colour literals that must not be
 * touched; the extractor takes <style> contents only, and the rewriter puts the
 * file back together from the same slices, so a colour outside a stylesheet is
 * unreachable by construction rather than by a careful regex.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every stylesheet on the site, and how to get the CSS out of it. */
export const SOURCES = [
  { file: 'index.html', kind: 'html', note: 'page chrome; also has an 8000-line script that must not be touched' },
  { file: 'resume/index.html', kind: 'html', note: 'inline only, links no external css' },
  { file: 'src/styles.css', kind: 'css', note: 'the ant page, via src/main.ts' },
  { file: 'src/profile.css', kind: 'css', note: 'linked by index.html' },
  { file: 'public/error.css', kind: 'css', note: 'linked by 400/404/500.html; copied verbatim by vite' },
];

const COLOUR = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(?:,\s*[\d.%]+\s*)?\)/g;

/*
 * MERGES. Clustering proposes these; a surface check disposes of them, and the
 * verdicts below are reviewed by hand rather than taken from the distance.
 *
 * The check that matters is not "are these two colours close". It is "are both
 * of them backgrounds of elements that sit inside one another" -- because then
 * the small difference IS the design, and merging deletes a visible boundary.
 * Three of the ten candidates failed exactly that way, and one is the resume's
 * print ink, which a clustering pass would have folded into a panel background
 * on use count alone.
 */
const MERGE = [
  { from: '#fff9e9', to: '#fff8e8', d: 0.0025, why: 'cream, text and stroke only; far below anything visible' },
  { from: '#f8f1de', to: '#f7f1df', d: 0.0018, why: 'the body-text cream, written at 12 opacities in index.html' },
  { from: '#d3b878', to: '#cdbb78', d: 0.0114, why: 'the label gold, text only, in the ant dialect' },
  { from: '#080c0a', to: '#08100b', d: 0.0162, why: 'a translucent readout badge over the canvas, not a nested surface' },
  { from: '#111310', to: '#11140f', d: 0.0050, why: 'the translucent status panel; different context from the opaque one' },
  { from: '#d9c56d', to: '#e1c978', d: 0.0193, why: 'the accent gold, drifted between error.css and index.html' },
];

const REFUSED = [
  { from: '#07100b', to: '#08100b', d: 0.0019, why: '.panel-footer and .popout-panel sit ON body. Merging deletes the panel edge.' },
  { from: '#151812', to: '#11140f', d: 0.0176, why: "the ant page's own body background, with .profile-panel sitting on it." },
  { from: '#10170f', to: '#11140f', d: 0.0118, why: '.route-card against the panel it sits on, on the error pages.' },
  { from: '#111111', to: '#11140f', d: 0.0138, why: "the resume's PRINT ink. Clustering picked a green-tinted panel background for it, on use count." },
];

/**
 * Split a file into [prefix, css, suffix, ...] slices. For a .css file that is
 * one css slice. For html it is every <style> body, with everything else inert.
 * Rewriting means mapping over the css slices and rejoining -- the script, the
 * markup and the head can never be reached.
 */
export function slice(text, kind) {
  if (kind === 'css') return [{ css: true, text }];
  const out = [];
  let at = 0;
  const re = /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi;
  let m;
  while ((m = re.exec(text))) {
    out.push({ css: false, text: text.slice(at, m.index) + m[1] });
    out.push({ css: true, text: m[2] });
    at = m.index + m[0].length - m[3].length;
  }
  out.push({ css: false, text: text.slice(at) });
  return out;
}

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (c) => ' '.repeat(c.length));

// --- colour maths (same conversion the palette lock uses) -------------------
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function oklab([r, g, b]) {
  const R = srgbToLinear(r / 255), G = srgbToLinear(g / 255), B = srgbToLinear(b / 255);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
}
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function parse(token) {
  const t = token.trim().toLowerCase();
  if (t.startsWith('#')) {
    const h = t.slice(1);
    if (h.length === 3) return { rgb: [0, 1, 2].map((i) => parseInt(h[i] + h[i], 16)), alpha: 1 };
    if (h.length === 6) return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: 1 };
    if (h.length === 8) return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), alpha: parseInt(h.slice(6, 8), 16) / 255 };
  }
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)%?\s*)?\)/.exec(t);
  if (m) return { rgb: [+m[1], +m[2], +m[3]].map(Math.round), alpha: m[4] === undefined ? 1 : +m[4] };
  return null;
}
export const hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

// --- inventory --------------------------------------------------------------
export function inventory() {
  const uses = new Map();   // "#rrggbb@alpha" -> { rgb, alpha, token, where: [] }
  const rgbOnly = new Map(); // "#rrggbb" -> total uses, for the opacity families
  for (const src of SOURCES) {
    const full = path.join(ROOT, src.file);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const part of slice(text, src.kind)) {
      if (!part.css) continue;
      const css = stripComments(part.text);
      for (const tok of css.match(COLOUR) || []) {
        const p = parse(tok);
        if (!p) continue;
        const base = hex(p.rgb);
        const key = `${base}@${p.alpha}`;
        if (!uses.has(key)) uses.set(key, { base, rgb: p.rgb, alpha: p.alpha, token: tok, where: [] });
        uses.get(key).where.push(src.file);
        rgbOnly.set(base, (rgbOnly.get(base) || 0) + 1);
      }
    }
  }
  return { uses, rgbOnly };
}

/**
 * Cluster by perceptual distance, on the RGB only -- alpha is a separate axis
 * and merging across it would change opacity, not just hue. The threshold is
 * deliberately tight: the job is to collapse values that drifted apart by
 * accident, not to redesign the palette. The palette lock already handles
 * reduction, and it does it for the train scene only.
 */
export function cluster(rgbOnly, threshold) {
  const items = [...rgbOnly.entries()]
    .map(([base, n]) => ({ base, n, lab: oklab(parse(base).rgb) }))
    .sort((a, b) => b.n - a.n);
  const groups = [];
  for (const it of items) {
    const near = groups.find((g) => dist(g.lab, it.lab) <= threshold);
    if (near) { near.members.push(it); near.n += it.n; }
    else groups.push({ lab: it.lab, winner: it.base, n: it.n, members: [it] });
  }
  return groups;
}

// --- main -------------------------------------------------------------------
const argv = process.argv.slice(2);
const tIdx = argv.indexOf('--threshold');
// 0.02 in OKLab is around the point a side-by-side difference stops being
// visible on a large flat area; a hairline or a text colour needs more than
// that to read at all. Tight on purpose -- anything larger is a design change.
const THRESHOLD = tIdx >= 0 ? Number(argv[tIdx + 1]) : 0.02;

// --- apply ------------------------------------------------------------------
function applyMerges() {
  const map = new Map(MERGE.map((m) => [m.from, m.to]));
  let changed = 0;
  const touched = [];
  for (const src of SOURCES) {
    const full = path.join(ROOT, src.file);
    if (!fs.existsSync(full)) continue;
    const text = fs.readFileSync(full, 'utf8');
    const parts = slice(text, src.kind);
    let fileChanged = 0;
    const rebuilt = parts.map((part) => {
      if (!part.css) return part.text;   // markup and <script> are never touched
      return part.text.replace(COLOUR, (tok) => {
        const p = parse(tok);
        if (!p) return tok;
        const to = map.get(hex(p.rgb));
        if (!to) return tok;
        fileChanged += 1;
        if (p.alpha === 1 && tok.trim().startsWith('#')) return to;
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(to.slice(i, i + 2), 16));
        return `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
      });
    }).join('');
    if (fileChanged) {
      // Belt and braces: the non-CSS slices must come back byte-identical.
      const before = parts.filter((x) => !x.css).map((x) => x.text).join('\u0000');
      const after = slice(rebuilt, src.kind).filter((x) => !x.css).map((x) => x.text).join('\u0000');
      if (before !== after) throw new Error(`${src.file}: non-CSS content changed — refusing to write`);
      fs.writeFileSync(full, rebuilt);
      touched.push(`${src.file} (${fileChanged})`);
      changed += fileChanged;
    }
  }
  return { changed, touched };
}

if (process.argv.includes('--apply-merges')) {
  const r = applyMerges();
  console.log(`\nmerged ${MERGE.length} colours away, rewriting ${r.changed} literals`);
  for (const m of MERGE) console.log(`  ${m.from} -> ${m.to}   d=${m.d}   ${m.why}`);
  console.log(`\nrefused ${REFUSED.length}:`);
  for (const m of REFUSED) console.log(`  ${m.from} -> ${m.to}   d=${m.d}   ${m.why}`);
  console.log(`\nfiles: ${r.touched.join(', ')}\n`);
  process.exit(0);
}

const { uses, rgbOnly } = inventory();
const groups = cluster(rgbOnly, THRESHOLD);
const merging = groups.filter((g) => g.members.length > 1);

const totalUses = [...uses.values()].reduce((n, u) => n + u.where.length, 0);
console.log(`\n${rgbOnly.size} distinct colours (ignoring alpha) across ${totalUses} uses in ${SOURCES.length} stylesheets`);
console.log(`${uses.size} distinct colour+alpha pairs`);
console.log(`clustering at dOKLab <= ${THRESHOLD}: ${groups.length} groups, ${merging.length} of them merge something\n`);

if (argv.includes('--clusters')) {
  for (const g of merging.sort((a, b) => b.n - a.n)) {
    console.log(`  ${g.winner}  x${g.n}`);
    for (const m of g.members.slice(1)) {
      const d = dist(g.lab, m.lab);
      console.log(`      ${m.base}  x${m.n}   d=${d.toFixed(4)}`);
    }
  }
  console.log('');
  const saved = merging.reduce((n, g) => n + g.members.length - 1, 0);
  console.log(`  merging these removes ${saved} colours: ${rgbOnly.size} -> ${rgbOnly.size - saved}\n`);
}

console.log('per stylesheet:');
for (const src of SOURCES) {
  const own = [...uses.values()].filter((u) => u.where.includes(src.file));
  console.log(`  ${String(own.length).padStart(3)}  ${src.file.padEnd(20)} ${src.note}`);
}
console.log('');

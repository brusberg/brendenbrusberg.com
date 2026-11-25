#!/usr/bin/env node
// Design-drift audit. Zero dependencies.
//
//   node scripts/audit-design.mjs            # human report
//   node scripts/audit-design.mjs --json     # machine readable
//   node scripts/audit-design.mjs --strict   # exit 1 if any budget is exceeded
//
// Looks at every CSS source that ships (inline <style> blocks + .css files) and
// reports where the same design decision is expressed more than one way:
// near-duplicate colors, one-off font sizes, ad-hoc radii/shadows, z-index
// soup, and per-page <head> inconsistencies.

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_OUT = process.argv.includes('--json');
const STRICT = process.argv.includes('--strict');

// Pages and standalone stylesheets that actually reach a browser.
const PAGES = ['index.html', 'ant.html', 'resume/index.html', 'public/404.html', 'public/500.html', 'public/400.html'];
const SHEETS = ['src/styles.css', 'src/profile.css', 'public/error.css'];

// Budgets: how many distinct values of each kind we tolerate before calling it drift.
const BUDGETS = {
  // Budgeted on HUES -- distinct colours with opacity discarded. Budgeting on
  // literals counts one gold at thirteen opacities as thirteen colours, which
  // is a measure of how the CSS is written rather than of how much colour the
  // design uses.
  hues: 24,
  fontSizes: 14,
  fontFamilies: 3,
  radii: 8,
  shadows: 6,
  zIndexes: 8,
  transitionDurations: 5,
};

const read = (rel) => (existsSync(join(ROOT, rel)) ? readFileSync(join(ROOT, rel), 'utf8') : null);

// ---------------------------------------------------------------- collect css

/** @returns {{source:string, css:string}[]} */
function collectCss() {
  const out = [];
  for (const rel of PAGES) {
    const html = read(rel);
    if (html === null) continue;
    const blocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    blocks.forEach((m, i) => {
      out.push({ source: `${rel} <style>${blocks.length > 1 ? ` #${i + 1}` : ''}`, css: m[1] });
    });
    // inline style="" attributes are drift by definition; collect them too
    const attrs = [...html.matchAll(/\sstyle="([^"]+)"/gi)];
    if (attrs.length) {
      out.push({ source: `${rel} style="" attrs (${attrs.length})`, css: attrs.map((m) => m[1]).join(';') });
    }
  }
  for (const rel of SHEETS) {
    const css = read(rel);
    if (css !== null) out.push({ source: rel, css });
  }
  return out;
}

// ------------------------------------------------------------------- extract

const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

function normalizeHex(hex) {
  let h = hex.slice(1).toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6); // drop alpha for clustering
  return `#${h}`;
}

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Perceptual-ish distance, good enough to catch #191d19 vs #1a1e1a. */
function colorDistance(a, b) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  // weighted euclidean (Rec. 601 luma weights)
  return Math.sqrt(2 * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + 3 * (b1 - b2) ** 2);
}

function extract(sources) {
  /** @type {Record<string, Map<string, Set<string>>>} value -> sources */
  const buckets = {
    colors: new Map(),
    hues: new Map(),
    fontSizes: new Map(),
    fontFamilies: new Map(),
    radii: new Map(),
    shadows: new Map(),
    zIndexes: new Map(),
    transitionDurations: new Map(),
    customProps: new Map(),
  };

  const add = (bucket, value, source) => {
    if (!value) return;
    const key = value.trim().replace(/\s+/g, ' ');
    if (!key) return;
    if (!buckets[bucket].has(key)) buckets[bucket].set(key, new Set());
    buckets[bucket].get(key).add(source);
  };

  for (const { source, css: raw } of sources) {
    const css = stripComments(raw);

    // Two buckets, because they answer different questions.
    //
    // `colors` is every distinct literal as written, which is what you must
    // edit by hand. `hues` is the distinct colour ignoring opacity, which is
    // what the design actually uses.
    //
    // They are wildly different here, and only the second is a palette size.
    // Counting literals made one gold, #cdbb78, into THIRTEEN colours -- it is
    // written at thirteen opacities. Across the site that turned 31 colours
    // into a reported 87, and a budget set against that number was measuring
    // the wrong thing. Verified three independent ways: by re-parsing this
    // script's own output, by a separate extractor, and by reading the
    // computed values the browser actually paints.
    for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
      add('colors', normalizeHex(m[0]), source);
      add('hues', hueOf(normalizeHex(m[0])), source);
    }
    for (const m of css.matchAll(/\b(?:rgba?|hsla?)\([^)]*\)/gi)) {
      add('colors', m[0].toLowerCase(), source);
      add('hues', hueOf(m[0].toLowerCase()), source);
    }

    for (const m of css.matchAll(/font-size\s*:\s*([^;}]+)/gi)) add('fontSizes', m[1], source);
    for (const m of css.matchAll(/font-family\s*:\s*([^;}]+)/gi)) add('fontFamilies', m[1], source);
    for (const m of css.matchAll(/border-radius\s*:\s*([^;}]+)/gi)) add('radii', m[1], source);
    for (const m of css.matchAll(/box-shadow\s*:\s*([^;}]+)/gi)) add('shadows', m[1], source);
    for (const m of css.matchAll(/z-index\s*:\s*([^;}]+)/gi)) add('zIndexes', m[1], source);
    for (const m of css.matchAll(/transition(?:-duration)?\s*:\s*([^;}]+)/gi)) {
      for (const d of m[1].matchAll(/\b\d*\.?\d+m?s\b/g)) add('transitionDurations', d[0], source);
    }
    for (const m of css.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) add('customProps', m[1], source);
  }
  return buckets;
}

/** The colour with its opacity discarded: "#rrggbb", or the input if unparsable. */
function hueOf(token) {
  const t = token.trim().toLowerCase();
  if (t.startsWith('#')) {
    const h = t.slice(1);
    if (h.length === 3) return '#' + [0, 1, 2].map((i) => h[i] + h[i]).join('');
    if (h.length >= 6) return '#' + h.slice(0, 6);
    return t;
  }
  const m = /rgba?\(\s*([\d.]+)\D+([\d.]+)\D+([\d.]+)/.exec(t);
  if (!m) return t;
  return '#' + [1, 2, 3].map((i) => Math.round(Number(m[i])).toString(16).padStart(2, '0')).join('');
}

/** Group colors that are visually ~identical but written differently. */
function nearDuplicateColors(colors, threshold = 28) {
  const hexes = [...colors.keys()].filter((c) => c.startsWith('#'));
  const clusters = [];
  const used = new Set();
  for (const a of hexes) {
    if (used.has(a)) continue;
    const near = hexes.filter((b) => b !== a && !used.has(b) && colorDistance(a, b) < threshold);
    if (near.length) {
      [a, ...near].forEach((c) => used.add(c));
      clusters.push([a, ...near]);
    }
  }
  return clusters;
}

// --------------------------------------------------------------- page <head>

function auditHeads() {
  const rows = [];
  for (const rel of ['index.html', 'ant.html', 'resume/index.html']) {
    const html = read(rel);
    if (html === null) continue;
    const pick = (re) => (html.match(re)?.[1] ?? null);
    rows.push({
      page: rel,
      title: pick(/<title>([\s\S]*?)<\/title>/i)?.replace(/\s+/g, ' ').trim() ?? null,
      canonical: pick(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i),
      themeColor: pick(/<meta[^>]*name="theme-color"[^>]*content="([^"]*)"/i),
      description: pick(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.slice(0, 60) ?? null,
      stylesheets: [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]*)"/gi)].map((m) => m[1]),
      inlineStyleLines: (html.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? '').split('\n').length - 1,
    });
  }
  return rows;
}

// ----------------------------------------------------------------- reporting

const sources = collectCss();
const buckets = extract(sources);
const heads = auditHeads();
const colorClusters = nearDuplicateColors(buckets.colors);

const counts = Object.fromEntries(Object.keys(BUDGETS).map((k) => [k, buckets[k].size]));
const over = Object.entries(BUDGETS).filter(([k, max]) => counts[k] > max);

// Pages whose <head> disagrees with the others.
const headIssues = [];
// Different pages *should* have different canonicals; the smell is two pages
// claiming the same one, or two pages shipping the same <title>.
const byCanonical = new Map();
for (const h of heads) {
  if (!h.canonical) continue;
  byCanonical.set(h.canonical, [...(byCanonical.get(h.canonical) ?? []), h.page]);
}
for (const [url, pages] of byCanonical) {
  if (pages.length > 1) headIssues.push(`${pages.join(' and ')} both claim canonical ${url}`);
}
const byTitle = new Map();
for (const h of heads) {
  if (!h.title) continue;
  byTitle.set(h.title, [...(byTitle.get(h.title) ?? []), h.page]);
}
for (const [title, pages] of byTitle) {
  if (pages.length > 1) headIssues.push(`${pages.join(' and ')} ship an identical <title>: "${title}"`);
}
const themes = new Set(heads.map((h) => h.themeColor).filter(Boolean));
if (themes.size > 1) headIssues.push(`theme-color disagrees: ${[...themes].join(' vs ')}`);
for (const h of heads) {
  if (!h.canonical) headIssues.push(`${h.page}: no canonical`);
  if (!h.themeColor) headIssues.push(`${h.page}: no theme-color`);
  if (!h.description) headIssues.push(`${h.page}: no meta description`);
}
if (JSON_OUT) {
  console.log(
    JSON.stringify(
      { counts, budgets: BUDGETS, over: over.map(([k]) => k), colorClusters, heads, headIssues,
        values: Object.fromEntries(Object.entries(buckets).map(([k, m]) => [k, [...m.keys()]])) },
      null,
      2,
    ),
  );
  process.exit(STRICT && (over.length || headIssues.length) ? 1 : 0);
}

const bar = (n, max) => (n > max ? `\x1b[31m${n}\x1b[0m / ${max}` : `\x1b[32m${n}\x1b[0m / ${max}`);

console.log('\n\x1b[1mDesign drift audit\x1b[0m');
console.log(`  ${sources.length} css sources scanned\n`);

for (const { source, css } of sources) {
  const lines = css.split('\n').length;
  console.log(`  ${String(lines).padStart(5)} lines  ${source}`);
}

console.log('\n\x1b[1mDistinct values vs budget\x1b[0m');
for (const k of Object.keys(BUDGETS)) {
  console.log(`  ${k.padEnd(22)} ${bar(counts[k], BUDGETS[k])}`);
}
console.log(`  ${'customProps (tokens)'.padEnd(22)} ${buckets.customProps.size}`);
console.log(
  `\n  ${'colour literals'.padEnd(22)} ${buckets.colors.size}` +
  `   (the same ${buckets.hues.size} colours written at different opacities)`,
);

if (colorClusters.length) {
  console.log('\n\x1b[1mNear-duplicate colors\x1b[0m  (visually the same, written differently)');
  for (const cluster of colorClusters) {
    console.log(`  ${cluster.join('  ~  ')}`);
    for (const c of cluster) {
      console.log(`      ${c}  ${[...buckets.colors.get(c)].join(', ')}`);
    }
  }
}

console.log('\n\x1b[1mPer-page <head>\x1b[0m');
for (const h of heads) {
  console.log(`  ${h.page}`);
  console.log(`      title        ${h.title}`);
  console.log(`      canonical    ${h.canonical ?? '\x1b[31mmissing\x1b[0m'}`);
  console.log(`      theme-color  ${h.themeColor ?? '\x1b[31mmissing\x1b[0m'}`);
  console.log(`      stylesheets  ${h.stylesheets.length ? h.stylesheets.join(', ') : '\x1b[33mnone linked\x1b[0m'}`);
  console.log(`      inline css   ${h.inlineStyleLines} lines`);
}

if (headIssues.length) {
  console.log('\n\x1b[1mHead inconsistencies\x1b[0m');
  for (const i of headIssues) console.log(`  - ${i}`);
}

const onlyOnce = Object.entries(buckets)
  .filter(([k]) => k !== 'customProps' && k !== 'colors')
  .map(([k, m]) => [k, [...m.entries()].filter(([, s]) => s.size === 1).length])
  .filter(([, n]) => n > 0);
if (onlyOnce.length) {
  console.log('\n\x1b[1mOne-off values\x1b[0m  (used in exactly one source — candidates to fold into tokens)');
  for (const [k, n] of onlyOnce) console.log(`  ${k.padEnd(22)} ${n}`);
}

console.log('');
if (over.length) {
  console.log(`\x1b[31m${over.length} budget(s) exceeded:\x1b[0m ${over.map(([k]) => k).join(', ')}`);
} else {
  console.log('\x1b[32mAll budgets within range.\x1b[0m');
}
if (buckets.customProps.size < 10) {
  console.log('\x1b[33mAlmost no CSS custom properties — there is no shared token layer to drift from.\x1b[0m');
}
console.log('');

process.exit(STRICT && (over.length || headIssues.length) ? 1 : 0);

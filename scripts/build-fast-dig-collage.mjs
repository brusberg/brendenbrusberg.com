import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANALYSIS_DIR = path.join(ROOT, 'analysis');
const SEEDS = Array.from({ length: 10 }, (_, index) => index + 1);
const WORLD_WIDTH = 192;
const WORLD_HEIGHT = 112;
const CARD_WIDTH = 420;
const CARD_HEIGHT = 300;
const LABEL_HEIGHT = 34;
const GAP = 18;
const PAD = 24;
const COLUMNS = 5;
const ROWS = Math.ceil(SEEDS.length / COLUMNS);
const IMAGE_WIDTH = CARD_WIDTH - 20;
const IMAGE_HEIGHT = Math.round((WORLD_HEIGHT / WORLD_WIDTH) * IMAGE_WIDTH);
const WIDTH = PAD * 2 + COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GAP;
const HEIGHT = PAD * 2 + ROWS * CARD_HEIGHT + (ROWS - 1) * GAP + 54;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    };
    return replacements[character];
  });
}

function readSeedSvg(seed) {
  const svgPath = path.join(ANALYSIS_DIR, `fast-dig-seed-${seed}-300s-1000x.svg`);
  const source = fs.readFileSync(svgPath, 'utf8').replaceAll(/<rect[^>]*(?:x|y)="NaN"[^>]*\/>\n?/g, '');
  const bodyStart = source.indexOf('<rect x="0" y="0" width="192" height="112"');
  const bodyEnd = source.lastIndexOf('</svg>');

  if (bodyStart === -1 || bodyEnd === -1) {
    throw new Error(`Could not extract SVG body from ${svgPath}`);
  }

  return source.slice(bodyStart, bodyEnd).trim();
}

function readSeedMetrics(seed) {
  const jsonPath = path.join(ANALYSIS_DIR, `fast-dig-seed-${seed}-300s-1000x.json`);
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function renderCard(seed, index) {
  const data = readSeedMetrics(seed);
  const snapshot = data.snapshot;
  const lastSample = data.sampleSummary.last;
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  const x = PAD + column * (CARD_WIDTH + GAP);
  const y = PAD + 54 + row * (CARD_HEIGHT + GAP);
  const metrics = `${snapshot.ants.length} ants / ${snapshot.larvae.length} larvae / ${snapshot.tunnelCount} tunnels / ${lastSample.idleDiggers} idle diggers`;
  const runtime = `${(data.runtimeMs / 1000).toFixed(1)}s runtime, ${snapshot.storedFood} stored food`;
  const imageBody = readSeedSvg(seed);

  return `
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="#0b120d" stroke="#334029" stroke-width="1.2"/>
    <text x="12" y="21" fill="#f8f2de" font-size="15" font-weight="700">Seed ${seed}</text>
    <text x="84" y="21" fill="#c9d99a" font-size="10" font-weight="700">${escapeXml(metrics)}</text>
    <text x="12" y="35" fill="#9ea28d" font-size="9">${escapeXml(runtime)}</text>
    <svg x="10" y="${LABEL_HEIGHT + 10}" width="${IMAGE_WIDTH}" height="${IMAGE_HEIGHT}" viewBox="0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}" shape-rendering="crispEdges">
${imageBody}
    </svg>
  </g>`;
}

const cards = SEEDS.map(renderCard).join('\n');
const output = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">
  <title>Fast digging seed collage</title>
  <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#071009"/>
  <text x="${PAD}" y="30" fill="#f8f2de" font-family="ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="24" font-weight="800">Fast Digging Collage</text>
  <text x="${PAD}" y="50" fill="#b9c996" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12">10 parallel seeds, 300 simulated seconds, dig rate 1000x. Labels show final state.</text>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
${cards}
  </g>
</svg>
`;

const outputPath = path.join(ANALYSIS_DIR, 'fast-dig-collage-10-seeds.svg');
fs.writeFileSync(outputPath, output);
console.log(outputPath);

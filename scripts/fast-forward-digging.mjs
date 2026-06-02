import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = '/private/tmp/ant-model-build';
const ANALYSIS_DIR = path.join(ROOT, 'analysis');

const DEFAULTS = {
  seconds: 300,
  seed: 1,
  digScale: 1000,
  forage: 0.62,
  dig: 0.34,
  nurse: 0.04,
  sampleEvery: 30,
};

function readArg(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => arg.startsWith(prefix));

  if (!raw) {
    return fallback;
  }

  const value = Number(raw.slice(prefix.length));
  return Number.isFinite(value) ? value : fallback;
}

function loadModelModule() {
  const candidates = [
    path.join(BUILD_DIR, 'AntModel.js'),
    path.join(BUILD_DIR, 'src', 'sim', 'AntModel.js'),
  ];
  const modulePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!modulePath) {
    throw new Error(`Could not find compiled AntModel.js in ${BUILD_DIR}. Run: pnpm exec tsc -p tsconfig.tune.json`);
  }

  return import(pathToFileURL(modulePath).href);
}

function fixed(value, places = 2) {
  return Number(value).toFixed(places);
}

function color([r, g, b]) {
  const hex = [r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
}

function mix(base, overlay, alpha) {
  return [
    base[0] * (1 - alpha) + overlay[0] * alpha,
    base[1] * (1 - alpha) + overlay[1] * alpha,
    base[2] * (1 - alpha) + overlay[2] * alpha,
  ];
}

function seededNoise(index) {
  let seed = (0x8f2d3a4b + index * 0x6d2b79f5) | 0;
  let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return ((value ^ (value >>> 14)) >>> 0) & 255;
}

function foodPalette(kind) {
  return kind === 'crumb' ? [205, 177, 101] : kind === 'seed' ? [132, 151, 82] : [82, 130, 75];
}

function renderCells({ model, GRID_HEIGHT, GRID_WIDTH, SURFACE_ROWS }) {
  const rects = [];

  for (const cell of model.cells) {
    const index = model.index(cell.x, cell.y);
    const noise = seededNoise(index);
    let pixel;

    if (cell.zone === 'outside') {
      pixel = [33 + noise * 0.04, 48 + noise * 0.075, 37 + noise * 0.04];
    } else if (cell.terrain === 'tunnel') {
      pixel = [65 + noise * 0.025, 53 + noise * 0.025, 42 + noise * 0.018];
    } else {
      const depth = (cell.y - SURFACE_ROWS) / (GRID_HEIGHT - SURFACE_ROWS);
      pixel = [29 + depth * 16 + noise * 0.022, 28 + depth * 9 + noise * 0.018, 29 + depth * 7 + noise * 0.014];
    }

    if (cell.digProgress > 0) {
      pixel = mix(pixel, [145, 112, 72], Math.min(0.62, 0.22 + cell.digProgress * 0.55));
    }

    if (cell.pheromoneFood > 0.02) {
      pixel = mix(pixel, [116, 188, 128], Math.min(0.45, cell.pheromoneFood * 0.42));
    }

    if (cell.pheromoneHome > 0.08) {
      pixel = mix(pixel, [224, 198, 118], Math.min(0.16, cell.pheromoneHome * 0.12));
    }

    if (cell.y === SURFACE_ROWS - 1 || cell.y === SURFACE_ROWS) {
      pixel = mix(pixel, [106, 89, 58], 0.34);
    }

    rects.push(`<rect x="${cell.x}" y="${cell.y}" width="1" height="1" fill="${color(pixel)}"/>`);
  }

  return rects.join('\n');
}

function renderOverlay({ model, snapshot, NEST_ENTRANCE }) {
  const parts = [];

  parts.push(`<circle cx="${fixed(NEST_ENTRANCE.x)}" cy="${fixed(NEST_ENTRANCE.y)}" r="3.5" fill="#14120f" opacity="0.8"/>`);

  for (const site of snapshot.storageSites) {
    const fullness = site.capacity > 0 ? site.stored / site.capacity : 0;
    parts.push(`<circle cx="${fixed(site.x)}" cy="${fixed(site.y)}" r="${fixed(1.8 + fullness * 1.5)}" fill="#130f0c" opacity="${fixed(0.18 + fullness * 0.18)}"/>`);
  }

  for (const pellet of snapshot.storedFoodPellets) {
    parts.push(`<circle cx="${fixed(pellet.x)}" cy="${fixed(pellet.y)}" r="0.58" fill="${color(foodPalette(pellet.kind))}" opacity="0.78"/>`);
  }

  for (const food of snapshot.food) {
    const radius = 1 + Math.sqrt(food.amount) * 0.48;
    parts.push(`<circle cx="${fixed(food.x + 0.4)}" cy="${fixed(food.y + 0.6)}" r="${fixed(radius)}" fill="${color(foodPalette(food.kind))}" opacity="0.86"/>`);
  }

  for (const larva of snapshot.larvae) {
    parts.push(`<circle cx="${fixed(larva.x)}" cy="${fixed(larva.y)}" r="0.85" fill="#e3ce98" opacity="0.85"/>`);
  }

  const queen = snapshot.queen;
  const queenForward = { x: Math.cos(queen.heading), y: Math.sin(queen.heading) };
  const queenSide = { x: -queenForward.y, y: queenForward.x };
  const queenPixel = (forwardOffset, sideOffset, fill, opacity = 0.98) => {
    const x = queen.x + queenForward.x * forwardOffset + queenSide.x * sideOffset;
    const y = queen.y + queenForward.y * forwardOffset + queenSide.y * sideOffset;
    parts.push(`<rect x="${fixed(Math.round(x))}" y="${fixed(Math.round(y))}" width="1" height="1" fill="${fill}" opacity="${opacity}"/>`);
  };

  queenPixel(-1.45, 0, '#060705');
  queenPixel(-0.55, 0, '#0c0d09');
  queenPixel(0.25, 0, '#060705');
  queenPixel(-0.45, -0.9, '#060705', 0.9);
  queenPixel(-0.45, 0.9, '#060705', 0.9);
  queenPixel(1.18, 0, queen.hunger > 0.58 ? '#ebbf4c' : '#d6ae3f', 0.96);

  for (const ant of snapshot.ants) {
    const marker = ant.task === 'dig' ? '#6897a4' : ant.task === 'nurse' ? '#9a7eb2' : null;
    const heading = Number.isFinite(ant.heading) ? ant.heading : 0;

    if (marker && !ant.carryingFood) {
      parts.push(`<circle cx="${fixed(ant.x)}" cy="${fixed(ant.y)}" r="1.35" fill="${marker}" opacity="0.22"/>`);
    }

    parts.push(`<rect x="${fixed(ant.x - 0.8)}" y="${fixed(ant.y - 0.35)}" width="1.8" height="0.8" fill="#121410" opacity="0.96"/>`);
    parts.push(`<rect x="${fixed(ant.x + Math.cos(heading) * 0.9)}" y="${fixed(ant.y + Math.sin(heading) * 0.9)}" width="0.8" height="0.8" fill="#070806" opacity="0.9"/>`);

    if (ant.carryingFood || ant.carryingCareFood) {
      const carriedColor = ant.carryingCareFood ? '#e6d193' : color(foodPalette(ant.carriedFoodKind ?? 'crumb'));
      parts.push(`<rect x="${fixed(ant.x - 0.2)}" y="${fixed(ant.y - 1.15)}" width="0.8" height="0.8" fill="${carriedColor}" opacity="0.95"/>`);
    }
  }

  return parts.join('\n');
}

function renderSvg(modelModule, model, snapshot, options) {
  const { GRID_HEIGHT, GRID_WIDTH, NEST_ENTRANCE, SURFACE_ROWS } = modelModule;
  const title = `Fast digging seed ${options.seed}, ${options.seconds}s, dig ${options.digScale}x`;
  const subtitle = `${snapshot.ants.length} ants, ${snapshot.larvae.length} larvae, ${snapshot.tunnelCount} tunnels, ${snapshot.tunnelsDug} dug, ${snapshot.storedFood} stored food`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_WIDTH} ${GRID_HEIGHT}" width="${GRID_WIDTH * 8}" height="${GRID_HEIGHT * 8}" shape-rendering="crispEdges">
  <title>${title}</title>
  <desc>${subtitle}</desc>
  <rect x="0" y="0" width="${GRID_WIDTH}" height="${GRID_HEIGHT}" fill="#0a100b"/>
  <g>
${renderCells({ model, GRID_HEIGHT, GRID_WIDTH, SURFACE_ROWS })}
  </g>
  <g>
${renderOverlay({ model, snapshot, NEST_ENTRANCE })}
  </g>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="3" fill="#f8f2de">
    <rect x="1" y="1" width="78" height="10" fill="#09100b" opacity="0.76"/>
    <text x="2" y="5">${title}</text>
    <text x="2" y="9">${subtitle}</text>
  </g>
</svg>
`;
}

function summarizeSamples(samples) {
  const last = samples.at(-1);
  return {
    last,
    idleDiggerWindows: samples.filter((sample) => sample.diggers > 0 && sample.idleDiggers > 0),
    noActiveDigWindows: samples.filter((sample) => sample.diggers > 0 && sample.activeDigCells === 0),
  };
}

const options = {
  seconds: readArg('seconds', DEFAULTS.seconds),
  seed: readArg('seed', DEFAULTS.seed),
  digScale: readArg('dig-scale', DEFAULTS.digScale),
  forage: readArg('forage', DEFAULTS.forage),
  dig: readArg('dig', DEFAULTS.dig),
  nurse: readArg('nurse', DEFAULTS.nurse),
  sampleEvery: readArg('sample-every', DEFAULTS.sampleEvery),
};

const modelModule = await loadModelModule();
const { AntModel, DEFAULT_ANT_MODEL_CONFIG, FRAME_STEP } = modelModule;
const model = new AntModel({
  seed: options.seed,
  digRatePerSecond: DEFAULT_ANT_MODEL_CONFIG.digRatePerSecond * options.digScale,
});

model.setTaskAllocation({
  forage: options.forage,
  dig: options.dig,
  nurse: options.nurse,
});

const steps = Math.round(options.seconds / FRAME_STEP);
const sampleStep = Math.max(1, Math.round(options.sampleEvery / FRAME_STEP));
const samples = [];
const startedAt = performance.now();

for (let step = 0; step <= steps; step += 1) {
  if (step > 0) {
    model.update(FRAME_STEP);
  }

  if (step % sampleStep === 0 || step === steps) {
    const snapshot = model.snapshot();
    const diggers = snapshot.ants.filter((ant) => ant.task === 'dig');
    samples.push({
      time: snapshot.time,
      ants: snapshot.ants.length,
      larvae: snapshot.larvae.length,
      storedFood: snapshot.storedFood,
      tunnelCount: snapshot.tunnelCount,
      tunnelsDug: snapshot.tunnelsDug,
      frontierCount: snapshot.frontierCount,
      activeDigCells: snapshot.activeDigCells,
      diggers: diggers.length,
      idleDiggers: diggers.filter((ant) => ant.activity === 'idle').length,
      digging: diggers.filter((ant) => ant.activity === 'digging').length,
      seekingDigSite: diggers.filter((ant) => ant.activity === 'seekDigSite').length,
    });
  }
}

const snapshot = model.snapshot();
const elapsedMs = performance.now() - startedAt;
const basename = `fast-dig-seed-${options.seed}-${Math.round(options.seconds)}s-${options.digScale}x`;
const svgPath = path.join(ANALYSIS_DIR, `${basename}.svg`);
const jsonPath = path.join(ANALYSIS_DIR, `${basename}.json`);
const summary = {
  options,
  runtimeMs: Number(elapsedMs.toFixed(2)),
  snapshot,
  samples,
  sampleSummary: summarizeSamples(samples),
  outputs: {
    svgPath,
    jsonPath,
  },
};

fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
fs.writeFileSync(svgPath, renderSvg(modelModule, model, snapshot, options));
fs.writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify({
  options,
  runtimeMs: summary.runtimeMs,
  final: {
    time: snapshot.time,
    ants: snapshot.ants.length,
    larvae: snapshot.larvae.length,
    storedFood: snapshot.storedFood,
    tunnelCount: snapshot.tunnelCount,
    tunnelsDug: snapshot.tunnelsDug,
    frontierCount: snapshot.frontierCount,
    activeDigCells: snapshot.activeDigCells,
    taskCounts: snapshot.taskCounts,
    activityCounts: snapshot.activityCounts,
  },
  sampleSummary: summary.sampleSummary,
  outputs: summary.outputs,
}, null, 2));

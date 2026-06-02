import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = '/private/tmp/ant-model-build';
const SUMMARY_PATH = path.join(ROOT, 'analysis', 'ant-tuning-summary.txt');
const DURATION_SECONDS = 45;
const SEEDS = Array.from({ length: 12 }, (_, index) => index + 1);

const ACTION_KEYS = [
  'spawn',
  'hatchLarva',
  'assignTask',
  'directFood',
  'pickupFood',
  'followFoodPheromone',
  'exploreRandom',
  'followHomePheromone',
  'returnHomeFallback',
  'staleFoodTrail',
  'returnHomeAfterStaleTrail',
  'carryToStorage',
  'leaveNest',
  'enterNest',
  'seekStoredFood',
  'eatStoredFood',
  'eatFieldFood',
  'hungrySeekFood',
  'queenEatStoredFood',
  'queenLayLarva',
  'larvaEatStoredFood',
  'larvaMature',
  'larvaStarved',
  'pickupCareFood',
  'deliverCareFood',
  'feedQueen',
  'feedLarva',
  'seekDigSite',
  'digging',
  'openTunnel',
  'nurseIdle',
  'avoidBoundary',
  'depositFood',
];

const VARIANTS = [
  {
    name: 'current-balanced',
    config: {},
  },
  {
    name: 'vision-9-balanced',
    config: {
      foodSenseRadius: 9,
    },
  },
  {
    name: 'vision-10-balanced',
    config: {
      foodSenseRadius: 10,
    },
  },
  {
    name: 'old-wide-vision',
    config: {
      foodSenseRadius: 18,
      pheromoneSenseRadius: 5,
      foodPheromoneDecayPerSecond: 0.08,
      foodPheromoneDrop: 0.05,
      foodPheromoneFollowChance: 0.7,
      foodTrailSteer: 0.08,
    },
  },
  {
    name: 'vision-8-balanced',
    config: {
      foodSenseRadius: 8,
    },
  },
  {
    name: 'vision-10-slower-decay',
    config: {
      foodPheromoneDecayPerSecond: 0.035,
      foodPheromoneDrop: 0.075,
    },
  },
  {
    name: 'vision-10-lower-trust',
    config: {
      foodPheromoneFollowChance: 0.88,
    },
  },
  {
    name: 'vision-10-very-high-trust',
    config: {
      foodPheromoneFollowChance: 0.98,
    },
  },
  {
    name: 'vision-10-stronger-steer',
    config: {
      foodTrailSteer: 0.14,
    },
  },
  {
    name: 'less-wander',
    config: {
      randomTurnStrength: 0.45,
    },
  },
];

function emptyCounts() {
  return Object.fromEntries(ACTION_KEYS.map((key) => [key, 0]));
}

function addCounts(target, source) {
  for (const key of ACTION_KEYS) {
    target[key] += source[key] ?? 0;
  }
}

function percent(value, total) {
  if (total === 0) {
    return '0.0%';
  }

  return `${((value / total) * 100).toFixed(1)}%`;
}

function fixed(value, places = 2) {
  return Number(value).toFixed(places);
}

function pad(value, length) {
  return String(value).padEnd(length, ' ');
}

async function loadModelModule() {
  const candidates = [
    path.join(BUILD_DIR, 'AntModel.js'),
    path.join(BUILD_DIR, 'src', 'sim', 'AntModel.js'),
  ];
  const modulePath = candidates.find((candidate) => fs.existsSync(candidate));

  if (!modulePath) {
    throw new Error(`Could not find compiled AntModel.js in ${BUILD_DIR}`);
  }

  return import(pathToFileURL(modulePath).href);
}

function runTrial({ AntModel, FRAME_STEP, GRID_WIDTH, GRID_HEIGHT }, variant, seed) {
  const model = new AntModel({ ...variant.config, seed });
  const steps = Math.round(DURATION_SECONDS / FRAME_STEP);
  const counts = emptyCounts();
  let impossiblePositions = 0;
  let carryingTicks = 0;
  let longCarryTicks = 0;
  let maxCarryingSeconds = 0;

  for (let step = 0; step < steps; step += 1) {
    model.update(FRAME_STEP);

    for (const ant of model.ants) {
      counts[ant.lastAction] = (counts[ant.lastAction] ?? 0) + 1;

      if (ant.carryingFood) {
        carryingTicks += 1;
        maxCarryingSeconds = Math.max(maxCarryingSeconds, ant.carryingSeconds);

        if (ant.carryingSeconds > 16) {
          longCarryTicks += 1;
        }
      }

      if (ant.x < 0 || ant.y < 0 || ant.x >= GRID_WIDTH || ant.y >= GRID_HEIGHT) {
        impossiblePositions += 1;
      }
    }
  }

  return {
    storedFood: model.storedFood,
    remainingFood: model.food.length,
    counts,
    totalActionTicks: steps * model.ants.length,
    carryingTicks,
    longCarryTicks,
    maxCarryingSeconds,
    impossiblePositions,
  };
}

function summarizeVariant(modelModule, variant) {
  const aggregate = {
    storedFood: 0,
    remainingFood: 0,
    counts: emptyCounts(),
    totalActionTicks: 0,
    carryingTicks: 0,
    longCarryTicks: 0,
    maxCarryingSeconds: 0,
    impossiblePositions: 0,
  };

  for (const seed of SEEDS) {
    const trial = runTrial(modelModule, variant, seed);
    aggregate.storedFood += trial.storedFood;
    aggregate.remainingFood += trial.remainingFood;
    aggregate.totalActionTicks += trial.totalActionTicks;
    aggregate.carryingTicks += trial.carryingTicks;
    aggregate.longCarryTicks += trial.longCarryTicks;
    aggregate.maxCarryingSeconds = Math.max(aggregate.maxCarryingSeconds, trial.maxCarryingSeconds);
    aggregate.impossiblePositions += trial.impossiblePositions;
    addCounts(aggregate.counts, trial.counts);
  }

  const directShare = aggregate.counts.directFood / aggregate.totalActionTicks;
  const trailShare = aggregate.counts.followFoodPheromone / aggregate.totalActionTicks;
  const exploreShare = aggregate.counts.exploreRandom / aggregate.totalActionTicks;
  const fallbackShare = aggregate.counts.returnHomeFallback / aggregate.totalActionTicks;
  const longCarryShare = aggregate.longCarryTicks / aggregate.totalActionTicks;
  const avgStoredFood = aggregate.storedFood / SEEDS.length;
  const score =
    avgStoredFood * 3 +
    trailShare * 30 +
    exploreShare * 4 -
    directShare * 5 -
    fallbackShare * 8 -
    longCarryShare * 60 -
    aggregate.impossiblePositions * 100;

  return {
    name: variant.name,
    config: variant.config,
    avgStoredFood,
    avgRemainingFood: aggregate.remainingFood / SEEDS.length,
    score,
    counts: aggregate.counts,
    totalActionTicks: aggregate.totalActionTicks,
    carryingShare: aggregate.carryingTicks / aggregate.totalActionTicks,
    longCarryShare,
    maxCarryingSeconds: aggregate.maxCarryingSeconds,
    impossiblePositions: aggregate.impossiblePositions,
  };
}

function formatSummary(results) {
  const ordered = [...results].sort((a, b) => b.score - a.score);
  const best = ordered[0];
  const lines = [
    `Ant tuning summary`,
    `Duration: ${DURATION_SECONDS}s per seed`,
    `Seeds: ${SEEDS.join(', ')}`,
    `Trial count: ${results.length * SEEDS.length}`,
    ``,
    [
      pad('variant', 29),
      pad('food', 7),
      pad('direct', 8),
      pad('trail', 8),
      pad('explore', 8),
      pad('home', 8),
      pad('fallback', 9),
      pad('carry', 8),
      pad('long', 7),
      pad('maxc', 7),
      pad('score', 8),
      'badpos',
    ].join(''),
  ];

  for (const result of ordered) {
    lines.push(
      [
        pad(result.name, 29),
        pad(fixed(result.avgStoredFood), 7),
        pad(percent(result.counts.directFood, result.totalActionTicks), 8),
        pad(percent(result.counts.followFoodPheromone, result.totalActionTicks), 8),
        pad(percent(result.counts.exploreRandom, result.totalActionTicks), 8),
        pad(percent(result.counts.followHomePheromone, result.totalActionTicks), 8),
        pad(percent(result.counts.returnHomeFallback, result.totalActionTicks), 9),
        pad(percent(result.carryingShare, 1), 8),
        pad(percent(result.longCarryShare, 1), 7),
        pad(fixed(result.maxCarryingSeconds, 1), 7),
        pad(fixed(result.score), 8),
        result.impossiblePositions,
      ].join(''),
    );
  }

  lines.push(``);
  lines.push(`Recommended by score: ${best?.name ?? 'none'}`);

  if (best) {
    lines.push(`Config delta: ${JSON.stringify(best.config, null, 2)}`);
  }

  lines.push(``);
  lines.push(`Notes:`);
  lines.push(`- "direct" means an ant saw food inside foodSenseRadius and steered straight at it.`);
  lines.push(`- "trail" means an ant did not see food directly and chose a food pheromone cell.`);
  lines.push(`- "explore" means neither direct food nor a chosen pheromone target won that tick.`);
  lines.push(`- "long" means an ant had been carrying food for more than 16 seconds; lower is better.`);
  lines.push(`- badpos should stay at 0; any nonzero value means ants escaped the grid.`);

  return `${lines.join('\n')}\n`;
}

const modelModule = await loadModelModule();
const results = VARIANTS.map((variant) => summarizeVariant(modelModule, variant));
const summary = formatSummary(results);

fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
fs.writeFileSync(SUMMARY_PATH, summary, 'utf8');
process.stdout.write(summary);

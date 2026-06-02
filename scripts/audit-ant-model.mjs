import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = '/private/tmp/ant-model-build';
const ANALYSIS_DIR = path.join(ROOT, 'analysis');
const TEXT_PATH = path.join(ANALYSIS_DIR, 'ant-normal-audit.txt');
const JSON_PATH = path.join(ANALYSIS_DIR, 'ant-normal-audit.json');
const DURATION_SECONDS = 720;
const SAMPLE_SECONDS = 1;
const SEEDS = [1, 2, 3, 4];

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

function increment(counts, key) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function badStoredPellets(model, snapshot) {
  return snapshot.storedFoodPellets.filter((pellet) => {
    const cell = model.cellAt(pellet.x, pellet.y);
    return cell?.zone !== 'inside' || cell.terrain !== 'tunnel';
  });
}

function summarizeStorage(snapshot) {
  const filledSites = snapshot.storageSites.filter((site) => site.stored >= site.capacity).length;
  const siteStored = snapshot.storageSites.reduce((sum, site) => sum + site.stored, 0);

  return {
    siteCount: snapshot.storageSites.length,
    filledSites,
    siteStored,
    loosePellets: snapshot.storedFoodPellets.filter((pellet) => pellet.siteId === null).length,
    averagePelletsPerSite: snapshot.storageSites.length === 0 ? 0 : Number((siteStored / snapshot.storageSites.length).toFixed(2)),
  };
}

function runSeed(modelModule, seed) {
  const { AntModel, FRAME_STEP } = modelModule;
  const model = new AntModel({ seed });
  const steps = Math.round(DURATION_SECONDS / FRAME_STEP);
  const sampleStep = Math.max(1, Math.round(SAMPLE_SECONDS / FRAME_STEP));
  const seenEvents = new Set();
  const eventCounts = {};
  let maxWorkerHunger = 0;
  let maxLarvaStarvationSeconds = 0;
  let maxCarrierSeconds = 0;
  let finalCarrierCount = 0;
  let finalCarrierMaxSeconds = 0;
  let longCarrierSamples = 0;
  let maxBadStoredPellets = 0;
  let badStoredPelletSamples = 0;

  for (let step = 0; step <= steps; step += 1) {
    if (step > 0) {
      model.update(FRAME_STEP);
    }

    if (step % sampleStep !== 0 && step !== steps) {
      continue;
    }

    const snapshot = model.snapshot();

    for (const event of snapshot.recentEvents) {
      if (seenEvents.has(event.id)) {
        continue;
      }

      seenEvents.add(event.id);
      increment(eventCounts, event.type);
    }

    for (const ant of snapshot.ants) {
      maxWorkerHunger = Math.max(maxWorkerHunger, ant.hunger);

      if (ant.carryingFood) {
        maxCarrierSeconds = Math.max(maxCarrierSeconds, ant.carryingSeconds);

        if (ant.carryingSeconds > 45) {
          longCarrierSamples += 1;
        }
      }
    }

    for (const larva of snapshot.larvae) {
      maxLarvaStarvationSeconds = Math.max(maxLarvaStarvationSeconds, larva.starvationSeconds);
    }

    const badPellets = badStoredPellets(model, snapshot).length;
    maxBadStoredPellets = Math.max(maxBadStoredPellets, badPellets);

    if (badPellets > 0) {
      badStoredPelletSamples += 1;
    }
  }

  const finalSnapshot = model.snapshot();
  const finalCarriers = finalSnapshot.ants.filter((ant) => ant.carryingFood);
  finalCarrierCount = finalCarriers.length;
  finalCarrierMaxSeconds = finalCarriers.reduce((max, ant) => Math.max(max, ant.carryingSeconds), 0);

  return {
    seed,
    final: {
      time: finalSnapshot.time,
      ants: finalSnapshot.ants.length,
      larvae: finalSnapshot.larvae.length,
      storedFood: finalSnapshot.storedFood,
      fieldFoodSources: finalSnapshot.food.length,
      tunnelCount: finalSnapshot.tunnelCount,
      tunnelsDug: finalSnapshot.tunnelsDug,
      frontierCount: finalSnapshot.frontierCount,
      taskCounts: finalSnapshot.taskCounts,
      activityCounts: finalSnapshot.activityCounts,
      storage: summarizeStorage(finalSnapshot),
      badStoredPellets: badStoredPellets(model, finalSnapshot).map((pellet) => ({
        id: pellet.id,
        siteId: pellet.siteId,
        x: pellet.x,
        y: pellet.y,
      })),
      carrierCount: finalCarrierCount,
      carrierMaxSeconds: Number(finalCarrierMaxSeconds.toFixed(2)),
    },
    maxWorkerHunger: Number(maxWorkerHunger.toFixed(3)),
    maxLarvaStarvationSeconds: Number(maxLarvaStarvationSeconds.toFixed(2)),
    maxCarrierSeconds: Number(maxCarrierSeconds.toFixed(2)),
    longCarrierSamples,
    maxBadStoredPellets,
    badStoredPelletSamples,
    eventCounts,
  };
}

function renderText(results) {
  const lines = [
    'Ant normal-speed audit',
    `Duration: ${DURATION_SECONDS}s per seed`,
    `Sample interval: ${SAMPLE_SECONDS}s`,
    `Seeds: ${SEEDS.join(', ')}`,
    '',
  ];

  for (const result of results) {
    const eventSummary = Object.entries(result.eventCounts)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${value}`)
      .join(', ');

    lines.push(`Seed ${result.seed}`);
    lines.push(
      `  final: ${result.final.ants} ants, ${result.final.larvae} larvae, ${result.final.storedFood} stored food, ${result.final.tunnelCount} tunnels`,
    );
    lines.push(
      `  storage: ${result.final.storage.siteCount} sites, ${result.final.storage.filledSites} full, ${result.final.storage.loosePellets} loose pellets, ${result.final.storage.averagePelletsPerSite} avg/site`,
    );
    lines.push(
      `  risk: max carrier ${result.maxCarrierSeconds}s, long carrier samples ${result.longCarrierSamples}, max hunger ${result.maxWorkerHunger}, max larva starvation ${result.maxLarvaStarvationSeconds}s`,
    );
    lines.push(
      `  carriers: final ${result.final.carrierCount}, final max ${result.final.carrierMaxSeconds}s`,
    );
    lines.push(
      `  invariant: final bad stored pellets ${result.final.badStoredPellets.length}, max bad stored pellets ${result.maxBadStoredPellets}, bad samples ${result.badStoredPelletSamples}`,
    );
    lines.push(`  events: ${eventSummary || 'none'}`);
    lines.push('');
  }

  const totalBadSamples = results.reduce((sum, result) => sum + result.badStoredPelletSamples, 0);
  const totalFinalBad = results.reduce((sum, result) => sum + result.final.badStoredPellets.length, 0);
  const worstCarrier = Math.max(...results.map((result) => result.maxCarrierSeconds));
  const worstLarvaStarvation = Math.max(...results.map((result) => result.maxLarvaStarvationSeconds));

  lines.push(`Totals`);
  lines.push(`  bad stored pellet samples: ${totalBadSamples}`);
  lines.push(`  final bad stored pellets: ${totalFinalBad}`);
  lines.push(`  worst carrier trip: ${worstCarrier.toFixed(2)}s`);
  lines.push(`  worst larva starvation: ${worstLarvaStarvation.toFixed(2)}s`);

  return `${lines.join('\n')}\n`;
}

const modelModule = await loadModelModule();
const startedAt = performance.now();
const results = SEEDS.map((seed) => runSeed(modelModule, seed));
const runtimeMs = Number((performance.now() - startedAt).toFixed(2));
const payload = {
  durationSeconds: DURATION_SECONDS,
  sampleSeconds: SAMPLE_SECONDS,
  seeds: SEEDS,
  runtimeMs,
  results,
};
const text = renderText(results);

fs.mkdirSync(ANALYSIS_DIR, { recursive: true });
fs.writeFileSync(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(TEXT_PATH, text, 'utf8');
process.stdout.write(text);
process.stdout.write(`Runtime: ${(runtimeMs / 1000).toFixed(1)}s\n`);

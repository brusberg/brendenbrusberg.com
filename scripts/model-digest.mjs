#!/usr/bin/env node
/*
 * Deterministic digest of AntModel behaviour, for before/after comparison.
 *
 *   pnpm exec tsc -p tsconfig.tune.json
 *   node scripts/model-digest.mjs > /tmp/before.json
 *   ...change the model...
 *   pnpm exec tsc -p tsconfig.tune.json
 *   node scripts/model-digest.mjs > /tmp/after.json
 *   node scripts/model-digest.mjs --compare /tmp/before.json /tmp/after.json
 *
 * The model is seeded, so identical inputs must produce an identical digest.
 * Any behavioural drift from a refactor shows up as a mismatch.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = '/private/tmp/ant-model-build';
const STEP = 1 / 60;
const SEEDS = [1, 2, 3, 7, 11];
const SECONDS = 420;          // 7 simulated minutes — well past the first hatches
const SAMPLE_EVERY = 30;      // seconds

const argv = process.argv.slice(2);
const compareIdx = argv.indexOf('--compare');

if (compareIdx !== -1) {
  const a = JSON.parse(fs.readFileSync(argv[compareIdx + 1], 'utf8'));
  const b = JSON.parse(fs.readFileSync(argv[compareIdx + 2], 'utf8'));
  let diffs = 0;
  for (const seed of Object.keys(a.runs)) {
    const ra = a.runs[seed], rb = b.runs[seed];
    if (!rb) { console.log(`seed ${seed}: missing in second file`); diffs++; continue; }
    for (let i = 0; i < ra.length; i++) {
      const x = JSON.stringify(ra[i]), y = JSON.stringify(rb[i]);
      if (x !== y) {
        if (diffs < 8) console.log(`seed ${seed} @${ra[i].t}s:\n  before ${x}\n  after  ${y}`);
        diffs++;
      }
    }
  }
  console.log(diffs === 0
    ? `IDENTICAL — ${Object.keys(a.runs).length} seeds × ${a.runs[Object.keys(a.runs)[0]].length} samples agree exactly`
    : `${diffs} sample(s) differ`);
  process.exit(diffs === 0 ? 0 : 1);
}

async function loadModel() {
  const candidates = [
    path.join(BUILD_DIR, 'AntModel.js'),
    path.join(BUILD_DIR, 'src', 'sim', 'AntModel.js'),
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (!found) throw new Error(`No compiled AntModel.js in ${BUILD_DIR}. Run: pnpm exec tsc -p tsconfig.tune.json`);
  return import(pathToFileURL(found).href);
}

const { AntModel } = await loadModel();

const digest = (model) => {
  const s = model.snapshot();
  const taskCounts = { forage: 0, dig: 0, nurse: 0 };
  for (const ant of s.ants ?? []) taskCounts[ant.task] = (taskCounts[ant.task] ?? 0) + 1;
  return {
    ants: (s.ants ?? []).length,
    food: s.foodCount ?? s.storedFood ?? 0,
    stored: s.storedFood ?? 0,
    brood: s.broodCount ?? s.hatchedAntCount ?? 0,
    tasks: taskCounts,
    // positions, rounded, so drift in movement is caught too
    pos: (s.ants ?? []).map((a) => `${Math.round(a.x)},${Math.round(a.y)}:${a.task}`).join('|'),
  };
};

const runs = {};
for (const seed of SEEDS) {
  const model = new AntModel({ seed });
  const samples = [];
  // Sample on the step index, not on a float modulo of accumulated time:
  // the latter silently skipped 6 of 14 samples to rounding.
  const totalSteps = SECONDS * 60;
  const everySteps = SAMPLE_EVERY * 60;
  for (let i = 1; i <= totalSteps; i++) {
    model.update(STEP);
    if (i % everySteps === 0) samples.push({ t: i / 60, ...digest(model) });
  }
  runs[seed] = samples;
}

console.log(JSON.stringify({ seeds: SEEDS, seconds: SECONDS, runs }, null, 0));

#!/usr/bin/env node
/*
 * Measure the panel flora: determinism, branch overlap, coverage, settling,
 * and how far a new sprout travels before it climbs.
 *
 *   node scripts/measure-flora.mjs
 *   node scripts/measure-flora.mjs --json
 *
 * It reads the real module out of index.html between the flora:begin and
 * flora:end markers and runs it against a stubbed canvas, so there is no second
 * copy of the algorithm to drift. Growth touches no DOM beyond clientWidth and
 * clientHeight, which is what makes that possible.
 *
 * The A/B arms are the same source with constants rewritten, so the only
 * variable between them is the feature under test:
 *   - "no density"  STEER_LO and BLOCK raised out of reach, SPREAD_BIAS zeroed:
 *                   every bud takes the first candidate angle, exactly as the
 *                   module behaved before the occupancy field existed.
 *   - "no spread"   SPREAD_PUSH zeroed and SPREAD_STEPS set to 1, so the
 *                   restoring force is at full strength from a sprout's first
 *                   step -- the old fork behaviour.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const BEGIN = '/* flora:begin';
const END = '/* flora:end */';
const b = SRC.indexOf(BEGIN);
const e = SRC.indexOf(END, b);
if (b < 0 || e < 0) {
  console.error('flora:begin / flora:end markers not found in index.html');
  process.exit(2);
}
const MODULE_SRC = SRC.slice(SRC.indexOf('const panelFlora', b), e);

const WIDTH = 434;
const HEIGHT = 1509;

const countSegs = (st) => st.vines.reduce((n, v) => n + v.segs.length, 0);

function makeCanvasStub(w, h) {
  const noop = () => {};
  const ctx = {
    setTransform: noop, clearRect: noop, translate: noop, fillRect: noop,
    globalAlpha: 1, fillStyle: '#000'
  };
  return {
    clientWidth: w,
    clientHeight: h,
    width: 0,
    height: 0,
    offsetParent: {},
    getContext: () => ctx
  };
}

/** Build and run one arm. `rewrite` patches constants in the module source. */
function run({ w = WIDTH, h = HEIGHT, panel = 'projects', rewrite = (s) => s, resizeTo = null } = {}) {
  const el = makeCanvasStub(w, h);
  const src = rewrite(MODULE_SRC);
  // eslint-disable-next-line no-new-func
  const factory = new Function(
    'document', 'window', 'dprCap', 'prefersReducedMotion', 'Math_',
    `${src}\nreturn panelFlora;`
  );
  const flora = factory(
    { getElementById: () => el },
    { devicePixelRatio: 1 },
    1.5,
    null,
    Math
  );

  flora.plant(panel);
  flora.plant('ants');       // a second panel render must NOT restart anything
  flora.plant('history');

  let steps = 0;
  const STEP_MS = 1000;      // one tick is far more than growthMs, so several
                             // grow() calls run per tick, up to the guard of 24
  // do/while, not while: `settled` starts true and only sow() clears it, so a
  // leading test skips the whole run. (It did, and reported a 12-segment
  // garden as if that were the design.)
  // Count real growth steps, not ticks: a tick runs up to 24 of them. The
  // module's fill time is growthMs per step, and FILL_SECONDS is a promise
  // about the whole garden, so steps x growthMs is the number to check.
  let growSteps = 0;
  const seen = new Set();
  do {
    const before = flora.debug();
    flora.tick(STEP_MS);
    const after = flora.debug();
    growSteps += Math.max(0, countSegs(after) - countSegs(before) ? 1 : 0);
    steps += 1;
    if (resizeTo && steps === 6) { el.clientWidth = resizeTo[0]; el.clientHeight = resizeTo[1]; }
    seen.add(countSegs(after));
  } while (!flora.debug().settled && steps < 20000);
  return { flora, state: flora.debug(), ticks: steps, el };
}

/** Overlap and coverage, read off the module's own occupancy field. */
function densityMetrics(state) {
  const { occ, GX, GY, vines } = state;
  const cells = GX * GY;
  let touched = 0;
  let crowded = 0;
  let maxOcc = 0;
  let total = 0;
  for (let i = 0; i < occ.length; i += 1) {
    const v = occ[i];
    if (!v) continue;
    touched += 1;
    total += v;
    if (v > maxOcc) maxOcc = v;
    // "heavy overlap": a cell holding three or more stem points. One cell is
    // about 1.4 steps across, so two points is a stem passing through and three
    // is genuinely piled up.
    if (v >= 9) crowded += 1;
  }
  const segs = vines.reduce((n, v) => n + v.segs.length, 0);
  return {
    segments: segs,
    leaves: vines.reduce((n, v) => n + v.leaves.length, 0),
    flowers: vines.reduce((n, v) => n + v.flowers.length, 0),
    cellsTouched: touched,
    coveragePct: round(touched / cells * 100),
    heavilyOverlappedCells: crowded,
    heavyOverlapPct: touched ? round(crowded / touched * 100) : 0,
    maxCellOccupancy: maxOcc,
    meanOccupancyPerTouchedCell: touched ? round(total / touched) : 0
  };
}

/** How far a sprout gets sideways before the restoring force takes over. */
function spreadMetric(state) {
  // Depth-1+ segments, measured as the lateral distance covered over a sprout's
  // first eight segments relative to where it left its parent.
  const runs = [];
  for (const v of state.vines) {
    const children = v.segs.filter((s) => s.d > 0);
    let run = null;
    for (const s of children) {
      if (!run || Math.hypot(s.x1 - run.lastX, s.y1 - run.lastY) > 1e-6) {
        if (run && run.n >= 4) runs.push(Math.abs(run.lastX - run.x0));
        run = { x0: s.x1, y0: s.y1, n: 0, lastX: s.x1, lastY: s.y1 };
      }
      run.lastX = s.x2; run.lastY = s.y2; run.n += 1;
      if (run.n === 8) { runs.push(Math.abs(run.lastX - run.x0)); run.n = 0; run.x0 = s.x2; }
    }
    if (run && run.n >= 4) runs.push(Math.abs(run.lastX - run.x0));
  }
  return {
    sproutRunsMeasured: runs.length,
    meanLateralTravelPx: runs.length ? round(runs.reduce((a, c) => a + c, 0) / runs.length) : 0
  };
}

/** How much of the column's WIDTH carries material, and where the bases sit. */
function widthUse(state) {
  const { occ, GX, GY } = state;
  const colHas = new Array(GX).fill(false);
  for (let y = 0; y < GY; y += 1) {
    for (let x = 0; x < GX; x += 1) if (occ[y * GX + x]) colHas[x] = true;
  }
  const used = colHas.filter(Boolean).length;
  let first = colHas.indexOf(true);
  let last = colHas.lastIndexOf(true);
  if (first < 0) { first = 0; last = 0; }
  return {
    columnsWithMaterialPct: round(used / GX * 100),
    spanPct: round((last - first + 1) / GX * 100),
    deadLeftPct: round(first / GX * 100),
    deadRightPct: round((GX - 1 - last) / GX * 100),
    bases: state.vines.map((v) => round(v.ax01 * 100))
  };
}

/** How close to the top of the column the garden actually gets. */
function reach(state) {
  const tops = state.vines.map((v) =>
    v.segs.reduce((hi, sg) => Math.max(hi, -sg.y2), 0));
  const pct = tops.map((t) => round(t / state.boxH * 100));
  return {
    tallestVinePct: Math.max(...pct),
    shortestVinePct: Math.min(...pct),
    meanPct: round(pct.reduce((a, c) => a + c, 0) / pct.length),
    perVinePct: pct
  };
}

function offColumn(state) {
  let out = 0;
  let worst = 0;
  for (const v of state.vines) {
    for (const s of v.segs) {
      const x = v.ax0 + s.x2;
      if (x < 0 || x > state.boxW) {
        out += 1;
        worst = Math.max(worst, x < 0 ? -x : x - state.boxW);
      }
    }
  }
  return { segmentsOffColumn: out, worstOvershootPx: round(worst) };
}

const round = (n) => Math.round(n * 100) / 100;
// Order-insensitive: the same geometry, however it was appended. Used for the
// commit-order check, where the arrays are deliberately built in a different
// sequence. It would hide a reordering bug in the strict determinism check, so
// that one still compares the sequences.
const geometryFingerprint = (state) =>
  JSON.stringify(state.vines.map((v) => [
    round(v.ax01), round(v.topFrac),
    v.segs.map((s) => `${Math.round(s.x2)},${Math.round(s.y2)}:${s.d}`).sort().join('|'),
    v.leaves.map((l) => `${Math.round(l.x)},${Math.round(l.y)}`).sort().join('|'),
    v.flowers.map((f) => `${Math.round(f.x)},${Math.round(f.y)}`).sort().join('|')
  ]));

const fingerprint = (state) =>
  JSON.stringify(state.vines.map((v) => [
    round(v.ax01), round(v.topFrac),
    v.segs.map((s) => `${Math.round(s.x2)},${Math.round(s.y2)}:${s.d}`).join('|'),
    v.leaves.length, v.flowers.length
  ]));

// ---------------------------------------------------------------------------

// Rewriting a constant must actually rewrite it. A plain string .replace() that
// stops matching after the module is retuned fails silently, and the sweep then
// prints twenty identical rows as though they were twenty experiments. It did.
function setConst(src, name, value) {
  const re = new RegExp(`const ${name} = [^;]+;`);
  if (!re.test(src)) throw new Error(`measure-flora: no \`const ${name}\` in the module — the harness is out of date with index.html`);
  return src.replace(re, `const ${name} = ${value};`);
}
const setConsts = (pairs) => (src) => pairs.reduce((acc, [n, v]) => setConst(acc, n, v), src);

const NO_DENSITY = setConsts([
  ['STEER_STEMS', '1e9'], ['BLOCK_STEMS', '1e9'], ['FORK_STEMS', '1e9'],
  ['LEAF_STEMS', '1e9'], ['SPREAD_BIAS', '0']
]);

// Commit order must not matter: phase A reads a frozen grid, phase B only
// writes. If reversing the commit changes the garden, a same-step read has
// crept back in.
const REVERSED = setConsts([['REVERSE_COMMIT', 'true']]);

const NO_SPREAD = setConsts([['SPREAD_STEPS', '1'], ['SPREAD_PUSH', '0']]);

// --- per-size report -------------------------------------------------------
// The left column is not one shape. It is ~413x1315 on the wide Projects panel
// and ~413x192 on Stats, where min-height: 12rem is the whole box. A garden
// tuned on the tall one can read as a few bare sticks on the short one.
if (process.argv.includes('--sizes')) {
  const SIZES = [[413, 1315], [413, 620], [413, 300], [413, 192], [620, 220], [300, 192]];
  console.log('\n  column      vines  width used  ink cover  reach max/min   segs   flowers');
  for (const [w, h] of SIZES) {
    const r = run({ w, h });
    const u = widthUse(r.state);
    const rr = reach(r.state);
    const m = densityMetrics(r.state);
    console.log(`  ${String(w + 'x' + h).padEnd(12)}${String(r.state.vines.length).padEnd(7)}${String(u.columnsWithMaterialPct + '%').padEnd(12)}${String(m.coveragePct + '%').padEnd(10)}${String(rr.tallestVinePct + '/' + rr.shortestVinePct).padEnd(16)}${String(m.segments).padEnd(7)}${m.flowers}`);
  }
  console.log('');
  process.exit(0);
}

// --- fork-target scan ------------------------------------------------------
// FORK_TARGET has to satisfy two sizes at once: keep the tall column near the
// ~1600 segments that already looked right, while giving the short column
// enough branching to actually use its width.
if (process.argv.includes('--forkscan')) {
  console.log('\n  target   413x1315 segs  width%   |  413x192 segs  width%');
  for (const t of [2.6, 2.8, 3.0, 3.2, 3.6, 4.0, 4.4]) {
    const rw = setConsts([['FORK_TARGET', t]]);
    const tall = run({ w: 413, h: 1315, rewrite: rw });
    const short = run({ w: 413, h: 192, rewrite: rw });
    const tm = densityMetrics(tall.state), sm = densityMetrics(short.state);
    const tu = widthUse(tall.state), su = widthUse(short.state);
    console.log(`  ${String(t).padEnd(9)}${String(tm.segments).padEnd(15)}${String(tu.columnsWithMaterialPct + '%').padEnd(9)}|  ${String(sm.segments).padEnd(14)}${su.columnsWithMaterialPct}%`);
  }
  console.log('');
  process.exit(0);
}

// --- constant sweep --------------------------------------------------------
// The branching constants decide how much plant there is, and guessing them
// produced a column at 58% coverage that read as a hedge rather than a vine.
// Sweep them against the metrics instead.
if (process.argv.includes('--sweep')) {
  const FORKS = [0.03, 0.05, 0.08, 0.12, 0.17];
  const NODES = [6, 9, 12, 16];
  console.log('\n  forkP  internode  segments  coverage%  heavyOverlap%  leaves  offColumn  reach max/min');
  for (const f of FORKS) {
    for (const n of NODES) {
      const r = run({ rewrite: setConsts([['FORK_P', f], ['INTERNODE', n]]) });
      const m = densityMetrics(r.state);
      const o = offColumn(r.state);
      const rr = reach(r.state);
      console.log(`  ${String(f).padEnd(7)}${String(n).padEnd(11)}${String(m.segments).padEnd(10)}${String(m.coveragePct).padEnd(11)}${String(m.heavyOverlapPct).padEnd(15)}${String(m.leaves).padEnd(8)}${String(o.segmentsOffColumn).padEnd(11)}${rr.tallestVinePct}/${rr.shortestVinePct}`);
    }
  }
  console.log('');
  process.exit(0);
}

const withDensity = run({});
const withoutDensity = run({ rewrite: NO_DENSITY });
const withoutSpread = run({ rewrite: NO_SPREAD });
const repeat = run({});
const reversed = run({ rewrite: REVERSED });
const resized = run({ resizeTo: [620, 900] });
const short = run({ h: 420 });

const a = densityMetrics(withDensity.state);
const b2 = densityMetrics(withoutDensity.state);

const report = {
  column: `${WIDTH}x${HEIGHT}`,
  vines: withDensity.state.vines.length,
  cell: withDensity.state.CELL,
  grid: `${withDensity.state.GX}x${withDensity.state.GY}`,
  settledInTicks: withDensity.ticks,

  determinism: {
    identicalAcrossTwoRuns: fingerprint(withDensity.state) === fingerprint(repeat.state),
    sameGeometryWithCommitOrderReversed: geometryFingerprint(withDensity.state) === geometryFingerprint(reversed.state),
    note: 'plant() was also called three times per run; only the first may count'
  },

  density: {
    on: a,
    off: b2,
    heavyOverlapChangePct: round(a.heavyOverlapPct - b2.heavyOverlapPct),
    maxOccupancyChange: a.maxCellOccupancy - b2.maxCellOccupancy,
    coverageChangePct: round(a.coveragePct - b2.coveragePct)
  },

  sproutSpread: {
    on: spreadMetric(withDensity.state),
    off: spreadMetric(withoutSpread.state)
  },

  staysInFrame: { on: offColumn(withDensity.state), off: offColumn(withoutDensity.state) },

  reach: reach(withDensity.state),

  resize: (() => {
    const s = resized.state;
    const widthNow = s.boxW;
    const anchored = s.vines.every((v) => Math.abs(v.ax0 - v.ax01 * widthNow) < 0.01);
    return {
      resizedMidGrowthTo: '620x900',
      vinesReanchoredToNewWidth: anchored,
      vineCount: s.vines.length,
      segments: s.vines.reduce((n, v) => n + v.segs.length, 0),
      note: 'a resize re-anchors and repaints; it must not change the vine count'
    };
  })(),

  shortColumn: (() => {
    const m = densityMetrics(short.state);
    return { column: `${WIDTH}x420`, cell: short.state.CELL, vines: short.state.vines.length,
             heavyOverlapPct: m.heavyOverlapPct, coveragePct: m.coveragePct,
             note: 'thresholds are scale-free only if this is close to the tall column' };
  })()
};

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const line = (k, v) => console.log(`  ${k.padEnd(34)} ${v}`);
  console.log(`\nPanel flora — ${report.column}, ${report.vines} vines, ${report.cell}px cells (${report.grid})\n`);
  console.log('determinism');
  line('identical across two runs', report.determinism.identicalAcrossTwoRuns ? 'yes' : 'NO — not deterministic');
  line('same geometry, commit reversed', report.determinism.sameGeometryWithCommitOrderReversed ? 'yes' : 'NO — a same-step read remains');
  console.log('\ndensity field                       on        off       change');
  const row = (k, f) => console.log(`  ${k.padEnd(34)}${String(f(a)).padEnd(10)}${String(f(b2)).padEnd(10)}${round(f(a) - f(b2))}`);
  row('heavily overlapped cells %', (m) => m.heavyOverlapPct);
  row('max cell occupancy', (m) => m.maxCellOccupancy);
  row('mean occupancy / touched cell', (m) => m.meanOccupancyPerTouchedCell);
  row('coverage %', (m) => m.coveragePct);
  row('segments', (m) => m.segments);
  row('leaves', (m) => m.leaves);
  console.log('\nsprout spread (lateral px over 8 segments)');
  line('with the ramped up-bias', `${report.sproutSpread.on.meanLateralTravelPx}px (${report.sproutSpread.on.sproutRunsMeasured} sprouts)`);
  line('without it', `${report.sproutSpread.off.meanLateralTravelPx}px (${report.sproutSpread.off.sproutRunsMeasured} sprouts)`);
  console.log('\nreach (% of column height)');
  line('tallest vine', report.reach.tallestVinePct + '%');
  line('shortest vine', report.reach.shortestVinePct + '%');
  line('per vine', report.reach.perVinePct.join('  '));
  console.log('\nstaying in frame');
  line('segments off the column, on', report.staysInFrame.on.segmentsOffColumn);
  line('segments off the column, off', report.staysInFrame.off.segmentsOffColumn);
  console.log('\nresize mid-growth');
  line('re-anchored to the new width', report.resize.vinesReanchoredToNewWidth ? 'yes' : 'NO');
  line('vines / segments after', `${report.resize.vineCount} / ${report.resize.segments}`);
  console.log('\nscale invariance');
  line('short column heavy overlap %', report.shortColumn.heavyOverlapPct);
  line('tall column heavy overlap %', a.heavyOverlapPct);
  line('short column cell size', `${report.shortColumn.cell}px`);
  console.log('');
}

const failures = [];
if (!report.determinism.identicalAcrossTwoRuns) failures.push('growth is not deterministic');
if (!report.determinism.sameGeometryWithCommitOrderReversed) failures.push('growth geometry depends on bud commit order');
if (!report.resize.vinesReanchoredToNewWidth) failures.push('a resize did not re-anchor the vines');
if (report.staysInFrame.on.segmentsOffColumn > 0) failures.push('stems left the column');
if (report.reach.tallestVinePct < 70) failures.push(`the garden only reached ${report.reach.tallestVinePct}% of the column`);
if (a.heavyOverlapPct >= b2.heavyOverlapPct) failures.push('the density field did not reduce heavy overlap');
if (failures.length) {
  console.error('FAIL: ' + failures.join('; '));
  process.exit(1);
}

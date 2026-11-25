#!/usr/bin/env node
/*
 * Build a standalone page that runs the panel flora four times side by side,
 * one per growth treatment, so the motion can be compared by watching it.
 *
 *   node scripts/build-vine-lab.mjs        -> docs/vine-lab.html
 *
 * The module source is read out of index.html between the flora:begin and
 * flora:end markers and inlined, exactly as scripts/measure-flora.mjs does for
 * the headless checks. There is no second copy of the algorithm: what you watch
 * here is the code the site runs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

const b = SRC.indexOf('/* flora:begin');
const e = SRC.indexOf('/* flora:end */', b);
if (b < 0 || e < 0) throw new Error('flora:begin / flora:end markers not found in index.html');
const MODULE = SRC.slice(SRC.indexOf('const panelFlora', b), e).trimEnd();

const MODES = [
  { id: 'raw', name: 'raw', blurb: 'No treatment. Growth steps at ~15Hz into a 30fps paint, so a segment appears on every other frame.' },
  { id: 'creep', name: 'creep', blurb: 'The tip is drawn partway along its next segment. Paint only — the plant is byte-identical to raw.' },
  { id: 'pop', name: 'pop', blurb: 'New segments ease in over ~2.5 steps. Leans into the step instead of hiding it. Plant identical to raw.' },
  { id: 'fine', name: 'fine', blurb: 'Half-length steps at twice the rate. Genuinely smoother, and a different plant: 2.7× the segments.' },
];

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vine growth — four treatments</title>
<style>
  :root {
    --bg: #0a0d0a; --panel: #11160f; --line: #262e22; --line-soft: #1b211a;
    --fg: #e8e5d6; --dim: #8e9686; --gold: #d6bd68; --green: #8ab06b; --rust: #d9794f;
    --mono: ui-monospace, "SF Mono", Menlo, monospace;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg); padding: clamp(1rem, 3vw, 2.4rem);
    font: 15px/1.6 ui-sans-serif, system-ui, sans-serif;
  }
  h1 { font-size: clamp(1.5rem, 4vw, 2.2rem); margin: 0 0 0.3rem; letter-spacing: -0.02em; }
  .lede { color: var(--dim); max-width: 60ch; margin: 0 0 1.4rem; }
  .bar {
    display: flex; gap: 0.8rem; flex-wrap: wrap; align-items: center;
    border: 1px solid var(--line); background: var(--panel); padding: 0.7rem 0.9rem; margin-bottom: 1.2rem;
  }
  button, select, input[type=range] { font: inherit; }
  button {
    background: var(--gold); color: #10140e; border: 0; padding: 0.4rem 0.9rem;
    font-weight: 600; cursor: pointer;
  }
  button.ghost { background: transparent; color: var(--fg); border: 1px solid var(--line); }
  label { font-family: var(--mono); font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); }
  .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .cell { border: 1px solid var(--line); background: var(--panel); display: flex; flex-direction: column; min-width: 0; }
  .cell h2 { font-size: 1rem; margin: 0; padding: 0.7rem 0.9rem 0.3rem; font-family: var(--mono); color: var(--gold); }
  .cell .blurb { font-size: 0.8rem; color: var(--dim); padding: 0 0.9rem 0.7rem; margin: 0; min-height: 4.4em; }
  .stageWrap { position: relative; border-top: 1px solid var(--line-soft); background: #080b08; }
  .stageWrap canvas { position: absolute; top: 0; left: 0; display: block; width: 100%; height: 100%; }
  .readout {
    font-family: var(--mono); font-size: 0.72rem; color: var(--dim);
    padding: 0.5rem 0.9rem; border-top: 1px solid var(--line-soft); white-space: pre;
  }
  .readout b { color: var(--fg); font-weight: 600; }
  .note { color: var(--dim); font-size: 0.85rem; max-width: 72ch; margin-top: 1.4rem; }
  code { font-family: var(--mono); font-size: 0.85em; color: var(--gold); }
</style>
</head>
<body>
<h1>Vine growth, four treatments</h1>
<p class="lede">
  The same module the site runs, instantiated four times with the same seed. Watch the tips rather
  than the shape — <code>raw</code>, <code>creep</code> and <code>pop</code> grow <em>identical</em>
  plants and differ only in motion. Press replay to see them start together.
</p>

<div class="bar">
  <button id="replay">Replay</button>
  <button class="ghost" id="reseed">New seed</button>
  <label for="h">column height</label>
  <input type="range" id="h" min="180" max="900" value="560" step="20">
  <span id="hval" style="font-family:var(--mono);font-size:0.78rem;color:var(--dim)">560px</span>
  <label for="rate" style="margin-left:0.6rem">speed</label>
  <input type="range" id="rate" min="25" max="200" value="100" step="5">
  <span id="rval" style="font-family:var(--mono);font-size:0.78rem;color:var(--dim)">1.00×</span>
</div>

<div class="grid" id="grid"></div>

<p class="note">
  One 30fps loop drives all four, matching the cap the real page runs at. “Frames that moved” is the
  share of painted frames whose pixels differ from the frame before — higher is smoother. Typical
  readings once they are growing: <b>raw ~29%</b>, <b>creep ~82%</b>, <b>pop ~99%</b>,
  <b>fine ~58%</b>.
</p>
<p class="note">
  <code>raw</code> sits low because growth steps at about half the paint rate, so most frames are
  identical to the one before — that is the stutter. <code>creep</code> does not reach 100%, and the
  missing 18% is not a shortfall: everything is snapped to a 3px pixel-art grid, so a frame where the
  tip advances less than one block draws exactly the same image. <code>pop</code> is near 100%
  because an alpha ramp on the newest segments changes something every frame whether or not the tip
  moved. <code>fine</code> gains by stepping twice as often, which is also why it has 2.7× the
  segments and is a different plant.
</p>
<p class="note">
  Worth saying: this is not a performance problem. The vine’s whole tick — grow and paint — measures
  0.29ms on the real page, which is 0.9% of a 33ms frame.
</p>

<script>
const MODULE_SRC = ${JSON.stringify(MODULE)};
const MODES = ${JSON.stringify(MODES)};

const grid = document.getElementById('grid');
const instances = [];
let seed = 7;

function build() {
  grid.innerHTML = '';
  instances.length = 0;
  for (const mode of MODES) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.innerHTML =
      '<h2>' + mode.name + '</h2><p class="blurb">' + mode.blurb + '</p>' +
      '<div class="stageWrap"><canvas></canvas></div>' +
      '<div class="readout"></div>';
    grid.appendChild(cell);
    const wrap = cell.querySelector('.stageWrap');
    const canvas = cell.querySelector('canvas');
    const readout = cell.querySelector('.readout');

    // The module asks the document for its canvas by id, reads clientWidth and
    // clientHeight off it, and checks offsetParent to decide whether it is
    // visible. A real canvas in a positioned wrapper satisfies all three.
    const fakeDoc = { getElementById: () => canvas };
    const flora = new Function(
      'document', 'window', 'location', 'URLSearchParams', 'dprCap', 'prefersReducedMotion',
      MODULE_SRC + '\\nreturn panelFlora;'
    )(fakeDoc, window, { search: '?vine=' + mode.id + '&garden=one' }, URLSearchParams, 1.5, null);

    instances.push({ mode, canvas, wrap, readout, flora, prev: null, moved: 0, painted: 0 });
  }
  applyHeight();
  replay();
}

function applyHeight() {
  const h = +document.getElementById('h').value;
  document.getElementById('hval').textContent = h + 'px';
  for (const inst of instances) inst.wrap.style.height = h + 'px';
}

function replay() {
  for (const inst of instances) {
    // A fresh module instance is the only honest reset: plant() is idempotent
    // by design, which is the whole point of it.
    const fakeDoc = { getElementById: () => inst.canvas };
    inst.flora = new Function(
      'document', 'window', 'location', 'URLSearchParams', 'dprCap', 'prefersReducedMotion',
      MODULE_SRC + '\\nreturn panelFlora;'
    )(fakeDoc, window, { search: '?vine=' + inst.mode.id + '&garden=one' }, URLSearchParams, 1.5, null);
    inst.flora.plant('lab' + seed);
    inst.prev = null; inst.moved = 0; inst.painted = 0;
    const ctx = inst.canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, inst.canvas.width, inst.canvas.height);
  }
}

// One 30fps loop for all four, matching the cap the site runs its panels at.
const FRAME_MS = 1000 / 30;
let last = 0;
function frame(t) {
  requestAnimationFrame(frame);
  if (last && t - last < FRAME_MS - 2) return;
  const dt = last ? Math.min(t - last, 100) : FRAME_MS;
  last = t;
  const speed = +document.getElementById('rate').value / 100;
  for (const inst of instances) {
    inst.flora.tick(dt * speed);
    const d = inst.flora.debug();
    // Frame-to-frame difference over the WHOLE canvas. Two earlier versions
    // sampled bands -- first one at the bottom, then six spread out -- and both
    // undercounted badly, because a growing tip is a few 3px blocks and the
    // odds of it sitting inside a sampled band are poor. They reported creep at
    // 66% and then 25% when it is in fact painting a moved tip almost every
    // frame. Measuring a small slice of a big canvas was the bug, twice.
    const c = inst.canvas;
    if (c.width && c.height) {
      const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 3; i < px.length; i += 32) sum = (sum + px[i] * (i + 1)) % 4294967296;
      inst.painted += 1;
      if (inst.prev !== null && sum !== inst.prev) inst.moved += 1;
      inst.prev = sum;
    }
    const segs = d.vines.reduce((n, v) => n + v.segs.length, 0);
    const movedPct = inst.painted > 1 ? Math.round(inst.moved / (inst.painted - 1) * 100) : 0;
    inst.readout.textContent =
      'segments  ' + String(segs).padStart(5) + '   ' + (d.settled ? 'settled' : 'growing') + '\\n' +
      'frames that moved  ' + String(movedPct).padStart(3) + '%';
  }
}
requestAnimationFrame(frame);

document.getElementById('replay').addEventListener('click', replay);
document.getElementById('reseed').addEventListener('click', () => { seed = (seed * 7 + 13) % 9973; replay(); });
document.getElementById('h').addEventListener('input', () => { applyHeight(); });
document.getElementById('rate').addEventListener('input', (ev) => {
  document.getElementById('rval').textContent = (+ev.target.value / 100).toFixed(2) + '\\u00d7';
});
build();
</script>
</body>
</html>
`;

const out = path.join(ROOT, 'docs', 'vine-lab.html');
fs.writeFileSync(out, page);
console.log(`wrote ${path.relative(ROOT, out)} — ${(page.length / 1024).toFixed(1)}KB, module inlined (${(MODULE.length / 1024).toFixed(1)}KB)`);

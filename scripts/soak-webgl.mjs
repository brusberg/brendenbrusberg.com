#!/usr/bin/env node
/*
 * Unattended WebGL soak test. No npm dependencies — it drives the Chrome
 * already installed on this machine over the DevTools protocol, using Node's
 * built-in WebSocket (Node 22+).
 *
 *   node scripts/soak-webgl.mjs                     # 10 min, headless
 *   node scripts/soak-webgl.mjs --minutes 60        # a proper soak
 *   node scripts/soak-webgl.mjs --headful           # watch it happen
 *   node scripts/soak-webgl.mjs --url https://www.brendenbrusberg.com
 *
 * What it does: serves (or reuses) the site, opens it with the watchdog armed,
 * cycles through the scenes to churn WebGL contexts, and samples
 * __watchdog.json() on an interval. Writes .soak/report-<stamp>.json plus a
 * summary to stdout, and exits non-zero if a context was lost or the page froze.
 *
 * Caveat worth knowing: headless Chrome renders WebGL through SwiftShader, so
 * it will NOT reproduce a GPU-driver context loss. Use --headful for that; the
 * headless run is still good at catching leaks, freezes and long tasks.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : (argv[i + 1]?.startsWith('--') ? true : argv[i + 1]) ?? true;
};
const has = (name) => argv.includes(`--${name}`);

const MINUTES = Number(flag('minutes', 10));
const HEADFUL = has('headful');
const SAMPLE_MS = Number(flag('sample', 15)) * 1000;
const PORT = Number(flag('port', 4317));
const CDP_PORT = Number(flag('cdp-port', 9222));
let URL_BASE = flag('url', null);

// Scenes to cycle through. Each entry is a hash the page understands; the
// point is to mount/unmount the WebGL scenes repeatedly, which is where
// contexts and GPU resources churn.
// `mandelbrot` and `art` are the two WebGL scenes; `ants` and `stats` are the
// 2d/canvas panels. Alternating between them is what forces the GL scenes to
// mount and unmount, which is where contexts and GPU resources churn.
const SCENES = ['#ants', '#mandelbrot', '#art', '#stats', '#mandelbrot', '#art'];

const log = (...a) => console.log('[soak]', ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------- find chrome
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Arc.app/Contents/MacOS/Arc',
  `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

/** Playwright and Puppeteer both cache a Chromium we can borrow. */
function cachedChromiums() {
  const out = [];
  const roots = [
    `${process.env.HOME}/Library/Caches/ms-playwright`,
    `${process.env.HOME}/.cache/ms-playwright`,
    `${process.env.HOME}/.cache/puppeteer`,
  ];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const dir of readdirSync(root)) {
      for (const rel of [
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-mac/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
        'chrome-headless-shell-mac-arm64/chrome-headless-shell',
        'chrome-linux/chrome',
      ]) {
        const p = join(root, dir, rel);
        if (existsSync(p)) out.push(p);
      }
    }
  }
  return out;
}

function findChrome() {
  const explicit = flag('chrome', null);
  if (typeof explicit === 'string') {
    if (!existsSync(explicit)) throw new Error(`--chrome path does not exist: ${explicit}`);
    return explicit;
  }
  const found = [...CHROME_CANDIDATES, ...cachedChromiums()].find((p) => existsSync(p));
  if (!found) {
    throw new Error(
      [
        'No Chromium-based browser found, and this runner needs one (it speaks the',
        'Chrome DevTools Protocol). Firefox and Safari will not work here.',
        '',
        'Pick one:',
        '  1. Download a throwaway Chromium, no package.json changes:',
        '       pnpm dlx playwright install chromium',
        '     then re-run; this script finds it in ~/Library/Caches/ms-playwright.',
        '  2. Point it at any Chromium binary you already have:',
        '       node scripts/soak-webgl.mjs --chrome "/path/to/Chromium"',
        '',
        'Or skip the runner entirely: open the site with ?watchdog=1 in Firefox or',
        'Safari, leave the tab open, and read the HUD / __watchdog.report().',
      ].join('\n'),
    );
  }
  return found;
}

// ------------------------------------------------------------ dev server
let serverProc = null;

async function ensureServer() {
  if (URL_BASE) {
    log(`using ${URL_BASE}`);
    return URL_BASE;
  }
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    log('dist/ missing — running the build first');
    await run('pnpm', ['run', 'build']);
  }
  log(`starting vite preview on :${PORT}`);
  serverProc = spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  serverProc.stdout.on('data', (d) => process.env.SOAK_VERBOSE && process.stdout.write(`  vite: ${d}`));
  serverProc.stderr.on('data', (d) => process.stderr.write(`  vite! ${d}`));

  const base = `http://localhost:${PORT}`;
  for (let i = 0; i < 60; i += 1) {
    try {
      const res = await fetch(base, { signal: AbortSignal.timeout(500) });
      if (res.ok) {
        URL_BASE = base;
        return base;
      }
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`vite preview did not come up on ${base}`);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: ROOT, stdio: 'inherit' });
    p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

// ----------------------------------------------------------------- browser
let chromeProc = null;

async function launchChrome() {
  const bin = findChrome();
  const profile = join(tmpdir(), `soak-profile-${Date.now()}`);
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    // Give headless a working WebGL implementation.
    ...(HEADFUL ? ['--window-size=1280,900'] : ['--headless=new', '--enable-unsafe-swiftshader', '--window-size=1280,900']),
    'about:blank',
  ];
  log(`launching ${bin.split('/').pop()}${HEADFUL ? ' (headful)' : ' (headless)'}`);
  chromeProc = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  chromeProc.stderr.on('data', (d) => {
    const s = String(d);
    if (process.env.SOAK_VERBOSE) process.stderr.write(`  chrome! ${s}`);
  });

  for (let i = 0; i < 80; i += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(500) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`Chrome DevTools endpoint never opened on :${CDP_PORT}`);
}

/** Minimal CDP client over Node's global WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method) {
        this.events.push(msg);
        if (this.events.length > 2000) this.events.shift();
      }
    });
  }

  static async attach(cdpPort, url) {
    const res = await fetch(`http://127.0.0.1:${cdpPort}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    if (!res.ok) throw new Error(`could not open tab: ${res.status} ${await res.text()}`);
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', () => reject(new Error('CDP websocket failed')), { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}) {
    this.id += 1;
    const id = this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 30000);
    });
  }

  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? 'evaluate threw');
    return r.result?.value;
  }
}

// -------------------------------------------------------------------- main
async function main() {
  const base = await ensureServer();
  await launchChrome();

  const startUrl = `${base}/?watchdog=1`;
  log(`opening ${startUrl}`);
  const cdp = await Cdp.attach(CDP_PORT, startUrl);
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable').catch(() => {});
  await cdp.send('Page.enable').catch(() => {});

  // Collect console errors independently of the in-page watchdog.
  const consoleErrors = [];
  cdp.ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push({ at: Date.now(), text: m.params.exceptionDetails?.text ?? 'exception' });
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      consoleErrors.push({ at: Date.now(), text: m.params.entry.text });
    }
  });

  // Wait for the watchdog to arm.
  let armed = false;
  for (let i = 0; i < 40; i += 1) {
    armed = await cdp.eval('typeof window.__watchdog === "object"').catch(() => false);
    if (armed) break;
    await sleep(500);
  }
  if (!armed) {
    throw new Error('watchdog never armed — is public/dev/watchdog.js being loaded on this page?');
  }
  log('watchdog armed; soaking');

  const deadline = Date.now() + MINUTES * 60_000;
  const samples = [];
  let sceneIndex = 0;
  let lastSample = 0;

  while (Date.now() < deadline) {
    // Churn scenes: this is what exercises context mount/unmount.
    const scene = SCENES[sceneIndex % SCENES.length];
    sceneIndex += 1;
    await cdp.eval(`location.hash = ${JSON.stringify(scene)}; true`).catch(() => {});
    await sleep(4000);

    // Nudge the page so animation and resize paths run.
    await cdp
      .eval(`window.dispatchEvent(new Event('resize')); window.scrollBy(0, 120); true`)
      .catch(() => {});

    if (Date.now() - lastSample >= SAMPLE_MS) {
      lastSample = Date.now();
      const snap = await cdp.eval('window.__watchdog.json()').catch((e) => ({ error: String(e) }));
      samples.push({ at: Date.now(), elapsedMin: +((MINUTES * 60_000 - (deadline - Date.now())) / 60_000).toFixed(2), snap });
      const c = snap?.contexts ?? [];
      const lost = c.filter((x) => x.lost).length;
      const heapMb = snap?.heap?.last ? (snap.heap.last.used / 1048576).toFixed(0) : '?';
      log(
        `+${String(samples[samples.length - 1].elapsedMin).padStart(5)}m  ` +
          `ctx ${c.length} (${lost} lost)  frames ${snap?.frames?.count ?? '?'}  ` +
          `freezes ${snap?.frames?.freezes ?? '?'}  worst ${Math.round(snap?.frames?.worst ?? 0)}ms  heap ${heapMb}MB`,
      );
      if (lost > 0) log('  !! WebGL context lost — this is the failure you are hunting');
    }
  }

  const final = await cdp.eval('window.__watchdog.json()').catch(() => null);
  const report = {
    startedAt: new Date(Date.now() - MINUTES * 60_000).toISOString(),
    finishedAt: new Date().toISOString(),
    minutes: MINUTES,
    headful: HEADFUL,
    url: startUrl,
    scenesCycled: sceneIndex,
    consoleErrors,
    samples,
    final,
  };

  mkdirSync(join(ROOT, '.soak'), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const out = join(ROOT, '.soak', `report-${stamp}.json`);
  writeFileSync(out, JSON.stringify(report, null, 2));

  // ----------------------------------------------------------- summary
  const contexts = final?.contexts ?? [];
  const lostContexts = contexts.filter((c) => c.lost);
  const freezes = final?.frames?.freezes ?? 0;
  const heapFirst = final?.heap?.first?.used ?? 0;
  const heapLast = final?.heap?.last?.used ?? 0;
  const heapGrowthMb = (heapLast - heapFirst) / 1048576;

  console.log('\n================ soak summary ================');
  console.log(`duration        ${MINUTES}m (${HEADFUL ? 'headful' : 'headless/swiftshader'})`);
  console.log(`scenes cycled   ${sceneIndex}`);
  console.log(`webgl contexts  ${contexts.length} created, ${lostContexts.length} lost`);
  for (const c of lostContexts) console.log(`                LOST: "${c.label}" (lost x${c.lostCount}, restored x${c.restoredCount})`);
  console.log(`frames          ${final?.frames?.count ?? '?'}  stalls ${final?.frames?.stalls ?? '?'}  freezes ${freezes}`);
  console.log(`worst frame gap ${Math.round(final?.frames?.worst ?? 0)}ms`);
  console.log(`long tasks      ${final?.longTasks?.count ?? '?'} (worst ${Math.round(final?.longTasks?.worst ?? 0)}ms)`);
  console.log(`heap            ${(heapFirst / 1048576).toFixed(1)}MB -> ${(heapLast / 1048576).toFixed(1)}MB (${heapGrowthMb >= 0 ? '+' : ''}${heapGrowthMb.toFixed(1)}MB)`);
  console.log(`console errors  ${consoleErrors.length}`);
  console.log(`report          ${out}`);
  console.log('==============================================\n');

  const failed = lostContexts.length > 0 || freezes > 0 || heapGrowthMb > 150;
  if (failed) {
    console.log('FAIL: ' + [
      lostContexts.length ? `${lostContexts.length} context(s) lost` : null,
      freezes ? `${freezes} freeze(s)` : null,
      heapGrowthMb > 150 ? `heap grew ${heapGrowthMb.toFixed(0)}MB` : null,
    ].filter(Boolean).join(', '));
  } else {
    console.log('PASS: no context loss, no freezes, heap stable.');
  }
  return failed ? 1 : 0;
}

const cleanup = () => {
  chromeProc?.kill();
  serverProc?.kill();
};
process.on('SIGINT', () => {
  log('interrupted');
  cleanup();
  process.exit(130);
});

main()
  .then((code) => {
    cleanup();
    process.exit(code);
  })
  .catch((err) => {
    console.error('[soak] failed:', err.message);
    cleanup();
    process.exit(2);
  });

/*
 * WebGL + freeze watchdog. Local diagnostics only — never runs in production.
 *
 * Enable:
 *   http://localhost:5173/?watchdog=1        one session
 *   localStorage.setItem('watchdog','1')     sticky across reloads
 *
 * It answers "what happened while I wasn't looking":
 *   - every WebGL context created, and whether any of them was lost
 *   - frame stalls (the page froze for N ms) with the longest offenders
 *   - long tasks blocking the main thread
 *   - JS heap trend, so a slow leak shows up as a rising slope
 *   - uncaught errors and rejections
 *
 * Everything lands in localStorage under `watchdog:log`, so you can leave the
 * tab open for an hour, come back, and read the history even after a freeze.
 *
 *   __watchdog.report()   printable summary
 *   __watchdog.json()     same thing as data
 *   __watchdog.clear()    wipe history
 */
(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const enabled =
    params.get('watchdog') === '1' ||
    (params.get('watchdog') !== '0' && localStorage.getItem('watchdog') === '1');
  if (!enabled) return;
  if (params.get('watchdog') === '1') localStorage.setItem('watchdog', '1');
  if (params.get('watchdog') === '0') localStorage.removeItem('watchdog');

  // --- config ------------------------------------------------------------
  const STALL_MS = 250;        // a gap this long between frames counts as a hitch
  const FREEZE_MS = 1000;      // ...and this long counts as a freeze
  const HEAP_EVERY_MS = 5000;
  const LOG_CAP = 400;         // ring buffer size in localStorage
  const STORE_KEY = 'watchdog:log';

  const startedAt = Date.now();
  const t0 = performance.now();

  // --- persistent log ----------------------------------------------------
  /** @type {{t:number,kind:string,msg:string,data?:any}[]} */
  let log = [];
  try {
    log = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    if (!Array.isArray(log)) log = [];
  } catch {
    log = [];
  }

  let flushTimer = null;
  const flush = () => {
    flushTimer = null;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(log.slice(-LOG_CAP)));
    } catch {
      /* quota — drop the oldest half and move on */
      log = log.slice(-Math.floor(LOG_CAP / 2));
    }
  };

  const record = (kind, msg, data) => {
    log.push({ t: Date.now(), kind, msg, ...(data === undefined ? {} : { data }) });
    if (log.length > LOG_CAP * 2) log = log.slice(-LOG_CAP);
    if (!flushTimer) flushTimer = setTimeout(flush, 500);
    const tag = `[watchdog] ${kind}`;
    if (kind === 'context-lost' || kind === 'error' || kind === 'freeze') console.error(tag, msg, data ?? '');
    else if (kind === 'stall' || kind === 'longtask') console.warn(tag, msg, data ?? '');
    else console.info(tag, msg, data ?? '');
  };

  record('session', `watchdog armed on ${location.pathname}${location.search}`);

  // --- WebGL context tracking -------------------------------------------
  // Patch getContext so we see every context the page asks for, including the
  // ones created inside third-party or inline code we don't control.
  const contexts = [];
  const origGetContext = HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.getContext = function patchedGetContext(type, ...rest) {
    const ctx = origGetContext.call(this, type, ...rest);
    const isGl = typeof type === 'string' && /webgl/i.test(type);
    if (!isGl || !ctx) return ctx;

    // Same canvas + same type returns the same context object; don't double-register.
    if (contexts.some((c) => c.ctx === ctx)) return ctx;

    const id = contexts.length + 1;
    const label = this.id || this.className || `canvas#${id}`;
    const entry = { id, label, type, ctx, canvas: this, lost: false, lostCount: 0, restoredCount: 0, draws: 0 };
    contexts.push(entry);

    // Count real GPU draws. A render loop that stays alive but skips work --
    // which is how a frame-rate cap is implemented -- still fires rAF at the
    // display rate, so rAF count alone cannot tell you the actual draw rate.
    for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = ctx[method];
      if (typeof original !== 'function') continue;
      ctx[method] = function countedDraw(...args) {
        entry.draws += 1;
        draws.total += 1;
        return original.apply(this, args);
      };
    }

    record('context', `#${id} ${type} on "${label}"`, {
      live: contexts.filter((c) => !c.lost).length,
      total: contexts.length,
    });

    // A browser will drop the oldest context once a page holds too many.
    if (contexts.filter((c) => !c.lost).length > 8) {
      record('context-pressure', `${contexts.filter((c) => !c.lost).length} live WebGL contexts — browsers evict the oldest past ~8-16`);
    }

    this.addEventListener(
      'webglcontextlost',
      (event) => {
        entry.lost = true;
        entry.lostCount += 1;
        const prevented = event.defaultPrevented;
        record('context-lost', `#${id} "${label}" lost its ${type} context`, {
          lostCount: entry.lostCount,
          preventDefaultCalled: prevented,
          note: prevented
            ? 'page called preventDefault, so a restore is possible'
            : 'nobody called preventDefault — this context can never be restored',
          uptimeMs: Math.round(performance.now() - t0),
        });
        hud.dirty = true;
      },
      false,
    );

    this.addEventListener(
      'webglcontextrestored',
      () => {
        entry.lost = false;
        entry.restoredCount += 1;
        record('context-restored', `#${id} "${label}" context restored`, { restoredCount: entry.restoredCount });
        hud.dirty = true;
      },
      false,
    );

    this.addEventListener('webglcontextcreationerror', (e) => {
      record('context-error', `#${id} "${label}" creation error`, { statusMessage: e.statusMessage });
    });

    return ctx;
  };

  // Poll isContextLost() too: a context can die without the event firing in
  // some driver-reset cases, and that is exactly the silent freeze we're after.
  const pollContexts = () => {
    for (const c of contexts) {
      let dead = false;
      try {
        dead = typeof c.ctx.isContextLost === 'function' && c.ctx.isContextLost();
      } catch {
        dead = true;
      }
      if (dead && !c.lost) {
        c.lost = true;
        c.lostCount += 1;
        record('context-lost', `#${c.id} "${c.label}" is lost (detected by poll, no event fired)`, {
          uptimeMs: Math.round(performance.now() - t0),
        });
        hud.dirty = true;
      }
    }
  };

  // --- frame pacing ------------------------------------------------------
  // `frames.count` is rAF callbacks, which is NOT the draw rate: a capped loop
  // keeps requesting frames and skips the work. `draws` is the real one.
  const frames = { count: 0, stalls: 0, freezes: 0, worst: 0, worstAt: 0, last: performance.now() };
  const draws = { total: 0, perSecond: 0, lastTotal: 0, lastAt: performance.now() };
  const rafRate = { perSecond: 0, lastCount: 0, lastAt: performance.now() };
  let rafAlive = true;

  const onFrame = (now) => {
    const gap = now - frames.last;
    frames.last = now;
    frames.count += 1;

    if (gap > STALL_MS) {
      const kind = gap > FREEZE_MS ? 'freeze' : 'stall';
      if (kind === 'freeze') frames.freezes += 1;
      else frames.stalls += 1;
      if (gap > frames.worst) {
        frames.worst = gap;
        frames.worstAt = Math.round(now - t0);
      }
      // Don't log every hitch during a storm; log the notable ones.
      if (kind === 'freeze' || frames.stalls % 10 === 1) {
        record(kind, `${Math.round(gap)}ms gap between frames`, {
          atMs: Math.round(now - t0),
          hidden: document.hidden,
          liveContexts: contexts.filter((c) => !c.lost).length,
        });
      }
      hud.dirty = true;
    }
    requestAnimationFrame(onFrame);
  };
  requestAnimationFrame(onFrame);

  // A watchdog on the watchdog: if rAF itself stops being serviced (the real
  // "page froze" case), a timer still fires and tells us.
  let lastSeenFrameCount = 0;
  setInterval(() => {
    const stillRunning = frames.count !== lastSeenFrameCount;
    if (!stillRunning && !document.hidden && rafAlive) {
      rafAlive = false;
      record('freeze', 'requestAnimationFrame stopped firing while the tab was visible', {
        frames: frames.count,
        liveContexts: contexts.filter((c) => !c.lost).length,
        lostContexts: contexts.filter((c) => c.lost).map((c) => c.label),
      });
    } else if (stillRunning && !rafAlive) {
      rafAlive = true;
      record('recovered', 'requestAnimationFrame resumed');
    }
    lastSeenFrameCount = frames.count;

    // Sample both rates over the real interval between checks.
    const now = performance.now();
    const drawSecs = (now - draws.lastAt) / 1000;
    if (drawSecs > 0) {
      draws.perSecond = Math.round((draws.total - draws.lastTotal) / drawSecs);
      draws.lastTotal = draws.total;
      draws.lastAt = now;
    }
    const rafSecs = (now - rafRate.lastAt) / 1000;
    if (rafSecs > 0) {
      rafRate.perSecond = Math.round((frames.count - rafRate.lastCount) / rafSecs);
      rafRate.lastCount = frames.count;
      rafRate.lastAt = now;
    }

    pollContexts();
  }, 2000);

  // --- long tasks --------------------------------------------------------
  let longTasks = { count: 0, totalMs: 0, worst: 0 };
  if (typeof PerformanceObserver === 'function') {
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          longTasks.count += 1;
          longTasks.totalMs += e.duration;
          if (e.duration > longTasks.worst) longTasks.worst = e.duration;
          if (e.duration > 200) {
            record('longtask', `${Math.round(e.duration)}ms task blocked the main thread`, {
              atMs: Math.round(e.startTime - t0),
              attribution: e.attribution?.map((a) => a.name).filter(Boolean),
            });
          }
        }
        hud.dirty = true;
      }).observe({ entryTypes: ['longtask'] });
    } catch {
      /* not supported */
    }
  }

  // --- heap trend --------------------------------------------------------
  const heap = [];
  if (performance.memory) {
    setInterval(() => {
      const used = performance.memory.usedJSHeapSize;
      heap.push({ atMs: Math.round(performance.now() - t0), used });
      if (heap.length > 720) heap.shift(); // ~1h at 5s
      // Flag a sustained climb: compare the first and last thirds.
      if (heap.length >= 24 && heap.length % 24 === 0) {
        const third = Math.floor(heap.length / 3);
        const early = heap.slice(0, third).reduce((s, h) => s + h.used, 0) / third;
        const late = heap.slice(-third).reduce((s, h) => s + h.used, 0) / third;
        const growthMb = (late - early) / 1048576;
        if (growthMb > 50) {
          record('heap-growth', `heap up ${growthMb.toFixed(1)}MB over this window`, {
            earlyMb: +(early / 1048576).toFixed(1),
            lateMb: +(late / 1048576).toFixed(1),
            liveContexts: contexts.filter((c) => !c.lost).length,
          });
        }
      }
      hud.dirty = true;
    }, HEAP_EVERY_MS);
  }

  // --- errors ------------------------------------------------------------
  addEventListener('error', (e) => {
    record('error', e.message || 'uncaught error', {
      source: e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined,
      stack: e.error?.stack?.split('\n').slice(0, 4).join('\n'),
    });
    hud.dirty = true;
  });
  addEventListener('unhandledrejection', (e) => {
    record('error', `unhandled rejection: ${e.reason?.message ?? String(e.reason)}`, {
      stack: e.reason?.stack?.split('\n').slice(0, 4).join('\n'),
    });
    hud.dirty = true;
  });
  document.addEventListener('visibilitychange', () => {
    record('visibility', document.hidden ? 'tab hidden' : 'tab visible');
    // Coming back from hidden resets frame pacing; don't count the gap.
    frames.last = performance.now();
  });

  // --- HUD ---------------------------------------------------------------
  // The ant sim runs in an iframe inside the main page, so without this both
  // documents would paint a HUD and the embedded one would sit on top of the
  // colony. Keep recording in here; just don't draw over the simulation.
  const embedded = window.parent !== window.self;

  const hud = { el: null, dirty: true };

  const mountHud = () => {
    if (embedded) {
      record('session', 'embedded in a frame — logging without a HUD; read it from the parent');
      return;
    }
    const el = document.createElement('div');
    el.id = 'watchdog-hud';
    el.setAttribute('role', 'status');
    el.style.cssText = [
      'position:fixed', 'bottom:8px', 'left:8px', 'z-index:2147483647',
      'font:11px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace',
      'background:rgba(8,16,11,.88)', 'color:#d6bd68', 'padding:7px 9px',
      'border:1px solid rgba(214,189,104,.35)', 'border-radius:6px',
      'pointer-events:auto', 'white-space:pre', 'max-width:46ch',
      'backdrop-filter:blur(6px)', 'cursor:pointer', 'user-select:none',
    ].join(';');
    el.title = 'click to copy the full watchdog report';
    el.addEventListener('click', () => {
      const text = api.report({ print: false });
      navigator.clipboard?.writeText(text).then(
        () => record('hud', 'report copied to clipboard'),
        () => console.log(text),
      );
    });
    document.body.appendChild(el);
    hud.el = el;
  };

  /** Same-origin child frames running their own watchdog (the ant sim). */
  const childWatchdogs = () => {
    const out = [];
    for (const frame of document.querySelectorAll('iframe')) {
      try {
        const w = frame.contentWindow?.__watchdog;
        if (w) out.push({ name: frame.id || frame.src.split('/').pop(), api: w });
      } catch {
        /* cross-origin, nothing to read */
      }
    }
    return out;
  };

  const paintHud = () => {
    if (!hud.el || !hud.dirty) return;
    hud.dirty = false;
    const kids = childWatchdogs().map((k) => ({ name: k.name, data: k.api.json() }));
    const live =
      contexts.filter((c) => !c.lost).length +
      kids.reduce((n, k) => n + k.data.contexts.filter((c) => !c.lost).length, 0);
    const lost = [
      ...contexts.filter((c) => c.lost),
      ...kids.flatMap((k) => k.data.contexts.filter((c) => c.lost)),
    ];
    const mins = ((performance.now() - t0) / 60000).toFixed(1);
    const mem = performance.memory
      ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(0)}MB`
      : 'n/a';
    const problems =
      log.filter((l) => ['context-lost', 'freeze', 'error'].includes(l.kind)).length +
      kids.reduce(
        (n, k) => n + k.data.log.filter((l) => ['context-lost', 'error'].includes(l.kind)).length,
        0,
      );
    hud.el.style.color = problems ? '#ff8a7a' : '#d6bd68';
    const kidDraws = kids.reduce((n, k) => n + (k.data.draws?.perSecond ?? 0), 0);
    hud.el.textContent = [
      `watchdog  ${mins}m  heap ${mem}${kids.length ? `  +${kids.length} frame` : ''}`,
      `gl ctx    ${live} live${lost.length ? `, ${lost.length} LOST` : ''}`,
      `draws/s   ${draws.perSecond + kidDraws}${kidDraws ? ` (${draws.perSecond}+${kidDraws})` : ''}   raf/s ${rafRate.perSecond}`,
      `raf total ${frames.count}  stall ${frames.stalls}  freeze ${frames.freezes}`,
      `worst gap ${Math.round(frames.worst)}ms${frames.worst ? ` @${(frames.worstAt / 1000).toFixed(0)}s` : ''}`,
      `longtask  ${longTasks.count} (worst ${Math.round(longTasks.worst)}ms)`,
      problems ? `PROBLEMS  ${problems} — click to copy report` : 'click to copy report',
    ].join('\n');
  };
  setInterval(paintHud, 500);

  // --- public api --------------------------------------------------------
  const api = {
    json() {
      return {
        startedAt: new Date(startedAt).toISOString(),
        uptimeMs: Math.round(performance.now() - t0),
        page: location.pathname + location.search,
        userAgent: navigator.userAgent,
        renderer: (() => {
          try {
            const c = document.createElement('canvas');
            const gl = origGetContext.call(c, 'webgl2') || origGetContext.call(c, 'webgl');
            const info = gl?.getExtension('WEBGL_debug_renderer_info');
            return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null;
          } catch {
            return null;
          }
        })(),
        contexts: contexts.map((c) => ({
          id: c.id, label: c.label, type: c.type,
          lost: c.lost, lostCount: c.lostCount, restoredCount: c.restoredCount,
          draws: c.draws,
        })),
        // rAF callbacks; see `draws` for the rate that actually costs anything.
        frames: { ...frames, last: undefined },
        rafPerSecond: rafRate.perSecond,
        draws: { total: draws.total, perSecond: draws.perSecond },
        longTasks,
        heap: heap.length ? { samples: heap.length, first: heap[0], last: heap[heap.length - 1] } : null,
        log: log.slice(-LOG_CAP),
      };
    },
    report({ print = true } = {}) {
      const d = api.json();
      const lines = [];
      lines.push(`watchdog report — ${d.page}`);
      lines.push(`started ${d.startedAt}, up ${(d.uptimeMs / 60000).toFixed(1)}m`);
      if (d.renderer) lines.push(`renderer: ${d.renderer}`);
      lines.push('');
      lines.push(`WebGL contexts (${d.contexts.length}):`);
      for (const c of d.contexts) {
        lines.push(`  #${c.id} ${c.type} "${c.label}" ${c.lost ? 'LOST' : 'ok'}  ${c.draws} draws` +
          (c.lostCount ? ` lost×${c.lostCount} restored×${c.restoredCount}` : ''));
      }
      lines.push('');
      lines.push(`gpu draws ${d.draws.total} total, ${d.draws.perSecond}/s  <- the real render rate`);
      lines.push(`raf callbacks ${d.frames.count} total, ${d.rafPerSecond}/s (a capped loop still fires every frame)`);
      lines.push(`stalls ${d.frames.stalls}, freezes ${d.frames.freezes}, worst gap ${Math.round(d.frames.worst)}ms`);
      lines.push(`long tasks ${d.longTasks.count}, worst ${Math.round(d.longTasks.worst)}ms, total ${Math.round(d.longTasks.totalMs)}ms`);
      if (d.heap) {
        const mb = (b) => (b / 1048576).toFixed(1);
        lines.push(`heap ${mb(d.heap.first.used)}MB -> ${mb(d.heap.last.used)}MB over ${(d.heap.last.atMs / 60000).toFixed(1)}m`);
      }
      lines.push('');
      lines.push('event log:');
      for (const e of d.log) {
        const ts = new Date(e.t).toISOString().slice(11, 19);
        lines.push(`  ${ts} ${e.kind.padEnd(16)} ${e.msg}${e.data ? ` ${JSON.stringify(e.data)}` : ''}`);
      }
      // The ant sim lives in an iframe with its own watchdog and no HUD of its
      // own; fold its report in so one copy captures the whole page.
      for (const kid of childWatchdogs()) {
        lines.push('');
        lines.push(`--- embedded frame: ${kid.name} ---`);
        lines.push(kid.api.report({ print: false }));
      }
      const text = lines.join('\n');
      if (print) console.log(text);
      return text;
    },
    clear() {
      log = [];
      localStorage.removeItem(STORE_KEY);
      record('session', 'log cleared');
    },
    off() {
      localStorage.removeItem('watchdog');
      console.info('[watchdog] disabled; reload to take effect');
    },
    get contexts() {
      return contexts;
    },
  };
  window.__watchdog = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountHud, { once: true });
  } else {
    mountHud();
  }

  // Previous session's tail is the most valuable thing here — surface it.
  const priorProblems = log.filter(
    (l) => l.t < startedAt && ['context-lost', 'freeze', 'error'].includes(l.kind),
  );
  if (priorProblems.length) {
    console.warn(
      `[watchdog] ${priorProblems.length} problem(s) recorded in earlier sessions — __watchdog.report() to read them`,
    );
  }
})();

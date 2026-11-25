/*
 * Measure the train sim's static map cache. Paste into the browser console on
 * the stats panel:
 *
 *     http://localhost:4319/#stats
 *
 * It needs a browser because the thing being measured is canvas rasterisation,
 * and this machine has no Chromium for the CDP runner in soak-webgl.mjs. It
 * drives drawStaticMap synchronously rather than waiting on frames, so the
 * numbers are immune to a throttled or backgrounded tab — which is worth doing
 * deliberately: rAF throttling in an automation pane produced three wrong
 * measurements earlier in this project.
 *
 * Reports three things:
 *   1. whether the camera origin lands on the device-pixel grid
 *   2. how far a blitted sub-rect differs from a fresh render at the same camera
 *   3. renders vs blits, and time per frame, over a scripted drag
 *
 * Everything it touches is restored before it returns.
 */
(async () => {
  const sc = window.__portfolioScenes && window.__portfolioScenes.stats;
  if (!sc) throw new Error('Open #stats first — the train scene is not mounted.');

  // The frame loop owns `size`; borrow it from one real frame.
  let cap = null;
  const orig = sc.drawStaticMap.bind(sc);
  sc.drawStaticMap = function (g, size, view) {
    cap = { size: { w: size.w, h: size.h, dpr: size.dpr } };
    return orig(g, size, view);
  };
  await new Promise((r) => {
    const wait = () => (cap ? r() : requestAnimationFrame(wait));
    wait();
    setTimeout(r, 4000);
  });
  sc.drawStaticMap = orig;
  if (!cap) throw new Error('No frame arrived in 4s — is the panel visible?');

  const { size } = cap;
  const dpr = Number(size.dpr) || 1;
  const W = Math.round(size.w * dpr);
  const H = Math.round(size.h * dpr);
  const savedMargin = sc.staticMapMargin;
  const savedPan = [sc.cameraPanX, sc.cameraPanY];

  const sink = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { c, g };
  };
  const diff = (a, b) => {
    let n = 0;
    let worst = 0;
    let sum = 0;
    for (let i = 0; i < a.length; i += 4) {
      const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      if (d) { n += 1; sum += d; if (d > worst) worst = d; }
    }
    return {
      differingPct: Math.round((n / (a.length / 4)) * 10000) / 100,
      meanWhenDiffering: n ? Math.round((sum / n) * 10) / 10 : 0,
      worstChannelSum: worst
    };
  };
  const sub = (cache, dx, dy) =>
    cache.canvas.getContext('2d').getImageData(cache.marginDev - dx, cache.marginDev - dy, W, H).data;

  // 1. The camera origin must be on the device-pixel grid for any pan, or the
  //    sub-rect offset would have to be rounded and the blit would misregister.
  const grid = [0, 0.5, 7.37, -12.91, 40.5, 103.25].map((pan) => {
    sc.cameraPanX = pan;
    sc.cameraPanY = -pan;
    const v = sc.view(size);
    return { pan, onGrid: Math.abs(v.ox * dpr - Math.round(v.ox * dpr)) < 1e-9 };
  });

  // 2. Blit vs fresh render at the same camera. This will NOT be zero, and that
  //    is expected rather than a defect: canvas 2d rasterisation is not
  //    translation-invariant, so shifting the scene by a single device pixel
  //    already changes anti-aliased coverage on diagonal edges — and an
  //    isometric scene is almost nothing but diagonal edges. Measured on this
  //    machine: ~1.4-2.1% of pixels, mean ~15 summed across RGB, and 93% of
  //    them sitting on a shape edge. What matters is that it stays in that
  //    range; a structural error would show as a much larger share.
  const correctness = [[-40, -24], [-40.5, -24.5], [-7.37, -3.91], [-99, -99]].map((pan) => {
    sc.staticMapMargin = savedMargin;
    sc.releaseStaticMapCache();
    sc.cameraPanX = 0;
    sc.cameraPanY = 0;
    sc.drawStaticMap(sink().g, size, sc.view(size));
    const cache = sc.staticMapCache;

    sc.cameraPanX = pan[0];
    sc.cameraPanY = pan[1];
    const v = sc.view(size);
    const dx = Math.round((v.ox - cache.ox) * dpr);
    const dy = Math.round((v.oy - cache.oy) * dpr);
    const exact = Math.abs((v.ox - cache.ox) * dpr - dx) < 1e-9
      && Math.abs((v.oy - cache.oy) * dpr - dy) < 1e-9;
    if (Math.abs(dx) > cache.marginDev || Math.abs(dy) > cache.marginDev) {
      return { pan, reusable: false };
    }
    const blitted = sub(cache, dx, dy);

    sc.staticMapMargin = () => 0;
    sc.releaseStaticMapCache();
    sc.drawStaticMap(sink().g, size, v);
    const fresh = sub(sc.staticMapCache, 0, 0);
    sc.staticMapMargin = savedMargin;

    return { pan, reusable: true, driftDev: [dx, dy], offsetIsExactInteger: exact, vsFresh: diff(blitted, fresh) };
  });

  // 3. A scripted drag: 30 frames out, 30 back, ~11 CSS px/frame diagonally,
  //    inside clampCamera's bounds so the pan asked for is the pan applied.
  //    Arm A is the margin cache; arm B forces a margin of zero, which is the
  //    old behaviour (every pan a miss).
  const PATH = [];
  for (let i = 0; i < 30; i += 1) PATH.push([-9, -6]);
  for (let i = 0; i < 30; i += 1) PATH.push([9, 6]);

  const drag = (marginFn, label) => {
    sc.staticMapMargin = marginFn;
    sc.releaseStaticMapCache();
    sc.cameraPanX = 0;
    sc.cameraPanY = 0;
    sc.staticMapStats = { renders: 0, blits: 0, lastMs: 0, totalMs: 0, marginCss: 0 };
    const s = sink();
    // The first frame is a render in both arms; price it, then exclude it.
    sc.drawStaticMap(s.g, size, sc.view(size));
    const oneRenderMs = sc.staticMapStats.totalMs;
    sc.staticMapStats.renders = 0;
    sc.staticMapStats.blits = 0;
    const t0 = performance.now();
    for (const [dx, dy] of PATH) {
      sc.cameraPanX += dx;
      sc.cameraPanY += dy;
      sc.drawStaticMap(s.g, size, sc.view(size));
    }
    const wall = performance.now() - t0;
    const cache = sc.staticMapCache;
    sc.staticMapMargin = savedMargin;
    return {
      label,
      renders: sc.staticMapStats.renders,
      blits: sc.staticMapStats.blits,
      hitRatePct: Math.round((sc.staticMapStats.blits / PATH.length) * 1000) / 10,
      msPerFrame: Math.round((wall / PATH.length) * 100) / 100,
      oneRenderMs: Math.round(oneRenderMs * 10) / 10,
      cacheMB: Math.round((cache.canvas.width * cache.canvas.height * 4) / 1048576 * 100) / 100
    };
  };
  const after = drag(savedMargin.bind(sc), 'margin cache');
  const before = drag(() => 0, 'no margin (old)');

  sc.staticMapMargin = savedMargin;
  sc.releaseStaticMapCache();
  sc.cameraPanX = savedPan[0];
  sc.cameraPanY = savedPan[1];

  const report = {
    viewportCss: [Math.round(size.w), Math.round(size.h)],
    dpr,
    marginCss: sc.staticMapMargin(size),
    cameraAlwaysOnPixelGrid: grid.every((g) => g.onGrid),
    correctness,
    drag: { before, after, timesFaster: Math.round((before.msPerFrame / after.msPerFrame) * 10) / 10 }
  };
  console.log(JSON.stringify(report, null, 2));
  return report;
})();

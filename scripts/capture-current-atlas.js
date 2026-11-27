/*
 * Bake the stats panel's CURRENT procedural art into the sprite template, so
 * the pixel-art remake has something to copy from.
 *
 * This cannot run in node: the art is ~60 drawX() methods on OpenTTDScene,
 * living inside index.html and painting to a 2D canvas. So it runs in the page.
 *
 *   1. node scripts/build-sprite-template.mjs
 *   2. pnpm build && (cd dist && python3 -m http.server 8799)
 *   3. python3 scripts/recv-dataurl.py art-source
 *   4. open http://localhost:8799/#stats and paste this file into the console
 *
 * Step 3's helper both serves the manifest and takes the finished sheets, so
 * the files it reads and the files it writes are the same directory. They sit
 * in art-source/, outside public/, so none of this ships to the live site --
 * which is also why the manifest cannot just be fetched from the page.
 *
 * It writes TWO sheets, from one bake, at the geometry train-atlas.json gives:
 *
 *   train-atlas-art.png      art only, on transparency. This is the one that
 *                            goes into the .ora, as a layer under the guides.
 *   train-atlas-current.png  the same art, labelled and on a checkerboard, for
 *                            reading at a glance. Never embed this one: it
 *                            carries its own background, labels, frames and
 *                            diamonds, so stacking it under the guides layer
 *                            draws every caption twice in two different fonts.
 *
 * Each cell is pinned by its ANCHOR rather than centred by its bounding box:
 * procedural painters put tile (0,0)'s floor centre at the middle of the
 * scratch canvas, and train sprites carry their own spriteMeta.anchor. So the
 * art lands ON the footprint diamond the guides draw instead of floating in
 * the middle of the box.
 *
 * The labelled sheet checkerboards its cells on purpose: the wagon bodies are
 * painted in #07120d, the panel's own background colour, so against any flat
 * dark fill they vanish. Two tones make them read as silhouettes.
 */
(async () => {
  const s = window.__portfolioEnsureScene('stats');
  const mkView = (ox, oy) =>
    Object.assign(s.rawView({ w: 800, h: 600 }, 1, 0, 0), { tileW: 64, tileH: 32, ox, oy });

  const crop = (c) => {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (d[(y * c.width + x) * 4 + 3]) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    return x1 < 0 ? null : { canvas: c, x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  };

  // ox/oy: where this art's anchor sits in its own source canvas, so the sheet
  // can pin it to the cell's anchor instead of centring its bounding box.
  const bake = (fn) => {
    const S = 260;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    // mkView's oy is the TOP vertex of tile (0,0). Its floor CENTRE is half a
    // tile lower, which puts both coordinates on S / 2 exactly.
    fn(g, mkView(S / 2, S / 2 - 16));
    const box = crop(c);
    return box && { ...box, ox: S / 2, oy: S / 2 };
  };

  const fromSprite = (canvas) => {
    const box = crop(canvas);
    const a = canvas.spriteMeta && canvas.spriteMeta.anchor;
    return box && { ...box, ox: a ? a.x : canvas.width / 2, oy: a ? a.y : canvas.height / 2 };
  };

  // THE HALF-TILE CONVENTION, which bit this file twice.
  //
  // iso(x, y) is a tile's NORTH CORNER, not its centre: the centre is
  // iso(x + 0.5, y + 0.5), half a tile (16px) lower. Painters resolve their
  // origin one of two ways, and the caller has to make up the difference:
  //
  //   * through propPx / this.iso(view, x, y, z)  -> pass the tile CENTRE.
  //     That is the overwhelming majority, and it is what the live scene
  //     does: index.html's prop dispatch passes `prop.x + 0.5, prop.y + 0.5`
  //     to ~45 painters.
  //   * through this.iso(view, x + 0.5, y + 0.5)  -> pass the bare tile.
  //     Only drawTile, drawFarmTile and drawFieldRows, and the live scene
  //     passes those bare `prop.x, prop.y` to match.
  //
  // Passing (0, 0) to the first group bakes it 16px above the footprint it is
  // supposed to stand on, which is what 42 of these 72 cells used to do.
  //
  // Fractional tiles are fine: the track painters go through
  // screenPointForTile, which is arithmetic.
  //
  // Mind the convention. screenPointForTile returns iso(x, y) -- the tile's
  // NORTH CORNER -- while drawTile centres its diamond on iso(x+0.5, y+0.5).
  // So track coordinates are offset half a tile on both axes to put the run
  // through the tile CENTRE, and span exactly 1.0 so a cell holds one tile's
  // worth of track rather than a segment reaching into its neighbour.
  const T = (x, y) => ({ x, y });
  const C = T(0.5, 0.5);   // the centre of tile (0,0)
  const GROUPS = [
    ['TERRAIN', [
      ['grass', (g, v) => s.drawTile(g, v, 0, 0, 'grass')],
      ['field', (g, v) => s.drawTile(g, v, 0, 0, 'field')],
      ['forest', (g, v) => s.drawTile(g, v, 0, 0, 'forest')],
      ['forest-hill', (g, v) => s.drawTile(g, v, 0, 0, 'forestHill')],
      ['hill', (g, v) => s.drawTile(g, v, 0, 0, 'hill')],
      ['water', (g, v) => s.drawTile(g, v, 0, 0, 'water')],
      ['farm-tile', (g, v) => s.drawFarmTile(g, v, 0, 0)],
      ['field-rows', (g, v) => s.drawFieldRows(g, v, 0, 0)],
    ]],
    ['TRACK', [
      ['rail-x', (g, v) => s.drawGroundRail(g, v, T(0, 0.5), T(1, 0.5))],
      ['rail-y', (g, v) => s.drawGroundRail(g, v, T(0.5, 0), T(0.5, 1))],
      ['rail-curve', (g, v) => { s.drawGroundRail(g, v, C, T(1, 0.5)); s.drawGroundRail(g, v, C, T(0.5, 1)); }],
      ['rail-pair', (g, v) => s.drawRailPair(g, v, T(0, 0.5), T(1, 0.5))],
      ['sleepers', (g, v) => s.drawSleepers(g, v, T(0, 0.5), T(1, 0.5), 1)],
      ['ballast-pile', (g, v) => s.drawBallastPile(g, v, C.x, C.y)],
      ['crossing-gate', (g, v) => s.drawCrossingGate(g, v, C.x, C.y)],
      ['one-way-arrow', (g, v) => s.drawOneWayArrow(g, v, T(0, 0.5), T(1, 0.5))],
    ]],
    ['BUILDINGS', [
      ['industry', (g, v) => s.drawIndustryBuilding(g, v, C.x, C.y)],
      ['apartment', (g, v) => s.drawApartmentBlock(g, v, C.x, C.y)],
      ['country-home', (g, v) => s.drawCountryHome(g, v, C.x, C.y)],
      ['town-house', (g, v) => s.drawTownHouse(g, v, C.x, C.y)],
      ['row-house', (g, v) => s.drawRowHouse(g, v, C.x, C.y)],
      ['shed', (g, v) => s.drawShed(g, v, C.x, C.y)],
      ['water-tower', (g, v) => s.drawWaterTower(g, v, C.x, C.y)],
      ['signal-box', (g, v) => s.drawSignalBox(g, v, C.x, C.y)],
    ]],
    ['STATION', [
      ['canopy', (g, v) => s.drawPlatformCanopy(g, v, C.x, C.y)],
      ['platform-edge', (g, v) => s.drawPlatformEdge(g, v, C.x, C.y)],
      ['platform-post', (g, v) => s.drawPlatformPost(g, v, C.x, C.y)],
      ['platform-sign', (g, v) => s.drawPlatformSign(g, v, C.x, C.y)],
      ['station-clock', (g, v) => s.drawStationClock(g, v, C.x, C.y)],
      ['station-lamp', (g, v) => s.drawStationLamp(g, v, C.x, C.y)],
      ['name-board', (g, v) => s.drawNameBoard(g, v, C.x, C.y)],
      ['bench', (g, v) => s.drawBench(g, v, C.x, C.y)],
    ]],
    ['TRACKSIDE', [
      ['rail-fence', (g, v) => s.drawRailFence(g, v, C.x, C.y)],
      ['signal-gantry', (g, v) => s.drawSignalGantry(g, v, C.x, C.y)],
      ['signal-repeater', (g, v) => s.drawSignalRepeater(g, v, C.x, C.y)],
      ['cable-box', (g, v) => s.drawCableBox(g, v, C.x, C.y)],
      ['switch-stand', (g, v) => s.drawSwitchStand(g, v, C.x, C.y)],
      ['track-tools', (g, v) => s.drawTrackTools(g, v, C.x, C.y)],
      ['rail-worker', (g, v) => s.drawRailWorker(g, v, C.x, C.y)],
      ['track-crate', (g, v) => s.drawTrackCrate(g, v, C.x, C.y)],
      ['telegraph', (g, v) => s.drawTelegraph(g, v, C.x, C.y)],
      ['line-box', (g, v) => s.drawLineBox(g, v, C.x, C.y)],
      ['oil-pipe', (g, v) => s.drawOilPipe(g, v, C.x, C.y)],
      ['yard-pipes', (g, v) => s.drawYardPipes(g, v, C.x, C.y)],
      ['yard-lamp', (g, v) => s.drawYardLamp(g, v, C.x, C.y)],
      ['retaining-wall', (g, v) => s.drawRetainingWall(g, v, C.x, C.y)],
      ['coal-pile', (g, v) => s.drawCoalPile(g, v, C.x, C.y)],
      ['log-pile', (g, v) => s.drawLogPile(g, v, C.x, C.y)],
    ]],
    ['NATURE & YARD', [
      ['tree', (g, v) => s.drawTree(g, v, C.x, C.y)],
      ['bush', (g, v) => s.drawBush(g, v, C.x, C.y)],
      ['rock', (g, v) => s.drawRock(g, v, C.x, C.y)],
      ['hedge', (g, v) => s.drawHedge(g, v, C.x, C.y)],
      ['fence', (g, v) => s.drawFence(g, v, C.x, C.y)],
      ['crate', (g, v) => s.drawCrate(g, v, C.x, C.y)],
      ['mail-van', (g, v) => s.drawMailVan(g, v, C.x, C.y)],
      ['road-car', (g, v) => s.drawSmallRoadCar(g, v, C.x, C.y)],
    ]],
  ];

  // The trains already are sprites, with anchors, from the scene's own maker.
  for (const [group, engine] of [['LOCOMOTIVE', true], ['WAGON', false]]) {
    GROUPS.push([group, s.trainSpriteDirs.map((dir) => [
      `${engine ? 'loco' : 'wagon'}-${dir.toLowerCase()}`,
      null,
      () => s.makeTrainSprite({
        dir, orientation: s.spriteOrientationForDir(dir),
        cargoType: 'coal', loaded: true, engine, phase: 0,
      }),
    ])]);
  }

  // Geometry comes from train-atlas.json rather than a second copy of the
  // layout maths. This script used to recompute the packing itself and the two
  // drifted: the template owns the boxes, this only fills them.
  const HELPER = 'http://127.0.0.1:8800';
  let manifest;
  try {
    manifest = await (await fetch(`${HELPER}/train-atlas.json`)).json();
  } catch (e) {
    console.error(`[atlas] cannot read ${HELPER}/train-atlas.json — start the helper with`
      + ' `python3 scripts/recv-dataurl.py art-source`, and run'
      + ' `node scripts/build-sprite-template.mjs` first if the manifest is missing.', e);
    return;
  }

  const here = new Set(GROUPS.flatMap(([, cells]) => cells.map((c) => c[0])));
  const there = new Set(Object.keys(manifest.sprites));
  const missing = [...there].filter((n) => !here.has(n));
  const extra = [...here].filter((n) => !there.has(n));
  if (missing.length || extra.length) {
    console.error('[atlas] this script and train-atlas.json have drifted apart — nothing written.');
    if (missing.length) console.error('  in the template but not baked here:', missing.join(', '));
    if (extra.length) console.error('  baked here but not in the template:', extra.join(', '));
    console.error('  reconcile scripts/lib/atlas-cells.mjs with the GROUPS above.');
    return;
  }
  console.log(`[atlas] ${there.size} cells, in step with train-atlas.json`);

  const W = manifest.sheet.width;
  const H = manifest.sheet.height;
  const TILE_W = 64;
  const TILE_H = 32;

  // One bake, two sheets. Baking once is what keeps them in register.
  const cells = [];
  for (const [, list] of GROUPS) {
    for (const [name, fn, spriteFn] of list) {
      cells.push({ name, rect: manifest.sprites[name], art: spriteFn ? fromSprite(spriteFn()) : bake(fn) });
    }
  }
  const blank = cells.filter((c) => !c.art).map((c) => c.name);
  if (blank.length) console.warn('[atlas] inked nothing:', blank.join(', '));

  const fit = (g, t, maxW) => {
    let v = t;
    while (v.length > 1 && g.measureText(v).width > maxW) v = v.slice(0, -1);
    return v === t ? t : `${v.slice(0, -1)}…`;
  };

  const checker = (g, x, y, w, h) => {
    const S = 4;
    for (let j = 0; j < h; j += S)
      for (let i = 0; i < w; i += S) {
        g.fillStyle = ((i / S + j / S) & 1) ? '#39413b' : '#2d342f';
        g.fillRect(x + i, y + j, Math.min(S, w - i), Math.min(S, h - j));
      }
  };

  const sheet = (chrome) => {
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const g = out.getContext('2d');
    g.imageSmoothingEnabled = false;

    if (chrome) {
      g.fillStyle = '#161a18';
      g.fillRect(0, 0, W, H);
      g.font = 'bold 10px monospace';
      g.fillStyle = '#d6bd68';
      for (const grp of manifest.groups) g.fillText(grp.name, grp.x, grp.y + 10);
    }

    for (const { name, rect, art } of cells) {
      const ax = rect.x + rect.anchorX;
      const ay = rect.y + rect.anchorY;

      if (chrome) {
        g.font = '8px monospace';
        g.fillStyle = 'rgba(255,248,232,0.82)';
        g.fillText(fit(g, name, rect.w - 3), rect.x + 1, rect.labelY + 8);
        checker(g, rect.x, rect.y, rect.w, rect.h);
        g.strokeStyle = 'rgba(214,189,104,0.3)';
        g.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w - 1, rect.h - 1);
        // One 64x32 tile, at the floor. Always ONE tile across even in a
        // double-width cell: the diamond is the unit of scale, not the size of
        // the box drawn around it.
        // Half-pixel centres, or a 1px stroke straddles two columns and the
        // whole diamond renders soft. Inclusive extents, so it is 64x32 and
        // stays inside the cell -- the same arithmetic the guides layer uses.
        g.beginPath();
        g.moveTo(ax + 0.5, ay - TILE_H / 2 + 0.5);
        g.lineTo(ax + TILE_W / 2 - 1 + 0.5, ay + 0.5);
        g.lineTo(ax + 0.5, ay + TILE_H / 2 - 1 + 0.5);
        g.lineTo(ax - TILE_W / 2 + 0.5, ay + 0.5);
        g.closePath();
        g.stroke();
      }

      if (!art) continue;
      const dx = Math.round(ax - (art.ox - art.x));
      const dy = Math.round(ay - (art.oy - art.y));
      g.save();
      g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
      g.drawImage(art.canvas, art.x, art.y, art.w, art.h, dx, dy, art.w, art.h);
      g.restore();
    }

    if (chrome) {
      g.fillStyle = 'rgba(255,248,232,0.62)';
      g.font = '8px monospace';
      // Trimmed to fit: the second line used to run off the right edge.
      for (const [i, line] of [
        'Current art from the stats panel, baked cell by cell. Diamond = one 64x32 tile, at the floor.',
        'Checkerboard = transparency. Wagons are painted the panel background colour, so they read as silhouettes.',
      ].entries()) {
        g.fillText(fit(g, line, W - 4), 2, H - 16 + i * 11);
      }
    }
    return out;
  };

  const post = async (name, canvas) => {
    const res = await fetch(`${HELPER}/${name}`, {
      method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: canvas.toDataURL('image/png'),
    });
    return `${name} ${await res.text()}`;
  };

  const art = await post('train-atlas-art.png', sheet(false));
  const labelled = await post('train-atlas-current.png', sheet(true));
  console.log(`${W}x${H}, ${cells.length} cells — ${art}; ${labelled}`);
})();

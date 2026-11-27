/*
 * The canonical cell list for the isometric train atlas, and the geometry that
 * places it. One list, because two had already drifted: the first template was
 * invented from the projection (dirt, sand, rail-curve-n, depot) while the
 * scene actually draws forest, forestHill, hill and some forty trackside props
 * that had no cell at all.
 *
 * These names and this layout now match scripts/capture-current-atlas.js cell
 * for cell, so the baked reference sheet and the blank template come out the
 * same size with the same boxes in the same places -- which is the point: drop
 * the reference under the blank and trace it.
 *
 * Changing a name here changes train-atlas.json, so the capture script checks
 * itself against that manifest and refuses to bake if the two have drifted
 * apart again.
 *
 * Nothing in index.html reads train-atlas.json yet -- the scene still draws
 * every sprite procedurally. The manifest is the contract between the two
 * halves of this toolchain, and the handoff point for the day the renderer
 * does start blitting from a sheet.
 */

export const GEOMETRY = {
  cellW: 64,     // one tile footprint across
  tileH: 32,     // 2:1, so the floor diamond is 64x32
  gap: 2,        // gutter, so neighbours never bleed into each other
  artH: 64,      // cell height: 18 below the floor centre for the footprint,
                 // 46 above it, and the tallest thing the scene draws is 41.
  labelH: 10,    // the cell name sits above its box
  headH: 15,     // group heading band
  pad: 2,
  cols: 8,
  footerH: 26,   // two lines of notes at the bottom
  floorUp: 18,   // floor centre sits this far above the bottom of the cell.
                 // A 64x32 tile diamond reaches 16px BELOW its centre, so any
                 // value under 16 pushes the footprint out through the bottom
                 // of the cell and into the row beneath. 10 did exactly that:
                 // every diamond overhung its box by 6px.
};

/**
 * Cells wider than one tile. Empty now: rail-curve used to take two, because
 * it was baked as two full-tile segments and needed the room. It is drawn as
 * two HALF segments from the tile centre now, which is what a one-tile curve
 * sprite actually is, so it fits its own cell like everything else.
 */
export const SPAN = {};

export const GROUPS = [
  { name: 'TERRAIN', cells: ['grass', 'field', 'forest', 'forest-hill', 'hill', 'water', 'farm-tile', 'field-rows'] },
  { name: 'TRACK', cells: ['rail-x', 'rail-y', 'rail-curve', 'rail-pair', 'sleepers', 'ballast-pile', 'crossing-gate', 'one-way-arrow'] },
  { name: 'BUILDINGS', cells: ['industry', 'apartment', 'country-home', 'town-house', 'row-house', 'shed', 'water-tower', 'signal-box'] },
  { name: 'STATION', cells: ['canopy', 'platform-edge', 'platform-post', 'platform-sign', 'station-clock', 'station-lamp', 'name-board', 'bench'] },
  {
    name: 'TRACKSIDE',
    cells: [
      'rail-fence', 'signal-gantry', 'signal-repeater', 'cable-box', 'switch-stand', 'track-tools', 'rail-worker', 'track-crate',
      'telegraph', 'line-box', 'oil-pipe', 'yard-pipes', 'yard-lamp', 'retaining-wall', 'coal-pile', 'log-pile',
    ],
  },
  { name: 'NATURE & YARD', cells: ['tree', 'bush', 'rock', 'hedge', 'fence', 'crate', 'mail-van', 'road-car'] },
  { name: 'LOCOMOTIVE', cells: ['loco-e', 'loco-se', 'loco-s', 'loco-sw', 'loco-w', 'loco-nw', 'loco-n', 'loco-ne'] },
  { name: 'WAGON', cells: ['wagon-e', 'wagon-se', 'wagon-s', 'wagon-sw', 'wagon-w', 'wagon-nw', 'wagon-n', 'wagon-ne'] },
];

export const DIRECTIONS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

/**
 * Pack the cells into rows of `cols` units and return the sheet size plus a
 * rect per cell. `rows` is returned too, so a renderer can draw the group
 * headings in the same pass without re-deriving the packing.
 */
export function layout() {
  const { cellW, gap, artH, labelH, headH, pad, cols, footerH, floorUp } = GEOMETRY;

  const groups = [];
  const rows = [];
  for (const group of GROUPS) {
    let row = { group: group.name, items: [] };
    rows.push(row);
    let used = 0;
    for (const name of group.cells) {
      const span = SPAN[name] || 1;
      if (used + span > cols) {
        row = { group: null, items: [] };
        rows.push(row);
        used = 0;
      }
      row.items.push({ name, span, col: used, group: group.name });
      used += span;
    }
  }

  const width = pad * 2 + cols * cellW + (cols - 1) * gap;
  const rects = {};
  let y = pad;
  for (const row of rows) {
    row.headY = y;
    if (row.group) {
      groups.push({ name: row.group, x: pad, y });
      y += headH;
    }
    row.labelY = y;
    const top = y + labelH;
    for (const item of row.items) {
      const x = pad + item.col * (cellW + gap);
      const w = item.span * cellW + (item.span - 1) * gap;
      rects[item.name] = {
        x,
        y: top,
        w,
        h: artH,
        // Where the tile floor sits inside the cell, so the renderer pins a
        // sprite the same way the guides draw it.
        anchorX: Math.round(w / 2),
        anchorY: artH - floorUp,
        labelY: row.labelY,
        group: item.group,
      };
      item.x = x;
      item.y = y;
      item.w = w;
      item.top = top;
    }
    y = top + artH + 4;
  }

  return { width, height: y + pad + footerH, rows, rects, groups };
}

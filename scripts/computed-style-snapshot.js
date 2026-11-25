/*
 * Snapshot every resolved style that a CSS change could move, for every element
 * on the page. Paste into the browser console before and after a stylesheet
 * rewrite; identical snapshots are proof the rewrite was a no-op.
 *
 *   window.__styleSnapshot()        -> { hash, elements, properties, counts }
 *   window.__styleSnapshot(true)    -> ...with the full per-element dump
 *
 * Computed styles rather than screenshots, deliberately. Three of the four pages
 * draw animated canvas content -- an ant colony, a growing vine, a train
 * simulation -- so a pixel diff is noise by construction. getComputedStyle
 * resolves var() to its final value, so if a literal-to-token rewrite changed
 * anything at all, the resolved value changes and this catches it exactly.
 *
 * Canvas pixels are out of scope on purpose: nothing in this rewrite touches
 * the drawing code, and that is checked separately by asserting the rewrite
 * never edits a <script>.
 */
(() => {
  const PROPS = [
    'color', 'background-color', 'background-image',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'outline-color', 'text-decoration-color', 'caret-color', 'column-rule-color',
    'fill', 'stroke', 'box-shadow', 'text-shadow', 'accent-color',
    'font-size', 'font-family', 'font-weight', 'line-height', 'letter-spacing',
    'border-top-width', 'border-radius', 'opacity',
  ];

  // A path that survives re-rendering: tag plus position among siblings.
  const pathOf = (el) => {
    const parts = [];
    let n = el;
    while (n && n.nodeType === 1 && parts.length < 24) {
      const parent = n.parentElement;
      const i = parent ? [...parent.children].indexOf(n) : 0;
      parts.unshift(`${n.tagName.toLowerCase()}:${i}`);
      n = parent;
    }
    return parts.join('/');
  };

  const fnv = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16);
  };

  window.__styleSnapshot = (full = false) => {
    const els = [...document.querySelectorAll('*')].filter(
      (el) => !['SCRIPT', 'META', 'TITLE', 'LINK'].includes(el.tagName),
    );
    const rows = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      const vals = PROPS.map((p) => cs.getPropertyValue(p));
      rows.push(`${pathOf(el)}|${vals.join('|')}`);
      // Pseudo-elements carry a surprising amount of this site's colour.
      for (const pseudo of ['::before', '::after']) {
        const pcs = getComputedStyle(el, pseudo);
        if (pcs.content && pcs.content !== 'none') {
          rows.push(`${pathOf(el)}${pseudo}|${PROPS.map((p) => pcs.getPropertyValue(p)).join('|')}`);
        }
      }
    }
    rows.sort();
    const body = rows.join('\n');
    const out = {
      url: location.pathname + location.search + location.hash,
      elements: els.length,
      rowsCaptured: rows.length,
      properties: PROPS.length,
      hash: fnv(body),
      distinctColours: new Set(
        body.match(/rgba?\([^)]*\)/g) || [],
      ).size,
    };
    if (full) out.rows = rows;
    return out;
  };

  return 'ready — call __styleSnapshot() or __styleSnapshot(true)';
})();

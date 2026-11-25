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
  // The widths and STYLES are here because of how var() fails. An unresolvable
  // custom property does not fall back to the literal -- it makes the whole
  // declaration invalid at computed-value time, so `border: 1px solid
  // var(--typo)` loses its width and its style, not just its colour. Checking
  // only border-top-width and the colours would have let a mistyped token
  // delete every border on the page and still report an identical snapshot.
  const PROPS = [
    'color', 'background-color', 'background-image',
    'background-size', 'background-repeat', 'background-position',
    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
    'outline-color', 'outline-style', 'outline-width',
    'text-decoration-color', 'caret-color', 'column-rule-color',
    'fill', 'stroke', 'box-shadow', 'text-shadow', 'accent-color',
    'font-size', 'font-family', 'font-weight', 'line-height', 'letter-spacing',
    'border-radius', 'opacity',
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

  // Same-origin frames are walked too. querySelectorAll('*') stops dead at an
  // iframe boundary, and on the homepage that is 45% of the styled DOM -- the
  // half governed by src/styles.css, which is the entire ant dialect. It also
  // cannot be reached any other way: ant.html redirects to /#ants when it is
  // loaded as a top-level document, so inside the frame is the only place it
  // exists.
  const collect = (doc, win, prefix, rows) => {
    const els = [...doc.querySelectorAll('*')].filter(
      (el) => !['SCRIPT', 'META', 'TITLE', 'LINK'].includes(el.tagName),
    );
    for (const el of els) {
      const cs = win.getComputedStyle(el);
      rows.push(`${prefix}${pathOf(el)}|${PROPS.map((p) => cs.getPropertyValue(p)).join('|')}`);
      // Pseudo-elements carry a surprising amount of this site's colour.
      for (const pseudo of ['::before', '::after']) {
        const pcs = win.getComputedStyle(el, pseudo);
        if (pcs.content && pcs.content !== 'none') {
          rows.push(`${prefix}${pathOf(el)}${pseudo}|${PROPS.map((p) => pcs.getPropertyValue(p)).join('|')}`);
        }
      }
    }
    for (const frame of doc.querySelectorAll('iframe')) {
      try {
        const fd = frame.contentDocument;
        if (fd && fd.body) collect(fd, frame.contentWindow, `${prefix}[${frame.id || 'iframe'}]/`, rows);
        else rows.push(`${prefix}[${frame.id || 'iframe'}]|EMPTY`);
      } catch {
        rows.push(`${prefix}[${frame.id || 'iframe'}]|CROSS-ORIGIN, NOT CAPTURED`);
      }
    }
    return els.length;
  };

  window.__styleSnapshot = (full = false) => {
    const rows = [];
    const els = collect(document, window, '', rows);
    // Sorted, so the hash depends on what is styled rather than on the order
    // the walk happened to visit it in.
    rows.sort();
    const body = rows.join('\n');
    const out = {
      url: location.pathname + location.search + location.hash,
      elements: els,
      framesCaptured: rows.filter((r) => r.includes('[') && !r.includes('NOT CAPTURED')).length > 0,
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

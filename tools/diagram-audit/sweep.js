/**
 * The diagram sweeps, to paste into the console with `out/index.html` open.
 *
 * Three questions, none of which a test in this repo can ask: jsdom does no SVG text layout, so
 * every measurement below reads back as zero there.
 *
 *   1. Does any label leave its frame?    (the truncated "hemoreceptors" on a phone)
 *   2. Does any label land on another?    (two lines of one caption, a tick under an axis name)
 *   3. Does a LINE run through a label?   (a gridline across the value tracking a point)
 *   4. Can any label be READ?             (a word written across a saturated signal colour)
 *
 * The page holds both themes and shows one at a time. This measures whichever is ON SCREEN,
 * so run it once per theme: a label that clears its neighbour in light can collide in dark
 * only if the text differs, but contrast differs in both directions and routinely does.
 *
 * Measure with `getBoundingClientRect`, NOT `getBBox` — `getBBox` ignores ancestor transforms, so
 * every label inside a translated `<g>` reports the same origin and every diagram looks broken.
 *
 * The geometry pass runs twice, once at the page's width and once with the frames squeezed to a
 * phone's 390px, because a pair of labels twelve units apart collides at one size and clears at
 * the other. The contrast pass composites each shape's fill over the page and each label over
 * that, and reports anything under 3:1 — which is how thirty-nine unreadable labels were found
 * that the geometry pass could not see.
 */
(() => {
  const parse = (h) => {
    h = h.trim();
    if (h.startsWith('#')) {
      const n = Number.parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = h.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : null;
  };
  const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));
  const lum = (c) =>
    c.map((v) => (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const alpha = (el) =>
    Number.parseFloat(el.getAttribute('fill-opacity') ?? '1') * Number.parseFloat(el.getAttribute('opacity') ?? '1');
  // The page now holds BOTH themes for every frame, one of them hidden. A hidden frame
  // measures as zero width, which would report every one of its labels as leaving the frame,
  // so the sweep only ever sees the theme currently on screen.
  const frames = () =>
    [...document.querySelectorAll('svg[data-module]')].filter((s) => s.getBoundingClientRect().width > 0);
  const name = (svg) => svg.dataset.module + (svg.dataset.frame !== '0' ? `[${svg.dataset.frame}]` : '');

  function geometry() {
    const out = [];
    for (const svg of frames()) {
      const box = svg.querySelector('[data-frame-bg]').getBoundingClientRect();
      // `[data-halo-pass]` is the background-coloured outline drawn under a haloed label, not a
      // label of its own — counted, every haloed label overlaps itself.
      const rects = [...svg.querySelectorAll('text:not([data-halo-pass])')].map((t) => ({ t: t.textContent, r: t.getBoundingClientRect() }));
      const issues = [];
      for (const { t, r } of rects) {
        if (!r.width) continue;
        const d = Math.max(box.left - r.left, r.right - box.right, box.top - r.top, r.bottom - box.bottom);
        if (d > 0.5) issues.push(`CLIPPED "${t}" by ${d.toFixed(0)}px`);
      }
      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i].r;
          const b = rects[j].r;
          if (!a.width || !b.width) continue;
          const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (ox > 1 && oy > 1) issues.push(`OVERLAP "${rects[i].t}" / "${rects[j].t}"`);
        }
      }
      if (issues.length) out.push(`${name(svg)}: ${issues.join(' | ')}`);
    }
    return out;
  }

  function contrast() {
    const out = [];
    for (const svg of frames()) {
      const page = parse(svg.style.background || '#f8fafc');
      const shapes = [...svg.querySelectorAll('rect:not([data-frame-bg]),circle,path')]
        .map((el) => {
          const f = el.getAttribute('fill');
          if (!f || f === 'none' || f.startsWith('url(')) return null;
          const c = parse(f);
          if (!c) return null;
          const r = el.getBoundingClientRect();
          /* A circle is tested as a circle. Against its bounding BOX, a label tucked into the
             corner outside the disc counts as sitting on it — which is how coronaryCirculation's
             "Epicardial artery", half a pixel past the top-left of a ring it points into, came
             back as unreadable. */
          const round = el.tagName === 'circle';
          return { r, c: over(c, alpha(el), page), round };
        })
        .filter(Boolean);
      const covered = (s, x, y) => {
        if (x < s.r.left || x > s.r.right || y < s.r.top || y > s.r.bottom) return false;
        if (!s.round) return true;
        const cx = (s.r.left + s.r.right) / 2;
        const cy = (s.r.top + s.r.bottom) / 2;
        const rx = s.r.width / 2;
        const ry = s.r.height / 2;
        return rx > 0 && ry > 0 && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
      };
      const bad = [];
      // A haloed label carries its own background, so what is behind it does not decide
      // whether it can be read; and the halo pass itself is not a label.
      for (const t of svg.querySelectorAll('text:not([data-halo]):not([data-halo-pass])')) {
        const r = t.getBoundingClientRect();
        if (!r.width) continue;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // Last match wins: shapes are painted in document order, so the last one containing the
        // label's centre is the one actually behind it.
        let cover = null;
        for (const s of shapes) if (covered(s, cx, cy)) cover = s;
        if (!cover) continue;
        const ink = parse(t.getAttribute('fill') || '#000');
        if (!ink) continue;
        const cr = ratio(over(ink, Number.parseFloat(t.getAttribute('opacity') ?? '1'), cover.c), cover.c);
        if (cr < 3) bad.push(`"${t.textContent}" ${cr.toFixed(1)}:1`);
      }
      if (bad.length) out.push(`${name(svg)}: ${bad.join(', ')}`);
    }
    return out;
  }

  /**
   * Text a stroked line runs across — a gridline, a vessel, a box's own border.
   *
   * Severity is the share of the label's WIDTH the stroke spans, so a leader stopping at the
   * label's edge scores near zero and a gridline crossing it scores near one. Two exemptions,
   * both of which mean the label is readable anyway:
   *
   *   * a HALOED label, which is painted over a background-coloured outline of itself. That is
   *     the answer for a label that must stay on the thing it names, and its halo pass is not a
   *     label at all;
   *   * a stroke that a later opaque shape covers. The steroidogenic spine runs straight through
   *     all four of adrenalCortex's enzyme boxes, and each box is filled, so the line is behind
   *     the box and the name inside it is clear.
   */
  function overStrokes() {
    const out = [];
    for (const svg of frames()) {
      const texts = [...svg.querySelectorAll('text:not([data-halo]):not([data-halo-pass])')]
        .map((t) => ({ t: t.textContent, r: t.getBoundingClientRect() }))
        .filter((x) => x.r.width > 1);
      if (!texts.length) continue;

      const all = [...svg.querySelectorAll('*')];
      const order = new Map(all.map((el, i) => [el, i]));
      const covers = all
        .filter((el) => /^(rect|circle|path|ellipse)$/.test(el.tagName) && alpha(el) >= 0.9)
        .filter((el) => {
          const f = el.getAttribute('fill');
          return f && f !== 'none' && !f.startsWith('url(');
        })
        .map((el) => ({ r: el.getBoundingClientRect(), i: order.get(el) }));

      const worst = new Map();
      for (const el of svg.querySelectorAll('line,rect,circle,path')) {
        const stroke = el.getAttribute('stroke');
        if (!stroke || stroke === 'none') continue;
        let len = 0;
        try {
          len = el.getTotalLength ? el.getTotalLength() : 0;
        } catch {
          continue;
        }
        if (!len) continue;
        const ctm = el.getScreenCTM();
        if (!ctm) continue;
        const si = order.get(el);
        const steps = Math.min(1200, Math.max(24, Math.round(len)));
        const inside = new Map();
        for (let i = 0; i <= steps; i++) {
          let p;
          try {
            p = el.getPointAtLength((len * i) / steps);
          } catch {
            break;
          }
          const q = new DOMPoint(p.x, p.y).matrixTransform(ctm);
          for (const tx of texts) {
            const r = tx.r;
            if (q.x <= r.left || q.x >= r.right || q.y <= r.top + 1 || q.y >= r.bottom - 1) continue;
            const hidden = covers.some(
              (c) => c.i > si && c.r.left <= r.left && c.r.right >= r.right && c.r.top <= r.top && c.r.bottom >= r.bottom,
            );
            if (hidden) continue;
            const cur = inside.get(tx.t) ?? { min: Infinity, max: -Infinity, r };
            cur.min = Math.min(cur.min, q.x);
            cur.max = Math.max(cur.max, q.x);
            inside.set(tx.t, cur);
          }
        }
        for (const [label, v] of inside) {
          const frac = (v.max - v.min) / v.r.width;
          if (frac > (worst.get(label)?.frac ?? 0)) worst.set(label, { frac });
        }
      }

      const bad = [...worst]
        .filter(([, v]) => v.frac > 0.35)
        .sort((a, b) => b[1].frac - a[1].frac)
        .map(([label, v]) => `"${label}" ${(v.frac * 100).toFixed(0)}%`);
      if (bad.length) out.push(`${name(svg)}: ${bad.join(', ')}`);
    }
    return out;
  }

  const figures = [...document.querySelectorAll('figure')];
  const desktop = geometry();
  figures.forEach((f) => (f.style.maxWidth = '390px'));
  const phone = geometry();
  // Restore to the page's own sizing, which is now a grid the width control drives — pinning
  // these back to 900px would override it.
  figures.forEach((f) => (f.style.maxWidth = ''));
  const strokes = overStrokes();
  const readability = contrast();
  return [
    `geometry, desktop width: ${desktop.length}`,
    ...desktop,
    `geometry, phone width: ${phone.length}`,
    ...phone,
    `label crossed by a line: ${strokes.length}`,
    ...strokes,
    `contrast under 3:1: ${readability.length}`,
    ...readability,
  ].join('\n');
})();

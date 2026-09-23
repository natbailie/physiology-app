/**
 * The review page `render.test.ts` writes to `out/index.html`.
 *
 * The old page was a single 900px column of light-theme frames. That is the wrong instrument for
 * the question actually being asked of it — "are these good?" — for three reasons, and this page
 * exists to fix all three:
 *
 *   1. CONSISTENCY is only visible side by side. Fifty-seven diagrams in one column are judged one
 *      at a time; in a grid they are judged against each other, which is what a learner paging
 *      through the app actually does.
 *   2. The PHONE is the product. A column at desktop width hides every collision that only happens
 *      at 390px, which is where `sweep.js` finds them.
 *   3. A VERDICT has nowhere to go. Looking at a bad diagram produced nothing durable, so the
 *      looking had to be redone every time. Each frame now takes a keep/fix/redraw and a note,
 *      persisted to localStorage and exported as `review.json`.
 *
 * `sweep.js` still runs against this page unchanged — the frames keep `data-module`, `data-frame`
 * and `[data-frame-bg]`, and its `frames()` filters to the visible theme by zero width.
 */

export interface FrameMeta {
  /** Module id, e.g. `renalTubular`. */
  id: string;
  /** Frame index within the module's `diagram` array. */
  i: number;
  /** Stable key for localStorage and the export: `renalTubular` or `cardiacElectro-1`. */
  key: string;
  viewBox: [number, number, number, number];
  /** Rendered SVG per theme. */
  svg: { light: string; dark: string };
  /**
   * The module is styled on the web but NOT on the phone: it has a `Diagram.module.css` and no
   * ported `diagramClasses.ts`, so every `cls` from that sheet resolves to nothing natively and
   * the shape draws with default fill and no wash. That is a BUG, not a matter of taste, and it
   * is flagged separately so a reviewer does not spend judgement on a frame that is simply
   * missing its stylesheet.
   */
  unstyledOnNative: boolean;
}

const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function reviewPage(frames: FrameMeta[]): string {
  const cards = frames
    .map((f) => {
      const gap = f.unstyledOnNative
        ? '<span class="badge gap" title="Styled on the web, unstyled on the phone: has Diagram.module.css but no diagramClasses.ts">no native classes</span>'
        : '';
      return `<figure class="card" data-key="${esc(f.key)}"${f.unstyledOnNative ? ' data-gap="1"' : ''}>
  <figcaption>
    <span class="name">${esc(f.id)}${f.i ? ` [${f.i}]` : ''}</span>
    ${gap}
    <span class="vb">${f.viewBox.join(' ')}</span>
  </figcaption>
  <div class="shot">
    <div class="pane" data-theme="light">${f.svg.light}</div>
    <div class="pane" data-theme="dark" hidden>${f.svg.dark}</div>
  </div>
  <div class="verdict" role="group">
    <button data-v="keep">keep</button><button data-v="fix">fix</button><button data-v="redraw">redraw</button>
    <button class="png" title="Download this frame as a PNG to mark up">PNG</button>
  </div>
  <textarea class="note" rows="2" placeholder="What's wrong with it?"></textarea>
</figure>`;
    })
    .join('\n');

  return `<!doctype html><meta charset="utf-8"><title>Diagram review — ${frames.length} frames</title>
<style>
  :root { --ink:#0f172a; --dim:#475569; --line:#e2e8f0; --ground:#f1f5f9; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--ground); color:var(--ink); font:13px/1.45 -apple-system,system-ui,sans-serif; }
  header { position:sticky; top:0; z-index:5; display:flex; gap:14px; align-items:center; flex-wrap:wrap;
           padding:10px 16px; background:#fff; border-bottom:1px solid var(--line); }
  header b { font-size:13px; } header .sp { flex:1; }
  .seg { display:inline-flex; border:1px solid var(--line); border-radius:8px; overflow:hidden; }
  .seg button { border:0; background:#fff; padding:5px 10px; font:inherit; color:var(--dim); cursor:pointer; }
  .seg button[aria-pressed="true"] { background:var(--ink); color:#fff; }
  header > button { border:1px solid var(--line); background:#fff; border-radius:8px; padding:5px 10px; font:inherit; cursor:pointer; }
  #tally { color:var(--dim); font-variant-numeric:tabular-nums; }

  #grid { display:grid; gap:16px; padding:16px; grid-template-columns:repeat(auto-fill,minmax(var(--w,390px),1fr)); align-items:start; }
  .card { margin:0; background:#fff; border:1px solid var(--line); border-radius:12px; padding:8px; }
  .card[data-verdict="keep"]   { border-color:#16a34a; box-shadow:inset 3px 0 0 #16a34a; }
  .card[data-verdict="fix"]    { border-color:#d97706; box-shadow:inset 3px 0 0 #d97706; }
  .card[data-verdict="redraw"] { border-color:#dc2626; box-shadow:inset 3px 0 0 #dc2626; }
  figcaption { display:flex; gap:6px; align-items:center; margin-bottom:6px; }
  .name { font-weight:600; }
  .vb { margin-left:auto; color:#94a3b8; font-size:10px; font-variant-numeric:tabular-nums; }
  .badge { font-size:10px; padding:1px 6px; border-radius:99px; }
  .badge.gap { background:#fef3c7; color:#92400e; }
  .shot svg { display:block; width:100%; height:auto; border-radius:8px; }
  .verdict { display:flex; gap:4px; margin-top:8px; }
  .verdict button { flex:1; border:1px solid var(--line); background:#fff; border-radius:7px; padding:4px; font:inherit; color:var(--dim); cursor:pointer; }
  .verdict button[aria-pressed="true"] { background:var(--ink); color:#fff; border-color:var(--ink); }
  .verdict .png { flex:0 0 auto; padding:4px 8px; }
  .note { width:100%; margin-top:6px; border:1px solid var(--line); border-radius:7px; padding:5px 7px; font:inherit; resize:vertical; }
  .note:placeholder-shown { background:#fcfcfd; }
  [hidden] { display:none !important; }
</style>
<header>
  <b>Diagram review</b>
  <span class="seg" id="theme"><button data-t="light" aria-pressed="true">light</button><button data-t="dark">dark</button></span>
  <span class="seg" id="width"><button data-w="390" aria-pressed="true">phone 390</button><button data-w="560">560</button><button data-w="820">wide</button></span>
  <span class="seg" id="filter"><button data-f="all" aria-pressed="true">all</button><button data-f="todo">unreviewed</button><button data-f="fix">fix</button><button data-f="redraw">redraw</button><button data-f="gap">no native classes</button></span>
  <span class="sp"></span>
  <span id="tally"></span>
  <button id="export">Export review.json</button>
  <button id="clear">Clear</button>
</header>
<main id="grid">
${cards}
</main>
<script>
(() => {
  const KEY = 'diagram-review';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
  let state = load();
  const cards = [...document.querySelectorAll('.card')];

  function paint(card) {
    const rec = state[card.dataset.key] || {};
    if (rec.verdict) card.dataset.verdict = rec.verdict; else delete card.dataset.verdict;
    for (const b of card.querySelectorAll('.verdict button[data-v]'))
      b.setAttribute('aria-pressed', String(b.dataset.v === rec.verdict));
    card.querySelector('.note').value = rec.note || '';
  }
  function tally() {
    const n = (v) => cards.filter((c) => (state[c.dataset.key] || {}).verdict === v).length;
    const done = cards.filter((c) => (state[c.dataset.key] || {}).verdict).length;
    document.getElementById('tally').textContent =
      done + '/' + cards.length + ' reviewed · ' + n('keep') + ' keep · ' + n('fix') + ' fix · ' + n('redraw') + ' redraw';
  }
  function applyFilter(f) {
    for (const c of cards) {
      const v = (state[c.dataset.key] || {}).verdict;
      c.hidden = f === 'all' ? false
        : f === 'todo' ? !!v
        : f === 'gap' ? c.dataset.gap !== '1'
        : v !== f;
    }
  }

  document.getElementById('grid').addEventListener('click', (e) => {
    const card = e.target.closest('.card'); if (!card) return;
    const vb = e.target.closest('button[data-v]');
    if (vb) {
      const rec = state[card.dataset.key] || (state[card.dataset.key] = {});
      rec.verdict = rec.verdict === vb.dataset.v ? undefined : vb.dataset.v;
      save(state); paint(card); tally(); return;
    }
    if (e.target.closest('.png')) png(card);
  });
  document.getElementById('grid').addEventListener('input', (e) => {
    if (!e.target.classList.contains('note')) return;
    const card = e.target.closest('.card');
    (state[card.dataset.key] || (state[card.dataset.key] = {})).note = e.target.value;
    save(state);
  });

  function seg(id, fn) {
    document.getElementById(id).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      for (const s of b.parentElement.children) s.setAttribute('aria-pressed', String(s === b));
      fn(b);
    });
  }
  seg('theme', (b) => {
    for (const p of document.querySelectorAll('.pane')) p.hidden = p.dataset.theme !== b.dataset.t;
  });
  seg('width', (b) => document.getElementById('grid').style.setProperty('--w', b.dataset.w + 'px'));
  seg('filter', (b) => applyFilter(b.dataset.f));

  /** The visible frame, rasterised at 3x so a label is legible when it is scribbled on. */
  function png(card) {
    const svg = card.querySelector('.pane:not([hidden]) svg');
    const box = svg.getBoundingClientRect();
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.round(box.width * 3); c.height = Math.round(box.height * 3);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement('a');
      a.download = card.dataset.key + '.png';
      a.href = c.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  }

  document.getElementById('export').addEventListener('click', () => {
    const rows = cards
      .map((c) => ({ frame: c.dataset.key, unstyledOnNative: c.dataset.gap === '1', ...(state[c.dataset.key] || {}) }))
      .filter((r) => r.verdict || r.note);
    const blob = new Blob([JSON.stringify({ reviewed: new Date().toISOString(), frames: rows }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.download = 'review.json'; a.href = URL.createObjectURL(blob); a.click();
  });
  document.getElementById('clear').addEventListener('click', () => {
    if (!confirm('Discard every verdict and note on this page?')) return;
    state = {}; save(state); cards.forEach(paint); tally();
  });

  cards.forEach(paint); tally();
})();
</script>`;
}

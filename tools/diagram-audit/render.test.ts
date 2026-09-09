// @vitest-environment node
/**
 * Renders every module's diagram to a standalone SVG the way the PHONE draws it, so the result can
 * be looked at and measured without an Expo build.
 *
 * CLAUDE.md already describes the collision sweep — measure every `<text>` with
 * `getBoundingClientRect`, never `getBBox` — and this is the missing half of it: something to
 * point the sweep AT. Booting the app and walking to each of forty-seven modules is the reason
 * that sweep was run once and not since.
 *
 * It reproduces `physiology-native`'s renderer rather than the web's: the same shared-class table,
 * the same per-module tables read out of the native repo, the same rule about which of a node's
 * colour and its class wins. That is deliberate — the two renderers had drifted, and the drift
 * only shows on the platform without a cascade. A frame that reads correctly here reads correctly
 * on a phone.
 *
 *   npx vitest run tools/diagram-audit          # writes out/index.html and one SVG per frame
 *
 * Then open `out/index.html` in a browser and run the sweep in `sweep.js` against it. It reports
 * text that leaves the frame and text that lands on other text, at whatever width the page is
 * rendered — run it at the phone's ~390px as well as at desktop width, because a pair of labels
 * twelve units apart collides at one size and not the other.
 *
 * What it does NOT see: text sitting on a filled shape. Both the worst legibility faults found so
 * far — a unit's name across a saturated disc, a whole medullary band drawn opaque over four
 * labels — were invisible to a text-versus-text sweep and obvious in the picture. Look at the
 * page as well as measuring it.
 */
import { describe, it } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { TOKENS } from '@/theme/tokens.generated';


const NATIVE = '/Users/natbailie/Developer/physiology-native/src/engine';
/** The native app's hand-ported per-module class tables, read as text — the web repo cannot
 *  import across projects, and these are plain object literals. */
function nativeClasses(id: string): any {
  const f = `${NATIVE}/${id}/diagramClasses.ts`;
  if (!existsSync(f)) return undefined;
  const src = readFileSync(f, 'utf8');
  const lit = src.slice(src.indexOf('= {', src.indexOf('diagramClasses')) + 2);
  return new Function('return ' + lit.slice(0, lit.lastIndexOf('};') + 1))();
}

/** Written beside this file, and gitignored. */
const OUT = new URL('./out', import.meta.url).pathname;

const SHARED: Record<string, any> = {
  anatomy: { fill: 'text-dim', fontSize: 11, fontWeight: '500' },
  anatomyStrong: { fill: 'text', fontSize: 12, fontWeight: '600' },
  axis: { stroke: 'panel-border', strokeWidth: 1 },
  tickLabel: { fill: 'text-faint', fontSize: 9 },
  label: { fill: 'text-dim', fontSize: 11 },
  caption: { fill: 'text-faint', fontSize: 11 },
  organLabel: { fill: 'text', fontSize: 11, fontWeight: '600' },
  pathLabel: { fill: 'text-dim', fontSize: 9 },
  valueLabel: { fill: 'text', fontSize: 9 },
  alarm: { fill: 'danger', fontSize: 12 },
  verdict: { fill: 'text', fontSize: 9, fontWeight: '600' },
  leader: { stroke: 'text-faint', strokeWidth: 1, fill: 'none' },
  verdictMixed: { fill: 'danger', fontSize: 9, fontWeight: '600' },
  plotGrid: { stroke: 'grid-line', strokeWidth: 1 },
  plotAxis: { stroke: 'text-faint', strokeWidth: 1.2 },
  axisLabel: { fill: 'text-faint', fontSize: 8 },
  isopleth: { stroke: 'co2', strokeWidth: 1, dash: '3,4', opacity: 0.5 },
  isoplethLabel: { fill: 'co2', fontSize: 7, opacity: 0.85 },
  bufferLine: { stroke: 'bicarb', strokeWidth: 1.6, opacity: 0.75 },
  normalPoint: { fill: 'none', stroke: 'text-faint', strokeWidth: 1.2, dash: '2,2' },
  livePoint: { fill: 'ph', stroke: 'panel', strokeWidth: 1.5 },
  trail: { stroke: 'ph', strokeWidth: 1.6, fill: 'none', opacity: 0.45 },
  baselineTrail: { stroke: 'text-faint', strokeWidth: 1.4, fill: 'none', dash: '3,3', opacity: 0.55 },
  regionLabel: { fill: 'text-faint', fontSize: 7, opacity: 0.85 },
};

const col = (t?: string) => (t === undefined ? undefined : t === 'none' ? 'none' : (TOKENS[theme][`--${t}`] ?? '#000000'));

const theme: 'light' | 'dark' = 'light';

/** `--wash-*` from index.css, per theme — the same table `diagramClassTypes.ts` holds natively. */
const WASH: Record<string, Record<string, number>> = {
  light: { faint: 0.14, soft: 0.22, base: 0.32, strong: 0.48 },
  dark: { faint: 0.18, soft: 0.26, base: 0.36, strong: 0.52 },
};

/** `resolveClsValue` from the native renderer, transcribed. Getting this wrong is not a cosmetic
 *  difference in the audit: an unhandled `{ wash }` renders a washed shape SOLID, and the
 *  contrast sweep then reports every label on it as unreadable when the app is fine. */
function resolveVal(v: any, vars: any): number | undefined {
  if (v === undefined) return undefined;
  if (typeof v === 'number') return v;
  if (typeof v !== 'object') return undefined;
  if (v.wash !== undefined) return WASH[theme][v.wash];
  if (v.var === undefined) return undefined;
  const raw = vars?.[v.var];
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number.parseFloat(raw) : NaN;
  const driver = Number.isFinite(n) ? n : 0;
  if (v.scaleWash !== undefined) return driver * WASH[theme][v.scaleWash];
  return (v.base ?? 0) + driver * (v.scale ?? 1);
}
function cls(name: string | undefined, classes: any, vars: any) {
  if (!name) return {};
  const spec = classes?.[name] ?? SHARED[name];
  if (!spec) return {};
  return {
    stroke: col(spec.stroke), fill: spec.fill === 'none' ? 'none' : col(spec.fill),
    fillOpacity: resolveVal(spec.fillOpacity, vars), strokeWidth: resolveVal(spec.strokeWidth, vars),
    opacity: resolveVal(spec.opacity, vars), dash: spec.dash, linecap: spec.linecap,
    fontSize: spec.fontSize, fontWeight: spec.fontWeight, anchor: spec.anchor,
  } as any;
}
const at = (k: string, v: any) => (v === undefined || v === null ? '' : ` ${k}="${v}"`);
const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function node(n: any, classes: any): string {
  switch (n.type) {
    case 'group':
      return `<g${at('transform', n.transform)}>${n.children.map((c: any) => node(c, classes)).join('')}</g>`;
    case 'path': {
      const s = cls(n.cls, classes, n.styleVars);
      const stroke = (n.colorToken ? col(n.colorToken) : undefined) ?? s.stroke;
      const fill = n.fillGradientId ? `url(#${n.fillGradientId})` : n.fill === 'none' ? 'none' : n.fill ? col(n.fill) : (s.fill ?? 'none');
      return `<path${at('d', n.d)}${at('stroke', stroke)}${at('fill', fill)}${at('fill-opacity', s.fillOpacity ?? n.fillOpacity)}${at('stroke-width', stroke ? (s.strokeWidth ?? n.strokeWidth ?? 1) : undefined)}${at('stroke-opacity', n.strokeOpacity)}${at('stroke-linecap', s.linecap ?? n.strokeLinecap ?? 'round')}${at('stroke-linejoin', n.strokeLinejoin ?? 'round')}${at('stroke-dasharray', s.dash)}${at('opacity', s.opacity ?? n.opacity)}${at('marker-end', n.markerEnd ? `url(#${n.markerEnd})` : undefined)}${at('clip-path', n.clipPathId ? `url(#${n.clipPathId})` : undefined)}/>`;
    }
    case 'circle': {
      const s = cls(n.cls, classes, n.styleVars);
      const fill = n.fillGradientId ? `url(#${n.fillGradientId})` : n.fill === 'none' ? 'none' : n.fill ? col(n.fill) : (s.fill ?? 'none');
      return `<circle${at('cx', n.cx)}${at('cy', n.cy)}${at('r', n.r)}${at('fill', fill)}${at('fill-opacity', s.fillOpacity ?? n.fillOpacity)}${at('stroke', n.stroke ? col(n.stroke) : s.stroke)}${at('stroke-width', n.strokeWidth ?? s.strokeWidth)}${at('stroke-dasharray', s.dash)}${at('opacity', s.opacity ?? n.opacity)}/>`;
    }
    case 'rect': {
      const s = cls(n.cls, classes, n.styleVars);
      const fill = n.fillGradientId ? `url(#${n.fillGradientId})` : n.fill === 'none' ? 'none' : n.fill ? col(n.fill) : (s.fill ?? 'none');
      return `<rect${at('x', n.x)}${at('y', n.y)}${at('width', n.width)}${at('height', n.height)}${at('fill', fill)}${at('fill-opacity', s.fillOpacity ?? n.fillOpacity)}${at('stroke', n.stroke ? col(n.stroke) : s.stroke)}${at('stroke-width', n.strokeWidth ?? s.strokeWidth)}${at('stroke-dasharray', s.dash)}${at('opacity', s.opacity ?? n.opacity)}/>`;
    }
    case 'line': {
      const s = cls(n.cls, classes, undefined);
      return `<line${at('x1', n.x1)}${at('y1', n.y1)}${at('x2', n.x2)}${at('y2', n.y2)}${at('stroke', n.colorToken ? col(n.colorToken) : s.stroke)}${at('stroke-width', s.strokeWidth ?? 1)}${at('stroke-dasharray', s.dash)}${at('opacity', s.opacity)}/>`;
    }
    case 'text': {
      const s = cls(n.cls, classes, n.styleVars);
      // Node colour first, class second — the precedence both renderers now use.
      const fill = (n.colorToken ? col(n.colorToken) : undefined) ?? s.fill ?? col('text');
      const anchor = n.anchor === 'middle' ? 'middle' : n.anchor === 'end' ? 'end' : (s.anchor ?? 'start');
      const body = `${at('x', n.x)}${at('y', n.y)}${at('font-size', s.fontSize ?? 12)}${at('font-weight', s.fontWeight)}${at('text-anchor', anchor)}${at('opacity', s.opacity ?? n.opacity)}`;
      const label = `<text${body}${at('fill', fill)} data-cls="${n.cls ?? ''}"${n.halo ? ' data-halo="1"' : ''}>${esc(n.text)}</text>`;
      if (!n.halo) return label;
      // The halo pass, as both renderers draw it: the same text stroked in the background colour.
      const halo = col(n.halo);
      return `<g><text${body}${at('fill', halo)}${at('stroke', halo)}${at('stroke-width', n.haloWidth ?? 3)} stroke-linejoin="round" data-halo-pass="1">${esc(n.text)}</text>${label}</g>`;
    }
    case 'vessel':
      return `<path${at('d', n.path)}${at('stroke', col(n.colorToken))}${at('stroke-width', n.width ?? 2)} fill="none" stroke-linecap="round" opacity="0.6"/>`;
    case 'axis':
      return `<g><path${at('d', n.path)}${at('stroke', col(n.colorToken))} stroke-width="1.5" fill="none"${at('stroke-dasharray', n.inhibitory ? '4,4' : undefined)} stroke-linecap="round"${at('opacity', 0.5 + n.activation * 0.5)}${at('marker-end', `url(#${n.markerId})`)}/><text${at('x', n.labelX)}${at('y', n.labelY)}${at('fill', col(n.colorToken))} font-size="10" text-anchor="middle" data-cls="axisLabel">${esc(n.label)}</text></g>`;
    default:
      return '';
  }
}

function defs(list: any[]): string {
  return (list ?? []).map((d) => {
    if (d.type === 'marker') return `<marker id="${d.id}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="${col(d.colorToken)}"/></marker>`;
    if (d.type === 'clipPath') return `<clipPath id="${d.id}">${d.children.map((p: any) => `<path d="${p.d}"/>`).join('')}</clipPath>`;
    const stops = (d.stops ?? []).map((s: any) => `<stop offset="${s.offset}" stop-color="${col(s.colorToken)}"${at('stop-opacity', s.opacity ?? 1)}/>`).join('');
    if (d.type === 'linearGradient') return `<linearGradient id="${d.id}"${at('gradientUnits', d.units)}${at('x1', d.x1)}${at('y1', d.y1)}${at('x2', d.x2)}${at('y2', d.y2)}>${stops}</linearGradient>`;
    if (d.type === 'radialGradient') return `<radialGradient id="${d.id}"${at('gradientUnits', d.units)}${at('cx', d.cx)}${at('cy', d.cy)}${at('r', d.r)}${at('fx', d.fx)}${at('fy', d.fy)}>${stops}</radialGradient>`;
    return '';
  }).join('');
}

const configModules = import.meta.glob<Record<string, unknown>>('../../src/modules/*/engine/loopConfig.ts', { eager: true });
const presetModules = import.meta.glob<Record<string, unknown>>('../../src/modules/*/engine/presets.ts', { eager: true });
const presentationModules = import.meta.glob<Record<string, unknown>>('../../src/modules/*/presentation.ts', { eager: true });
const idOf = (p: string) => p.match(/modules\/([^/]+)\//)![1]!;
function find<T>(ex: Record<string, unknown>, ok: (v: unknown) => boolean): T | null {
  for (const v of Object.values(ex)) if (ok(v)) return v as T;
  return null;
}

describe('diagram audit', () => {
  it('renders every module frame to out/', () => {
    mkdirSync(OUT, { recursive: true });
    const cards: string[] = [];
    for (const [path, ex] of Object.entries(configModules)) {
      const id = idOf(path);
      const pres = presentationModules[`../../src/modules/${id}/presentation.ts`];
      if (!pres) continue;
      const build = find<any>(pres, (v: any) => typeof v === 'function' && /^build/.test(v.name) && /[Pp]resentation$/.test(v.name));
      if (!build) continue;
      const config = find<any>(ex, (v: any) => !!v && typeof v === 'object' && 'step' in v && 'computeDerived' in v)!;
      const defaults = find<any>(Object.fromEntries(Object.entries(presetModules[`../../src/modules/${id}/engine/presets.ts`]!).filter(([n]) => /^DEFAULT_/.test(n))), (v: any) => !!v && typeof v === 'object' && !Array.isArray(v))!;
      let state = config.createInitialState();
      const secs = config.settleSeconds ?? 30;
      for (let t = 0; t < secs / config.maxDtSeconds && t < 20000; t++) state = config.step(state, defaults, config.maxDtSeconds).state;
      const derived = config.computeDerived(state, defaults);
      const p = build({ state, derived, inputs: defaults, history: [], baselineHistory: null });
      p.diagram.forEach((frame: any, i: number) => {
        const [vx, vy, vw, vh] = frame.viewBox;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" data-module="${id}" data-frame="${i}" style="width:100%;aspect-ratio:${vw}/${vh};background:${col('bg')};font-family:-apple-system,system-ui,sans-serif"><defs>${defs(frame.defs)}</defs><rect data-frame-bg="1" x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="none" pointer-events="none"/>${frame.children.map((c: any) => node(c, nativeClasses(id))).join('')}</svg>`;
        writeFileSync(`${OUT}/${id}${i ? `-${i}` : ''}.svg`, svg);
        cards.push(`<figure><figcaption>${id}${i ? ` [${i}]` : ''} — viewBox ${vx} ${vy} ${vw} ${vh}</figcaption>${svg}</figure>`);
      });
    }
    writeFileSync(`${OUT}/index.html`, `<!doctype html><meta charset="utf-8"><style>body{margin:0;padding:16px;background:#f8fafc;font:13px system-ui}figure{margin:0 0 28px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:8px;max-width:900px}figcaption{font-weight:600;margin-bottom:6px;color:#334155}</style>${cards.join('')}`);
    console.log('wrote', cards.length, 'frames');
  });
});

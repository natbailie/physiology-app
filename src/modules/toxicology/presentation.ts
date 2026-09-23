import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
} from '@/shared/presentation/types';
import type {
  ToxicologyDerived,
  ToxicologyHistoryPoint,
  ToxicologyInputs,
  ToxicologyInternalState,
} from './engine/types';
import { TOXICOLOGY } from './engine/constants';

type Ctx = PresentationContext<ToxicologyInternalState, ToxicologyDerived, ToxicologyInputs, ToxicologyHistoryPoint>;

/* Graphic constants shared by both frames. */
const W = 460;
const H = 250;

/** Horizontal position of an hour along the 0-24h axis. */
const xOf = (hours: number): number => 44 + Math.min(Math.max(hours, 0), 24) * 15.5;

/** Vertical position of a plasma value on the 0-240 mg/L axis. */
const yOf = (mgL: number): number => 216 - Math.min(Math.max(mgL, 0), 240) * (186 / 240);

function pointScalar(d: ToxicologyDerived): number {
  return yOf(d.plasmaMgL);
}

/** The nomogram: plasma point against the Rumack-Matthew line, with the first eight hours
 * shaded as the NAC-window. */
function nomogramFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;

  const linePoints: string[] = [];
  for (let h = 0; h <= 24; h += 1) {
    // Recompute the treatment line the engine uses so the picture and the numbers agree.
    const value = TOXICOLOGY.NOMOGRAM_LINE_4H_MG_PER_L * Math.pow(
      TOXICOLOGY.NOMOGRAM_LINE_24H_MG_PER_L / TOXICOLOGY.NOMOGRAM_LINE_4H_MG_PER_L,
      (h - 4) / 20,
    );
    linePoints.push(`${xOf(h).toFixed(1)},${yOf(value).toFixed(1)}`);
  }

  const aboveLine = derived.nomogramRatio > 1;
  const pointToken = aboveLine ? 'danger' : 'glucose';

  return {
    type: 'frame',
    key: 'toxicology-nomogram',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Circulating paracetamol plotted against the Rumack-Matthew treatment line, with the first eight hours shaded as the NAC window',
    children: [
      { type: 'text', x: W / 2, y: 26, text: derived.state, cls: 'verdict', anchor: 'middle', colorToken: pointToken },
      { type: 'text', x: W / 2, y: 42, text: 'nomogram verdict', cls: 'caption', anchor: 'middle' },

      // The eight-hour NAC window, shaded across the whole plot.
      { type: 'rect', x: xOf(0), y: 30, width: xOf(8) - xOf(0), height: 186, fill: 'insulin', fillOpacity: 0.12 },
      { type: 'text', x: xOf(4), y: 46, text: 'NAC window', cls: 'caption', anchor: 'middle', colorToken: 'insulin' },

      // The treatment line itself.
      { type: 'path', d: `M ${linePoints.join(' L ')}`, colorToken: 'vq', fill: 'none', strokeWidth: 2 },
      /* Haloed rather than moved: it names the line it is written along, which is the one case
       * CLAUDE.md says to keep a label on the thing and stroke the background under it instead. */
      { type: 'text', x: xOf(24), y: yOf(15) + 4, text: 'treatment line', cls: 'caption', anchor: 'end', colorToken: 'vq', halo: 'bg' },

      // The 100 mg/L at 4 h anchor the learner is examined on.
      { type: 'line', x1: xOf(4), y1: yOf(100), x2: xOf(24), y2: yOf(100), cls: 'axis' },
      { type: 'text', x: xOf(24), y: yOf(100) - 5, text: '100 mg/L @ 4 h', cls: 'tickLabel', anchor: 'end' },

      // The patient's plasma right now, with the number it reads.
      { type: 'circle', cx: xOf(derived.hoursSinceIngestion), cy: pointScalar(derived), r: 6, fill: pointToken, stroke: 'panel', strokeWidth: 2 },
      { type: 'text', x: Math.min(xOf(derived.hoursSinceIngestion) + 10, W - 4), y: pointScalar(derived) - 8, text: `${derived.plasmaMgL.toFixed(0)} mg/L`, cls: 'valueLabel', anchor: 'start', colorToken: pointToken, halo: 'panel' },

      // Axes.
      { type: 'text', x: xOf(0), y: 236, text: '0', cls: 'tickLabel' },
      { type: 'text', x: xOf(8), y: 236, text: '8 h', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: xOf(16), y: 236, text: '16 h', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: xOf(24), y: 236, text: '24 h', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: 6, y: yOf(0) + 3, text: '0', cls: 'tickLabel' },
      { type: 'text', x: 6, y: yOf(120), text: '120', cls: 'tickLabel' },
      { type: 'text', x: W / 2, y: H - 2, text: 'hours since ingestion →   plasma paracetamol (mg/L) ↑', cls: 'caption', anchor: 'middle' },
    ],
  };
}

/** Single-tile status frame: the NAC countdown and the risk meter side by side. */
function treatmentFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  const now = derived.hoursSinceIngestion;

  const windowWidth = 250;
  const windowX = 30;
  const started = derived.nacStarted;

  return {
    type: 'frame',
    key: 'toxicology-treatment',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The eight-hour NAC window, the moment treatment started, and the hepatotoxicity risk',
    children: [
      { type: 'text', x: 30, y: 30, text: 'the 8-hour NAC window', cls: 'label' },

      // The window: 0-8 h protected, shaded; 8-24 h unprotected.
      { type: 'rect', x: windowX, y: 52, width: windowWidth, height: 18, fill: 'panel', fillOpacity: 0.6 },
      { type: 'rect', x: windowX, y: 52, width: (8 / 24) * windowWidth, height: 18, fill: 'insulin', fillOpacity: 0.3 },
      { type: 'text', x: windowX, y: 92, text: 'window opens', cls: 'tickLabel' },
      { type: 'text', x: windowX + (8 / 24) * windowWidth, y: 92, text: '8 h → window closes', cls: 'tickLabel' },
      { type: 'text', x: windowX + windowWidth, y: 92, text: '24 h', cls: 'tickLabel', anchor: 'end' },

      // Where the clock now stands on the window.
      { type: 'circle', cx: windowX + (8 / 24) * windowWidth, cy: 70, r: 3, fill: 'insulin' },
      /* The NAC marker sits on its own row at 114, not at 96.
       * Its label tracks the hour treatment started, so it slides along the same span as the three
       * window labels above it — and eight units of clearance from their baseline is the collision
       * CLAUDE.md warns a sweep will find and the eye reads as one phrase. */
      { type: 'circle', cx: windowX + (now / 24) * windowWidth, cy: 114, r: 4, fill: started ? 'liver' : 'panel' },
      { type: 'text', x: windowX + 8 + (now / 24) * windowWidth, y: 118, text: started ? `NAC on since h ${now.toFixed(0)}` : 'NAC not started', cls: 'tickLabel' },

      // How much of the window is still open.
      { type: 'text', x: windowX, y: 142, text: `window still open: ${derived.antidoteWindowHours.toFixed(0)} h`, cls: 'caption' },

      // The risk meter.
      { type: 'text', x: 360, y: 30, text: 'hepatotoxicity risk', cls: 'label', anchor: 'middle' },
      { type: 'rect', x: 348, y: 52, width: 24, height: 140, fill: 'panel', fillOpacity: 0.6 },
      { type: 'rect', x: 348, y: 192 - derived.hepatotoxicityRisk * 140, width: 24, height: derived.hepatotoxicityRisk * 140, fill: 'danger' },
      { type: 'text', x: 360, y: 212, text: `${(derived.hepatotoxicityRisk * 100).toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle', colorToken: 'danger' },
      { type: 'text', x: 360, y: 240, text: 'risk given NAC', cls: 'caption', anchor: 'middle' },
    ],
  };
}

export function buildToxicologyPresentation(ctx: Ctx): ModulePresentation<ToxicologyInternalState, ToxicologyDerived, ToxicologyInputs, ToxicologyHistoryPoint> {
  const ratioLabel = (d: ToxicologyDerived): string =>
    d.nomogramRatio > 1 ? 'above the treatment line' : d.nomogramRatio > 0.8 ? 'near the treatment line' : 'below the treatment line';

  return {
    diagram: [nomogramFrame(ctx), treatmentFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Dose ingested', key: 'doseMgKg', min: 0, max: 500, step: 5, unit: ' mg/kg' },
      { kind: 'slider', label: 'Hours since ingestion', key: 'hoursSinceIngestion', min: 0, max: 24, step: 0.5, unit: ' h' },
      { kind: 'slider', label: 'Activated charcoal', key: 'charcoalDosePct', min: 0, max: 50, step: 5, unit: '%' },
      { kind: 'slider', label: 'When NAC is started', key: 'nacStartHours', min: 0, max: 24, step: 0.5, unit: ' h' },
    ],
    readouts: [
      {
        label: 'Plasma paracetamol',
        value: (c) => c.derived.plasmaMgL.toFixed(0),
        unit: 'mg/L',
        colorToken: 'danger',
        secondary: (c) => ratioLabel(c.derived),
      },
      {
        label: 'Nomogram line',
        value: (c) => c.derived.nomogramLineMgL.toFixed(0),
        unit: 'mg/L',
        colorToken: 'vq',
        secondary: (c) => `at ${c.derived.hoursSinceIngestion.toFixed(1)} h`,
      },
      {
        label: 'Absorbed dose',
        value: (c) => c.derived.absorbedDoseMgPerKg.toFixed(0),
        unit: 'mg/kg',
        colorToken: 'glucose',
        secondary: (c) => (c.derived.absorbedDoseMgPerKg >= TOXICOLOGY.TOXIC_DOSE_MG_PER_KG ? 'at or over the 75 mg/kg threshold' : 'below the threshold'),
      },
      {
        label: 'Hepatotoxicity risk',
        value: (c) => (c.derived.hepatotoxicityRisk * 100).toFixed(0),
        unit: '%',
        colorToken: 'danger',
      },
      {
        label: 'Antidote window',
        value: (c) => c.derived.antidoteWindowHours.toFixed(1),
        unit: ' h',
        colorToken: 'insulin',
        secondary: (c) => (c.derived.antidoteWindowHours > 0 ? 'still open' : 'closed'),
      },
      {
        label: 'Charcoal uptake',
        value: (c) => c.derived.charcoalReductionPct.toFixed(0),
        unit: '%',
        colorToken: 'liver',
        secondary: (c) => (c.derived.charcoalReductionPct > 0 ? 'load sequestered' : 'none given'),
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Plasma paracetamol',
        unit: 'mg/L',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 240,
        data: (points) => points.map((p) => p.plasma),
      },
      {
        kind: 'sparkline',
        label: 'Hepatotoxicity risk',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.risk * 100),
      },
    ],
  };
}
import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
  SceneNode,
} from '@/shared/presentation/types';
import type {
  KrebsCycleDerived,
  KrebsCycleHistoryPoint,
  KrebsCycleInputs,
  KrebsCycleInternalState,
} from './engine/types';

type Ctx = PresentationContext<KrebsCycleInternalState, KrebsCycleDerived, KrebsCycleInputs, KrebsCycleHistoryPoint>;

const W = 460;
const H = 260;

const INTERMEDIATES = [
  'citrate',
  'isocitrate',
  '\u03b1KG',
  'succinyl-CoA',
  'succinate',
  'fumarate',
  'malate',
  'OAA',
];

const STEP_GAINS = ['—', 'NADH+CO2', 'NADH+CO2', 'GTP', 'FADH2', '—', '—', '—'];

/**
 * The eight-step circle with its doors drawn to scale: pyruvate through the PDH gate,
 * fatty acids through beta-oxidation, oxygen as the electron sink, and the lactate spillway
 * that opens whenever pyruvate is denied entry. Arrow calibre carries flux, so every slider
 * moves the picture as well as the numbers.
 */
function cycleFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;

  const cx = 185;
  const cy = 138;
  const r = 72;
  const pdhWidth = Math.max(1, Math.min(12, derived.pdhFlux * 5));
  const fatWidth = Math.max(1, Math.min(12, derived.fatFlux * 5));
  const lactateWidth = Math.max(1, Math.min(14, derived.lactateMmolL * 1.6));
  const fluxOpacity = Math.max(0.15, Math.min(1, derived.tcaFlux));

  const nodes: SceneNode[] = [];
  INTERMEDIATES.forEach((name, i) => {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    nodes.push({
      type: 'circle', cx: x, cy: y, r: 24,
      fill: 'exercise', fillOpacity: 0.14 * fluxOpacity + 0.05, stroke: 'exercise', strokeWidth: 1.2,
      opacity: 0.45 + 0.55 * fluxOpacity,
    });
    nodes.push({ type: 'text', x, y: y + 1, text: name, cls: 'tickLabel', anchor: 'middle', opacity: 0.45 + 0.55 * fluxOpacity });
    const gain = STEP_GAINS[i]!;
    if (gain !== '—') {
      const gx = cx + (r + 26) * Math.cos(angle);
      const gy = cy + (r + 26) * Math.sin(angle);
      nodes.push({ type: 'text', x: gx, y: gy, text: gain, cls: 'caption', anchor: 'middle', colorToken: 'o2' });
    }
  });

  return {
    type: 'frame',
    key: 'krebs-cycle',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The Krebs cycle: eight intermediates, pyruvate and fatty-acid entries, oxygen sink and lactate spillway',
    children: [
      // Pyruvate entry through the PDH gate.
      { type: 'rect', x: 8, y: 60 - pdhWidth / 2, width: 52, height: pdhWidth, fill: 'glucose' },
      { type: 'text', x: 34, y: 46, text: 'pyruvate', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: 34, y: 84, text: `PDH ${derived.pdhFlux.toFixed(2)}`, cls: 'caption', anchor: 'middle', colorToken: 'glucose' },
      // Fatty-acid entry through beta-oxidation.
      { type: 'rect', x: 8, y: 200 - fatWidth / 2, width: 52, height: fatWidth, fill: 'bile' },
      { type: 'text', x: 34, y: 186, text: 'fatty acids', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: 34, y: 224, text: `${derived.fatFlux.toFixed(2)}`, cls: 'caption', anchor: 'middle', colorToken: 'bile' },
      ...nodes,
      // Oxygen sink and the reducing equivalents leaving for the chain.
      { type: 'text', x: 372, y: 52, text: `O2 ${derived.o2mLPerMin.toFixed(0)} mL/min`, cls: 'valueLabel', anchor: 'middle', colorToken: 'o2' },
      { type: 'text', x: 372, y: 72, text: 'electron sink', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 372, y: 108, text: `NADH ${derived.nadhRate.toFixed(1)}`, cls: 'tickLabel', anchor: 'middle', colorToken: 'o2' },
      { type: 'text', x: 372, y: 126, text: `FADH2 ${derived.fadh2Rate.toFixed(1)}`, cls: 'tickLabel', anchor: 'middle', colorToken: 'vq' },
      { type: 'text', x: 372, y: 144, text: `ATP ${derived.atpYield.toFixed(1)}`, cls: 'valueLabel', anchor: 'middle', colorToken: 'exercise' },
      { type: 'text', x: 372, y: 162, text: `CO2 ${derived.co2mLPerMin.toFixed(0)} mL/min`, cls: 'tickLabel', anchor: 'middle', colorToken: 'co2' },
      { type: 'text', x: 372, y: 180, text: `RQ ${derived.rqProxy.toFixed(2)}`, cls: 'tickLabel', anchor: 'middle', colorToken: 'vq' },
      // Lactate spillway.
      { type: 'rect', x: 300, y: 208, width: Math.min(120, 20 + derived.lactateMmolL * 12), height: lactateWidth, fill: 'cortisol' },
      { type: 'text', x: 360, y: 202, text: `lactate ${derived.lactateMmolL.toFixed(1)} mmol/L`, cls: 'valueLabel', anchor: 'middle', colorToken: 'cortisol' },
      { type: 'text', x: W / 2, y: 250, text: derived.krebsState, cls: 'verdict', anchor: 'middle', colorToken: 'exercise' },
    ],
  };
}

function meter(
  x: number,
  label: string,
  unit: string,
  value: number,
  domainMax: number,
  colorToken: string,
): FrameNode['children'][number][] {
  const trackTop = 78;
  const trackHeight = 108;
  const fraction = Math.max(0, Math.min(1, value / domainMax));
  const fillHeight = Math.max(0, fraction * trackHeight);
  return [
    { type: 'text', x: x + 50, y: 52, text: label, cls: 'label', anchor: 'middle' },
    { type: 'rect', x: x + 38, y: trackTop, width: 24, height: trackHeight, fill: 'panel', opacity: 0.6 },
    { type: 'rect', x: x + 38, y: trackTop + trackHeight - fillHeight, width: 24, height: fillHeight, fill: colorToken },
    { type: 'text', x: x + 50, y: trackTop + trackHeight + 22, text: `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`, cls: 'valueLabel', anchor: 'middle', colorToken },
  ];
}

function meterFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  return {
    type: 'frame',
    key: 'krebs-meters',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Cycle flux, ATP yield, lactate and respiratory quotient, each as a live meter',
    children: [
      ...meter(0, 'cycle flux', 'turns', derived.tcaFlux, 3, 'exercise'),
      ...meter(115, 'ATP yield', 'rate', derived.atpYield, 35, 'exercise'),
      ...meter(230, 'lactate', 'mmol/L', derived.lactateMmolL, 10, 'cortisol'),
      ...meter(345, 'RQ', 'ratio', derived.rqProxy, 1.05, 'vq'),
      { type: 'text', x: W / 2, y: H - 18, text: 'demand pulls flux while oxygen and cofactors permit', cls: 'caption', anchor: 'middle' },
    ],
  };
}

export function buildKrebsCyclePresentation(ctx: Ctx): ModulePresentation<KrebsCycleInternalState, KrebsCycleDerived, KrebsCycleInputs, KrebsCycleHistoryPoint> {
  return {
    diagram: [cycleFrame(ctx), meterFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Carbohydrate supply', key: 'glucoseSupplyPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Fatty-acid supply', key: 'fattyAcidSupplyPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Oxygen available', key: 'oxygenPct', min: 5, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'ATP demand', key: 'atpDemandMet', min: 1, max: 8, step: 0.5, unit: ' MET' },
      { kind: 'slider', label: 'Thiamine status', key: 'thiaminePct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'PDH activity', key: 'pdhActivity', min: 0.1, max: 1, step: 0.05 },
    ],
    readouts: [
      {
        label: 'Cycle flux',
        value: (c) => c.derived.tcaFlux.toFixed(2),
        unit: 'turns',
        colorToken: 'exercise',
        secondary: (c) => `acetyl-CoA ${c.derived.acetylCoA.toFixed(2)}`,
      },
      {
        label: 'ATP yield',
        value: (c) => c.derived.atpYield.toFixed(1),
        colorToken: 'exercise',
        secondary: (c) => `NADH ${c.derived.nadhRate.toFixed(1)} · FADH2 ${c.derived.fadh2Rate.toFixed(1)}`,
      },
      {
        label: 'Lactate',
        value: (c) => c.derived.lactateMmolL.toFixed(1),
        unit: 'mmol/L',
        colorToken: 'cortisol',
        secondary: (c) => (c.derived.lactateMmolL > 4 ? 'lactic acidosis range' : 'tolerated'),
      },
      {
        label: 'Oxygen used',
        value: (c) => c.derived.o2mLPerMin.toFixed(0),
        unit: 'mL/min',
        colorToken: 'o2',
        secondary: (c) => `CO2 ${c.derived.co2mLPerMin.toFixed(0)} mL/min`,
      },
      {
        label: 'Respiratory quotient',
        value: (c) => c.derived.rqProxy.toFixed(2),
        colorToken: 'vq',
        secondary: (c) => (c.derived.rqProxy > 0.9 ? 'carbohydrate-leaning' : c.derived.rqProxy < 0.75 ? 'fat-leaning' : 'mixed'),
      },
      {
        label: 'PDH flux',
        value: (c) => c.derived.pdhFlux.toFixed(2),
        colorToken: 'glucose',
        secondary: (c) => `fat flux ${c.derived.fatFlux.toFixed(2)}`,
      },
      {
        label: 'Cycle state',
        value: (c) => c.derived.krebsState,
        colorToken: 'exercise',
        wide: true,
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Lactate',
        unit: 'mmol/L',
        colorToken: 'cortisol',
        domainMin: 0,
        domainMax: 10,
        data: (points) => points.map((p) => p.lactate),
      },
      {
        kind: 'sparkline',
        label: 'ATP yield',
        unit: 'rate',
        colorToken: 'exercise',
        domainMin: 0,
        domainMax: 35,
        data: (points) => points.map((p) => p.atp),
      },
      {
        kind: 'sparkline',
        label: 'CO2 output',
        unit: 'mL/min',
        colorToken: 'co2',
        domainMin: 0,
        domainMax: 500,
        data: (points) => points.map((p) => p.co2),
      },
    ],
  };
}

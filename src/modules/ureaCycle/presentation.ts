import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
  SceneNode,
} from '@/shared/presentation/types';
import type {
  UreaCycleDerived,
  UreaCycleHistoryPoint,
  UreaCycleInputs,
  UreaCycleInternalState,
} from './engine/types';

type Ctx = PresentationContext<UreaCycleInternalState, UreaCycleDerived, UreaCycleInputs, UreaCycleHistoryPoint>;

const W = 460;
const H = 260;

/**
 * The cycle as a five-station pathway across two compartments: CPS1 and OTC inside the
 * mitochondrion, ASS, ASL and arginase in the cytosol. Arrow calibre carries flux — the
 * nitrogen entering on the left, the urea leaving on the right — so every slider moves the
 * picture as well as the numbers.
 */
function cycleFrame(ctx: Ctx): FrameNode {
  const { derived, inputs } = ctx;

  const loadWidth = Math.max(1, Math.min(14, derived.nitrogenLoadGPerDay * 0.45));
  const ureaWidth = Math.max(1, Math.min(14, derived.ureaMmolL * 1.1));
  const mitoOpacity = 0.25 + 0.55 * (inputs.liverFunctionPct / 100);
  const blockOpacity = inputs.enzymeCapacity < 0.6 ? 0.95 : 0.25;
  const oroticR = 3 + Math.min(9, derived.oroticAcidIndex);

  const stations: SceneNode[] = [];
  const names = ['CPS1', 'OTC', 'ASS', 'ASL', 'arginase'];
  const intermediates = ['carbamoyl-P', 'citrulline', 'argininosuccinate', 'arginine', 'ornithine'];
  names.forEach((name, i) => {
    const x = 118 + i * 62;
    const blocked = inputs.enzymeCapacity < 0.6 && (i === 1 || i === 0);
    stations.push({
      type: 'circle', cx: x, cy: 130, r: 22,
      fill: 'liver', fillOpacity: blocked ? 0.55 : 0.14, stroke: 'liver', strokeWidth: 1.5,
    });
    stations.push({ type: 'text', x, y: 134, text: name, cls: 'tickLabel', anchor: 'middle' });
    stations.push({ type: 'text', x, y: 162, text: intermediates[i]!, cls: 'caption', anchor: 'middle' });
    if (i < names.length - 1) {
      stations.push({
        type: 'rect', x: x + 22, y: 127, width: 18, height: Math.max(2, loadWidth * 0.5),
        fill: 'liver', opacity: blocked ? blockOpacity : 0.7,
      });
    }
  });

  return {
    type: 'frame',
    key: 'urea-cycle',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The urea cycle across mitochondrion and cytosol: nitrogen entry, five enzyme stations, urea exit and the orotic shunt',
    children: [
      // Compartment backdrops.
      { type: 'rect', x: 96, y: 78, width: 150, height: 104, fill: 'liver', fillOpacity: mitoOpacity * 0.35, stroke: 'liver', strokeWidth: 1 },
      { type: 'text', x: 104, y: 94, text: 'mitochondrion', cls: 'caption' },
      { type: 'rect', x: 250, y: 78, width: 178, height: 104, fill: 'kidney', fillOpacity: 0.12, stroke: 'kidney', strokeWidth: 1 },
      { type: 'text', x: 258, y: 94, text: 'cytosol', cls: 'caption' },
      // Nitrogen entry arrow, calibre set by the load.
      { type: 'rect', x: 30, y: 130 - loadWidth / 2, width: 60, height: loadWidth, fill: 'cortisol' },
      { type: 'text', x: 60, y: 112, text: 'nitrogen in', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: 60, y: 208, text: `${derived.nitrogenLoadGPerDay.toFixed(1)} g N/d`, cls: 'valueLabel', anchor: 'middle', colorToken: 'cortisol' },
      ...stations,
      // Urea exit arrow, calibre set by production.
      { type: 'rect', x: 428 - 62 + 22, y: 130 - ureaWidth / 2, width: 60, height: ureaWidth, fill: 'urine' },
      { type: 'text', x: 418, y: 112, text: 'urea out', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: 418, y: 208, text: `${derived.ureaMmolL.toFixed(1)} mmol/L`, cls: 'valueLabel', anchor: 'middle', colorToken: 'urine' },
      // Aspartate entry from the Krebs bicycle, fumarate return.
      { type: 'text', x: 300, y: 66, text: `aspartate in · fumarate to Krebs`, cls: 'caption', anchor: 'middle' },
      // Orotic shunt: a relief valve that opens only against a distal block.
      { type: 'circle', cx: 180, cy: 52, r: oroticR, fill: 'bile', fillOpacity: 0.5, stroke: 'bile', strokeWidth: 1, opacity: blockOpacity },
      { type: 'text', x: 180, y: 30, text: `orotic ${derived.oroticAcidIndex.toFixed(1)}`, cls: 'valueLabel', anchor: 'middle', colorToken: 'bile' },
      // Ammonia and the state it implies.
      { type: 'text', x: 60, y: 232, text: `ammonia ${derived.ammoniaUmolL.toFixed(0)} umol/L`, cls: 'valueLabel', anchor: 'middle', colorToken: 'liver' },
      { type: 'text', x: W / 2, y: 248, text: derived.ureaCycleState, cls: 'verdict', anchor: 'middle', colorToken: 'liver' },
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
    key: 'urea-meters',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Ammonia, urea, urinary nitrogen and the orotic shunt, each as a live meter',
    children: [
      ...meter(0, 'ammonia', 'umol/L', derived.ammoniaUmolL, 250, 'liver'),
      ...meter(115, 'urea', 'mmol/L', derived.ureaMmolL, 15, 'urine'),
      ...meter(230, 'urine nitrogen', 'g/d', derived.urineNitrogenGPerDay, 30, 'kidney'),
      ...meter(345, 'orotic shunt', 'index', derived.oroticAcidIndex, 10, 'bile'),
      { type: 'text', x: W / 2, y: H - 18, text: 'urea rises with load when the cycle copes, and falls when it fails', cls: 'caption', anchor: 'middle' },
    ],
  };
}

export function buildUreaCyclePresentation(ctx: Ctx): ModulePresentation<UreaCycleInternalState, UreaCycleDerived, UreaCycleInputs, UreaCycleHistoryPoint> {
  const gradeLabel = (d: UreaCycleDerived): string =>
    d.encephalopathyGrade === 0 ? 'awake' : `grade ${d.encephalopathyGrade}`;

  return {
    diagram: [cycleFrame(ctx), meterFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Protein intake', key: 'proteinIntakeGPerDay', min: 0, max: 200, step: 5, unit: ' g/day' },
      { kind: 'slider', label: 'Liver function', key: 'liverFunctionPct', min: 10, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Hydration', key: 'hydrationLPerDay', min: 0.5, max: 4, step: 0.25, unit: ' L/day' },
      { kind: 'slider', label: 'Enzyme capacity', key: 'enzymeCapacity', min: 0.2, max: 1, step: 0.05 },
      { kind: 'slider', label: 'Catabolic stress', key: 'catabolicStress', min: 0, max: 1, step: 0.05 },
    ],
    readouts: [
      {
        label: 'Ammonia',
        value: (c) => c.derived.ammoniaUmolL.toFixed(0),
        unit: 'umol/L',
        colorToken: 'liver',
        secondary: (c) => (c.derived.ammoniaUmolL > 90 ? 'encephalopathic range' : 'tolerated'),
      },
      {
        label: 'Urea',
        value: (c) => c.derived.ureaMmolL.toFixed(1),
        unit: 'mmol/L',
        colorToken: 'urine',
        secondary: (c) => `BUN ${c.derived.bunMgDl.toFixed(0)} mg/dL`,
      },
      {
        label: 'Urine nitrogen',
        value: (c) => c.derived.urineNitrogenGPerDay.toFixed(1),
        unit: 'g/day',
        colorToken: 'kidney',
        secondary: (c) => `load ${c.derived.nitrogenLoadGPerDay.toFixed(1)} g/day`,
      },
      {
        label: 'Nitrogen load',
        value: (c) => c.derived.nitrogenLoadGPerDay.toFixed(1),
        unit: 'g/day',
        colorToken: 'cortisol',
      },
      {
        label: 'Orotic shunt',
        value: (c) => c.derived.oroticAcidIndex.toFixed(1),
        colorToken: 'bile',
        secondary: (c) => (c.derived.oroticAcidIndex > 3 ? 'distal block signature' : 'quiet'),
      },
      {
        label: 'Encephalopathy',
        value: (c) => `grade ${c.derived.encephalopathyGrade}`,
        colorToken: 'liver',
        secondary: (c) => gradeLabel(c.derived),
        revealsPattern: true,
      },
      {
        label: 'Cycle state',
        value: (c) => c.derived.ureaCycleState,
        colorToken: 'liver',
        wide: true,
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Ammonia',
        unit: 'umol/L',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 250,
        data: (points) => points.map((p) => p.ammonia),
      },
      {
        kind: 'sparkline',
        label: 'Urea',
        unit: 'mmol/L',
        colorToken: 'urine',
        domainMin: 0,
        domainMax: 15,
        data: (points) => points.map((p) => p.urea),
      },
    ],
  };
}

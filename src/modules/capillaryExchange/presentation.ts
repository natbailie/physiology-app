import { clamp, scaleClamped } from '@/shared/lib/math';
import { MECHANISM_LABELS } from './engine/edemaClassification';
import type { CapillaryDerived, CapillaryHistoryPoint, CapillaryInputs, CapillaryState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* The capillary runs between two label columns on a 0..480 viewBox, five stations along its
 * length where net Starling pressure is evaluated so that the point where filtration turns
 * into reabsorption is visible rather than asserted. */
const CAPILLARY = { left: 62, right: 396, y: 92, height: 20 };
const TISSUE = { left: 62, right: 396, top: 158, baselineHeight: 34 };
const STATIONS = [0.08, 0.29, 0.5, 0.71, 0.92];
const MAX_ARROW_PX = 34;

function roundedRect(x: number, y: number, width: number, height: number, r: number): string {
  return [
    `M${x + r},${y}`,
    `L${x + width - r},${y}`,
    `A${r},${r} 0 0 1 ${x + width},${y + r}`,
    `L${x + width},${y + height - r}`,
    `A${r},${r} 0 0 1 ${x + width - r},${y + height}`,
    `L${x + r},${y + height}`,
    `A${r},${r} 0 0 1 ${x},${y + height - r}`,
    `L${x},${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    'Z',
  ].join(' ');
}

type Ctx = PresentationContext<CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint>;

/**
 * The five stations where net pressure is evaluated. Hydrostatic pressure falls linearly along
 * the capillary, so the net Starling pressure at a station is the arteriolar net shifted by the
 * local pressure drop — exactly the reversal point the learner is meant to see.
 */
function stationPressures(derived: CapillaryDerived): number[] {
  return STATIONS.map((fraction) => {
    const local =
      derived.arteriolarEndPressure +
      (derived.venularEndPressure - derived.arteriolarEndPressure) * fraction;
    return derived.arteriolarNetPressure + (local - derived.arteriolarEndPressure);
  });
}

export function buildCapillaryExchangePresentation(ctx: Ctx): ModulePresentation<CapillaryState, CapillaryDerived, CapillaryInputs, CapillaryHistoryPoint> {
  const { derived } = ctx;
  const span = CAPILLARY.right - CAPILLARY.left;
  const oedema = derived.oedemaSeverity;
  const tissueHeight = TISSUE.baselineHeight * clamp(1 + derived.interstitialExcess * 0.7, 0.6, 2.6);
  const reserveWidth = derived.lymphaticReserveFraction * 64;
  // Blood-flow speed follows how much is being filtered this moment; arteriolar calibre is
  // the visible face of precapillary tone, which is what shields the capillary from pressure.
  const flowSpeed = clamp(derived.filtrationRateMlPerMin / 3, 0.1, 2);
  const arteriolarCalibre = clamp(1 / derived.precapillaryTone, 0.5, 1.8);

  const pressures = stationPressures(derived);
  const scale = Math.max(4, ...pressures.map(Math.abs));

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'A capillary with the four Starling forces acting across its wall, the tissue it supplies swelling as fluid accumulates, and the lymphatic vessel draining it',
        defs: [
          { type: 'marker', id: 'flux-arrowhead', colorToken: 'capillary' },
          { type: 'marker', id: 'lymph-arrowhead', colorToken: 'lymph' },
          { type: 'marker', id: 'flux-arrowhead-in', colorToken: 'lymph' },
        ],
        children: [
          {
            type: 'text',
            x: 22,
            y: 22,
            text: `${derived.tissueBed} capillary — Jv = Kf [(Pc − Pi) − s(pic − pii)]`,
            cls: 'pathLabel',
          },
          {
            type: 'text',
            x: 22,
            y: 44,
            text: `out: Pc ${derived.capillaryPressureMmHg.toFixed(1)} − Pi ${derived.interstitialPressureMmHg.toFixed(1)} = ${(derived.capillaryPressureMmHg - derived.interstitialPressureMmHg).toFixed(1)}`,
            cls: 'pathLabel',
            colorToken: 'capillary',
          },
          {
            type: 'text',
            x: 22,
            y: 58,
            text: `in: s ${derived.reflectionCoefficient.toFixed(2)} x (pic ${derived.plasmaOncoticMmHg.toFixed(1)} − pii ${derived.interstitialOncoticMmHg.toFixed(1)}) = ${(derived.reflectionCoefficient * (derived.plasmaOncoticMmHg - derived.interstitialOncoticMmHg)).toFixed(1)}`,
            cls: 'pathLabel',
            colorToken: 'lymph',
          },
          {
            type: 'text',
            x: 368,
            y: 44,
            text: `NFP ${derived.netFiltrationPressure >= 0 ? '+' : ''}${derived.netFiltrationPressure.toFixed(2)} mmHg`,
            cls: 'valueLabel',
            anchor: 'end',
          },
          { type: 'text', x: 286, y: 58, text: `Jv ${derived.filtrationRateMlPerMin.toFixed(2)} mL/min`, cls: 'pathLabel' },
          {
            type: 'vessel',
            path: `M20,${CAPILLARY.y + 10} L${CAPILLARY.left},${CAPILLARY.y + 10}`,
            speed: flowSpeed,
            colorToken: 'artery',
            width: arteriolarCalibre,
          },
          { type: 'vessel', path: `M${CAPILLARY.right},${CAPILLARY.y + 10} L${CAPILLARY.right + 40},${CAPILLARY.y + 10}`, speed: flowSpeed, colorToken: 'capillary' },
          { type: 'text', x: 16, y: CAPILLARY.y - 20, text: 'Arteriolar end', cls: 'anatomy' },
          { type: 'text', x: 16, y: CAPILLARY.y - 6, text: `${derived.arteriolarEndPressure.toFixed(0)} mmHg`, cls: 'valueLabel' },
          { type: 'text', x: CAPILLARY.right + 40, y: CAPILLARY.y - 20, text: 'Venular end', cls: 'anatomy', anchor: 'end' },
          { type: 'text', x: CAPILLARY.right + 40, y: CAPILLARY.y - 6, text: `${derived.venularEndPressure.toFixed(0)} mmHg`, cls: 'valueLabel', anchor: 'end' },
          {
            type: 'path',
            d: roundedRect(CAPILLARY.left, CAPILLARY.y, span, CAPILLARY.height, CAPILLARY.height / 2),
            fill: 'capillary',
            colorToken: 'capillary',
            strokeWidth: 1.5,
          },
          ...STATIONS.map((fraction, index) => {
            const x = CAPILLARY.left + fraction * span;
            const pressure = pressures[index]!;
            const length = clamp((Math.abs(pressure) / scale) * MAX_ARROW_PX, 5, MAX_ARROW_PX);
            const filtering = pressure >= 0;
            const y1 = filtering ? CAPILLARY.y + CAPILLARY.height : CAPILLARY.y + CAPILLARY.height + length;
            const y2 = filtering ? CAPILLARY.y + CAPILLARY.height + length : CAPILLARY.y + CAPILLARY.height;
            return {
              type: 'path' as const,
              d: `M${x},${y1} L${x},${y2}`,
              colorToken: filtering ? 'capillary' : 'lymph',
              strokeWidth: 2,
              markerEnd: filtering ? 'flux-arrowhead' : 'flux-arrowhead-in',
            };
          }),
          {
            type: 'path',
            d: roundedRect(TISSUE.left, TISSUE.top, TISSUE.right - TISSUE.left, TISSUE.baselineHeight, 0),
            fill: 'none',
            colorToken: 'text',
            styleVars: { opacity: 0.7, 'stroke-dasharray': '4 3' },
          },
          {
            type: 'rect',
            x: TISSUE.left,
            y: TISSUE.top,
            width: TISSUE.right - TISSUE.left,
            height: tissueHeight,
            fill: 'interstitium',
            styleVars: { oedema },
          },
          {
            type: 'text',
            x: (TISSUE.left + TISSUE.right) / 2,
            y: TISSUE.top + 20,
            text: `Interstitium ${derived.interstitialVolumeMl.toFixed(0)} mL (${derived.interstitialExcess >= 0 ? '+' : ''}${(derived.interstitialExcess * 100).toFixed(0)}%)`,
            cls: 'valueLabel',
            anchor: 'middle',
          },
          {
            type: 'path',
            d: `M${TISSUE.right},${TISSUE.top + 18} L${TISSUE.right + 34},${TISSUE.top - 24}`,
            colorToken: 'lymph',
            markerEnd: 'lymph-arrowhead',
          },
          ...[0.32, 0.66].map((t) => {
            const x = TISSUE.right + 34 * t;
            const y = TISSUE.top + 18 - 42 * t;
            return { type: 'path' as const, d: `M ${x - 5} ${y - 4} L ${x + 3} ${y - 5} L ${x + 5} ${y + 4}`, colorToken: 'lymph', fill: 'none' };
          }),
          { type: 'text', x: 404, y: TISSUE.top - 34, text: 'Lymphatic', cls: 'anatomy', anchor: 'end' },
          { type: 'text', x: 22, y: TISSUE.top + 74, text: `lymph ${derived.lymphFlowMlPerMin.toFixed(2)} of ${derived.lymphaticCapacityMlPerMin.toFixed(1)} mL/min`, cls: 'pathLabel' },
          { type: 'rect', x: 22, y: TISSUE.top + 82, width: 64, height: 7, fill: 'text', styleVars: { opacity: 0.25 } },
          {
            type: 'rect',
            x: 22,
            y: TISSUE.top + 82,
            width: Math.max(derived.lymphaticReserveFraction <= 0.02 ? 64 : reserveWidth, 1),
            height: 7,
            fill: derived.lymphaticReserveFraction <= 0.02 ? 'danger' : 'lymph',
          },
          {
            type: 'text',
            x: 94,
            y: TISSUE.top + 89,
            text: derived.lymphaticReserveFraction <= 0.02 ? 'reserve exhausted' : `${(derived.lymphaticReserveFraction * 100).toFixed(0)}% reserve`,
            cls: 'pathLabel',
          },
          { type: 'text', x: 22, y: TISSUE.top + 110, text: `safety factor ${derived.safetyFactorMmHg.toFixed(1)} mmHg remaining`, cls: 'pathLabel' },
          { type: 'text', x: 22, y: TISSUE.top + 128, text: MECHANISM_LABELS[derived.dominantMechanism], cls: 'valueLabel', colorToken: 'capillary' },
          {
            type: 'text',
            x: 286,
            y: TISSUE.top + 110,
            text: 'Free fluid — pitting',
            cls: 'pathLabel',
            colorToken: 'danger',
            opacity: derived.isPitting ? 1 : 0,
          },
          {
            type: 'text',
            x: 286,
            y: TISSUE.top + 128,
            text: 'Gas exchange impaired',
            cls: 'pathLabel',
            colorToken: 'danger',
            opacity: scaleClamped(derived.oxygenationImpairment, 0.1, 0.4, 0, 1),
          },
        ],
      },
    ],
    controls: [
      {
        kind: 'toggle',
        label: 'Tissue bed',
        key: 'tissueBed',
        options: [
          { value: 'systemic', label: 'Systemic' },
          { value: 'pulmonary', label: 'Lung' },
          { value: 'hepatic', label: 'Liver' },
          { value: 'glomerulus', label: 'Glomerulus' },
        ],
        colorToken: 'capillary',
      },
      { kind: 'slider', label: 'Inflow pressure', key: 'arterialInflowPressure', min: 5, max: 180, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'Outflow pressure', key: 'venousOutflowPressure', min: 0, max: 40, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'Precapillary tone', key: 'precapillaryTone', min: 0.2, max: 3, step: 0.05 },
      { kind: 'slider', label: 'Plasma albumin', key: 'plasmaAlbuminGDl', min: 1, max: 5.5, step: 0.1, unit: ' g/dL' },
      { kind: 'slider', label: 'Reflection coefficient', key: 'reflectionCoefficient', min: 0.05, max: 1, step: 0.05 },
      { kind: 'slider', label: 'Permeability (Kf)', key: 'capillaryPermeability', min: 0.2, max: 5, step: 0.1 },
      { kind: 'slider', label: 'Lymphatic capacity', key: 'lymphaticFlowCapacity', min: 0, max: 3, step: 0.02 },
      { kind: 'slider', label: 'Interstitial compliance', key: 'interstitialCompliance', min: 0.3, max: 3, step: 0.05 },
    ],
    readouts: [
      {
        label: 'Capillary pressure',
        value: (c) => c.derived.capillaryPressureMmHg.toFixed(1),
        unit: 'mmHg',
        secondary: (c) => `${c.derived.arteriolarEndPressure.toFixed(0)} → ${c.derived.venularEndPressure.toFixed(0)} along it`,
        colorToken: 'capillary',
      },
      {
        label: 'Interstitial pressure',
        value: (c) => c.derived.interstitialPressureMmHg.toFixed(1),
        unit: 'mmHg',
        secondary: (c) => (c.derived.interstitialPressureMmHg < 0 ? 'subatmospheric' : 'positive — gel saturated'),
        colorToken: 'interstitium',
      },
      {
        label: 'Plasma oncotic',
        value: (c) => c.derived.plasmaOncoticMmHg.toFixed(1),
        unit: 'mmHg',
        secondary: (c) => `sigma ${c.derived.reflectionCoefficient.toFixed(2)}`,
        colorToken: 'capillary',
      },
      {
        label: 'Interstitial oncotic',
        value: (c) => c.derived.interstitialOncoticMmHg.toFixed(1),
        unit: 'mmHg',
        secondary: (c) => `${c.derived.interstitialProteinGDl.toFixed(1)} g/dL protein`,
        colorToken: 'interstitium',
      },
      {
        label: 'Net filtration pressure',
        value: (c) => `${c.derived.netFiltrationPressure >= 0 ? '+' : ''}${c.derived.netFiltrationPressure.toFixed(2)}`,
        unit: 'mmHg',
        secondary: (c) => (c.derived.venularNetPressure < 0 ? 'venular end reabsorbs' : 'filtering along its whole length'),
        colorToken: 'capillary',
      },
      {
        label: 'Filtration rate',
        value: (c) => c.derived.filtrationRateMlPerMin.toFixed(2),
        unit: 'mL/min',
        secondary: (c) => `net ${c.derived.netAccumulationMlPerMin >= 0 ? '+' : ''}${c.derived.netAccumulationMlPerMin.toFixed(2)} into tissue`,
        colorToken: 'capillary',
      },
      {
        label: 'Lymph flow',
        value: (c) => c.derived.lymphFlowMlPerMin.toFixed(2),
        unit: 'mL/min',
        secondary: (c) => `capacity ${c.derived.lymphaticCapacityMlPerMin.toFixed(1)}`,
        colorToken: 'lymph',
      },
      {
        label: 'Lymphatic reserve',
        value: (c) => (c.derived.lymphaticReserveFraction * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.lymphaticReserveFraction <= 0.02 ? 'exhausted — fluid accumulating' : 'still in hand'),
        colorToken: 'lymph',
      },
      {
        label: 'Interstitial volume',
        value: (c) => c.derived.interstitialVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: (c) => `${c.derived.interstitialExcess >= 0 ? '+' : ''}${(c.derived.interstitialExcess * 100).toFixed(0)}% of normal`,
        colorToken: 'interstitium',
      },
      {
        label: 'Oedema',
        value: (c) => (c.derived.oedemaSeverity * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.isPitting ? 'free fluid — pits' : 'bound in gel — no pitting'),
        colorToken: 'interstitium',
      },
      {
        label: 'Safety factor left',
        value: (c) => c.derived.safetyFactorMmHg.toFixed(1),
        unit: 'mmHg',
        secondary: () => 'before fluid accumulates',
        colorToken: 'ok',
      },
      {
        label: 'Plasma volume',
        value: (c) => c.derived.plasmaVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: (c) => MECHANISM_LABELS[c.derived.dominantMechanism],
        colorToken: 'artery',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Interstitial volume',
        unit: '% of normal',
        colorToken: 'interstitium',
        domainMin: 80,
        domainMax: 260,
        data: (points) => points.map((p) => p.interstitialVolume),
      },
      {
        kind: 'sparkline',
        label: 'Filtration',
        secondaryLabel: 'lymph flow',
        unit: 'mL/min',
        colorToken: 'capillary',
        secondaryColorToken: 'lymph',
        domainMin: 0,
        domainMax: Math.max(6, derived.lymphaticCapacityMlPerMin * 1.2),
        data: (points) => points.map((p) => p.filtrationRate),
        secondaryData: (points) => points.map((p) => p.lymphFlow),
      },
      {
        kind: 'sparkline',
        label: 'Capillary pressure',
        unit: 'mmHg',
        colorToken: 'artery',
        domainMin: 0,
        domainMax: 60,
        data: (points) => points.map((p) => p.capillaryPressure),
      },
    ],
  };
}

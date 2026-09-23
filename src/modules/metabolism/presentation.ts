import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
  StyleVars,
} from '@/shared/presentation/types';
import type {
  MetabolismDerived,
  MetabolismHistoryPoint,
  MetabolismInputs,
  MetabolismInternalState,
} from './engine/types';

type Ctx = PresentationContext<MetabolismInternalState, MetabolismDerived, MetabolismInputs, MetabolismHistoryPoint>;

/* Graphic constants shared by both frames. */
const W = 460;
const H = 250;

/** Horizontal fuel bar: carb / fat / protein oxidation as a stacked gauge. */
function fuelBarFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  const x0 = 150;
  const y0 = 92;
  const barWidth = 280;
  const barHeight = 26;

  const carbW = (derived.carbOxidationPct / 100) * barWidth;
  const fatW = (derived.fatOxidationPct / 100) * barWidth;
  const proteinW = (derived.proteinOxidationPct / 100) * barWidth;

  const insulinPct = derived.insulinSignal * 100;
  const glucagonPct = derived.glucagonSignal * 100;

  return {
    type: 'frame',
    key: 'metabolism-fuel',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Metabolic fuel mix: carbohydrate, fat and protein oxidation, with the insulin and glucagon balance and the current metabolic state',
    children: [
      // The metabolic state the axis has reached.
      { type: 'text', x: W / 2, y: 30, text: derived.metabolicState, cls: 'verdict', anchor: 'middle', colorToken: 'glucose' },
      { type: 'text', x: W / 2, y: 56, text: 'metabolic state', cls: 'caption', anchor: 'middle' },

      // Insulin vs glucagon balance.
      { type: 'text', x: 20, y: 84, text: 'insulin', cls: 'tickLabel' },
      { type: 'rect', x: 20, y: 90, width: 100, height: 8, fill: 'panel', opacity: 0.6 },
      { type: 'rect', x: 20, y: 90, width: (insulinPct / 100) * 100, height: 8, fill: 'insulin' },
      { type: 'text', x: 20, y: 114, text: 'glucagon', cls: 'tickLabel' },
      { type: 'rect', x: 20, y: 120, width: 100, height: 8, fill: 'panel', opacity: 0.6 },
      { type: 'rect', x: 20, y: 120, width: (glucagonPct / 100) * 100, height: 8, fill: 'glucagon' },

      // The fuel gauge with its three segments.
      /* Above the bar it names, at x0, rather than at x=20 — where it sat eight units under the
       * "glucagon" label of the hormone column beside it and read as one phrase with it. A caption
       * belongs on the thing it captions; the fuel gauge starts at x0=150. */
      { type: 'text', x: x0, y: y0 - 8, text: 'fuel mix', cls: 'caption' },
      { type: 'rect', x: x0, y: y0, width: barWidth, height: barHeight, fill: 'panel', opacity: 0.6 },
      { type: 'rect', x: x0, y: y0, width: carbW, height: barHeight, fill: 'glucose' },
      { type: 'rect', x: x0 + carbW, y: y0, width: fatW, height: barHeight, fill: 'adrenal-medulla' },
      { type: 'rect', x: x0 + carbW + fatW, y: y0, width: proteinW, height: barHeight, fill: 'cortisol' },

      { type: 'text', x: x0, y: y0 + barHeight + 18, text: 'carbo­hydrate', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: x0 + carbW, y: y0 + barHeight + 18, text: 'fat', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: x0 + carbW + fatW, y: y0 + barHeight + 18, text: 'protein', cls: 'tickLabel', anchor: 'middle' },

      // Numbers that move with the same levers as the bar.
      { type: 'text', x: x0, y: y0 + barHeight + 38, text: `${derived.carbOxidationPct.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle', colorToken: 'glucose' },
      { type: 'text', x: x0 + carbW, y: y0 + barHeight + 38, text: `${derived.fatOxidationPct.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle', colorToken: 'adrenal-medulla' },
      { type: 'text', x: x0 + carbW + fatW, y: y0 + barHeight + 38, text: `${derived.proteinOxidationPct.toFixed(0)}%`, cls: 'valueLabel', anchor: 'middle', colorToken: 'cortisol' },
    ],
  };
}

/** A single vertical meter, defined once and reused for each quantity. */
function meter(
  x: number,
  label: string,
  unit: string,
  value: number,
  domainMax: number,
  colorToken: string,
  styleVars?: StyleVars,
): FrameNode['children'][number][] {
  const trackTop = 78;
  const trackHeight = 108;
  const fraction = Math.max(0, Math.min(1, value / domainMax));
  const fillHeight = Math.max(0, fraction * trackHeight);
  return [
    { type: 'text', x: x + 50, y: 52, text: label, cls: 'label', anchor: 'middle' },
    { type: 'rect', x: x + 38, y: trackTop, width: 24, height: trackHeight, fill: 'panel', opacity: 0.6 },
    { type: 'rect', x: x + 38, y: trackTop + trackHeight - fillHeight, width: 24, height: fillHeight, fill: colorToken, styleVars },
    { type: 'text', x: x + 50, y: trackTop + trackHeight + 22, text: `${value.toFixed(value >= 100 ? 0 : 1)} ${unit}`, cls: 'valueLabel', anchor: 'middle', colorToken },
  ];
}

function meterFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  return {
    type: 'frame',
    key: 'metabolism-meters',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Blood glucose, energy expenditure, ketones and glycogen stores, each as a live meter',
    children: [
      ...meter(0, 'blood glucose', 'mmol/L', derived.bgmmolPerL, 12, 'glucose'),
      ...meter(115, 'energy', 'kcal/d', derived.energyKcalPerDay, 8000, 'exercise'),
      ...meter(230, 'ketones', 'mmol/L', derived.ketonesMmolPerL, 6, 'liver'),
      ...meter(345, 'glycogen', '%', derived.glycogenPct, 100, 'liver'),
      { type: 'text', x: W / 2, y: H - 18, text: 'insulin keeps glucose in check; glucagon feeds the fasting mix', cls: 'caption', anchor: 'middle' },
    ],
  };
}

export function buildMetabolismPresentation(ctx: Ctx): ModulePresentation<MetabolismInternalState, MetabolismDerived, MetabolismInputs, MetabolismHistoryPoint> {
  const ketosisLabel = (d: MetabolismDerived): string =>
    d.ketonesMmolPerL === 0
      ? 'trace'
      : d.ketonesMmolPerL > 1
        ? 'frank ketosis'
        : 'rising';

  const rqLabel = (d: MetabolismDerived): string =>
    d.respiratoryQuotient > 0.9 ? 'carbohydrate-leaning' : d.respiratoryQuotient < 0.75 ? 'fat-leaning' : 'mixed';

  return {
    diagram: [fuelBarFrame(ctx), meterFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Hours since last meal', key: 'hoursPostAbsorptive', min: 0, max: 72, step: 1, unit: ' h' },
      { kind: 'slider', label: 'Insulin resistance', key: 'insulinResistance', min: 1, max: 2.5, step: 0.1 },
      { kind: 'slider', label: 'Catabolic stress', key: 'injuryStress', min: 0, max: 1, step: 0.05 },
      { kind: 'slider', label: 'Basal metabolic rate', key: 'basalMetabolicRate', min: 1200, max: 3000, step: 50, unit: ' kcal/day' },
      { kind: 'slider', label: 'Physical activity', key: 'activityMet', min: 1, max: 5, step: 0.5, unit: ' MET' },
      { kind: 'slider', label: 'Carbohydrate intake', key: 'carbohydrateIntake', min: 0, max: 600, step: 10, unit: ' g/day' },
      { kind: 'slider', label: 'Fat intake', key: 'fatIntake', min: 0, max: 200, step: 5, unit: ' g/day' },
      { kind: 'slider', label: 'Protein intake', key: 'proteinIntake', min: 0, max: 200, step: 5, unit: ' g/day' },
    ],
    readouts: [
      {
        label: 'Blood glucose',
        value: (c) => c.derived.bgmmolPerL.toFixed(1),
        unit: 'mmol/L',
        colorToken: 'glucose',
        secondary: (c) => (c.derived.bgmmolPerL > 7 ? 'hyperglycaemic by this model' : 'defended'),
      },
      {
        label: 'Energy expenditure',
        value: (c) => c.derived.energyKcalPerDay.toFixed(0),
        unit: 'kcal/day',
        colorToken: 'exercise',
        secondary: (c) => `BMR ${c.derived.basalMetabolicRate} kcal × ` +
          `${c.derived.activityMet.toFixed(1)} MET × stress ${(1 + c.derived.injuryStress * 1.6).toFixed(1)}`,
      },
      {
        label: 'Ketones',
        value: (c) => c.derived.ketonesMmolPerL.toFixed(1),
        unit: 'mmol/L',
        colorToken: 'liver',
        secondary: (c) => ketosisLabel(c.derived),
      },
      {
        label: 'Carbohydrate oxidation',
        value: (c) => c.derived.carbOxidationPct.toFixed(0),
        unit: '%',
        colorToken: 'glucose',
      },
      {
        label: 'Fat oxidation',
        value: (c) => c.derived.fatOxidationPct.toFixed(0),
        unit: '%',
        colorToken: 'adrenal-medulla',
      },
      {
        label: 'Protein oxidation',
        value: (c) => c.derived.proteinOxidationPct.toFixed(0),
        unit: '%',
        colorToken: 'cortisol',
        secondary: (c) => `${c.derived.proteinOxidationGPerDay.toFixed(0)} g/day`,
      },
      {
        label: 'Respiratory quotient',
        value: (c) => c.derived.respiratoryQuotient.toFixed(2),
        colorToken: 'vq',
        secondary: (c) => rqLabel(c.derived),
      },
      {
        label: 'Insulin signal',
        value: (c) => c.derived.insulinSignal.toFixed(2),
        colorToken: 'insulin',
        secondary: (c) => `glucagon ${c.derived.glucagonSignal.toFixed(2)}`,
      },
      {
        label: 'Glycogen remaining',
        value: (c) => c.derived.glycogenPct.toFixed(0),
        unit: '%',
        colorToken: 'liver',
        secondary: (c) => (c.derived.glycogenPct < 35 ? 'spent — gluconeogenesis owns the glucose' : 'substantial'),
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Blood glucose',
        unit: 'mmol/L',
        colorToken: 'glucose',
        domainMin: 0,
        domainMax: 12,
        data: (points) => points.map((p) => p.bg),
      },
      {
        kind: 'sparkline',
        label: 'Ketones',
        unit: 'mmol/L',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 6,
        data: (points) => points.map((p) => p.ketones),
      },
      {
        kind: 'sparkline',
        label: 'Energy expenditure',
        unit: 'kcal/day',
        colorToken: 'exercise',
        domainMin: 0,
        domainMax: 8000,
        data: (points) => points.map((p) => p.energy),
      },
    ],
  };
}
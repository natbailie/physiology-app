import { clamp } from '@/shared/lib/math';
import { OXYGEN } from './engine/constants';
import type { ExerciseDerived, ExerciseHistoryPoint, ExerciseInputs, ExerciseInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const PLOT = { x: 320, y: 60, width: 210, height: 140 };
const MAX_W = 400;
const REST = OXYGEN.REST_VO2_ML_MIN;
const ML_PER_WATT = OXYGEN.ML_PER_WATT;

const toX = (watts: number) => PLOT.x + (clamp(watts, 0, MAX_W) / MAX_W) * PLOT.width;
const toY = (vo2: number) => PLOT.y + PLOT.height - (clamp(vo2 / 1000, 0, 5) / 5) * PLOT.height;

/** Demand line: linear in watts, from resting VO2 up to the max the plot holds. */
const demandPath = `M${toX(0).toFixed(1)},${toY(REST).toFixed(1)} L${toX(MAX_W).toFixed(1)},${toY(REST + MAX_W * ML_PER_WATT).toFixed(1)}`;

type Ctx = PresentationContext<ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint>;

export function buildExercisePhysiologyPresentation(ctx: Ctx): ModulePresentation<ExerciseInternalState, ExerciseDerived, ExerciseInputs, ExerciseHistoryPoint> {
  const { derived } = ctx;

  const thresholdWatts = ((derived.lactateThresholdFraction * derived.vo2MaxMlMin) - REST) / ML_PER_WATT;
  const opX = toX(clamp((derived.vo2DemandMlMin - REST) / ML_PER_WATT, 0, MAX_W));
  const opY = toY(derived.vo2MlMin);
  const maxLineY = toY(derived.vo2MaxMlMin);

  const BAR = (y: number) => ({ x: 44, y, width: 200, height: 15 });
  const musclePct = derived.muscleFlowSharePct / 100;
  const muscleBar = BAR(174);
  const otherBar = BAR(202);
  const otherValue = clamp((100 - derived.muscleFlowSharePct - 8) / 70, 0.05, 1);
  const muscleTextX = 250;
  const otherTextX = 250;

  const alarmLine = derived.aboveVo2Max
    ? `Exhaustion — fatigue ${derived.fatiguePct.toFixed(0)}% and climbing`
    : `above lactate threshold (${(derived.lactateThresholdFraction * 100).toFixed(0)}% of ceiling)`;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'VO2 against workload with ceiling and redistribution',
        children: [
          // VO2 vs workload plot with the VO2max ceiling and lactate-threshold marker.
          { type: 'rect', x: PLOT.x, y: PLOT.y, width: PLOT.width, height: PLOT.height, cls: 'axis' },
          { type: 'path', d: demandPath, colorToken: 'exercise', strokeWidth: 2.5, fill: 'none' },
          {
            type: 'line',
            x1: PLOT.x,
            x2: PLOT.x + PLOT.width,
            y1: maxLineY,
            y2: maxLineY,
            colorToken: 'danger',
            cls: 'maxLine',
          },
          { type: 'line', x1: toX(thresholdWatts), x2: toX(thresholdWatts), y1: PLOT.y, y2: PLOT.y + PLOT.height, colorToken: 'warn', cls: 'thresholdLine' },
          { type: 'circle', cx: opX, cy: opY, r: 5, fill: 'exercise' },
          {
            type: 'text',
            x: PLOT.x - 44,
            y: PLOT.y - 12,
            text: `VO2 vs WORKLOAD · max ${derived.vo2MaxMlMin.toFixed(0)} mL/min`,
            cls: 'label',
          },
          {
            type: 'text',
            x: PLOT.x + PLOT.width,
            y: PLOT.y + PLOT.height + 16,
            text: 'watts →',
            cls: 'caption',
            anchor: 'end',
          },
          {
            type: 'text',
            x: PLOT.x + 6,
            y: PLOT.y + 14,
            text: `VO2 ${derived.vo2MlMin.toFixed(0)} (${(derived.engagementFraction * 100).toFixed(0)}% of max)`,
            cls: 'caption',
          },
          ...(derived.aboveVo2Max
            ? [{ type: 'text' as const, x: PLOT.x + 4, y: PLOT.y + 30, text: 'Above ceiling — deficit paid anaerobically', cls: 'alarm' }]
            : []),

          // Blood-flow redistribution.
          { type: 'text', x: 44, y: 150, text: 'Blood flow redistribution', cls: 'label' },
          { type: 'text', x: 44, y: 168, text: 'muscle', cls: 'caption' },
          { type: 'rect', x: muscleBar.x, y: muscleBar.y, width: muscleBar.width, height: muscleBar.height, cls: 'flowFrame' },
          { type: 'rect', x: 44, y: 174, width: 200 * musclePct, height: 15, fill: 'sarcomere', styleVars: { opacity: 0.85 } },
          { type: 'text', x: muscleTextX, y: 186, text: `${derived.muscleFlowSharePct.toFixed(0)}%`, cls: 'caption' },
          { type: 'text', x: 44, y: 196, text: 'other beds', cls: 'caption' },
          { type: 'rect', x: otherBar.x, y: otherBar.y, width: otherBar.width, height: otherBar.height, cls: 'flowFrame' },
          { type: 'rect', x: 44, y: 202, width: 200 * otherValue, height: 15, fill: 'venous', styleVars: { opacity: 0.85 } },
          { type: 'text', x: otherTextX, y: 214, text: 'constricted', cls: 'caption' },

          {
            type: 'text',
            x: 44,
            y: 258,
            text: `CO ${derived.cardiacOutputLMin.toFixed(1)} L/min · a-v diff ${derived.arteriovenousDiffMlDl.toFixed(1)} mL/dL · TPR ${derived.totalResistanceIndex.toFixed(0)}`,
            cls: 'caption',
          },
          {
            type: 'text',
            x: 44,
            y: 286,
            text: `VE ${derived.ventilationLMin.toFixed(0)} L/min · core ${derived.coreTempC.toFixed(1)} °C · fatigue ${derived.fatiguePct.toFixed(0)}%`,
            cls: 'caption',
          },
          ...(derived.aboveThreshold || derived.aboveVo2Max
            ? [{ type: 'text' as const, x: 44, y: 316, text: alarmLine, cls: 'alarm' }]
            : []),
          { type: 'text', x: 44, y: 352, text: `HR ${derived.heartRateBpm.toFixed(0)} · lactate ${derived.lactateMmolL.toFixed(1)} mmol/L`, cls: 'verdict' },
          { type: 'text', x: 44, y: 378, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Workload', key: 'workloadWatts', min: 0, max: 400, step: 5, unit: ' W' },
      { kind: 'slider', label: 'Training status', key: 'fitnessPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Age', key: 'ageYears', min: 20, max: 80, step: 1, unit: ' years' },
      { kind: 'slider', label: 'Hydration', key: 'hydrationPct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'VO2',
        value: (c) => (c.derived.vo2MlMin / 1000).toFixed(2),
        unit: 'L/min',
        secondary: (c) => `demand ${c.derived.vo2DemandMlMin.toFixed(0)} · max ${c.derived.vo2MaxMlMin.toFixed(0)}`,
        colorToken: 'o2',
      },
      {
        label: 'Heart rate',
        value: (c) => c.derived.heartRateBpm.toFixed(0),
        unit: 'bpm',
        secondary: (c) => `max for age ${c.derived.maxHeartRateBpm.toFixed(0)}`,
        colorToken: 'artery',
      },
      {
        label: 'Stroke volume',
        value: (c) => c.derived.strokeVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: () => 'plateaus by half of maximal work',
        colorToken: 'artery',
      },
      {
        label: 'Cardiac output',
        value: (c) => c.derived.cardiacOutputLMin.toFixed(1),
        unit: 'L/min',
        secondary: () => 'rate × stroke volume',
        colorToken: 'basal-ganglia',
      },
      {
        label: 'a-v O2 difference',
        value: (c) => c.derived.arteriovenousDiffMlDl.toFixed(1),
        unit: 'mL/dL',
        secondary: () => 'extraction does what flow cannot',
        colorToken: 'hemoglobin',
      },
      {
        label: 'Lactate',
        value: (c) => c.derived.lactateMmolL.toFixed(1),
        unit: 'mmol/L',
        secondary: (c) =>
          c.derived.aboveThreshold
            ? `above threshold (${(c.derived.lactateThresholdFraction * 100).toFixed(0)}%)`
            : `threshold at ${(c.derived.lactateThresholdFraction * 100).toFixed(0)}% — not yet`,
        colorToken: 'nociception',
      },
      {
        label: 'Ventilation',
        value: (c) => c.derived.ventilationLMin.toFixed(0),
        unit: 'L/min',
        secondary: () => 'tracks CO2, hyperventilates with acidosis',
        colorToken: 'co2',
      },
      {
        label: 'Muscle blood flow',
        value: (c) => c.derived.muscleFlowSharePct.toFixed(0),
        unit: '% of CO',
        secondary: () => 'gut and kidney donate their share',
        colorToken: 'sarcomere',
      },
      {
        label: 'Core temp / fatigue',
        value: (c) => `${c.derived.coreTempC.toFixed(1)}°C · ${c.derived.fatiguePct.toFixed(0)}%`,
        secondary: (c) => (c.derived.fatiguePct > 30 ? 'exhaustion approaching' : 'sustaining'),
        colorToken: 'thermal',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        wide: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'Heart rate', unit: 'bpm', colorToken: 'artery', domainMin: 40, domainMax: 200, data: (points) => points.map((p) => p.hr) },
      { kind: 'sparkline', label: 'VO2', unit: '×100 mL/min', colorToken: 'o2', domainMin: 0, domainMax: 450, data: (points) => points.map((p) => p.vo2 / 100) },
      { kind: 'sparkline', label: 'Lactate', unit: 'mmol/L', colorToken: 'nociception', domainMin: 0, domainMax: 12, data: (points) => points.map((p) => p.lactate) },
      { kind: 'sparkline', label: 'Fatigue', unit: '%', colorToken: 'danger', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.fatigue) },
    ],
  };
}

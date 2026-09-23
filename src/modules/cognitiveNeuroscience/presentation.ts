import type {
  FrameNode,
  ModulePresentation,
  PresentationContext,
} from '@/shared/presentation/types';
import type {
  CognitionDerived,
  CognitionHistoryPoint,
  CognitionInputs,
  CognitionInternalState,
} from './engine/types';
import { COGNITION } from './engine/constants';

type Ctx = PresentationContext<CognitionInternalState, CognitionDerived, CognitionInputs, CognitionHistoryPoint>;

const W = 460;
const H = 250;

const xOf = (arousal: number): number => 42 + Math.min(Math.max(arousal, 0), 100) * ((W - 60) / 100);
const yOf = (score: number): number => 210 - Math.min(Math.max(score, 0), 100) * (180 / 100);

/** The Yerkes-Dodson curve the CURRENT task implies: performance against arousal for the task's own
 * optimum. It is a genuine graph, so the module stays one — the four ascending sliders build it. */
function yerkesFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  const { baselineArousalPct, performancePct, optimalArousal } = derived;

  const curve: string[] = [];
  for (let x = 0; x <= 100; x += 1) {
    const y = 100 * Math.exp(-Math.pow((x - optimalArousal) / COGNITION.AROUSAL_CURVE_WIDTH, 2));
    curve.push(`${xOf(x).toFixed(1)},${yOf(y).toFixed(1)}`);
  }
  const optimumX = xOf(optimalArousal);

  return {
    type: 'frame',
    key: 'cognition-yerkes',
    viewBox: [0, 0, W, H],
    ariaLabel: 'The Yerkes-Dodson curve for the current task, with the learner\'s arousal and performance plotted against it',
    children: [
      { type: 'text', x: W / 2, y: 24, text: derived.state, cls: 'verdict', anchor: 'middle', colorToken: 'brand' },
      { type: 'text', x: W / 2, y: 38, text: 'performance against arousal', cls: 'caption', anchor: 'middle' },

      // The task's own optimum, as a caret under the curve; the inverted-U is built around it.
      { type: 'circle', cx: optimumX, cy: 188, r: 3, fill: 'insulin', stroke: 'panel' },
      { type: 'line', x1: optimumX, y1: 196, x2: optimumX, y2: 210, colorToken: 'insulin' },
      { type: 'text', x: optimumX, y: 224, text: `task optimum ${optimalArousal.toFixed(0)}`, cls: 'tickLabel', anchor: 'middle', colorToken: 'insulin' },

      // The inverted-U itself, for how hard the task is.
      { type: 'path', d: `M ${curve.join(' L ')}`, colorToken: 'glucose', fill: 'none', strokeWidth: 2 },
      { type: 'text', x: W - 86, y: yOf(38), text: 'inverted-U', cls: 'caption', anchor: 'end', colorToken: 'glucose' },

      // Where the learner currently sits.
      { type: 'circle', cx: xOf(baselineArousalPct), cy: yOf(performancePct), r: 6, fill: 'brand', stroke: 'panel', strokeWidth: 2 },
      /* Below the dot when the dot is near the ceiling, above it otherwise.
       *
       * Performance near 100% puts the dot at the top of the plot and its label straight into the
       * verdict line at y=24 — and "In the zone — near-peak performance" is exactly the state that
       * produces a near-100% reading, so the two collide precisely when both matter most. Judged on
       * the label's own y rather than on a percentage, so it holds if the plot is ever rescaled. */
      {
        type: 'text',
        x: xOf(baselineArousalPct),
        y: yOf(performancePct) - 10 < 44 ? yOf(performancePct) + 20 : yOf(performancePct) - 10,
        text: `${performancePct.toFixed(0)}%`,
        cls: 'valueLabel',
        anchor: 'middle',
        colorToken: 'brand',
        halo: 'panel',
      },

      { type: 'text', x: 42, y: 238, text: '0', cls: 'tickLabel' },
      { type: 'text', x: xOf(100), y: 238, text: 'arousal 100', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: 6, y: yOf(0) + 3, text: '0', cls: 'tickLabel' },
      { type: 'text', x: 6, y: yOf(100), text: '100', cls: 'tickLabel' },
    ],
  };
}

/** The reserve account: what the 7±2 working-memory ceiling is holding, the effort drawn from a
 * fatigue-eroded reserve, and how far task demand runs past the coverable line. */
function reserveFrame(ctx: Ctx): FrameNode {
  const { derived } = ctx;
  const { memoryOccupancyPct, effortActivePct, demandOvershootPct, cognitiveDemandPct } = derived;

  const filledBuckets = Math.min(9, Math.max(0, Math.round((memoryOccupancyPct / 100) * 9)));
  const bucketX = (i: number): number => 40 + i * 40;

  const barX = 40;
  const barW = 300;
  const demandX = barX + (cognitiveDemandPct / 100) * barW;
  const coverableX = barX + Math.max(0, (cognitiveDemandPct - demandOvershootPct) / 100) * barW;
  const overflowX = Math.max(barX, Math.min(coverableX, demandX));

  return {
    type: 'frame',
    key: 'cognition-reserve',
    viewBox: [0, 0, W, H],
    ariaLabel: 'Working memory as seven plus or minus two slots, the effort bar and the demand-versus-reserve line',
    children: [
      { type: 'text', x: 40, y: 28, text: 'working memory 7±2', cls: 'label' },
      { type: 'text', x: W - 100, y: 28, text: `${memoryOccupancyPct.toFixed(0)}% full`, cls: 'caption', anchor: 'end' },

      ...Array.from({ length: 9 }, (_, i) => ({
        type: 'rect' as const,
        x: bucketX(i),
        y: 40,
        width: 30,
        height: 48,
        fill: i < filledBuckets ? 'insulin' : 'panel',
        fillOpacity: i < filledBuckets ? 0.85 : 0.5,
        stroke: 'panel',
      })),
      { type: 'text', x: 40, y: 102, text: `${derived.memoryLoad} chunk(s) held of the 7±2 ceiling`, cls: 'caption' },

      { type: 'text', x: 40, y: 130, text: 'deployed effort', cls: 'label' },
      { type: 'rect', x: barX, y: 142, width: barW, height: 16, fill: 'panel', fillOpacity: 0.7 },
      { type: 'rect', x: barX, y: 142, width: (effortActivePct / 100) * barW, height: 16, fill: 'liver' },
      { type: 'text', x: barX + barW + 8, y: 154, text: `${effortActivePct.toFixed(0)}%`, cls: 'tickLabel' },

      { type: 'text', x: 40, y: 188, text: 'task demand vs reserve', cls: 'label' },
      { type: 'rect', x: barX, y: 200, width: barW, height: 16, fill: 'panel', fillOpacity: 0.7 },
      { type: 'rect', x: barX, y: 200, width: Math.max(overflowX - barX, 0), height: 16, fill: 'vq' },
      { type: 'rect', x: overflowX, y: 200, width: Math.max(demandX - overflowX, 0), height: 16, fill: 'danger' },
      { type: 'text', x: 40, y: 234, text: 'reserve line', cls: 'tickLabel' },
      { type: 'text', x: overflowX + 4, y: 234, text: demandOvershootPct > 0 ? `${demandOvershootPct.toFixed(0)}% overshoot` : 'within reserve', cls: 'tickLabel', colorToken: 'danger' },
      { type: 'text', x: W - 4, y: 234, text: 'demand', cls: 'tickLabel', anchor: 'end', colorToken: 'danger' },
    ],
  };
}

export function buildCognitionPresentation(ctx: Ctx): ModulePresentation<CognitionInternalState, CognitionDerived, CognitionInputs, CognitionHistoryPoint> {
  return {
    diagram: [yerkesFrame(ctx), reserveFrame(ctx)],
    controls: [
      { kind: 'slider', label: 'Working memory load', key: 'memoryLoad', min: 0, max: 7, step: 1, unit: ' chunks' },
      { kind: 'slider', label: 'Distraction', key: 'distractionLevelPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Fatigue', key: 'fatiguePct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Task demand', key: 'cognitiveDemandPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Arousal', key: 'baselineArousalPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Executive reserve', key: 'executiveReservePct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'Performance index',
        value: (c) => c.derived.performancePct.toFixed(0),
        unit: '%',
        colorToken: 'glucose',
        secondary: (c) => (c.derived.performancePct > 80 ? 'near the ceiling' : c.derived.performancePct < 35 ? 'well off the ceiling' : 'mid performance'),
      },
      {
        label: 'Working memory occupancy',
        value: (c) => c.derived.memoryOccupancyPct.toFixed(0),
        unit: '%',
        colorToken: 'insulin',
        secondary: (c) => `${c.derived.memoryLoad} chunk(s) held of the 7±2 ceiling`,
      },
      {
        label: 'Deployed effort',
        value: (c) => c.derived.effortActivePct.toFixed(0),
        unit: '%',
        colorToken: 'liver',
        secondary: (c) => (c.derived.effortActivePct < 30 ? 'reserve almost spent' : 'effort on the table'),
      },
      {
        label: 'Arousal optimality',
        value: (c) => (c.derived.arousalOptimality * 100).toFixed(0),
        unit: '%',
        colorToken: 'brand',
        secondary: (c) => (c.derived.arousalOptimality > 0.8 ? 'at this task\'s peak' : c.derived.arousalOptimality < 0.4 ? 'off this task\'s peak' : 'near this task\'s peak'),
      },
      {
        label: 'Demand overshoot',
        value: (c) => c.derived.demandOvershootPct.toFixed(0),
        unit: '%',
        colorToken: 'danger',
        secondary: (c) => (c.derived.demandOvershootPct > 25 ? 'past the cliff' : 'within the reserve'),
      },
      {
        label: 'Task optimum',
        value: (c) => c.derived.optimalArousal.toFixed(0),
        unit: '',
        colorToken: 'insulin',
        secondary: (c) => (c.derived.optimalArousal > 35 ? 'an easy task wants' : 'a hard task wants') + ' this much arousal',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Performance index',
        unit: '%',
        colorToken: 'glucose',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.performance),
      },
      {
        kind: 'sparkline',
        label: 'Deployed effort',
        unit: '%',
        colorToken: 'liver',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.effort),
      },
    ],
  };
}
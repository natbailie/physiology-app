import { clamp } from '@/shared/lib/math';
import type { CellCycleDerived, CellCycleHistoryPoint, CellCycleInputs, CellCycleInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/** Laid out on the house 560x440 canvas so this module sits on the same card, at the same
 *  size, as the other modules. */
const CENTER = { x: 280, y: 196 };
const RADIUS = 132;
const STROKE = 34;

/** Arc geometry for each phase, drawn clockwise from the top. G1 dominates the circle the
 *  way it dominates real time. */
const SEGMENTS: { phase: string; fraction: number; colorToken: string }[] = [
  { phase: 'G1', fraction: 11 / 24, colorToken: 'conduction-path' },
  { phase: 'S', fraction: 8 / 24, colorToken: 'o2' },
  { phase: 'G2', fraction: 4 / 24, colorToken: 'repolarizing' },
  { phase: 'M', fraction: 1 / 24, colorToken: 'danger' },
];

type Ctx = PresentationContext<CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint>;

function polar(angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CENTER.x + RADIUS * Math.cos(rad), y: CENTER.y + RADIUS * Math.sin(rad) };
}

function arcPath(startFrac: number, endFrac: number): string {
  const start = polar(startFrac * 360);
  const end = polar(endFrac * 360);
  const largeArc = endFrac - startFrac > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Marker angle: walk cumulative fractions to find where progress sits. */
function markerAngle(derived: CellCycleDerived): number {
  let walked = 0;
  for (const segment of SEGMENTS) {
    if (segment.phase === derived.phase) {
      return (walked + segment.fraction * derived.phaseProgress) * 360;
    }
    walked += segment.fraction;
  }
  return 0;
}

function arcLabelPos(index: number): { x: number; y: number } {
  let walk = 0;
  for (let i = 0; i < index; i++) walk += SEGMENTS[i]?.fraction ?? 0;
  walk += (SEGMENTS[index]?.fraction ?? 0) / 2;
  const mid = polar(walk * 360);
  return {
    x: CENTER.x + (mid.x - CENTER.x) * 1.34,
    y: CENTER.y + (mid.y - CENTER.y) * 1.34,
  };
}

/** Where a checkpoint sits on the ring, as a cumulative fraction of the cycle. */
const G1_S_BOUNDARY = 11 / 24;
const G2_M_BOUNDARY = 23 / 24;

/** A radial bar across the ring at one boundary — the gate itself, open or shut. */
function gateBar(boundaryFraction: number, closure: number, colorToken: string): SceneNode {
  const rad = ((boundaryFraction * 360 - 90) * Math.PI) / 180;
  const inner = RADIUS - STROKE / 2 - 4;
  const outer = RADIUS + STROKE / 2 + 4;
  return {
    type: 'path',
    d: `M ${(CENTER.x + inner * Math.cos(rad)).toFixed(1)} ${(CENTER.y + inner * Math.sin(rad)).toFixed(1)} L ${(CENTER.x + outer * Math.cos(rad)).toFixed(1)} ${(CENTER.y + outer * Math.sin(rad)).toFixed(1)}`,
    colorToken,
    strokeWidth: 1 + closure * 6,
    strokeLinecap: 'round',
    fill: 'none',
    opacity: 0.35 + closure * 0.65,
  };
}

export function buildCellCyclePresentation(ctx: Ctx): ModulePresentation<CellCycleInternalState, CellCycleDerived, CellCycleInputs, CellCycleHistoryPoint> {
  const { derived, inputs } = ctx;
  /* The checkpoints and the damage that closes them.
   *
   * The ring drew phase, progress and doubling time — all of them quantities that need whole
   * 24-hour cycles to move — so an irradiated cell, a p53-null one and a healthy one painted the
   * same ring at the moment the button was pressed. The dose and the machinery that answers it are
   * both known at time zero: `dnaDamage` is the insult given, `p53Function` is whether the cell can
   * respond to it, and the product is what shuts a gate. That is the module's whole teaching about
   * radiotherapy, and it was in the readouts only.
   */
  const damage = clamp(derived.dnaDamage / 100, 0, 1);
  const p53 = clamp(derived.p53Function / 100, 0, 1);
  const gateClosure = clamp(damage * p53, 0, 1);
  const spindleBlock = clamp(inputs.spindlePoisonPct / 100, 0, 1);
  const replicationBlock = clamp(inputs.replicationBlockPct / 100, 0, 1);
  const marker = polar(markerAngle(derived));
  const arrested = derived.arrestCause !== 'none';

  let acc = 0;
  const segments: SceneNode[] = SEGMENTS.map((segment) => {
    const start = acc;
    acc += segment.fraction;
    const isCurrent = derived.phase === segment.phase;
    return {
      type: 'path' as const,
      d: arcPath(start, acc),
      colorToken: segment.colorToken,
      fill: 'none',
      strokeWidth: isCurrent ? STROKE + 8 : STROKE,
      opacity: isCurrent ? 1 : 0.35,
    };
  });

  const labels: SceneNode[] = SEGMENTS.map((segment, index) => {
    const pos = arcLabelPos(index);
    return {
      type: 'text' as const,
      x: pos.x,
      y: pos.y + 4,
      text: segment.phase,
      cls: 'organLabel',
      anchor: 'middle',
    };
  });

  const children: SceneNode[] = [
    ...segments,
    ...labels,
    /* The two checkpoints, as gates on the ring at the boundaries they guard. A gate shuts in
     * proportion to damage TIMES p53 function — which is why a p53-null cell carries the same
     * lesions through an open gate, and why that is the hardest problem in radiotherapy. */
    gateBar(G1_S_BOUNDARY, gateClosure, 'danger'),
    gateBar(G2_M_BOUNDARY, gateClosure, 'danger'),
    /* The drugs, drawn on the phase each one acts in rather than only in their effect: a taxane
     * arrests in M and hydroxyurea in S, and both are present in the dish from the moment they are
     * given even though the population needs whole cycles to reach the phase they block. */
    ...(replicationBlock > 0 ? [gateBar(11 / 24 + (8 / 24) / 2, replicationBlock, 'o2')] : []),
    ...(spindleBlock > 0 ? [gateBar(23 / 24 + (1 / 24) / 2, spindleBlock, 'danger')] : []),
    /* The nucleus, with the lesions it is carrying. The dose is visible immediately; the load is
     * what accumulates. */
    { type: 'circle', cx: CENTER.x, cy: CENTER.y + 58, r: 22, fill: 'conduction-path', fillOpacity: 0.12, stroke: 'text-dim', strokeWidth: 1 },
    ...Array.from({ length: Math.round(damage * 6) }, (_, k) => {
      const angle = (k / 6) * Math.PI * 2 + 0.6;
      return {
        type: 'circle' as const,
        cx: CENTER.x + Math.cos(angle) * 12,
        cy: CENTER.y + 58 + Math.sin(angle) * 12,
        r: 2.4,
        fill: 'danger',
        fillOpacity: 0.85,
      };
    }),
    { type: 'text', x: CENTER.x, y: CENTER.y + 94, text: `p53 ${derived.p53ActivityPct.toFixed(0)}%`, cls: 'caption', anchor: 'middle' },
    { type: 'circle', cx: marker.x, cy: marker.y, r: 9, fill: 'panel' },
    { type: 'text', x: CENTER.x, y: CENTER.y - 6, text: derived.phase, cls: 'valueLabel', anchor: 'middle' },
    {
      type: 'text',
      x: CENTER.x,
      y: CENTER.y + 26,
      text: derived.doublingTimeH < 9998 ? `${derived.doublingTimeH.toFixed(0)} h doubling` : 'not cycling',
      cls: 'caption',
      anchor: 'middle',
    },
    {
      type: 'text',
      x: CENTER.x,
      y: 396,
      text: arrested ? `Arrested — ${derived.arrestCause}` : 'Cycling',
      cls: 'verdict',
      anchor: 'middle',
    },
  ];

  return {
    diagram: [
      {
        type: 'frame' as const,
        viewBox: [0, 0, 560, 440],
        ariaLabel: `Cell cycle ring showing the four phases, the cohort's current position (${derived.phase}, ${derived.phaseProgressPct.toFixed(0)}% through) and the active checkpoint`,
        children,
      },
    ],
    controls: [
      { kind: 'slider', label: 'Growth factor drive', key: 'growthFactorDrive', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Oncogenic drive (MYC-class)', key: 'oncogeneDrive', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'DNA damage', key: 'dnaDamage', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'p53 function', key: 'p53Function', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'RB1 function', key: 'rbFunction', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'CDK4/6 inhibitor', key: 'cdk46InhibitionPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Spindle poison (taxane)', key: 'spindlePoisonPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Replication blocker', key: 'replicationBlockPct', min: 0, max: 100, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'Current phase',
        value: (c) => c.derived.phase,
        secondary: (c) => `${(c.derived.phaseDurationH * (1 - c.derived.phaseProgress)).toFixed(1)} h remaining`,
        colorToken: 'o2',
      },
      {
        label: 'Cycling',
        value: (c) => c.derived.cyclingRatePct.toFixed(0),
        unit: '% of population',
        secondary: (c) => (c.derived.cyclingRatePct > 0 ? 'progressing normally' : 'halted at a checkpoint'),
        colorToken: 'conduction-path',
      },
      {
        label: 'Doubling time',
        value: (c) => (c.derived.doublingTimeH > 9998 ? '∞' : c.derived.doublingTimeH.toFixed(0)),
        unit: derived.doublingTimeH > 9998 ? undefined : 'h',
        secondary: (c) => (c.derived.doublingTimeH > 9998 ? 'no net proliferation' : 'at current pace'),
        colorToken: 'repolarizing',
      },
      {
        label: 'Cyclin D drive',
        value: (c) => c.derived.cyclinDDrivePct.toFixed(0),
        unit: '%',
        secondary: () => 'restriction-point signal',
        colorToken: 'potassium',
      },
      {
        label: 'p53 activity',
        value: (c) => c.derived.p53ActivityPct.toFixed(0),
        unit: '%',
        secondary: () => 'guardian engaged above damage threshold',
        colorToken: 'thermal',
      },
      {
        label: 'Lesion load',
        value: (c) => c.derived.lesionLoadPct.toFixed(0),
        unit: '%',
        secondary: (c) => `insult input ${(c.derived.dnaDamage * 100).toFixed(0)}%`,
        colorToken: 'danger',
      },
      {
        label: 'Apoptosis',
        value: (c) => c.derived.apoptoticFractionPct.toFixed(1),
        unit: '% of cohort',
        colorToken: 'fibrin',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Cycling population',
        unit: '%',
        colorToken: 'conduction-path',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.cyclingRatePct),
      },
      {
        kind: 'sparkline',
        label: 'Lesion load',
        unit: '%',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.lesionLoadPct),
      },
    ],
  };
}

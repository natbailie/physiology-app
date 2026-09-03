import { clamp } from '@/shared/lib/math';
import type { HypersensitivityDerived, HypersensitivityHistoryPoint, HypersensitivityInputs, HypersensitivityState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/** An SVG arc path that draws an unfilled circle outline — what the legacy stroked cell body
 * drew, since the shared schema's CircleNode has no stroke of its own. */
function circleOutline(cx: number, cy: number, r: number): string {
  return `M${(cx - r).toFixed(1)},${cy} a${r},${r} 0 1,0 ${(2 * r).toFixed(1)},0 a${r},${r} 0 1,0 ${(-2 * r).toFixed(1)},0`;
}

type Ctx = PresentationContext<HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint>;

/* --- Reaction timeline: the four arms on a logarithmic time axis --- */
/* A type I reaction peaks in minutes and a type IV in days — three orders of magnitude apart,
 * and no linear axis can show both. Compressing the axis logarithmically puts the comparison
 * this module exists to teach in one picture. */

const PLOT = { left: 46, right: 452, top: 40, bottom: 196 };
const MIN_HOURS = 0.1;
const MAX_HOURS = 120;
const LOG_MIN = Math.log10(MIN_HOURS);
const LOG_MAX = Math.log10(MAX_HOURS);

const TICKS: { hours: number; label: string }[] = [
  { hours: 0.17, label: '10 min' },
  { hours: 0.5, label: '30 min' },
  { hours: 1, label: '1 h' },
  { hours: 6, label: '6 h' },
  { hours: 24, label: '1 day' },
  { hours: 72, label: '3 days' },
];

const ARMS = [
  { key: 'typeI' as const, label: 'I · mast cell', colorToken: 'ige' },
  { key: 'typeII' as const, label: 'II · anti-cell Ab', colorToken: 'cytotoxic-ab' },
  { key: 'typeIII' as const, label: 'III · complexes', colorToken: 'immune-complex' },
  { key: 'typeIV' as const, label: 'IV · T cell', colorToken: 'delayed-type' },
];

function projectXLog(hours: number): number {
  const t = (Math.log10(clamp(hours, MIN_HOURS, MAX_HOURS)) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return PLOT.left + t * (PLOT.right - PLOT.left);
}

function projectY(activity: number): number {
  return PLOT.bottom - clamp(activity, 0, 1) * (PLOT.bottom - PLOT.top);
}

function armPath(key: 'typeI' | 'typeII' | 'typeIII' | 'typeIV', points: readonly HypersensitivityHistoryPoint[]): string {
  return points
    .filter((point) => point.hoursSinceChallenge > 0)
    .map((point, index) => {
      const x = projectXLog(point.hoursSinceChallenge);
      const y = projectY(point[key]);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function onsetLabel(onsetHours: number): string {
  if (onsetHours < 0) return '—';
  if (onsetHours < 1) return `${Math.round(onsetHours * 60)} min`;
  if (onsetHours < 48) return `${onsetHours.toFixed(1)} h`;
  return `${(onsetHours / 24).toFixed(1)} d`;
}

const MECHANISM_LABEL: Record<string, string> = {
  I: 'Type I',
  II: 'Type II',
  III: 'Type III',
  IV: 'Type IV',
  none: 'No reaction',
};

const NON_IMMUNE_LABEL: Record<string, string> = {
  'volume overload': 'Not immune — overload',
  'capillary leak': 'Not immune — leaky lung',
  'stored cytokines': 'Not immune — cytokines',
};

const MECHANISM_COLOUR: Record<string, string> = {
  I: 'ige',
  II: 'cytotoxic-ab',
  III: 'immune-complex',
  IV: 'delayed-type',
  none: 'ok',
};

export function buildHypersensitivityPresentation(ctx: Ctx): ModulePresentation<HypersensitivityState, HypersensitivityDerived, HypersensitivityInputs, HypersensitivityHistoryPoint> {
  const { derived, history } = ctx;

  const nowRunning = derived.hoursSinceChallenge >= 0;
  const nowX = nowRunning ? projectXLog(Math.max(derived.hoursSinceChallenge, MIN_HOURS)) : 0;

  const graph: FrameNode = {
    type: 'frame',
    key: 'hypersensitivity-timeline',
    viewBox: [0, 0, 480, 300],
    ariaLabel: `Reaction timeline on a logarithmic time axis showing the activity of all four hypersensitivity arms since the challenge. ${derived.mechanismSummary}`,
    children: [
      { type: 'text', x: 22, y: 11, text: 'Reaction timeline · log time since challenge', cls: 'pathLabel' },
      ...[0, 0.5, 1].map((level) => {
        const y = projectY(level);
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, colorToken: 'grid-line' },
            { type: 'text' as const, x: PLOT.left - 14, y: y + 3, text: `${Math.round(level * 100)}`, cls: 'tickLabel', anchor: 'end' as const },
          ],
        };
      }),
      ...TICKS.map((tick) => {
        const x = projectXLog(tick.hours);
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: x, y1: PLOT.top, x2: x, y2: PLOT.bottom, colorToken: 'grid-line' },
            { type: 'text' as const, x, y: PLOT.bottom + 14, text: tick.label, cls: 'tickLabel', anchor: 'middle' as const },
          ],
        };
      }),
      { type: 'line', x1: PLOT.left, y1: PLOT.bottom, x2: PLOT.right, y2: PLOT.bottom, cls: 'axis', colorToken: 'text-faint' },
      { type: 'line', x1: PLOT.left, y1: PLOT.top, x2: PLOT.left, y2: PLOT.bottom, cls: 'axis', colorToken: 'text-faint' },
      { type: 'text', x: PLOT.left - 26, y: PLOT.top + 6, text: '%', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: projectXLog(0.3), y: PLOT.top - 6, text: 'minutes', cls: 'tickLabel', anchor: 'middle' as const, colorToken: 'ige' },
      { type: 'text', x: projectXLog(4), y: PLOT.top - 6, text: 'hours', cls: 'tickLabel', anchor: 'middle' as const, colorToken: 'cytotoxic-ab' },
      { type: 'text', x: projectXLog(50), y: PLOT.top - 6, text: 'days', cls: 'tickLabel', anchor: 'middle' as const, colorToken: 'delayed-type' },
      ...ARMS.map((arm) => {
        const d = armPath(arm.key, history);
        return d
          ? { type: 'path' as const, d, colorToken: arm.colorToken, strokeWidth: 2, fill: 'none' }
          : null;
      }).filter((n): n is NonNullable<typeof n> => n !== null),
      ...(nowRunning
        ? [
            { type: 'line' as const, x1: nowX, y1: PLOT.top, x2: nowX, y2: PLOT.bottom, colorToken: 'text-dim' },
            {
              type: 'text' as const,
              x: nowX,
              y: PLOT.top - 18,
              text: derived.hoursSinceChallenge < 1 ? `${Math.round(derived.hoursSinceChallenge * 60)} min` : `${derived.hoursSinceChallenge.toFixed(0)} h`,
              cls: 'tickLabel',
              anchor: 'middle' as const,
              colorToken: 'text-dim',
            },
          ]
        : []),
      ...ARMS.map((arm, index) => ({
        type: 'group' as const,
        children: [
          { type: 'line' as const, x1: 26 + index * 116, y1: 228, x2: 44 + index * 116, y2: 228, colorToken: arm.colorToken },
          { type: 'text' as const, x: 48 + index * 116, y: 231, text: arm.label, cls: 'pathLabel', anchor: 'start' as const },
        ],
      })),
      { type: 'text', x: 22, y: 258, text: derived.mechanismSummary, cls: 'verdict' },
      {
        type: 'text',
        x: 22,
        y: 276,
        text: `injury ${(derived.tissueInjury * 100).toFixed(0)}% · peak ${(derived.peakInjury * 100).toFixed(0)}% · temp ${derived.temperatureC.toFixed(1)}°C · MAP ${derived.meanArterialPressureMmHg.toFixed(0)} mmHg`,
        cls: 'valueLabel',
      },
      {
        type: 'text',
        x: 22,
        y: 292,
        text: `tryptase ${derived.tryptaseNgMl.toFixed(0)} · C3 ${derived.c3MgDl.toFixed(0)} · C4 ${derived.c4MgDl.toFixed(0)} · Coombs ${derived.directCoombs > 0.25 ? 'positive' : 'negative'}`,
        cls: 'valueLabel',
      },
    ],
  };

  const i = derived.armActivity.I;

  const mastCellChildren: readonly SceneNode[] = [
    { type: 'path', d: circleOutline(60, 78, 30), colorToken: 'ige', strokeWidth: 2, fill: 'none' },
    ...Array.from({ length: 5 }, (_, k) => {
      const angle = (k / 5) * Math.PI * 2;
      const spread = 1 + i * 1.6;
      return {
        type: 'circle' as const,
        cx: 60 + Math.cos(angle) * 14 * spread,
        cy: 78 + Math.sin(angle) * 14 * spread,
        r: 3.2,
        fill: 'ige',
        styleVars: { 'opacity': clamp(0.4 + i * 0.6, 0, 1) },
      };
    }),
  ];

  const targetCellChildren: readonly SceneNode[] = [
    { type: 'path', d: circleOutline(180, 78, 30), colorToken: 'cytotoxic-ab', strokeWidth: 2, fill: 'none' },
    ...[-1, 0, 1].map((k) => ({
      type: 'path' as const,
      d: `M${180 + k * 18},${48 - 10} l-5,10 m5,-10 l5,10 m-5,0 v6`,
      colorToken: 'cytotoxic-ab',
      strokeWidth: 1.6,
      fill: 'none',
      styleVars: { 'opacity': clamp(0.25 + derived.boundToCellSurface * 0.75, 0, 1) },
    })),
  ];

  const complexChildren: readonly SceneNode[] = [
    { type: 'path', d: 'M270,52 h60 v52 h-60 z', colorToken: 'immune-complex', strokeWidth: 2, fill: 'none' },
    ...[0, 1, 2, 3, 4, 5].map((k) => ({
      type: 'circle' as const,
      cx: 276 + (k % 3) * 24,
      cy: 62 + Math.floor(k / 3) * 30,
      r: 2.6 + derived.immuneComplexDeposition * 2.4,
      fill: 'immune-complex',
      styleVars: { 'opacity': clamp(0.2 + derived.immuneComplexDeposition * 0.8, 0, 1) },
    })),
  ];

  const tissueChildren: readonly SceneNode[] = [
    { type: 'path', d: 'M390,52 h60 v52 h-60 z', colorToken: 'delayed-type', strokeWidth: 2, fill: 'none' },
    ...[0, 1, 2, 3, 4].map((k) => {
      const arrive = derived.tCellRecruitment;
      return {
        type: 'circle' as const,
        cx: 396 + k * 13,
        cy: 78 - (1 - arrive) * 26,
        r: 3.4,
        fill: 'delayed-type',
        styleVars: { 'opacity': clamp(0.25 + arrive * 0.75, 0, 1) },
      };
    }),
  ];

  const mechanisms: FrameNode = {
    type: 'frame',
    key: 'hypersensitivity-mechanisms',
    viewBox: [0, 0, 480, 220],
    ariaLabel: `The four hypersensitivity mechanisms, each shaded by how much of the current injury it is causing. Dominant mechanism: ${derived.mechanismSummary}`,
    children: [
      { type: 'text', x: 60, y: 26, text: 'Type I', cls: 'anatomyStrong', anchor: 'middle' },
      ...mastCellChildren,
      { type: 'text', x: 60, y: 128, text: 'preformed granules', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 60, y: 140, text: 'minutes', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 60, y: 158, text: `wheal ${derived.whealMm.toFixed(0)} mm`, cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 60, y: 170, text: `tryptase ${derived.tryptaseNgMl.toFixed(0)}`, cls: 'caption', anchor: 'middle' },

      { type: 'text', x: 180, y: 26, text: 'Type II', cls: 'anatomyStrong', anchor: 'middle' },
      ...targetCellChildren,
      { type: 'text', x: 180, y: 128, text: 'antigen ON the cell', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 180, y: 140, text: 'hours', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 180, y: 158, text: `Coombs ${derived.directCoombs > 0.25 ? 'positive' : 'negative'}`, cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 180, y: 170, text: `hapto ${derived.haptoglobinMgDl.toFixed(0)}`, cls: 'caption', anchor: 'middle' },

      { type: 'text', x: 300, y: 26, text: 'Type III', cls: 'anatomyStrong', anchor: 'middle' },
      ...complexChildren,
      { type: 'text', x: 300, y: 128, text: 'antigen IN the plasma', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 300, y: 140, text: 'hours to days', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 300, y: 158, text: `C3 ${derived.c3MgDl.toFixed(0)} · C4 ${derived.c4MgDl.toFixed(0)}`, cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 300, y: 170, text: 'Coombs negative', cls: 'caption', anchor: 'middle' },

      { type: 'text', x: 420, y: 26, text: 'Type IV', cls: 'anatomyStrong', anchor: 'middle' },
      ...tissueChildren,
      { type: 'text', x: 420, y: 128, text: 'no antibody at all', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 420, y: 140, text: 'days', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 420, y: 158, text: `induration ${derived.indurationMm.toFixed(0)} mm`, cls: 'caption', anchor: 'middle' },
      { type: 'text', x: 420, y: 170, text: 'C3 / C4 normal', cls: 'caption', anchor: 'middle' },

      { type: 'text', x: 22, y: 198, text: 'Same antigen, same host, four different injuries — the difference is which arm answers', cls: 'pathLabel' },
      { type: 'text', x: 22, y: 212, text: `Antigen: soluble ${(derived.solubleAntigen * 100).toFixed(0)}% · fixed to tissue ${(derived.fixedAntigen * 100).toFixed(0)}%`, cls: 'pathLabel' },
    ],
  };

  return {
    diagram: [graph, mechanisms],
    controls: [
      { kind: 'slider', label: 'Antigen dose', key: 'antigenDose', min: 0, max: 200, step: 5, unit: '%' },
      { kind: 'slider', label: 'IgE sensitisation (type I)', key: 'igeSensitisation', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'IgG vs cell surface (type II)', key: 'iggAgainstCellSurface', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'IgG for complexes (type III)', key: 'circulatingIggForComplexes', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Sensitised T cells (type IV)', key: 'sensitisedTCells', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Complement function', key: 'complementFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Mast cell / histamine blockade', key: 'mastCellStabilisation', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'ABO compatibility', key: 'aboCompatibility', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Recipient IgA deficiency', key: 'recipientIgaDeficiency', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Product leukocyte load', key: 'productLeukocyteLoad', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Donor anti-leukocyte antibody', key: 'donorAntileukocyteAntibody', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Anamnestic recall (minor antigen)', key: 'anamnesticRecall', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Cardiac / renal reserve', key: 'cardiacReserve', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      { label: 'Onset', value: (c) => onsetLabel(c.derived.onsetHours), colorToken: 'text' },
      { label: 'Tissue injury', value: (c) => (c.derived.tissueInjury * 100).toFixed(0), unit: '%', colorToken: 'danger' },
      { label: 'Tryptase', value: (c) => c.derived.tryptaseNgMl.toFixed(0), unit: 'ng/mL', colorToken: 'ige' },
      { label: 'C3 / C4', value: (c) => `${c.derived.c3MgDl.toFixed(0)} / ${c.derived.c4MgDl.toFixed(0)}`, unit: 'mg/dL', colorToken: 'complement' },
      { label: 'Direct Coombs', value: (c) => (c.derived.directCoombs > 0.25 ? 'Positive' : 'Negative'), colorToken: 'cytotoxic-ab' },
      { label: 'Haptoglobin', value: (c) => c.derived.haptoglobinMgDl.toFixed(0), unit: 'mg/dL', colorToken: 'cytotoxic-ab' },
      { label: 'Temperature', value: (c) => c.derived.temperatureC.toFixed(1), unit: '°C', colorToken: 'warn' },
      { label: 'Haemoglobin', value: (c) => c.derived.haemoglobinGDl.toFixed(1), unit: 'g/dL', colorToken: 'hemoglobin' },
      { label: 'SaO2', value: (c) => c.derived.saO2Percent.toFixed(0), unit: '%', colorToken: 'o2' },
      {
        label: 'BNP',
        value: (c) => c.derived.bnpPgMl.toFixed(0),
        unit: 'pg/mL',
        secondary: (c) => (c.derived.bnpPgMl > 150 ? 'stretched ventricle — volume' : 'ventricle not loaded'),
        colorToken: 'artery',
      },
      { label: 'Mean arterial pressure', value: (c) => c.derived.meanArterialPressureMmHg.toFixed(0), unit: 'mmHg', colorToken: 'artery' },
      {
        label: 'Wheal / induration',
        value: (c) => `${c.derived.whealMm.toFixed(0)} / ${c.derived.indurationMm.toFixed(0)}`,
        unit: 'mm',
        secondary: () => 'soft & immediate vs firm & delayed',
        colorToken: 'ige',
      },
      {
        label: 'Mechanism',
        value: (c) =>
          c.derived.dominantMechanism === 'none' && c.derived.nonImmuneCause
            ? NON_IMMUNE_LABEL[c.derived.nonImmuneCause] ?? 'No reaction'
            : MECHANISM_LABEL[c.derived.dominantMechanism] ?? 'No reaction',
        secondary: (c) => c.derived.mechanismSummary,
        colorToken:
          derived.dominantMechanism === 'none' && derived.nonImmuneCause
            ? 'warn'
            : (MECHANISM_COLOUR[derived.dominantMechanism] ?? 'ok'),
        wide: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'Tissue injury', unit: '%', colorToken: 'danger', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.tissueInjury * 100) },
      { kind: 'sparkline', label: 'Type I activity', unit: '%', colorToken: 'ige', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.typeI * 100) },
      { kind: 'sparkline', label: 'Type IV activity', unit: '%', colorToken: 'delayed-type', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.typeIV * 100) },
    ],
  };
}

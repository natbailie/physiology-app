import { clamp } from '@/shared/lib/math';
import type { AdrenalCortexDerived, AdrenalCortexHistoryPoint, AdrenalCortexInputs, AdrenalCortexInternalState } from './engine/types';
import { LABEL_WASH } from '@/shared/presentation/types';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

type Ctx = PresentationContext<AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint>;

/** A rectangle drawn as a path so it can carry a stroke colour, width and rounded corners —
 * the RectNode type has no stroke/rx, and the frame/enzyme outlines need them. */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${x + rr},${y}`,
    `H${x + w - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w},${y + rr}`,
    `V${y + h - rr}`,
    `A${rr},${rr} 0 0 1 ${x + w - rr},${y + h}`,
    `H${x + rr}`,
    `A${rr},${rr} 0 0 1 ${x},${y + h - rr}`,
    `V${y + rr}`,
    `A${rr},${rr} 0 0 1 ${x + rr},${y}`,
    'Z',
  ].join(' ');
}

const ENZYMES = [
  { name: '3β-HSD', key: 'block3bhsdPct', x: 96 },
  { name: '17α', key: 'block17Pct', x: 176 },
  { name: '21-OH', key: 'block21Pct', x: 256 },
  { name: '11β', key: 'block11Pct', x: 336 },
] as const;

export function buildAdrenalCortexPresentation(ctx: Ctx): ModulePresentation<AdrenalCortexInternalState, AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexHistoryPoint> {
  const { derived, inputs } = ctx;
  const cortisolPct = clamp(derived.effectiveCortisol / 150, 0, 1);
  const mcPct = clamp(derived.mineralocorticoidActivity / 200, 0, 1);
  const androPct = clamp(derived.androgens / 300, 0, 1);

  const zoneRows = [
    { label: 'Cortisol (ZF)', value: cortisolPct, text: derived.effectiveCortisol.toFixed(0), y: 158, colorToken: 'cortisol' },
    { label: 'Aldosterone + DOC (ZG)', value: mcPct, text: derived.mineralocorticoidActivity.toFixed(0), y: 196, colorToken: 'raas' },
    { label: 'Androgens (ZR)', value: androPct, text: derived.androgens.toFixed(0), y: 234, colorToken: 'lh' },
  ];

  const enzymeNodes: SceneNode[] = ENZYMES.map(({ name, key, x }) => {
    const block = inputs[key];
    const blocked = block >= 50;
    const labelX = x + (name.length > 4 ? 8 : 14);
    return {
      type: 'group' as const,
      children: [
        {
          type: 'path' as const,
          d: roundedRect(x, 68, 62, 32, 6),
          /* Opaque, not `none`. Each enzyme is a station ON the steroidogenic spine, and that
             spine is one straight line at y=84 — so with a transparent box it ran through the
             middle of all four enzyme names. Filled in the panel colour the box occludes it and
             reads as a gate on the pathway, which is what it is. Blocked, it is the same box
             washed in danger rather than filled solid, so the name on it stays readable. */
          fill: blocked ? 'danger' : 'panel',
          fillOpacity: blocked ? LABEL_WASH : 1,
          colorToken: blocked ? 'danger' : 'text-dim',
          strokeWidth: blocked ? 2 : 1.5,
        },
        {
          type: 'text' as const,
          x: labelX,
          y: 88,
          text: block >= 5 ? `${name} ${block.toFixed(0)}%` : name,
          cls: 'caption',
        },
      ],
    };
  });

  const zoneBars: SceneNode[] = zoneRows.flatMap((row) => [
    {
      type: 'text' as const,
      x: 44,
      y: row.y - 4,
      text: `${row.label} · ${row.text}`,
      cls: 'caption',
    },
    {
      type: 'path' as const,
      d: roundedRect(330, row.y, 190, 16, 4),
      fill: 'none',
      colorToken: 'panel-border',
      strokeWidth: 1,
    },
    {
      type: 'rect' as const,
      x: 330,
      y: row.y,
      width: 190 * row.value,
      height: 16,
      fill: row.colorToken,
    },
  ]);

  const alarmText = derived.saltWasting
    ? 'Salt-wasting — mineralocorticoid collapse'
    : derived.addisonianCrisisRiskPct > 50
      ? `Crisis risk ${derived.addisonianCrisisRiskPct.toFixed(0)}% — cortisol insufficient`
      : 'DOC-driven hypertension';
  const showAlarm = derived.saltWasting || derived.hypertensionFromDoc || derived.addisonianCrisisRiskPct > 50;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Steroidogenesis pathway with enzyme blocks and zone output fluxes',
        children: [
          {
            type: 'text',
            x: 40,
            y: 44,
            text: `Steroidogenic pathway · ACTH ×${(derived.acthEffectivePct / 100).toFixed(1)}`,
            cls: 'label',
          },
          { type: 'path', d: 'M 52 84 H 428', colorToken: 'cortisol', strokeWidth: 2 },
          ...enzymeNodes,
          { type: 'text', x: 44, y: 132, text: 'Zone outputs (relative to normal)', cls: 'label' },
          ...zoneBars,
          {
            type: 'text',
            x: 44,
            y: 292,
            text: `17-OHP marker ${derived.marker17ohp.toFixed(0)} · DOC excess ${derived.docExcess.toFixed(0)}`,
            cls: 'caption',
          },
          ...(showAlarm
            ? [{ type: 'text' as const, x: 44, y: 312, text: alarmText, cls: 'alarm' }]
            : []),
          { type: 'text', x: 44, y: 352, text: derived.classification, cls: 'verdict' },
          { type: 'text', x: 44, y: 374, text: derived.patternSummary, cls: 'caption' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'ACTH drive', key: 'acthDrivePct', min: 0, max: 200, step: 5, unit: '%' },
      { kind: 'slider', label: '21-hydroxylase block', key: 'block21Pct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: '11β-hydroxylase block', key: 'block11Pct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: '17α-hydroxylase block', key: 'block17Pct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: '3β-HSD block', key: 'block3bhsdPct', min: 0, max: 100, step: 1, unit: '%' },
      { kind: 'slider', label: 'Replacement therapy', key: 'replacementTherapyPct', min: 0, max: 100, step: 1, unit: '%' },
    ],
    readouts: [
      {
        label: 'Cortisol',
        value: (c) => c.derived.effectiveCortisol.toFixed(0),
        unit: '% of normal',
        secondary: (c) => `endogenous ${c.derived.endogenousCortisol.toFixed(0)}${c.derived.effectiveCortisol > c.derived.endogenousCortisol + 5 ? ' (+replacement)' : ''}`,
        colorToken: 'cortisol',
      },
      {
        label: 'Mineralocorticoid',
        value: (c) => c.derived.mineralocorticoidActivity.toFixed(0),
        unit: '% of normal',
        secondary: (c) =>
          c.derived.saltWasting
            ? 'Salt-wasting'
            : c.derived.hypertensionFromDoc
              ? 'DOC-driven hypertension'
              : 'aldosterone carrying the zone',
        colorToken: 'raas',
      },
      {
        label: 'Androgens',
        value: (c) => c.derived.androgens.toFixed(0),
        unit: '% of normal',
        secondary: (c) =>
          c.derived.androgens > 150 ? 'diverted excess — virilisation' : c.derived.androgens < 40 ? 'absent — undervirilisation' : 'normal flux',
        colorToken: 'lh',
      },
      {
        label: '17-OHP marker',
        value: (c) => c.derived.marker17ohp.toFixed(0),
        secondary: (c) => (c.derived.marker17ohp > 100 ? 'piled up before 21-OH block' : 'not accumulating'),
        colorToken: 'pth',
      },
      {
        label: 'DOC excess',
        value: (c) => c.derived.docExcess.toFixed(0),
        secondary: (c) => (c.derived.hypertensionFromDoc ? 'weak MC, strong pressure' : 'clearing normally'),
        colorToken: 'danger',
      },
      {
        label: 'ACTH drive',
        value: (c) => c.derived.acthEffectivePct.toFixed(0),
        unit: '%',
        setPoint: (c) => c.inputs.acthDrivePct,
        secondary: (c) => (c.derived.acthEffectivePct > 140 ? 'flogging a blocked gland' : 'feedback intact'),
        colorToken: 'acth',
      },
      {
        label: 'Crisis risk',
        value: (c) => c.derived.addisonianCrisisRiskPct.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.addisonianCrisisRiskPct > 50 ? 'steroid cover inadequate' : 'covered'),
        colorToken: 'danger',
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
      {
        kind: 'sparkline',
        label: 'Cortisol (effective)',
        unit: '% normal',
        colorToken: 'cortisol',
        domainMin: 0,
        domainMax: 150,
        data: (points) => points.map((p) => p.cortisol),
      },
      {
        kind: 'sparkline',
        label: 'Androgens',
        unit: '% normal',
        colorToken: 'lh',
        domainMin: 0,
        domainMax: 400,
        data: (points) => points.map((p) => p.androgens),
      },
      {
        kind: 'sparkline',
        label: 'Mineralocorticoid activity',
        unit: '% normal',
        colorToken: 'raas',
        domainMin: 0,
        domainMax: 200,
        data: (points) => points.map((p) => p.mcActivity),
      },
    ],
  };
}

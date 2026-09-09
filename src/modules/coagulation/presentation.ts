import { clamp } from '@/shared/lib/math';
import type { CoagDerived, CoagHistoryPoint, CoagInputs, CoagState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<CoagState, CoagDerived, CoagInputs, CoagHistoryPoint>;

/** Fibrin strands laid across the platelet plug — drawn at fixed offsets so the mesh appears
 * to thicken rather than jitter as the level rises (mirrors the hand-written diagram). */
const FIBRIN_STRANDS = [
  'M-26,-8 L26,-2',
  'M-24,2 L24,8',
  'M-18,-12 L20,10',
  'M-20,10 L22,-10',
  'M-12,-14 L12,14',
];

interface CascadeNodeSpec {
  label: string;
  color: string;
  cx: number;
  cy: number;
  level: (d: CoagDerived) => number;
}

/**
 * The cascade as a ladder: two limbs converging on a shared common pathway. Node brightness
 * tracks activation, so which limb is carrying the reaction — and where a deficiency has broken
 * it — is visible at a glance. Geometry is computed from `derived` at build time so the graph
 * moves each frame without needing module CSS.
 */
const CASCADE_NODES: CascadeNodeSpec[] = [
  // Extrinsic limb (PT).
  { label: 'TF·VIIa', color: 'artery', cx: -46, cy: 0, level: (d) => d.tissueFactorExposure },
  // Intrinsic limb (APTT) — shows ACTIVATION, not merely available factor: the tenase complex
  // only assembles once thrombin has begun amplifying it.
  {
    label: 'VIIIa·IXa',
    color: 'o2',
    cx: 46,
    cy: 0,
    level: (d) => clamp((d.factorVIIIActivity / 100) * (d.factorIXActivity / 100) * clamp(d.thrombin * 2, 0, 1), 0, 1),
  },
  // Common pathway.
  { label: 'Xa', color: 'platelet', cx: 0, cy: 40, level: (d) => d.factorXa },
  { label: 'Thrombin', color: 'thrombin', cx: 0, cy: 76, level: (d) => d.thrombin },
  { label: 'Fibrin', color: 'fibrin', cx: 0, cy: 112, level: (d) => d.fibrin },
];

export function buildCoagulationPresentation(ctx: Ctx): ModulePresentation<CoagState, CoagDerived, CoagInputs, CoagHistoryPoint> {
  const { derived } = ctx;
  const plug = clamp(derived.plateletPlug, 0, 1);
  const fibrin = clamp(derived.fibrin, 0, 1);
  const injury = clamp(derived.tissueFactorExposure, 0, 1);
  const thrombin = clamp(derived.thrombin, 0, 1);

  const nodes = CASCADE_NODES.map((node) => {
    const level = clamp(node.level(derived), 0, 1);
    const { cx, cy } = node;
    // Radius carries activation — a dark, shrunken node is a broken limb, a large glowing one
    // is carrying the reaction.
    const r = Math.max(4 + level * 9, 1);
    return {
      type: 'group' as const,
      transform: `translate(${cx}, ${cy})`,
      children: [
        {
          type: 'circle' as const,
          cx: 0,
          cy: 0,
          r,
          fill: node.color,
        },
        {
          type: 'text' as const,
          x: 0,
          y: 27,
          text: node.label,
          anchor: 'middle' as const,
          colorToken: 'text',
        },
      ],
    };
  });

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Diagram of haemostasis: an injured vessel wall with a platelet plug and fibrin mesh forming, alongside the coagulation cascade showing the extrinsic and intrinsic limbs converging on thrombin',
        children: [
          // --- Injured vessel ---
          { type: 'text', x: 116, y: 38, text: 'Injured vessel', cls: 'organLabel', anchor: 'middle' },
          // Upper wall.
          { type: 'path', d: 'M30,62 L202,62', colorToken: 'artery', strokeWidth: 3 },
          // Lower wall, broken at the injury site.
          { type: 'path', d: 'M30,124 L96,124', colorToken: 'artery', strokeWidth: 3 },
          { type: 'path', d: 'M136,124 L202,124', colorToken: 'artery', strokeWidth: 3 },
          // The breach in the wall, which narrows as the clot seals it.
          {
            type: 'path',
            d: 'M96,124 L104,136 M116,136 L124,124',
            colorToken: 'danger',
            strokeWidth: Math.max(0.2, injury * 3),
          },
          { type: 'text', x: 116, y: 152, text: 'breach', anchor: 'middle', colorToken: 'danger', opacity: Math.max(0, injury) },
          // Platelet plug sealing the breach, with the fibrin mesh forming across it.
          {
            type: 'group',
            transform: `translate(116, 118)`,
            children: [
              // The plug as a flattened disc (an ellipse in the legacy drawing). It scales up as
              // platelets collect.
              {
                type: 'group',
                transform: `scale(${0.15 + plug * 0.85}, ${(0.15 + plug * 0.85) * 0.5})`,
                children: [{ type: 'circle', cx: 0, cy: 0, r: 30, fill: 'platelet' }],
              },
              // Fibrin strands appear across the plug as the mesh is laid down; their width
              // thickens with the fibrin level.
              ...FIBRIN_STRANDS.map((d) => ({
                type: 'path' as const,
                d,
                colorToken: 'fibrin',
                strokeWidth: Math.max(0.05, fibrin * 1.4),
              })),
            ],
          },
          {
            type: 'text',
            x: 30,
            y: 182,
            text: `Plug ${(derived.plateletPlug * 100).toFixed(0)}% · Fibrin ${(derived.fibrin * 100).toFixed(0)}%`,
            cls: 'valueLabel',
          },
          {
            type: 'text',
            x: 30,
            y: 198,
            text: `Clot strength ${(derived.clotStrength * 100).toFixed(0)}%`,
            cls: 'valueLabel',
          },
          {
            type: 'text',
            x: 30,
            y: 222,
            text: derived.isBleeding
              ? 'Bleeding'
              : derived.timeToClotSeconds > 0
                ? `Sealed in ${derived.timeToClotSeconds.toFixed(0)}s`
                : 'Intact',
            cls: 'valueLabel',
            colorToken: derived.isBleeding ? 'danger' : 'ok',
          },

          // --- Cascade ladder ---
          {
            type: 'group',
            transform: 'translate(330, 68)',
            children: [
              // 15 units apart, not 12: at 12 the two lines of each pair touched.
              { type: 'text', x: -46, y: -28, text: 'Extrinsic', anchor: 'middle', colorToken: 'text-dim' },
              { type: 'text', x: -46, y: -13, text: '(PT)', anchor: 'middle', colorToken: 'text-faint' },
              { type: 'text', x: 46, y: -28, text: 'Intrinsic', anchor: 'middle', colorToken: 'text-dim' },
              { type: 'text', x: 46, y: -13, text: '(APTT)', anchor: 'middle', colorToken: 'text-faint' },

              // Both limbs converge on factor Xa.
              {
                type: 'path',
                d: 'M-46,10 L-6,32',
                colorToken: derived.factorXa > 0.1 ? 'thrombin' : 'text-faint',
                strokeWidth: derived.factorXa > 0.1 ? 1.6 : 1.2,
              },
              {
                type: 'path',
                d: 'M46,10 L6,32',
                colorToken: derived.factorXa > 0.1 ? 'thrombin' : 'text-faint',
                strokeWidth: derived.factorXa > 0.1 ? 1.6 : 1.2,
              },
              {
                type: 'path',
                d: 'M0,50 L0,66',
                colorToken: derived.thrombin > 0.1 ? 'thrombin' : 'text-faint',
                strokeWidth: derived.thrombin > 0.1 ? 1.6 : 1.2,
              },
              {
                type: 'path',
                d: 'M0,86 L0,102',
                colorToken: derived.fibrin > 0.1 ? 'thrombin' : 'text-faint',
                strokeWidth: derived.fibrin > 0.1 ? 1.6 : 1.2,
              },

              // Thrombin's positive feedback onto the upstream cofactors — the explosive burst.
              {
                type: 'path',
                d: 'M12,76 C56,64 62,26 52,10',
                colorToken: 'thrombin',
                strokeWidth: Math.max(0.1, 1.6 * (0.15 + thrombin * 0.85)),
                styleVars: { 'thrombin-level': thrombin },
              },
              {
                type: 'text',
                x: 74,
                y: 48,
                text: 'amplify',
                anchor: 'middle',
                colorToken: 'thrombin',
                opacity: 0.35 + thrombin * 0.65,
              },

              ...nodes,
            ],
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Factor VIII', key: 'factorVIIIActivity', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Factor IX', key: 'factorIXActivity', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Vitamin K factors (II, VII, IX, X)', key: 'vitaminKDependentFactors', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'von Willebrand factor', key: 'vonWillebrandFactor', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Platelet count', key: 'plateletCount', min: 0, max: 400, step: 5, unit: ' ×10⁹/L' },
      { kind: 'slider', label: 'Fibrinogen', key: 'fibrinogenLevel', min: 0, max: 150, step: 1, unit: '%' },
      { kind: 'slider', label: 'Heparin dose', key: 'heparinDose', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Aspirin dose', key: 'aspirinDose', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Fibrinolytic activity', key: 'fibrinolyticActivity', min: 0, max: 300, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'PT',
        value: (c) => c.derived.ptSeconds.toFixed(1),
        unit: 's',
        secondary: (c) => (c.derived.ptSeconds > 14.4 ? 'prolonged' : 'normal'),
        colorToken: 'artery',
      },
      {
        label: 'INR',
        value: (c) => c.derived.inr.toFixed(2),
        secondary: (c) => (c.derived.inr > 1.2 ? 'raised' : 'normal'),
        colorToken: 'artery',
      },
      {
        label: 'APTT',
        value: (c) => c.derived.apttSeconds.toFixed(1),
        unit: 's',
        secondary: (c) => (c.derived.apttSeconds > 36 ? 'prolonged' : 'normal'),
        colorToken: 'o2',
      },
      {
        label: 'Bleeding time',
        value: (c) => c.derived.bleedingTimeMinutes.toFixed(1),
        unit: 'min',
        secondary: (c) => (c.derived.bleedingTimeMinutes > 5.6 ? 'prolonged' : 'normal'),
        colorToken: 'platelet',
      },
      {
        label: 'Platelets',
        value: (c) => c.derived.plateletCountValue.toFixed(0),
        unit: '×10⁹/L',
        secondary: (c) => (c.derived.plateletCountValue < 150 ? 'low' : 'normal'),
        colorToken: 'platelet',
      },
      {
        label: 'Fibrinogen',
        value: (c) => c.derived.fibrinogenMgDl.toFixed(0),
        unit: 'mg/dL',
        secondary: (c) => (c.derived.fibrinogenMgDl < 180 ? 'low' : 'normal'),
        colorToken: 'fibrin',
      },
      {
        label: 'D-dimer',
        value: (c) => c.derived.dDimerNgMl.toFixed(0),
        unit: 'ng/mL',
        secondary: (c) => (c.derived.dDimerNgMl > 3000 ? 'markedly raised' : c.derived.dDimerNgMl > 500 ? 'raised' : 'normal'),
        colorToken: 'plasmin',
      },
      { label: 'Thrombin', value: (c) => (c.derived.thrombin * 100).toFixed(0), unit: '%', secondary: () => 'peak burst', colorToken: 'thrombin' },
      {
        label: 'Clot strength',
        value: (c) => (c.derived.clotStrength * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.isBleeding ? 'inadequate' : undefined),
        colorToken: 'fibrin',
      },
      {
        label: 'Time to clot',
        value: (c) => (c.derived.timeToClotSeconds > 0 ? c.derived.timeToClotSeconds.toFixed(0) : '—'),
        unit: 's',
        secondary: (c) => (c.derived.timeToClotSeconds > 0 ? undefined : 'not sealed'),
        colorToken: 'ok',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Thrombin',
        unit: '%',
        colorToken: 'thrombin',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.thrombin * 100),
      },
      {
        kind: 'sparkline',
        label: 'Fibrin',
        unit: '%',
        colorToken: 'fibrin',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.fibrin * 100),
      },
      {
        kind: 'sparkline',
        label: 'Platelet plug',
        unit: '%',
        colorToken: 'platelet',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.plateletPlug * 100),
      },
    ],
  };
}

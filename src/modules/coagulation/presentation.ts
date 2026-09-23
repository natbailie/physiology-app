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
  /** How much of this step is RUNNING right now — zero until something injures the vessel. */
  level: (d: CoagDerived) => number;
  /**
   * How much of it is AVAILABLE to run, from the factors the patient has.
   *
   * The whole of this module's diagram backlog was one omission: every quantity drawn was a
   * running one, and an uninjured patient's cascade is at rest, so a haemophiliac, a warfarinised
   * patient and a healthy one painted the same collapsed ladder. What separates them is standing
   * there in `derived` the entire time as the input passthroughs — which is exactly what a factor
   * ASSAY measures, and what the lab panel beside the drawing has always reported.
   */
  available: (d: CoagDerived) => number;
  /**
   * Where this node's name sits, relative to the node.
   *
   * It used to be below every node without exception, which worked while a node was a disc of at
   * most thirteen units. The availability ring reaches fifteen, and the common-pathway nodes are
   * thirty-six apart — so each ring swallowed the label of the node above it, and the sweep found
   * a line through "Xa" over 92% of its width. The stacked three take their names to the side; the
   * two limb heads keep theirs below, where nothing is stacked under them.
   */
  labelX: number;
  labelY: number;
  labelAnchor: 'middle' | 'end';
}

/** Circulating platelets in the lumen, at fixed positions so the count reads as a count rather
 * than as a jitter. Clear of the breach at x 96-136, which the plug occupies. */
const PLATELET_POSITIONS: readonly { cx: number; cy: number }[] = [
  { cx: 44, cy: 78 }, { cx: 62, cy: 104 }, { cx: 78, cy: 70 }, { cx: 56, cy: 90 },
  { cx: 84, cy: 112 }, { cx: 148, cy: 76 }, { cx: 166, cy: 102 }, { cx: 182, cy: 82 },
  { cx: 154, cy: 114 }, { cx: 192, cy: 108 }, { cx: 70, cy: 118 }, { cx: 176, cy: 68 },
];

/**
 * The cascade as a ladder: two limbs converging on a shared common pathway. Node brightness
 * tracks activation, so which limb is carrying the reaction — and where a deficiency has broken
 * it — is visible at a glance. Geometry is computed from `derived` at build time so the graph
 * moves each frame without needing module CSS.
 */
const CASCADE_NODES: CascadeNodeSpec[] = [
  // Extrinsic limb (PT).
  // Factor VII is vitamin K dependent, so warfarin and liver disease shrink what is on hand here
  // before anything happens — which is why they lengthen the PT this limb is named for.
  { label: 'TF·VIIa', color: 'artery', cx: -46, cy: 0, level: (d) => d.tissueFactorExposure, available: (d) => d.vitaminKDependentFactors / 100, labelX: 0, labelY: 30, labelAnchor: 'middle' },
  // Intrinsic limb (APTT) — shows ACTIVATION, not merely available factor: the tenase complex
  // only assembles once thrombin has begun amplifying it.
  {
    label: 'VIIIa·IXa',
    color: 'o2',
    cx: 46,
    cy: 0,
    level: (d) => clamp((d.factorVIIIActivity / 100) * (d.factorIXActivity / 100) * clamp(d.thrombin * 2, 0, 1), 0, 1),
    // The same product WITHOUT the thrombin gate: the tenase a haemophiliac could assemble if
    // thrombin ever arrived. Haemophilia A and B each collapse one term of it.
    available: (d) => clamp((d.factorVIIIActivity / 100) * (d.factorIXActivity / 100), 0, 1.5),
    labelX: 0,
    labelY: 30,
    labelAnchor: 'middle',
  },
  // Common pathway.
  { label: 'Xa', color: 'platelet', cx: 0, cy: 40, level: (d) => d.factorXa, available: (d) => d.vitaminKDependentFactors / 100, labelX: -20, labelY: 4, labelAnchor: 'end' },
  { label: 'Thrombin', color: 'thrombin', cx: 0, cy: 76, level: (d) => d.thrombin, available: (d) => d.vitaminKDependentFactors / 100, labelX: -20, labelY: 4, labelAnchor: 'end' },
  { label: 'Fibrin', color: 'fibrin', cx: 0, cy: 112, level: (d) => d.fibrin, available: (d) => d.fibrinogenLevel / 100, labelX: -20, labelY: 4, labelAnchor: 'end' },
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
    // The ring is what the patient HAS; the disc inside it is what is happening. Capped at 1.2 so
    // a supranormal assay cannot grow a ring into its neighbour eighteen units away.
    const available = clamp(node.available(derived), 0, 1.2);
    return {
      type: 'group' as const,
      transform: `translate(${cx}, ${cy})`,
      children: [
        {
          type: 'circle' as const,
          cx: 0,
          cy: 0,
          r: 5 + available * 9,
          fill: 'none',
          stroke: node.color,
          strokeWidth: 1.4,
          opacity: 0.85,
        },
        {
          type: 'circle' as const,
          cx: 0,
          cy: 0,
          r,
          fill: node.color,
        },
        {
          type: 'text' as const,
          x: node.labelX,
          y: node.labelY,
          text: node.label,
          anchor: node.labelAnchor,
          colorToken: 'text',
          halo: 'panel' as const,
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
          /* The lumen, which the schema omitted and the web drew from its own stylesheet — one of
           * the drifts that came of keeping two drawings. Stated as data rather than as a class so
           * the phone gets it too; `--wash-faint` is 14%. Square rather than the legacy rounded
           * rect because `RectNode` carries no corner radius, and the walls above and below it are
           * straight lines in any case. */
          { type: 'rect', x: 30, y: 62, width: 172, height: 62, fill: 'artery', fillOpacity: 0.14 },
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
          /* Platelets circulating in the lumen, before any of them are called on. A count, not a
           * wash — the same device immuneResponse uses for its cell populations, and the only way
           * thrombocytopenia is visible in an uninjured vessel. */
          ...PLATELET_POSITIONS.slice(0, Math.round(clamp(derived.plateletCount / 400, 0, 1) * PLATELET_POSITIONS.length)).map((pos) => ({
            type: 'circle' as const,
            cx: pos.cx,
            cy: pos.cy,
            r: 2.6,
            fill: 'platelet',
            fillOpacity: 0.75,
          })),
          /* von Willebrand factor lining the breach: what platelets adhere TO. A vWF deficiency is
           * a thin line here and a normal patient a thick one, before a single platelet sticks. */
          {
            type: 'path',
            d: 'M92,128 L140,128',
            colorToken: 'platelet',
            strokeWidth: Math.max(0.4, clamp(derived.vonWillebrandFactor / 100, 0, 1.5) * 3),
            strokeLinecap: 'round',
            opacity: 0.7,
          },
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
          /* Aspirin over the platelets rather than over the plug: it blocks the cyclo-oxygenase of
           * every platelet in the vessel, taken days before the injury and lasting the life of the
           * cell. A bar through the population says that; a mark on a plug that does not exist yet
           * would not. */
          ...(derived.aspirinDose > 0
            ? [
                {
                  type: 'path' as const,
                  d: 'M38,66 L198,118',
                  colorToken: 'danger',
                  strokeWidth: 0.6 + clamp(derived.aspirinDose / 100, 0, 1) * 1.8,
                  strokeLinecap: 'round' as const,
                  opacity: 0.55,
                },
                { type: 'text' as const, x: 200, y: 122, text: 'aspirin', anchor: 'end' as const, colorToken: 'danger', halo: 'bg' as const, opacity: 0.9 },
              ]
            : []),
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
              { type: 'text', x: -46, y: -36, text: 'Extrinsic', anchor: 'middle', colorToken: 'text-dim' },
              { type: 'text', x: -46, y: -21, text: '(PT)', anchor: 'middle', colorToken: 'text-faint' },
              { type: 'text', x: 46, y: -36, text: 'Intrinsic', anchor: 'middle', colorToken: 'text-dim' },
              { type: 'text', x: 46, y: -21, text: '(APTT)', anchor: 'middle', colorToken: 'text-faint' },

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

              /* Heparin as a gate ACROSS the common pathway, because that is where it acts:
               * antithrombin inhibits thrombin and Xa, so the bar sits on the link between them
               * and widens with the dose. Drawn whether or not a clot is running, which is the
               * point — an anticoagulated patient is anticoagulated before they are cut. */
              ...(derived.heparinDose > 0
                ? [
                    {
                      type: 'path' as const,
                      d: 'M-11,58 L11,58',
                      colorToken: 'danger',
                      strokeWidth: 1 + clamp(derived.heparinDose / 100, 0, 1) * 3,
                      strokeLinecap: 'round' as const,
                    },
                    { type: 'text' as const, x: 16, y: 61, text: 'heparin', anchor: 'start' as const, colorToken: 'danger', halo: 'panel' as const },
                  ]
                : []),
              // Thrombin's positive feedback onto the upstream cofactors — the explosive burst.
              {
                type: 'path',
                d: 'M12,76 C56,64 62,26 52,10',
                colorToken: 'thrombin',
                strokeWidth: Math.max(0.1, 1.6 * (0.15 + thrombin * 0.85)),
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

import { clamp } from '@/shared/lib/math';
import { TUBULE } from './engine/constants';
import type { RenalTubularDerived, RenalTubularHistoryPoint, RenalTubularInputs, RenalTubularState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const TUBULE_PATH =
  'M46,84 L108,84 C140,84 152,120 170,214 C186,290 214,180 232,96 L300,96 C340,96 358,110 366,150 L366,246';

const STATION_POSITIONS: readonly { x: number; y: number }[] = [
  { x: 46, y: 84 },
  { x: 108, y: 84 },
  { x: 170, y: 214 },
  { x: 232, y: 96 },
  { x: 300, y: 96 },
  { x: 392, y: 226 },
];

type Ctx = PresentationContext<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint>;

function urineConcentrationStatus(urineOsm: number, plasmaOsm: number): string {
  if (urineOsm > plasmaOsm * 1.15) return 'concentrated';
  if (urineOsm < plasmaOsm * 0.85) return 'dilute';
  return 'iso-osmotic';
}

/** The three medullary bands, deepening toward the papilla. */
const BAND_DEPTHS = [
  { y: 130, height: 56, depth: 0.5 },
  { y: 186, height: 56, depth: 0.85 },
  { y: 242, height: 58, depth: 1.3 },
] as const;

/**
 * How strongly a medullary band is tinted: the gradient's current strength times how deep the
 * band sits, against the app's soft wash.
 *
 * This used to be carried only by the web's `.medullaBand` CSS rule, which multiplies the same
 * three terms through `color-mix`. The schema kept `fill: 'medulla'` and the two style variables
 * but not the rule, so a renderer without CSS — the phone — painted all three bands in FULL
 * medulla amber: an opaque slab across the bottom two thirds of the diagram with the gradient
 * label, the descending limb, the collecting duct and the urine flow rate buried inside it.
 *
 * Stating it as data rather than as a class is what makes the two platforms agree. `--wash-soft`
 * is 22%, and the cap keeps a fully-built gradient at the deepest band from going solid.
 */
function bandOpacity(gradientStrength: number, depth: number): number {
  return Math.min(0.34, gradientStrength * 0.22 * depth);
}

export function buildRenalTubularPresentation(ctx: Ctx): ModulePresentation<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint> {
  const { derived } = ctx;
  const urineFlowSpeed = clamp(derived.urineFlowRateMLPerMin / 6, 0.1, 3);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Diagram of an unrolled nephron showing tubular fluid osmolality at each segment from Bowman\'s capsule through the proximal tubule, loop of Henle, distal tubule and collecting duct, against the medullary osmotic gradient',
        defs: [
          { type: 'marker', id: 'adh-water-arrow', colorToken: 'adh' },
        ],
        children: [
          // Medullary gradient bands — three horizontal strips that deepen toward the papilla,
          // fading as the countercurrent gradient washes out.
          {
            type: 'group',
            styleVars: { 'gradient-strength': derived.medullaryGradientStrength },
            children: BAND_DEPTHS.map(({ y, height, depth }) => ({
              type: 'rect' as const,
              x: 0,
              y,
              width: 480,
              height,
              fill: 'medulla',
              fillOpacity: bandOpacity(derived.medullaryGradientStrength, depth),
              styleVars: { depth },
            })),
          },
          // Cortex–medulla boundary
          { type: 'line', x1: 0, y1: 130, x2: 480, y2: 130, cls: 'cortexDivider' },
          { type: 'text', x: 8, y: 124, text: 'Cortex', cls: 'medullaLabel' },
          { type: 'text', x: 8, y: 148, text: `Medulla — gradient ${(derived.medullaryGradientStrength * 100).toFixed(0)}%`, cls: 'medullaLabel' },
          // The unrolled tubule path
          { type: 'path', d: TUBULE_PATH, cls: 'tubuleSegment' },
          // Per-segment station markers: colour from dilute (tubule blue) to concentrated (medulla amber)
          ...derived.segments.flatMap((segment, index) => {
            const pos = STATION_POSITIONS[index];
            if (!pos) return [];
            const osmIntensity = clamp((segment.osmolality - TUBULE.CD_MIN_URINE_OSMOLALITY) / (TUBULE.DESCENDING_MAX_OSMOLALITY - TUBULE.CD_MIN_URINE_OSMOLALITY), 0, 1);
            const labelAbove = index !== 2 && index !== 5;
            return [
              {
                type: 'group' as const,
                transform: `translate(${pos.x}, ${pos.y})`,
                styleVars: { 'osm-intensity': osmIntensity },
                children: [
                  { type: 'circle' as const, cx: 0, cy: 0, r: 7, cls: 'osmolalityMarker' },
                  { type: 'text' as const, x: 0, y: labelAbove ? -13 : 20, text: segment.osmolality.toFixed(0), cls: 'osmolalityValue' },
                  { type: 'text' as const, x: 0, y: labelAbove ? (index === 0 ? -34 : -24) : 31, text: segment.label, cls: 'segmentLabel' },
                ],
              },
            ];
          }),
          // Aquaporin water reabsorption arrows from the collecting duct — visible only when ADH is active
          {
            type: 'group',
            styleVars: { 'adh-action': derived.effectiveADHAction },
            children: [
              { type: 'path', d: 'M372,176 L392,172', markerEnd: 'adh-water-arrow', cls: 'aquaporinArrow' },
              { type: 'path', d: 'M372,204 L392,200', markerEnd: 'adh-water-arrow', cls: 'aquaporinArrow' },
              { type: 'path', d: 'M372,232 L392,228', markerEnd: 'adh-water-arrow', cls: 'aquaporinArrow' },
              /* Floored at 0.65, which is where it clears 3:1 against the deepest band. The label fades with ADH action, which is the teaching, but a
                 resting 27% put it at 1.5:1 against the medullary wash — gone rather than faint.
                 The ARROWS beside it still fade the whole way, so the signal is not lost. */
              { type: 'text', x: 398, y: 196, text: 'H2O', cls: 'pathLabel', colorToken: 'adh', opacity: 0.65 + 0.35 * derived.effectiveADHAction },
            ],
          },
          // ADH feedback axis — from osmoreceptors to the posterior pituitary
          {
            type: 'vessel',
            path: 'M366,252 L366,286',
            speed: urineFlowSpeed,
            colorToken: 'urine',
          },
          { type: 'text', x: 286, y: 286, text: `urine ${derived.urineFlowRateMLPerMin.toFixed(1)} mL/min`, cls: 'pathLabel' },
          { type: 'text', x: 330, y: 50, text: `ADH ${(derived.effectiveADHAction * 100).toFixed(0)}%`, cls: 'pathLabel', colorToken: 'adh' },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'GFR', key: 'gfrMLPerMin', min: 20, max: 180, step: 5, unit: ' mL/min' },
      { kind: 'slider', label: 'Water intake', key: 'waterIntakeRate', min: 0, max: 300, step: 10, unit: '%' },
      { kind: 'slider', label: 'ADH secretion capacity', key: 'adhSecretionCapacity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Collecting duct ADH sensitivity', key: 'collectingDuctADHSensitivity', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Exogenous ADH (DDAVP)', key: 'exogenousADH', min: 0, max: 150, step: 5, unit: '%' },
      { kind: 'slider', label: 'Loop diuretic', key: 'loopDiureticDose', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Thiazide', key: 'thiazideDose', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Acetazolamide (proximal CA)', key: 'acetazolamideDose', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Amiloride (ENaC block)', key: 'enacBlockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'SGLT2 inhibition', key: 'sglt2Blockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Osmotic load (mannitol)', key: 'osmoticLoad', min: 0, max: 150, step: 5, unit: '%' },
      { kind: 'slider', label: 'V2 blockade (tolvaptan)', key: 'v2Blockade', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Aldosterone tone', key: 'aldosteroneTone', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Distal H+ secretion (type 1 RTA)', key: 'distalAcidSecretion', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Proximal HCO3 reclaim (type 2 RTA)', key: 'proximalAcidReclaim', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Tubular injury (ATN)', key: 'tubularInjury', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Macula densa feedback', key: 'maculaDensaFeedbackStrength', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'Plasma osmolality',
        value: (c) => c.derived.plasmaOsmolality.toFixed(0),
        unit: 'mOsm/kg',
        colorToken: 'tubule',
      },
      {
        label: 'Urine osmolality',
        value: (c) => c.derived.finalUrineOsmolality.toFixed(0),
        unit: 'mOsm/kg',
        secondary: (c) => urineConcentrationStatus(c.derived.finalUrineOsmolality, c.derived.plasmaOsmolality),
        colorToken: 'urine',
      },
      {
        label: 'ADH',
        value: (c) => (c.derived.adhLevel * 100).toFixed(0),
        unit: '%',
        colorToken: 'adh',
      },
      {
        label: 'ADH action at duct',
        value: (c) => (c.derived.effectiveADHAction * 100).toFixed(0),
        unit: '%',
        colorToken: 'adh',
      },
      {
        label: 'Medullary gradient',
        value: (c) => (c.derived.medullaryGradientStrength * 100).toFixed(0),
        unit: '%',
        colorToken: 'medulla',
      },
      {
        label: 'Urine flow',
        value: (c) => c.derived.urineFlowRateMLPerMin.toFixed(1),
        unit: 'mL/min',
        colorToken: 'urine',
      },
      {
        label: 'Free water clearance',
        value: (c) => c.derived.freeWaterClearance.toFixed(1),
        unit: 'mL/min',
        secondary: (c) => c.derived.freeWaterClearance >= 0 ? 'excreting water' : 'retaining water',
        colorToken: 'tubule',
      },
      {
        label: 'GFR (after TGF)',
        value: (c) => c.derived.gfrAfterTGF.toFixed(0),
        unit: 'mL/min',
        colorToken: 'kidney',
      },
      {
        label: 'Serum bicarbonate',
        value: (c) => c.derived.serumBicarbonateMeqL.toFixed(1),
        unit: 'mEq/L',
        secondary: (c) => `heading to ${c.derived.hco3SteadyStateMeqL.toFixed(0)}`,
        colorToken: 'tubule',
      },
      {
        label: 'Urine pH',
        value: (c) => c.derived.urinePH.toFixed(2),
        secondary: (c) => c.derived.urinePH > 5.5 ? 'cannot acidify' : 'acidified',
        colorToken: 'urine',
      },
      {
        label: 'Urine anion gap',
        value: (c) => c.derived.urineAnionGapMeqL.toFixed(0),
        unit: 'mEq/L',
        secondary: (c) => c.derived.urineAnionGapMeqL > 0 ? 'NH4 excretion failing' : 'NH4 excretion intact',
        colorToken: 'urine',
      },
      {
        label: 'Serum potassium',
        value: (c) => c.derived.serumPotassiumEstimateMeqL.toFixed(2),
        unit: 'mEq/L',
        colorToken: 'potassium',
      },
      {
        label: 'Serum creatinine',
        value: (c) => c.derived.serumCreatinineMgDl.toFixed(2),
        unit: 'mg/dL',
        secondary: (c) => `heading to ${c.derived.creatinineEquilibriumMgDl.toFixed(1)}`,
        colorToken: 'kidney',
      },
      {
        label: 'Creatinine clearance',
        value: (c) => c.derived.creatinineClearanceMLMin.toFixed(0),
        unit: 'mL/min',
        secondary: (c) => `RPF ${c.derived.renalPlasmaFlowMLMin.toFixed(0)} · FF ${c.derived.filtrationFractionPct.toFixed(0)}%`,
        colorToken: 'kidney',
      },
      {
        label: 'FENa',
        value: (c) => c.derived.fractionalExcretionNaPct.toFixed(2),
        unit: '%',
        secondary: (c) => `urine Na ${c.derived.urineSodiumMeqL.toFixed(0)} mEq/L`,
        colorToken: 'potassium',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Plasma osmolality',
        unit: 'mOsm/kg',
        colorToken: 'tubule',
        domainMin: 240,
        domainMax: 360,
        data: (points) => points.map((p) => p.plasmaOsmolality),
      },
      {
        kind: 'sparkline',
        label: 'Urine osmolality',
        unit: 'mOsm/kg',
        colorToken: 'urine',
        domainMin: 0,
        domainMax: 1200,
        data: (points) => points.map((p) => p.urineOsmolality),
      },
      {
        kind: 'sparkline',
        label: 'ADH',
        unit: '%',
        colorToken: 'adh',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.adhLevel * 100),
      },
    ],
  };
}

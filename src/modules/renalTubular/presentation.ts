import { clamp } from '@/shared/lib/math';
import { TUBULE } from './engine/constants';
import { effectiveDistalDrive, effectiveProximalReclaim } from './engine/acidHandling';
import type { RenalTubularDerived, RenalTubularHistoryPoint, RenalTubularInputs, RenalTubularState } from './engine/types';
import type { ControlSpec, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

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

/**
 * A transport arrow's size, from the capacity driving it.
 *
 * Length AND width, both floored. Length is the readable half — a pump that reaches the blood
 * versus one that barely leaves the lumen — and width is redundant reinforcement, which is what
 * keeps the encoding legible without a legend. Width stays in a narrow band ON PURPOSE: SVG scales
 * a marker with the stroke it terminates, so a 3.8-wide arrow grew an arrowhead a tenth of the
 * canvas across. All three renderers omit `markerUnits`, so the fix belongs in all three at once
 * and not in one module's drawing.
 *
 * Floored rather than vanishing, because a channel that disappears reads as "there is no such
 * structure here", which is the opposite of what amiloride or a distal RTA does to it.
 */
function transportArrow(capacity: number): { length: number; width: number } {
  const drive = clamp(capacity, 0, 1.4) / 1.4;
  return { length: 10 + drive * 16, width: 1.2 + drive * 1.2 };
}

/** Where a urine pH falls on the scale drawn at the right margin, in user units. */
const PH_SCALE = { x: 452, top: 158, bottom: 250, min: 4.5, max: 8 } as const;
function phY(urinePH: number): number {
  const fraction = clamp((urinePH - PH_SCALE.min) / (PH_SCALE.max - PH_SCALE.min), 0, 1);
  return PH_SCALE.bottom - fraction * (PH_SCALE.bottom - PH_SCALE.top);
}

/** The control rail, hoisted so the page can read the same ranges the schema declares —
 * `useInputNudge` clamps a button's delta to the slider it writes. */
export const RENAL_TUBULAR_CONTROLS: readonly ControlSpec<RenalTubularInputs>[] = [
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
];

export function buildRenalTubularPresentation(ctx: Ctx): ModulePresentation<RenalTubularState, RenalTubularDerived, RenalTubularInputs, RenalTubularHistoryPoint> {
  const { derived, inputs } = ctx;
  const urineFlowSpeed = clamp(derived.urineFlowRateMLPerMin / 6, 0.1, 3);
  /* The acid and potassium arm, which the drawing did not contain.
   *
   * Five of this module's scenarios — acetazolamide, amiloride, and the three renal tubular
   * acidoses — act only through `acidHandling.ts`, and nothing there reached the four quantities
   * the nephron carried (the segments, the gradient, urine flow and ADH action). The picture could
   * not move for any of them, which is the whole of this module's half of `NO_DIAGRAM_CORRELATE`.
   *
   * These are the engine's own functions rather than the formulas restated: a reclaim capacity that
   * acetazolamide blocks pharmacologically and proximal RTA loses structurally — one arrow for one
   * lesion, which is the teaching — and a distal drive that aldosterone opens and amiloride shuts. */
  const reclaim = effectiveProximalReclaim(inputs);
  const distalDrive = effectiveDistalDrive(inputs);
  const protonPump = clamp(inputs.distalAcidSecretion, 0, 1);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 480, 300],
        ariaLabel:
          'Diagram of an unrolled nephron showing tubular fluid osmolality at each segment from Bowman\'s capsule through the proximal tubule, loop of Henle, distal tubule and collecting duct, against the medullary osmotic gradient',
        defs: [
          { type: 'marker', id: 'adh-water-arrow', colorToken: 'adh' },
          { type: 'marker', id: 'reclaim-arrow', colorToken: 'bicarb' },
          { type: 'marker', id: 'acid-arrow', colorToken: 'ph' },
          { type: 'marker', id: 'sodium-arrow', colorToken: 'sodium' },
          { type: 'marker', id: 'potassium-arrow', colorToken: 'potassium' },
        ],
        children: [
          // Medullary gradient bands — three horizontal strips that deepen toward the papilla,
          // fading as the countercurrent gradient washes out.
          {
            /* No `styleVars` here or on the bands. `--gradient-strength` and `--depth` were read
             * only by `.medullaBand` in this module's stylesheet, and the band nodes carry no
             * `cls` — the wash has been stated as `fillOpacity` on the node since the fix
             * `bandOpacity` records above. Two custom properties nothing could reach. */
            type: 'group',
            children: BAND_DEPTHS.map(({ y, height, depth }) => ({
              type: 'rect' as const,
              x: 0,
              y,
              width: 480,
              height,
              fill: 'medulla',
              fillOpacity: bandOpacity(derived.medullaryGradientStrength, depth),
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
                children: [
                  /* The variable rides the NODE THAT CARRIES THE CLASS, not its parent.
                   *
                   * A custom property set on a group cascades to its children in CSS, so the web
                   * read this correctly from the group and the phone never did: the schema renderer
                   * resolves a class's `fillOpacity` against that node's OWN `styleVars`, finds
                   * none, and paints the marker at zero. All six stations were invisible on the
                   * phone while the web showed them shading from tubule to medulla. */
                  { type: 'circle' as const, cx: 0, cy: 0, r: 7, cls: 'osmolalityMarker', styleVars: { 'osm-intensity': osmIntensity } },
                  { type: 'text' as const, x: 0, y: labelAbove ? -13 : 20, text: segment.osmolality.toFixed(0), cls: 'osmolalityValue' },
                  { type: 'text' as const, x: 0, y: labelAbove ? (index === 0 ? -34 : -24) : 31, text: segment.label, cls: 'segmentLabel' },
                ],
              },
            ];
          }),
          // Aquaporin water reabsorption arrows from the collecting duct — visible only when ADH is active
          {
            type: 'group',
            children: [
              // Same rule as the station markers above: the variable goes on the node with the class.
              ...['M372,176 L392,172', 'M372,204 L392,200', 'M372,232 L392,228'].map((d) => ({
                type: 'path' as const,
                d,
                markerEnd: 'adh-water-arrow',
                cls: 'aquaporinArrow',
                styleVars: { 'adh-action': derived.effectiveADHAction },
              })),
              /* Floored at 0.65, which is where it clears 3:1 against the deepest band. The label fades with ADH action, which is the teaching, but a
                 resting 27% put it at 1.5:1 against the medullary wash — gone rather than faint.
                 The ARROWS beside it still fade the whole way, so the signal is not lost. */
              { type: 'text', x: 398, y: 196, text: 'H2O', cls: 'pathLabel', colorToken: 'adh', opacity: 0.65 + 0.35 * derived.effectiveADHAction },
            ],
          },
          /* Proximal bicarbonate reclaim: lumen to blood, down out of the cortical tubule.
           * Acetazolamide blocks it pharmacologically and proximal RTA loses it structurally, and
           * they thin the SAME arrow — which is the teaching that they are one lesion twice over. */
          {
            type: 'path',
            d: `M124,88 L124,${88 + transportArrow(reclaim).length}`,
            colorToken: 'bicarb',
            strokeWidth: transportArrow(reclaim).width,
            strokeLinecap: 'round',
            markerEnd: 'reclaim-arrow',
            fill: 'none',
          },
          /* Anchored at its END rather than centred: the descending limb crosses y=126 at about x=153, and
           * a centred label ran straight under it. Moved rather than haloed, because the space exists —
           * CLAUDE.md's first answer of the three. */
          { type: 'text', x: 146, y: 126, text: 'HCO3- reclaim', cls: 'pathLabel', colorToken: 'bicarb', anchor: 'end', halo: 'bg' },
          /* The collecting duct's own cells, drawn on the side the aquaporins are not: the
           * alpha-intercalated cell's proton pump above, the principal cell's sodium and potassium
           * below. Distal RTA collapses the pump; amiloride shuts the channel and type 4 removes
           * the aldosterone drive on it, so those two thin the same pair. */
          {
            type: 'path',
            d: `M358,178 L${358 - transportArrow(protonPump).length},178`,
            colorToken: 'ph',
            strokeWidth: transportArrow(protonPump).width,
            strokeLinecap: 'round',
            markerEnd: 'acid-arrow',
            fill: 'none',
          },
          { type: 'text', x: 326, y: 181, text: 'H+', cls: 'pathLabel', colorToken: 'ph', anchor: 'end', halo: 'bg' },
          {
            type: 'path',
            d: `M358,206 L${358 - transportArrow(distalDrive).length},206`,
            colorToken: 'sodium',
            strokeWidth: transportArrow(distalDrive).width,
            strokeLinecap: 'round',
            markerEnd: 'sodium-arrow',
            fill: 'none',
          },
          { type: 'text', x: 326, y: 209, text: 'Na+', cls: 'pathLabel', colorToken: 'sodium', anchor: 'end', halo: 'bg' },
          {
            type: 'path',
            d: `M${358 - transportArrow(distalDrive).length},228 L358,228`,
            colorToken: 'potassium',
            strokeWidth: transportArrow(distalDrive).width,
            strokeLinecap: 'round',
            markerEnd: 'potassium-arrow',
            fill: 'none',
          },
          { type: 'text', x: 326, y: 231, text: 'K+', cls: 'pathLabel', colorToken: 'potassium', anchor: 'end', halo: 'bg' },
          /* Urine pH by POSITION on a scale, not by colour, so it needs no legend. The 5.5 mark is
           * the line a distal RTA cannot get below however acidotic the patient is. */
          { type: 'path', d: `M${PH_SCALE.x},${PH_SCALE.top} L${PH_SCALE.x},${PH_SCALE.bottom}`, colorToken: 'text-faint', strokeWidth: 1, fill: 'none' },
          { type: 'path', d: `M${PH_SCALE.x - 4},${phY(5.5)} L${PH_SCALE.x + 4},${phY(5.5)}`, colorToken: 'text-faint', strokeWidth: 1, fill: 'none' },
          { type: 'text', x: PH_SCALE.x - 6, y: phY(5.5) + 3, text: '5.5', cls: 'tickLabel', anchor: 'end', halo: 'bg' },
          { type: 'path', d: `M${PH_SCALE.x - 7},${phY(derived.urinePH)} L${PH_SCALE.x + 7},${phY(derived.urinePH)}`, colorToken: 'ph', strokeWidth: 2.5, strokeLinecap: 'round', fill: 'none' },
          { type: 'text', x: PH_SCALE.x, y: PH_SCALE.top - 8, text: 'urine pH', cls: 'tickLabel', anchor: 'middle' },
          { type: 'text', x: PH_SCALE.x + 9, y: phY(derived.urinePH) + 3, text: derived.urinePH.toFixed(1), cls: 'valueLabel', colorToken: 'ph', anchor: 'start', halo: 'bg' },
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
    controls: RENAL_TUBULAR_CONTROLS,
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

import { clamp } from '@/shared/lib/math';
import { BASELINE } from './engine/constants';
import type { ElectrolyteDerived, ElectrolyteHistoryPoint, ElectrolyteInputs, ElectrolyteState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/**
 * Darrow-Yannet geometry: width is volume, height is tonicity. Every disorder in this module has
 * a distinctive shape here — a tall narrow ECF is dehydration, a short wide one is water
 * intoxication, and a purely isotonic loss changes width with no change in height at all.
 */
const DY = {
  originX: 30,
  baselineY: 208,
  pxPerLitre: 5.6,
  pxPerMOsm: 0.34,
  maxTotalWidth: 272,
  maxHeight: 112,
  minHeight: 22,
};
const NORMAL_OSMOLALITY = 285;

/** Each ion appears at its own threshold, so the extracellular cluster visibly thins and
 * thickens while the intracellular one barely changes — the point about how small the
 * extracellular pool is, made geometrically. */
const ECF_POTASSIUM_MARKS = [3, 3.6, 4.2, 4.8, 5.4, 6, 6.8];
const ICF_POTASSIUM_MARKS = [0.55, 0.7, 0.8, 0.88, 0.94, 0.98, 1, 1.02];

type Ctx = PresentationContext<ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint>;

export function buildElectrolyteBalancePresentation(ctx: Ctx): ModulePresentation<ElectrolyteState, ElectrolyteDerived, ElectrolyteInputs, ElectrolyteHistoryPoint> {
  const { derived } = ctx;

  // Scale the compartments to fit whatever total body water currently is, so a grossly
  // overloaded patient still fits on screen without the geometry lying about proportions.
  const rawTotalWidth = derived.totalBodyWaterL * DY.pxPerLitre;
  const fit = Math.min(1, DY.maxTotalWidth / Math.max(rawTotalWidth, 1));
  const icfWidth = derived.icfVolumeL * DY.pxPerLitre * fit;
  const ecfWidth = derived.ecfVolumeL * DY.pxPerLitre * fit;
  const blockHeight = clamp(derived.effectiveOsmolality * DY.pxPerMOsm, DY.minHeight, DY.maxHeight);
  const blockTop = DY.baselineY - blockHeight;

  const baselineIcfWidth = (BASELINE.TOTAL_BODY_WATER_L - BASELINE.ECF_VOLUME_L) * DY.pxPerLitre;
  const baselineEcfWidth = BASELINE.ECF_VOLUME_L * DY.pxPerLitre;
  const baselineHeight = NORMAL_OSMOLALITY * DY.pxPerMOsm;

  // Positive shift = potassium moving into cells, so the arrow points toward the cell.
  const shift = derived.transcellularShiftMeqPerDay;
  const arrowFromX = shift > 0 ? 330 : 352;
  const arrowToX = shift > 0 ? 350 : 328;

  const totalBodyPotassiumPct = (derived.totalBodyPotassiumMeq / BASELINE.EXCHANGEABLE_POTASSIUM_MEQ) * 100;
  const rateSign = derived.sodiumChangeRateMeqLPerDay >= 0 ? '+' : '';

  const diagram: FrameNode = {
    type: 'frame',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'Darrow-Yannet diagram of the intracellular and extracellular fluid compartments, alongside a cell showing how potassium is distributed across its membrane',
    defs: [{ type: 'marker', id: 'shift-arrowhead', colorToken: 'potassium' }],
    children: [
      { type: 'text', x: 22, y: 24, text: 'Compartments — width = volume, height = tonicity', cls: 'pathLabel' },
      { type: 'text', x: 116, y: 46, text: `Na+ ${derived.serumSodiumMeqL.toFixed(1)} mEq/L`, cls: 'valueLabel', anchor: 'start' },
      { type: 'text', x: 22, y: 46, text: 'Serum', cls: 'pathLabel' },
      {
        type: 'text',
        x: 22,
        y: 62,
        text: `corrected ${derived.correctedSodiumMeqL.toFixed(1)} · ${rateSign}${derived.sodiumChangeRateMeqLPerDay.toFixed(1)}/day`,
        cls: 'pathLabel',
      },
      { type: 'text', x: 22, y: 78, text: `${derived.effectiveOsmolality.toFixed(0)} mOsm · ${derived.tonicity}`, cls: 'pathLabel' },

      // Normal compartments, so any deviation reads as a change rather than an absolute.
      { type: 'path', d: `M${DY.originX},${DY.baselineY - baselineHeight} h${baselineIcfWidth} v${baselineHeight} h${-baselineIcfWidth} z`, fill: 'none', colorToken: 'text-faint' },
      { type: 'path', d: `M${DY.originX + baselineIcfWidth},${DY.baselineY - baselineHeight} h${baselineEcfWidth} v${baselineHeight} h${-baselineEcfWidth} z`, fill: 'none', colorToken: 'text-faint' },
      { type: 'rect', x: DY.originX, y: blockTop, width: icfWidth, height: blockHeight, fill: 'potassium' },
      { type: 'rect', x: DY.originX + icfWidth, y: blockTop, width: ecfWidth, height: blockHeight, fill: 'sodium' },
      { type: 'line', x1: DY.originX, y1: DY.baselineY, x2: DY.originX + DY.maxTotalWidth, y2: DY.baselineY, colorToken: 'text' },

      { type: 'text', x: DY.originX + icfWidth / 2, y: DY.baselineY + 16, text: `ICF ${derived.icfVolumeL.toFixed(1)} L`, cls: 'valueLabel' },
      { type: 'text', x: DY.originX + icfWidth + ecfWidth / 2, y: DY.baselineY + 16, text: `ECF ${derived.ecfVolumeL.toFixed(1)} L`, cls: 'valueLabel' },
      {
        type: 'text',
        x: DY.originX,
        y: DY.baselineY + 32,
        text: `${derived.ecfVolumeStatus} · total body water ${derived.totalBodyWaterL.toFixed(1)} L`,
        cls: 'pathLabel',
      },

      // Urine, bottom left.
      { type: 'path', d: 'M34,282 c0,-9 10,-16 10,-23 c0,7 10,14 10,23 a10,10 0 0 1 -20,0 z', fill: 'urine' },
      {
        type: 'text',
        x: 62,
        y: 278,
        text: `${derived.urineVolumeLPerDay.toFixed(1)} L/day at ${derived.urineOsmolality.toFixed(0)} mOsm · CH2O ${derived.freeWaterClearanceLPerDay.toFixed(2)} L/day`,
        cls: 'pathLabel',
      },
      {
        type: 'text',
        x: 62,
        y: 294,
        text: `ADH ${(derived.adhLevel * 100).toFixed(0)}% · aldosterone ${derived.aldosteroneLevel.toFixed(2)}x · TTKG ${derived.transtubularKGradient.toFixed(1)}`,
        cls: 'pathLabel',
      },

      // Potassium: the serum column on the left, the cell on the right.
      { type: 'text', x: 308, y: 38, text: 'Serum', cls: 'pathLabel', anchor: 'start' },
      ...ECF_POTASSIUM_MARKS.map((threshold, index) => ({
        type: 'circle' as const,
        cx: 322,
        cy: 54 + index * 13,
        r: 3.6,
        fill: 'potassium',
        styleVars: { visible: derived.serumPotassiumMeqL >= threshold ? 1 : 0 },
      })),
      { type: 'text', x: 322, y: 164, text: `K+ ${derived.serumPotassiumMeqL.toFixed(2)}`, cls: 'valueLabel' },

      { type: 'rect', x: 356, y: 44, width: 104, height: 100, fill: 'potassium' },
      { type: 'text', x: 362, y: 38, text: 'Cell — 98% of K+', cls: 'pathLabel', anchor: 'start' },
      ...ICF_POTASSIUM_MARKS.map((threshold, index) => ({
        type: 'circle' as const,
        cx: 378 + (index % 4) * 22,
        cy: 78 + Math.floor(index / 4) * 30,
        r: 3.6,
        fill: 'potassium',
        styleVars: { visible: totalBodyPotassiumPct / 100 >= threshold ? 1 : 0 },
      })),
      // Inside the solid cell block, so --on-solid. Same fault as cardiacElectro's atrium:
      // a label on a filled signal colour defaulting to --text, surviving on a margin the
      // navy palette removed. The alternative is a LABEL_WASH on the rect, but the block is
      // solid to say the cell holds 98% of body potassium — that solidity is the point.
      { type: 'text', x: 408, y: 136, text: `total body ${totalBodyPotassiumPct.toFixed(0)}%`, cls: 'valueLabel', colorToken: 'on-solid' },

      {
        type: 'line',
        x1: arrowFromX,
        y1: 186,
        x2: arrowToX,
        y2: 186,
        colorToken: 'potassium',
      },
      {
        type: 'text',
        x: 300,
        y: 204,
        text:
          Math.abs(shift) < 1
            ? 'shift in balance'
            : `shift ${Math.abs(shift).toFixed(0)} mEq/day ${shift > 0 ? 'into cells' : 'out of cells'}`,
        cls: 'pathLabel',
      },

      {
        type: 'text',
        x: 382,
        y: 228,
        text: 'Correcting too fast',
        cls: 'pathLabel',
        anchor: 'end',
        colorToken: 'danger',
        opacity: derived.demyelinationRisk > 0.1 ? 1 : 0,
      },
      {
        type: 'text',
        x: 382,
        y: 246,
        text: derived.ecgRisk,
        cls: 'pathLabel',
        anchor: 'end',
        colorToken: 'danger',
        opacity: derived.ecgRisk === 'normal' ? 0 : 1,
      },
    ],
  };

  return {
    diagram: [diagram],
    controls: [
      { kind: 'slider', label: 'Sodium intake', key: 'sodiumIntake', min: 0, max: 400, step: 10, unit: ' mEq/d' },
      { kind: 'slider', label: 'Potassium intake', key: 'potassiumIntake', min: 0, max: 200, step: 5, unit: ' mEq/d' },
      { kind: 'slider', label: 'Water intake', key: 'waterIntake', min: 0, max: 12, step: 0.25, unit: ' L/d' },
      { kind: 'slider', label: 'Insulin', key: 'insulinLevel', min: 0, max: 5, step: 0.1, unit: 'x' },
      { kind: 'slider', label: 'Beta-2 activity', key: 'beta2Activity', min: 0, max: 3, step: 0.1, unit: 'x' },
      { kind: 'slider', label: 'Arterial pH', key: 'arterialPH', min: 6.9, max: 7.6, step: 0.01 },
      { kind: 'slider', label: 'Serum glucose', key: 'serumGlucoseMgDl', min: 70, max: 800, step: 10, unit: ' mg/dL' },
      { kind: 'slider', label: 'GFR', key: 'gfrFraction', min: 0.05, max: 1.2, step: 0.01, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Aldosterone drive', key: 'aldosteroneDrive', min: 0, max: 3, step: 0.1, unit: 'x' },
      {
        kind: 'toggle',
        label: 'ADH secretion',
        key: 'adhMode',
        colorToken: 'adh',
        options: [
          { value: 'regulated', label: 'Regulated' },
          { value: 'inappropriate', label: 'SIADH' },
          { value: 'deficient', label: 'DI' },
        ],
      },
      {
        kind: 'toggle',
        label: 'Diuretic',
        key: 'diuretic',
        colorToken: 'tubule',
        options: [
          { value: 'none', label: 'None' },
          { value: 'loop', label: 'Loop' },
          { value: 'thiazide', label: 'Thiazide' },
          { value: 'potassiumSparing', label: 'K-sparing' },
        ],
      },
      {
        kind: 'toggle',
        label: 'Extrarenal loss',
        key: 'extrarenalLoss',
        colorToken: 'sodium',
        options: [
          { value: 'none', label: 'None' },
          { value: 'vomiting', label: 'Vomiting' },
          { value: 'diarrhoea', label: 'Diarrhoea' },
          { value: 'sweating', label: 'Sweating' },
        ],
      },
      {
        kind: 'toggle',
        label: 'Infusion',
        key: 'infusion',
        colorToken: 'potassium',
        options: [
          { value: 'none', label: 'None' },
          { value: 'normalSaline', label: '0.9% saline' },
          { value: 'hypertonic3', label: '3% saline' },
          { value: 'dextrose5', label: 'D5W' },
          { value: 'potassiumReplacement', label: 'K+ replacement' },
        ],
      },
    ],
    readouts: [
      {
        label: 'Serum Na+',
        value: (c) => c.derived.serumSodiumMeqL.toFixed(1),
        unit: 'mEq/L',
        secondary: (c) => `corrected ${c.derived.correctedSodiumMeqL.toFixed(1)}`,
        colorToken: 'sodium',
      },
      {
        label: 'Serum K+',
        value: (c) => c.derived.serumPotassiumMeqL.toFixed(2),
        unit: 'mEq/L',
        secondary: (c) => c.derived.ecgRisk,
        colorToken: 'potassium',
      },
      {
        label: 'Effective osmolality',
        value: (c) => c.derived.effectiveOsmolality.toFixed(0),
        unit: 'mOsm',
        secondary: (c) => `${c.derived.tonicity} · measured ${c.derived.serumOsmolality.toFixed(0)}`,
        colorToken: 'sodium',
      },
      {
        label: 'Total body K+',
        value: (c) => ((c.derived.totalBodyPotassiumMeq / BASELINE.EXCHANGEABLE_POTASSIUM_MEQ) * 100).toFixed(0),
        unit: '%',
        secondary: (c) => `${c.derived.totalBodyPotassiumMeq.toFixed(0)} mEq`,
        colorToken: 'potassium',
      },
      {
        label: 'Transcellular shift',
        value: (c) => c.derived.transcellularShiftMeqPerDay.toFixed(0),
        unit: 'mEq/d',
        secondary: (c) => (c.derived.transcellularShiftMeqPerDay > 0 ? 'into cells' : 'out of cells'),
        colorToken: 'potassium',
      },
      {
        label: 'ECF volume',
        value: (c) => c.derived.ecfVolumeL.toFixed(1),
        unit: 'L',
        secondary: (c) => `${c.derived.ecfVolumeStatus} · ICF ${c.derived.icfVolumeL.toFixed(1)} L`,
        colorToken: 'sodium',
      },
      {
        label: 'Urine osmolality',
        value: (c) => c.derived.urineOsmolality.toFixed(0),
        unit: 'mOsm',
        secondary: (c) => `${c.derived.urineVolumeLPerDay.toFixed(1)} L/day`,
        colorToken: 'urine',
      },
      {
        label: 'Free water clearance',
        value: (c) => c.derived.freeWaterClearanceLPerDay.toFixed(2),
        unit: 'L/d',
        secondary: (c) => (c.derived.freeWaterClearanceLPerDay < 0 ? 'retaining free water' : 'excreting free water'),
        colorToken: 'adh',
      },
      {
        label: 'TTKG',
        value: (c) => c.derived.transtubularKGradient.toFixed(1),
        secondary: () => 'is the kidney the cause?',
        colorToken: 'tubule',
      },
      {
        label: 'Na+ excretion',
        value: (c) => c.derived.sodiumExcretionMeqPerDay.toFixed(0),
        unit: 'mEq/d',
        secondary: (c) => `K+ ${c.derived.potassiumExcretionMeqPerDay.toFixed(0)} mEq/d`,
        colorToken: 'kidney',
      },
      {
        label: 'Na+ change rate',
        value: (c) => `${c.derived.sodiumChangeRateMeqLPerDay >= 0 ? '+' : ''}${c.derived.sodiumChangeRateMeqLPerDay.toFixed(1)}`,
        unit: 'mEq/L/d',
        secondary: (c) => (c.derived.demyelinationRisk > 0.1 ? 'demyelination risk' : 'within safe limits'),
        colorToken: derived.demyelinationRisk > 0.1 ? 'danger' : 'text-dim',
      },
      {
        label: 'Brain-adapted Na+',
        value: (c) => c.derived.adaptedSodiumMeqL.toFixed(1),
        unit: 'mEq/L',
        secondary: () => 'what the brain is used to',
        colorToken: 'memory',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Serum Na+',
        unit: 'mEq/L',
        colorToken: 'sodium',
        domainMin: 105,
        domainMax: 165,
        data: (points) => points.map((p) => p.sodium),
      },
      // The two potassium traces share an axis deliberately: when they separate, the serum
      // level is no longer telling you anything about the size of the deficit.
      {
        kind: 'sparkline',
        label: 'Serum K+',
        secondaryLabel: 'total body K+',
        unit: 'mEq/L',
        colorToken: 'potassium',
        secondaryColorToken: 'text-dim',
        domainMin: 1.5,
        domainMax: 8,
        data: (points) => points.map((p) => p.potassium),
        secondaryData: (points) => points.map((p) => p.totalBodyPotassiumPct),
      },
      {
        kind: 'sparkline',
        label: 'ECF volume',
        unit: 'L',
        colorToken: 'artery',
        domainMin: 8,
        domainMax: 20,
        data: (points) => points.map((p) => p.ecfVolume),
      },
    ],
  };
}

import { clamp } from '@/shared/lib/math';
import { kidneyScene, smallIntestineScene } from '@/shared/diagram/organShapes';
import { PRECIPITATION } from './engine/constants';
import type { CalciumDerived, CalciumHistoryPoint, CalciumInputs, CalciumState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const PTH_TO_BONE_PATH = 'M212,66 C170,92 130,140 112,176';
const PTH_TO_KIDNEY_PATH = 'M252,66 C300,92 340,120 356,148';
const CALCITRIOL_TO_GUT_PATH = 'M356,196 C330,232 290,250 258,252';
const CALCIUM_FEEDBACK_PATH = 'M120,214 C150,262 210,272 244,244';

// A long bone: shaft with flared epiphyses at each end (drawn centred on its origin).
const BONE_PATH =
  'M-10,-34 C-18,-40 -30,-36 -30,-26 C-30,-19 -24,-16 -16,-17 L-8,-14 L-8,14 L-16,17 C-24,16 -30,19 -30,26 C-30,36 -18,40 -10,34 C-4,38 8,38 12,32 C20,36 30,32 30,23 C30,16 24,13 16,14 L8,11 L8,-11 L16,-14 C24,-13 30,-16 30,-23 C30,-32 20,-36 12,-32 C8,-38 -4,-38 -10,-34 Z';

/** An axis-aligned ellipse path, since the schema has a Circle but no Ellipse primitive. */
function ellipse(rx: number, ry: number): string {
  return `M${-rx},0 A${rx} ${ry} 0 1 0 ${rx},0 A${rx} ${ry} 0 1 0 ${-rx},0`;
}

type Ctx = PresentationContext<CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint>;

function calciumStatus(mgDl: number): string {
  if (mgDl < 8.5) return 'hypocalcemia';
  if (mgDl > 10.5) return 'hypercalcemia';
  return 'normal';
}

function phosphateStatus(mgDl: number): string {
  if (mgDl < 2.5) return 'hypophosphatemia';
  if (mgDl > 4.5) return 'hyperphosphatemia';
  return 'normal';
}

export function buildCalciumHomeostasisPresentation(ctx: Ctx): ModulePresentation<CalciumState, CalciumDerived, CalciumInputs, CalciumHistoryPoint> {
  const { derived } = ctx;
  // Serum calcium drives the feedback arrow's intensity — high calcium suppresses PTH.
  const calciumFeedbackIntensity = clamp((derived.serumCalciumMgDl - 6) / 6, 0, 1);
  const resorptionRate = clamp(derived.boneResorptionRate, 0, 1);
  const renalFunction = clamp(derived.renalFunction, 0, 1);
  // Gut absorption is normalised to the top of the wash band the original CSS painted.
  const gutAbsorption = clamp(derived.gutCaAbsorptionFraction / 0.45, 0, 1);


  /* A sectioned kidney and a real run of bowel, rather than the two first-generation blobs.
   * Both are load-bearing here: PTH acts on the renal TUBULE and calcitriol is made in the
   * proximal one, and calcium is absorbed in the duodenum and jejunum — neither of which a
   * single Bézier silhouette could point at. The washes carry the same quantities the arrows do. */
  const kidney = kidneyScene(
    { x: 372, y: 176, scale: 0.82 },
    // The medulla is washed by calcitriol activity, which is where the 1-alpha-hydroxylase
    // step that makes it actually happens.
    { gfrIntensity: renalFunction, colorToken: 'kidney', medullaToken: 'calcitriol' },
  );
  const gut = smallIntestineScene(
    { x: 240, y: 244, scale: 0.5 },
    { motility: gutAbsorption, colorToken: 'calcitriol' },
  );

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [60, 17, 376, 294],
        ariaLabel:
          'Animated diagram of calcium homeostasis: parathyroid glands releasing PTH which acts on bone and kidney, the kidney activating vitamin D to calcitriol which drives gut calcium absorption, and serum calcium feeding back to suppress PTH',
        defs: [
          { type: 'marker', id: 'pth-arrow', colorToken: 'pth' },
          { type: 'marker', id: 'calcitriol-arrow', colorToken: 'calcitriol' },
          { type: 'marker', id: 'calcium-feedback-arrow', colorToken: 'calcium' },
          ...kidney.defs,
          ...gut.defs,
        ],
        children: [
          {
            type: 'axis',
            path: PTH_TO_BONE_PATH,
            activation: derived.pthLevel,
            colorToken: 'pth',
            label: 'PTH → bone',
            labelX: 118,
            labelY: 108,
            markerId: 'pth-arrow',
          },
          {
            type: 'axis',
            path: PTH_TO_KIDNEY_PATH,
            activation: derived.pthLevel,
            colorToken: 'pth',
            label: 'PTH → kidney',
            labelX: 300,
            labelY: 104,
            markerId: 'pth-arrow',
          },
          {
            type: 'axis',
            path: CALCITRIOL_TO_GUT_PATH,
            activation: derived.calcitriolLevel,
            colorToken: 'calcitriol',
            label: 'Calcitriol → gut',
            labelX: 330,
            labelY: 268,
            markerId: 'calcitriol-arrow',
          },
          {
            type: 'axis',
            path: CALCIUM_FEEDBACK_PATH,
            activation: calciumFeedbackIntensity,
            colorToken: 'calcium',
            label: 'Serum Ca feedback',
            labelX: 116,
            labelY: 290,
            markerId: 'calcium-feedback-arrow',
            inhibitory: true,
          },
          // The four parathyroid glands, drawn as small paired ovals on the posterior thyroid.
          {
            type: 'group',
            transform: 'translate(232, 44)',
            children: [
              ...([[-9, -8], [9, -8], [-9, 7], [9, 7]] as const).map(([cx, cy]) => ({
                type: 'group' as const,
                transform: `translate(${cx}, ${cy})`,
                children: [
                  /* Density IS the PTH level. `--pth-level` was set on the group and on the gland and read
                     by nothing, so four parathyroids sat at full saturation whatever the hormone did. */
                  { type: 'path' as const, d: ellipse(6, 5), fill: 'pth' as const, fillOpacity: 0.25 + clamp(derived.pthLevel, 0, 1) * 0.65, colorToken: 'pth', strokeWidth: 1.5 },
                ],
              })),
              { type: 'text', x: 0, y: 28, text: 'Parathyroids', cls: 'organLabel' },
            ],
          },
          {
            type: 'group',
            transform: 'translate(104, 196)',
            children: [
              // Bone pales as it is resorbed, for the same reason and by the same device.
              { type: 'path', d: BONE_PATH, fill: 'calcium', fillOpacity: 0.85 - resorptionRate * 0.55, colorToken: 'calcium', strokeWidth: 2 },
              { type: 'text', x: 0, y: 56, text: 'Bone', cls: 'organLabel' },
            ],
          },
          kidney.node,
          {
            type: 'group',
            transform: 'translate(372, 176)',
            children: [
              { type: 'text', x: 0, y: 58, text: 'Kidney', cls: 'organLabel' },
            ],
          },
          gut.node,
          {
            type: 'group',
            transform: 'translate(240, 258)',
            children: [
              { type: 'text', x: 0, y: 44, text: 'Gut', cls: 'organLabel', anchor: 'middle' },
            ],
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Dietary calcium', key: 'dietaryCalciumIntake', min: 0, max: 2000, step: 50, unit: ' mg' },
      { kind: 'slider', label: 'Dietary phosphate', key: 'dietaryPhosphateIntake', min: 0, max: 2000, step: 50, unit: ' mg' },
      { kind: 'slider', label: 'Vitamin D intake', key: 'vitaminDIntake', min: 0, max: 200, step: 5, unit: '%' },
      { kind: 'slider', label: 'Renal function', key: 'renalFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Parathyroid function', key: 'parathyroidGlandFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Serum magnesium', key: 'serumMagnesium', min: 0.5, max: 3, step: 0.1, unit: ' mg/dL' },
      { kind: 'slider', label: 'Autonomous PTH', key: 'autonomousPTHSecretion', min: 0, max: 100, step: 5 },
    ],
    readouts: [
      {
        label: 'Serum calcium',
        value: (c) => c.derived.serumCalciumMgDl.toFixed(1),
        unit: 'mg/dL',
        secondary: (c) => calciumStatus(c.derived.serumCalciumMgDl),
        colorToken: 'calcium',
      },
      {
        label: 'Serum phosphate',
        value: (c) => c.derived.serumPhosphateMgDl.toFixed(1),
        unit: 'mg/dL',
        secondary: (c) => phosphateStatus(c.derived.serumPhosphateMgDl),
        colorToken: 'phosphate',
      },
      { label: 'PTH', value: (c) => c.derived.pthPgPerML.toFixed(0), unit: ' pg/mL', colorToken: 'pth' },
      { label: 'Calcitriol', value: (c) => (c.derived.calcitriolLevel * 100).toFixed(0), unit: '%', colorToken: 'calcitriol' },
      { label: 'Calcitonin', value: (c) => (c.derived.calcitoninLevel * 100).toFixed(0), unit: '%', colorToken: 'calcitonin' },
      { label: 'Bone resorption', value: (c) => (c.derived.boneResorptionRate * 100).toFixed(0), unit: '%', colorToken: 'calcium' },
      { label: 'Gut Ca absorption', value: (c) => (c.derived.gutCaAbsorptionFraction * 100).toFixed(0), unit: '%', colorToken: 'calcitriol' },
      {
        label: 'Ca × PO4 product',
        value: (c) => c.derived.calciumPhosphateProduct.toFixed(0),
        secondary: (c) => (c.derived.calciumPhosphateProduct > PRECIPITATION.CA_P_PRODUCT_THRESHOLD ? 'calcification risk' : undefined),
        colorToken: 'phosphate',
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'Serum calcium', unit: 'mg/dL', colorToken: 'calcium', domainMin: 4, domainMax: 16, data: (points) => points.map((p) => p.calcium) },
      { kind: 'sparkline', label: 'Serum phosphate', unit: 'mg/dL', colorToken: 'phosphate', domainMin: 0, domainMax: 12, data: (points) => points.map((p) => p.phosphate) },
      { kind: 'sparkline', label: 'PTH', unit: '%', colorToken: 'pth', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.pth * 100) },
    ],
  };
}

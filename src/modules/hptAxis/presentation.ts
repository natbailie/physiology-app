import { clamp } from '@/shared/lib/math';
import { T4 } from './engine/constants';
import type { HptDerived, HptHistoryPoint, HptInputs, HptState } from './engine/types';
import { LABEL_WASH } from '@/shared/presentation/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/* The HPT axis on the shared endocrine scaffold (viewBox 0 0 560 440) — see hpgAxis for the
 * scaffold geometry. One thing here belongs to no other axis: what the thyroid secretes is mostly
 * T4, and T4 is largely a prohormone. The active hormone is made in the peripheral tissues by
 * deiodination, so the conversion step is drawn on the circulation where it happens — that is what
 * makes conversion efficiency a lever, and why someone can have a normal T4 and still be
 * hypothyroid at the tissue. */

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

const HYPOTHALAMUS =
  'M 96 50 C 118 40, 152 44, 160 60 C 166 74, 154 88, 132 90 C 110 92, 94 82, 92 68 C 91 60, 93 54, 96 50 Z';
const STALK = 'M 114 104 L 114 132 M 140 104 L 140 132';
const PORTAL = 'M 118 106 C 126 116, 130 124, 128 134';
const SELLA = 'M 78 148 C 78 184, 108 194, 128 194 C 150 194, 178 184, 178 148';
const TROPHIC = 'M 136 146 C 232 150, 330 168, 380 190';
const SECRETION = 'M 410 266 L 410 282';
const FEEDBACK_GLAND = 'M 196 286 C 186 250, 170 200, 146 174';
const FEEDBACK_HYPO = 'M 92 286 C 62 240, 56 120, 96 66';
const TO_TISSUE = 'M 330 320 L 330 336';
const EXOGENOUS = 'M 20 301 L 60 301';

const GLAND = { x: 410, y: 206 };

// One lobe of the thyroid's butterfly; mirrored for the other side.
const LOBE = 'M -8 -16 C -20 -18, -30 -6, -28 8 C -26 20, -14 24, -8 16 C -3 8, -3 -6, -8 -16 Z';
const LOBE_MIRRORED = 'M 8 -16 C 20 -18, 30 -6, 28 8 C 26 20, 14 24, 8 16 C 3 8, 3 -6, 8 -16 Z';

const ANTERIOR = ellipse(110, 158, 26, 20);
const POSTERIOR = ellipse(152, 155, 14, 16);

/** The number of colloid follicles drawn per lobe follows the gland's functional state, so a
 *  failing thyroid visibly empties out the same way it loses hormone. */
function follicleCount(glandFunction: number): number {
  return Math.max(1, Math.round(glandFunction * 4));
}

type Ctx = PresentationContext<HptState, HptDerived, HptInputs, HptHistoryPoint>;

export function buildHptPresentation(ctx: Ctx): ModulePresentation<HptState, HptDerived, HptInputs, HptHistoryPoint> {
  const { derived } = ctx;

  const trh = clamp(derived.trhDrive, 0, 1);
  const tsh = clamp(derived.tshLevel, 0, 1);
  const t4 = clamp(derived.t4Level / T4.MAX_UGDL, 0, 1);
  const conversion = clamp(derived.conversionEfficiency, 0, 1.5);
  const glandFunction = clamp(derived.thyroidGlandFunction, 0, 1);
  const exogenous = clamp(derived.exogenousLevothyroxine / 100, 0, 1);

  const follicles = Array.from({ length: follicleCount(glandFunction) }, (_, i) => {
    const yCy = -8 + Math.floor(i / 2) * 12 + (i % 2) * 6;
    const cx = 13 + (i % 2) * 7;
    const cy = yCy;
    return [
      { type: 'circle' as const, cx: -cx, cy, r: 3.4, fill: 'thyroid' },
      { type: 'circle' as const, cx, cy, r: 3.4, fill: 'thyroid' },
    ];
  }).flat();

  const tshDisplay = derived.tshMilliUnitsPerL < 0.1 ? derived.tshMilliUnitsPerL.toFixed(3) : derived.tshMilliUnitsPerL.toFixed(2);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'The hypothalamic-pituitary-thyroid axis: TRH down the portal vessels, TSH through the circulation to the thyroid, T4 secreted and converted peripherally to T3, feeding back on the pituitary and hypothalamus',
        defs: [
          { type: 'marker', id: 'trophic-arrow', colorToken: 'tsh' },
          { type: 'marker', id: 'product-arrow', colorToken: 'thyroid' },
          { type: 'marker', id: 'feedback-arrow', colorToken: 'text-dim' },
          { type: 'marker', id: 'tissue-arrow', colorToken: 'text-faint' },
          ...(exogenous > 0.01 ? [{ type: 'marker' as const, id: 'exo-arrow', colorToken: 'danger' }] : []),
        ],
        children: [
          /* ---- Hypothalamus ---- */
          { type: 'path', d: HYPOTHALAMUS, fill: 'co2', colorToken: 'co2', strokeWidth: 1.8 },
          { type: 'text', x: 126, y: 36, text: 'Hypothalamus', cls: 'anatomyStrong', anchor: 'middle' },
          { type: 'path', d: 'M 112 84 L 112 104', colorToken: 'co2', strokeWidth: 1 + trh * 1.6 },
          { type: 'path', d: 'M 126 84 L 126 104', colorToken: 'co2', strokeWidth: 1 + trh * 1.6 },
          { type: 'path', d: 'M 140 84 L 140 104', colorToken: 'co2', strokeWidth: 1 + trh * 1.6 },

          /* ---- Stalk and the hypophyseal portal vessels ---- */
          { type: 'path', d: STALK, colorToken: 'text-faint', strokeWidth: 1.5 },
          { type: 'path', d: PORTAL, colorToken: 'co2', strokeWidth: 1.5 + trh * 2 },
          { type: 'text', x: 158, y: 116, text: 'Portal vessels', cls: 'anatomy' },
          { type: 'text', x: 158, y: 130, text: 'TRH', cls: 'label', colorToken: 'co2' },

          /* ---- Pituitary in its sella ---- */
          { type: 'path', d: SELLA, colorToken: 'text-faint', strokeWidth: 3 },
          /* Washed rather than solid: this shape exists to hold the label written across it, and a
             signal colour at full strength leaves that label at about 1.3:1. */
          { type: 'path', d: ANTERIOR, fill: 'pituitary', fillOpacity: LABEL_WASH, colorToken: 'pituitary', strokeWidth: 1.8 },
          // The posterior lobe carries "post." across it, so it is washed like its neighbour.
          { type: 'path', d: POSTERIOR, fill: 'adh', fillOpacity: LABEL_WASH, colorToken: 'adh', strokeWidth: 1.5 },
          { type: 'text', x: 110, y: 162, text: 'anterior', cls: 'tickLabel', anchor: 'middle', colorToken: 'text-faint' },
          { type: 'text', x: 152, y: 159, text: 'post.', cls: 'tickLabel', anchor: 'middle', colorToken: 'text-faint' },
          { type: 'text', x: 128, y: 210, text: 'Pituitary', cls: 'anatomyStrong', anchor: 'middle' },

          /* ---- Trophic hormone: pituitary to gland, through the blood ---- */
          { type: 'path', d: TROPHIC, colorToken: 'tsh', strokeWidth: 1.5 + tsh * 2.5, markerEnd: 'trophic-arrow' },
          { type: 'text', x: 250, y: 148, text: 'TSH', cls: 'label', colorToken: 'tsh' },

          /* ---- The thyroid, as a butterfly of two lobes and an isthmus with colloid follicles
             inside it — the one endocrine gland that stores months of its product ---- */
          {
            type: 'group',
            transform: `translate(${GLAND.x}, ${GLAND.y})`,
            children: [
              { type: 'path', d: LOBE, fill: 'thyroid', colorToken: 'thyroid', strokeWidth: 1.8 },
              { type: 'path', d: LOBE_MIRRORED, fill: 'thyroid', colorToken: 'thyroid', strokeWidth: 1.8 },
              { type: 'rect', x: -8, y: -4, width: 16, height: 12, fill: 'thyroid' },
              ...follicles,
            ],
          },
          { type: 'text', x: GLAND.x, y: GLAND.y + 52, text: 'Thyroid', cls: 'anatomyStrong', anchor: 'middle' },

          /* ---- The circulation everything downstream shares ---- */
          { type: 'rect', x: 64, y: 286, width: 432, height: 30, fill: 'artery', fillOpacity: LABEL_WASH, stroke: 'artery' },
          { type: 'text', x: 72, y: 306, text: 'Circulation', cls: 'anatomy' },

          /* ---- Secretion into the circulation ---- */
          { type: 'path', d: SECRETION, colorToken: 'thyroid', strokeWidth: 1.5 + t4 * 2.5, markerEnd: 'product-arrow' },
          { type: 'text', x: GLAND.x + 12, y: 282, text: 'T4', cls: 'label', colorToken: 'thyroid' },

          /* ---- Peripheral deiodination, on the circulation where it happens ---- */
          { type: 'path', d: 'M 300 296 L 336 296', colorToken: 'thyroid', strokeWidth: 1.5 + conversion * 2, markerEnd: 'product-arrow' },
          // Four units clear of the circulation band's top edge, which ran along their baseline.
          { type: 'text', x: 296, y: 281, text: 'T4', cls: 'label', colorToken: 'thyroid', anchor: 'end' },
          { type: 'text', x: 340, y: 281, text: 'T3', cls: 'label', colorToken: 'thyroid' },
          { type: 'text', x: 318, y: 312, text: `${(conversion * 100).toFixed(0)}%`, cls: 'tickLabel', anchor: 'middle', colorToken: 'text-faint' },

          /* ---- An exogenous hormone joins the circulation from outside the axis ---- */
          ...(exogenous > 0.01
            ? [
                { type: 'path' as const, d: EXOGENOUS, colorToken: 'danger', strokeWidth: 1.5 + exogenous * 2.5, markerEnd: 'exo-arrow' },
                { type: 'text' as const, x: 20, y: 290, text: 'Levothyroxine', cls: 'label', colorToken: 'danger', opacity: 0.3 + exogenous * 0.7 },
              ]
            : []),

          /* ---- Negative feedback, rising out of the circulation ---- */
          {
            type: 'axis',
            path: FEEDBACK_GLAND,
            activation: t4,
            colorToken: 'text-dim',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'feedback-arrow',
            inhibitory: true,
          },
          {
            type: 'axis',
            path: FEEDBACK_HYPO,
            activation: t4,
            colorToken: 'text-dim',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'feedback-arrow',
            inhibitory: true,
          },
          // 15 units apart: at 12 the two lines of the label touched.
          { type: 'text', x: 40, y: 197, text: 'negative', cls: 'label', colorToken: 'text-dim' },
          { type: 'text', x: 40, y: 212, text: 'feedback', cls: 'label', colorToken: 'text-dim' },

          /* ---- What the hormone actually does ---- */
          { type: 'path', d: TO_TISSUE, colorToken: 'text-faint', strokeWidth: 2, markerEnd: 'tissue-arrow' },
          { type: 'rect', x: 252, y: 338, width: 244, height: 56, fill: 'sarcomere', fillOpacity: LABEL_WASH, stroke: 'sarcomere' },
          { type: 'text', x: 374, y: 358, text: 'Every tissue', cls: 'anatomyStrong', anchor: 'middle' },
          /* Two lines. The band is 244 units wide and this sentence is wider than that at any
             size worth reading it at, so on one line the band's own sides ran through it. */
          { type: 'text', x: 374, y: 371, text: 'basal metabolic rate, heat production,', cls: 'caption', anchor: 'middle', colorToken: 'text-faint' },
          { type: 'text', x: 374, y: 385, text: 'gut and heart rate', cls: 'caption', anchor: 'middle', colorToken: 'text-faint' },

          /* ---- Header readout strip ---- */
          {
            type: 'text',
            x: 20,
            y: 410,
            text: `T4 ${derived.t4Level.toFixed(1)} · T3 ${derived.t3Level.toFixed(1)} · TSH ${tshDisplay} mIU/L`,
            cls: 'label',
          },
          {
            type: 'text',
            x: 20,
            y: 430,
            text: `conversion ${(derived.conversionEfficiency * 100).toFixed(0)}% · TRH drive ${(derived.trhDrive * 100).toFixed(0)}%`,
            cls: 'caption',
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Thyroid gland function', key: 'thyroidGlandFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Pituitary TSH function', key: 'pituitaryTshFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Autonomous thyroid stimulation', key: 'autonomousThyroidStimulation', min: 0, max: 100, step: 5 },
      { kind: 'slider', label: 'Exogenous levothyroxine', key: 'exogenousLevothyroxine', min: 0, max: 300, step: 5, unit: '%' },
      { kind: 'slider', label: 'Illness severity', key: 'illnessSeverity', min: 0, max: 100, step: 5 },
    ],
    readouts: [
      {
        label: 'TSH',
        value: (c) => (c.derived.tshMilliUnitsPerL < 0.1 ? c.derived.tshMilliUnitsPerL.toFixed(3) : c.derived.tshMilliUnitsPerL.toFixed(2)),
        unit: ' mIU/L',
        colorToken: 'tsh',
      },
      { label: 'T4', value: (c) => c.derived.t4Level.toFixed(1), unit: 'µg/dL', colorToken: 'thyroid' },
      { label: 'T3', value: (c) => c.derived.t3Level.toFixed(0), unit: 'ng/dL*', colorToken: 'thyroid' },
      { label: 'Conversion efficiency', value: (c) => `${(c.derived.conversionEfficiency * 100).toFixed(0)}%`, colorToken: 'o2' },
    ],
    charts: [
      { kind: 'sparkline', label: 'TSH', unit: '%', colorToken: 'tsh', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.tsh) },
      { kind: 'sparkline', label: 'T4', unit: 'µg/dL', colorToken: 'thyroid', domainMin: 0, domainMax: 30, data: (points) => points.map((p) => p.t4) },
      { kind: 'sparkline', label: 'T3', unit: 'ng/dL*', colorToken: 'thyroid', domainMin: 0, domainMax: 250, data: (points) => points.map((p) => p.t3) },
    ],
  };
}

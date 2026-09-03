import { clamp } from '@/shared/lib/math';
import { CORTISOL } from './engine/constants';
import type { HpaDerived, HpaHistoryPoint, HpaInputs, HpaState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<HpaState, HpaDerived, HpaInputs, HpaHistoryPoint>;

const AXIS_GLAND = { x: 410, y: 206 };

function roundedRect(x: number, y: number, width: number, height: number, rx: number): string {
  return `M ${x + rx} ${y} h ${width - rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${rx} v ${height - rx * 2} a ${rx} ${rx} 0 0 1 ${-rx} ${rx} h ${-width + rx * 2} a ${rx} ${rx} 0 0 1 ${-rx} ${-rx} v ${-height + rx * 2} a ${rx} ${rx} 0 0 1 ${rx} ${-rx} Z`;
}

export function buildHpaPresentation(ctx: Ctx): ModulePresentation<HpaState, HpaDerived, HpaInputs, HpaHistoryPoint> {
  const { derived } = ctx;

  const crh = clamp(derived.crhDrive, 0, 1);
  const acth = clamp(derived.acthLevel, 0, 1);
  const cortisol = clamp(derived.cortisolLevel / CORTISOL.MAX_UGDL, 0, 1);
  const pituitaryFunction = clamp(derived.pituitaryFunction, 0, 1);
  const glandFunction = clamp(derived.adrenalCortexFunction, 0, 1);
  const reserve = clamp(derived.adrenalReserve, 0, 1);
  const exogenousLevel = clamp(derived.exogenousGlucocorticoid / 100, 0, 1);
  const cortexWidth = 5 + reserve * 9;
  const acthLabel = `${derived.acthPgPerML < 10 ? derived.acthPgPerML.toFixed(1) : derived.acthPgPerML.toFixed(0)} pg/mL`;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'The hypothalamic-pituitary-adrenal axis: CRH down the portal vessels to the anterior pituitary, ACTH through the circulation to the adrenal cortex, and cortisol feeding back on both, with exogenous glucocorticoid entering the circulation from outside the axis',
        defs: [
          { type: 'marker', id: 'axisExcite', colorToken: 'acth' },
          { type: 'marker', id: 'axisInhibit', colorToken: 'text-dim' },
        ],
        children: [
          // ---- Hypothalamus ----
          {
            type: 'path',
            d: 'M 96 50 C 118 40, 152 44, 160 60 C 166 74, 154 88, 132 90 C 110 92, 94 82, 92 68 C 91 60, 93 54, 96 50 Z',
            fill: 'co2',
            colorToken: 'co2',
            styleVars: { 'crh-intensity': crh },
          },
          { type: 'text', x: 126, y: 36, text: 'Hypothalamus', cls: 'anatomyStrong', anchor: 'middle' },
          // Neurosecretory neurons ending on the primary plexus.
          ...[112, 126, 140].map((x) => ({
            type: 'path' as const,
            d: `M ${x} 84 L ${x} 104`,
            colorToken: 'co2' as const,
            styleVars: { 'level': crh },
          })),

          // ---- Stalk and the hypophyseal portal vessels ----
          { type: 'path', d: 'M 114 104 L 114 132 M 140 104 L 140 132', colorToken: 'text-faint' },
          { type: 'path', d: 'M 118 106 C 126 116, 130 124, 128 134', colorToken: 'co2', styleVars: { 'level': crh } },
          { type: 'text', x: 158, y: 116, text: 'Portal vessels', cls: 'anatomy', anchor: 'start' },
          { type: 'text', x: 158, y: 130, text: 'CRH', colorToken: 'co2', anchor: 'start' },

          // ---- Pituitary, in its sella ----
          { type: 'path', d: 'M 78 148 C 78 184, 108 194, 128 194 C 150 194, 178 184, 178 148', colorToken: 'text-faint' },
          { type: 'path', d: ellipse(110, 158, 26, 20), fill: 'pituitary', colorToken: 'pituitary', styleVars: { 'level': pituitaryFunction } },
          { type: 'path', d: ellipse(152, 155, 14, 16), fill: 'adh', colorToken: 'adh' },
          { type: 'text', x: 110, y: 162, text: 'anterior', cls: 'caption', anchor: 'middle' },
          { type: 'text', x: 152, y: 159, text: 'post.', cls: 'caption', anchor: 'middle' },
          { type: 'text', x: 128, y: 210, text: 'Pituitary', cls: 'anatomyStrong', anchor: 'middle' },

          // ---- Trophic hormone: ACTH through the blood to the gland ----
          {
            type: 'axis',
            path: 'M 136 146 C 232 150, 330 168, 380 190',
            activation: acth,
            colorToken: 'acth',
            label: 'ACTH',
            labelX: 250,
            labelY: 148,
            markerId: 'axisExcite',
          },

          // ---- The target gland (adrenal), drawn at the gland origin ----
          {
            type: 'group',
            transform: `translate(${AXIS_GLAND.x}, ${AXIS_GLAND.y})`,
            styleVars: { 'level': glandFunction, 'cortisol-intensity': cortisol, 'adrenal-reserve': reserve },
            children: [
              // Kidney beneath, for scale and orientation.
              { type: 'path', d: 'M -20 6 C -30 6, -34 18, -26 28 C -18 38, 2 40, 12 30 C 22 20, 18 6, 6 4 C -2 3, -12 4, -20 6 Z', fill: 'kidney', colorToken: 'kidney' },
              // Adrenal cap: outer cortex (thickness is the reserve), inner medulla.
              { type: 'path', d: 'M -22 -2 C -20 -22, -4 -32, 8 -26 C 22 -20, 26 -6, 18 0 C 6 6, -12 8, -22 -2 Z', colorToken: 'cortisol', strokeWidth: cortexWidth, styleVars: { 'cortisol-intensity': cortisol } },
              { type: 'path', d: 'M -12 -4 C -10 -16, -2 -22, 6 -18 C 14 -14, 14 -6, 8 -3 C 1 0, -8 1, -12 -4 Z', fill: 'adrenal-medulla', colorToken: 'adrenal-medulla' },
              { type: 'text', x: 30, y: -14, text: 'cortex', cls: 'valueLabel', anchor: 'start' },
              { type: 'text', x: 30, y: -2, text: 'medulla', cls: 'valueLabel', anchor: 'start' },
            ],
          },
          { type: 'text', x: AXIS_GLAND.x, y: AXIS_GLAND.y + 52, text: 'Adrenal', cls: 'anatomyStrong', anchor: 'middle' },

          // ---- The circulation everything downstream shares ----
          { type: 'path', d: roundedRect(64, 286, 432, 30, 15), fill: 'artery', colorToken: 'artery' },
          { type: 'text', x: 72, y: 306, text: 'Circulation', cls: 'anatomy', anchor: 'start' },
          {
            type: 'axis',
            path: `M ${AXIS_GLAND.x} ${AXIS_GLAND.y + 60} L ${AXIS_GLAND.x} 282`,
            activation: cortisol,
            colorToken: 'cortisol',
            label: 'Cortisol',
            labelX: AXIS_GLAND.x + 12,
            labelY: 282,
            markerId: 'axisExcite',
          },

          // ---- Exogenous glucocorticoid joins the circulation from outside the axis ----
          ...(exogenousLevel > 0.01
            ? [
                {
                  type: 'path' as const,
                  d: 'M 20 301 L 60 301',
                  colorToken: 'danger' as const,
                  markerEnd: 'axisExcite' as const,
                  styleVars: { 'level': exogenousLevel },
                },
                {
                  type: 'text' as const,
                  x: 20,
                  y: 290,
                  text: 'Exogenous steroid',
                  colorToken: 'danger' as const,
                  anchor: 'start' as const,
                  styleVars: { 'level': exogenousLevel },
                },
              ]
            : []),

          // ---- Negative feedback rising out of the circulation ----
          {
            type: 'axis',
            path: 'M 196 286 C 186 250, 170 200, 146 174',
            activation: cortisol,
            colorToken: 'text-dim',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'axisInhibit',
            inhibitory: true,
          },
          {
            type: 'axis',
            path: 'M 92 286 C 62 240, 56 120, 96 66',
            activation: cortisol,
            colorToken: 'text-dim',
            label: '',
            labelX: 0,
            labelY: 0,
            markerId: 'axisInhibit',
            inhibitory: true,
          },
          { type: 'text', x: 40, y: 200, text: 'negative', colorToken: 'text-dim' },
          { type: 'text', x: 40, y: 212, text: 'feedback', colorToken: 'text-dim' },

          // ---- What the hormone actually does (target tissue) ----
          { type: 'path', d: 'M 330 320 L 330 336', colorToken: 'text-faint', markerEnd: 'axisExcite' },
          { type: 'path', d: roundedRect(252, 338, 244, 56, 9), fill: 'sarcomere', colorToken: 'sarcomere', styleVars: { 'level': cortisol } },
          { type: 'text', x: 374, y: 358, text: 'Liver · muscle · immune system', cls: 'anatomyStrong', anchor: 'middle' },
          { type: 'text', x: 374, y: 372, text: 'gluconeogenesis up, protein broken down, inflammation damped', cls: 'caption', anchor: 'middle' },

          // ---- Readings summary ----
          {
            type: 'text',
            x: 20,
            y: 410,
            text: `Cortisol ${derived.cortisolLevel.toFixed(1)} µg/dL · ACTH ${acthLabel}`,
            cls: 'pathLabel',
          },
          {
            type: 'text',
            x: 20,
            y: 430,
            text: `adrenal reserve ${(derived.adrenalReserve * 100).toFixed(0)}% · CRH drive ${(derived.crhDrive * 100).toFixed(0)}%`,
            cls: 'caption',
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Acute stress level', key: 'acuteStressLevel', min: 0, max: 100, step: 5 },
      { kind: 'slider', label: 'Exogenous glucocorticoid', key: 'exogenousGlucocorticoid', min: 0, max: 300, step: 5, unit: '%' },
      { kind: 'slider', label: 'Pituitary function', key: 'pituitaryFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Adrenal cortex function', key: 'adrenalCortexFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Autonomous adrenal secretion', key: 'autonomousAdrenalSecretion', min: 0, max: 100, step: 5 },
    ],
    readouts: [
      { label: 'Cortisol', value: (c) => c.derived.cortisolLevel.toFixed(1), unit: 'µg/dL', colorToken: 'cortisol' },
      {
        label: 'ACTH',
        value: (c) => (c.derived.acthPgPerML < 10 ? c.derived.acthPgPerML.toFixed(1) : c.derived.acthPgPerML.toFixed(0)),
        unit: ' pg/mL',
        colorToken: 'acth',
      },
      { label: 'CRH drive', value: (c) => `${(c.derived.crhDrive * 100).toFixed(0)}%`, colorToken: 'co2' },
      { label: 'Adrenal reserve', value: (c) => `${(c.derived.adrenalReserve * 100).toFixed(0)}%`, colorToken: 'text' },
    ],
    charts: [
      { kind: 'sparkline', label: 'Cortisol', unit: 'µg/dL', colorToken: 'cortisol', domainMin: 0, domainMax: 40, data: (points) => points.map((p) => p.cortisol) },
      { kind: 'sparkline', label: 'ACTH', unit: '%', colorToken: 'acth', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.acth * 100) },
      { kind: 'sparkline', label: 'Adrenal reserve', unit: '%', colorToken: 'text', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.adrenalReserve * 100) },
    ],
  };
}

function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
}

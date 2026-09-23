import { clamp } from '@/shared/lib/math';
import { CLASSIFICATION } from './engine/constants';
import type { FetalDerived, FetalHistoryPoint, FetalInputs, FetalState } from './engine/types';
import type { ModulePresentation, PresentationContext, ControlSpec } from '@/shared/presentation/types';

/* The circuit, in the same box-and-line language the hand-drawn diagram used: two columns of
 * heart chambers, a lung and placental bed each at the end of a vascular limb, and the three
 * shunts (ductus venosus, foramen ovale, ductus arteriosus) that carry blood around them. Blood
 * is coloured blue-to-red by how oxygenated it is, and a shunt's width tracks how much flow it
 * is carrying while its direction (and the arrowhead) track which way the blood is going.
 *
 * The schema draws outlined boxes and circles through PathNode (stroke + fill + width in one
 * node), so every chamber and bed below is a rectangle or circle path rather than a rect/circle
 * primitive. */

const rectPath = (x: number, y: number, w: number, h: number) => `M${x},${y} H${x + w} V${y + h} H${x} Z`;
const circlePath = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z`;

const ASCENDING_AORTA = 'M 294 256 L 318 256 L 318 126 Q 318 100 344 100 L 368 100';
const DESCENDING_AORTA = 'M 368 100 Q 394 100 394 126 L 394 330';
const BRACHIOCEPHALIC = 'M 344 100 L 344 64';
const PULMONARY_TRUNK = 'M 146 256 Q 110 256 110 230 L 110 172 Q 110 156 130 156 L 200 156';
const LUNG_BRANCH = 'M 152 156 L 112 116';
const PULMONARY_VEIN = 'M 138 106 L 234 186';
const UMBILICAL_ARTERIES = 'M 206 352 L 86 352';
const UMBILICAL_VEIN = 'M 52 330 L 52 312 L 84 312';
const DUCTUS_VENOSUS = 'M 84 312 Q 112 278 140 292';
const IVC = 'M 140 292 L 136 292 L 136 216 L 146 216';

/* The ductus arteriosus joins the aorta at the isthmus, DISTAL to the branches that feed the
 * head and right arm — that is the whole anatomical reason "pre-ductal" and "post-ductal" exist
 * as separate readings. It is drawn forward (pulmonary trunk → aorta) for the fetal right-to-left
 * pattern and reversed when transition flips it to left-to-right. */
const DUCTUS_FORWARD = 'M 200 156 Q 296 126 392 150';
const DUCTUS_REVERSE = 'M 392 150 Q 296 126 200 156';

const FORAMEN = 'M 210 208 L 230 208';

/* A vessel's stroke is picked from the two-blood-colour scheme by how oxygenated its blood is.
 * The engine computes a continuous arterial-to-venous mix; the schema can only carry a token, so
 * this turns it into a thresholded red/blue on the same convention the original used. */
function bySat(percent: number): 'artery' | 'venous' {
  return percent >= 55 ? 'artery' : 'venous';
}

type Ctx = PresentationContext<FetalState, FetalDerived, FetalInputs, FetalHistoryPoint>;

/**
 * The control rail, hoisted so the page can read the same ranges the schema declares —
 * `useInputNudge` clamps a button's delta to the slider it writes, and restating that range at
 * the call site would be a second place to be wrong.
 */
export const FETAL_CONTROLS: ReadonlyArray<ControlSpec<FetalInputs>> = [
  { kind: 'slider', label: 'Placental circulation', key: 'placentalCirculation', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Lung inflation', key: 'lungInflation', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Inspired oxygen', key: 'inspiredOxygen', min: 0.21, max: 1, step: 0.01, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Pulmonary vasoreactivity', key: 'pulmonaryVasoreactivity', min: 0, max: 2, step: 0.02, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Prostaglandin', key: 'prostaglandinLevel', min: 0, max: 100, step: 1, unit: '%' },
  { kind: 'slider', label: 'Systemic tone', key: 'systemicToneScale', min: 0.4, max: 2, step: 0.05, unit: '%', format: 'percent' },
];

export function buildFetalCirculationPresentation(ctx: Ctx): ModulePresentation<FetalState, FetalDerived, FetalInputs, FetalHistoryPoint> {
  const { derived } = ctx;

  const placental = clamp(derived.placentalCirculation, 0.05, 1);
  const lungFlow = clamp(derived.pulmonaryFlowFraction, 0, 1);
  const source = derived.oxygenatedSourceSaturation;
  const pre = derived.preDuctalSaturationPercent;
  const post = derived.postDuctalSaturationPercent;

  /* The ductus arteriosus: the shunt whose direction and patency the whole transition turns on. */
  const ductalMagnitude = clamp(Math.abs(derived.ductalShuntFraction), 0, 1);
  const ductOpen = derived.ductusArteriosusPatency;
  const ductRightToLeft = derived.ductalShuntFraction > 0;
  const ductClosed = ductOpen < 0.12;
  const ductusPath = ductClosed || ductRightToLeft ? DUCTUS_FORWARD : DUCTUS_REVERSE;
  const ductusStrokeWidth = 1 + ductalMagnitude * 9;
  const ductusToken = ductClosed ? 'text-faint' : ductRightToLeft ? 'venous' : 'artery';
  const ductusMarker = ductClosed ? undefined : ductRightToLeft ? 'venous-arrow' : 'arterial-arrow';

  /* Foramen ovale: a flap in the interatrial septum that only ever shunts right-to-left, and is
   * held shut by left-atrial pressure the moment the lungs take over. */
  const atrialFlow = clamp(Math.abs(derived.atrialShuntFraction) * 2, 0, 1);
  const foramenOpen = derived.foramenOvalePatency;
  const foramenClosed = foramenOpen < 0.12;
  const foramenToken = foramenClosed ? 'text-faint' : 'venous';

  // Vessels carrying the continuous aortic mix, thresholded to the two-blood-colour scheme.
  const ascendingToken = bySat(pre);
  const descendingToken = bySat(post);
  const sourceToken = bySat(source);

  const gap = derived.saturationGradientPercent;

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 400],
        ariaLabel: 'Fetal circulation: the three shunts, and where pre- and post-ductal blood diverge',
        defs: [
          { type: 'marker', id: 'arterial-arrow', colorToken: 'artery' },
          { type: 'marker', id: 'venous-arrow', colorToken: 'venous' },
        ],
        children: [
          /* The prostaglandin holding the duct open — the infusion, not its effect.
           *
           * Patency is state and takes time to follow, so a duct-dependent lesion on prostin looked
           * exactly like one without it at the moment the scenario was pressed. What is true
           * immediately is that the drug is running, so it is drawn as an infusion band over the
           * duct it is acting on. */
          ...(derived.prostaglandinLevel > 0
            ? [
                {
                  type: 'path' as const,
                  d: 'M 248 112 Q 296 96 344 110',
                  colorToken: 'raas',
                  strokeWidth: 0.8 + clamp(derived.prostaglandinLevel / 100, 0, 1) * 4,
                  strokeLinecap: 'round' as const,
                  fill: 'none' as const,
                  opacity: 0.8,
                },
                // Anchored END at x=240, clear of 'Aortic arch' which occupies up to x=310 on the same line.
                { type: 'text' as const, x: 240, y: 92, text: `prostin ${derived.prostaglandinLevel.toFixed(0)}%`, cls: 'caption', anchor: 'end' as const, halo: 'bg' as const },
              ]
            : []),
          /* ---- Lungs. Barely perfused and fluid-filled until the first breath. ---- */
          { type: 'path', d: circlePath(74, 78, 30), colorToken: 'o2', strokeWidth: 2.5, fill: 'none' },
          { type: 'path', d: circlePath(124, 78, 30), colorToken: 'o2', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 72, y: 132, text: 'Lungs', cls: 'anatomyStrong' },

          /* ---- Upper body, fed from the arch BEFORE the duct joins ---- */
          { type: 'path', d: rectPath(206, 22, 210, 42), colorToken: 'panel-border', strokeWidth: 1, fill: 'panel-raised' },
          { type: 'text', x: 218, y: 40, text: 'Head & right arm', cls: 'anatomyStrong' },
          { type: 'text', x: 218, y: 55, text: 'pre-ductal', cls: 'anatomy' },
          { type: 'text', x: 404, y: 49, text: `${pre.toFixed(0)}%`, cls: 'valueLabel', anchor: 'end', colorToken: pre >= 88 ? 'o2' : 'danger' },

          /* ---- Heart. Right chambers on the patient's right, so the viewer's left. ---- */
          { type: 'path', d: rectPath(146, 186, 74, 46), colorToken: 'venous', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 183, y: 210, text: 'RA', cls: 'valueLabel', anchor: 'middle' },
          { type: 'text', x: 183, y: 225, text: `${derived.rightAtrialPressureMmHg.toFixed(0)} mmHg`, cls: 'tickLabel', anchor: 'middle' },

          { type: 'path', d: rectPath(220, 186, 74, 46), colorToken: 'artery', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 257, y: 210, text: 'LA', cls: 'valueLabel', anchor: 'middle' },
          { type: 'text', x: 257, y: 225, text: `${derived.leftAtrialPressureMmHg.toFixed(0)} mmHg`, cls: 'tickLabel', anchor: 'middle' },

          { type: 'path', d: rectPath(146, 232, 74, 54), colorToken: 'venous', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 183, y: 264, text: 'RV', cls: 'valueLabel', anchor: 'middle' },
          { type: 'path', d: rectPath(220, 232, 74, 54), colorToken: 'artery', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 257, y: 264, text: 'LV', cls: 'valueLabel', anchor: 'middle' },

          /* ---- Foramen ovale: a flap, open only while the right atrium is at the higher
                  pressure — the reason it shuts functionally at the first breath. ---- */
          { type: 'path', d: FORAMEN, strokeWidth: foramenClosed ? 1 : 1 + atrialFlow * 9, colorToken: foramenToken, markerEnd: foramenOpen ? 'venous-arrow' : undefined },
          { type: 'text', x: 220, y: 168, text: 'Foramen ovale', cls: 'anatomy', anchor: 'middle' },

          /* ---- Pulmonary trunk, continuing into the duct; the pulmonary arteries are the
                  branch that peels off to the lung, and in utero they take almost nothing. ---- */
          { type: 'path', d: PULMONARY_TRUNK, strokeWidth: 3, colorToken: 'venous' },
          { type: 'text', x: 116, y: 140, text: 'Pulmonary trunk', cls: 'anatomy' },
          { type: 'path', d: LUNG_BRANCH, strokeWidth: 1.5 + lungFlow * 6, colorToken: 'venous' },

          /* ---- Ductus arteriosus: joining the aorta at the isthmus, DISTAL to the head. ---- */
          { type: 'path', d: ductusPath, strokeWidth: ductusStrokeWidth, colorToken: ductusToken, markerEnd: ductusMarker },
          { type: 'text', x: 238, y: 118, text: 'Ductus arteriosus', cls: 'anatomy' },

          /* ---- Aorta. A casing stroke under the blood-coloured one so the duct reads as
                  passing behind it, then the vessel itself. ---- */
          { type: 'path', d: ASCENDING_AORTA, colorToken: 'text-faint', strokeWidth: 9 },
          { type: 'path', d: DESCENDING_AORTA, colorToken: 'text-faint', strokeWidth: 9 },
          { type: 'path', d: ASCENDING_AORTA, strokeWidth: 3.5, colorToken: ascendingToken },
          { type: 'path', d: DESCENDING_AORTA, strokeWidth: 3.5, colorToken: descendingToken },
          { type: 'path', d: BRACHIOCEPHALIC, strokeWidth: 3.5, colorToken: ascendingToken },
          { type: 'text', x: 310, y: 92, text: 'Aortic arch', cls: 'anatomy', anchor: 'end' },
          { type: 'text', x: 404, y: 200, text: 'Descending', cls: 'anatomy' },
          { type: 'text', x: 404, y: 214, text: 'aorta', cls: 'anatomy' },

          /* ---- Lower body, fed beyond the duct ---- */
          { type: 'path', d: rectPath(206, 330, 210, 42), colorToken: 'panel-border', strokeWidth: 1, fill: 'panel-raised' },
          { type: 'text', x: 218, y: 348, text: 'Lower body & feet', cls: 'anatomyStrong' },
          { type: 'text', x: 218, y: 363, text: 'post-ductal', cls: 'anatomy' },
          { type: 'text', x: 404, y: 357, text: `${post.toFixed(0)}%`, cls: 'valueLabel', anchor: 'end', colorToken: post >= 88 ? 'o2' : 'danger' },

          /* ---- Placenta, umbilical vessels, liver and the ductus venosus. The umbilical
                  vessels fade (thin) once the cord is clamped, the hallmark of transition. ---- */
          { type: 'path', d: UMBILICAL_ARTERIES, strokeWidth: 3 * placental, colorToken: 'venous' },
          { type: 'text', x: 104, y: 370, text: 'Umbilical arteries', cls: 'anatomy' },

          { type: 'path', d: circlePath(52, 352, 22), colorToken: 'placenta', strokeWidth: 2.5, fill: 'none' },
          { type: 'text', x: 22, y: 392, text: 'Placenta', cls: 'anatomyStrong' },

          { type: 'path', d: UMBILICAL_VEIN, strokeWidth: 3 * placental, colorToken: sourceToken },
          { type: 'path', d: rectPath(84, 300, 50, 24), colorToken: 'liver', strokeWidth: 2, fill: 'none' },
          { type: 'text', x: 92, y: 316, text: 'Liver', cls: 'anatomy' },

          /* The bypass around the liver, carrying the best-oxygenated blood in the body — the
             stream aimed at the foramen ovale. It fades as it closes once the cord is cut. */
          { type: 'path', d: DUCTUS_VENOSUS, strokeWidth: 3 * clamp(derived.ductusVenosusPatency, 0.1, 1), colorToken: sourceToken },
          { type: 'text', x: 58, y: 266, text: 'Ductus venosus', cls: 'anatomy' },
          { type: 'text', x: 80, y: 296, text: `${source.toFixed(0)}%`, cls: 'valueLabel', anchor: 'end', colorToken: source >= 88 ? 'o2' : 'danger' },

          /* IVC: the placental stream arriving at the right atrium, aimed at the foramen. */
          { type: 'path', d: IVC, strokeWidth: 3 * placental, colorToken: sourceToken },

          /* Pulmonary veins: what little the lungs return, into the left atrium. */
          { type: 'path', d: PULMONARY_VEIN, strokeWidth: 2.5 * (0.2 + lungFlow * 0.8), colorToken: 'artery' },

          /* ---- Readings ---- */
          { type: 'text', x: 206, y: 14, text: `PVR ${derived.pulmonaryVascularResistance.toFixed(1)} · SVR ${derived.systemicVascularResistance.toFixed(2)} · lungs take ${(derived.pulmonaryFlowFraction * 100).toFixed(0)}% of output`, cls: 'caption' },

          /* ---- The verdict and the colour key ---- */
          { type: 'text', x: 424, y: 244, text: derived.phase, cls: 'verdict' },
          ...(gap > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT
            ? [{ type: 'text' as const, x: 424, y: 306, text: 'differential cyanosis', cls: 'alarm' }]
            : []),
          {
            type: 'group',
            transform: 'translate(424, 328)',
            children: [
              { type: 'path', d: 'M0,3 H100', colorToken: 'text-faint', strokeWidth: 7 },
              { type: 'text', x: 0, y: 20, text: 'less O₂', cls: 'tickLabel', anchor: 'start' },
              { type: 'text', x: 100, y: 20, text: 'more O₂', cls: 'tickLabel', anchor: 'end' },
            ],
          },
        ],
      },
    ],
    controls: FETAL_CONTROLS,
    readouts: [
      { label: 'Pre-ductal SpO₂', value: (c) => c.derived.preDuctalSaturationPercent.toFixed(0), unit: '%', secondary: () => 'right arm', colorToken: 'o2' },
      {
        label: 'Post-ductal SpO₂',
        value: (c) => c.derived.postDuctalSaturationPercent.toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.saturationGradientPercent > CLASSIFICATION.DIFFERENTIAL_GAP_PERCENT ? `${c.derived.saturationGradientPercent.toFixed(0)}% below the arm` : 'foot'),
        colorToken: 'o2',
      },
      {
        label: 'Pulmonary resistance',
        value: (c) => c.derived.pulmonaryVascularResistance.toFixed(1),
        unit: 'x mature',
        secondary: (c) => (c.derived.pulmonaryVascularResistance > c.derived.systemicVascularResistance ? 'exceeds systemic' : 'below systemic'),
        colorToken: 'venous',
      },
      {
        label: 'Systemic resistance',
        value: (c) => c.derived.systemicVascularResistance.toFixed(2),
        secondary: (c) => (c.derived.placentalCirculation > 0.1 ? 'placenta attached' : 'cord clamped'),
        colorToken: 'artery',
      },
      { label: 'Pulmonary flow', value: (c) => (c.derived.pulmonaryFlowFraction * 100).toFixed(0), unit: '% of output', colorToken: 'o2' },
      {
        label: 'Ductal shunt',
        value: (c) => `${Math.abs(c.derived.ductalShuntFraction * 100).toFixed(0)}%`,
        secondary: (c) => (Math.abs(c.derived.ductalShuntFraction) < CLASSIFICATION.SIGNIFICANT_SHUNT ? 'none' : c.derived.ductalShuntFraction > 0 ? 'right to left' : 'left to right'),
        colorToken: derived.ductalShuntFraction > 0 ? 'venous' : 'artery',
      },
      {
        label: 'Duct patency',
        value: (c) => (c.derived.ductusArteriosusPatency * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.prostaglandinLevel > 40 ? 'held open by prostin' : undefined),
        colorToken: 'venous',
      },
      {
        label: 'Foramen ovale',
        value: (c) => (c.derived.foramenOvalePatency * 100).toFixed(0),
        unit: '%',
        secondary: (c) => (c.derived.leftAtrialPressureMmHg > c.derived.rightAtrialPressureMmHg ? 'held shut by LA pressure' : 'shunting'),
        colorToken: 'venous',
      },
      { label: 'Phase', value: (c) => c.derived.phase, secondary: (c) => c.derived.shuntSummary, colorToken: 'text' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Pre-ductal SpO₂',
        unit: '%',
        colorToken: 'o2',
        secondaryLabel: 'post-ductal',
        secondaryColorToken: 'danger',
        domainMin: 20,
        domainMax: 100,
        data: (points) => points.map((p) => p.preDuctal),
        secondaryData: (points) => points.map((p) => p.postDuctal),
      },
      {
        kind: 'sparkline',
        label: 'Pulmonary resistance',
        unit: 'x',
        colorToken: 'venous',
        domainMin: 0,
        domainMax: 13,
        data: (points) => points.map((p) => p.pvr),
      },
      {
        kind: 'sparkline',
        label: 'Duct patency',
        unit: '%',
        colorToken: 'venous',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.ductus * 100),
      },
      {
        kind: 'sparkline',
        label: 'Pulmonary flow',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.pulmonaryFlow * 100),
      },
    ],
  };
}

import type { MicturitionDerived, MicturitionHistoryPoint, MicturitionInputs, MicturitionInternalState } from './engine/types';
import { BLADDER } from './engine/constants';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';
import { bladderScene } from '@/shared/diagram/organShapes';

/* The drawing was laid out on its own 200x220 canvas, then scaled into the house 560x440
 * frame as a whole: 1.6x puts the 7-unit labels at ~11, the size every other diagram's
 * label is. All coordinates below live in that 200x220 space. */
const FIT = 'translate(120, 44) scale(1.6)';

type Ctx = PresentationContext<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint>;

export function buildMicturitionPresentation(ctx: Ctx): ModulePresentation<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint> {
  const { derived, inputs } = ctx;
  const volumeFraction = derived.bladderVolumeML / BLADDER.MAX_CAPACITY_ML;
  /* Read from the INPUTS: cortical inhibition never reaches `derived`. Coerced, because the
   * control writes it as a 0-or-100 slider while the input is typed boolean — a pre-existing
   * mismatch that works because 0 is falsy, and one this drawing must not depend on the shape of. */
  const holding = Boolean(inputs.cortexInhibitsMicturition);

  /* The bladder is `bladderScene` now rather than two ellipses and a pair of rects. Placed on
   * the old drawing's own coordinates — the builder's natural size is about 130 by 150 with the
   * body on the origin, so 1.15 gives it roughly half the plate, which is what every reference
   * in docs/diagrams/references gives its subject. The three nerves are re-aimed at the wall
   * that moved: at the old scale they ended where the wall used to be and now ended inside it.
   *
   * Every input that used to move a hand-drawn part still moves one: volume drives the dome and
   * the fluid, detrusor tone the wall, and the two sphincters are collars of their own rather
   * than two rects that shared `externalSphincterTone` between them — which they did, so the
   * internal sphincter has never actually been drawn by the nerve that controls it. */
  const bladder = bladderScene(
    { x: 100, y: 130, scale: 1.15 },
    {
      fillLevel: volumeFraction,
      detrusorTone: derived.detrusorTone,
      internalTone: derived.sympatheticActivity,
      externalTone: derived.externalSphincterTone,
    },
  );


  const parasympatheticWidth = 1 + derived.parasympatheticActivity * 3;
  const sympatheticWidth = 1 + derived.sympatheticActivity * 3;

  const afferentRadius = 2 + derived.afferentFiringRate * 6;


  const volumeColor =
    derived.bladderVolumeML >= BLADDER.MAX_CAPACITY_ML - 10
      ? 'danger'
      : derived.bladderVolumeML >= BLADDER.STRONG_DESIRE_ML
        ? 'artery'
        : 'text';
  const pressureColor = derived.intravesicalPressureCmH2O > 50 ? 'danger' : 'text';
  const detrusorColor = derived.detrusorTone > 0.6 ? 'danger' : 'text';
  const sphincterColor = derived.externalSphincterTone < 0.3 && derived.detrusorTone > 0.3 ? 'danger' : 'text';
  const afferentColor = derived.afferentFiringRate > 0.7 ? 'danger' : 'text';
  const flowColor = derived.netFlowRateMLperMin < -10 ? 'o2' : 'text';


  const bladderChildren: SceneNode[] = [
    /* The descending cortical brake on the voiding reflex.
     *
     * The one thing in this module that makes continence voluntary, and the drawing had no
     * pathway for it — so the control that decides whether a full bladder empties on the spot
     * moved nothing. Drawn as a descending fibre onto the pelvic nerve it inhibits, with a
     * crossbar rather than an arrowhead because it is an INHIBITORY connection: the same sign
     * convention `HormoneArrow` uses everywhere else in the app.
     */
    {
      type: 'path' as const,
      d: 'M52,-6 L52,28',
      colorToken: 'parasympathetic',
      strokeWidth: holding ? 3 : 1,
      opacity: holding ? 0.95 : 0.3,
      fill: 'none' as const,
    },
    ...(holding
      ? [{ type: 'path' as const, d: 'M44,28 L60,28', colorToken: 'parasympathetic', strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' as const }]
      : []),
    // The group is translate(120,44) scale(1.6), so y=-14 puts the baseline at 21.6 and the cap
    // height inside the frame. At -22 the ascenders were clipped by five pixels.
    { type: 'text' as const, x: 52, y: -14, text: 'Cortex', cls: 'label', colorToken: 'parasympathetic', anchor: 'middle' as const },
    {
      type: 'text' as const,
      x: 68,
      y: 42,
      text: holding ? 'holding' : 'released',
      cls: 'caption',
      colorToken: 'parasympathetic',
    },

    // Parasympathetic nerve (left) — contracts detrusor.
    {
      type: 'path' as const,
      d: 'M30,40 L58,104',
      colorToken: 'danger',
      strokeWidth: parasympatheticWidth,
      opacity: 0.6 + derived.parasympatheticActivity * 0.4,
    },
    { type: 'text' as const, x: 15, y: 35, text: 'Pelvic n.', cls: 'label', colorToken: 'danger', opacity: 0.8 },

    // Sympathetic nerve (right) — relaxes detrusor, contracts internal sphincter.
    {
      type: 'path' as const,
      d: 'M170,40 L142,104',
      colorToken: 'o2',
      strokeWidth: sympatheticWidth,
      opacity: 0.6 + derived.sympatheticActivity * 0.4,
    },
    { type: 'text' as const, x: 148, y: 35, text: 'Hypogastric n.', cls: 'label', colorToken: 'o2', opacity: 0.8 },

    // Afferent stretch-receptor nerve (bottom-left).
    {
      type: 'path' as const,
      d: 'M40,196 L64,168',
      colorToken: 'cortisol',
      strokeWidth: 1 + derived.afferentFiringRate * 2,
      opacity: 0.5 + derived.afferentFiringRate * 0.5,
    },
    {
      type: 'circle' as const,
      cx: 34,
      cy: 202,
      r: afferentRadius,
      fill: 'cortisol',
      opacity: 0.4 + derived.afferentFiringRate * 0.6,
    },
    { type: 'text' as const, x: 8, y: 218, text: 'Stretch Rx', cls: 'label', colorToken: 'cortisol', opacity: 0.8 },

    bladder.node,

    // Volume text.
    {
      type: 'text' as const,
      x: 100,
      y: 143,
      text: `${derived.bladderVolumeML.toFixed(0)} mL`,
      cls: 'valueLabel',
      colorToken: 'text',
      anchor: 'middle' as const,
    },


    // Pressure indicator.
    {
      type: 'text' as const,
      x: 155,
      y: 115,
      text: `${derived.intravesicalPressureCmH2O.toFixed(1)} cmH₂O`,
      cls: 'label',
      colorToken: 'text',
      opacity: 0.8,
    },

    /* Net flow. The arrow gives the direction; the number says what the phase label above
     * cannot — both used to read "filling".
     *
     * It sat at y=218, under the bladder neck, which was clear space until the organ grew and
     * the rail put "External sphincter" and "Urethra" through exactly there. Moved up beside
     * the phase label, which is the other thing on this drawing that is a reading rather than
     * a part — and below it rather than beside it, because at y=32 it landed on
     * "released", the cortical state, which is also a reading. */
    ...(derived.netFlowRateMLperMin < -10
      ? [
          {
            type: 'text' as const,
            x: 100,
            y: 58,
            text: `↓ ${Math.abs(derived.netFlowRateMLperMin).toFixed(0)} mL/min`,
            cls: 'valueLabel',
            colorToken: 'o2',
            anchor: 'middle' as const,
          },
        ]
      : []),
    ...(derived.netFlowRateMLperMin > 0
      ? [
          {
            type: 'text' as const,
            x: 100,
            y: 58,
            text: `↑ ${derived.netFlowRateMLperMin.toFixed(1)} mL/min`,
            cls: 'valueLabel',
            colorToken: 'text',
            anchor: 'middle' as const,
          },
        ]
      : []),

    // Phase label.
    {
      type: 'text' as const,
      x: 100,
      y: 15,
      text: derived.phase,
      cls: 'label',
      colorToken: 'text',
      anchor: 'middle' as const,
      opacity: 0.8,
    },
  ];

  return {
    diagram: [
      {
        type: 'frame' as const,
        /* Widened by one 120-unit gutter each side for the label rail; the drawing has not moved.
         * 120 rather than the default 96 because "External sphincter" needs about 100. */
        viewBox: [-120, 0, 800, 440],
        ariaLabel:
          'Bladder in coronal section with its detrusor wall, trigone, both ureteric orifices and the internal and external sphincters in series down the urethra, with the pelvic, hypogastric and afferent nerves supplying them',
        defs: bladder.defs,
        children: [
          {
            type: 'group' as const,
            transform: FIT,
            children: bladderChildren,
          },
          /* Targets are in FRAME coordinates, not the 200x220 local space: the rail sits outside
           * the `FIT` group, so each one is 120 + local * 1.6. */
          {
            type: 'labelRail' as const,
            gutter: 120,
            items: [
              { text: 'Detrusor', target: [206, 197] as [number, number], side: 'left' as const },
              { text: 'Ureteric orifice', target: [232, 278] as [number, number], side: 'left' as const },
              { text: 'Trigone', target: [280, 300] as [number, number], side: 'right' as const },
              { text: 'Internal sphincter', target: [280, 344] as [number, number], side: 'right' as const },
              { text: 'External sphincter', target: [280, 381] as [number, number], side: 'right' as const },
              { text: 'Urethra', target: [280, 410] as [number, number], side: 'right' as const },
            ],
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Urine production', key: 'urineProductionMLperMin', min: 0.5, max: 5, step: 0.5, unit: ' mL/min' },
      { kind: 'slider', label: 'Parasympathetic (pelvic nerve)', key: 'parasympatheticPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Sympathetic (hypogastric nerve)', key: 'sympatheticPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'External sphincter', key: 'voluntarySphincterPct', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Cortex inhibition of reflex', key: 'cortexInhibitsMicturition', min: 0, max: 100, step: 100, unit: '%' },
    ],
    readouts: [
      {
        label: 'Volume',
        value: (c) => c.derived.bladderVolumeML.toFixed(0),
        unit: 'mL',
        secondary: (c) => `${((c.derived.bladderVolumeML / BLADDER.MAX_CAPACITY_ML) * 100).toFixed(0)}% capacity`,
        colorToken: volumeColor,
      },
      {
        label: 'Pressure',
        value: (c) => c.derived.intravesicalPressureCmH2O.toFixed(1),
        unit: 'cmH₂O',
        secondary: (c) =>
          c.derived.intravesicalPressureCmH2O > 50
            ? 'high — approaching sphincter threshold'
            : c.derived.intravesicalPressureCmH2O > 20
              ? 'moderate'
              : 'low',
        colorToken: pressureColor,
      },
      {
        label: 'Detrusor',
        value: (c) => `${(c.derived.detrusorTone * 100).toFixed(0)}%`,
        secondary: (c) => (c.derived.detrusorTone > 0.6 ? 'contracting' : c.derived.detrusorTone > 0.2 ? 'moderate tone' : 'relaxed'),
        colorToken: detrusorColor,
      },
      {
        label: 'Sphincter',
        value: (c) => `${(c.derived.externalSphincterTone * 100).toFixed(0)}%`,
        secondary: (c) =>
          c.derived.externalSphincterTone > 0.7
            ? 'tight closure'
            : c.derived.externalSphincterTone > 0.3
              ? 'partial closure'
              : 'relaxed / voiding',
        colorToken: sphincterColor,
      },
      {
        label: 'Afferent',
        value: (c) => `${(c.derived.afferentFiringRate * 100).toFixed(0)}%`,
        secondary: (c) =>
          c.derived.afferentFiringRate > 0.7 ? 'maximal — urgent' : c.derived.afferentFiringRate > 0.3 ? 'moderate — aware' : 'quiet',
        colorToken: afferentColor,
      },
      {
        label: 'Flow',
        value: (c) => c.derived.netFlowRateMLperMin.toFixed(1),
        unit: 'mL/min',
        secondary: (c) => (c.derived.netFlowRateMLperMin < -10 ? 'voiding' : c.derived.netFlowRateMLperMin > 0 ? 'filling' : 'equilibrium'),
        colorToken: flowColor,
      },
      {
        label: 'Phase',
        value: (c) => c.derived.phase,
        secondary: (c) => c.derived.sensation,
        colorToken: 'text',
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Bladder volume',
        unit: 'mL',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 600,
        data: (points) => points.map((p) => p.bladderVolumeML),
      },
      {
        kind: 'sparkline',
        label: 'Intravesical pressure',
        unit: 'cmH₂O',
        colorToken: 'artery',
        domainMin: 0,
        domainMax: 60,
        data: (points) => points.map((p) => p.intravesicalPressureCmH2O),
      },
      {
        kind: 'sparkline',
        label: 'Detrusor tone',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 1,
        data: (points) => points.map((p) => p.detrusorTone),
      },
    ],
  };
}

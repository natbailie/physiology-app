import type { MicturitionDerived, MicturitionHistoryPoint, MicturitionInputs, MicturitionInternalState } from './engine/types';
import { BLADDER } from './engine/constants';
import type { ModulePresentation, PresentationContext, SceneNode } from '@/shared/presentation/types';

/* The drawing was laid out on its own 200x220 canvas, then scaled into the house 560x440
 * frame as a whole: 1.6x puts the 7-unit labels at ~11, the size every other diagram's
 * label is. All coordinates below live in that 200x220 space. */
const FIT = 'translate(120, 44) scale(1.6)';

type Ctx = PresentationContext<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint>;

/** There is no ellipse primitive in the shared schema, so the bladder's wall and lumen are
 *  drawn as two-arc closed paths. */
function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
}

export function buildMicturitionPresentation(ctx: Ctx): ModulePresentation<MicturitionInternalState, MicturitionDerived, MicturitionInputs, MicturitionHistoryPoint> {
  const { derived } = ctx;
  const volumeFraction = derived.bladderVolumeML / BLADDER.MAX_CAPACITY_ML;

  const detrusorWidth = 4 + derived.detrusorTone * 8;
  const sphincterGap = 6 + (1 - derived.externalSphincterTone) * 10;

  const parasympatheticWidth = 1 + derived.parasympatheticActivity * 3;
  const sympatheticWidth = 1 + derived.sympatheticActivity * 3;

  const afferentRadius = 2 + derived.afferentFiringRate * 6;

  const bladderWall = ellipsePath(100, 140, 45 + derived.detrusorTone * 5, 35 + volumeFraction * 25);
  const bladderLumen = ellipsePath(100, 140, 40, 30 + volumeFraction * 22);

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

  const internalSphincterX = 92 - sphincterGap / 2;
  const internalSphincterY = 170 + volumeFraction * 20;
  const externalSphincterX = 88 - sphincterGap / 2 - 4;
  const externalSphincterY = 180 + volumeFraction * 20;

  const bladderChildren: SceneNode[] = [
    // Parasympathetic nerve (left) — contracts detrusor.
    {
      type: 'path' as const,
      d: 'M30,40 L75,100',
      colorToken: 'danger',
      strokeWidth: parasympatheticWidth,
      opacity: 0.6 + derived.parasympatheticActivity * 0.4,
    },
    { type: 'text' as const, x: 15, y: 35, text: 'Pelvic n.', cls: 'label', colorToken: 'danger', opacity: 0.8 },

    // Sympathetic nerve (right) — relaxes detrusor, contracts internal sphincter.
    {
      type: 'path' as const,
      d: 'M170,40 L125,100',
      colorToken: 'o2',
      strokeWidth: sympatheticWidth,
      opacity: 0.6 + derived.sympatheticActivity * 0.4,
    },
    { type: 'text' as const, x: 148, y: 35, text: 'Hypogastric n.', cls: 'label', colorToken: 'o2', opacity: 0.8 },

    // Afferent stretch-receptor nerve (bottom-left).
    {
      type: 'path' as const,
      d: 'M50,185 L85,155',
      colorToken: 'cortisol',
      strokeWidth: 1 + derived.afferentFiringRate * 2,
      opacity: 0.5 + derived.afferentFiringRate * 0.5,
    },
    {
      type: 'circle' as const,
      cx: 45,
      cy: 190,
      r: afferentRadius,
      fill: 'cortisol',
      opacity: 0.4 + derived.afferentFiringRate * 0.6,
    },
    { type: 'text' as const, x: 15, y: 205, text: 'Stretch Rx', cls: 'label', colorToken: 'cortisol', opacity: 0.8 },

    // Bladder wall (detrusor).
    {
      type: 'path' as const,
      d: bladderWall,
      colorToken: 'artery',
      fill: 'none',
      strokeWidth: detrusorWidth,
      opacity: 0.5 + derived.detrusorTone * 0.5,
    },
    { type: 'text' as const, x: 155, y: 140, text: 'Detrusor', cls: 'label', colorToken: 'artery', opacity: 0.8 },

    // Bladder lumen (urine fill).
    {
      type: 'path' as const,
      d: bladderLumen,
      colorToken: 'o2',
      fill: 'o2',
      opacity: 0.15 + volumeFraction * 0.35,
    },

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

    // Internal sphincter (smooth muscle ring at bladder neck).
    {
      type: 'rect' as const,
      x: internalSphincterX,
      y: internalSphincterY,
      width: sphincterGap,
      height: 6,
      fill: 'artery',
      opacity: 0.4 + derived.externalSphincterTone * 0.6,
    },

    // External sphincter (skeletal muscle ring).
    {
      type: 'rect' as const,
      x: externalSphincterX,
      y: externalSphincterY,
      width: sphincterGap + 8,
      height: 8,
      fill: 'danger',
      opacity: 0.3 + derived.externalSphincterTone * 0.7,
    },
    {
      type: 'text' as const,
      x: 130,
      y: externalSphincterY + 8,
      text: 'Ext. sphincter',
      cls: 'label',
      colorToken: 'danger',
      opacity: 0.8,
    },

    // Urethra.
    {
      type: 'path' as const,
      d: `M100,${internalSphincterY + 12} L100,215`,
      colorToken: 'text',
      strokeWidth: 2 + (1 - derived.externalSphincterTone) * 3,
      opacity: 0.4,
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

    // Net flow. The arrow gives the direction; the number says what the phase label above
    // cannot — both used to read "filling".
    ...(derived.netFlowRateMLperMin < -10
      ? [
          {
            type: 'text' as const,
            x: 100,
            y: 218,
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
            y: 218,
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
        viewBox: [0, 0, 560, 440],
        ariaLabel: 'Bladder with its detrusor, internal and external sphincters, and the pelvic, hypogastric and afferent nerves supplying them',
        children: [
          {
            type: 'group' as const,
            transform: FIT,
            children: bladderChildren,
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

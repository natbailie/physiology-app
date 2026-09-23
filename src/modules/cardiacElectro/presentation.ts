import { clamp, scaleClamped } from '@/shared/lib/math';
import { VENTRICLE } from './engine/constants';
import type { CardiacDerived, CardiacHistoryPoint, CardiacInputs, CardiacPhase, CardiacState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

type Ctx = PresentationContext<CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint>;

const PHASE_LABELS: Record<CardiacPhase, string> = {
  filling: 'filling',
  isovolumicContraction: 'isovolumic contraction',
  ejection: 'ejection',
  isovolumicRelaxation: 'isovolumic relaxation',
};

function ejectionFractionStatus(ef: number): string {
  if (ef < 40) return 'reduced';
  if (ef < 50) return 'mid-range';
  return 'preserved';
}

/* --- Frame 1: the cardiac cycle, drawn as the left heart it happens in --- */

// The chamber's radius tracks its volume and its fill tracks its pressure, so the four phases
// are a chamber that swells and empties rather than a circle beside some numbers. The two
// pressures that decide the valves sit on the drawing beside them, because the aortic valve
// opening is not a rule of the animation: it is the moment ventricular pressure passes it.
const LV = { cx: 300, cy: 180 };
const MITRAL = { cx: 276, cy: 116 };
const AORTIC = { cx: 348, cy: 138 };

function circleD(cx: number, cy: number, r: number): string {
  return `M ${cx - r},${cy} a ${r},${r} 0 1 0 ${2 * r},0 a ${r},${r} 0 1 0 ${-2 * r},0`;
}

/** One valve as two leaflets hinged on the annulus — shut, the tips meet and block; open, they
 * swing back and the orifice is clear. Geometry moved from the legacy Valve component. */
function valve(cx: number, cy: number, open: boolean): import('@/shared/presentation/types').GroupNode {
  const tipX = open ? 13 : 0;
  const tipY = open ? 15 : 17;
  const token = open ? 'artery' : 'text';
  return {
    type: 'group',
    transform: `translate(${cx}, ${cy})`,
    children: [
      { type: 'path', d: `M ${-15} 0 L ${-tipX} ${tipY}`, colorToken: token, strokeWidth: 3, fill: 'none' },
      { type: 'path', d: `M ${15} 0 L ${tipX} ${tipY}`, colorToken: token, strokeWidth: 3, fill: 'none' },
    ],
  };
}

function anatomy(derived: CardiacDerived): FrameNode {
  const chamberRadius = scaleClamped(derived.lvVolumeML, VENTRICLE.MIN_VOLUME_ML, 220, 20, 52);
  const chamberPressure = clamp(derived.lvPressureMmHg / 160, 0, 1);

  const cycleDurationMs = (60 / Math.max(derived.heartRateBpm, 1)) * 1000;
  const avDelayFraction = clamp(derived.avConductionDelay / cycleDurationMs, 0, 0.5);
  const saActivation = clamp(1 - derived.cyclePhaseFraction / 0.08, 0, 1);
  const avActivation = clamp(1 - Math.abs(derived.cyclePhaseFraction - avDelayFraction) / 0.06, 0, 1);

  const mitralOpen = derived.phase === 'filling';
  const aorticOpen = derived.phase === 'ejection';

  return {
    type: 'frame',
    key: 'cardiac-cycle',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'The cardiac cycle: the SA and AV nodes firing in sequence, the left ventricle filling and ejecting, and the mitral and aortic valves opening and shutting through the four phases',
    children: [
      // Conduction, ending ON the ventricle it activates.
      { type: 'text', x: 20, y: 19, text: 'Conduction', cls: 'pathLabel' },
      { type: 'path', d: 'M 100 62 C 132 78 152 90 166 106', colorToken: 'conduction', strokeWidth: 2, fill: 'none' },
      { type: 'path', d: 'M 174 122 C 196 146 224 166 250 176', colorToken: 'conduction', strokeWidth: 2, fill: 'none' },
      {
        type: 'group',
        transform: 'translate(96, 56)',
        styleVars: { 'node-activation': saActivation },
        children: [
          { type: 'circle', cx: 0, cy: 0, r: 11, fill: 'sa-node' },
          { type: 'text', x: 0, y: -18, text: 'SA node', cls: 'organLabel' },
        ],
      },
      {
        type: 'group',
        transform: 'translate(170, 114)',
        styleVars: { 'node-activation': avActivation },
        children: [
          { type: 'circle', cx: 0, cy: 0, r: 9, fill: 'sa-node' },
          { type: 'text', x: -32, y: 4, text: 'AV', cls: 'organLabel' },
        ],
      },
      { type: 'text', x: 120, y: 146, text: `PR ${derived.avConductionDelay} ms`, cls: 'pathLabel' },
      ...(derived.isHeartBlock
        ? [{ type: 'text' as const, x: 120, y: 162, text: 'Complete block', cls: 'pathLabel', colorToken: 'danger' }]
        : []),

      // The aorta the ventricle ejects into, and the atrium it fills from.
      { type: 'path', d: 'M 348 134 L 348 74 Q 348 52 372 52 L 438 52', colorToken: 'artery', strokeWidth: 12, fill: 'none' },
      { type: 'text', x: 410, y: 42, text: 'Aorta', cls: 'organLabel' },
      { type: 'rect', x: 232, y: 54, width: 80, height: 42, fill: 'artery' },
      // On a SOLID signal fill, so --on-solid rather than the default --text. It read 3.18:1
      // before the navy palette and 2.95:1 after — the token was always the wrong one, and
      // the sweep only caught it once the margin it was surviving on disappeared.
      { type: 'text', x: 272, y: 80, text: 'Left atrium', cls: 'organLabel', colorToken: 'on-solid' },
      { type: 'path', d: 'M 276 96 L 276 114', colorToken: 'artery', strokeWidth: 8, fill: 'none' },

      // Inflow and outflow tracts, starting inside the chamber so the valves stay attached.
      { type: 'path', d: 'M 276 130 L 286 158', colorToken: 'artery', strokeWidth: 7, fill: 'none' },
      { type: 'path', d: 'M 322 162 L 344 142', colorToken: 'artery', strokeWidth: 7, fill: 'none' },

      // Left ventricle: radius is volume, fill is pressure.
      {
        type: 'path',
        d: circleD(LV.cx, LV.cy, chamberRadius),
        colorToken: 'pv-loop',
        strokeWidth: 3,
        fill: 'none',
        styleVars: { 'chamber-pressure': chamberPressure },
      },
      { type: 'text', x: LV.cx, y: LV.cy + 74, text: 'Left ventricle', cls: 'organLabel', anchor: 'middle' },

      // The two valves, and the two pressures that decide them.
      valve(MITRAL.cx, MITRAL.cy, mitralOpen),
      { type: 'text', x: MITRAL.cx - 22, y: MITRAL.cy - 6, text: 'Mitral valve', cls: 'anatomy', anchor: 'end' },
      valve(AORTIC.cx, AORTIC.cy, aorticOpen),
      { type: 'text', x: AORTIC.cx + 22, y: AORTIC.cy - 6, text: 'Aortic valve', cls: 'anatomy' },
      {
        type: 'text',
        x: AORTIC.cx + 22,
        y: AORTIC.cy + 10,
        text: `aorta ${derived.afterloadPressure.toFixed(0)}`,
        cls: 'valueLabel',
      },
      { type: 'text', x: LV.cx, y: LV.cy + 4, text: `${derived.lvPressureMmHg.toFixed(0)} mmHg`, cls: 'valueLabel', anchor: 'middle' },
      { type: 'text', x: LV.cx, y: LV.cy + 18, text: `${derived.lvVolumeML.toFixed(0)} mL`, cls: 'valueLabel', anchor: 'middle' },

      // Where in the beat we are, and the summary the learner reads off the loop.
      { type: 'text', x: 20, y: 244, text: PHASE_LABELS[derived.phase], colorToken: 'pv-loop', anchor: 'start' },
      {
        type: 'text',
        x: 20,
        y: 266,
        text: `${derived.heartRateBpm.toFixed(0)} bpm · CO ${derived.cardiacOutputLPerMin.toFixed(1)} L/min`,
        cls: 'valueLabel',
      },
      {
        type: 'text',
        x: 20,
        y: 282,
        text: `SV ${derived.strokeVolumeML.toFixed(0)} mL · EF ${derived.ejectionFractionPercent.toFixed(0)}%`,
        cls: 'valueLabel',
      },
    ],
  };
}

/* --- Frame 2: the pressure-volume loop and the pressure/volume waveforms --- */

const V_MAX = 240;
const P_MAX = 200;

// Left: the PV loop — pressure against volume, the loop the ventricle traces each beat.
const PV = { left: 34, right: 216, top: 46, bottom: 236 };
function pvProject(vol: number, pres: number) {
  const x = PV.left + (clamp(vol, 0, V_MAX) / V_MAX) * (PV.right - PV.left);
  const y = PV.bottom - (clamp(pres, 0, P_MAX) / P_MAX) * (PV.bottom - PV.top);
  return { x, y };
}

// Right: pressure and volume against shared time, one waveform above the other.
const TIME = { left: 268, right: 470 };
const PRESSURE_BAND = { top: 46, bottom: 136 };
const VOLUME_BAND = { top: 160, bottom: 240 };
function timeX(t: number, tMin: number, tMax: number) {
  const span = tMax - tMin || 1;
  return TIME.left + ((t - tMin) / span) * (TIME.right - TIME.left);
}
function pressureY(p: number) {
  return PRESSURE_BAND.bottom - (clamp(p, 0, P_MAX) / P_MAX) * (PRESSURE_BAND.bottom - PRESSURE_BAND.top);
}
function volumeY(v: number) {
  return VOLUME_BAND.bottom - (clamp(v, 0, V_MAX) / V_MAX) * (VOLUME_BAND.bottom - VOLUME_BAND.top);
}

function trailPath(history: readonly CardiacHistoryPoint[], tMin: number, tMax: number, yFn: (n: number) => number, field: (p: CardiacHistoryPoint) => number): string {
  return history
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${timeX(p.t, tMin, tMax).toFixed(1)},${yFn(field(p)).toFixed(1)}`)
    .join(' ');
}

function plots(derived: CardiacDerived, history: readonly CardiacHistoryPoint[]): FrameNode {
  const ts = history.map((p) => p.t);
  const tMin = ts.length ? Math.min(...ts) : 0;
  const tMax = ts.length ? Math.max(...ts) : tMin + 1;

  const pvD = history
    .map((p, i) => {
      const { x, y } = pvProject(p.lvVolume, p.lvPressure);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const live = pvProject(derived.lvVolumeML, derived.lvPressureMmHg);

  const pressureD = trailPath(history, tMin, tMax, pressureY, (p) => p.lvPressure);
  const volumeD = trailPath(history, tMin, tMax, volumeY, (p) => p.lvVolume);

  const nodes: import('@/shared/presentation/types').SceneNode[] = [
    { type: 'text', x: 20, y: 20, text: 'Pressure-volume loop', cls: 'pathLabel' },
    // PV plot frame.
    { type: 'line', x1: PV.left, y1: PV.bottom, x2: PV.right, y2: PV.bottom, colorToken: 'text' },
    { type: 'line', x1: PV.left, y1: PV.top, x2: PV.left, y2: PV.bottom, colorToken: 'text' },
    { type: 'text', x: PV.right + 6, y: PV.bottom, text: '240 mL', cls: 'tickLabel' },
    { type: 'text', x: PV.left - 34, y: PV.top + 6, text: '200 mmHg', cls: 'tickLabel' },
    ...(history.length > 1 ? [{ type: 'path' as const, d: pvD, colorToken: 'pv-loop', strokeWidth: 2, fill: 'none' }] : []),
    { type: 'circle', cx: live.x, cy: live.y, r: 4.5, fill: 'pv-loop' },

    // Pressure & volume waveforms over time.
    { type: 'text', x: 268, y: 20, text: 'Pressure & volume over the cycle', cls: 'pathLabel' },
    { type: 'line', x1: TIME.left, y1: PRESSURE_BAND.bottom, x2: TIME.right, y2: PRESSURE_BAND.bottom, colorToken: 'text' },
    { type: 'line', x1: TIME.left, y1: VOLUME_BAND.bottom, x2: TIME.right, y2: VOLUME_BAND.bottom, colorToken: 'text' },
    { type: 'line', x1: TIME.left, y1: PRESSURE_BAND.top, x2: TIME.left, y2: VOLUME_BAND.bottom, colorToken: 'text' },
    { type: 'text', x: TIME.left, y: PRESSURE_BAND.top - 6, text: 'LV pressure (mmHg)', cls: 'tickLabel' },
    { type: 'text', x: TIME.left, y: VOLUME_BAND.top - 6, text: 'LV volume (mL)', cls: 'tickLabel' },
    ...(history.length > 1
      ? [
          { type: 'path' as const, d: pressureD, colorToken: 'artery', strokeWidth: 2, fill: 'none' },
          { type: 'path' as const, d: volumeD, colorToken: 'conduction', strokeWidth: 2, fill: 'none' },
        ]
      : []),
  ];

  return {
    type: 'frame',
    key: 'pv-loop',
    viewBox: [0, 0, 480, 260],
    ariaLabel: `Pressure-volume loop traced from the last ${history.length} samples, of LV volume on the x axis against LV pressure on the y axis, with LV pressure and LV volume plotted over time on the right`,
    children: nodes,
  };
}

export function buildCardiacElectroPresentation(ctx: Ctx): ModulePresentation<CardiacState, CardiacDerived, CardiacInputs, CardiacHistoryPoint> {
  const { derived, history } = ctx;
  return {
    diagram: [anatomy(derived), plots(derived, history)],
    controls: [
      { kind: 'slider', label: 'Intrinsic heart rate', key: 'intrinsicHeartRate', min: 40, max: 180, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'Sympathetic drive', key: 'sympatheticDrive', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Vagal drive', key: 'parasympatheticDrive', min: 0, max: 100, step: 5, unit: '%' },
      { kind: 'slider', label: 'Preload (EDV)', key: 'preloadEDV', min: 60, max: 220, step: 5, unit: ' mL' },
      { kind: 'slider', label: 'Afterload', key: 'afterloadPressure', min: 40, max: 160, step: 5, unit: ' mmHg' },
      { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'AV conduction delay', key: 'avConductionDelay', min: 60, max: 300, step: 10, unit: ' ms' },
    ],
    readouts: [
      {
        label: 'Heart rate',
        value: (c) => c.derived.heartRateBpm.toFixed(0),
        unit: 'bpm',
        setPoint: (c) => c.inputs.intrinsicHeartRate,
        colorToken: 'sa-node',
      },
      { label: 'Cardiac output', value: (c) => c.derived.cardiacOutputLPerMin.toFixed(1), unit: 'L/min', colorToken: 'artery' },
      { label: 'Stroke volume', value: (c) => c.derived.strokeVolumeML.toFixed(0), unit: 'mL', colorToken: 'pv-loop' },
      {
        label: 'Ejection fraction',
        value: (c) => c.derived.ejectionFractionPercent.toFixed(0),
        unit: '%',
        secondary: (c) => ejectionFractionStatus(c.derived.ejectionFractionPercent),
        colorToken: 'pv-loop',
      },
      { label: 'EDV', value: (c) => c.derived.endDiastolicVolumeML.toFixed(0), unit: 'mL', colorToken: 'text' },
      { label: 'ESV', value: (c) => c.derived.endSystolicVolumeML.toFixed(0), unit: 'mL', colorToken: 'text' },
      { label: 'LV pressure', value: (c) => c.derived.lvPressureMmHg.toFixed(0), unit: 'mmHg', colorToken: 'artery' },
      {
        label: 'LV volume',
        value: (c) => c.derived.lvVolumeML.toFixed(0),
        unit: 'mL',
        secondary: (c) => PHASE_LABELS[c.derived.phase],
        colorToken: 'conduction',
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'LV volume', unit: 'mL', colorToken: 'conduction', domainMin: 0, domainMax: 260, data: (points) => points.map((p) => p.lvVolume) },
      { kind: 'sparkline', label: 'LV pressure', unit: 'mmHg', colorToken: 'artery', domainMin: 0, domainMax: 260, data: (points) => points.map((p) => p.lvPressure) },
      { kind: 'sparkline', label: 'ECG', colorToken: 'pv-loop', domainMin: -0.4, domainMax: 1.2, data: (points) => points.map((p) => p.ecgVoltage) },
    ],
  };
}

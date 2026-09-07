import { clamp } from '@/shared/lib/math';
import type { PresentationContext, ModulePresentation, FrameNode, SceneNode } from '@/shared/presentation/types';
import { airwayPressureAtPhase } from './engine/pressures';
import type { MvDerived, MvHistoryPoint, MvInputs, MvState } from './engine/types';

/** The waveform window the "monitor" draws: a fixed stretch of real time, so a faster rate packs
 * more breaths into it — the one place a rate change is actually drawn, not merely counted. */
const WINDOW_SECONDS = 8;
const WAVE = { left: 18, right: 282, top: 30, bottom: 122 };
const PRESSURE_MIN = 0;
const PRESSURE_MAX = 35;

function pressureY(p: number): number {
  return WAVE.bottom - ((clamp(p, PRESSURE_MIN, PRESSURE_MAX) - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)) * (WAVE.bottom - WAVE.top);
}

function waveformPath(derived: MvDerived, samples = 72): string {
  const cycleSeconds = 60 / Math.max(derived.effectiveRatePerMin, 1);
  const peak = Math.max(derived.totalPeepCmH2O, derived.peakPressureCmH2O);
  const d: string[] = [];
  for (let k = 0; k <= samples; k++) {
    const t = (k / samples) * WINDOW_SECONDS;
    const phase = (t / cycleSeconds) % 1;
    const p = airwayPressureAtPhase(phase, derived.totalPeepCmH2O, peak);
    const x = WAVE.left + (k / samples) * (WAVE.right - WAVE.left);
    const y = pressureY(p);
    d.push(`${k === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return d.join(' ');
}

const MODE_LABEL: Record<MvInputs['mode'], string> = {
  cpap: 'CPAP',
  niv: 'BiPAP (NIV)',
  invasive: 'Invasive',
};

type Ctx = PresentationContext<MvState, MvDerived, MvInputs, MvHistoryPoint>;

export function buildMechanicalVentilationPresentation(
  ctx: Ctx,
): ModulePresentation<MvState, MvDerived, MvInputs, MvHistoryPoint> {
  const { derived, inputs } = ctx;

  const fixtureLabel = derived.mode;
  const fiO2Pct = Math.round(inputs.fiO2 * 100);
  const autoPeepVisible = derived.intrinsicPeepCmH2O > 0.5;
  const isCpap = derived.mode === 'cpap';

  /** The collapsed unit: tinted by how much shunt survives recruitment, and labelled so the
   * oxygen-dependent learner can see what PEEP is fighting. The sibling healthy unit is drawn
   * with the shared V/Q circle whose intensity carries the recruitment level. */
  function lungUnit(x: number, label: string, recruitment: number, metric: string): SceneNode {
    const open = 1 - recruitment;
    return {
      type: 'group',
      transform: `translate(${x}, ${132})`,
      children: [
        { type: 'circle', cx: 0, cy: 0, r: 20, fill: 'vq', styleVars: { 'vq-deviation': clamp(open * 1.6, 0, 1) } },
        { type: 'text', x: 0, y: 6, text: label, cls: 'organLabel', anchor: 'middle' },
        { type: 'text', x: 0, y: 36, text: metric, cls: 'valueLabel', anchor: 'middle' },
      ],
    };
  }

  /** Inspired-oxygen pill: its fill tracks FiO2 so the O2 dial has a structure, not just a number. */
  function inspiredO2(x: number, y: number): SceneNode {
    return {
      type: 'group',
      transform: `translate(${x}, ${y})`,
      children: [
        {
          type: 'rect',
          x: -46,
          y: -11,
          width: 92,
          height: 22,
          fill: 'o2',
          styleVars: { 'wash-strong': clamp(inputs.fiO2, 0.2, 1) },
        },
        { type: 'text', x: 0, y: 3, text: `inspired O₂ ${fiO2Pct}%`, cls: 'valueLabel', anchor: 'middle' },
      ],
    };
  }

  const frame: FrameNode = {
    type: 'frame',
    key: 'mechanicalVentilation',
    viewBox: [0, 0, 480, 300],
    ariaLabel: `Ventilator pressures and gas exchange: airway pressure waveform, recruited and shunted lung units, mode ${fixtureLabel}`,
    defs: [{ type: 'marker', id: 'mv-arrow', colorToken: 'vq' }],
    children: [
      // Airway-pressure monitor, left two thirds.
      { type: 'text', x: 18, y: 18, text: 'Airway pressure (cmH2O)', cls: 'pathLabel' },
      { type: 'line', x1: WAVE.left, y1: WAVE.bottom, x2: WAVE.right, y2: WAVE.bottom, cls: 'axis' },
      { type: 'line', x1: WAVE.left, y1: WAVE.top, x2: WAVE.right, y2: WAVE.top, cls: 'axis' },
      { type: 'line', x1: WAVE.left, y1: WAVE.top, x2: WAVE.left, y2: WAVE.bottom, cls: 'axis' },
      { type: 'text', x: WAVE.left - 4, y: WAVE.bottom + 14, text: '0', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: WAVE.left - 4, y: WAVE.top + 3, text: '35', cls: 'tickLabel', anchor: 'end' },
      // Set PEEP at the dial's floor, and the auto-PEEP stack above it when it traps.
      { type: 'line', x1: WAVE.left, y1: pressureY(derived.totalPeepCmH2O), x2: WAVE.right, y2: pressureY(derived.totalPeepCmH2O), cls: 'axis', colorToken: 'resistance' },
      ...(autoPeepVisible
        ? [
            {
              type: 'path' as const,
              d: `M${WAVE.left},${pressureY(derived.totalPeepCmH2O)} L${WAVE.left + 12},${pressureY(derived.totalPeepCmH2O)}`,
              strokeWidth: 3,
              colorToken: 'resistance' as const,
            },
            {
              type: 'text' as const,
              x: WAVE.left + 40,
              y: pressureY(derived.totalPeepCmH2O) - 5,
              text: `auto-PEEP ${derived.intrinsicPeepCmH2O.toFixed(1)}`,
              cls: 'pathLabel' as const,
              colorToken: 'resistance' as const,
            },
          ]
        : []),
      // The breath waveform — flat under CPAP, humped under support.
      {
        type: 'path',
        d: waveformPath(derived),
        strokeWidth: 2,
        colorToken: 'vq',
        fill: 'none',
      },
      { type: 'circle', cx: WAVE.right, cy: pressureY(derived.airwayPressureCmH2O), r: 3.5, fill: 'vq' },

      // Ventilator unit: the mode, the pressures it is set to, and what that buys.
      {
        type: 'group',
        transform: 'translate(20, 156)',
        children: [
          { type: 'rect', x: 0, y: 0, width: 140, height: 92, cls: 'axis' },
          { type: 'text', x: 70, y: 20, text: MODE_LABEL[derived.mode], cls: 'organLabel', anchor: 'middle' },
          { type: 'text', x: 10, y: 38, text: `PEEP ${derived.totalPeepCmH2O.toFixed(1)}`, cls: 'valueLabel' },
          { type: 'text', x: 10, y: 52, text: `${isCpap ? 'EPAP' : 'IPAP/PIP'} ${derived.inspiratoryPressureCmH2O.toFixed(1)}`, cls: 'valueLabel' },
          { type: 'text', x: 10, y: 66, text: `rate ${derived.effectiveRatePerMin.toFixed(1)}/min`, cls: 'valueLabel' },
          { type: 'text', x: 10, y: 80, text: `VT ${derived.tidalVolumeML} mL`, cls: 'valueLabel' },
        ],
      },

      // Patient effort meter — pressure support lifts the load off these muscles.
      {
        type: 'group',
        transform: 'translate(180, 156)',
        children: [
          { type: 'rect', x: 0, y: 0, width: 18, height: 92, cls: 'axis' },
          { type: 'rect', x: 0, y: 92 - derived.wobEffortPct * 0.92, width: 18, height: derived.wobEffortPct * 0.92, fill: 'compliance' },
          { type: 'text', x: 9, y: 108, text: 'effort', cls: 'tickLabel', anchor: 'middle' },
        ],
      },
      { type: 'text', x: 218, y: 176, text: 'lung units', cls: 'pathLabel' },
      lungUnit(302, 'recruited', derived.recruitmentLevel, `open ${Math.round((1 - derived.effectiveShuntFraction) * 100)}%`),
      lungUnit(404, 'shunt', derived.recruitmentLevel, `shunt ${Math.round(derived.effectiveShuntFraction * 100)}%`),
      { type: 'path', d: 'M236,140 C266,126 288,132 302,136', strokeWidth: 2, colorToken: 'vq', markerEnd: 'url(#mv-arrow)', fill: 'none' },
      { type: 'path', d: 'M440,140 L404,136', strokeWidth: 2, colorToken: 'vq', markerEnd: 'url(#mv-arrow)', fill: 'none' },

      inspiredO2(354, 44),
      { type: 'text', x: 18, y: 276, text: `failure: ${derived.failureType}`, cls: 'verdict', colorToken: 'co2' },
      { type: 'text', x: 142, y: 276, text: `VILI risk ${derived.viliRisk}`, cls: 'pathLabel', colorToken: 'vq' },
      { type: 'text', x: 276, y: 276, text: 'oxygen key: vq V/Q · compliance effort · co2 CO2', cls: 'caption' },
    ],
  };

  return {
    diagram: [frame],
    controls: [
      {
        kind: 'toggle',
        label: 'Mode',
        key: 'mode',
        options: [
          { value: 'cpap', label: 'CPAP' },
          { value: 'niv', label: 'NIV (BiPAP)' },
          { value: 'invasive', label: 'Invasive' },
        ],
        colorToken: 'vq',
      },
      { kind: 'slider', label: 'PEEP/EPAP', key: 'epapPeepCmH2O', min: 0, max: 20, step: 1, unit: ' cmH2O' },
      { kind: 'slider', label: 'IPAP/PIP', key: 'ipapPipCmH2O', min: 0, max: 35, step: 1, unit: ' cmH2O' },
      { kind: 'slider', label: 'Ventilator rate', key: 'ventRatePerMin', min: 4, max: 40, step: 1, unit: ' /min' },
      { kind: 'slider', label: 'FiO2', key: 'fiO2', min: 0.21, max: 1, step: 0.01, format: 'percent' },
    ],
    readouts: [
      {
        label: 'PaO2',
        value: (c) => c.derived.paO2.toFixed(1),
        unit: ' mmHg',
        colorToken: 'o2',
        secondary: (c) => (c.derived.hypoxaemia === 'severe' ? 'severe hypoxaemia' : c.derived.hypoxaemia === 'borderline' ? 'borderline' : undefined),
      },
      { label: 'SaO2', value: (c) => c.derived.saO2.toFixed(1), unit: '%', colorToken: 'o2' },
      {
        label: 'PaCO2',
        value: (c) => c.derived.paCO2.toFixed(1),
        unit: ' mmHg',
        colorToken: 'co2',
        secondary: (c) => (c.derived.paCO2 > 45 ? 'hypercapnia' : undefined),
      },
      {
        label: 'pH',
        value: (c) => c.derived.pH.toFixed(2),
        colorToken: 'co2',
        secondary: (c) => (c.derived.respiratoryAcidosis ? 'respiratory acidosis' : 'respiratory alkalosis'),
      },
      { label: 'Tidal volume', value: (c) => c.derived.tidalVolumeML.toFixed(0), unit: ' mL', colorToken: 'compliance' },
      { label: 'Alveolar ventilation', value: (c) => (c.derived.alveolarVentilationMLPerMin / 1000).toFixed(1), unit: ' L/min', colorToken: 'compliance' },
      { label: 'Driving pressure', value: (c) => c.derived.drivingPressureCmH2O.toFixed(1), unit: ' cmH2O', colorToken: 'vq' },
      { label: 'Peak pressure', value: (c) => c.derived.peakPressureCmH2O.toFixed(1), unit: ' cmH2O', colorToken: 'vq' },
      { label: 'Total PEEP', value: (c) => c.derived.totalPeepCmH2O.toFixed(1), unit: ' cmH2O', colorToken: 'vq' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Airway pressure',
        unit: 'cmH2O',
        colorToken: 'vq',
        domainMin: 0,
        domainMax: 35,
        data: (points) => points.map((p) => p.pressure),
      },
    ],
  };
}
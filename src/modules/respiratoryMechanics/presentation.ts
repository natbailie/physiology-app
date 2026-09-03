import { clamp, scaleClamped } from '@/shared/lib/math';
import { hasAirTrapping } from './engine/engine';
import type { RespMechDerived, RespMechHistoryPoint, RespMechInputs, RespMechState } from './engine/types';
import type { FrameNode, ModulePresentation, PresentationContext } from '@/shared/presentation/types';

/** The same lung silhouette the legacy diagram drew, centred on the origin. */
const LUNG_PATH =
  'M0,-38 C18,-40 30,-14 28,14 C26,38 14,50 0,50 C-2,50 -4,49 -6,48 C-16,42 -24,26 -24,4 C-24,-20 -14,-38 0,-38 Z';

/** The flow-volume plot, drawn as its own PathNode frame like the respiratory Davenport. */
const PLOT = { left: 52, right: 372, top: 34, bottom: 214 };
const VOL_MIN = 0;
const VOL_MAX = 8;
const FLOW_MIN = -4;
const FLOW_MAX = 10;
const VOL_TICKS = [0, 2, 4, 6, 8];
const FLOW_TICKS = [0, 5, 10];

function project(v: number, f: number) {
  const x = PLOT.left + ((clamp(v, VOL_MIN, VOL_MAX) - VOL_MIN) / (VOL_MAX - VOL_MIN)) * (PLOT.right - PLOT.left);
  const y = PLOT.bottom - ((clamp(f, FLOW_MIN, FLOW_MAX) - FLOW_MIN) / (FLOW_MAX - FLOW_MIN)) * (PLOT.bottom - PLOT.top);
  return { x, y };
}

function trailPath(points: readonly RespMechHistoryPoint[]): string {
  return points
    .map((p, index) => {
      const { x, y } = project(p.lungVolume / 1000, p.airflow / 1000);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

type Ctx = PresentationContext<RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint>;

export function buildRespiratoryMechanicsPresentation(ctx: Ctx): ModulePresentation<RespMechState, RespMechDerived, RespMechInputs, RespMechHistoryPoint> {
  const { derived, history, baselineHistory } = ctx;

  const inflation = scaleClamped(derived.lungVolumeML, derived.residualVolumeML, derived.totalLungCapacityML, 0, 1);
  const lungScale = 0.72 + inflation * 0.4;
  const surfactant = clamp(derived.surfactantFunction, 0, 1);

  /** The V/Q compartments are drawn by hand here rather than with the shared organ registry,
   * exactly as the legacy diagram did: two alveolar units, each tinted by how far its ratio has
   * departed from 1 and linked to proposed ventilation/perfusion arrows. */
  function vqUnit(x: number, y: number, label: string, ventilation: number, perfusion: number, vqRatio: number): FrameNode['children'][number] {
    const deviation = clamp(Math.abs(Math.log10(Math.max(vqRatio, 0.01))) / 1.2, 0, 1);
    const ratioText = vqRatio >= 10 ? '≫1' : vqRatio.toFixed(2);
    return {
      type: 'group',
      transform: `translate(${x}, ${y})`,
      styleVars: { 'vq-deviation': deviation, ventilation: clamp(ventilation, 0.08, 1), perfusion: clamp(perfusion, 0.08, 1) },
      children: [
        { type: 'path', d: 'M-34,-16 L-12,-6', colorToken: 'compliance', strokeWidth: 2, markerEnd: 'url(#vent-arrow)' },
        { type: 'circle', cx: 0, cy: 0, r: 17, fill: 'vq', styleVars: { 'vq-deviation': deviation } },
        { type: 'path', d: 'M12,8 L34,18', colorToken: 'artery', strokeWidth: 2, markerEnd: 'url(#perf-arrow)' },
        { type: 'text', x: 0, y: 34, text: label, cls: 'organLabel' },
        { type: 'text', x: 0, y: 46, text: `V/Q ${ratioText}`, cls: 'valueLabel', anchor: 'middle' },
      ],
    };
  }

  const flowVolumePoints = history.length > 1 ? trailPath(history) : '';
  const flowVolumeBaseline = baselineHistory && baselineHistory.length > 1 ? trailPath(baselineHistory) : '';
  const live = project(derived.lungVolumeML / 1000, derived.airflowMLPerSec / 1000);
  const airTrapping = hasAirTrapping(derived.respiratoryRate, derived.timeConstantSeconds);

  const anatomy: FrameNode = {
    type: 'frame',
    key: 'respiratoryMechanics-anatomy',
    viewBox: [0, 0, 480, 300],
    ariaLabel:
      'Diagram of lung mechanics: lungs inflating and deflating with tidal volume, an alveolar inset showing surfactant function, and two ventilation-perfusion compartments',
    defs: [
      { type: 'marker', id: 'vent-arrow', colorToken: 'compliance' },
      { type: 'marker', id: 'perf-arrow', colorToken: 'artery' },
    ],
    children: [
      // Inflating lungs. Drawn with paths (not the shared lungs organ) because this module is
      // not yet registered in the shared class map and because the lungs inflate with volume,
      // which the shared organ does not parametrise.
      {
        type: 'group',
        transform: 'translate(96, 96)',
        children: [
          { type: 'path', d: 'M0,-56 L0,-30', colorToken: 'text-faint', strokeWidth: 4 },
          {
            type: 'group',
            transform: `translate(-20, 0) scale(${lungScale})`,
            children: [{ type: 'path', d: LUNG_PATH, colorToken: 'compliance', fill: 'compliance', strokeWidth: 2 }],
          },
          {
            type: 'group',
            transform: `translate(20, 0) scale(${-lungScale}, ${lungScale})`,
            children: [{ type: 'path', d: LUNG_PATH, colorToken: 'compliance', fill: 'compliance', strokeWidth: 2 }],
          },
          { type: 'text', x: 0, y: 70, text: 'Lungs', cls: 'organLabel' },
        ],
      },
      // Surfactant inset: a small alveolus that shrinks and stiffens as surfactant is lost.
      {
        type: 'group',
        transform: 'translate(212, 74)',
        children: [
          {
            type: 'group',
            transform: `scale(${0.55 + surfactant * 0.45})`,
              children: [{ type: 'circle', cx: 0, cy: 0, r: 19, fill: 'compliance', styleVars: { surfactant } }],
          },
          { type: 'text', x: -26, y: -26, text: `Surfactant ${(derived.surfactantFunction * 100).toFixed(0)}%`, cls: 'pathLabel' },
        ],
      },
      { type: 'text', x: 318, y: 40, text: 'V/Q compartments', cls: 'pathLabel' },
      vqUnit(340, 84, 'Unit A', derived.ventilationUnitA, derived.perfusionUnitA, derived.vqRatioA),
      vqUnit(340, 186, 'Unit B', derived.ventilationUnitB, derived.perfusionUnitB, derived.vqRatioB),
      ...(derived.hpvDiversionLevel > 0.02
        ? [
            {
              type: 'text' as const,
              x: 252,
              y: 252,
              text: `HPV diverting ${(derived.hpvDiversionLevel * 100).toFixed(0)}%`,
              cls: 'pathLabel' as const,
              colorToken: 'vq',
            },
          ]
        : []),
      // The spirometry summary against the left edge.
      { type: 'text', x: 22, y: 210, text: derived.spirometryPattern, cls: 'verdict', colorToken: 'resistance' },
      { type: 'text', x: 22, y: 230, text: `FEV1/FVC ${derived.fev1RatioPercent.toFixed(0)}%`, cls: 'pathLabel' },
      { type: 'text', x: 22, y: 246, text: `FVC ${(derived.fvcML / 1000).toFixed(2)} L · TLC ${(derived.totalLungCapacityML / 1000).toFixed(2)} L`, cls: 'pathLabel' },
      { type: 'text', x: 22, y: 262, text: `RV ${(derived.residualVolumeML / 1000).toFixed(2)} L · tau ${derived.timeConstantSeconds.toFixed(2)} s`, cls: 'pathLabel' },
      { type: 'text', x: 22, y: 278, text: derived.fvcManeuverActive ? 'FVC maneuver running' : `volume ${(derived.lungVolumeML / 1000).toFixed(2)} L`, cls: 'pathLabel' },
    ],
  };

  // The flow-volume loop, traced as a dedicated PathNode plot frame.
  const plot: FrameNode = {
    type: 'frame',
    key: 'respiratoryMechanics-flowVolume',
    viewBox: [0, 0, 480, 260],
    ariaLabel: `Flow-volume loop: expiratory flow ${derived.airflowMLPerSec.toFixed(0)} mL/s against lung volume ${derived.lungVolumeML.toFixed(0)} mL`,
    children: [
      { type: 'text', x: 22, y: 20, text: 'Flow-volume loop', cls: 'pathLabel' },
      ...VOL_TICKS.map((v) => {
        const { x } = project(v, FLOW_MIN);
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: x, y1: PLOT.top, x2: x, y2: PLOT.bottom, cls: 'axis' },
            { type: 'text' as const, x, y: PLOT.bottom + 13, text: `${v}`, cls: 'tickLabel' },
          ],
        };
      }),
      ...FLOW_TICKS.map((f) => {
        const { y } = project(VOL_MIN, f);
        return {
          type: 'group' as const,
          children: [
            { type: 'line' as const, x1: PLOT.left, y1: y, x2: PLOT.right, y2: y, cls: 'axis' },
            { type: 'text' as const, x: PLOT.left - 12, y: y + 3, text: `${f}`, cls: 'tickLabel' },
          ],
        };
      }),
      { type: 'line', x1: PLOT.left, y1: PLOT.bottom, x2: PLOT.right, y2: PLOT.bottom, cls: 'axis' },
      { type: 'line', x1: PLOT.left, y1: PLOT.top, x2: PLOT.left, y2: PLOT.bottom, cls: 'axis' },
      { type: 'text', x: PLOT.left - 26, y: PLOT.top + 6, text: 'flow (L/s)', cls: 'pathLabel' },
      { type: 'text', x: PLOT.right + 14, y: PLOT.bottom + 13, text: 'volume (L)', cls: 'pathLabel' },
      ...(flowVolumeBaseline ? [{ type: 'path' as const, d: flowVolumeBaseline, cls: 'baselineTrail' }] : []),
      ...(flowVolumePoints ? [{ type: 'path' as const, d: flowVolumePoints, cls: 'trail' }] : []),
      { type: 'circle', cx: live.x, cy: live.y, r: 4, fill: 'resistance' },
      // The pattern is stated here too — FVC promise of the loop — but the readout carries the
      // primary verdict so it is what gets withheld during a question.
      { type: 'text', x: 22, y: 238, text: airTrapping ? 'air trapping' : 'normal emptying', cls: 'pathLabel', colorToken: airTrapping ? 'resistance' : 'vq' },
    ],
  };

  return {
    diagram: [anatomy, plot],
    controls: [
      { kind: 'slider', label: 'Respiratory rate', key: 'respiratoryRate', min: 8, max: 40, step: 1, unit: ' /min' },
      { kind: 'slider', label: 'Tidal volume', key: 'tidalVolumeML', min: 300, max: 1000, step: 25, unit: ' mL' },
      { kind: 'slider', label: 'Lung compliance', key: 'lungCompliance', min: 20, max: 150, step: 5, unit: ' mL/cmH2O' },
      { kind: 'slider', label: 'Airway resistance', key: 'airwayResistance', min: 0.5, max: 20, step: 0.5, unit: ' cmH2O/L/s', format: 'decimal' },
      { kind: 'slider', label: 'Surfactant function', key: 'surfactantFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Dead space', key: 'deadSpaceFraction', min: 0, max: 70, step: 5, unit: '%' },
      { kind: 'slider', label: 'Shunt', key: 'shuntFraction', min: 0, max: 50, step: 5, unit: '%' },
      { kind: 'slider', label: 'HPV strength', key: 'hpvStrength', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
    ],
    readouts: [
      {
        label: 'FEV1/FVC',
        value: (c) => c.derived.fev1RatioPercent.toFixed(0),
        unit: '%',
        secondary: (c) => c.derived.spirometryPattern,
        colorToken: 'resistance',
        revealsPattern: true,
      },
      { label: 'FVC', value: (c) => (c.derived.fvcML / 1000).toFixed(2), unit: 'L', colorToken: 'compliance' },
      { label: 'FEV1', value: (c) => (c.derived.fev1ML / 1000).toFixed(2), unit: 'L', colorToken: 'resistance' },
      { label: 'Peak flow', value: (c) => (c.derived.peakExpiratoryFlowMLPerSec / 1000).toFixed(1), unit: 'L/s', colorToken: 'resistance' },
      { label: 'TLC', value: (c) => (c.derived.totalLungCapacityML / 1000).toFixed(2), unit: 'L', colorToken: 'compliance' },
      { label: 'FRC', value: (c) => (c.derived.functionalResidualCapacityML / 1000).toFixed(2), unit: 'L', colorToken: 'compliance' },
      { label: 'RV', value: (c) => (c.derived.residualVolumeML / 1000).toFixed(2), unit: 'L', colorToken: 'compliance' },
      {
        label: 'Time constant',
        value: (c) => c.derived.timeConstantSeconds.toFixed(2),
        unit: 's',
        secondary: (c) => (hasAirTrapping(c.derived.respiratoryRate, c.derived.timeConstantSeconds) ? 'air trapping' : undefined),
        colorToken: 'resistance',
      },
      { label: 'V/Q unit A', value: (c) => c.derived.vqRatioA.toFixed(2), colorToken: 'vq' },
      {
        label: 'V/Q unit B',
        value: (c) => (c.derived.vqRatioB >= 10 ? '≫1' : c.derived.vqRatioB.toFixed(2)),
        secondary: (c) => (c.derived.vqRatioB > 2 ? 'dead space' : c.derived.vqRatioB < 0.6 ? 'shunt' : undefined),
        colorToken: 'vq',
      },
      { label: 'Alveolar ventilation', value: (c) => (c.derived.alveolarVentilationMLPerMin / 1000).toFixed(1), unit: 'L/min', colorToken: 'compliance' },
      { label: 'Work of breathing', value: (c) => c.derived.workOfBreathingJPerMin.toFixed(1), unit: ' J/min', colorToken: 'resistance' },
      { label: 'HPV diversion', value: (c) => (c.derived.hpvDiversionLevel * 100).toFixed(0), unit: '%', colorToken: 'vq' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'Lung volume',
        unit: 'L',
        colorToken: 'compliance',
        domainMin: 0,
        domainMax: 8,
        data: (points) => points.map((p) => p.lungVolume / 1000),
      },
      {
        kind: 'sparkline',
        label: 'Airflow',
        unit: 'L/s',
        colorToken: 'resistance',
        domainMin: -4,
        domainMax: 10,
        data: (points) => points.map((p) => p.airflow / 1000),
      },
    ],
  };
}

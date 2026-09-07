import { clamp } from '@/shared/lib/math';
import type { PresentationContext, ModulePresentation, FrameNode, SceneNode } from '@/shared/presentation/types';
import type { RfDerived, RfHistoryPoint, RfInputs, RfState } from './engine/types';

/** Map geometry: a 150 x 90 plot of PaO2 (horizontal) against PaCO2 (vertical, high at the top). */
const MAP = { left: 20, right: 300, top: 34, bottom: 196 };
const PAO2_MAX = 150;
const PACO2_MAX = 90;

function mapX(paO2: number): number {
  return MAP.left + (clamp(paO2, 0, PAO2_MAX) / PAO2_MAX) * (MAP.right - MAP.left);
}

function mapY(paCO2: number): number {
  return MAP.bottom - (clamp(paCO2, 0, PACO2_MAX) / PACO2_MAX) * (MAP.bottom - MAP.top);
}

type Ctx = PresentationContext<RfState, RfDerived, RfInputs, RfHistoryPoint>;

export function buildRespiratoryFailurePresentation(
  ctx: Ctx,
): ModulePresentation<RfState, RfDerived, RfInputs, RfHistoryPoint> {
  const { derived, inputs } = ctx;

  const fiO2Pct = Math.round(inputs.fiO2 * 100);
  const pointOfDy = (px: number, py: number) => ({ x: mapX(px), y: mapY(py) });
  const patient = pointOfDy(derived.paO2, derived.paCO2);
  const labelY = patient.y - 8 < MAP.top + 16 ? patient.y + 10 : patient.y - 8;

  function lungUnit(x: number, label: string, metric: string, fill: 'vq' | 'co2'): SceneNode {
    return {
      type: 'group',
      transform: `translate(${x}, ${256})`,
      children: [
        { type: 'circle', cx: 0, cy: 0, r: 15, fill },
        { type: 'text', x: 0, y: 5, text: label, cls: 'organLabel', anchor: 'middle' },
        { type: 'text', x: 0, y: 33, text: metric, cls: 'valueLabel', anchor: 'middle' },
      ],
    };
  }

  const frame: FrameNode = {
    type: 'frame',
    key: 'respiratoryFailure',
    viewBox: [0, 0, 480, 300],
    ariaLabel: `Respiratory failure classification map: PaO2 versus PaCO2 with a ventilated and a shunted lung unit, mode ${derived.failureType} failure`,
    children: [
      // The map.
      { type: 'text', x: MAP.left, y: 20, text: 'Alveolar gas exchange (mmHg)', cls: 'pathLabel' },
      { type: 'rect', x: MAP.left, y: MAP.top, width: MAP.right - MAP.left, height: MAP.bottom - MAP.top, cls: 'axis' },
      // The classification gridlines: PaO2 60 (hypoxia) and 80 (borderline), PaCO2 45 (hypercapnia).
      { type: 'line', x1: mapX(60), y1: MAP.top, x2: mapX(60), y2: MAP.bottom, cls: 'axis' },
      { type: 'line', x1: mapX(80), y1: MAP.top, x2: mapX(80), y2: MAP.bottom, cls: 'axis', colorToken: 'vq' },
      { type: 'line', x1: MAP.left, y1: mapY(45), x2: MAP.right, y2: mapY(45), cls: 'axis', colorToken: 'co2' },
      // Quadrant names.
      { type: 'text', x: mapX(30), y: mapY(22) + 4, text: 'type I', cls: 'organLabel', anchor: 'middle', colorToken: 'o2' },
      { type: 'text', x: mapX(30), y: mapY(22) + 16, text: 'hypoxaemia', cls: 'caption', anchor: 'middle', colorToken: 'o2' },
      { type: 'text', x: mapX(115), y: mapY(22) + 4, text: 'normal', cls: 'organLabel', anchor: 'middle' },
      { type: 'text', x: mapX(115), y: mapY(22) + 16, text: 'gas exchange', cls: 'caption', anchor: 'middle' },
      { type: 'text', x: mapX(115), y: mapY(67) - 14, text: 'type II', cls: 'organLabel', anchor: 'middle', colorToken: 'co2' },
      { type: 'text', x: mapX(115), y: mapY(67) - 2, text: 'hypercapnia', cls: 'caption', anchor: 'middle', colorToken: 'co2' },
      { type: 'text', x: mapX(30), y: mapY(67) - 14, text: 'mixed', cls: 'organLabel', anchor: 'middle', colorToken: 'co2' },
      { type: 'text', x: mapX(30), y: mapY(67) - 2, text: 'failure', cls: 'caption', anchor: 'middle', colorToken: 'co2' },
      // Axis ticks.
      { type: 'text', x: MAP.left, y: MAP.bottom + 14, text: '0    150  PaO2', cls: 'tickLabel', anchor: 'middle' },
      { type: 'text', x: MAP.left - 4, y: mapY(90) + 3, text: '0', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: MAP.left - 4, y: mapY(0) + 3, text: '90', cls: 'tickLabel', anchor: 'end' },
      { type: 'text', x: MAP.left - 4, y: mapY(45) + 3, text: '45', cls: 'tickLabel', anchor: 'end' },

      // The patient: a movable point whose position is the whole diagnosis.
      { type: 'circle', cx: patient.x, cy: patient.y, r: 4.5, fill: 'co2' },
      {
        type: 'text',
        x: patient.x,
        y: labelY,
        text: `PaO2 ${derived.paO2.toFixed(0)} · PaCO2 ${derived.paCO2.toFixed(0)}`,
        cls: 'pathLabel',
        anchor: anchorFor(patient),
      },

      // The FiO2 pill: oxygen the driver of the type-I story.
      {
        type: 'group',
        transform: 'translate(388, 18)',
        children: [
          {
            type: 'rect',
            x: -52,
            y: -11,
            width: 104,
            height: 22,
            fill: 'o2',
            styleVars: { 'wash-strong': clamp(inputs.fiO2, 0.2, 1) },
          },
          { type: 'text', x: 0, y: 3, text: `inspired O₂ ${fiO2Pct}%`, cls: 'valueLabel', anchor: 'middle' },
        ],
      },

      // pH, HCO3 and the ventilation lever: the story below the fold that chronicity rewrites.
      {
        type: 'text',
        x: 300,
        y: 222,
        text: `pH ${derived.pH.toFixed(2)} · HCO3 ${derived.plasmaHCO3.toFixed(1)} mEq/L · VA ${(derived.alveolarVentilationMLPerMin / 1000).toFixed(1)} L/min`,
        cls: 'valueLabel',
        anchor: 'middle',
      },
      { type: 'text', x: 20, y: 222, text: `A-a ${derived.aaGradient.toFixed(0)} mmHg`, cls: 'valueLabel' },
      { type: 'text', x: 440, y: 222, text: `P/F ${derived.paO2FiO2Ratio.toFixed(0)}`, cls: 'valueLabel' },

      // Two lung units: the paired circle that keeps its oxygen, and the shunt that steals it.
      { type: 'text', x: 250, y: 240, text: 'the two lungs of V/Q mismatch', cls: 'caption' },
      { type: 'path', d: 'M270,256 L298,253', strokeWidth: 2, colorToken: 'vq', fill: 'none' },
      { type: 'path', d: 'M420,256 L394,253', strokeWidth: 2, colorToken: 'co2', fill: 'none' },
      lungUnit(306, 'open', `open ${Math.round((1 - derived.effectiveShuntFraction) * 100)}%`, 'vq'),
      lungUnit(420, 'shunt', `shunt ${Math.round(derived.effectiveShuntFraction * 100)}%`, 'co2'),

      { type: 'text', x: 300, y: 294, text: `failure: ${derived.failureType}`, cls: 'verdict', colorToken: 'co2', anchor: 'middle' },
    ],
  };

  return {
    diagram: [frame],
    controls: [
      {
        kind: 'toggle',
        label: 'Course',
        key: 'course',
        options: [
          { value: 'acute', label: 'Acute' },
          { value: 'chronic', label: 'Chronic (compensated)' },
        ],
        colorToken: 'co2',
      },
      { kind: 'slider', label: 'FiO2', key: 'fiO2', min: 0.21, max: 1, step: 0.01, format: 'percent' },
      { kind: 'slider', label: 'Minute ventilation', key: 'minuteVentilation', min: 3, max: 24, step: 0.5, unit: ' L/min' },
      { kind: 'slider', label: 'V/Q shunt', key: 'shuntFraction', min: 0, max: 0.6, step: 0.01, format: 'percent' },
      { kind: 'slider', label: 'CO2 production', key: 'co2ProductionMultiplier', min: 0.6, max: 2, step: 0.05, unit: '× resting' },
    ],
    readouts: [
      {
        label: 'PaO2',
        value: (c) => c.derived.paO2.toFixed(1),
        unit: ' mmHg',
        colorToken: 'o2',
        secondary: (c) => (c.derived.hypoxaemia === 'severe' ? 'severe hypoxaemia' : c.derived.hypoxaemia === 'borderline' ? 'borderline hypoxia' : undefined),
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
        secondary: (c) => (c.derived.respiratoryAcidosis ? 'respiratory acidosis' : c.derived.paCO2 < 35 ? 'respiratory alkalosis' : undefined),
      },
      { label: 'HCO3', value: (c) => c.derived.plasmaHCO3.toFixed(1), unit: ' mEq/L', colorToken: 'co2' },
      { label: 'Alveolar ventilation', value: (c) => (c.derived.alveolarVentilationMLPerMin / 1000).toFixed(1), unit: ' L/min', colorToken: 'compliance' },
      { label: 'P/F ratio', value: (c) => c.derived.paO2FiO2Ratio.toFixed(0), unit: ' mmHg', colorToken: 'vq' },
      { label: 'A-a gradient', value: (c) => c.derived.aaGradient.toFixed(1), unit: ' mmHg', colorToken: 'vq' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'PaO2',
        unit: 'mmHg',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: PAO2_MAX,
        data: (points) => points.map((p) => p.paO2),
      },
    ],
  };
}

function anchorFor(p: { x: number; y: number }): 'start' | 'middle' | 'end' {
  if (p.x > 300 - 40) return 'end';
  if (p.x < 60) return 'start';
  return 'middle';
}
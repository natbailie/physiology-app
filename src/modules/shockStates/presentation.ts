import { clamp } from '@/shared/lib/math';
import { CLASSIFICATION } from './engine/constants';
import type { ShockDerived, ShockHistoryPoint, ShockInputs, ShockState } from './engine/types';
import type { ModulePresentation, PresentationContext, SceneNode, ControlSpec } from '@/shared/presentation/types';

const LOOP = 'M 112 200 L 203 200 L 203 110 L 363 110 L 363 200 L 470 200 L 470 352 L 112 352 Z';
const LUNGS = 'M 243 110 q 20 -30 40 0 q 20 30 40 0';

const TANK = { x: 86, y: 236, width: 52, height: 88 };

type Ctx = PresentationContext<ShockState, ShockDerived, ShockInputs, ShockHistoryPoint>;

function band(value: number, low: number, high: number): string {
  if (value < low) return 'low';
  if (value > high) return 'high';
  return 'normal';
}

/**
 * The control rail, hoisted out of the builder so the page can read the same ranges the
 * schema declares.
 *
 * `useInputNudge` clamps a button's delta to the slider it writes, and the only honest source
 * for that range is the slider itself — restating it at the call site is a second place to be
 * wrong, and the one that would drift. Hoisting also gives the array a stable identity across
 * the engine's thirty renders a second, which is what lets the hook memoise.
 */
export const SHOCK_CONTROLS: ReadonlyArray<ControlSpec<ShockInputs>> = [
  { kind: 'slider', label: 'Blood volume', key: 'bloodVolumeMl', min: 2000, max: 6500, step: 50, unit: ' mL' },
  { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2, step: 0.02, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Vascular resistance', key: 'systemicVascularResistance', min: 0.15, max: 3, step: 0.01, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Pericardial pressure', key: 'pericardialPressureMmHg', min: 0, max: 28, step: 0.5, unit: ' mmHg' },
  { kind: 'slider', label: 'Pulmonary resistance', key: 'pulmonaryVascularResistance', min: 1, max: 9, step: 0.1, unit: 'x' },
  { kind: 'slider', label: 'Tissue extraction', key: 'tissueExtractionCapacity', min: 0.2, max: 1.3, step: 0.02, unit: '%', format: 'percent' },
  { kind: 'slider', label: 'Oxygen demand', key: 'oxygenDemandMlPerMin', min: 120, max: 600, step: 10, unit: ' mL/min' },
  { kind: 'slider', label: 'Haemoglobin', key: 'haemoglobinGDl', min: 3, max: 18, step: 0.5, unit: ' g/dL' },
  { kind: 'slider', label: 'Baroreflex gain', key: 'baroreflexGain', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
];

export function buildShockStatesPresentation(ctx: Ctx): ModulePresentation<ShockState, ShockDerived, ShockInputs, ShockHistoryPoint> {
  const { derived } = ctx;
  const flowSpeed = clamp(derived.cardiacOutputLPerMin * 0.4, 0.4, 2.4);
  const volumeFraction = clamp(derived.bloodVolumeMl / 5500, 0.02, 1);
  const pericardial = clamp(derived.pericardialPressureMmHg / 20, 0, 1);
  const obstruction = clamp((derived.pulmonaryVascularResistance - 1) / 6, 0, 1);
  const calibre = clamp(1 / Math.max(derived.systemicVascularResistance, 0.25), 0.4, 3);
  const cvpFill = clamp(derived.centralVenousPressureMmHg / 18, 0, 1);
  const wedgeFill = clamp(derived.wedgePressureMmHg / 28, 0, 1);
  const contractility = clamp(derived.contractility, 0.05, 2);
  const fillHeight = TANK.height * volumeFraction;

  const children: SceneNode[] = [];

  children.push(
    { type: 'vessel', path: LOOP, speed: flowSpeed, colorToken: 'artery' },
    { type: 'path', d: 'M 470 206 L 470 346', colorToken: 'artery', strokeWidth: 3 * calibre },
    { type: 'text', x: 480, y: 272, text: 'Arteries', cls: 'anatomy' },
    { type: 'text', x: 480, y: 288, text: `SVR ${(derived.systemicVascularResistance * 100).toFixed(0)}%`, cls: 'valueLabel', colorToken: 'text' },
    { type: 'rect', x: TANK.x, y: TANK.y, width: TANK.width, height: TANK.height, cls: 'tank' },
    {
      type: 'rect',
      x: TANK.x + 3,
      y: TANK.y + TANK.height - fillHeight + 3,
      width: TANK.width - 6,
      height: Math.max(0, fillHeight - 6),
      fill: 'venous',
    },
    { type: 'text', x: TANK.x + TANK.width / 2, y: TANK.y - 10, text: 'Venous reservoir', cls: 'anatomy', anchor: 'middle' },
    {
      type: 'text',
      x: TANK.x + TANK.width / 2,
      y: TANK.y + TANK.height + 18,
      text: `${(derived.bloodVolumeMl / 1000).toFixed(1)} L`,
      cls: 'valueLabel',
      colorToken: 'text',
      anchor: 'middle',
    },
    { type: 'rect', x: 170, y: 168, width: 66, height: 64, cls: 'chamber', styleVars: { 'cvp-fill': cvpFill } },
    { type: 'text', x: 203, y: 152, text: 'Right heart', cls: 'anatomy', anchor: 'middle' },
    { type: 'text', x: 203, y: 252, text: `CVP ${derived.centralVenousPressureMmHg.toFixed(0)}`, cls: 'valueLabel', colorToken: 'text', anchor: 'middle' },
    {
      type: 'text',
      x: 203,
      y: 266,
      text: `transmural ${derived.transmuralRapMmHg.toFixed(0)}`,
      cls: 'valueLabel',
      colorToken: 'text',
      anchor: 'middle',
      opacity: 0.6,
    },
    { type: 'path', d: LUNGS, colorToken: 'o2', strokeWidth: 2.5, opacity: clamp(1 - obstruction * 0.4, 0.6, 1) },
    { type: 'text', x: 283, y: 78, text: 'Lungs', cls: 'anatomy', anchor: 'middle' },
  );

  if (obstruction > 0.05) {
    children.push({
      type: 'group',
      styleVars: { obstruction },
      children: [
        { type: 'line', x1: 330, y1: 96, x2: 330, y2: 124, colorToken: 'danger' },
        { type: 'line', x1: 340, y1: 96, x2: 340, y2: 124, colorToken: 'danger' },
        { type: 'text', x: 352, y: 116, text: 'obstruction', cls: 'valueLabel', colorToken: 'danger' },
      ],
    });
  }

  children.push(
    { type: 'rect', x: 330, y: 168, width: 66, height: 64, cls: 'chamber', styleVars: { 'wedge-fill': wedgeFill, 'contractility': contractility } },
    { type: 'text', x: 363, y: 152, text: 'Left heart', cls: 'anatomy', anchor: 'middle' },
    { type: 'text', x: 363, y: 252, text: `Wedge ${derived.wedgePressureMmHg.toFixed(0)}`, cls: 'valueLabel', colorToken: 'text', anchor: 'middle' },
    {
      type: 'text',
      x: 363,
      y: 266,
      text: `SV ${derived.strokeVolumeMl.toFixed(0)} mL`,
      cls: 'valueLabel',
      colorToken: 'text',
      anchor: 'middle',
      opacity: 0.6,
    },
  );

  if (pericardial > 0.03) {
    children.push(
      { type: 'rect', x: 158, y: 160, width: 250, height: 84, cls: 'pericardium', styleVars: { pericardial } },
      {
        type: 'text',
        x: 283,
        y: 138,
        text: `pericardial ${derived.pericardialPressureMmHg.toFixed(0)} mmHg`,
        cls: 'valueLabel',
        colorToken: 'danger',
        anchor: 'middle',
      },
    );
  }

  children.push(
    { type: 'rect', x: 186, y: 330, width: 208, height: 44, cls: 'tissue', fill: 'text' },
    { type: 'text', x: 290, y: 348, text: 'Tissue', cls: 'anatomy', anchor: 'middle' },
    {
      type: 'text',
      x: 290,
      y: 364,
      text: `SvO₂ ${derived.mixedVenousSaturationPercent.toFixed(0)}% · lactate ${derived.lactateMmolL.toFixed(1)}`,
      cls: 'valueLabel',
      colorToken: 'text',
      anchor: 'middle',
    },
    {
      type: 'circle',
      cx: 112,
      cy: 352,
      r: 4,
      fill: 'artery',
      styleVars: { 'transit-seconds': clamp(18 / Math.max(derived.cardiacOutputLPerMin, 0.4), 1.2, 26) },
    },
    {
      type: 'text',
      x: 36,
      y: 36,
      text: `Cardiac index ${derived.cardiacIndex.toFixed(1)} · MAP ${derived.meanArterialPressureMmHg.toFixed(0)} mmHg · O₂ delivery ${derived.oxygenDeliveryMlPerMin.toFixed(0)} mL/min`,
      cls: 'caption',
    },
  );

  if (derived.isOxygenDebt) {
    children.push({ type: 'text', x: 36, y: 56, text: 'oxygen debt — demand exceeds what the tissue can take', cls: 'alarm' });
  }

  children.push(
    { type: 'text', x: 36, y: 400, text: derived.classification, cls: 'verdict' },
    { type: 'text', x: 36, y: 420, text: derived.patternSummary, cls: 'label' },
  );

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [0, 0, 560, 440],
        ariaLabel:
          'The circulation as a loop, with the four sites where shock arises drawn as four different structures: a venous reservoir whose level is the blood volume, a right heart, lungs with a clamp for obstruction, a left heart whose wall carries contractility, and tissue along the bottom',
        children,
      },
    ],
    controls: SHOCK_CONTROLS,
    readouts: [
      {
        label: 'MAP',
        value: (c) => c.derived.meanArterialPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => (c.derived.meanArterialPressureMmHg < CLASSIFICATION.SHOCK_MAP_MMHG ? 'hypotensive' : 'not hypotensive'),
        colorToken: 'artery',
      },
      {
        label: 'Cardiac index',
        value: (c) => c.derived.cardiacIndex.toFixed(1),
        unit: 'L/min/m²',
        secondary: (c) => band(c.derived.cardiacIndex, CLASSIFICATION.LOW_CARDIAC_INDEX, CLASSIFICATION.HIGH_CARDIAC_INDEX),
        colorToken: 'artery',
      },
      {
        label: 'CVP',
        value: (c) => c.derived.centralVenousPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) =>
          c.derived.pericardialPressureMmHg > 1
            ? `transmural only ${c.derived.transmuralRapMmHg.toFixed(0)}`
            : band(c.derived.centralVenousPressureMmHg, CLASSIFICATION.LOW_CVP_MMHG, CLASSIFICATION.HIGH_CVP_MMHG),
        colorToken: 'venous',
      },
      {
        label: 'Wedge pressure',
        value: (c) => c.derived.wedgePressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => band(c.derived.wedgePressureMmHg, CLASSIFICATION.LOW_WEDGE_MMHG, CLASSIFICATION.HIGH_WEDGE_MMHG),
        colorToken: 'venous',
      },
      {
        label: 'SVR',
        value: (c) => `${(c.derived.effectiveSvr * 100).toFixed(0)}%`,
        secondary: (c) => band(c.derived.effectiveSvr, CLASSIFICATION.LOW_SVR, CLASSIFICATION.HIGH_SVR),
        colorToken: 'artery',
      },
      {
        label: 'Heart rate',
        value: (c) => c.derived.heartRateBpm.toFixed(0),
        unit: 'bpm',
        colorToken: 'artery',
      },
      {
        label: 'Oxygen delivery',
        value: (c) => c.derived.oxygenDeliveryMlPerMin.toFixed(0),
        unit: 'mL/min',
        secondary: (c) => (c.derived.isOxygenDebt ? 'demand not met' : 'demand met'),
        colorToken: 'o2',
      },
      {
        label: 'SvO₂',
        value: (c) => c.derived.mixedVenousSaturationPercent.toFixed(0),
        unit: '%',
        secondary: (c) =>
          c.derived.mixedVenousSaturationPercent > 75 && c.derived.lactateMmolL >= CLASSIFICATION.RAISED_LACTATE_MMOL_L
            ? 'high, but lactate is up'
            : band(c.derived.mixedVenousSaturationPercent, 60, 75),
        colorToken: 'o2',
      },
      {
        label: 'Lactate',
        value: (c) => c.derived.lactateMmolL.toFixed(1),
        unit: 'mmol/L',
        secondary: (c) => (c.derived.lactateMmolL >= CLASSIFICATION.RAISED_LACTATE_MMOL_L ? 'oxygen debt' : 'normal'),
        colorToken: 'danger',
      },
      {
        label: 'Pattern',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'MAP',
        unit: 'mmHg',
        colorToken: 'artery',
        domainMin: 20,
        domainMax: 130,
        data: (points) => points.map((p) => p.map),
      },
      {
        kind: 'sparkline',
        label: 'Cardiac output',
        unit: 'L/min',
        colorToken: 'artery',
        domainMin: 0,
        domainMax: 12,
        data: (points) => points.map((p) => p.cardiacOutput),
      },
      {
        kind: 'sparkline',
        label: 'CVP',
        unit: 'mmHg',
        colorToken: 'venous',
        domainMin: -2,
        domainMax: 28,
        data: (points) => points.map((p) => p.cvp),
      },
      {
        kind: 'sparkline',
        label: 'SvO₂',
        unit: '%',
        colorToken: 'o2',
        domainMin: 0,
        domainMax: 100,
        data: (points) => points.map((p) => p.svo2),
      },
      {
        kind: 'sparkline',
        label: 'Lactate',
        unit: 'mmol/L',
        colorToken: 'danger',
        domainMin: 0,
        domainMax: 16,
        data: (points) => points.map((p) => p.lactate),
      },
    ],
  };
}

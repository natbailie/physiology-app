import { clamp } from '@/shared/lib/math';
import { CRANIUM, CLASSIFICATION, FLOW } from './engine/constants';
import { intracranialPressure } from './engine/cerebralMechanics';
import type { CerebralDerived, CerebralHistoryPoint, CerebralInputs, CerebralInternalState } from './engine/types';
import type { ModulePresentation, PresentationContext, FrameNode } from '@/shared/presentation/types';

const BOX = { x: 40, y: 90, width: 210, height: 74 };
const PLOT = { x: 300, y: 60, width: 230, height: 170 };
const MAX_VOLUME_ML = 160;
const MAX_PRESSURE_MMHG = 70;

const toX = (volumeMl: number) => PLOT.x + (clamp(volumeMl, 0, MAX_VOLUME_ML) / MAX_VOLUME_ML) * PLOT.width;
const toY = (pressureMmHg: number) =>
  PLOT.y + PLOT.height - (clamp(pressureMmHg, 0, MAX_PRESSURE_MMHG) / MAX_PRESSURE_MMHG) * PLOT.height;

function curvePath(): string {
  const points: string[] = [];
  for (let v = 0; v <= MAX_VOLUME_ML; v += 4) {
    points.push(`${v === 0 ? 'M' : 'L'}${toX(v).toFixed(1)},${toY(intracranialPressure(v)).toFixed(1)}`);
  }
  return points.join(' ');
}

type Ctx = PresentationContext<CerebralInternalState, CerebralDerived, CerebralInputs, CerebralHistoryPoint>;

export function buildCerebralPerfusionPresentation(ctx: Ctx): ModulePresentation<
  CerebralInternalState,
  CerebralDerived,
  CerebralInputs,
  CerebralHistoryPoint
> {
  const { derived } = ctx;

  // Contents drawn to scale inside a box of fixed width.
  const totalMl = 1400;
  const scale = BOX.width / totalMl;
  const massWidth = derived.massVolumeMl * scale * 4;
  const bloodWidth = derived.cerebralBloodVolumeMl * scale * 4;
  const csfWidth = Math.max(0, 140 + derived.csfExcessMl) * scale * 4;
  const brainWidth = Math.max(20, BOX.width - massWidth - bloodWidth - csfWidth);

  const kneeX = toX(CRANIUM.COMPENSATORY_RESERVE_ML);

  const summary: FrameNode = {
    type: 'frame',
    viewBox: [0, 0, 560, 440],
    ariaLabel:
      'Intracranial contents — brain, blood, CSF and any added mass — drawn to scale inside a skull that cannot expand, beside the pressure-volume curve with the current operating point',
    children: [
      { type: 'path', d: `M ${BOX.x - 8} ${BOX.y - 10} h ${BOX.width + 16} v ${BOX.height + 20} h -${BOX.width + 16} z`, colorToken: 'text-dim', fill: 'none', strokeWidth: 2.5 },
      { type: 'text', x: BOX.x - 8, y: BOX.y - 18, text: 'A box that cannot expand', cls: 'label' },
      { type: 'rect', x: BOX.x, y: BOX.y, width: brainWidth, height: BOX.height, fill: 'text-dim', styleVars: { opacity: 0.25 } },
      { type: 'rect', x: BOX.x + brainWidth, y: BOX.y, width: bloodWidth, height: BOX.height, fill: 'artery', styleVars: { opacity: 0.45 } },
      { type: 'rect', x: BOX.x + brainWidth + bloodWidth, y: BOX.y, width: csfWidth, height: BOX.height, fill: 'o2', styleVars: { opacity: 0.4 } },
      { type: 'rect', x: BOX.x + brainWidth + bloodWidth + csfWidth, y: BOX.y, width: massWidth, height: BOX.height, fill: 'danger', styleVars: { opacity: 0.5 } },
      { type: 'text', x: BOX.x, y: BOX.y + BOX.height + 30, text: 'Brain · blood · CSF · mass', cls: 'label' },
      { type: 'rect', x: PLOT.x, y: PLOT.y, width: kneeX - PLOT.x, height: PLOT.height, fill: 'o2', styleVars: { opacity: 0.08 } },
      { type: 'rect', x: kneeX, y: PLOT.y, width: PLOT.x + PLOT.width - kneeX, height: PLOT.height, fill: 'danger', styleVars: { opacity: 0.08 } },
      { type: 'line', x1: PLOT.x, y1: PLOT.y + PLOT.height, x2: PLOT.x + PLOT.width, y2: PLOT.y + PLOT.height, cls: 'axis' },
      { type: 'line', x1: PLOT.x, y1: PLOT.y, x2: PLOT.x, y2: PLOT.y + PLOT.height, cls: 'axis' },
      { type: 'path', d: curvePath(), colorToken: 'text-faint', fill: 'none', strokeWidth: 2 },
      { type: 'circle', cx: toX(derived.totalExcessVolumeMl), cy: toY(derived.intracranialPressureMmHg), r: 5, fill: 'artery' },
      { type: 'text', x: PLOT.x, y: PLOT.y - 12, text: 'Pressure vs volume', cls: 'label' },
      { type: 'text', x: PLOT.x, y: PLOT.y + PLOT.height + 18, text: 'added volume →', cls: 'label' },
      {
        type: 'text',
        x: 40,
        y: 300,
        text: `ICP ${derived.intracranialPressureMmHg.toFixed(0)} · CPP ${derived.cerebralPerfusionPressureMmHg.toFixed(0)} · CBF ${derived.cerebralBloodFlow.toFixed(0)} · ${derived.compensatoryReserveMl.toFixed(0)} mL reserve`,
        cls: 'caption',
      },
      { type: 'text', x: 40, y: 318, text: `one more mL costs ${derived.elastanceMmHgPerMl.toFixed(2)} mmHg`, cls: 'caption' },
      ...(derived.cushingResponseActive
        ? [{ type: 'text' as const, x: 40, y: 338, text: `Cushing response — hypertension with bradycardia at ${derived.reflexHeartRateBpm.toFixed(0)} bpm`, cls: 'alarm' }]
        : []),
      { type: 'text', x: 40, y: 368, text: derived.classification, cls: 'verdict' },
      { type: 'text', x: 40, y: 388, text: derived.patternSummary, cls: 'label' },
    ],
  };

  return {
    diagram: [summary],
    controls: [
      { kind: 'slider', label: 'Mean arterial pressure', key: 'meanArterialPressureMmHg', min: 40, max: 170, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'Intracranial mass', key: 'massVolumeMl', min: 0, max: 150, step: 1, unit: ' mL' },
      { kind: 'slider', label: 'PaCO₂', key: 'paCO2MmHg', min: 15, max: 80, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'PaO₂', key: 'paO2MmHg', min: 25, max: 150, step: 1, unit: ' mmHg' },
      { kind: 'slider', label: 'CSF production', key: 'csfProductionRate', min: 0, max: 2.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'CSF absorption', key: 'csfAbsorptionCapacity', min: 0, max: 1.5, step: 0.02, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Autoregulation', key: 'autoregulationIntegrity', min: 0, max: 1, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Venous outflow pressure', key: 'venousOutflowPressureMmHg', min: 0, max: 25, step: 0.5, unit: ' mmHg' },
      { kind: 'slider', label: 'BBB permeability', key: 'bbbPermeabilityPct', min: 0, max: 200, step: 5, unit: '%' },
    ],
    readouts: [
      {
        label: 'ICP',
        value: (c) => c.derived.intracranialPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => (c.derived.intracranialPressureMmHg >= CLASSIFICATION.RAISED_ICP_MMHG ? 'raised' : 'normal'),
        colorToken: 'danger',
      },
      {
        label: 'CPP',
        value: (c) => c.derived.cerebralPerfusionPressureMmHg.toFixed(0),
        unit: 'mmHg',
        secondary: (c) => (c.derived.cerebralPerfusionPressureMmHg < CLASSIFICATION.LOW_CPP_MMHG ? 'inadequate' : 'MAP − ICP'),
        colorToken: 'artery',
      },
      {
        label: 'Cerebral blood flow',
        value: (c) => c.derived.cerebralBloodFlow.toFixed(0),
        unit: 'mL/100g/min',
        secondary: (c) =>
          c.derived.cerebralBloodFlow < FLOW.ISCHAEMIC_THRESHOLD
            ? 'ischaemic'
            : c.derived.cerebralBloodFlow > FLOW.HYPERAEMIC_THRESHOLD
              ? 'hyperaemic'
              : 'adequate',
        colorToken: 'o2',
      },
      {
        label: 'Reserve remaining',
        value: (c) => c.derived.compensatoryReserveMl.toFixed(0),
        unit: 'mL',
        secondary: (c) => (c.derived.compensatoryReserveMl < CLASSIFICATION.LOW_RESERVE_ML ? 'at the knee' : 'compensating'),
        colorToken: 'text',
      },
      { label: 'Elastance', value: (c) => c.derived.elastanceMmHgPerMl.toFixed(2), unit: 'mmHg/mL', secondary: () => 'cost of one more mL', colorToken: 'danger' },
      {
        label: 'Cerebral blood volume',
        value: (c) => c.derived.cerebralBloodVolumeMl.toFixed(0),
        unit: 'mL',
        secondary: (c) => (c.derived.vesselCalibre > 1.1 ? 'vasodilated' : c.derived.vesselCalibre < 0.9 ? 'vasoconstricted' : undefined),
        colorToken: 'artery',
      },
      { label: 'CSF excess', value: (c) => c.derived.csfExcessMl.toFixed(0), unit: 'mL', colorToken: 'o2' },
      {
        label: 'Vasogenic oedema',
        value: (c) => c.derived.vasogenicOedemaMl.toFixed(1),
        unit: 'mL',
        secondary: (c) => (c.derived.vasogenicOedemaMl > 10 ? 'BBB leak — mass effect rising' : 'no extravasation'),
        colorToken: 'warn',
      },
      {
        label: 'Autoregulation',
        value: (c) => (c.derived.autoregulating ? 'intact' : 'lost'),
        secondary: (c) => (c.derived.autoregulating ? 'flow defended' : 'flow follows pressure'),
        colorToken: 'text',
      },
      {
        label: 'Heart rate',
        value: (c) => c.derived.reflexHeartRateBpm.toFixed(0),
        unit: 'bpm',
        secondary: (c) => (c.derived.cushingResponseActive ? 'Cushing bradycardia' : undefined),
        colorToken: derived.cushingResponseActive ? 'danger' : 'artery',
      },
      {
        label: 'State',
        value: (c) => c.derived.classification,
        secondary: (c) => c.derived.patternSummary,
        colorToken: 'text',
        revealsPattern: true,
      },
    ],
    charts: [
      { kind: 'sparkline', label: 'ICP', unit: 'mmHg', colorToken: 'danger', domainMin: 0, domainMax: 70, data: (points) => points.map((p) => p.icp) },
      { kind: 'sparkline', label: 'CPP', unit: 'mmHg', colorToken: 'artery', domainMin: 0, domainMax: 140, data: (points) => points.map((p) => p.cpp) },
      { kind: 'sparkline', label: 'Cerebral blood flow', colorToken: 'o2', domainMin: 0, domainMax: 100, data: (points) => points.map((p) => p.cbf) },
      { kind: 'sparkline', label: 'Cerebral blood volume', unit: 'mL', colorToken: 'venous', domainMin: 30, domainMax: 170, data: (points) => points.map((p) => p.cbv) },
    ],
  };
}

import { clamp } from '@/shared/lib/math';
import { HEMODYNAMICS, RENAL } from './engine/constants';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from './engine/types';
import type { ModulePresentation, PresentationContext } from '@/shared/presentation/types';

const ARTERIAL_PATH = 'M148,130 C220,70 310,70 345,110';
const VENOUS_PATH = 'M345,190 C310,235 220,235 148,175';
/* RAAS reaches the circulation by two routes with two different clocks, and the module turns on
 * the difference: angiotensin II squeezes the vessels within seconds, aldosterone rebuilds volume
 * at the tubule over hours. One arrow to one destination could not say that, so there are two. */
const ANGIOTENSIN_PATH = 'M338,214 C300,258 232,246 214,196';
const ALDOSTERONE_PATH = 'M392,214 C420,250 400,268 376,236';
const ANP_PATH = 'M148,108 C195,42 290,42 345,88';

type Ctx = PresentationContext<SimState, DerivedValues, SimInputs, HistoryPoint>;

export function buildCardiorenalPresentation(ctx: Ctx): ModulePresentation<SimState, DerivedValues, SimInputs, HistoryPoint> {
  const { derived } = ctx;
  const strokeVolumeScale = clamp(derived.strokeVolume / HEMODYNAMICS.BASELINE_STROKE_VOLUME_ML, 0.5, 1.6);
  const flowSpeed = clamp(derived.cardiacOutput / HEMODYNAMICS.CO_BASELINE_ML_PER_MIN, 0.05, 2.5);
  const renalFlowSpeed = clamp(derived.renalBloodFlow, 0.05, 2.5);
  // Calibre falls as angiotensin II constricts, so the resistance term is a visible narrowing
  // rather than only a number in the readouts.
  const arterialCalibre = clamp(1 / Math.max(derived.effectiveSVR, 0.3), 0.45, 1.8);
  const gfrIntensity = clamp(derived.gfr / RENAL.BASELINE_GFR, 0, 1.8);
  const urineSpeed = clamp(derived.urineOutput / RENAL.BASELINE_URINE_TARGET, 0.05, 2.5);

  return {
    diagram: [
      {
        type: 'frame',
        viewBox: [56, 17, 419, 284],
        ariaLabel: 'Animated diagram of the heart and kidneys, connected by blood flow and the RAAS and ANP hormone pathways',
        defs: [
          { type: 'marker', id: 'raas-arrow', colorToken: 'raas' },
          { type: 'marker', id: 'anp-arrow', colorToken: 'anp' },
        ],
        children: [
          { type: 'vessel', path: ARTERIAL_PATH, speed: flowSpeed, colorToken: 'artery', width: arterialCalibre },
          { type: 'vessel', path: VENOUS_PATH, speed: flowSpeed, colorToken: 'artery' },
          { type: 'vessel', path: 'M370,132 L370,168', speed: renalFlowSpeed, colorToken: 'kidney' },
          {
            type: 'axis',
            path: ANP_PATH,
            activation: derived.anpLevel,
            colorToken: 'anp',
            label: 'ANP',
            labelX: 200,
            labelY: 40,
            markerId: 'anp-arrow',
          },
          // Angiotensin II acts on the ARTERIES — the resistance term, and it acts at once.
          {
            type: 'axis',
            path: ANGIOTENSIN_PATH,
            activation: derived.angiotensinII,
            colorToken: 'raas',
            label: 'Angiotensin II',
            labelX: 232,
            labelY: 262,
            markerId: 'raas-arrow',
          },
          // Aldosterone acts on the TUBULE — the volume term, and it takes hours.
          {
            type: 'axis',
            path: ALDOSTERONE_PATH,
            activation: derived.aldosterone,
            colorToken: 'raas',
            label: 'Aldosterone',
            labelX: 398,
            labelY: 284,
            markerId: 'raas-arrow',
          },
          {
            type: 'organ',
            name: 'heart',
            x: 110,
            y: 150,
            params: { heartRate: derived.effectiveHeartRate, strokeVolumeScale },
          },
          {
            type: 'organ',
            name: 'kidneys',
            x: 370,
            y: 100,
            params: { gfrIntensity, urineSpeed },
          },
        ],
      },
    ],
    controls: [
      { kind: 'slider', label: 'Heart rate', key: 'heartRate', min: 40, max: 180, step: 1, unit: ' bpm' },
      { kind: 'slider', label: 'Contractility', key: 'contractility', min: 0, max: 2, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Vascular tone', key: 'vascularTone', min: 0.5, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Kidney function', key: 'kidneyFunction', min: 0, max: 1.5, step: 0.05, unit: '%', format: 'percent' },
      { kind: 'slider', label: 'Sodium intake', key: 'sodiumIntake', min: 0, max: 300, step: 5, unit: '%' },
    ],
    readouts: [
      { label: 'MAP', value: (c) => c.derived.meanArterialPressure.toFixed(0), unit: 'mmHg', colorToken: 'artery' },
      { label: 'Cardiac output', value: (c) => (c.derived.cardiacOutput / 1000).toFixed(1), unit: 'L/min', colorToken: 'artery' },
      {
        label: 'Heart rate',
        value: (c) => c.derived.effectiveHeartRate.toFixed(0),
        unit: 'bpm',
        setPoint: (c) => c.inputs.heartRate,
        colorToken: 'artery',
      },
      { label: 'Blood volume', value: (c) => c.state.bloodVolume.toFixed(0), unit: '%', colorToken: 'text' },
      { label: 'GFR', value: (c) => c.derived.gfr.toFixed(0), unit: 'mL/min*', colorToken: 'kidney' },
      { label: 'Urine output', value: (c) => c.derived.urineOutput.toFixed(0), unit: 'mL/min*', colorToken: 'urine' },
      { label: 'RAAS activity', value: (c) => `${(c.derived.raasActivation * 100).toFixed(0)}%`, colorToken: 'raas' },
      { label: 'ANP activity', value: (c) => `${(c.derived.anpLevel * 100).toFixed(0)}%`, colorToken: 'anp' },
    ],
    charts: [
      {
        kind: 'sparkline',
        label: 'MAP',
        unit: 'mmHg',
        colorToken: 'artery',
        domainMin: 30,
        domainMax: 180,
        data: (points) => points.map((p) => p.map),
      },
      {
        kind: 'sparkline',
        label: 'GFR',
        unit: '*',
        colorToken: 'kidney',
        domainMin: 0,
        domainMax: 150,
        data: (points) => points.map((p) => p.gfr),
      },
      {
        kind: 'sparkline',
        label: 'Blood volume',
        unit: '%',
        colorToken: 'text',
        domainMin: 40,
        domainMax: 220,
        data: (points) => points.map((p) => p.bloodVolume),
      },
    ],
  };
}
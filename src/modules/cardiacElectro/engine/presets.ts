import type { CardiacInputs } from './types';

export const DEFAULT_CARDIAC_INPUTS: CardiacInputs = {
  intrinsicHeartRate: 70,
  sympatheticDrive: 20,
  parasympatheticDrive: 40,
  preloadEDV: 120,
  afterloadPressure: 80,
  contractility: 1,
  avConductionDelay: 160,
};

export type CardiacPresetName =
  | 'normal'
  | 'heartFailure'
  | 'hypertensiveCrisis'
  | 'hypovolemia'
  | 'aorticStenosis'
  | 'completeHeartBlock';

export const CARDIAC_PRESETS: Record<CardiacPresetName, Partial<CardiacInputs>> = {
  normal: { ...DEFAULT_CARDIAC_INPUTS },
  // Reduced contractility flattens the ESPVR: the ventricle cannot empty as far, so ESV rises,
  // stroke volume and ejection fraction fall, and the loop shifts right.
  heartFailure: { ...DEFAULT_CARDIAC_INPUTS, contractility: 0.5 },
  // Afterload mismatch: the ventricle must generate far more pressure before the aortic valve
  // opens, so ejection starts later and stroke volume falls.
  hypertensiveCrisis: { ...DEFAULT_CARDIAC_INPUTS, afterloadPressure: 150 },
  // Reduced preload: a narrow loop shifted left. Frank-Starling in reverse — less filling
  // means less stretch means a smaller stroke volume.
  hypovolemia: { ...DEFAULT_CARDIAC_INPUTS, preloadEDV: 70 },
  // Modeled purely as a very high pressure the ventricle must overcome. A real stenosis is a
  // fixed orifice with a transvalvular gradient, so this is a deliberate simplification.
  aorticStenosis: { ...DEFAULT_CARDIAC_INPUTS, afterloadPressure: 165, contractility: 1.25 },
  // The AV delay grows so long that atrial and ventricular activation decouple — watch the P
  // waves and QRS complexes drift apart on the ECG trace.
  completeHeartBlock: { ...DEFAULT_CARDIAC_INPUTS, avConductionDelay: 300 },
};

export const CARDIAC_PRESET_LABELS: Record<CardiacPresetName, string> = {
  normal: 'Normal',
  heartFailure: 'Heart failure',
  hypertensiveCrisis: 'Hypertensive crisis',
  hypovolemia: 'Hypovolemia',
  aorticStenosis: 'Aortic stenosis',
  completeHeartBlock: 'Complete heart block',
};

export const PRESET_ORDER: CardiacPresetName[] = [
  'normal',
  'heartFailure',
  'hypertensiveCrisis',
  'hypovolemia',
  'aorticStenosis',
  'completeHeartBlock',
];

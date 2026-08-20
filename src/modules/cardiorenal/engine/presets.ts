import type { SimInputs } from './types';

export const DEFAULT_INPUTS: SimInputs = {
  heartRate: 70,
  contractility: 1,
  vascularTone: 1,
  kidneyFunction: 1,
  sodiumIntake: 100,
};

export type PresetName = 'normal' | 'heartFailure' | 'kidneyFailure' | 'highSaltDiet';

export const PRESETS: Record<PresetName, Partial<SimInputs>> = {
  normal: { ...DEFAULT_INPUTS },
  heartFailure: { contractility: 0.35 },
  kidneyFailure: { kidneyFunction: 0.3 },
  highSaltDiet: { sodiumIntake: 250 },
};

export const PRESET_LABELS: Record<PresetName, string> = {
  normal: 'Normal',
  heartFailure: 'Heart failure',
  kidneyFailure: 'Kidney failure',
  highSaltDiet: 'High salt diet',
};

export const PRESET_ORDER: PresetName[] = ['normal', 'heartFailure', 'kidneyFailure', 'highSaltDiet'];

import type { SimInputs } from './types';

export const DEFAULT_INPUTS: SimInputs = {
  heartRate: 70,
  contractility: 1,
  vascularTone: 1,
  kidneyFunction: 1,
  sodiumIntake: 100,
  baroreflexGain: 1,
};

export type PresetName = 'normal' | 'heartFailure' | 'kidneyFailure' | 'highSaltDiet' | 'undefendedFailure';

export const PRESETS: Record<PresetName, Partial<SimInputs>> = {
  normal: { ...DEFAULT_INPUTS },
  heartFailure: { contractility: 0.35 },
  kidneyFailure: { kidneyFunction: 0.3 },
  highSaltDiet: { sodiumIntake: 250 },
  /**
   * The same failing circulation with no reflex to hide it.
   *
   * Contractility low AND the baroreflex blocked, which is what a beta blockade or an autonomic
   * neuropathy does to a heart that is already struggling. The teaching is the comparison: heart
   * failure alone shows a pressure the reflex is quietly holding up at the cost of a fast heart
   * and clamped-down vessels, and this one shows what that reflex was worth.
   */
  undefendedFailure: { contractility: 0.35, baroreflexGain: 0 },
};

export const PRESET_LABELS: Record<PresetName, string> = {
  normal: 'Normal',
  heartFailure: 'Heart failure',
  kidneyFailure: 'Kidney failure',
  highSaltDiet: 'High salt diet',
  undefendedFailure: 'Heart failure, no reflex',
};

export const PRESET_ORDER: PresetName[] = [
  'normal',
  'heartFailure',
  'undefendedFailure',
  'kidneyFailure',
  'highSaltDiet',
];

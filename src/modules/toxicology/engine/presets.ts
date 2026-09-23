import type { ToxicologyInputs } from './types';

/**
 * The resting well at the heart of this module is the UK cut-off itself: 75 mg/kg of
 * paracetamol, four hours after the tablets, NAC started the moment they arrived. Everything
 * is a deviation from that threshold.
 */
export const DEFAULT_TOXICOLOGY_INPUTS: ToxicologyInputs = {
  doseMgKg: 75,
  hoursSinceIngestion: 4,
  charcoalDosePct: 0,
  nacStartHours: 4,
};

export type ToxicologyPresetName =
  | 'thresholdDose'
  | 'earlyMassiveDose'
  | 'latePresentation'
  | 'missedWindow'
  | 'safeExposure'
  | 'charcoalWins';

export const TOXICOLOGY_PRESETS: Record<ToxicologyPresetName, ToxicologyInputs> = {
  thresholdDose: DEFAULT_TOXICOLOGY_INPUTS,
  earlyMassiveDose: {
    doseMgKg: 300,
    hoursSinceIngestion: 1.5,
    charcoalDosePct: 30,
    nacStartHours: 1.5,
  },
  latePresentation: {
    doseMgKg: 250,
    hoursSinceIngestion: 16,
    charcoalDosePct: 0,
    nacStartHours: 16,
  },
  missedWindow: {
    doseMgKg: 250,
    hoursSinceIngestion: 26,
    charcoalDosePct: 0,
    nacStartHours: 26,
  },
  safeExposure: {
    doseMgKg: 60,
    hoursSinceIngestion: 4,
    charcoalDosePct: 0,
    nacStartHours: 99,
  },
  charcoalWins: {
    doseMgKg: 300,
    hoursSinceIngestion: 1,
    charcoalDosePct: 40,
    nacStartHours: 1,
  },
};

export const TOXICOLOGY_PRESET_LABELS: Record<ToxicologyPresetName, string> = {
  thresholdDose: '75 mg/kg threshold',
  earlyMassiveDose: 'Early massive overdose',
  latePresentation: 'Late presentation',
  missedWindow: 'Window missed',
  safeExposure: 'Sub-toxic exposure',
  charcoalWins: 'Charcoal within the hour',
};

export const TOXICOLOGY_PRESET_ORDER: ToxicologyPresetName[] = [
  'thresholdDose',
  'earlyMassiveDose',
  'latePresentation',
  'missedWindow',
  'safeExposure',
  'charcoalWins',
];
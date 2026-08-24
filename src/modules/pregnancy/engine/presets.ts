import type { PregnancyInputs } from './types';

export const DEFAULT_PREGNANCY_INPUTS: PregnancyInputs = {
  gestationalWeeks: 30,
  twinGestation: 0,
  placentalFunctionPct: 100,
  sucklingDrivePct: 0,
  deliveredMode: 0,
  baselineHaemoglobinGPerDl: 13.5,
};

export type PregnancyPresetName =
  | 'firstTrimester'
  | 'lateSecondTrimester'
  | 'normalTerm'
  | 'twins'
  | 'preEclampsiaIugr'
  | 'postpartumFeeding'
  | 'postpartumNoFeed';

/**
 * The presets sweep gestation (adaptation curves), demand (twins), supply (placental
 * insufficiency) and the puerperium (lactation established vs suppressed). Labour itself is
 * an EVENT — run the action and watch the Ferguson reflex accelerate dilation.
 */
export const PREGNANCY_PRESETS: Record<PregnancyPresetName, Partial<PregnancyInputs>> = {
  firstTrimester: { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 8 },
  lateSecondTrimester: { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 26 },
  normalTerm: { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 39 },
  twins: { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 33, twinGestation: 1 },
  preEclampsiaIugr: { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 34, placentalFunctionPct: 45 },
  postpartumFeeding: {
    ...DEFAULT_PREGNANCY_INPUTS,
    gestationalWeeks: 40,
    deliveredMode: 1,
    sucklingDrivePct: 90,
  },
  postpartumNoFeed: {
    ...DEFAULT_PREGNANCY_INPUTS,
    gestationalWeeks: 40,
    deliveredMode: 1,
    sucklingDrivePct: 0,
  },
};

export const PREGNANCY_PRESET_LABELS: Record<PregnancyPresetName, string> = {
  firstTrimester: 'First trimester',
  lateSecondTrimester: 'Late second trimester',
  normalTerm: 'Normal term',
  twins: 'Twin gestation',
  preEclampsiaIugr: "Pre-eclampsia / IUGR",
  postpartumFeeding: 'Postpartum: feeding',
  postpartumNoFeed: 'Postpartum: not feeding',
};

export const PREGNANCY_PRESET_ORDER: PregnancyPresetName[] = [
  'firstTrimester',
  'lateSecondTrimester',
  'normalTerm',
  'twins',
  'preEclampsiaIugr',
  'postpartumFeeding',
  'postpartumNoFeed',
];

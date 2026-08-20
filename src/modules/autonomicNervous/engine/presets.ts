import type { AnsInputs } from './types';

export const DEFAULT_ANS_INPUTS: AnsInputs = {
  sympatheticTone: 20,
  parasympatheticTone: 40,
  circulatingEpinephrine: 0,
  betaBlockade: 0,
  muscarinicBlockade: 0,
  alphaBlockade: 0,
  cholinesteraseInhibition: 0,
};

export type AnsPresetName =
  | 'restAndDigest'
  | 'fightOrFlight'
  | 'betaBlocker'
  | 'atropine'
  | 'organophosphate'
  | 'pheochromocytoma';

export const ANS_PRESETS: Record<AnsPresetName, Partial<AnsInputs>> = {
  // Vagal dominance: slow heart, active gut, small pupils.
  restAndDigest: { ...DEFAULT_ANS_INPUTS, sympatheticTone: 10, parasympatheticTone: 70 },
  // Sympathetic dominance with vagal withdrawal — note the gut goes the OPPOSITE way to the heart.
  fightOrFlight: { ...DEFAULT_ANS_INPUTS, sympatheticTone: 90, parasympatheticTone: 10, circulatingEpinephrine: 60 },
  // Blocks beta receptors: blunts the tachycardia of a sympathetic surge, which is also why
  // it masks the adrenergic warning symptoms of hypoglycemia.
  betaBlocker: { ...DEFAULT_ANS_INPUTS, sympatheticTone: 70, parasympatheticTone: 20, betaBlockade: 85 },
  // Anticholinergic toxidrome: tachycardia (vagal brake removed), dilated pupils, dry
  // secretions, ileus — "dry as a bone, blind as a bat, mad as a hatter".
  atropine: { ...DEFAULT_ANS_INPUTS, muscarinicBlockade: 95 },
  // Cholinergic crisis: acetylcholinesterase inhibition amplifies vagal outflow, producing
  // the SLUDGE picture — bradycardia, pinpoint pupils, hypersecretion, bronchoconstriction.
  organophosphate: { ...DEFAULT_ANS_INPUTS, parasympatheticTone: 60, cholinesteraseInhibition: 90 },
  // Circulating catecholamine excess, independent of neural outflow — reaches beta-2
  // receptors that sympathetic nerves barely innervate.
  pheochromocytoma: { ...DEFAULT_ANS_INPUTS, circulatingEpinephrine: 90 },
};

export const ANS_PRESET_LABELS: Record<AnsPresetName, string> = {
  restAndDigest: 'Rest & digest',
  fightOrFlight: 'Fight or flight',
  betaBlocker: 'Beta-blocker',
  atropine: 'Atropine',
  organophosphate: 'Organophosphate',
  pheochromocytoma: 'Pheochromocytoma',
};

export const PRESET_ORDER: AnsPresetName[] = [
  'restAndDigest',
  'fightOrFlight',
  'betaBlocker',
  'atropine',
  'organophosphate',
  'pheochromocytoma',
];

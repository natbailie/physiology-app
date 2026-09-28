import type { UreaCycleInputs } from './types';

export const DEFAULT_UREA_CYCLE_INPUTS: UreaCycleInputs = {
  proteinIntakeGPerDay: 70,
  liverFunctionPct: 100,
  hydrationLPerDay: 2,
  enzymeCapacity: 1,
  catabolicStress: 0,
};

export type UreaCyclePresetName =
  | 'normal'
  | 'highProtein'
  | 'giBleed'
  | 'liverFailure'
  | 'otcDeficiency'
  | 'valproateBlock';

export const UREA_CYCLE_PRESETS: Record<UreaCyclePresetName, Partial<UreaCycleInputs>> = {
  normal: { ...DEFAULT_UREA_CYCLE_INPUTS },
  // A steak-heavy diet in a healthy liver: urea climbs, ammonia barely moves.
  highProtein: { ...DEFAULT_UREA_CYCLE_INPUTS, proteinIntakeGPerDay: 180 },
  // An upper GI bleed digested from inside: endogenous protein without a single bite eaten.
  giBleed: { ...DEFAULT_UREA_CYCLE_INPUTS, catabolicStress: 1 },
  // Cirrhosis: the cycle cannot clear even an ordinary dinner — ammonia soars, urea falls.
  liverFailure: { ...DEFAULT_UREA_CYCLE_INPUTS, liverFunctionPct: 25 },
  // Ornithine transcarbamylase deficiency: CPS1 runs against a distal block, so ammonia and
  // the orotic shunt both climb while urea collapses.
  otcDeficiency: { ...DEFAULT_UREA_CYCLE_INPUTS, enzymeCapacity: 0.25 },
  // Valproate switching off the cycle's entry step (NAGS/CPS1): a drug-induced block with a
  // milder orotic signal than a true OTC defect.
  valproateBlock: { ...DEFAULT_UREA_CYCLE_INPUTS, liverFunctionPct: 80, enzymeCapacity: 0.5 },
};

export const UREA_CYCLE_PRESET_LABELS: Record<UreaCyclePresetName, string> = {
  normal: 'Normal',
  highProtein: 'High-protein meal',
  giBleed: 'GI bleed',
  liverFailure: 'Liver failure',
  otcDeficiency: 'OTC deficiency',
  valproateBlock: 'Valproate block',
};

export const UREA_CYCLE_PRESET_ORDER: UreaCyclePresetName[] = [
  'normal',
  'highProtein',
  'giBleed',
  'liverFailure',
  'otcDeficiency',
  'valproateBlock',
];

/**
 * One line under a scenario's name on a quiz option: what this state IS, never what its numbers
 * do. A gloss reporting a row of the panel would answer the pattern question from the options
 * alone. No gloss may name a panel row or quote a figure.
 */
export const UREA_CYCLE_PRESET_GLOSS: Partial<Record<UreaCyclePresetName, string>> = {
  normal: 'a healthy adult after an ordinary dinner',
  highProtein: 'a steak-heavy diet in a healthy liver',
  giBleed: 'blood digested from inside after an upper bleed',
  liverFailure: 'a cirrhotic liver that cannot clear the load',
  otcDeficiency: 'an inherited block early in the cycle',
  valproateBlock: 'a drug switching off the cycle entry step',
};

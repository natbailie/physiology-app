import type { KrebsCycleInputs } from './types';

export const DEFAULT_KREBS_CYCLE_INPUTS: KrebsCycleInputs = {
  glucoseSupplyPct: 60,
  fattyAcidSupplyPct: 40,
  oxygenPct: 100,
  atpDemandMet: 1.2,
  thiaminePct: 100,
  pdhActivity: 1,
};

export type KrebsCyclePresetName =
  | 'normal'
  | 'exercise'
  | 'anaerobicThreshold'
  | 'hypoxia'
  | 'thiamineDeficiency'
  | 'pdhDeficiency'
  | 'fastedFat';

export const KREBS_CYCLE_PRESETS: Record<KrebsCyclePresetName, Partial<KrebsCycleInputs>> = {
  normal: { ...DEFAULT_KREBS_CYCLE_INPUTS },
  // Aerobic exercise with air to spare: demand pulls flux up, lactate stays flat.
  exercise: { ...DEFAULT_KREBS_CYCLE_INPUTS, atpDemandMet: 5 },
  // An all-out sprint outpacing delivery: demand high, oxygen only just enough — lactate spills.
  anaerobicThreshold: { ...DEFAULT_KREBS_CYCLE_INPUTS, atpDemandMet: 6, oxygenPct: 60 },
  // Thin air at rest: the chain cannot take electrons, so the turns stall and lactate climbs.
  hypoxia: { ...DEFAULT_KREBS_CYCLE_INPUTS, oxygenPct: 15 },
  // Beri-beri physiology: PDH and alpha-KGDH starved of TPP, pyruvate spilling to lactate.
  thiamineDeficiency: { ...DEFAULT_KREBS_CYCLE_INPUTS, thiaminePct: 10 },
  // An inherited PDH gate that will not open: carbohydrate denied entry whatever the demand.
  pdhDeficiency: { ...DEFAULT_KREBS_CYCLE_INPUTS, pdhActivity: 0.2 },
  // Days without carbohydrate: fat feeds the turns, the quotient slides toward 0.7.
  fastedFat: { ...DEFAULT_KREBS_CYCLE_INPUTS, glucoseSupplyPct: 15, fattyAcidSupplyPct: 90 },
};

export const KREBS_CYCLE_PRESET_LABELS: Record<KrebsCyclePresetName, string> = {
  normal: 'Normal rest',
  exercise: 'Aerobic exercise',
  anaerobicThreshold: 'Anaerobic threshold',
  hypoxia: 'Hypoxia',
  thiamineDeficiency: 'Thiamine deficiency',
  pdhDeficiency: 'PDH deficiency',
  fastedFat: 'Fasted, high-fat',
};

export const KREBS_CYCLE_PRESET_ORDER: KrebsCyclePresetName[] = [
  'normal',
  'exercise',
  'anaerobicThreshold',
  'hypoxia',
  'thiamineDeficiency',
  'pdhDeficiency',
  'fastedFat',
];

/**
 * One line under a scenario's name on a quiz option: what this state IS, never what its numbers
 * do. A gloss reporting a row of the panel would answer the pattern question from the options
 * alone. No gloss may name a panel row or quote a figure.
 */
export const KREBS_CYCLE_PRESET_GLOSS: Partial<Record<KrebsCyclePresetName, string>> = {
  normal: 'a rested adult after an ordinary lunch',
  exercise: 'a tempo run with air to spare',
  anaerobicThreshold: 'an all-out sprint outpacing the air supply',
  hypoxia: 'thin mountain air at rest',
  thiamineDeficiency: 'a vitamin gap stopping two key steps',
  pdhDeficiency: 'an inherited gate that will not open',
  fastedFat: 'days without carbohydrate, running on stores',
};

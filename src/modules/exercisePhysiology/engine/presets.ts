import type { ExerciseInputs } from './types';

export const DEFAULT_EXERCISE_INPUTS: ExerciseInputs = {
  workloadWatts: 0,
  fitnessPct: 45,
  ageYears: 30,
  hydrationPct: 95,
};

export type ExercisePresetName =
  | 'rest'
  | 'lightCycling'
  | 'vigorousRun'
  | 'eliteEffort'
  | 'untrainedExhaustion'
  | 'dehydratedEffort'
  | 'athleteRest';

/**
 * One engine, the whole integrative story: every system's response is a function of the SAME
 * engagement fraction, so the presets show how training moves every curve together — and how
 * exceeding VO2max ends the experiment.
 */
export const EXERCISE_PRESETS: Record<ExercisePresetName, Partial<ExerciseInputs>> = {
  rest: { ...DEFAULT_EXERCISE_INPUTS },
  lightCycling: { ...DEFAULT_EXERCISE_INPUTS, workloadWatts: 75 },
  vigorousRun: { ...DEFAULT_EXERCISE_INPUTS, fitnessPct: 60, workloadWatts: 200 },
  eliteEffort: { ...DEFAULT_EXERCISE_INPUTS, fitnessPct: 92, workloadWatts: 340 },
  untrainedExhaustion: { ...DEFAULT_EXERCISE_INPUTS, fitnessPct: 15, workloadWatts: 280 },
  dehydratedEffort: { ...DEFAULT_EXERCISE_INPUTS, fitnessPct: 55, workloadWatts: 230, hydrationPct: 25 },
  athleteRest: { ...DEFAULT_EXERCISE_INPUTS, fitnessPct: 92 },
};

export const EXERCISE_PRESET_LABELS: Record<ExercisePresetName, string> = {
  rest: 'At rest',
  lightCycling: 'Light cycling (75 W)',
  vigorousRun: 'Vigorous run (200 W)',
  eliteEffort: 'Elite effort (340 W)',
  untrainedExhaustion: 'Untrained exhaustion (280 W)',
  dehydratedEffort: 'Dehydrated effort',
  athleteRest: 'Athlete at rest',
};

export const EXERCISE_PRESET_ORDER: ExercisePresetName[] = [
  'rest',
  'lightCycling',
  'vigorousRun',
  'eliteEffort',
  'untrainedExhaustion',
  'dehydratedEffort',
  'athleteRest',
];

/**
 * One line under a scenario's name on a quiz option: what this state IS, never what its numbers
 * do. See `SHOCK_PRESET_GLOSS` for why that distinction is load-bearing — a gloss reporting a row
 * of the panel would answer the pattern questions from the options alone. `questions.test.ts`
 * holds it: no gloss may name a panel row or quote a figure.
 */
export const EXERCISE_PRESET_GLOSS: Partial<Record<ExercisePresetName, string>> = {
  rest: 'no work being done',
  lightCycling: 'easy work, well inside what the circulation can deliver',
  vigorousRun: 'hard work, still supplied by oxygen',
  eliteEffort: 'a trained athlete at the top of what training has bought',
  untrainedExhaustion: 'demand past what an untrained circulation can deliver',
  dehydratedEffort: 'the same work with the circulating blood already down',
  athleteRest: 'a trained heart moving the same blood in fewer, larger beats',
};

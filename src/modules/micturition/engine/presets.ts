import type { MicturitionInputs } from './types';

export const DEFAULT_MICTURITION_INPUTS: MicturitionInputs = {
  urineProductionMLperMin: 1.5,
  parasympatheticPct: 0,
  sympatheticPct: 30,
  voluntarySphincterPct: 80,
  cortexInhibitsMicturition: false,
};

export type MicturitionPresetName =
  | 'normal'
  | 'filling'
  | 'strongUrge'
  | 'voiding'
  | 'detrusorOveractivity'
  | 'stressIncontinence'
  | 'overflowIncontinence'
  | 'neurogenic';

/**
 * Presets represent the classic urodynamic patterns. Each configures the autonomic
 * and voluntary inputs that a learner would adjust, plus the fill state they would
 * observe at the start of the scenario.
 */
export const MICTURITION_PRESETS: Record<MicturitionPresetName, Partial<MicturitionInputs>> = {
  normal: { ...DEFAULT_MICTURITION_INPUTS },
  filling: { ...DEFAULT_MICTURITION_INPUTS, sympatheticPct: 50, voluntarySphincterPct: 90 },
  strongUrge: { ...DEFAULT_MICTURITION_INPUTS, sympatheticPct: 20, voluntarySphincterPct: 95 },
  voiding: { ...DEFAULT_MICTURITION_INPUTS, parasympatheticPct: 80, sympatheticPct: 10, voluntarySphincterPct: 5 },
  detrusorOveractivity: {
    ...DEFAULT_MICTURITION_INPUTS,
    parasympatheticPct: 70,
    sympatheticPct: 10,
    voluntarySphincterPct: 85,
  },
  stressIncontinence: {
    ...DEFAULT_MICTURITION_INPUTS,
    voluntarySphincterPct: 25,
    sympatheticPct: 40,
  },
  overflowIncontinence: {
    ...DEFAULT_MICTURITION_INPUTS,
    parasympatheticPct: 5,
    sympatheticPct: 60,
    voluntarySphincterPct: 50,
  },
  neurogenic: {
    ...DEFAULT_MICTURITION_INPUTS,
    parasympatheticPct: 0,
    sympatheticPct: 0,
    voluntarySphincterPct: 0,
    cortexInhibitsMicturition: false,
  },
};

export const MICTURITION_PRESET_LABELS: Record<MicturitionPresetName, string> = {
  normal: 'Normal filling',
  filling: 'Storage phase',
  strongUrge: 'Strong urge',
  voiding: 'Voiding',
  detrusorOveractivity: 'Detrusor overactivity',
  stressIncontinence: 'Stress incontinence',
  overflowIncontinence: 'Overflow incontinence',
  neurogenic: 'Neurogenic bladder',
};

export const MICTURITION_PRESET_ORDER: MicturitionPresetName[] = [
  'normal',
  'filling',
  'strongUrge',
  'voiding',
  'detrusorOveractivity',
  'stressIncontinence',
  'overflowIncontinence',
  'neurogenic',
];

/**
 * One line under a scenario's name on a quiz option: what this state IS, never what its numbers
 * do. See `SHOCK_PRESET_GLOSS` for why that distinction is load-bearing — a gloss reporting a row
 * of the panel would answer the pattern questions from the options alone. `questions.test.ts`
 * holds it: no gloss may name a panel row or quote a figure.
 */
export const MICTURITION_PRESET_GLOSS: Partial<Record<MicturitionPresetName, string>> = {
  filling: 'the bladder storing, quietly',
  strongUrge: 'full enough that the urge is hard to defer',
  voiding: 'emptying, with the outlet relaxed',
  detrusorOveractivity: 'the bladder wall contracting before it is asked to',
  stressIncontinence: 'a weak outlet that leaks when the abdomen squeezes',
  overflowIncontinence: 'a bladder too full to take more, leaking past an obstruction',
  neurogenic: 'the cord no longer coordinating storage with emptying',
};

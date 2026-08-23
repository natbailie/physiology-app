import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { immuneLoopConfig } from './engine/loopConfig';
import { DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS } from './engine/presets';
import { IMMUNE_QUESTIONS } from './questions';
import type { ImmuneDerived, ImmuneInputs, ImmuneState } from './engine/types';
import type { ImmunePresetName } from './engine/presets';

type Snapshot = { state: ImmuneState; derived: ImmuneDerived };

// Naming an immunodeficiency from what survived it is a pattern-discrimination problem, and it
// is the format this module needed: comparing a normal host with a deficient one cannot be done
// in a single-run before-and-after.
const patterns = IMMUNE_QUESTIONS.filter(isPatternQuestion);
const predictions = IMMUNE_QUESTIONS.filter(
  (q): q is PredictQuestion<ImmuneInputs, ImmunePresetName, Snapshot> => !isPatternQuestion(q),
);

describe('immuneResponse pattern questions', () => {
  describePatternSet(immuneLoopConfig, DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS, patterns);
});

describe('immuneResponse predict questions', () => {
  describeQuestionSet(immuneLoopConfig, DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS, predictions);
});

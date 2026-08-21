import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { nmjLoopConfig } from './engine/loopConfig';
import { DEFAULT_NMJ_INPUTS, NMJ_PRESETS } from './engine/presets';
import { NMJ_QUESTIONS } from './questions';
import type { NmjDerived, NmjInputs, NmjState } from './engine/types';
import type { NmjPresetName } from './engine/presets';

type Snapshot = { state: NmjState; derived: NmjDerived };

const patterns = NMJ_QUESTIONS.filter(isPatternQuestion);
const predictions = NMJ_QUESTIONS.filter(
  (q): q is PredictQuestion<NmjInputs, NmjPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('NMJ pattern questions', () => {
  describePatternSet(nmjLoopConfig, DEFAULT_NMJ_INPUTS, NMJ_PRESETS, patterns);
});

describe('NMJ predict questions', () => {
  describeQuestionSet(nmjLoopConfig, DEFAULT_NMJ_INPUTS, NMJ_PRESETS, predictions);
});

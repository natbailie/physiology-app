import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { hptLoopConfig } from './engine/loopConfig';
import { DEFAULT_HPT_INPUTS, HPT_PRESETS } from './engine/presets';
import { HPT_QUESTIONS } from './questions';
import type { HptDerived, HptInputs, HptState } from './engine/types';
import type { HptPresetName } from './engine/presets';

type Snapshot = { state: HptState; derived: HptDerived };

// Which level of the axis has failed is a pattern-discrimination problem — the presets were
// built around exactly that distinction — while what an intervention DOES is a prediction.
const patterns = HPT_QUESTIONS.filter(isPatternQuestion);
const predictions = HPT_QUESTIONS.filter(
  (q): q is PredictQuestion<HptInputs, HptPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('hptAxis pattern questions', () => {
  describePatternSet(hptLoopConfig, DEFAULT_HPT_INPUTS, HPT_PRESETS, patterns);
});

describe('hptAxis predict questions', () => {
  describeQuestionSet(hptLoopConfig, DEFAULT_HPT_INPUTS, HPT_PRESETS, predictions);
});

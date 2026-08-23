import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { hearingLoopConfig } from './engine/loopConfig';
import { DEFAULT_HEARING_INPUTS, HEARING_PRESETS, type HearingPresetName } from './engine/presets';
import { HEARING_QUESTIONS } from './questions';
import type { HearingDerived, HearingInputs, HearingInternalState } from './engine/types';

type Snapshot = { state: HearingInternalState; derived: HearingDerived };

const patterns = HEARING_QUESTIONS.filter(isPatternQuestion);
const predictions = HEARING_QUESTIONS.filter(
  (q): q is PredictQuestion<HearingInputs, HearingPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('hearing pattern questions', () => {
  describePatternSet(hearingLoopConfig, DEFAULT_HEARING_INPUTS, HEARING_PRESETS, patterns);
});

describe('hearing predict questions', () => {
  describeQuestionSet(hearingLoopConfig, DEFAULT_HEARING_INPUTS, HEARING_PRESETS, predictions);
});

import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { describeGlossSet } from '@/shared/assessment/glossSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { respiratoryLoopConfig } from './engine/loopConfig';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS, RESP_PRESET_GLOSS } from './engine/presets';
import { RESPIRATORY_QUESTIONS } from './questions';
import type { RespDerived, RespInputs, RespState } from './engine/types';
import type { RespPresetName } from './engine/presets';

type Snapshot = { state: RespState; derived: RespDerived };

// Both formats: what a disturbance DOES is a prediction, and what a given gas MEANS is a
// pattern-discrimination problem — and the second is the one blood gases are examined on.
const patterns = RESPIRATORY_QUESTIONS.filter(isPatternQuestion);
const predictions = RESPIRATORY_QUESTIONS.filter(
  (q): q is PredictQuestion<RespInputs, RespPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('respiratory pattern questions', () => {
  describePatternSet(respiratoryLoopConfig, DEFAULT_RESP_INPUTS, RESP_PRESETS, patterns);
});

describe('respiratory predict questions', () => {
  describeQuestionSet(respiratoryLoopConfig, DEFAULT_RESP_INPUTS, RESP_PRESETS, predictions);
});

describeGlossSet(RESP_PRESET_GLOSS, RESP_PRESETS, patterns);

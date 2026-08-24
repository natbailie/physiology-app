import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { medullaLoopConfig } from './engine/loopConfig';
import {
  DEFAULT_MEDULLA_INPUTS,
  MEDULLA_PRESETS,
  type MedullaPresetName,
} from './engine/presets';
import { MEDULLA_QUESTIONS } from './questions';
import type { MedullaDerived, MedullaInputs, MedullaInternalState } from './engine/types';

type Snapshot = { state: MedullaInternalState; derived: MedullaDerived };

const patterns = MEDULLA_QUESTIONS.filter(isPatternQuestion);
const predictions = MEDULLA_QUESTIONS.filter(
  (q): q is PredictQuestion<MedullaInputs, MedullaPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('adrenal medulla pattern questions', () => {
  describePatternSet(medullaLoopConfig, DEFAULT_MEDULLA_INPUTS, MEDULLA_PRESETS, patterns);
});

describe('adrenal medulla predict questions', () => {
  describeQuestionSet(medullaLoopConfig, DEFAULT_MEDULLA_INPUTS, MEDULLA_PRESETS, predictions);
});

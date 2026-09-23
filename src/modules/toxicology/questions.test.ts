import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { toxicologyLoopConfig } from './engine/loopConfig';
import { DEFAULT_TOXICOLOGY_INPUTS, TOXICOLOGY_PRESETS, type ToxicologyPresetName } from './engine/presets';
import { TOXICOLOGY_QUESTIONS } from './questions';
import type { ToxicologyDerived, ToxicologyInputs, ToxicologyInternalState } from './engine/types';

type Snapshot = { state: ToxicologyInternalState; derived: ToxicologyDerived };

const patterns = TOXICOLOGY_QUESTIONS.filter(isPatternQuestion);
const predictions = TOXICOLOGY_QUESTIONS.filter(
  (q): q is PredictQuestion<ToxicologyInputs, ToxicologyPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('toxicology pattern questions', () => {
  describePatternSet(toxicologyLoopConfig, DEFAULT_TOXICOLOGY_INPUTS, TOXICOLOGY_PRESETS, patterns);
});

describe('toxicology predict questions', () => {
  describeQuestionSet(toxicologyLoopConfig, DEFAULT_TOXICOLOGY_INPUTS, TOXICOLOGY_PRESETS, predictions);
});
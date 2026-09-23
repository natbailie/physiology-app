import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { anaesthesiaLoopConfig } from './engine/loopConfig';
import { DEFAULT_ANAESTHESIA_INPUTS, ANAESTHESIA_PRESETS, type AnaesthesiaPresetName } from './engine/presets';
import { ANAESTHESIA_QUESTIONS } from './questions';
import type { AnaesthesiaDerived, AnaesthesiaInputs, AnaesthesiaInternalState } from './engine/types';

type Snapshot = { state: AnaesthesiaInternalState; derived: AnaesthesiaDerived };

const patterns = ANAESTHESIA_QUESTIONS.filter(isPatternQuestion);
const predictions = ANAESTHESIA_QUESTIONS.filter(
  (q): q is PredictQuestion<AnaesthesiaInputs, AnaesthesiaPresetName, Snapshot> => !isPatternQuestion(q),
);

describe('anaesthesia pattern questions', () => {
  describePatternSet(anaesthesiaLoopConfig, DEFAULT_ANAESTHESIA_INPUTS, ANAESTHESIA_PRESETS, patterns);
});

describe('anaesthesia predict questions', () => {
  describeQuestionSet(anaesthesiaLoopConfig, DEFAULT_ANAESTHESIA_INPUTS, ANAESTHESIA_PRESETS, predictions);
});
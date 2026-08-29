import { describe } from 'vitest';
import { describePatternSet } from '@/shared/assessment/patternSuite';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { isPatternQuestion, type PredictQuestion } from '@/shared/assessment/types';
import { micturitionLoopConfig } from './engine/loopConfig';
import { MICTURITION_PRESETS, DEFAULT_MICTURITION_INPUTS } from './engine/presets';
import { MICTURITION_QUESTIONS } from './questions';
import type { MicturitionDerived, MicturitionInputs, MicturitionInternalState } from './engine/types';
import type { MicturitionPresetName } from './engine/presets';

type Snapshot = { state: MicturitionInternalState; derived: MicturitionDerived };

const patterns = MICTURITION_QUESTIONS.filter(isPatternQuestion);
const predictions = MICTURITION_QUESTIONS.filter(
  (q): q is PredictQuestion<MicturitionInputs, MicturitionPresetName, Snapshot> =>
    !isPatternQuestion(q),
);

describe('micturition pattern questions', () => {
  describePatternSet(
    micturitionLoopConfig,
    DEFAULT_MICTURITION_INPUTS,
    MICTURITION_PRESETS,
    patterns,
  );
});
describe('micturition predict questions', () => {
  describeQuestionSet(
    micturitionLoopConfig,
    DEFAULT_MICTURITION_INPUTS,
    MICTURITION_PRESETS,
    predictions,
  );
});

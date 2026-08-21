import { describe } from 'vitest';
import { describeQuestionSet } from '@/shared/assessment/questionSuite';
import { respMechLoopConfig } from './engine/loopConfig';
import { DEFAULT_RESP_MECH_INPUTS, RESP_MECH_PRESETS } from './engine/presets';
import { RESP_MECH_QUESTIONS } from './questions';

describe('respiratoryMechanics practice questions', () => {
  describeQuestionSet(respMechLoopConfig, DEFAULT_RESP_MECH_INPUTS, RESP_MECH_PRESETS, RESP_MECH_QUESTIONS);
});

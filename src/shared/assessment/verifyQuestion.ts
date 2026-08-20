import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { DEFAULT_TOLERANCE, directionOf, type Direction, type PredictQuestion } from './types';

export interface QuestionRunResult {
  before: number;
  after: number;
  observed: Direction;
  matches: boolean;
}

/** Integrate `seconds` of simulated time in steps no larger than the engine's stability bound. */
function settle<TState, TInputs, TDerived, THistoryPoint>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  state: TState,
  inputs: TInputs,
  seconds: number,
): { state: TState; derived: TDerived } {
  let current = state;
  let snapshot = { state: current, derived: config.computeDerived(current, inputs) };
  let remaining = seconds;

  while (remaining > 0) {
    const dt = Math.min(remaining, config.maxDtSeconds);
    remaining -= dt;
    snapshot = config.step(current, inputs, dt);
    current = snapshot.state;
  }

  return snapshot;
}

/**
 * Runs a prediction question against the real engine and reports which way the watched
 * quantity actually moved.
 *
 * This exists so a question's keyed answer is never merely an author's belief about the
 * model. Each module's `questions.test.ts` asserts `matches`, so tuning a constant that
 * flips a direction breaks the test rather than silently teaching the wrong thing.
 */
export function runQuestion<TState, TInputs, TDerived, THistoryPoint, TPreset extends string>(
  config: EngineLoopConfig<TState, TInputs, TDerived, THistoryPoint>,
  defaultInputs: TInputs,
  presets: Record<TPreset, Partial<TInputs>>,
  question: PredictQuestion<TInputs, TPreset, { state: TState; derived: TDerived }>,
): QuestionRunResult {
  const setupInputs: TInputs = {
    ...defaultInputs,
    ...(question.setup.preset ? presets[question.setup.preset] : {}),
    ...question.setup.inputs,
  };

  const settled = settle(config, config.createInitialState(), setupInputs, question.settleSeconds ?? 600);
  const before = question.metric(settled);

  const afterInputs: TInputs = { ...setupInputs, ...question.intervention.inputs };
  const observed = settle(config, settled.state, afterInputs, question.observeSeconds ?? 600);
  const after = question.metric(observed);

  const direction = directionOf(before, after, question.tolerance ?? DEFAULT_TOLERANCE);

  return { before, after, observed: direction, matches: direction === question.correctDirection };
}

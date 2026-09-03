import type { PresentationContext } from './types';

/**
 * Assemble the live context a presentation builder reads from the engine loop's snapshot,
 * history and baseline — one call, so a page never has to remember which of the four it needs.
 */
export function getPresentationContext<State, Derived, Inputs, History>(
  snapshot: { state: State; derived: Derived },
  history: readonly History[],
  baseline: { history: readonly History[] | null },
  inputs: Inputs,
): PresentationContext<State, Derived, Inputs, History> {
  return { state: snapshot.state, derived: snapshot.derived, inputs, history, baselineHistory: baseline.history };
}
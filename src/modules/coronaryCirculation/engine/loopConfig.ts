import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { SIMULATION } from './constants';
import type {
  CoronaryDerived,
  CoronaryHistoryPoint,
  CoronaryInputs,
  CoronaryInternalState,
} from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const coronaryLoopConfig: EngineLoopConfig<
  CoronaryInternalState,
  CoronaryInputs,
  CoronaryDerived,
  CoronaryHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SIMULATION.HISTORY_CAPACITY,
  timeScale: SIMULATION.TIME_SCALE,
};

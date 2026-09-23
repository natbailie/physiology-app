import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HYPERSENSITIVITY_SIMULATION } from './constants';
import type {
  HypersensitivityDerived,
  HypersensitivityHistoryPoint,
  HypersensitivityInputs,
  HypersensitivityState,
} from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state. Every scenario here is a HOST, waiting for an event — nothing has happened
 * yet, so there is nothing to relax into.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const hypersensitivityLoopConfig: EngineLoopConfig<
  HypersensitivityState,
  HypersensitivityInputs,
  HypersensitivityDerived,
  HypersensitivityHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    hoursSinceChallenge: snapshot.state.hoursSinceChallenge,
    typeI: snapshot.derived.armActivity.I,
    typeII: snapshot.derived.armActivity.II,
    typeIII: snapshot.derived.armActivity.III,
    typeIV: snapshot.derived.armActivity.IV,
    tissueInjury: snapshot.derived.tissueInjury,
  }),
  maxDtSeconds: HYPERSENSITIVITY_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: HYPERSENSITIVITY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: HYPERSENSITIVITY_SIMULATION.HISTORY_CAPACITY,
  timeScale: HYPERSENSITIVITY_SIMULATION.TIME_SCALE,
};

import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HYPERSENSITIVITY_SIMULATION } from './constants';
import type {
  HypersensitivityDerived,
  HypersensitivityHistoryPoint,
  HypersensitivityInputs,
  HypersensitivityState,
} from './types';

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

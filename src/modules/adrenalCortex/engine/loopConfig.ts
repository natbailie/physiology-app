import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { ADRENAL_SIMULATION } from './constants';
import type {
  AdrenalCortexDerived,
  AdrenalCortexHistoryPoint,
  AdrenalCortexInputs,
  AdrenalCortexInternalState,
} from './types';

export const adrenalLoopConfig: EngineLoopConfig<
  AdrenalCortexInternalState,
  AdrenalCortexInputs,
  AdrenalCortexDerived,
  AdrenalCortexHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    cortisol: snapshot.derived.effectiveCortisol,
    androgens: snapshot.derived.androgens,
    mcActivity: snapshot.derived.mineralocorticoidActivity,
  }),
  maxDtSeconds: ADRENAL_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: ADRENAL_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ADRENAL_SIMULATION.HISTORY_CAPACITY,
  timeScale: ADRENAL_SIMULATION.TIME_SCALE,
};

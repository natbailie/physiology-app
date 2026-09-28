import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { UREA_CYCLE_SIMULATION } from './constants';
import type { UreaCycleDerived, UreaCycleHistoryPoint, UreaCycleInputs, UreaCycleInternalState } from './types';

export const ureaCycleLoopConfig: EngineLoopConfig<UreaCycleInternalState, UreaCycleInputs, UreaCycleDerived, UreaCycleHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    ammonia: snapshot.derived.ammoniaUmolL,
    urea: snapshot.derived.ureaMmolL,
  }),
  maxDtSeconds: UREA_CYCLE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: UREA_CYCLE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: UREA_CYCLE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: UREA_CYCLE_SIMULATION.HISTORY_CAPACITY,
  timeScale: UREA_CYCLE_SIMULATION.TIME_SCALE,
};

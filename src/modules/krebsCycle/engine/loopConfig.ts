import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { KREBS_CYCLE_SIMULATION } from './constants';
import type { KrebsCycleDerived, KrebsCycleHistoryPoint, KrebsCycleInputs, KrebsCycleInternalState } from './types';

export const krebsCycleLoopConfig: EngineLoopConfig<KrebsCycleInternalState, KrebsCycleInputs, KrebsCycleDerived, KrebsCycleHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    lactate: snapshot.derived.lactateMmolL,
    atp: snapshot.derived.atpYield,
    co2: snapshot.derived.co2mLPerMin,
  }),
  maxDtSeconds: KREBS_CYCLE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: KREBS_CYCLE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: KREBS_CYCLE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: KREBS_CYCLE_SIMULATION.HISTORY_CAPACITY,
  timeScale: KREBS_CYCLE_SIMULATION.TIME_SCALE,
};

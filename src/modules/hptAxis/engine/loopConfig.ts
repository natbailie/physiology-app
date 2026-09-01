import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HPT_SIMULATION } from './constants';
import type { HptDerived, HptHistoryPoint, HptInputs, HptState } from './types';

export const hptLoopConfig: EngineLoopConfig<HptState, HptInputs, HptDerived, HptHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    tsh: snapshot.derived.tshMilliUnitsPerL,
    t4: snapshot.derived.t4Level,
    t3: snapshot.derived.t3Level,
  }),
  maxDtSeconds: HPT_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: HPT_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: HPT_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: HPT_SIMULATION.HISTORY_CAPACITY,
  timeScale: HPT_SIMULATION.TIME_SCALE,
};

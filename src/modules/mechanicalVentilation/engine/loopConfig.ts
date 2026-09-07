import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { MV_SIMULATION } from './constants';
import type { MvDerived, MvHistoryPoint, MvInputs, MvState } from './types';

export const mvLoopConfig: EngineLoopConfig<MvState, MvInputs, MvDerived, MvHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pressure: snapshot.derived.airwayPressureCmH2O,
    tidalVolume: snapshot.derived.tidalVolumeML,
  }),
  maxDtSeconds: MV_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: MV_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: MV_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MV_SIMULATION.HISTORY_CAPACITY,
  timeScale: MV_SIMULATION.TIME_SCALE,
};
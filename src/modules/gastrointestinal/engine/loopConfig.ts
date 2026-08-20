import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { GI_SIMULATION } from './constants';
import type { GiDerived, GiHistoryPoint, GiInputs, GiState } from './types';

export const giLoopConfig: EngineLoopConfig<GiState, GiInputs, GiDerived, GiHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    gastricPH: snapshot.derived.gastricPH,
    duodenalPH: snapshot.derived.duodenalPH,
    gastrinDrive: snapshot.derived.gastrinDrive,
  }),
  maxDtSeconds: GI_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: GI_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: GI_SIMULATION.HISTORY_CAPACITY,
  timeScale: GI_SIMULATION.TIME_SCALE,
};

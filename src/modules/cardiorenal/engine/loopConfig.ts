import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { SIMULATION } from './constants';
import type { DerivedValues, HistoryPoint, SimInputs, SimState } from './types';

export const cardiorenalLoopConfig: EngineLoopConfig<SimState, SimInputs, DerivedValues, HistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    map: snapshot.derived.meanArterialPressure,
    gfr: snapshot.derived.gfr,
    bloodVolume: snapshot.state.bloodVolume,
  }),
  maxDtSeconds: SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SIMULATION.HISTORY_CAPACITY,
  timeScale: SIMULATION.TIME_SCALE,
};

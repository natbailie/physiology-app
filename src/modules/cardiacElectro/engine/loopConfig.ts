import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CARDIAC_SIMULATION } from './constants';
import type { CardiacDerived, CardiacHistoryPoint, CardiacInputs, CardiacState } from './types';

export const cardiacLoopConfig: EngineLoopConfig<CardiacState, CardiacInputs, CardiacDerived, CardiacHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    lvVolume: snapshot.derived.lvVolumeML,
    lvPressure: snapshot.derived.lvPressureMmHg,
    ecgVoltage: snapshot.derived.ecgVoltage,
  }),
  maxDtSeconds: CARDIAC_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: CARDIAC_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CARDIAC_SIMULATION.HISTORY_CAPACITY,
  timeScale: CARDIAC_SIMULATION.TIME_SCALE,
};

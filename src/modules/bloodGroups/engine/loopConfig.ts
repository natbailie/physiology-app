import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { BLOOD_SIMULATION } from './constants';
import type { BloodDerived, BloodHistoryPoint, BloodInputs, BloodInternalState } from './types';

export const bloodLoopConfig: EngineLoopConfig<
  BloodInternalState,
  BloodInputs,
  BloodDerived,
  BloodHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    severity: snapshot.state.haemolyticSeverity,
    freeHb: snapshot.derived.plasmaFreeHaemoglobin,
  }),
  maxDtSeconds: BLOOD_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: BLOOD_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: BLOOD_SIMULATION.HISTORY_CAPACITY,
  timeScale: BLOOD_SIMULATION.TIME_SCALE,
};

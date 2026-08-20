import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { GLUCOSE_SIMULATION } from './constants';
import type { GlucoseDerived, GlucoseHistoryPoint, GlucoseInputs, GlucoseState } from './types';

export const glucoseLoopConfig: EngineLoopConfig<GlucoseState, GlucoseInputs, GlucoseDerived, GlucoseHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    bloodGlucose: snapshot.derived.bloodGlucoseMgDl,
    insulin: snapshot.derived.insulinLevel,
    glucagon: snapshot.derived.glucagonLevel,
  }),
  maxDtSeconds: GLUCOSE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: GLUCOSE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: GLUCOSE_SIMULATION.HISTORY_CAPACITY,
  timeScale: GLUCOSE_SIMULATION.TIME_SCALE,
};

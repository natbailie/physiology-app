import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { MUSCLE_SIMULATION } from './constants';
import type { MuscleDerived, MuscleHistoryPoint, MuscleInputs, MuscleState } from './types';

export const muscleLoopConfig: EngineLoopConfig<MuscleState, MuscleInputs, MuscleDerived, MuscleHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    calcium: snapshot.derived.cytosolicCalciumUM,
    tension: snapshot.derived.totalTension,
    length: snapshot.derived.sarcomereLengthUm,
  }),
  maxDtSeconds: MUSCLE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: MUSCLE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: MUSCLE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MUSCLE_SIMULATION.HISTORY_CAPACITY,
  timeScale: MUSCLE_SIMULATION.TIME_SCALE,
};

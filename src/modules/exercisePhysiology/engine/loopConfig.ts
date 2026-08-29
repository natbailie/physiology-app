import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { EXERCISE_SIMULATION } from './constants';
import type {
  ExerciseDerived,
  ExerciseHistoryPoint,
  ExerciseInputs,
  ExerciseInternalState,
} from './types';

export const exerciseLoopConfig: EngineLoopConfig<
  ExerciseInternalState,
  ExerciseInputs,
  ExerciseDerived,
  ExerciseHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    hr: snapshot.derived.heartRateBpm,
    vo2: snapshot.derived.vo2MlMin / 10,
    lactate: snapshot.derived.lactateMmolL,
    fatigue: snapshot.state.fatiguePct,
  }),
  maxDtSeconds: EXERCISE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: EXERCISE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: EXERCISE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: EXERCISE_SIMULATION.HISTORY_CAPACITY,
  timeScale: EXERCISE_SIMULATION.TIME_SCALE,
};

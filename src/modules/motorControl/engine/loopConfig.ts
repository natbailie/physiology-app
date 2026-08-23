import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { MOTOR_SIMULATION } from './constants';
import type { MotorDerived, MotorHistoryPoint, MotorInputs, MotorInternalState } from './types';

export const motorLoopConfig: EngineLoopConfig<
  MotorInternalState,
  MotorInputs,
  MotorDerived,
  MotorHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    latency: snapshot.derived.initiationLatencyMs,
    restTremor: snapshot.derived.restingTremorAmp,
    involuntary: snapshot.derived.involuntaryMovementIndex,
  }),
  maxDtSeconds: MOTOR_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: MOTOR_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MOTOR_SIMULATION.HISTORY_CAPACITY,
  timeScale: MOTOR_SIMULATION.TIME_SCALE,
};

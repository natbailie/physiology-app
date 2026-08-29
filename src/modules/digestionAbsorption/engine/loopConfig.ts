import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { SIMULATION } from './constants';
import type {
  DigestionDerived,
  DigestionHistoryPoint,
  DigestionInputs,
  DigestionInternalState,
} from './types';

export const digestionLoopConfig: EngineLoopConfig<
  DigestionInternalState,
  DigestionInputs,
  DigestionDerived,
  DigestionHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SIMULATION.HISTORY_CAPACITY,
  timeScale: SIMULATION.TIME_SCALE,
};

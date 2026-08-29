import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { SIMULATION } from './constants';
import type {
  CoronaryDerived,
  CoronaryHistoryPoint,
  CoronaryInputs,
  CoronaryInternalState,
} from './types';

export const coronaryLoopConfig: EngineLoopConfig<
  CoronaryInternalState,
  CoronaryInputs,
  CoronaryDerived,
  CoronaryHistoryPoint
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

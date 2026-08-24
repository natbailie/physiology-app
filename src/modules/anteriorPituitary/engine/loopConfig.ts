import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { step } from './engine';
import { PITUITARY_SIMULATION } from './constants';
import type {
  PituitaryDerived,
  PituitaryHistoryPoint,
  PituitaryInputs,
  PituitaryInternalState,
} from './types';
import { createInitialState, computeDerivedFull } from './engine';

export const pituitaryLoopConfig: EngineLoopConfig<
  PituitaryInternalState,
  PituitaryInputs,
  PituitaryDerived,
  PituitaryHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived: computeDerivedFull,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    gh: snapshot.derived.ghNgMl,
    prolactin: snapshot.derived.prolactinNgMl,
    igf1: snapshot.derived.igf1NgMl / 10,
  }),
  maxDtSeconds: PITUITARY_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: PITUITARY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: PITUITARY_SIMULATION.HISTORY_CAPACITY,
  timeScale: PITUITARY_SIMULATION.TIME_SCALE,
};

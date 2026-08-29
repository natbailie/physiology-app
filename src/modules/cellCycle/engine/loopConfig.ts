import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CELL_CYCLE_SIMULATION } from './constants';
import type { CellCycleDerived, CellCycleHistoryPoint, CellCycleInputs, CellCycleInternalState } from './types';

export const cellCycleLoopConfig: EngineLoopConfig<CellCycleInternalState, CellCycleInputs, CellCycleDerived, CellCycleHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    cyclingRatePct: snapshot.derived.cyclingRatePct,
    lesionLoadPct: snapshot.derived.lesionLoadPct,
  }),
  maxDtSeconds: CELL_CYCLE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: CELL_CYCLE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CELL_CYCLE_SIMULATION.HISTORY_CAPACITY,
  timeScale: CELL_CYCLE_SIMULATION.TIME_SCALE,
};

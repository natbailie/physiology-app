import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CELL_CYCLE_SIMULATION } from './constants';
import type { CellCycleDerived, CellCycleHistoryPoint, CellCycleInputs, CellCycleInternalState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state. The progression this module is about is carried by a phase key, which the
 * opening check excludes the way the drift check excludes a clock position.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
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

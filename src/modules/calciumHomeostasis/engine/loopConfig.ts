import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CALCIUM_SIMULATION } from './constants';
import type { CalciumDerived, CalciumHistoryPoint, CalciumInputs, CalciumState } from './types';

export const calciumLoopConfig: EngineLoopConfig<CalciumState, CalciumInputs, CalciumDerived, CalciumHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    calcium: snapshot.derived.serumCalciumMgDl,
    phosphate: snapshot.derived.serumPhosphateMgDl,
    pth: snapshot.derived.pthLevel,
  }),
  maxDtSeconds: CALCIUM_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: CALCIUM_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: CALCIUM_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CALCIUM_SIMULATION.HISTORY_CAPACITY,
  timeScale: CALCIUM_SIMULATION.TIME_SCALE,
};

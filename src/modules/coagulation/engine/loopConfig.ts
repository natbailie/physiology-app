import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { COAG_SIMULATION } from './constants';
import type { CoagDerived, CoagHistoryPoint, CoagInputs, CoagState } from './types';

export const coagLoopConfig: EngineLoopConfig<CoagState, CoagInputs, CoagDerived, CoagHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    thrombin: snapshot.derived.thrombin,
    fibrin: snapshot.derived.fibrin,
    plateletPlug: snapshot.derived.plateletPlug,
  }),
  maxDtSeconds: COAG_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: COAG_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: COAG_SIMULATION.HISTORY_CAPACITY,
  timeScale: COAG_SIMULATION.TIME_SCALE,
};

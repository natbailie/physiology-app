import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { NMJ_SIMULATION } from './constants';
import type { NmjDerived, NmjHistoryPoint, NmjInputs, NmjState } from './types';

export const nmjLoopConfig: EngineLoopConfig<NmjState, NmjInputs, NmjDerived, NmjHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    epp: snapshot.derived.endPlatePotentialMv,
    safetyFactor: snapshot.derived.safetyFactor,
    force: snapshot.derived.muscleForcePercent,
    tofRatio: snapshot.derived.trainOfFourRatio * 100,
  }),
  maxDtSeconds: NMJ_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: NMJ_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: NMJ_SIMULATION.HISTORY_CAPACITY,
  timeScale: NMJ_SIMULATION.TIME_SCALE,
};

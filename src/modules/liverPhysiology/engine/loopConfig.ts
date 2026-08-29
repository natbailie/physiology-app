import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { LIVER_SIMULATION } from './constants';
import type { LiverDerived, LiverHistoryPoint, LiverInputs, LiverInternalState } from './types';

export const liverLoopConfig: EngineLoopConfig<
  LiverInternalState,
  LiverInputs,
  LiverDerived,
  LiverHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    total: snapshot.derived.totalBilirubinUmolL,
    unconjugated: snapshot.state.unconjugatedUmolL,
    conjugated: snapshot.state.conjugatedUmolL,
    ammonia: snapshot.derived.ammoniaUmolL,
  }),
  maxDtSeconds: LIVER_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: LIVER_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: LIVER_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: LIVER_SIMULATION.HISTORY_CAPACITY,
  timeScale: LIVER_SIMULATION.TIME_SCALE,
};

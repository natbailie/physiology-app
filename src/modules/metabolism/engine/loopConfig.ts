import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { METABOLISM_SIMULATION } from './constants';
import type { MetabolismDerived, MetabolismHistoryPoint, MetabolismInputs, MetabolismInternalState } from './types';

export const metabolismLoopConfig: EngineLoopConfig<MetabolismInternalState, MetabolismInputs, MetabolismDerived, MetabolismHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    bg: snapshot.derived.bgmmolPerL,
    ketones: snapshot.derived.ketonesMmolPerL,
    energy: snapshot.derived.energyKcalPerDay,
  }),
  maxDtSeconds: METABOLISM_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: METABOLISM_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: METABOLISM_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: METABOLISM_SIMULATION.HISTORY_CAPACITY,
  timeScale: METABOLISM_SIMULATION.TIME_SCALE,
};
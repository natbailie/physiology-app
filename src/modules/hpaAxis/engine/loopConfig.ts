import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HPA_SIMULATION } from './constants';
import type { HpaDerived, HpaHistoryPoint, HpaInputs, HpaState } from './types';

export const hpaLoopConfig: EngineLoopConfig<HpaState, HpaInputs, HpaDerived, HpaHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    cortisol: snapshot.derived.cortisolLevel,
    acth: snapshot.derived.acthLevel,
    adrenalReserve: snapshot.derived.adrenalReserve,
  }),
  maxDtSeconds: HPA_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: HPA_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: HPA_SIMULATION.HISTORY_CAPACITY,
  timeScale: HPA_SIMULATION.TIME_SCALE,
};

import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { SOMATIC_SIMULATION } from './constants';
import type {
  SomaticDerived,
  SomaticHistoryPoint,
  SomaticInputs,
  SomaticInternalState,
} from './types';

export const somaticLoopConfig: EngineLoopConfig<
  SomaticInternalState,
  SomaticInputs,
  SomaticDerived,
  SomaticHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pain: snapshot.state.painRating,
    sensitisation: snapshot.derived.sensitisationCeiling * snapshot.state.sensitisationAccumulated * 100,
    gate: snapshot.derived.gateOpenFraction * 100,
  }),
  maxDtSeconds: SOMATIC_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SOMATIC_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SOMATIC_SIMULATION.HISTORY_CAPACITY,
  timeScale: SOMATIC_SIMULATION.TIME_SCALE,
};

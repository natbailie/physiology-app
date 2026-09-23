import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { SOMATIC_SIMULATION } from './constants';
import type {
  SomaticDerived,
  SomaticHistoryPoint,
  SomaticInputs,
  SomaticInternalState,
} from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
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

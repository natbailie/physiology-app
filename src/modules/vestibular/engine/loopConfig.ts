import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { VESTIBULAR_SIMULATION } from './constants';
import type {
  VestibularDerived,
  VestibularHistoryPoint,
  VestibularInputs,
  VestibularInternalState,
} from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const vestibularLoopConfig: EngineLoopConfig<
  VestibularInternalState,
  VestibularInputs,
  VestibularDerived,
  VestibularHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    spv: snapshot.derived.slowPhaseVelocityDegPerSec,
    vertigo: snapshot.derived.vertigoIntensityPct,
    cupula: snapshot.derived.cupulaDeflection * 100,
  }),
  maxDtSeconds: VESTIBULAR_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: VESTIBULAR_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: VESTIBULAR_SIMULATION.HISTORY_CAPACITY,
  timeScale: VESTIBULAR_SIMULATION.TIME_SCALE,
};

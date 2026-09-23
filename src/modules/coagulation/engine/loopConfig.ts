import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { COAG_SIMULATION } from './constants';
import type { CoagDerived, CoagHistoryPoint, CoagInputs, CoagState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
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

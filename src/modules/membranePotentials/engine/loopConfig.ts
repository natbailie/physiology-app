import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { MEMBRANE_SIMULATION } from './constants';
import type { MembraneDerived, MembraneHistoryPoint, MembraneInputs, MembraneState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const membraneLoopConfig: EngineLoopConfig<MembraneState, MembraneInputs, MembraneDerived, MembraneHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    vm: snapshot.derived.vmMillivolts,
    gNa: snapshot.derived.gNa,
    gK: snapshot.derived.gK,
  }),
  maxDtSeconds: MEMBRANE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: MEMBRANE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MEMBRANE_SIMULATION.HISTORY_CAPACITY,
  timeScale: MEMBRANE_SIMULATION.TIME_SCALE,
};

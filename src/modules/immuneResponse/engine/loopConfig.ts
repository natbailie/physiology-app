import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { IMMUNE_SIMULATION } from './constants';
import type { ImmuneDerived, ImmuneHistoryPoint, ImmuneInputs, ImmuneState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state. Every scenario here is a HOST, waiting for an event — nothing has happened
 * yet, so there is nothing to relax into.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const immuneLoopConfig: EngineLoopConfig<ImmuneState, ImmuneInputs, ImmuneDerived, ImmuneHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pathogenLoad: snapshot.derived.pathogenLoad,
    iggTitre: snapshot.derived.iggTitre,
    memoryLevel: snapshot.derived.memoryLevel,
  }),
  maxDtSeconds: IMMUNE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: IMMUNE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: IMMUNE_SIMULATION.HISTORY_CAPACITY,
  timeScale: IMMUNE_SIMULATION.TIME_SCALE,
};

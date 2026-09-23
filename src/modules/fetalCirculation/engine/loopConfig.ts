import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { FETAL_SIMULATION } from './constants';
import type { FetalDerived, FetalHistoryPoint, FetalInputs, FetalState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const fetalLoopConfig: EngineLoopConfig<FetalState, FetalInputs, FetalDerived, FetalHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pvr: snapshot.derived.pulmonaryVascularResistance,
    preDuctal: snapshot.derived.preDuctalSaturationPercent,
    postDuctal: snapshot.derived.postDuctalSaturationPercent,
    ductus: snapshot.derived.ductusArteriosusPatency * 100,
    pulmonaryFlow: snapshot.derived.pulmonaryFlowFraction * 100,
  }),
  maxDtSeconds: FETAL_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: FETAL_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: FETAL_SIMULATION.HISTORY_CAPACITY,
  timeScale: FETAL_SIMULATION.TIME_SCALE,
};

import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { FETAL_SIMULATION } from './constants';
import type { FetalDerived, FetalHistoryPoint, FetalInputs, FetalState } from './types';

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

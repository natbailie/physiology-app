import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { BASELINE, ELECTROLYTE_SIMULATION } from './constants';
import type { ElectrolyteDerived, ElectrolyteHistoryPoint, ElectrolyteInputs, ElectrolyteState } from './types';

export const electrolyteLoopConfig: EngineLoopConfig<
  ElectrolyteState,
  ElectrolyteInputs,
  ElectrolyteDerived,
  ElectrolyteHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    sodium: snapshot.derived.serumSodiumMeqL,
    potassium: snapshot.derived.serumPotassiumMeqL,
    // Scaled onto the serum potassium axis so the two can be plotted together: when they
    // diverge, the serum level is lying about the deficit.
    totalBodyPotassiumPct:
      (snapshot.derived.totalBodyPotassiumMeq / BASELINE.EXCHANGEABLE_POTASSIUM_MEQ) * BASELINE.SERUM_POTASSIUM_MEQ_L,
    ecfVolume: snapshot.derived.ecfVolumeL,
  }),
  maxDtSeconds: ELECTROLYTE_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: ELECTROLYTE_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: ELECTROLYTE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ELECTROLYTE_SIMULATION.HISTORY_CAPACITY,
  timeScale: ELECTROLYTE_SIMULATION.TIME_SCALE,
};

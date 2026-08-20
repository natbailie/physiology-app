import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HPG_SIMULATION } from './constants';
import type { HpgDerived, HpgHistoryPoint, HpgInputs, HpgState } from './types';

export const hpgLoopConfig: EngineLoopConfig<HpgState, HpgInputs, HpgDerived, HpgHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    lh: snapshot.derived.lhLevel,
    fsh: snapshot.derived.fshLevel,
    gonadalSteroid: snapshot.derived.sex === 'male' ? snapshot.derived.testosteroneLevel : snapshot.derived.estrogenLevel,
  }),
  maxDtSeconds: HPG_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: HPG_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: HPG_SIMULATION.HISTORY_CAPACITY,
  timeScale: HPG_SIMULATION.TIME_SCALE,
};

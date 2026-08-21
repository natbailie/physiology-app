import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CEREBRAL_SIMULATION } from './constants';
import type { CerebralDerived, CerebralHistoryPoint, CerebralInputs, CerebralInternalState } from './types';

export const cerebralLoopConfig: EngineLoopConfig<
  CerebralInternalState,
  CerebralInputs,
  CerebralDerived,
  CerebralHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    icp: snapshot.derived.intracranialPressureMmHg,
    cpp: snapshot.derived.cerebralPerfusionPressureMmHg,
    cbf: snapshot.derived.cerebralBloodFlow,
    cbv: snapshot.derived.cerebralBloodVolumeMl,
  }),
  maxDtSeconds: CEREBRAL_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: CEREBRAL_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CEREBRAL_SIMULATION.HISTORY_CAPACITY,
  timeScale: CEREBRAL_SIMULATION.TIME_SCALE,
};

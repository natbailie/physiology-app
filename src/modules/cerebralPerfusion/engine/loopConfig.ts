import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CEREBRAL_SIMULATION } from './constants';
import type { CerebralDerived, CerebralHistoryPoint, CerebralInputs, CerebralInternalState } from './types';

/**
 * No `settleSeconds`, because the baseline here is a TRAJECTORY rather than a resting state:
 * CSF accumulates. Settling would jump straight past the thing the module exists to show.
 *
 * Named in `OPENS_ON_A_TRAJECTORY` in `controls.test.tsx`, which is where that claim is recorded
 * now — the absence of a constant used to be the only thing asserting it, and an uncalibrated
 * module looked exactly the same.
 */
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

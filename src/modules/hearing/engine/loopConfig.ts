import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HEARING_SIMULATION } from './constants';
import type { HearingDerived, HearingHistoryPoint, HearingInputs, HearingInternalState } from './types';

/**
 * No `settleSeconds`, and that is now a checked claim rather than an omission: this engine's
 * `createInitialState()` IS its resting state.
 *
 * `controls.test.tsx` measures the opening window — the simulated time the chart shows — against
 * the band the module goes on to occupy, and fails if anything it opens on is a value it does not
 * hold. So a settle that was never calibrated can no longer hide as a settle that is not needed.
 */
export const hearingLoopConfig: EngineLoopConfig<
  HearingInternalState,
  HearingInputs,
  HearingDerived,
  HearingHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    pta: snapshot.derived.ptaDb,
    loudness: snapshot.derived.loudnessPct,
    tts: snapshot.state.temporaryThresholdShiftDb,
  }),
  maxDtSeconds: HEARING_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: HEARING_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: HEARING_SIMULATION.HISTORY_CAPACITY,
  timeScale: HEARING_SIMULATION.TIME_SCALE,
};

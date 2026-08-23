import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { HEARING_SIMULATION } from './constants';
import type { HearingDerived, HearingHistoryPoint, HearingInputs, HearingInternalState } from './types';

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

import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { SIMULATION } from './constants';
import type {
  MicturitionDerived,
  MicturitionHistoryPoint,
  MicturitionInputs,
  MicturitionInternalState,
} from './types';

/**
 * No `settleSeconds`, because the baseline here is a TRAJECTORY rather than a resting state:
 * a bladder fills. Settling would jump straight past the thing the module exists to show.
 *
 * Named in `OPENS_ON_A_TRAJECTORY` in `controls.test.tsx`, which is where that claim is recorded
 * now — the absence of a constant used to be the only thing asserting it, and an uncalibrated
 * module looked exactly the same.
 */
export const micturitionLoopConfig: EngineLoopConfig<
  MicturitionInternalState,
  MicturitionInputs,
  MicturitionDerived,
  MicturitionHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: SIMULATION.HISTORY_CAPACITY,
  timeScale: SIMULATION.TIME_SCALE,
};

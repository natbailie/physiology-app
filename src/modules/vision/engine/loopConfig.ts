import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { VISION_SIMULATION } from './constants';
import type {
  VisionDerived,
  VisionHistoryPoint,
  VisionInputs,
  VisionInternalState,
} from './types';

export const visionLoopConfig: EngineLoopConfig<
  VisionInternalState,
  VisionInputs,
  VisionDerived,
  VisionHistoryPoint
> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    brightness: snapshot.derived.perceivedBrightness,
    pupilR: snapshot.state.pupilRightMm,
    pupilL: snapshot.state.pupilLeftMm,
    bleached: snapshot.state.bleachedFraction * 100,
    iop: snapshot.derived.intraocularPressureMmHg,
  }),
  maxDtSeconds: VISION_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: VISION_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: VISION_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: VISION_SIMULATION.HISTORY_CAPACITY,
  timeScale: VISION_SIMULATION.TIME_SCALE,
};

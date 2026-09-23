import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { COGNITION_SIMULATION } from './constants';
import type { CognitionDerived, CognitionHistoryPoint, CognitionInputs, CognitionInternalState } from './types';

/**
 * An input-pure engine: the flick-streams a constant readout of the inputs rather than relaxing
 * toward them. The loop config has no settleSeconds so the page opens on a transient — that is
 * deliberate, because the whole module is a "watch what happens when you change this" instrument.
 */
export const cognitiveNeuroscienceLoopConfig: EngineLoopConfig<CognitionInternalState, CognitionInputs, CognitionDerived, CognitionHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: COGNITION_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: COGNITION_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: COGNITION_SIMULATION.HISTORY_CAPACITY,
  timeScale: COGNITION_SIMULATION.TIME_SCALE,
};
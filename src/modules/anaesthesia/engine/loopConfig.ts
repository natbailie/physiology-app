import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step, toHistoryPoint } from './engine';
import { ANAESTHESIA_SIMULATION } from './constants';
import type {
  AnaesthesiaDerived,
  AnaesthesiaHistoryPoint,
  AnaesthesiaInputs,
  AnaesthesiaInternalState,
} from './types';

export const anaesthesiaLoopConfig: EngineLoopConfig<AnaesthesiaInternalState, AnaesthesiaInputs, AnaesthesiaDerived, AnaesthesiaHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint,
  maxDtSeconds: ANAESTHESIA_SIMULATION.MAX_DT_SECONDS,
  settleSeconds: ANAESTHESIA_SIMULATION.SETTLE_SECONDS,
  renderIntervalMs: ANAESTHESIA_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: ANAESTHESIA_SIMULATION.HISTORY_CAPACITY,
  timeScale: ANAESTHESIA_SIMULATION.TIME_SCALE,
};
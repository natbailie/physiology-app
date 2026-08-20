import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { MEMBRANE_SIMULATION } from './constants';
import type { MembraneDerived, MembraneHistoryPoint, MembraneInputs, MembraneState } from './types';

export const membraneLoopConfig: EngineLoopConfig<MembraneState, MembraneInputs, MembraneDerived, MembraneHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    vm: snapshot.derived.vmMillivolts,
    gNa: snapshot.derived.gNa,
    gK: snapshot.derived.gK,
  }),
  maxDtSeconds: MEMBRANE_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: MEMBRANE_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: MEMBRANE_SIMULATION.HISTORY_CAPACITY,
  timeScale: MEMBRANE_SIMULATION.TIME_SCALE,
};

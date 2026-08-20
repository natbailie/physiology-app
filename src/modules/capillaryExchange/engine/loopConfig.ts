import type { EngineLoopConfig } from '@/shared/hooks/useEngineLoop';
import { computeDerived, createInitialState, step } from './engine';
import { CAPILLARY_SIMULATION } from './constants';
import type { CapillaryDerived, CapillaryHistoryPoint, CapillaryInputs, CapillaryState } from './types';

export const capillaryLoopConfig: EngineLoopConfig<CapillaryState, CapillaryInputs, CapillaryDerived, CapillaryHistoryPoint> = {
  createInitialState,
  step,
  computeDerived,
  toHistoryPoint: (snapshot) => ({
    t: snapshot.state.simTimeSeconds,
    // Plotted as a percentage of normal so the trace means the same thing in every bed.
    interstitialVolume: snapshot.state.interstitialVolumeFraction * 100,
    filtrationRate: snapshot.derived.filtrationRateMlPerMin,
    lymphFlow: snapshot.derived.lymphFlowMlPerMin,
    capillaryPressure: snapshot.derived.capillaryPressureMmHg,
  }),
  maxDtSeconds: CAPILLARY_SIMULATION.MAX_DT_SECONDS,
  renderIntervalMs: CAPILLARY_SIMULATION.RENDER_INTERVAL_MS,
  historyCapacity: CAPILLARY_SIMULATION.HISTORY_CAPACITY,
  timeScale: CAPILLARY_SIMULATION.TIME_SCALE,
};

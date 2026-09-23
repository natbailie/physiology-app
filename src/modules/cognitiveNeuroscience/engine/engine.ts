import { COGNITION } from './constants';
import { clamp } from '@/shared/lib/math';
import type {
  CognitionDerived,
  CognitionHistoryPoint,
  CognitionInputs,
  CognitionInternalState,
  CognitionSnapshot,
} from './types';

/** The classic rubric: performance peaks at the task's own optimum arousal, and falls off either side. */
function arousalPerformanceOf(arousal: number, optimal: number): number {
  return clamp(100 * Math.exp(-Math.pow((arousal - optimal) / COGNITION.AROUSAL_CURVE_WIDTH, 2)), 0, 100);
}

/** How close the learner's arousal sits to the optimum their task actually wants. */
function arousalOptimalityOf(arousal: number, optimal: number): number {
  return clamp(1 - Math.abs(arousal - optimal) / COGNITION.OPTIMALITY_SPAN, 0, 1);
}

/** The fatigue-eroded share of the executive reserve that effort can actually draw. */
function reserveFactorOf(fatiguePct: number): number {
  return clamp(1 - COGNITION.RESERVE_FATIGUE_COST * fatiguePct, 0.02, 1);
}

/** How full the 7±2 working-memory ceiling is underneath the friction of distraction and fatigue. */
function memoryOccupancyOf(inputs: CognitionInputs): number {
  const load = COGNITION.CHUNK_OCCUPANCY * inputs.memoryLoad;
  const friction =
    COGNITION.DISTRACTION_COST * (inputs.distractionLevelPct / 100) +
    COGNITION.FATIGUE_COST * (inputs.fatiguePct / 100);
  return clamp(load * 100 + friction * 100 * load, 5, 100);
}

function stateOf(d: CognitionDerived): string {
  const { arousalOptimality, effortActivePct, demandOvershootPct } = d;
  if (demandOvershootPct > 25) return 'Overwhelmed — slips & near-misses';
  if (arousalOptimality < 0.55 && d.baselineArousalPct > d.optimalArousal) return 'Over-aroused — choking on the task';
  if (arousalOptimality < 0.55) return 'Under-aroused — losing the thread';
  if (effortActivePct < 30) return 'Disengaged — no effort to spare';
  return 'In the zone — near-peak performance';
}

export function createInitialState(): CognitionInternalState {
  return { simTimeSeconds: 0, effortActivePct: 0, exploredSpacePct: 0 };
}

export function computeDerived(_state: CognitionInternalState, inputs: CognitionInputs): CognitionDerived {
  const { memoryLoad, distractionLevelPct, fatiguePct, cognitiveDemandPct, baselineArousalPct, executiveReservePct } = inputs;

  // The task the learner is facing lowers the arousal their best performance wants.
  const optimalArousal = clamp(
    COGNITION.AROUSAL_OPTIMUM_BASE - COGNITION.OPTIMAL_DIFFICULTY_SLOPE * cognitiveDemandPct,
    COGNITION.OPTIMAL_AROUSAL_MIN,
    COGNITION.AROUSAL_OPTIMUM_BASE,
  );
  const arousalPerformancePct = arousalPerformanceOf(baselineArousalPct, optimalArousal);
  const arousalOptimality = arousalOptimalityOf(baselineArousalPct, optimalArousal);

  // Effort drawn from a fatigue-eroded reserve, only fully available at the task's arousal optimum.
  const reserveFactor = reserveFactorOf(fatiguePct);
  const effortActivePct = clamp(
    (executiveReservePct + (100 - executiveReservePct) * arousalOptimality) * reserveFactor,
    3,
    100,
  );
  const memoryOccupancyPct = memoryOccupancyOf(inputs);

  // The reserve account: what demand exceeds what the learner can actually cover right now.
  const coverableDemand = COGNITION.OVERSHOOT_BASE + COGNITION.OVERSHOOT_RESERVE_GAIN * executiveReservePct * reserveFactor + COGNITION.OVERSHOOT_OPTIMALITY_GAIN * arousalOptimality;
  const demandOvershootPct = clamp(cognitiveDemandPct - coverableDemand, 0, 100);
  const reserveDrawnPct = clamp(60 * arousalOptimality + 30 * (cognitiveDemandPct / 100), 0, 100);

  // Performance is the arousal curve times the effort actually mounted, the working-memory headroom
  // available, and a cliff once demand overshoots the coverable ceiling.
  const overloadFactor = Math.exp(-COGNITION.OVERLOAD_PENALTY * demandOvershootPct);
  const memoryHeadroom = clamp(1.35 - 0.55 * (memoryOccupancyPct / 100), 0.35, 1.2);
  const performancePct = clamp(
    arousalPerformancePct * (effortActivePct / 100) * COGNITION.PERF_EFFORT_GAIN * memoryHeadroom * overloadFactor,
    COGNITION.PERFORMANCE_FLOOR,
    100,
  );

  const derived: CognitionDerived = {
    memoryLoad,
    distractionLevelPct,
    fatiguePct,
    cognitiveDemandPct,
    baselineArousalPct,
    executiveReservePct,
    effortActivePct,
    memoryOccupancyPct,
    performancePct,
    arousalOptimality,
    reserveDrawnPct,
    demandOvershootPct,
    optimalArousal,
    state: '',
  };
  derived.state = stateOf(derived);
  return derived;
}

export function step(state: CognitionInternalState, inputs: CognitionInputs, dtSeconds: number): CognitionSnapshot {
  // The model is input-pure: there is no internal dynamics, so the flick streams a constant readout
  // of the inputs rather than relaxing toward them. `simTimeSeconds` still advances so the charts
  // have a time axis, and the derived numbers are recomputed every tick from the inputs.
  const derived = computeDerived(state, inputs);
  return { state: { ...state, simTimeSeconds: state.simTimeSeconds + dtSeconds }, derived };
}

export function toHistoryPoint({
  state,
  derived,
}: {
  state: CognitionInternalState;
  derived: CognitionDerived;
}): CognitionHistoryPoint {
  return {
    t: state.simTimeSeconds,
    performance: derived.performancePct,
    effort: derived.effortActivePct,
    memory: derived.memoryOccupancyPct,
  };
}
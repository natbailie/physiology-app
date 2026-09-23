export interface CognitionInputs {
  /** The learner's current working-memory load — how many chunks are being held, 1-7. */
  memoryLoad: number;
  /** How distractible the presented environment is, 0-100%. */
  distractionLevelPct: number;
  /** Fatigue on a 0-100 scale, built up by sustained concentration. */
  fatiguePct: number;
  /** The amount of task-relevant information the learner must hold and transform, 0-100. */
  cognitiveDemandPct: number;
  /** Chronic arousal / anxiety background, 0-100%. Low Yerkes-Dodson range; high tips over. */
  baselineArousalPct: number;
  /** Baseline capability floor for a dormant dopamine-driven executive network, 0-20%. */
  executiveReservePct: number;
}

export interface CognitionInternalState {
  /** Simulated time, seconds — the clock of the flick-session. */
  simTimeSeconds: number;
  /** How much executive control is actually being deployed right now, 0-100%. */
  effortActivePct: number;
  /** The explored region `U` of the problem/task space, 0-100%. */
  exploredSpacePct: number;
}

export interface CognitionDerived {
  memoryLoad: number;
  distractionLevelPct: number;
  fatiguePct: number;
  cognitiveDemandPct: number;
  baselineArousalPct: number;
  executiveReservePct: number;
  effortActivePct: number;
  /** Working-memory occupancy: hard capacity 7, degraded by distractibility and fatigue. 0-100%. */
  memoryOccupancyPct: number;
  /** Estimated performance read off arousal and difficulty: near-peak in the middle, poor at both ends. */
  performancePct: number;
  /** The arousal this task's own difficulty wants the learner at, 0-100. */
  optimalArousal: number;
  /** Near-miss / performance-plateau spacing heuristic: closeness to the optimum, 0-1. */
  arousalOptimality: number;
  /** Reserve-spared versus reserve-drawn measure: how much executive effort remains once sleepiness caps it. */
  reserveDrawnPct: number;
  /** The regression-threshold gap: how far the current difficulty overshoots the reserve. 0-100. */
  demandOvershootPct: number;
  /** Which region of the arousal-difficulty plane the learner is sitting in. */
  state: string;
}

export interface CognitionSnapshot {
  state: CognitionInternalState;
  derived: CognitionDerived;
}

export interface CognitionHistoryPoint {
  t: number;
  performance: number;
  effort: number;
  memory: number;
}
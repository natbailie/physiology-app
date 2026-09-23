/**
 * A cognitive-neuroscience model: why performance is a compromise between arousal, working-memory
 * load, distractibility, fatigue and the executive reserve available to cover the gap.
 *
 * Three streams feed the picture:
 *
 * - YERKES-DODSON / HEBB: performance against a task climbs with arousal toward a mid-range peak
 *   and falls as arousal keeps rising. Crucially, the task's OWN difficulty shifts where that peak
 *   sits — a hard task wants LESS arousal, which is how a panic attack and a nap can both wreck an
 *   exam. This is the inverted-U the module is really about.
 * - THE EXECUTIVE RESERVE ACCOUNT: effort is drawn from a finite reserve, eroded by fatigue, and
 *   only fully available when arousal sits near the task's optimum. A learner low on sleep cannot
 *   mount effort even when the demand is modest.
 * - THE 7±2 WORKING-MEMORY CEILING: what the learner is trying to hold occupies that ceiling, and
 *   distraction and fatigue spend headroom that could have gone to the task. When demand exceeds
 *   what the reserve can cover, performance collapses through a cliff rather than gliding.
 */
export const COGNITION = {
  /** Hard limit on chunks simultaneously held, the classic 7±2 — Miller, 1956. */
  WORKING_MEMORY_CHUNKS: 7,
  /** How much of the working-memory ceiling a single held chunk occupies, as a share. */
  CHUNK_OCCUPANCY: 0.12,
  /** What a full-on distraction steals from available working memory, as a share of the ceiling. */
  DISTRACTION_COST: 0.25,
  /** How fatigue degrades the memory ceiling, per 100 units of fatigue. */
  FATIGUE_COST: 0.035,
  /** The arousal at which performance peaks for an EASY task, on the 0-100 input axis. */
  AROUSAL_OPTIMUM_BASE: 45,
  /** How much a hard task LOWERS the arousal optimum — Yerkes-Dodson for complex tasks. */
  OPTIMAL_DIFFICULTY_SLOPE: 0.35,
  /** Floor for the task-specific arousal optimum; even the hardest task keeps a low optimum. */
  OPTIMAL_AROUSAL_MIN: 12,
  /** Width of the arousal-performance curve: how sharply performance falls either side of the peak. */
  AROUSAL_CURVE_WIDTH: 32,
  /** How far a mis-placed arousal can wander before optimality reads as lost, for the 0-1 index. */
  OPTIMALITY_SPAN: 55,
  /** Fatigue cost: how much of the executive reserve a unit of fatigue withdraws. */
  RESERVE_FATIGUE_COST: 0.012,
  /** Base capacity the learner can cover before a task even demands anything, 0-100 scale. */
  OVERSHOOT_BASE: 55,
  /** How much reserve (after fatigue) lifts the coverable demand. */
  OVERSHOOT_RESERVE_GAIN: 0.55,
  /** How much being near the arousal optimum adds to coverable demand. */
  OVERSHOOT_OPTIMALITY_GAIN: 20,
  /** Slope of the collapse once demand overshoots the coverable ceiling. */
  OVERLOAD_PENALTY: 0.012,
  /** How much each percent of deployed effort buys, so the reserve account actually pays. */
  PERF_EFFORT_GAIN: 1.6,
  /** Minimum performance ever returned, so exhaustion reads as a floor and not a division error. */
  PERFORMANCE_FLOOR: 10,
} as const;

export const COGNITION_SIMULATION = {
  MAX_DT_SECONDS: 1,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  TIME_SCALE: 1,
} as const;
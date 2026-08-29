/** Textbook phase durations for a fast-cycling human cell (e.g. gut epithelium): a roughly
 * 24-hour cycle dominated by G1, with mitosis the briefest act by far — which is why
 * "mitotic arrest" is such a dramatic, visible phenotype when poisons cause it. */

export const PHASE = {
  G1_H: 11,
  S_H: 8,
  G2_H: 4,
  M_H: 1,
} as const;

export const CHECKPOINT = {
  /** Lesion load above which an intact p53 halts progression at G1/S and G2/M. */
  DAMAGE_ARREST_THRESHOLD: 0.35,
  /** Lesion load above which p53 commits the cell to apoptosis instead of repair. */
  APOPTOSIS_THRESHOLD: 0.7,
  /** Time constant (hours) for p53-mediated repair pulling lesion load toward its target. */
  REPAIR_TAU_H: 16,
  /** Apoptosis approach rate per hour once committed. */
  APOPTOSIS_RATE_PER_HOUR: 0.04,
  /** Growth drive below which an RB-intact cell exits the cycle into G0. */
  QUIESCENCE_DRIVE: 0.12,
  /** Mitogenic signal that saturates the cyclin D response. */
  DRIVE_SATURATION: 0.9,
} as const;

export const CELL_CYCLE_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** One real second = one simulated hour: a full cycle plays in about half a minute. */
  TIME_SCALE: 3600,
} as const;

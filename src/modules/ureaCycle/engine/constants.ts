/**
 * Calibrated so the module's baseline (a healthy adult eating ~70 g protein, drinking ~2 L,
 * with an intact liver) lands on the textbook picture: ammonia in the mid-twenties, urea near
 * 5 mmol/L, BUN in the low teens, and nitrogen excretion roughly matching intake.
 *
 * Ammonia is defended while capacity covers the load and climbs steeply once it does not, so
 * liver failure and OTC deficiency both reach encephalopathic grades while reading opposite
 * orotic signatures. Urea rises with load at full capacity and falls when the cycle itself
 * fails — the paradox the module exists to teach.
 */

export const UREA_CYCLE = {
  /** Nitrogen mass fraction of protein (~16%). Converts dinner into ammonia load. */
  NITROGEN_PER_PROTEIN: 1 / 6.25,
  /** Endogenous protein broken down at full catabolic stress, g/day of protein equivalent —
   * a major GI bleed or severe trauma digests a steak's worth of the patient. */
  STRESS_PROTEIN_G_PER_DAY: 75,
  /** Plasma ammonia when load and capacity are matched, umol/L. */
  AMMONIA_BASE_UMOL_L: 16,
  /** Extra ammonia per unit of normalised load even when the cycle copes. */
  AMMONIA_PER_LOAD_UMOL_L: 10,
  /** Ammonia released when capacity falls short: quadratic, because a half-capable cycle
   * hyperammonaemia is worse than twice a nearly-capable one. */
  AMMONIA_PER_DEFICIT_UMOL_L: 240,
  /** Urea made per gram of cleared nitrogen per day, mmol/L — set so baseline lands mid-band. */
  UREA_PER_CLEARED_N: 0.45,
  /** Renal concentration baseline: urea reads against hydration, not just production. */
  UREA_HYDRATION_BASE: 0.6,
  UREA_HYDRATION_GAIN: 0.2,
  /** BUN (mg/dL) per urea (mmol/L): urea carries two nitrogens (28 g/mol) per 10 dL per L. */
  BUN_PER_UREA: 2.8,
  /** Fraction of presented nitrogen the kidneys excrete when the cycle is intact. */
  URINE_N_INTACT_FRACTION: 1.0,
  URINE_N_FAILED_FRACTION: 0.35,
  /** Orotic shunt gain: carbamoyl-phosphate spilling to orotate against a distal block. */
  OROTIC_GAIN: 10,
  OROTIC_BASELINE: 0.5,
  /** Encephalopathy grades from ammonia, coarse as that mapping is clinically. */
  GRADE_I_UMOL_L: 55,
  GRADE_II_UMOL_L: 90,
  GRADE_III_UMOL_L: 130,
  GRADE_IV_UMOL_L: 170,
  /** Readout smoothing time constant, simulated seconds. */
  TAU_SECONDS: 30,
} as const;

export const UREA_CYCLE_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Nitrogen pools turn over over hours, compressed so a protein load lands within a session. */
  TIME_SCALE: 600,
  /** Simulated seconds of settling before the first frame, so the module opens on balanced
   * nitrogen physiology instead of relaxing into it while the learner watches. */
  SETTLE_SECONDS: 3600,
} as const;

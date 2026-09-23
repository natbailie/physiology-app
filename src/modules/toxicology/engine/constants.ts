/**
 * The toxicology model: a paracetamol overdose on the Rumack-Matthew nomogram, with the
 * eight-hour N-acetylcysteine window as the axis the learner races against.
 *
 * The nominal numbers come from the UK guidelines the app's learners will be examined on:
 *
 * - NAC is started when a child or adult has taken 75 mg/kg or more (the "toxic" threshold the
 *   absorbed dose is referenced to).
 * - The Rumack-Matthew treatment line runs from 100 mg/L at 4 hours to 15 mg/L at 24 hours,
 *   log-linear; plasma above the line at any point means hepatotoxicity is likely without NAC.
 * - NAC protects the liver fully when begun within 8 hours of ingestion, and largely stops
 *   protecting after 24. That 8h boundary is the module's central clock.
 * - Activated charcoal given within the first hour or two sequesters up to about half the
 *   load; given later it does little.
 */
export const TOXICOLOGY = {
  /** Paracetamol volume of distribution, litres per kg. */
  VD_L_PER_KG: 1.0,
  /** Paracetamol elimination half-life in a healthy liver, hours. Absorption is treated as
   * instant at 0.5 h, so the curve falls log-linearly from there. */
  PEAK_HOURS: 0.5,
  HALF_LIFE_HOURS: 3.5,
  /** The eight-hour window inside which NAC broadly prevents hepatotoxicity. */
  NAC_WINDOW_HOURS: 8,
  /** Protection NAC offers when started early, late and very late (fraction of risk removed). */
  NAC_PROTECTION_EARLY: 0.9,
  NAC_PROTECTION_LATE: 0.55,
  NAC_PROTECTION_VERY_LATE: 0.15,
  /** UK threshold above which a paracetamol load warrants NAC. */
  TOXIC_DOSE_MG_PER_KG: 75,
  /** Rumack-Matthew line anchors. */
  NOMOGRAM_LINE_4H_MG_PER_L: 100,
  NOMOGRAM_LINE_24H_MG_PER_L: 15,
  /** Maximum fraction of the load activated charcoal can sequester (percent). */
  CHARCOAL_MAX_PCT: 50,
} as const;

export const TOXICOLOGY_SIMULATION = {
  /** Fraction of a simulated minute advanced per tick — the page updates at 20 Hz so one
   * simulated minute passes every ~0.5s. */
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Simulated minutes per real second. */
  TIME_SCALE: 120,
} as const;
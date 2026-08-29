/** Calibrated so a healthy adult sits at a total bilirubin under 17 µmol/L with no bilirubinuria,
 * visible jaundice past roughly 40 µmol/L, and an R-factor that separates hepatocellular from
 * cholestatic injury exactly as the textbooks define it. */

export const BILIRUBIN = {
  /** Normal turnover from haemoglobin catabolism, µmol/L of plasma-equivalent per minute of
   * simulated flow — scaled so a normal liver holds the unconjugated pool near 8 µmol/L. */
  BASE_PRODUCTION_PER_MIN: 0.055,
  NORMAL_TOTAL_UMOL_L: 17,
  JAUNDICE_VISIBLE_UMOL_L: 40,
  /** Conjugated bilirubin is water-soluble and appears in urine once plasma passes this. */
  URINE_THRESHOLD_CONJ_UMOL_L: 25,
  /** Unconjugated pool relaxes slowly (albumin-bound, t½ measured in hours); conjugated
   * moves within hours. */
  UNCONJUGATED_TAU_SECONDS: 5400,
  CONJUGATED_TAU_SECONDS: 900,
} as const;

export const HAEMOLYSIS = {
  MAX_MULTIPLIER: 8,
  EPISODE_BURST: 2.5,
  EPISODE_DECAY_TAU_SECONDS: 7200,
} as const;

export const HEPATOCYTE = {
  /** Fraction of the conjugated pool regurgitated back to plasma per unit of acute injury —
   * necrosis opens the canalicular seal as well as killing uptake. */
  REGURGITATION_FRACTION: 0.55,
  INJURY_DECAY_TAU_SECONDS: 10800,
} as const;

export const ENZYMES = {
  /** Transaminase elevation per unit of acute injury, multiples of ULN — acute hepatitis
   * routinely exceeds 20x. */
  ALT_PER_INJURY_X_ULN: 28,
  /** Cholestatic enzyme rise per unit obstruction. */
  ALP_PER_OBSTRUCTION_X_ULN: 7,
  /** R-factor bands: (ALT/ULN) ÷ (ALP/ULN). */
  HEPATOCELLULAR_R: 5,
  CHOLESTATIC_R: 2,
} as const;

export const OBSTRUCTION = {
  /** A stent's relief erodes slowly over simulated days as oedema and restenosis reclaim it. */
  RELIEF_RATE_PER_HOUR: 0.9,
  RELIEF_MAX_PCT: 100,
} as const;

export const AMMONIA = {
  BASE_UMOL_L: 16,
  PER_EXCRETORY_DEFICIT_UMOL_L: 190,
  /** Encephalopathy grades from ammonia, coarse as that mapping is clinically. */
  GRADE_I_UMOL_L: 55,
  GRADE_II_UMOL_L: 90,
  GRADE_III_UMOL_L: 130,
  GRADE_IV_UMOL_L: 170,
} as const;

/** Kernicterus risk scales with unconjugated bilirubin relative to albumin binding capacity. */
export const KERNICTERUS = {
  RISK_PER_UMOL_PER_G_PER_L: 0.55,
} as const;

export const LIVER_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Bilirubin pools equilibrate over hours to days; compressed to stay watchable. */
  TIME_SCALE: 900,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 32000,
} as const;

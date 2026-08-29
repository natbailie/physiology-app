/** Calibrated so a normal adult sits at MAP ~90 mmHg with HR ~72; an unblocked
 * noradrenaline-predominant phaeochromocytoma drives sustained MAP well past 130, and giving
 * beta-blockade BEFORE alpha-blockade produces pressures HIGHER than the untreated tumour. */

export const CATECHOLAMINE = {
  /** Basal plasma levels, pg/mL equivalents in relative units. */
  BASELINE_NA: 10,
  BASELINE_AD: 5,
  /** Secretory output of a full-severity tumour per unit. */
  TUMOUR_GAIN: 9,
  CLEARANCE_TAU_SECONDS: 120,
  PAROXYSM_BURST: 60,
  PAROXYSM_TAU_SECONDS: 900,
} as const;

export const HAEMODYNAMICS = {
  BASE_MAP_MMHG: 88,
  NA_ALPHA_GAIN_PER_UNIT: 1.4,
  AD_ALPHA_GAIN_PER_UNIT: 0.22,
  BASE_HR_BPM: 70,
  AD_BETA_CHRONOTROPIC_PER_UNIT: 1.5,
  NA_BETA_CHRONOTROPIC_PER_UNIT: 0.35,
  REFLEX_BRADY_PER_MAP_POINT: 0.45,
} as const;

/** Chronic vasoconstriction contracts plasma volume — orthostatic hypotension follows. */
export const VOLUME = {
  CONTRACTION_PER_CHRONIC_UNIT: 0.35,
  ORTHOSTATIC_DROP_PER_VOLUME_LOSS_MMHG: 60,
  CHRONIC_TAU_SECONDS: 400000,
} as const;

export const BLOCKADE = {
  ALPHA_COVERAGE_MAX: 1,
  BETA_UNOPPOSED_ALPHA_MULTIPLIER: 1.7,
  ARRHYTHMIA_RISK_PER_BETA_BLOCKED_UNIT: 0.55,
} as const;

export const TRIAD = {
  HEADACHE_MAP_THRESHOLD: 125,
  SWEATING_AD_THRESHOLD: 40,
  PALPITATION_HR_THRESHOLD: 95,
} as const;

export const MEDULLA_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 700,
  /** Volume contraction takes weeks; compressed so it is watchable. */
  TIME_SCALE: 240,
  /** Simulated seconds of settling applied before the first frame — and, through `reset`,
   * before a scenario button's first frame, so pressing one shows the scenario rather than
   * the moment before it. */
  SETTLE_SECONDS: 3600,
} as const;

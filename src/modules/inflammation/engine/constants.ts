/**
 * Calibrated constants for the acute inflammatory response.
 *
 * Time constants are the spine of this module: the whole teaching point is that the cellular
 * cascade arrives in a fixed ORDER — mediators within the hour, neutrophils over half a day,
 * macrophages over days, granulomas over weeks — and that CRP lags all of it. Change one of these
 * and the engine test asserting the order should fail; that is what it is for.
 */

export const SIMULATION = {
  MAX_DT_SECONDS: 30,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** A week of illness in about half a minute of watching. */
  TIME_SCALE: 360,
} as const;

export const ACUTE = {
  /** Histamine, prostaglandins, bradykinin: minutes to tens of minutes. */
  MEDIATOR_TAU_SECONDS: 1800,
  /** Margination, diapedesis and chemotaxis — the reason a neutrophilia is a half-day sign. */
  NEUTROPHIL_TAU_SECONDS: 21600,
  /** Monocytes arrive behind the neutrophils and stay: the macrophage handover runs over days
   * two to seven, which is why an untreated cellulitis takes about a week rather than a day. */
  MONOCYTE_TAU_SECONDS: 86400,
  /** Circulating counts, 10^9/L: a normal upper-normal baseline and a florid reactive ceiling. */
  NEUTROPHIL_BASELINE_10E9: 5.5,
  NEUTROPHIL_MAX_10E9: 25,
  NEUTROPHILIA_THRESHOLD_10E9: 11,
  /** Pus is dead neutrophils: it forms only while the fight continues, and lymphatic drainage
   * clears it over a couple of days once the fight is over. */
  PUS_ACCUMULATION_PER_DAY: 0.9,
  PUS_LYMPH_DRAIN_PER_DAY: 0.6,
  /** Above this, the collection is walled off and nothing systemic reaches the middle of it. */
  ABSCESS_PUS_THRESHOLD: 0.45,
  /** Roughly three days of unresolved acute effort before the mononuclear arm organises. */
  CHRONIC_SWITCH_SECONDS: 259200,
  CHRONIC_TAU_SECONDS: 86400,
  /** Granulomas are weeks in the making — two, so an abscess at six days is still an abscess. */
  GRANULOMA_TAU_SECONDS: 1209600,
  /** Collateral damage from the response itself, and the repair that follows clearance. */
  DAMAGE_RATE_PER_DAY: 0.35,
  DAMAGE_HEAL_PER_DAY: 0.25,
} as const;

export const INSULT = {
  /**
   * Bacteria are the only insult that grows unattended, and the growth is fast enough to be
   * bistable against the immune kill: a small inoculum is cleared, a slightly larger one runs away
   * and needs help. That threshold sitting between a 45% and a 50% challenge is the point — it is
   * why the same organism in the same host is a nuisance or an emergency depending on the dose.
   */
  BACTERIAL_GROWTH_PER_DAY: 1.66,
  /** Urate dissolves on its own; slowly, which is why gout is self-limiting but not quick. */
  CRYSTAL_DISSOLVE_PER_DAY: 0.09,
  /** A splinter is still a splinter next month. */
  FOREIGN_BODY_DEGRADE_PER_DAY: 0,
} as const;

export const SYSTEMIC = {
  /** IL-6 and company: hours. */
  CYTOKINE_TAU_SECONDS: 7200,
  /** Hepatic CRP synthesis lags the signal by half a day — a normal CRP at six hours proves
   * nothing, and at forty-eight it speaks. */
  CRP_TAU_SECONDS: 43200,
  CRP_MAX_MG_L: 260,
  /** Above this, the number is doing clinical work rather than being noise. */
  CRP_SIGNIFICANT_MG_L: 40,
  /** Peak fever the spillover can drive, degrees above the 37 °C set point. */
  FEVER_MAX_C: 2.6,
  SIRS_CYTOKINE_THRESHOLD: 0.62,
} as const;

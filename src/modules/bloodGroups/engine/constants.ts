/** Calibrated so a compatible transfusion produces no reaction at all; an ABO-incompatible
 * unit haemolyses within minutes-to-hours with complement consumption and shock, while an
 * Rh mismatch in a sensitised recipient runs over days as slow extravascular clearance. */

export const TRANSFUSION = {
  /** Reaction severity scales with volume transfused, mL. */
  MAX_VOLUME_ML: 500,
} as const;

export const ABO = {
  /** Preformed IgM titre strength by recipient type: O has BOTH antibodies at high titre,
   * AB has neither — the universal red-cell recipient. */
  ANTIBODY_STRENGTH: { O: 100, A: 70, B: 70, AB: 0 } as Record<string, number>,
  /** Antigen load carried by each donor type. */
  ANTIGEN_LOAD: { O: 15, A: 85, B: 85, AB: 100 } as Record<string, number>,
  NAMES: ['O', 'A', 'B', 'AB'] as const,
} as const;

export const REACTION = {
  /** ABO reactions are immediate and intravascular: complement, free Hb, shock, DIC. */
  ABO_FAST_TAU_SECONDS: 2400,
  /** Rh reactions in sensitised recipients are delayed and extravascular. */
  RH_SLOW_TAU_SECONDS: 260000,
  /** Severity per mL against full antibody strength. */
  SEVERITY_PER_ML: 0.22,
  FREE_HB_PER_SEVERITY: 3.5,
  COMPLEMENT_CONSUMPTION_PER_SEVERITY: 0.9,
  DIC_RISK_ONSET_SEVERITY: 45,
  RENAL_INJURY_ONSET_SEVERITY: 55,
  FEBRILE_THRESHOLD_SEVERITY: 12,
} as const;

export const BLOOD_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 700,
  /** The ABO arm runs inside minutes of simulated time; the Rh arm needs days compressed. */
  TIME_SCALE: 720,
  /** Simulated seconds of settling applied before the first frame — and, through `reset`,
   * before a scenario button's first frame, so pressing one shows the scenario rather than
   * the moment before it. */
  SETTLE_SECONDS: 600,
} as const;

/** Haemolytic disease of the newborn: maternal IgG crossing the placenta and clearing
 * fetal cells slowly, extravascularly. Calibrated to textbook baselines — an unaffected
 * fetus holds ~15 g/dL, a severely affected one falls toward 6 with hydrops. */
export const HAEMOLYTIC_DISEASE = {
  /** Fetal haemoglobin when unharmed, g/dL. */
  FETAL_HB_BASELINE_GDL: 15,
  /** g/dL fallen per unit of haemolytic severity. */
  FETAL_HB_FALL_PER_SEVERITY: 0.09,
  /** µmol/L of cord bilirubin per unit severity (severe HDN reaches the kernicterus range). */
  BILIRUBIN_PER_SEVERITY: 3.4,
  /** Severity above which hydrops becomes the dominant risk. */
  HYDROPS_ONSET_SEVERITY: 55,
} as const;

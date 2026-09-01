/**
 * Flux constants below are calibrated so the whole system balances at its setpoints rather
 * than drifting to the clamps. Working in normalized flux units, with p = PTH level (0..1)
 * and c = calcitriol level (0..1), the steady-state serum calcium solves to
 * `Ca = (K1 + K2·p) / CA_DEPOSITION_GAIN`, where K1 collects the PTH-independent inflow minus
 * baseline renal loss and K2 collects everything PTH scales. Those two constants set the
 * physiological range directly: K1/gain fixes calcium with PTH fully off (~7.0 mg/dL, the
 * hypoparathyroid floor) and K2 sets how far PTH can pull it up (~11.1 mg/dL at the
 * autonomous-adenoma level). Phosphate is calibrated the same way, but with the sign of its
 * PTH term flipped — PTH is phosphaturic, so more PTH means less phosphate.
 */

export const CALCIUM = {
  SETPOINT_MGDL: 9.5,
  MIN_MGDL: 4,
  MAX_MGDL: 16,
  // mg/dL change per (net flux unit × second) — sets how fast the plant responds, not where
  // it settles. Gives a ~1000s settling time constant, watchable at TIME_SCALE 6.
  FLUX_GAIN: 0.0022,
  // Mass-action mineral deposition into bone: the outflow term that closes calcium balance.
  DEPOSITION_GAIN: 0.44,
};

export const PHOSPHATE = {
  SETPOINT_MGDL: 3.5,
  MIN_MGDL: 0.5,
  MAX_MGDL: 12,
  FLUX_GAIN: 0.0022,
  DEPOSITION_GAIN: 1.29,
};

export const PTH = {
  // Calcium (mg/dL) at/below which PTH secretion is maximal...
  SECRETION_FLOOR_CA_MGDL: 7.5,
  // ...fading to zero by this level (the sigmoid's upper shoulder).
  SECRETION_CEILING_CA_MGDL: 10.5,
  // Magnesium is permissive: below MG_CRITICAL, PTH secretion AND target-tissue action are
  // impaired despite hypocalcemia — the paradoxical "low PTH with low calcium" picture.
  MG_CRITICAL_MGDL: 1.0,
  MG_ADEQUATE_MGDL: 1.8,
  // Fastest actuator: parathyroid chief cells respond within minutes.
  TAU_SECONDS: 20,
};

export const CALCITRIOL = {
  // PTH stimulates renal 1-alpha-hydroxylase; the reaction also needs substrate (vitamin D)
  // and functioning renal tissue to run at all.
  BASAL: 0.3,
  PTH_GAIN: 0.4,
  VITAMIN_D_SATURATION_PCT: 100,
  // Slower than PTH: requires the renal hydroxylation step, mirroring the HPA axis's
  // CRH→ACTH→cortisol staircase of increasing time constants.
  TAU_SECONDS: 70,
};

export const CALCITONIN = {
  // Thyroid C cells respond to high calcium — starts at this level...
  ACTIVATION_FLOOR_CA_MGDL: 10.5,
  // ...saturating by this level.
  ACTIVATION_CEILING_CA_MGDL: 13,
  // Deliberately weak vs PTH: calcitonin is a minor player in humans, which is why total
  // thyroidectomy (removing every C cell) does not cause hypercalcemia.
  BONE_RESORPTION_BRAKE_GAIN: 0.18,
  TAU_SECONDS: 25,
};

export const BONE = {
  BASAL_RESORPTION: 0.4,
  // Modest relative to basal: most of PTH's calcium-raising effect in a balanced system comes
  // through renal conservation and calcitriol-driven gut absorption, not a dramatic swing in
  // bone turnover.
  PTH_RESORPTION_GAIN: 0.13,
  // Resorption dissolves hydroxyapatite, releasing calcium and phosphate together — which is
  // why PTH alone would raise both, and only its phosphaturic renal action makes phosphate fall.
  CA_RELEASE_GAIN: 8,
  PHOSPHATE_RELEASE_GAIN: 4,
};

export const RENAL_HANDLING = {
  BASAL_CA_REABSORPTION: 0.85,
  PTH_CA_REABSORPTION_GAIN: 0.04,
  MAX_CA_REABSORPTION: 0.99,
  // PTH is PHOSPHATURIC — it inhibits the proximal NaPi cotransporter, dumping phosphate in
  // the urine. This opposite-direction renal action on the two ions is the key divergence.
  BASAL_PHOSPHATE_EXCRETION: 0.15,
  // Tuned alongside PHOSPHATE.DEPOSITION_GAIN: strong enough that PTH clearly drives phosphate
  // in the opposite direction to calcium, but not so strong that a severe secondary
  // hyperparathyroidism drives phosphate down onto its clamp.
  PTH_PHOSPHATE_EXCRETION_GAIN: 0.35,
  MAX_PHOSPHATE_EXCRETION: 0.9,
  FILTERED_CA_LOAD: 20,
  FILTERED_PHOSPHATE_LOAD: 13.6,
};

export const GUT = {
  BASAL_CA_ABSORPTION: 0.15,
  CALCITRIOL_CA_ABSORPTION_GAIN: 0.3,
  BASAL_PHOSPHATE_ABSORPTION: 0.55,
  // Calcitriol raises absorption of BOTH ions — the divergence from PTH, which raises calcium
  // while dumping phosphate.
  CALCITRIOL_PHOSPHATE_ABSORPTION_GAIN: 0.2,
  INTAKE_SCALE_MG: 1000,
  CA_INTAKE_FLUX_GAIN: 12,
  PHOSPHATE_INTAKE_FLUX_GAIN: 10,
};

export const PRECIPITATION = {
  // The clinical Ca × phosphate product threshold (mg²/dL²) above which calcium-phosphate
  // precipitates into soft tissue. Modeled as a calcium sink only — the real precipitate
  // consumes both ions, but attributing the loss to calcium keeps the CKD-MBD teaching point
  // (a high product drives ectopic calcification) without a second coupled term.
  CA_P_PRODUCT_THRESHOLD: 55,
  GAIN: 0.15,
};

export const CALCIUM_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame — and, through `reset`,
   * before a scenario button's first frame, so pressing one shows the scenario rather than
   * the moment before it. */
  SETTLE_SECONDS: 3600,
};

/**
 * The PTH assay value, pg/mL, from the parathyroid drive.
 *
 * `pthLevel` is a 0-1 actuator. PTH is the measurement that makes sense of a calcium: the same
 * 10.8 mg/dL means primary hyperparathyroidism if the PTH is 100 and malignancy if it is 5, and
 * "inappropriately normal" is a phrase that needs a number to mean anything. On a 0-1 scale it
 * could not be said at all.
 *
 * Logarithmic, because PTH spans nearly two decades across the states this module ships.
 * Calibrated on the normal range and on hypoparathyroidism; the rest fall where they should:
 *   - normal              drive 0.34 -> 35 pg/mL  (reference range 15-65)
 *   - hypoparathyroid     drive 0.05 -> 8         (low, against a calcium of 7.4)
 *   - hypomagnesaemia     drive 0.00 -> 6         (magnesium is required to SECRETE PTH)
 *   - primary hyperPTH    drive 0.55 -> 104       (non-suppressed against a high calcium)
 *   - CKD-MBD             drive 0.73 -> 256       (secondary, driven by phosphate retention)
 *   - vitamin D deficiency drive 0.79 -> 358      (secondary, driven by poor gut absorption)
 */
export const PTH_ASSAY = {
  LOG_INTERCEPT: 0.807,
  LOG_SLOPE_PER_DRIVE: 2.2,
  /** Assay reporting floor and a ceiling above tertiary values, pg/mL. */
  MIN_PG_ML: 1,
  MAX_PG_ML: 2000,
};

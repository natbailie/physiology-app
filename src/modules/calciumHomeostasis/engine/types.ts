export interface CalciumInputs {
  /** Dietary calcium intake, mg/day (0-2000) */
  dietaryCalciumIntake: number;
  /** Dietary phosphate intake, mg/day (0-2000) */
  dietaryPhosphateIntake: number;
  /** Vitamin D substrate availability (sunlight + diet), % of normal (0-200) — low models
   * nutritional vitamin D deficiency, which limits how much calcitriol can be made no matter
   * how hard PTH drives 1-alpha-hydroxylase */
  vitaminDIntake: number;
  /** Renal function, fraction (0-1.5) — gates both the final 1-alpha-hydroxylation step and
   * phosphate excretion, which is why CKD produces the characteristic mineral-bone triad */
  renalFunction: number;
  /** Parathyroid gland secretory capacity, fraction (0-1.5) — 0 models hypoparathyroidism
   * (e.g. post-thyroidectomy) */
  parathyroidGlandFunction: number;
  /** Serum magnesium, mg/dL (0.5-3.0) — magnesium is permissive for PTH secretion AND for
   * PTH's action at target tissue; severe hypomagnesemia causes refractory hypocalcemia with
   * an inappropriately low PTH */
  serumMagnesium: number;
  /** Autonomous, feedback-independent PTH secretion (0-100) — models a parathyroid adenoma
   * (primary hyperparathyroidism) */
  autonomousPTHSecretion: number;
}

export interface CalciumState {
  simTimeSeconds: number;
  /** Serum calcium, mg/dL (plant variable), normal ~8.5-10.5 */
  serumCalciumMgDl: number;
  /** Serum phosphate, mg/dL (plant variable), normal ~2.5-4.5 */
  serumPhosphateMgDl: number;
  /** Smoothed PTH level, 0..1 (fastest actuator — parathyroid chief cells respond in minutes) */
  pthLevel: number;
  /** Smoothed calcitriol (1,25-(OH)2-D) level, 0..1 — slower, since it requires PTH-driven
   * renal 1-alpha-hydroxylation, mirroring the HPA axis's CRH→ACTH→cortisol staircase */
  calcitriolLevel: number;
  /** Smoothed calcitonin level, 0..1 — fast but deliberately weak; a minor counter-hormone
   * next to PTH, which is why thyroidectomy doesn't cause hypercalcemia */
  calcitoninLevel: number;
}

export interface CalciumDerived {
  serumCalciumMgDl: number;
  serumPhosphateMgDl: number;
  pthLevel: number;
  /** PTH as an assay reports it, pg/mL. Reference range 15-65. */
  pthPgPerML: number;
  calcitriolLevel: number;
  calcitoninLevel: number;
  boneResorptionRate: number;
  renalCaReabsorptionFraction: number;
  renalPhosphateExcretionFraction: number;
  gutCaAbsorptionFraction: number;
  gutPhosphateAbsorptionFraction: number;
  /** Ca × phosphate, mg²/dL² — the ectopic-calcification risk index that drives CKD-MBD management */
  calciumPhosphateProduct: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  dietaryCalciumIntake: number;
  dietaryPhosphateIntake: number;
  vitaminDIntake: number;
  renalFunction: number;
  parathyroidGlandFunction: number;
  serumMagnesium: number;
  autonomousPTHSecretion: number;
}

export interface CalciumSnapshot {
  state: CalciumState;
  derived: CalciumDerived;
}

export interface CalciumHistoryPoint {
  t: number;
  calcium: number;
  phosphate: number;
  pth: number;
}

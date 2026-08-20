export interface GlucoseInputs {
  /** Carbohydrate load of the queued meal, grams (0-150) — added to the absorption bolus by
   * the "Eat meal" perturbation, not applied continuously */
  mealCarbLoadGrams: number;
  /** Exogenous insulin dose, units (0-20) — added to the exogenous bolus by the "Give
   * insulin" perturbation */
  exogenousInsulinUnits: number;
  /** Endogenous beta-cell secretion capacity, fraction (0-1.5) — 0 models T1DM (no
   * endogenous insulin at all, regardless of glucose) */
  insulinSecretionCapacity: number;
  /** Peripheral insulin resistance, fraction (0-2) — blunts insulin-mediated glucose uptake
   * without affecting secretion; the T2DM lever */
  insulinResistance: number;
  /** Endogenous alpha-cell secretion capacity, fraction (0-1.5) */
  glucagonSecretionCapacity: number;
}

export interface GlucoseState {
  simTimeSeconds: number;
  /** Blood glucose, mg/dL (plant variable) */
  bloodGlucoseMgDl: number;
  /** Unabsorbed carbohydrate remaining from the last "Eat meal" event, grams — decays into
   * blood glucose over time */
  mealBolusRemaining: number;
  /** Active exogenous insulin remaining from the last "Give insulin" event — added directly
   * to the insulin target, ungated by insulinSecretionCapacity (this is what still works in
   * unmanaged T1DM), and decays as the dose is used up */
  exogenousInsulinBolus: number;
  /** Smoothed beta-cell insulin level, 0..~2 (fastest actuator) */
  insulinLevel: number;
  /** Smoothed alpha-cell glucagon level, 0..1 */
  glucagonLevel: number;
  /** Smoothed counter-regulatory (cortisol/GH/epinephrine) drive, 0..1 — slower, engages
   * only on persistent/severe hypoglycemia, mirroring the HPA axis's staircase cascade */
  counterRegulatoryDrive: number;
  /** Hepatic glycogen reserve, 0..1 (starts at 1) — depletes under sustained glycogenolysis,
   * recovers once glucose is adequate; mirrors the HPA axis's adrenalReserve pattern */
  hepaticGlycogenReserve: number;
}

export interface GlucoseDerived {
  bloodGlucoseMgDl: number;
  mealBolusRemaining: number;
  exogenousInsulinBolus: number;
  insulinLevel: number;
  glucagonLevel: number;
  counterRegulatoryDrive: number;
  hepaticGlycogenReserve: number;
  glucoseUptakeRate: number;
  hepaticGlucoseOutputRate: number;
  /** 0..1, how severe the current hypoglycemia is (0 = euglycemic or hyperglycemic) */
  hypoglycemiaSeverity: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  insulinSecretionCapacity: number;
  insulinResistance: number;
  glucagonSecretionCapacity: number;
}

export interface GlucoseSnapshot {
  state: GlucoseState;
  derived: GlucoseDerived;
}

export interface GlucoseHistoryPoint {
  t: number;
  bloodGlucose: number;
  insulin: number;
  glucagon: number;
}

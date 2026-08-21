export type ShockClassification =
  | 'no shock'
  | 'hypovolaemic'
  | 'cardiogenic'
  | 'distributive'
  | 'obstructive'
  | 'mixed / undifferentiated';

export interface ShockInputs {
  /** Circulating blood volume, mL (2000-6500). Baseline ~5000. */
  bloodVolumeMl: number;
  /** Left ventricular contractility, fraction where 1 = normal (0-2). Low models a failing
   * pump — infarction, myocarditis, late sepsis. */
  contractility: number;
  /** Systemic vascular resistance, multiple of normal (0.15-3). Profoundly low is the
   * defining lesion of distributive shock; high is usually compensation, not a cause. */
  systemicVascularResistance: number;
  /** Pressure in the pericardial space, mmHg (0-28). Raised in tamponade — it compresses the
   * heart from outside, so measured filling pressure rises while true filling FALLS. */
  pericardialPressureMmHg: number;
  /** Pulmonary vascular resistance, multiple of normal (1-9). Raised by a large embolus,
   * limiting how much blood can cross the lungs to reach the left heart. */
  pulmonaryVascularResistance: number;
  /** Tissue capacity to extract the oxygen delivered to it, fraction of normal (0.2-1.3).
   * Sepsis impairs it — which is why mixed venous saturation can be HIGH in a patient who is
   * simultaneously producing lactate. */
  tissueExtractionCapacity: number;
  /** Whole-body oxygen demand, mL/min (120-600). Raised by fever, work of breathing, agitation. */
  oxygenDemandMlPerMin: number;
  /** Haemoglobin, g/dL (3-18) — the other term in oxygen delivery, and the one haemorrhage
   * removes alongside volume. */
  haemoglobinGDl: number;
  /** Baroreflex gain, fraction of normal (0-1.5). Zero models the exhausted or blocked reflex,
   * which is how a compensated patient becomes an uncompensated one. */
  baroreflexGain: number;
}

export interface ShockState {
  simTimeSeconds: number;
  /** TRANSMURAL right atrial pressure, mmHg — the distending pressure the ventricle actually
   * feels. Integrated by mass balance, exactly as in the Venous Return module. */
  transmuralRapMmHg: number;
  /** Smoothed sympathetic outflow, 0..1, relaxing toward its target on a reflex time constant. */
  sympatheticDrive: number;
  /** Arterial lactate, mmol/L — accumulates whenever consumption falls short of demand and
   * clears slowly, so it lags recovery. */
  lactateMmolL: number;
  /** Acute volume gained or lost by a perturbation, mL. */
  volumeOffsetMl: number;
}

export interface ShockDerived {
  /** Measured central venous pressure = transmural pressure PLUS whatever is pressing on the
   * heart from outside. The gap between the two is the whole of tamponade. */
  centralVenousPressureMmHg: number;
  transmuralRapMmHg: number;
  meanSystemicFillingPressureMmHg: number;
  /** Pulmonary capillary wedge pressure, mmHg — a surrogate for LEFT-sided filling. High in
   * cardiogenic shock, low in pulmonary embolism, which is what separates them. */
  wedgePressureMmHg: number;
  cardiacOutputLPerMin: number;
  cardiacIndex: number;
  strokeVolumeMl: number;
  heartRateBpm: number;
  effectiveSvr: number;
  meanArterialPressureMmHg: number;
  sympatheticDrive: number;
  /** Oxygen delivery, mL/min — Hb x 1.34 x SaO2 x CO x 10. */
  oxygenDeliveryMlPerMin: number;
  oxygenConsumptionMlPerMin: number;
  oxygenExtractionRatio: number;
  /** Mixed venous saturation, %. Low when delivery is inadequate; paradoxically HIGH when
   * tissue cannot extract, which is the fingerprint of distributive shock. */
  mixedVenousSaturationPercent: number;
  lactateMmolL: number;
  /** True when demand exceeds what the tissues can actually consume — the definition of shock
   * that does not depend on blood pressure at all. */
  isOxygenDebt: boolean;
  classification: ShockClassification;
  /** Plain-language reading of the haemodynamic pattern, shown beneath the classification. */
  patternSummary: string;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  bloodVolumeMl: number;
  contractility: number;
  systemicVascularResistance: number;
  pericardialPressureMmHg: number;
  pulmonaryVascularResistance: number;
  tissueExtractionCapacity: number;
  oxygenDemandMlPerMin: number;
  haemoglobinGDl: number;
  baroreflexGain: number;
}

export interface ShockSnapshot {
  state: ShockState;
  derived: ShockDerived;
}

export interface ShockHistoryPoint {
  t: number;
  map: number;
  cardiacOutput: number;
  cvp: number;
  lactate: number;
  svo2: number;
}

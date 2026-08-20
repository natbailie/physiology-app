export const GAS_EXCHANGE = {
  BASELINE_PACO2_MMHG: 40,
  ATM_PRESSURE_MMHG: 760,
  H2O_VAPOR_PRESSURE_MMHG: 47,
  RESPIRATORY_QUOTIENT: 0.8,
  AA_GRADIENT_BASELINE_MMHG: 5,
  // Added at full (1.0) airway obstruction — V/Q mismatch widening the A-a gradient.
  AA_GRADIENT_OBSTRUCTION_GAIN_MMHG: 25,
  // Prevents divide-by-zero blowup as alveolar ventilation approaches zero.
  VA_FLOOR_FRACTION: 0.05,
  PACO2_MIN_MMHG: 10,
  PACO2_MAX_MMHG: 150,
  PAO2_MIN_MMHG: 20,
  PAO2_MAX_MMHG: 650,
};

export const VENTILATION = {
  // drive=+1 -> up to 2x effective ventilation (Kussmaul-level hyperventilation). Deliberately
  // limited (real chemoreceptor drive CAN increase ventilation several-fold, but a much higher
  // ceiling here would let the reflex fully normalize even severe hypoventilation, which is
  // physiologically wrong for e.g. COPD — the whole point is that the reflex CAN'T compensate).
  MAX_CHEMO_VENTILATION_GAIN: 1.0,
  // drive=-1 -> at most halves ventilation. A voluntary/sustained low input (e.g. panic
  // hyperventilation) should be able to persist against the reflex, not be fully overridden by it.
  NEGATIVE_DRIVE_DAMPING: 0.5,
  // drive=-1 -> floors near-apnea, never literal zero. Used only as the hard floor/ceiling clamp.
  MIN_VENTILATION_MULTIPLIER: 0.05,
  // obstruction=1 cuts alveolar ventilation by up to 70%.
  MAX_OBSTRUCTION_VENTILATION_REDUCTION: 0.7,
};

export const CHEMORECEPTOR = {
  // PaCO2 deviation (mmHg) that saturates the CO2 component of drive.
  CO2_SENSITIVITY_MMHG: 15,
  // pH deviation that saturates the pH component of drive.
  PH_SENSITIVITY: 0.15,
  // PaO2 below this recruits peripheral (hypoxic) chemoreceptor drive.
  HYPOXIC_THRESHOLD_MMHG: 60,
  HYPOXIC_SENSITIVITY_MMHG: 30,
  // Fastest actuator: seconds-to-a-minute chemoreceptor/brainstem response.
  TAU_SECONDS: 20,
};

export const ACUTE_BUFFER = {
  CO2_RANGE_MMHG: 60,
  // Calibrated toward the clinical "~1 mEq/L HCO3 per 10mmHg PaCO2" acute rule.
  HCO3_GAIN_PER_SECOND: 0.0006,
  TAU_SECONDS: 40,
};

export const RENAL_COMPENSATION = {
  PH_RANGE: 0.25,
  // Calibrated toward the "~3.5-4 mEq/L per 10mmHg PaCO2" chronic compensation rule.
  HCO3_GAIN_PER_SECOND: 0.0009,
  // Slowest actuator: renal compensation takes days physiologically.
  TAU_SECONDS: 480,
};

export const METABOLIC_LOAD = {
  // Direct titration of plasma HCO3- by exogenous acid/base load.
  HCO3_GAIN_PER_SECOND: 0.0012,
};

export const BICARBONATE = {
  BASELINE_MEQ_L: 24,
  MIN_MEQ_L: 5,
  MAX_MEQ_L: 45,
};

export const BRONCHOSPASM = {
  DEFAULT_MAGNITUDE: 0.6,
  RECOVERY_TAU_SECONDS: 90,
};

export const RESP_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  // Applied to real elapsed time in the React loop so multi-minute chemoreceptor/renal
  // compensation responses are watchable within roughly a minute, matching the cardiorenal module.
  TIME_SCALE: 6,
};

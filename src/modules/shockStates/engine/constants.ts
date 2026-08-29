/** Calibrated so a normal adult sits at CO 5 L/min, MAP ~93, CVP ~3, wedge ~10, SvO2 ~72%
 * and lactate ~1.0 mmol/L. Every abnormal pattern is then a departure from those numbers
 * rather than a value written in by hand. */

export const CIRCULATION = {
  BASELINE_BLOOD_VOLUME_ML: 5000,
  /** Fraction of blood volume that merely fills vessels without stretching them, and so
   * generates no filling pressure. See the Venous Return module. */
  UNSTRESSED_FRACTION: 0.86,
  /** Total systemic compliance, mL/mmHg. */
  TOTAL_COMPLIANCE_ML_PER_MMHG: 100,
  /** Resistance to venous return at baseline, mmHg per L/min. */
  BASELINE_RVR: 0.8,
  BASELINE_CARDIAC_OUTPUT: 5,
  BASELINE_MAP_MMHG: 93,
  BODY_SURFACE_AREA_M2: 1.8,
} as const;

export const HEART = {
  /** How strongly a failing ventricle dams blood back into the lungs, mmHg per unit of lost
   * contractility. This is what separates cardiogenic shock from every other low-output state. */
  CARDIOGENIC_WEDGE_GAIN: 9,
  /** How much extra circulating volume raises LEFT-sided filling pressure, mmHg per mmHg of
   * mean systemic filling pressure above normal. Gated by how much blood actually crosses the
   * lungs, so an embolus keeps the wedge low no matter how full the systemic circuit is. */
  LEFT_PRELOAD_GAIN: 1.5,
  BASELINE_PMSF_MMHG: 7,
  BASELINE_RATE_BPM: 70,
  /** Rate at maximal sympathetic drive. */
  MAX_RATE_BPM: 165,
  /** Right atrial compliance, mL/mmHg — sets how fast the filling pressure responds to a
   * mismatch between what arrives and what is ejected. */
  ATRIAL_COMPLIANCE_ML_PER_MMHG: 180,
  MIN_TRANSMURAL_RAP_MMHG: -3,
  MAX_TRANSMURAL_RAP_MMHG: 24,
  /** Transmural filling pressure at which the Starling curve reaches its plateau, mmHg. */
  STARLING_HALF_SATURATION_MMHG: 4.5,
  /** Cardiac output plateau at normal contractility, L/min. */
  PLATEAU_L_PER_MIN: 12.5,
  BASELINE_WEDGE_MMHG: 10,
} as const;

export const PULMONARY = {
  /** How strongly a raised pulmonary vascular resistance limits transit to the left heart. */
  TRANSIT_PENALTY: 0.42,
  /** How much pulmonary congestion raises the resistance the right heart pumps against, per
   * 10 mmHg of wedge pressure above normal. Backward failure: a left ventricle that cannot
   * clear the lungs makes the right ventricle's job harder, which is why cardiogenic shock
   * raises the CENTRAL venous pressure and not only the wedge. */
  CONGESTION_GAIN: 0.8,
} as const;

export const OXYGEN = {
  /** mL of O2 carried per gram of fully saturated haemoglobin. */
  ML_PER_G_HB: 1.34,
  ARTERIAL_SATURATION: 0.98,
  BASELINE_HB_G_DL: 15,
  BASELINE_DEMAND_ML_PER_MIN: 250,
  /** Highest fraction of delivered oxygen healthy tissue can extract. */
  MAX_EXTRACTION_FRACTION: 0.75,
} as const;

export const LACTATE = {
  BASELINE_MMOL_L: 1,
  MAX_MMOL_L: 20,
  /** mmol/L per minute produced per mL/min of unmet oxygen demand. */
  PRODUCTION_GAIN: 0.0016,
  /** Hepatic and renal clearance time constant, seconds — deliberately slow, so lactate lags
   * recovery and a falling lactate is evidence of resuscitation rather than a snapshot. */
  CLEARANCE_TAU_SECONDS: 420,
} as const;

export const BAROREFLEX = {
  /** MAP at which sympathetic drive is half-maximal, mmHg. */
  HALF_ACTIVATION_MMHG: 55,
  STEEPNESS_MMHG: 10,
  TAU_SECONDS: 9,
  /** How much maximal drive multiplies systemic vascular resistance. */
  SVR_GAIN: 0.75,
  /** How much maximal drive adds to contractility. */
  INOTROPIC_GAIN: 0.35,
  /** How much maximal drive raises the mean systemic filling pressure by venoconstriction —
   * converting unstressed volume into stressed volume, exactly as in the Venous Return module.
   * This is what lets a compensating patient hold up their venous return, and it is why the
   * CVP can be high in obstruction despite no fluid having been given. */
  VENOCONSTRICTION_GAIN: 1.2,
} as const;

export const CLASSIFICATION = {
  /** Cardiac index below which output is judged inadequate, L/min/m2. */
  LOW_CARDIAC_INDEX: 2.2,
  HIGH_CARDIAC_INDEX: 4,
  LOW_CVP_MMHG: 4,
  HIGH_CVP_MMHG: 8,
  LOW_WEDGE_MMHG: 8,
  HIGH_WEDGE_MMHG: 18,
  LOW_SVR: 0.7,
  HIGH_SVR: 1.3,
  SHOCK_MAP_MMHG: 65,
  RAISED_LACTATE_MMOL_L: 2,
} as const;

export const SHOCK_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Minutes of physiology per second of watching — lactate and compensation play out over
   * tens of minutes. */
  TIME_SCALE: 20,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 300,
} as const;

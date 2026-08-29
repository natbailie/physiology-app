export const CIRCULATION = {
  BLOOD_VOLUME_ML: 5000,
  /** About 86% of blood volume is unstressed — filling the vessels without stretching them.
   * Only the remaining ~700 mL generates any pressure at all. */
  UNSTRESSED_FRACTION: 0.86,
  /** Total systemic compliance, mL/mmHg. Almost all of it is venous: the veins are roughly
   * nineteen times as compliant as the arteries, which is why they hold most of the blood and
   * why venous tone, not arterial tone, sets the filling pressure. */
  TOTAL_COMPLIANCE_ML_PER_MMHG: 100,
  /** Resistance to venous return, mmHg per L/min. With a filling pressure of 7 mmHg this gives
   * a cardiac output of 5 L/min at a right atrial pressure of zero. */
  BASE_RESISTANCE: 1.4,
  /** Arterial resistance contributes only a fraction of the resistance to venous return,
   * because the compliance downstream of it is so much larger than the compliance upstream.
   * Changing SVR therefore moves the venous return curve far less than intuition suggests. */
  SVR_WEIGHT: 0.35,
  /** A fistula bypasses the arterioles entirely. */
  SHUNT_RESISTANCE_DROP: 0.7,
  MIN_RESISTANCE: 0.15,
};

export const CARDIAC = {
  /** Plateau of the normal cardiac function curve, L/min. */
  MAX_OUTPUT_L_PER_MIN: 13,
  /** How steeply output rises with filling pressure. Chosen so that a normal heart at a
   * transmural right atrial pressure of 4 mmHg produces 5 L/min. */
  STARLING_CONSTANT_MMHG: 8,
  /** Output falls as afterload rises — the second, less obvious effect of raising SVR. */
  AFTERLOAD_SENSITIVITY: 0.35,
  /** Rate contributes to output up to a point; beyond it, diastole becomes too short to fill. */
  OPTIMUM_HEART_RATE: 150,
  MIN_RATE_FACTOR: 0.5,
  RATE_REFERENCE: 70,
  /** Once output reaches this fraction of the curve's plateau, the heart is near its ceiling and
   * more filling achieves little — the constraint has moved from the veins to the pump. A normal
   * circulation runs at well under this, which is Guyton's central claim: cardiac output is
   * normally set by venous return, not by the heart. */
  PUMP_LIMITED_PLATEAU_FRACTION: 0.55,
  AFTERLOAD_LIMITED_SVR: 1.3,
};

export const ATRIUM = {
  /** Compliance of the central veins and right atrium, mL/mmHg. Small, which is why a mismatch
   * between venous return and cardiac output corrects itself within a few heartbeats. */
  COMPLIANCE_ML_PER_MMHG: 20,
  MIN_PRESSURE_MMHG: -8,
  MAX_PRESSURE_MMHG: 32,
  /** Below about zero the great veins collapse where they enter the chest, so lowering right
   * atrial pressure further cannot increase venous return. This is the plateau of the venous
   * return curve, and it is why a healthy heart cannot pump more simply by sucking harder. */
  COLLAPSE_PRESSURE_MMHG: 0,
};

export const THORACIC = {
  NORMAL_PRESSURE_MMHG: -4,
  /** Raising the pressure in the chest does not only push on the heart — it is transmitted to
   * the abdomen and the great veins, compressing them and raising the mean systemic filling
   * pressure too. Both curves move, which is why positive-pressure ventilation lowers cardiac
   * output substantially without arresting the circulation. */
  PMSF_TRANSMISSION: 0.7,
  /** A Valsalva manoeuvre raises intrathoracic pressure sharply and briefly. */
  VALSALVA_SURGE_MMHG: 30,
  VALSALVA_TAU_SECONDS: 4,
};

export const PLOT = {
  /** Right atrial pressure range the curves are sampled over, mmHg. */
  PRA_MIN: -6,
  PRA_MAX: 24,
  SAMPLES: 46,
  MAX_FLOW_L_PER_MIN: 18,
};

export const VENOUS_RETURN_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 33,
  HISTORY_CAPACITY: 240,
  /** Real time. Right atrial pressure equilibrates within a few seconds, so there is nothing
   * here that needs speeding up — and watching the operating point slide along a curve as a
   * slider moves is the whole point. */
  TIME_SCALE: 1,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 20,
};

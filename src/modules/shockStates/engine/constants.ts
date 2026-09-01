/** Calibrated so a normal adult sits at CO 5 L/min, MAP ~93, CVP ~3, wedge ~10, SvO2 ~72%
 * and lactate ~1.0 mmol/L. Every abnormal pattern is then a departure from those numbers
 * rather than a value written in by hand. */

export const CIRCULATION = {
  BASELINE_BLOOD_VOLUME_ML: 5000,
  /** Fraction of blood volume that merely fills vessels without stretching them, and so
   * generates no filling pressure. See the Venous Return module. */
  UNSTRESSED_FRACTION: 0.86,
  /**
   * How much of a volume LOSS the unstressed compartment absorbs, as an exponent on the
   * remaining fraction of blood volume. 1 keeps unstressed volume a fixed fraction; 0 makes it a
   * fixed capacity that the loss cuts straight through.
   *
   * At 1 — which is what this module used to do — filling pressure falls in proportion to blood
   * volume, so bleeding 42% of it costs only 42% of the filling pressure and the circulation is
   * far too robust: with the baroreflex switched off entirely we still produced MAP 58 and a
   * cardiac output of 3.1 L/min at a loss Pulse answers with 21.7 and 0.63. Vessels recoil as they
   * empty, so blood is drawn preferentially out of the STRESSED volume that generates pressure —
   * which is why filling pressure, and with it stroke volume, falls faster than volume does.
   * That non-linearity is the cliff; without it no reflex tuning can produce one.
   */
  UNSTRESSED_RECOIL_EXPONENT: 0.76,
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
  /**
   * Sympathetic drive above which the vasoconstricted beds start going anaerobic, and how much
   * lactate they then contribute in mmol/L at full drive.
   *
   * Global oxygen debt alone is a THRESHOLD: consumption meets demand until delivery falls below
   * the critical point, and then it does not. That made our lactate flat at 1.00 mmol/L through
   * Classes I to III and then a step change, when the clinical value of lactate is precisely that
   * it rises EARLY — occult hypoperfusion is a raised lactate in a patient whose vital signs still
   * look acceptable, and it is why lactate is measured at all.
   *
   * The missing mechanism is regional. Defending arterial pressure means shutting down the
   * splanchnic bed, muscle and skin, and those beds go anaerobic while the global figures still
   * balance. The compensation is buying time for the brain and heart, and the gut is paying for it.
   * Pulse could not settle this one — its own lactate is flat too, 1.60 -> 1.66 even at collapse
   * with a mixed venous saturation of 21% — so this rests on the clinical literature rather than on
   * the oracle, and the ladder is keyed to the ATLS class bands.
   */
  REGIONAL_THRESHOLD_DRIVE: 0.25,
  REGIONAL_GAIN_MMOL_L: 5.5,
  /** Hepatic and renal clearance time constant, seconds — deliberately slow, so lactate lags
   * recovery and a falling lactate is evidence of resuscitation rather than a snapshot. */
  CLEARANCE_TAU_SECONDS: 420,
} as const;

export const BAROREFLEX = {
  /**
   * The pressure the reflex is defending, mmHg — its SETPOINT, and the normal operating point.
   *
   * Drive used to be a sigmoid of absolute pressure half-activating at 55 mmHg, which put a
   * resting patient at 93 mmHg out on the flat tail of the curve with a drive of 0.02. The reflex
   * therefore did essentially nothing until pressure was already nearly lethal, and the Pulse
   * ladder shows exactly that: across a bleed costing 15, 25, 35 and 42 percent of blood volume,
   * Pulse ran 72 -> 92 -> 110 -> 129 -> 155 bpm while we ran 72 -> 74 -> 76 -> 80 -> 83.
   *
   * A real carotid sinus works the other way round. Its threshold is near 50-60 mmHg and it
   * saturates near 160-180, but its GAIN is greatest at the normal operating point — which is what
   * makes it a controller rather than an alarm. Driving it from the ERROR against a setpoint puts
   * the steep part of the curve where the patient actually lives.
   */
  SETPOINT_MMHG: 93,
  /**
   * mmHg of error at which drive is half-maximal — the reflex saturates smoothly rather than
   * switching, so drive keeps climbing over the whole range instead of pinning.
   *
   * Small on purpose: a high-gain negative feedback loop holds a SMALL error with a LARGE output,
   * which is precisely how Pulse defends pressure to within 1% through a Class I bleed while
   * already at 92 bpm. A low-gain loop does the opposite and reports the large error as a falling
   * blood pressure — the straight line that inverts this module's whole teaching point.
   *
   * The saturating shape matters as much as the gain. A logistic steep enough to give the right
   * Class I tachycardia pinned at maximum by Class III, so every shock state on the page showed the
   * same 165 bpm and the rate stopped discriminating between them. This form is steep near the
   * setpoint and keeps a little headroom all the way down: 8 mmHg of error gives half of maximal
   * drive, and the ladder then runs 89, 108, 141, 155 bpm against Pulse's 92, 110, 129, 155.
   */
  HALF_ACTIVATION_ERROR_MMHG: 8,
  TAU_SECONDS: 9,
  /** How much maximal drive multiplies systemic vascular resistance. */
  SVR_GAIN: 0.6,
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

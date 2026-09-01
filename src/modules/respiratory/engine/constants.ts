export const GAS_EXCHANGE = {
  BASELINE_PACO2_MMHG: 40,
  ATM_PRESSURE_MMHG: 760,
  H2O_VAPOR_PRESSURE_MMHG: 47,
  RESPIRATORY_QUOTIENT: 0.8,
  AA_GRADIENT_BASELINE_MMHG: 5,
  // Added at full (1.0) airway obstruction — V/Q mismatch widening the A-a gradient.
  AA_GRADIENT_OBSTRUCTION_GAIN_MMHG: 25,
  /**
   * Added at full (1.0) V/Q mismatch. Much larger than the bronchospasm gain above because it is
   * a different lesion: bronchospasm is mostly a ventilation problem, where mismatch and shunt are
   * mostly a GRADIENT problem. A normal A-a gradient is under 15 mmHg and severe mismatch takes it
   * past 60, which is what lets an exacerbation be profoundly hypoxaemic while the CO2 barely moves.
   */
  AA_GRADIENT_VQ_GAIN_MMHG: 75,
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
  /**
   * V/Q mismatch = 1 wastes up to 35% of alveolar ventilation as dead space.
   *
   * Deliberately far smaller than the obstruction reduction above. CO2 is roughly twenty times more
   * diffusible than oxygen and its dissociation curve is near-linear over the physiological range,
   * so mismatch that devastates oxygenation costs only a little CO2 clearance — and the well
   * ventilated alveoli can compensate for the poor ones on CO2 in a way they cannot on O2. That
   * asymmetry IS the teaching: hypoxaemia out of proportion to hypercapnia means mismatch, not
   * hypoventilation.
   */
  MAX_VQ_DEAD_SPACE_FRACTION: 0.35,
};

export const CHEMORECEPTOR = {
  // PaCO2 deviation (mmHg) that saturates the CO2 component of drive.
  CO2_SENSITIVITY_MMHG: 15,
  // pH deviation that saturates the pH component of drive. Finer than the CO2 term on
  // purpose: as hyperventilation blows off CO2 the CO2 term turns negative and fights back,
  // so the acidaemia has to outweigh it for Kussmaul breathing to reach the depth Winter's
  // formula describes. Loosen this and a diabetic ketoacidosis under-compensates.
  PH_SENSITIVITY: 0.1,
  // The CO2/pH (central) component alone cannot reach the top of the drive range. The
  // reserved headroom belongs to the hypoxic component, so that withdrawing hypoxic drive
  // — which is exactly what supplemental O2 does to a chronic CO2 retainer — costs real
  // ventilation and raises PaCO2. Clamping the summed drive instead left every hypoxaemic
  // hypoventilator pinned at 1 from CO2 alone, where oxygen was a free win.
  CENTRAL_MAX_DRIVE: 0.7,
  // PaO2 below this recruits peripheral (hypoxic) chemoreceptor drive.
  HYPOXIC_THRESHOLD_MMHG: 60,
  // Steep, because the hypoxic ventilatory response is steep: below the threshold the carotid
  // bodies recruit hard and fast. A shallower slope left altitude producing no measurable
  // alkalosis at all, because the falling CO2 term cancelled the hypoxic gain almost exactly.
  HYPOXIC_SENSITIVITY_MMHG: 20,
  // Fastest actuator: seconds-to-a-minute chemoreceptor/brainstem response.
  TAU_SECONDS: 20,
};

export const ACUTE_BUFFER = {
  CO2_RANGE_MMHG: 60,
  /**
   * Bicarbonate offset, mEq/L, at full drive — a BOUNDED actuator rather than a rate.
   *
   * This is the acute rule made exact. The drive is linear in PaCO2 over a 60 mmHg span, so a
   * ceiling of 6 mEq/L is precisely "1 mEq/L per 10 mmHg" and a ceiling of 12 is "2 per 10".
   * Integrating a rate instead — which is what this used to do — meant the acute bicarbonate
   * was never a value at all, only however far the integration had got, so "acute" and
   * "chronic" differed by nothing but how long you had waited and no compensation rule could
   * be checked against the model.
   *
   * The two directions differ because the buffering does: a rise in CO2 is buffered mostly by
   * haemoglobin and protein, while a fall pulls lactate and other organic acids out of the
   * cells, which shifts bicarbonate roughly twice as far.
   */
  MAX_OFFSET_RISE_MEQ_L: 6,
  MAX_OFFSET_FALL_MEQ_L: 12,
  TAU_SECONDS: 40,
};

export const RENAL_COMPENSATION = {
  PH_RANGE: 0.25,
  /**
   * Maximum bicarbonate the kidney can add or remove, mEq/L.
   *
   * Bounding this is what makes compensation INCOMPLETE, which is the single most important
   * thing about it: a compensating kidney restores the ratio far enough to keep the patient
   * alive and then runs out of capacity, so a chronic retainer lands at a nearly-normal pH
   * rather than a normal one. As a free integrator the renal arm simply drove pH to 7.4 and
   * stopped, which made every chronic disorder look fully corrected and left nothing for the
   * compensation rules to detect.
   */
  MAX_OFFSET_MEQ_L: 11,
  // Slowest actuator: renal compensation takes days physiologically.
  TAU_SECONDS: 480,
};

export const METABOLIC_LOAD = {
  // Direct titration of plasma HCO3- by exogenous acid/base load.
  HCO3_GAIN_PER_SECOND: 0.0012,
  // ...and the clearance that stops it running away. Acid is not only produced, it is
  // metabolised and excreted, so a FIXED production rate settles at a fixed deficit rather
  // than consuming every last bicarbonate ion. Without this term the model has production
  // and no disposal, and any sustained load — mild or catastrophic — ends at the same
  // floored bicarbonate, which makes every metabolic disorder read identically on a panel.
  // Steady-state HCO3 deficit is load x HCO3_GAIN_PER_SECOND x CLEARANCE_TAU_SECONDS, so
  // this constant is what sets how severe a given acid load actually is.
  CLEARANCE_TAU_SECONDS: 200,
};

export const ANION_GAP = {
  // Na - (Cl + HCO3). The normal value is unmeasured anion, mostly albumin.
  NORMAL_MEQ_L: 12,
  // An ORGANIC acid (ketoacid, lactate, salicylate) consumes bicarbonate and leaves its
  // conjugate base behind, so the gap widens one-for-one with the bicarbonate lost. A
  // hyperchloraemic acidosis — diarrhoea, renal tubular acidosis, saline — loses bicarbonate
  // with chloride taking its place, so the gap does not move at all. That single difference
  // is what the gap is calculated to detect.
  ANION_PER_HCO3_LOST: 1,
};

export const INTERPRETATION = {
  // The pH band inside which no primary disorder is called.
  NORMAL_PH_MIN: 7.35,
  NORMAL_PH_MAX: 7.45,
  NORMAL_PACO2_MMHG: 40,
  NORMAL_HCO3_MEQ_L: 24,
  // Winter's formula: expected PaCO2 = 1.5 x HCO3 + 8, +/- 2.
  WINTERS_SLOPE: 1.5,
  WINTERS_INTERCEPT: 8,
  WINTERS_TOLERANCE: 2,
  // Metabolic alkalosis: expected PaCO2 = 0.7 x HCO3 + 20, +/- 5. Hypoventilation is a far
  // less reliable compensation than hyperventilation, which is why the band is wider.
  ALKALOSIS_SLOPE: 0.7,
  ALKALOSIS_INTERCEPT: 20,
  ALKALOSIS_TOLERANCE: 5,
  // Renal compensation for a respiratory disorder, per 10 mmHg of PaCO2 deviation. The pair
  // of numbers is the point: a single blood gas CANNOT distinguish acute from chronic, so
  // the expectation is a BAND running from the acute value to the fully compensated chronic
  // one, and only a bicarbonate outside that band proves a second disorder.
  ACIDOSIS_ACUTE_HCO3_PER_10: 1,
  ACIDOSIS_CHRONIC_HCO3_PER_10: 3.5,
  ALKALOSIS_ACUTE_HCO3_PER_10: 2,
  ALKALOSIS_CHRONIC_HCO3_PER_10: 4,
  // Slack on the band edges, mEq/L.
  RESPIRATORY_TOLERANCE: 1.5,
  // Delta ratio bounds for a pure high-anion-gap acidosis. Below is a coexisting normal-gap
  // acidosis; above is a coexisting metabolic alkalosis.
  DELTA_RATIO_MIN: 0.8,
  DELTA_RATIO_MAX: 2,
  // Below this the bicarbonate has barely moved and the delta ratio is meaningless noise.
  DELTA_RATIO_MIN_HCO3_CHANGE: 3,
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
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 750,
};

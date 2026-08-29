/** Calibrated so a normal adult sits at an ICP of about 10 mmHg, a cerebral perfusion pressure
 * of roughly 80, and a cerebral blood flow of 50 mL per 100 g per minute. */

export const CRANIUM = {
  BASELINE_ICP_MMHG: 10,
  /** Volume of CSF and venous blood that can be displaced out of the skull before pressure
   * begins to rise. This buffer is the whole of the Monro-Kellie doctrine: the box is fixed, so
   * something must leave before anything else can be accommodated. */
  COMPENSATORY_RESERVE_ML: 75,
  /** Exponent of the pressure-volume relationship beyond the buffer. Pressure rises
   * EXPONENTIALLY once the reserve is spent, which is why the last few millilitres matter far
   * more than the first fifty. */
  ELASTANCE_PER_ML: 0.035,
  MAX_ICP_MMHG: 90,
  ICP_TAU_SECONDS: 12,
} as const;

export const FLOW = {
  /** Normal cerebral blood flow, mL per 100 g per minute. */
  BASELINE_CBF: 50,
  /** Autoregulated plateau, in cerebral perfusion pressure. Outside this band flow follows
   * pressure. */
  AUTOREGULATION_LOWER_CPP: 50,
  AUTOREGULATION_UPPER_CPP: 150,
  /** Flow below which the tissue is ischaemic, and below which infarction follows. */
  ISCHAEMIC_THRESHOLD: 20,
  HYPERAEMIC_THRESHOLD: 70,
} as const;

export const VESSEL = {
  /** Arteriolar calibre change per mmHg of PaCO2, around a reference of 40. CO2 reactivity is
   * roughly linear between 20 and 60 mmHg and is the fastest lever on intracranial pressure. */
  CO2_GAIN_PER_MMHG: 0.021,
  CO2_REFERENCE_MMHG: 40,
  /** PaO2 below which hypoxic vasodilatation begins. */
  HYPOXIC_THRESHOLD_MMHG: 50,
  HYPOXIC_GAIN: 0.02,
  /** How strongly a falling perfusion pressure dilates vessels while autoregulation is intact.
   * This is protective for flow and dangerous for pressure — dilated vessels hold more blood,
   * which raises ICP, which lowers perfusion pressure further. The vasodilatory cascade. */
  AUTOREGULATORY_GAIN: 0.006,
  MIN_CALIBRE: 0.5,
  MAX_CALIBRE: 2.2,
  TAU_SECONDS: 8,
  /** Cerebral blood volume at normal calibre, mL. */
  BASELINE_BLOOD_VOLUME_ML: 75,
} as const;

export const CSF = {
  /** Normal production, mL per minute (about 500 mL/day). */
  PRODUCTION_ML_PER_MIN: 0.35,
  /** Absorption is pressure-dependent: the arachnoid granulations need a gradient to work
   * against the venous sinus, which is why a raised venous pressure alone causes hydrocephalus. */
  ABSORPTION_PER_MMHG: 0.055,
  MAX_EXCESS_ML: 140,
} as const;

export const CUSHING = {
  /** Perfusion pressure below which the brainstem response fires: hypertension to restore
   * perfusion, with reflex bradycardia from the resulting baroreceptor stretch. */
  TRIGGER_CPP_MMHG: 40,
  BASELINE_HEART_RATE_BPM: 72,
  MIN_HEART_RATE_BPM: 38,
} as const;

export const CLASSIFICATION = {
  RAISED_ICP_MMHG: 20,
  CRITICAL_ICP_MMHG: 30,
  LOW_CPP_MMHG: 50,
  LOW_RESERVE_ML: 12,
} as const;

export const CEREBRAL_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** CSF accumulates over hours; compressed so it is watchable. */
  TIME_SCALE: 25,
} as const;

/** Blood-brain barrier disruption drives vasogenic oedema — fluid and protein leaking into
 * the interstitial space. The leak rate scales with permeability above the normal threshold
 * and the hydrostatic gradient pushing fluid across the vessel wall. */
export const BBB = {
  /** Maximum leak rate, mL per minute, at maximum disruption (200%). */
  MAX_LEAK_RATE_ML_PER_MIN: 0.06,
  /** Permeability above which leak becomes significant, %. Normal BBB is 100;
   * disruption begins above that. */
  LEAK_THRESHOLD_PCT: 100,
  /** Oedema volume at which significant additional mass effect develops, mL. */
  SIGNIFICANT_OEDEMA_ML: 10,
  /** Maximum oedema volume the model will track, mL. */
  MAX_OEDEMA_ML: 80,
} as const;

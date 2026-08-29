/** Calibrated so a normal adult in daylight sits at a pupil of about 3-4 mm, a Snellen acuity
 * of 6/6, and a photopic operating point on the intensity-response curve. */

export const LUMINANCE = {
  /** Scene luminance bands, log10 cd/m2. Starlight is around -5, moonlight -3, indoor
   * lighting 1-2, a bright overcast day 3-4. The scotopic/mesopic boundary is where rods
   * begin to hand over to cones; the mesopic/photopic boundary is where colour is reliable. */
  SCOTOPIC_UPPER_LOG_CD: -3,
  PHOTOPIC_LOWER_LOG_CD: 1,
  /** Rods saturate well below photopic levels — which is why they are useless in daylight
   * no matter how many of them remain. */
  ROD_SATURATION_LOG_CD: 0,
  MIN_LOG_CD: -6,
  MAX_LOG_CD: 4.5,
} as const;

export const RECEPTOR = {
  /** Naka-Rushton exponent for both receptor classes. */
  EXPONENT_N: 0.8,
  /** Half-saturation point for the UNADAPTED photoreceptor response. Perception adapts to
   * the background; the membrane potential itself still tracks absolute intensity, which is
   * why glutamate release differs between a moonlit and a sunlit scene even once adapted. */
  ABSOLUTE_I50_LOG_CD: -0.5,
  /** Adaptation floors. Rods cannot shift their operating range above about -1 log cd/m2,
   * because past that their pigment is effectively saturated; cones cannot follow the scene
   * into deep scotopic darkness, where only rods remain. */
  ROD_ADAPTATION_CEILING_LOG_CD: -1,
  CONE_ADAPTATION_FLOOR_LOG_CD: -1.5,
  /** Cone adaptation is fast (seconds to a minute); rod dark adaptation has two phases — a
   * quick cone-supported one and a slow rhodopsin regeneration measured in tens of minutes. */
  CONE_TAU_SECONDS: 45,
  ROD_ADAPTATION_TAU_SECONDS: 240,
  RHODOPSIN_REGENERATION_TAU_SECONDS: 420,
  /** A full bleach multiplies the rod half-saturation constant by this much: the flash has
   * left the receptors with almost no sensitivity until pigment regenerates. */
  BLEACH_I50_MULTIPLIER: 12,
} as const;

/** The pupil reflex tracks RAW retinal illuminance over roughly seven log units — far less
 * adaptation than perception itself, which is why pupils are still sluggish in a dark cinema
 * long after you feel fully adapted to it. */
export const PUPIL_DRIVE = {
  MIN_LOG_CD: -4.5,
  MAX_LOG_CD: 2.5,
} as const;

export const PUPIL = {
  /** Dark-adapted and maximally constricted diameters, mm — textbook range. */
  DARK_MM: 7.5,
  CONSTRICTED_MM: 2.0,
  /** Latency of the light reflex: slower than the blink, faster than adaptation. */
  TAU_SECONDS: 0.9,
  /** Steepness of the sigmoid relating retinal signal to constriction. */
  SIGNAL_MIDPOINT: 0.55,
  SIGNAL_WIDTH: 0.28,
} as const;

export const ACUITY = {
  /** Foveal acuity is cone-limited: 6/6 when the foveal cone mosaic is intact, falling as
   * cones are lost or as vision shifts onto the rod-rich periphery, whose acuity ceiling is
   * roughly 6/60. */
  SNELLEN_DENOMINATORS: [6, 9, 12, 18, 24, 36, 60] as const,
  ROD_ACUITY_SCORE: 0.09,
  MAX_CONE_SCORE: 1,
} as const;

/** Afferent deficit becomes demonstrable on the swinging-torch test past roughly this
 * asymmetry; efferent failure produces visible anisocoria past this diameter difference. */
export const CLINICAL = {
  RAPD_AFFERENT_ASYMMETRY: 0.3,
  ANISOCORIA_SIGNIFICANT_MM: 1.5,
  NIGHT_BLINDNESS_ROD_DRIVE: 0.3,
  MACULAR_FAILURE_CONE_INTEGRITY: 0.3,
} as const;

/** The aqueous circulation. Calibrated so a normal eye settles near 15 mmHg: production
 * against a pressure-dependent outflow through the trabecular meshwork, plus a small
 * pressure-insensitive uveoscleral leak that caps how high a total occlusion can go. */
export const AQUEOUS = {
  PRODUCTION_UL_PER_MIN: 2.4,
  EPISCLERAL_VENOUS_MMHG: 8,
  FACILITY_REF_UL_PER_MIN_PER_MMHG: 0.3,
  UVEOSCLERAL_FACILITY_UL_PER_MIN_PER_MMHG: 0.06,
  /** Pressure relaxes over simulated minutes — hours of real time, compressed by TIME_SCALE. */
  IOP_TAU_SECONDS: 900,
  CLOSURE_TAU_SECONDS: 600,
  /** Pilocarpine contracts the ciliary muscle, which tensions the meshwork open AND pulls
   * the peripheral iris out of the angle. */
  PILOCARPINE_FACILITY_GAIN: 1.4,
  PILOCARPINE_CLOSURE_RELIEF: 0.95,
  ACETAZOLAMIDE_PRODUCTION_BLOCK: 0.5,
  /** A dilated pupil piles iris into the angle. Only an already-narrow angle has anywhere to pile it. */
  ANGLE_WIDE_THRESHOLD_PCT: 45,
  MYDRIATIC_BASELINE_RISK: 0.15,
  MYDRIATIC_PROVOCATION: 1.9,
  CLOSURE_TARGET_GAIN: 0.75,
  /** Facility falls steeply as appositional closure progresses. */
  FACILITY_CLOSURE_EXPONENT: 2.5,
  GLAUCOMA_IOP_MMHG: 22,
  CRISIS_IOP_MMHG: 40,
} as const;

/** Accommodation: ciliary muscle contraction rounds the lens. Amplitude is a property of the
 * lens, and the lens stiffens with age — which is why distance vision survives presbyopia. */
export const ACCOMMODATION = {
  RESPONSE_TAU_SECONDS: 0.6,
  /** Half a dioptre of shortfall hides within depth of focus; beyond it print blurs. */
  BLUR_THRESHOLD_D: 0.3,
  NEAR_MIOSIS_MAX_MM: 0.9,
  /** Accommodative response that produces maximal near-driven miosis. */
  NEAR_DRIVE_REF_D: 5,
} as const;

export const VISION_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Dark adaptation takes tens of minutes; compressed so it is watchable. Pupil responses
   * run inside simulated seconds and stay snappy at this scale. */
  TIME_SCALE: 30,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 400,
} as const;

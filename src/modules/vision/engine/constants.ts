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

export const VISION_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Dark adaptation takes tens of minutes; compressed so it is watchable. Pupil responses
   * run inside simulated seconds and stay snappy at this scale. */
  TIME_SCALE: 30,
} as const;

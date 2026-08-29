/** Calibrated so a clothed adult at rest in a 21 C room sits at a core of 37 C in balance:
 * ~85 W of metabolic production against ~85 W of dry loss plus insensible evaporation. */

export const SETPOINT = {
  BASE_C: 37,
  /** Pyrogens act via hypothalamic PGE2 to MOVE the defended point — fever is regulated. */
  PYROGEN_MAX_SHIFT_C: 3.2,
  SETPOINT_TAU_SECONDS: 25000,
  /** Antipyretics block the prostaglandin step: they lower the POINT, never the pyrogen. */
  ANTIPYRETIC_BLOCK_FRACTION: 0.85,
  ANTIPYRETIC_DECAY_TAU_SECONDS: 90000,
} as const;

export const HEAT = {
  /** Thermal inertia of a 70 kg body: joules stored per degree of core change. */
  BODY_CAPACITY_J_PER_C: 240000,
  BASAL_METABOLIC_W: 85,
  /** Dry loss (radiation + convection) per kelvin of skin-air gradient, at average clothing. */
  DRY_COEFF_W_PER_K: 10,
  /** Insensible (non-sweating) evaporation, always running. */
  INSENSIBLE_W: 22,
  SHIVER_MAX_W: 500,
  /** Deep hypothermia silences the shiver — a danger sign, not an improvement. */
  SHIVER_FADE_BELOW_C: 31.5,
  SHIVER_FADE_SPAN_C: 3.5,
  SWEAT_MAX_W: 850,
  // Wind and wet clothing multiply dry loss — how people actually become hypothermic.
  WIND_WETNESS_MAX_MULT: 3.2,
  /** Cold tissue metabolises slowly: production itself fails below ~34 C. */
  PRODUCTION_SUPPRESSION_ONSET_C: 34,
  PRODUCTION_MIN_FRACTION: 0.25,
  /** Skin blood flow multiplier: vasoconstricted 0.3 to maximally dilated 1.8. */
  SKINFLOW_MIN: 0.3,
  SKINFLOW_MAX: 1.8,
  SKIN_TAU_SECONDS: 700,
  EFFECTOR_TAU_SECONDS: 240,
  CORE_TAU_FROM_BALANCE: 1,
} as const;

export const ENVIRONMENT = {
  MIN_AMBIENT_C: -20,
  MAX_AMBIENT_C: 48,
  /** Evaporative ceiling scales with air dryness: sweat that cannot evaporate cools nothing. */
  DRYNESS_AT_FULL_HUMIDITY: 0.06,
  /** External devices (fans, ice packs, warming blankets) applied as timed interventions. */
  COOLING_BOOST_W: 320,
  COOLING_WINDOW_SECONDS: 40000,
  REWARM_BOOST_W: 260,
  REWARM_WINDOW_SECONDS: 50000,
} as const;

export const CLINICAL = {
  FEVER_SETPONT_C: 37.8,
  HYPERTHERMIA_CORE_C: 39.4,
  HEATSTROKE_CORE_C: 40.4,
  MILD_HYPOTHERMIA_C: 35,
  MODERATE_HYPOTHERMIA_C: 32,
} as const;

export const THERMO_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 700,
  /** Core temperature moves over tens of minutes; compressed so fevers develop on screen. */
  TIME_SCALE: 150,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 17000,
} as const;

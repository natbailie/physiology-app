/** Calibrated so a normal subject feels no spontaneous pain, light touch is perceived fully,
 * and a fresh tissue injury produces a pain score near 7/10 that gate control and descending
 * modulation can each pull down measurably. */

/** Conduction velocities, m/s — the three fibre classes that carry somatic sensation. */
export const FIBRE_VELOCITIES_M_PER_S = {
  AB: 70,
  AD_DELTA: 15,
  C: 1,
} as const;

/** Standard test distance for latency readouts: fingertip-to-cord, roughly. */
export const LIMB_DISTANCE_M = 1.2;

export const GATE = {
  /** Aβ input and rubbing close the gate; C-fibre traffic opens it; descending modulation
   * biases the interneuron toward closed. Weights set so moderate rubbing roughly halves an
   * established pain score. */
  AB_CLOSING_WEIGHT: 0.55,
  RUBBING_CLOSING_WEIGHT: 1.0,
  DESCENDING_CLOSING_WEIGHT: 0.9,
  OPIOID_CLOSING_WEIGHT: 1.4,
  CFIBRE_OPENING_WEIGHT: 1.15,
  AD_OPENING_WEIGHT: 0.8,
  GATE_STEEPNESS: 30,
  GATE_MIDPOINT: 30,
} as const;

export const BLOCK = {
  /** Local anaesthetics block nociceptive fibres FIRST, then the thick Aβ touch fibres —
   * so at partial doses pain is abolished while light touch survives, never the reverse. */
  AD_VULNERABILITY: 0.95,
  C_VULNERABILITY: 1.0,
  AB_VULNERABILITY: 0.35,
} as const;

export const PAIN = {
  /** Rating scale mapping: transmission-cell output to a 0-10 score (raw targets may exceed
   * 10 in extreme states; perception clamps on display). */
  SCALE_MAX_TC_OUTPUT: 90,
  RATING_TAU_SECONDS: 2,
  /** Peripheral sensitisation builds over minutes of ongoing inflammation and lets Aβ
   * traffic open the gate — allodynia: touch that hurts. */
  SENSITISATION_TAU_SECONDS: 150,
  ALLODYNIA_GAIN: 2.4,
  /** Central wind-up: sustained C-input amplifies via NMDA-dependent recruitment, slowly. */
  WINDUP_TAU_SECONDS: 60,
  WINDUP_MAX_MULTIPLIER: 2.2,
} as const;

export const EVENTS = {
  INJURY_BURST: 45,
  INJURY_DECAY_TAU_SECONDS: 90,
  OPIOID_BURST: 38,
  OPIOID_DECAY_TAU_SECONDS: 480,
} as const;

/** Severity above which a cord lesion counts as clinically complete on its side. */
export const LESION = {
  COMPLETE_THRESHOLD: 70,
  SIGNIFICANT_THRESHOLD: 35,
} as const;

export const SOMATIC_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Sensitisation builds over minutes; compressed so it is watchable. */
  TIME_SCALE: 20,
} as const;

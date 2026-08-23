/** Calibrated so a healthy adult initiates a commanded reach in about 200 ms and lands on
 * target; advanced parkinsonism triples latency and halves amplitude, and each lesion class
 * produces its own signature tremor without touching the others'. */

export const MOVEMENT = {
  BASELINE_INITIATION_MS: 180,
  /** Extra latency per unit of bradykinesia — the slowness of INITIATION is the cardinal
   * negative symptom of dopamine depletion. */
  BRADYKINESIA_MAX_EXTRA_MS: 1100,
  /** Amplitude lost to hypokinesia at full dopamine failure. */
  HYPOKINESIA_MAX_AMPLITUDE_LOSS: 0.62,
} as const;

export const TREMOR = {
  REST_MAX_AMP: 10,
  INTENTION_MAX_AMP: 9,
  POSTURAL_MAX_AMP: 9,
  CHOREA_MAX_AMP: 8,
  BALLISM_MAX_AMP: 13,
  /** Resting tremor is suppressed by voluntary movement; intention tremor exists ONLY there. */
  VOLUNTARY_SUPPRESSION_OF_REST: 0.85,
} as const;

export const LEVODOPA = {
  BURST_FRACTION: 45,
  DECAY_TAU_SECONDS: 3600,
} as const;

/** Deep brain stimulation damps the pathological oscillator and eases the gate. */
export const DBS = {
  REST_TREMOR_MULTIPLIER: 0.15,
  INVOLUNTARY_MULTIPLIER: 0.6,
  BRADYKINESIA_EASING: 0.85,
} as const;

export const MOTOR_SIMULATION = {
  MAX_DT_SECONDS: 0.2,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** A levodopa dose wears off over simulated hours; compressed so the decay is watchable. */
  TIME_SCALE: 60,
} as const;

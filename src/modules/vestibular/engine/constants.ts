/** Calibrated so a normal adult shows no spontaneous nystagmus, a VOR gain near 0.9,
 * and no vertigo at rest; a fresh unilateral loss gives roughly 20 deg/s of slow-phase
 * velocity and severe vertigo until central compensation intervenes. */

export const CANAL = {
  /** Resting firing rate of each vestibular nerve, spikes per second — the baseline the
   * brain compares between the two ears. Vertigo IS an error in this comparison. */
  RESTING_FIRING_SPIKES_PER_SEC: 90,
  /** Endolymph lags the head by inertia; the cupula is deflected by their RELATIVE motion.
   * Time constant of the ampullo-petal drift, seconds — about 5-7 s physiologically. */
  ENDOLYMPH_TAU_SECONDS: 5,
  /** Deflection (normalised) per degree/second of relative head-endolymph motion. */
  DEFLECTION_GAIN_PER_DEG_S: 1 / 150,
  /** Canal firing change per unit deflection, spikes/s. */
  MODULATION_GAIN: 80,
} as const;

export const NYSTAGMUS = {
  /** Slow-phase velocity per spike/s of inter-ear firing imbalance, before compensation. */
  SLOW_PHASE_GAIN: 0.28,
  /** Central compensation can suppress the IMBALANCE SIGNAL but cannot restore the lost
   * mechanical gain — which is why chronic lesions leave gaze stability poor yet quiet. */
  COMPENSATION_WEIGHT: 0.95,
  VERTIGO_PER_DEG_S: 3.2,
} as const;

export const HEAD_IMPULSE = {
  VELOCITY_DEG_S: 180,
  DURATION_SECONDS: 0.3,
  /** Gain below which a visible corrective saccade betrays the deficit. */
  ABNORMAL_BELOW_GAIN: 0.75,
} as const;

export const HALLPIKE = {
  /** Duration the provoking position is held, simulated seconds. */
  HOLD_SECONDS: 45,
  /** Canalith debris needs this long to sink onto the cupula before nystagmus begins —
   * the characteristic LATENCY of BPPV, absent in central positional nystagmus. */
  DEBRIS_LATENCY_SECONDS: 8,
  BUILD_SECONDS: 12,
  /** The response FATIGUES as debris disperses — another peripheral signature. */
  FATIGUE_TAU_SECONDS: 18,
} as const;

export const POSTURE = {
  ROMBERG_OTOLITH_WEIGHT_PCT: 55,
  ROMBERG_CANAL_WEIGHT_PCT: 35,
} as const;

export const VESTIBULAR_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 50,
  HISTORY_CAPACITY: 900,
  /** Near real time: cupula dynamics run in seconds and are worth watching directly. */
  TIME_SCALE: 2,
} as const;

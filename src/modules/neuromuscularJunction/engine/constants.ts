/** Calibrated so a normal junction sits at a safety factor of roughly 4, a train-of-four ratio
 * of 1.0 and full force — and so each named lesion reproduces its characteristic train. */

export const RELEASE = {
  /** Quanta released by a normal impulse. */
  BASELINE_QUANTAL_CONTENT: 60,
  /** Calcium entry enters release with a steep power — release goes as roughly the fourth
   * power of calcium influx, which is why a partial loss of calcium channels is so costly. */
  CALCIUM_POWER: 2.6,
  /** How much residual calcium raises release probability. Small in a healthy junction, and
   * the whole story in a presynaptic lesion. */
  FACILITATION_GAIN: 1.6,
  CALCIUM_PER_IMPULSE: 0.22,
  CALCIUM_DECAY_TAU_SECONDS: 0.16,
  /** Fraction of the READILY RELEASABLE store consumed per impulse during a train. Over the
   * second or two of a train-of-four, mobilisation from the reserve pool cannot keep pace with
   * this, which is what makes repeated stimulation informative. */
  POOL_USE_PER_IMPULSE: 0.055,
  /** Net drawdown per impulse during SUSTAINED firing, once mobilisation from the reserve pool
   * is keeping up. Far smaller — a healthy junction fires at low rates indefinitely without
   * fatiguing, which is why fatiguability is a finding rather than a normal variant. */
  TONIC_USE_PER_IMPULSE: 0.006,
  POOL_REFILL_TAU_SECONDS: 7,
  /** A non-depolarising blocker also occupies PRESYNAPTIC autoreceptors, which normally
   * mobilise more vesicles during repetitive activity. Losing that mobilisation is the accepted
   * mechanism of train-of-four fade, and it is why a depolarising block does NOT fade. */
  PRESYNAPTIC_MOBILISATION_BLOCK: 0.85,
  /** Frequency used for the high-rate test, Hz, and how many stimuli it delivers. */
  TETANIC_TEST_HZ: 30,
  TETANIC_TEST_COUNT: 15,
} as const;

export const ENDPLATE = {
  /** Depolarisation contributed by one quantum at full receptor density, mV. */
  MV_PER_QUANTUM: 0.55,
  /** Depolarisation needed to fire the muscle fibre's own action potential, mV. */
  THRESHOLD_MV: 9,
  /** How much losing acetylcholinesterase amplifies each quantum. */
  ESTERASE_AMPLIFICATION: 0.55,
  MAX_EPP_MV: 90,
} as const;

export const BLOCKADE = {
  /** Receptor occupancy at which a competitive blocker is complete. */
  NONDEPOLARISING_FULL: 100,
  /** How strongly a depolarising agonist desensitises the receptor over time. */
  DESENSITISATION_GAIN: 0.97,
  /** A persistently depolarised end plate cannot fire the fibre at all: the sodium channels
   * around it sit inactivated. This is a block produced by too MUCH agonist, which is why an
   * anticholinesterase deepens it rather than reversing it. */
  DEPOLARISING_INEXCITABILITY: 0.82,
  /** Acetylcholinesterase activity below which transmitter accumulates enough to depolarise the
   * end plate persistently — fasciculation first, then paralysis. */
  CHOLINERGIC_BLOCK_THRESHOLD: 0.5,
  DESENSITISATION_TAU_SECONDS: 22,
  RECOVERY_TAU_SECONDS: 40,
} as const;

export const CLASSIFICATION = {
  FADE_RATIO: 0.9,
  /** Lambert-Eaton increments DRAMATICALLY on high-frequency stimulation — commonly a doubling
   * or more. Any weak junction shows some facilitation, so the threshold has to be set where
   * only a presynaptic lesion reaches it. */
  INCREMENT_RATIO: 3,
  WEAK_FORCE_PERCENT: 85,
  LOW_SAFETY_FACTOR: 1.6,
} as const;

export const NMJ_SIMULATION = {
  MAX_DT_SECONDS: 0.02,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  /** Slower than real time: the events here are milliseconds apart. */
  TIME_SCALE: 0.35,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 20,
} as const;

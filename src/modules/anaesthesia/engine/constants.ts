/**
 * The anaesthetic uptake model: how inspired vapour becomes an alveolar concentration and then
 * reaches the brain, and why the wash-in is fast for sevoflurane and slow for halothane.
 *
 * The three time constants follow the standard teaching skeleton in Nunn's / Miller's wash-in
 * analysis, each with a textbook anchor:
 *
 * - The CIRCUIT is washed by fresh gas: at a fresh gas flow too low for the circuit volume, the
 *   dialed concentration takes minutes to appear at the Y-piece.
 * - The ALVEOLAR SPACE is washed by alveolar ventilation, like any breath of inoculum gas.
 * - The BLOOD removes agent in proportion to its solubility (blood:gas partition coefficient)
 *   times cardiac output: the classic "the slower the lambda, the faster the rise".
 *
 * The equilibrium ceiling is the inspired fraction times a steady-state efficiency that is high
 * for low-solubility agents and slightly lower for soluble ones — the residual uptake that keeps
 * a high-lambda agent from ever quite matching its inspired level in a working circuit.
 */
export const ANAESTHESIA = {
  /** Circuit (breathing system) volume, litres — the bag, the hoses, the absorber. */
  CIRCUIT_VOLUME_L: 4.5,
  /** Fixed re-breathing share of the circuit, L/min, that a low fresh-gas flow fails to scavenge. */
  REBREATHING_LMIN: 3.5,
  /** Alveolar (functional residual capacity) volume, litres, that alveolar ventilation washes. */
  ALVEOLAR_VOLUME_L: 2.6,
  /** Alveolar ventilation, L/min — the part of minute ventilation reaching gas exchange. */
  ALVEOLAR_VENTILATION_LMIN: 4.0,
  /** Perfused volume the blood column charges while it equilibrates with the alveolar gas, litres. */
  PERFUSED_LOAD_VOLUME_L: 5.0,
  /** Minutes per unit of lambda for the brain effect-site to follow the alveolar: the blood-brain
   * delay is small and solubility scales it, exactly as the partition coefficients say. */
  BRAIN_TAU_MIN_PER_LAMBDA: 0.8,
  /** Steady-state efficiency of the alveolar level against its inspired fraction. */
  EFF_BASE: 0.98,
  EFF_PER_LAMBDA: 0.03,
  EFF_MIN: 0.85,
  EFF_MAX: 0.96,
  /** Blood:gas partition coefficients of the four volatiles, for the preset names to say openly. */
  LAMBDA_DESFLURANE: 0.45,
  LAMBDA_SEVOFLURANE: 0.65,
  LAMBDA_ISOFLURANE: 1.4,
  LAMBDA_HALOTHANE: 2.3,
} as const;

export const ANAESTHESIA_SIMULATION = {
  /** Fraction of a simulated second advanced per tick — 20 Hz, so each render advances 1 sim second. */
  MAX_DT_SECONDS: 0.05,
  /** The page opens after 900 simulated seconds, when the slowest default wash-in has climbed within
   * a few percent of its ceiling and the effect site is no longer visibly moving — the steady check
   * elsewhere reads envelopes, so the opening window has to sit on the flat tail, not the slope. */
  SETTLE_SECONDS: 900,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 400,
  /** Simulated seconds per real second — a four-minute wash-in takes four real seconds to watch. */
  TIME_SCALE: 60,
} as const;
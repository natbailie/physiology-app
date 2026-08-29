export const RECEPTORS = {
  // Neural sympathetic outflow reaches alpha-1 and beta-1 strongly; beta-2 receptors (bronchi,
  // skeletal muscle vessels) are relatively sparsely innervated and respond far more to
  // CIRCULATING epinephrine than to direct nerve traffic. That asymmetry is why a
  // pheochromocytoma produces bronchodilation and a stress response does so much less.
  SYMPATHETIC_ALPHA1_GAIN: 0.9,
  SYMPATHETIC_BETA1_GAIN: 1,
  SYMPATHETIC_BETA2_GAIN: 0.25,
  EPINEPHRINE_ALPHA1_GAIN: 0.55,
  EPINEPHRINE_BETA1_GAIN: 0.8,
  EPINEPHRINE_BETA2_GAIN: 1,
  // Acetylcholinesterase inhibition doesn't create parasympathetic outflow — it amplifies
  // whatever is already there by letting released ACh linger in the synapse.
  CHOLINESTERASE_AMPLIFICATION: 1.6,
};

export const SECOND_MESSENGER = {
  // Beta receptors couple through Gs → adenylyl cyclase → cAMP.
  CAMP_BETA1_GAIN: 0.6,
  CAMP_BETA2_GAIN: 0.5,
  // Alpha-1 and muscarinic M1/M3 both couple through Gq → phospholipase C → IP3/Ca2+.
  IP3_ALPHA1_GAIN: 0.6,
  IP3_MUSCARINIC_GAIN: 0.6,
  TAU_SECONDS: 2,
};

export const HEART = {
  INTRINSIC_RATE_BPM: 100,
  // Resting heart rate sits BELOW the intrinsic pacemaker rate because vagal tone dominates
  // at rest — which is why atropine alone raises heart rate toward ~100.
  BETA1_GAIN_BPM: 90,
  MUSCARINIC_GAIN_BPM: 55,
  MIN_BPM: 30,
  MAX_BPM: 200,
  TAU_SECONDS: 3,
};

export const PUPIL = {
  BASELINE_MM: 4,
  // Alpha-1 on the radial (dilator) muscle widens the pupil; muscarinic on the circular
  // (sphincter) muscle constricts it.
  ALPHA1_DILATION_MM: 4,
  MUSCARINIC_CONSTRICTION_MM: 2.4,
  MIN_MM: 1,
  MAX_MM: 9,
  TAU_SECONDS: 2.5,
};

export const GI = {
  BASELINE_INDEX: 50,
  // The direction FLIPS relative to the heart: sympathetic activity INHIBITS gut motility
  // while muscarinic activity STIMULATES it. Same two transmitters, opposite sign — the
  // single most commonly missed point about autonomic control.
  SYMPATHETIC_INHIBITION: 42,
  MUSCARINIC_STIMULATION: 48,
  MIN_INDEX: 0,
  MAX_INDEX: 100,
  TAU_SECONDS: 4,
};

export const BRONCHI = {
  BASELINE_PERCENT: 100,
  // Beta-2 relaxes bronchial smooth muscle (the basis of salbutamol); muscarinic M3
  // constricts it (the basis of ipratropium's benefit, and of organophosphate bronchospasm).
  BETA2_DILATION_PERCENT: 45,
  MUSCARINIC_CONSTRICTION_PERCENT: 55,
  MIN_PERCENT: 25,
  MAX_PERCENT: 160,
  TAU_SECONDS: 3,
};

export const SECRETION = {
  BASELINE_INDEX: 30,
  // Salivary, lacrimal, bronchial and GI secretions are all muscarinic — which is why
  // anticholinergics cause a dry mouth and cholinergic excess causes the SLUDGE picture.
  MUSCARINIC_GAIN: 65,
  SYMPATHETIC_GAIN: 12,
  MIN_INDEX: 0,
  MAX_INDEX: 100,
  TAU_SECONDS: 3,
};

export const ANS_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 3,
  /** Simulated seconds of settling applied before the first frame. See `settleSeconds`
   * on `EngineLoopConfig`: measured as the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 60,
};

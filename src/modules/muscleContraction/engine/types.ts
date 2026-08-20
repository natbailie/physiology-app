export type MuscleType = 'skeletal' | 'cardiac' | 'smooth';

export type ContractionMode = 'isometric' | 'isotonic';

export interface MuscleInputs {
  /** Stimulation frequency, Hz (0-100) — 0 means quiescent. Raising it walks the muscle from
   * single twitches through summation to unfused and finally fused tetanus. */
  stimulationFrequencyHz: number;
  /** Fraction of motor units recruited, 0-1 — the other half of force grading, independent of
   * rate coding. Small, slow units are recruited first (the size principle). */
  motorUnitRecruitment: number;
  /** Resting sarcomere length, µm (1.3-3.8) — sets where the muscle sits on its
   * length-tension curve before it is stimulated at all. */
  restingSarcomereLengthUm: number;
  /** Afterload, as a fraction of maximal isometric tension (0-1.5). Below the tension the
   * muscle can currently develop it shortens; at or above it, the contraction is isometric. */
  afterload: number;
  /** ATP availability, fraction 0-1. Needed by SERCA to pump calcium back and by myosin to
   * DETACH — which is why zero ATP gives rigor rather than flaccidity. */
  atpAvailability: number;
  /** Extracellular calcium, multiple of normal (0.5-2). Decisive for cardiac and smooth
   * muscle, which depend on calcium entry to trigger release; nearly irrelevant to skeletal
   * muscle, where the DHPR-RyR coupling is mechanical. */
  extracellularCalcium: number;
  /** Ryanodine receptor leak, 0-1 — caffeine, ryanodine, and the RYR1 mutation of malignant
   * hyperthermia. Drains the SR into the cytosol independently of stimulation. */
  ryrLeak: number;
  /** SERCA pump activity, fraction of normal (0-1.5). Sets how fast calcium is cleared and
   * therefore how fast the muscle relaxes. */
  sercaActivity: number;
  /** Which muscle type is being simulated — changes the coupling mechanism, the calcium
   * kinetics, and (decisively) the refractory period. */
  muscleType: MuscleType;
}

export interface MuscleState {
  simTimeSeconds: number;
  /** Cytosolic free calcium, µM — the plant variable. Force is never stored on state; it is
   * always derived from this, which is the entire point of the module. */
  cytosolicCalciumUM: number;
  /** Sarcoplasmic reticulum calcium store, fraction of full (0-1). Depleted by release and
   * refilled by SERCA, so sustained tetanus and RyR leak both make it fade. */
  srCalciumLoad: number;
  /** Fraction of cross-bridges attached and generating force (0-1). Lags calcium, because
   * troponin has to bind and the heads have to attach. */
  activeCrossBridgeFraction: number;
  /** Smooth-muscle latch bridges: dephosphorylated heads that stay attached and hold tension
   * after calcium has already fallen. Zero for skeletal and cardiac muscle. */
  latchFraction: number;
  /** Current sarcomere length, µm. Only shortens when the contraction is isotonic. */
  sarcomereLengthUm: number;
  /** Excitation signal at the triad, decaying fast — what actually opens the RyR. */
  excitationPulse: number;
  /** Countdown to the next scheduled stimulus from the frequency pacemaker, seconds. */
  timeToNextStimulusSeconds: number;
  /** Remaining refractory period, seconds. Long in cardiac muscle, which is why cardiac
   * muscle cannot be tetanized at any stimulation frequency. */
  refractoryRemainingSeconds: number;
}

export interface MuscleDerived {
  cytosolicCalciumUM: number;
  srCalciumLoad: number;
  /** Fraction of troponin-C sites occupied by calcium (or, for smooth muscle, the fraction of
   * myosin light chains phosphorylated by MLCK). The step between calcium and force. */
  troponinOccupancy: number;
  activeCrossBridgeFraction: number;
  latchFraction: number;
  /** Total force-generating capacity including latch bridges, 0-1. */
  activationFraction: number;
  sarcomereLengthUm: number;
  /** Position on the length-tension curve, 0-1 — filament overlap. */
  lengthTensionFactor: number;
  /** Maximal isometric tension the muscle could develop right now, % of maximum. */
  maxIsometricTension: number;
  /** Tension actually developed, % of maximum. Equals maxIsometricTension when isometric and
   * the afterload once the load has been lifted. */
  activeTension: number;
  /** Passive elastic tension from stretched titin and connective tissue, % of maximum. */
  passiveTension: number;
  totalTension: number;
  shorteningVelocityUmPerS: number;
  /** Tension x velocity — zero at both ends of the force-velocity curve. */
  powerOutput: number;
  contractionMode: ContractionMode;
  /** Effective interstimulus interval after refractoriness has discarded stimuli, ms. */
  effectiveStimulusIntervalMs: number;
  isTetanic: boolean;
  isFused: boolean;
  isInRigor: boolean;
  isLatched: boolean;
  /** Time to relax once stimulation stops, ms — set by SERCA and therefore by ATP. */
  relaxationTimeMs: number;
  activeMotorUnits: number;
  /** SERCA flux, µM/s — also the dominant ATP cost of a contraction. */
  calciumUptakeFlux: number;
  calciumReleaseFlux: number;
  /** Heat from ATP turnover, expressed as core temperature. Malignant hyperthermia is
   * exactly this: a futile release-and-repump cycle burning ATP. */
  temperatureC: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  stimulationFrequencyHz: number;
  motorUnitRecruitment: number;
  restingSarcomereLengthUm: number;
  afterload: number;
  atpAvailability: number;
  extracellularCalcium: number;
  ryrLeak: number;
  sercaActivity: number;
  muscleType: MuscleType;
}

export interface MuscleSnapshot {
  state: MuscleState;
  derived: MuscleDerived;
}

export interface MuscleHistoryPoint {
  t: number;
  calcium: number;
  tension: number;
  length: number;
}

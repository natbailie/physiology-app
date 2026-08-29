import type { MuscleType } from './types';

export const EXCITATION = {
  /** Amplitude of the excitation signal delivered to the triad by one action potential. */
  PULSE: 1,
  /** The signal is brief — the action potential is over long before force peaks, which is why
   * a twitch outlasts its own trigger by two orders of magnitude. */
  DECAY_TAU_SECONDS: 0.003,
};

export const CALCIUM = {
  /** Resting cytosolic free calcium, µM. Four orders of magnitude below the SR — maintaining
   * that gradient is most of what a resting muscle spends ATP on. */
  REST_UM: 0.1,
  MIN_UM: 0.005,
  MAX_UM: 8,
  /** Release flux per unit of excitation signal, µM/s. */
  RELEASE_FLUX_GAIN: 900,
  /** Standing SR leak, µM/s at a full store — balanced by SERCA at rest, and scaled by each
   * muscle type's SERCA density so all three rest at the same ~0.1 µM. It is also what makes
   * rigor develop: with no ATP, SERCA stops but the leak does not. */
  PASSIVE_LEAK_FLUX: 20,
  /** Extra leak per unit of ryrLeak, µM/s. Past ~0.6 it outruns SERCA and calcium climbs. */
  RYR_LEAK_FLUX_GAIN: 185,
  /** SERCA maximal pumping rate, µM/s, and its Michaelis constant, µM. */
  SERCA_VMAX_UM_PER_S: 120,
  SERCA_KM_UM: 0.5,
  /** Cytosolic calcium at which release shuts off completely, µM. Two real effects folded
   * into one term: the ryanodine receptor is inactivated by high cytosolic calcium, and the
   * SR-to-cytosol gradient driving release collapses as the cytosol fills. Without it, a
   * high-frequency tetanus would drive calcium up without limit instead of plateauing. */
  RELEASE_INACTIVATION_UM: 3,
  /** SR store size in cytosolic-equivalent µM — sets how many twitches deplete it. */
  SR_CAPACITY_UM: 80,
  /** Baseline relaxation time at normal SERCA and ATP, ms. */
  BASE_RELAXATION_MS: 40,
};

export const CROSS_BRIDGE = {
  /** Time constant for heads to attach once troponin has moved tropomyosin, seconds. This is
   * SLOW relative to the calcium transient, and the mismatch is why a single twitch develops
   * only a fraction of tetanic tension: calcium has already been re-sequestered before the
   * cross-bridges have finished attaching. Only sustained calcium lets force reach its ceiling. */
  ATTACH_TAU_SECONDS: 0.035,
  /** Detachment requires ATP to bind myosin. This base tau is DIVIDED by ATP availability, so
   * as ATP approaches zero the detachment time constant diverges and the heads stay locked —
   * rigor. Rigor is an ATP problem, not a calcium problem. */
  DETACH_TAU_SECONDS: 0.045,
  ATP_FLOOR: 0.001,
  /** Below this ATP, with bridges still attached, the muscle is reported as in rigor. */
  RIGOR_ATP_THRESHOLD: 0.05,
  RIGOR_BRIDGE_THRESHOLD: 0.4,
  /** Smooth-muscle latch bridges build slowly and release far more slowly still. */
  LATCH_ON_TAU_SECONDS: 0.8,
  LATCH_OFF_TAU_SECONDS: 6,
  LATCH_THRESHOLD: 0.25,
};

export const LENGTH_TENSION = {
  /** Gordon-Huxley landmarks, µm. Below 1.27 the thin filaments collide and overlap the wrong
   * half-sarcomere; 2.0-2.2 is optimal overlap; beyond 3.65 there is no overlap at all. */
  ZERO_ASCENDING_UM: 1.27,
  PLATEAU_START_UM: 2,
  PLATEAU_END_UM: 2.2,
  ZERO_DESCENDING_UM: 3.65,
  MIN_LENGTH_UM: 1.3,
  MAX_LENGTH_UM: 3.8,
  /** Passive tension from titin and connective tissue rises exponentially past the plateau —
   * which is why an intact muscle in the body never reaches the far descending limb. */
  PASSIVE_ONSET_UM: 2.2,
  PASSIVE_SCALE: 3,
  PASSIVE_EXPONENT: 2.2,
  /** How fast an unloaded muscle returns to its resting length, seconds. */
  RELENGTHEN_TAU_SECONDS: 0.12,
};

export const FORCE_VELOCITY = {
  /** Maximal unloaded shortening velocity, µm/s per sarcomere. */
  VMAX_UM_PER_S: 4,
  /** Hill's a/F0 ratio; b then follows as a·vmax/F0. ~0.25 for most vertebrate muscle. */
  A_FRACTION: 0.25,
};

export const MOTOR_UNIT = {
  TOTAL_UNITS: 120,
  /** Force rises slightly faster than recruitment because the size principle recruits the
   * small, weak, fatigue-resistant units first and the large, powerful ones last. */
  RECRUITMENT_EXPONENT: 1.25,
};

export const TENSION = {
  /** Tension is expressed as a percentage of maximal tetanic tension throughout. */
  MAX_PERCENT: 100,
};

export const HEAT = {
  GAIN_C: 3,
  /** The resting ATP turnover index, subtracted so a quiescent muscle sits at 37°C. */
  REST_INDEX: 0.17,
  NORMAL_TEMP_C: 37,
};

interface MuscleTypeProfile {
  releaseGain: number;
  /** 0 = release is independent of extracellular calcium (skeletal, mechanical DHPR-RyR
   * coupling); 1 = release scales with calcium entry (cardiac CICR, smooth influx). */
  extracellularDependence: number;
  sercaScale: number;
  /** The decisive difference. Cardiac muscle's refractory period outlasts its own twitch, so
   * a second stimulus can never arrive in time to summate — cardiac muscle cannot tetanize. */
  refractoryMs: number;
  twitchDurationMs: number;
  latchCapable: boolean;
  /** Hill coefficient and half-activation for the calcium-to-activation step. */
  activationHillN: number;
  activationHalfUM: number;
}

export const MUSCLE_TYPES: Record<MuscleType, MuscleTypeProfile> = {
  skeletal: {
    releaseGain: 1,
    extracellularDependence: 0,
    sercaScale: 1,
    refractoryMs: 5,
    twitchDurationMs: 130,
    latchCapable: false,
    // Half-activation sits well below the peak of the calcium transient but high enough that
    // the transient spends only ~15 ms above it — far less than the cross-bridge attachment
    // time constant, which is why a twitch reaches only about a third of tetanic tension.
    activationHillN: 3,
    activationHalfUM: 0.9,
  },
  cardiac: {
    releaseGain: 0.85,
    extracellularDependence: 1,
    sercaScale: 0.8,
    // The refractory period OUTLASTS the twitch — the ordering that makes tetanus impossible.
    refractoryMs: 280,
    twitchDurationMs: 250,
    latchCapable: false,
    // Cardiac muscle normally operates on the steep part of this curve rather than at
    // saturation, which is why changing calcium changes cardiac force at all — the cellular
    // basis of contractility as a controllable variable.
    activationHillN: 3,
    activationHalfUM: 0.75,
  },
  smooth: {
    releaseGain: 0.5,
    extracellularDependence: 1,
    // Slow SERCA plus latch bridges: smooth muscle holds tone for minutes at trivial ATP cost.
    sercaScale: 0.25,
    refractoryMs: 40,
    twitchDurationMs: 1200,
    latchCapable: true,
    activationHillN: 4,
    activationHalfUM: 0.45,
  },
};

export const MUSCLE_SIMULATION = {
  MAX_DT_SECONDS: 0.033,
  RENDER_INTERVAL_MS: 33,
  /** ~300 points at 33ms ≈ 10s of real time ≈ 500ms of simulated time — enough to hold a
   * whole twitch, or several cycles of a tetanus, in view at once. */
  HISTORY_CAPACITY: 300,
  /** Like the action potential module, this physiology is too FAST to watch rather than too
   * slow: a twitch is over in a tenth of a second. Run at 1/20 real time so the calcium
   * transient and the force it produces can be seen to be separate events. */
  TIME_SCALE: 0.05,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 60,
};

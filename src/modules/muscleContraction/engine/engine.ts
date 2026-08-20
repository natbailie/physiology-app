import { CALCIUM, CROSS_BRIDGE, EXCITATION, HEAT, LENGTH_TENSION, MUSCLE_TYPES, TENSION } from './constants';
import { releaseFlux } from './calciumRelease';
import { relaxationTimeMs, uptakeFlux } from './calciumReuptake';
import { activationFraction, crossBridgeTau, isInRigor, latchTarget, troponinOccupancy } from './crossBridge';
import { clampSarcomereLength, lengthTensionFactor, passiveTension } from './lengthTension';
import { contractionMode, developedTension, shorteningVelocity } from './forceVelocity';
import { activeMotorUnits, effectiveStimulusIntervalMs, isFused, isTetanic, recruitmentFactor } from './motorUnit';
import { approach, clamp } from '@/shared/lib/math';
import type { MuscleDerived, MuscleInputs, MuscleSnapshot, MuscleState } from './types';

export function createInitialState(): MuscleState {
  return {
    simTimeSeconds: 0,
    cytosolicCalciumUM: CALCIUM.REST_UM,
    srCalciumLoad: 1,
    activeCrossBridgeFraction: 0,
    latchFraction: 0,
    sarcomereLengthUm: 2.1,
    excitationPulse: 0,
    timeToNextStimulusSeconds: 0,
    refractoryRemainingSeconds: 0,
  };
}

/**
 * Every force quantity in this module is DERIVED from the calcium concentration carried on
 * state — never stored. That is the point of the module: excitation and contraction are
 * separate events joined by a calcium transient, and the lag between them is visible precisely
 * because force is recomputed from calcium rather than tracked alongside it.
 */
export function computeDerived(state: MuscleState, inputs: MuscleInputs): MuscleDerived {
  const occupancy = troponinOccupancy(state.cytosolicCalciumUM, inputs.muscleType);
  const activation = activationFraction(state.activeCrossBridgeFraction, state.latchFraction);
  const overlap = lengthTensionFactor(state.sarcomereLengthUm);

  // The three independent determinants of how much force this muscle can make right now:
  // how activated it is, how well its filaments overlap, and how many units are switched on.
  const maxIsometricTension = TENSION.MAX_PERCENT * activation * overlap * recruitmentFactor(inputs.motorUnitRecruitment);

  const load = inputs.afterload * TENSION.MAX_PERCENT;
  const mode = contractionMode(maxIsometricTension, load);
  const activeTension = developedTension(maxIsometricTension, load);
  const velocity = shorteningVelocity(maxIsometricTension, load);
  const passive = passiveTension(state.sarcomereLengthUm);

  const uptake = uptakeFlux(state.cytosolicCalciumUM, inputs.sercaActivity, inputs.atpAvailability, inputs.muscleType);
  const release = releaseFlux(
    state.excitationPulse,
    state.cytosolicCalciumUM,
    state.srCalciumLoad,
    inputs.muscleType,
    inputs.extracellularCalcium,
    inputs.ryrLeak,
  );

  // Heat is the honest accounting of ATP turnover: what SERCA burns re-sequestering calcium plus
  // what the cross-bridges burn cycling. Malignant hyperthermia is a futile version of exactly
  // this loop — calcium leaks out, SERCA pumps it back, and the muscle cooks itself.
  const turnoverIndex = uptake / CALCIUM.SERCA_VMAX_UM_PER_S + state.activeCrossBridgeFraction * inputs.atpAvailability;
  const interval = effectiveStimulusIntervalMs(inputs.stimulationFrequencyHz, inputs.muscleType);

  return {
    cytosolicCalciumUM: state.cytosolicCalciumUM,
    srCalciumLoad: state.srCalciumLoad,
    troponinOccupancy: occupancy,
    activeCrossBridgeFraction: state.activeCrossBridgeFraction,
    latchFraction: state.latchFraction,
    activationFraction: activation,
    sarcomereLengthUm: state.sarcomereLengthUm,
    lengthTensionFactor: overlap,
    maxIsometricTension,
    activeTension,
    passiveTension: passive,
    totalTension: activeTension + passive,
    shorteningVelocityUmPerS: velocity,
    powerOutput: activeTension * velocity,
    contractionMode: mode,
    effectiveStimulusIntervalMs: interval,
    isTetanic: isTetanic(interval, inputs.muscleType),
    isFused: isFused(interval, inputs.muscleType),
    isInRigor: isInRigor(state.activeCrossBridgeFraction, inputs.atpAvailability),
    isLatched: MUSCLE_TYPES[inputs.muscleType].latchCapable && state.latchFraction > CROSS_BRIDGE.LATCH_THRESHOLD,
    relaxationTimeMs: relaxationTimeMs(inputs.sercaActivity, inputs.atpAvailability, inputs.muscleType),
    activeMotorUnits: activeMotorUnits(inputs.motorUnitRecruitment),
    calciumUptakeFlux: uptake,
    calciumReleaseFlux: release,
    temperatureC: HEAT.NORMAL_TEMP_C + HEAT.GAIN_C * Math.max(0, turnoverIndex - HEAT.REST_INDEX),
    stimulationFrequencyHz: inputs.stimulationFrequencyHz,
    motorUnitRecruitment: inputs.motorUnitRecruitment,
    restingSarcomereLengthUm: inputs.restingSarcomereLengthUm,
    afterload: inputs.afterload,
    atpAvailability: inputs.atpAvailability,
    extracellularCalcium: inputs.extracellularCalcium,
    ryrLeak: inputs.ryrLeak,
    sercaActivity: inputs.sercaActivity,
    muscleType: inputs.muscleType,
  };
}

export function tick(state: MuscleState, derived: MuscleDerived, dtSeconds: number): MuscleState {
  const profile = MUSCLE_TYPES[derived.muscleType];

  // --- The frequency pacemaker, gated by refractoriness ---
  let refractoryRemaining = Math.max(0, state.refractoryRemainingSeconds - dtSeconds);
  let timeToNext = state.timeToNextStimulusSeconds - dtSeconds;
  let excitationPulse = state.excitationPulse;

  if (derived.stimulationFrequencyHz > 0) {
    if (timeToNext <= 0) {
      timeToNext += 1 / derived.stimulationFrequencyHz;
      // Stimuli arriving during the refractory period are simply lost. In cardiac muscle that
      // window outlasts the twitch, so no amount of stimulation produces tetanus.
      if (refractoryRemaining <= 0) {
        excitationPulse += EXCITATION.PULSE;
        refractoryRemaining = profile.refractoryMs / 1000;
      }
    }
  } else {
    timeToNext = 0;
  }
  excitationPulse = approach(excitationPulse, 0, dtSeconds, EXCITATION.DECAY_TAU_SECONDS);

  // --- Calcium: release minus reuptake, with the SR store conserved between them ---
  const netCalciumFlux = derived.calciumReleaseFlux - derived.calciumUptakeFlux;
  const cytosolicCalciumUM = clamp(
    state.cytosolicCalciumUM + netCalciumFlux * dtSeconds,
    CALCIUM.MIN_UM,
    CALCIUM.MAX_UM,
  );
  const srCalciumLoad = clamp(state.srCalciumLoad - (netCalciumFlux / CALCIUM.SR_CAPACITY_UM) * dtSeconds, 0, 1);

  // --- Cross-bridges follow troponin, but attach fast and detach only as fast as ATP allows ---
  const bridgeTarget = derived.troponinOccupancy;
  const isAttaching = bridgeTarget > state.activeCrossBridgeFraction;
  const activeCrossBridgeFraction = clamp(
    approach(state.activeCrossBridgeFraction, bridgeTarget, dtSeconds, crossBridgeTau(isAttaching, derived.atpAvailability)),
    0,
    1,
  );

  const target = latchTarget(activeCrossBridgeFraction, derived.muscleType);
  const latchTau = target > state.latchFraction ? CROSS_BRIDGE.LATCH_ON_TAU_SECONDS : CROSS_BRIDGE.LATCH_OFF_TAU_SECONDS;
  // Striated muscle has no latch mechanism at all, so switching type away from smooth must
  // clear it outright rather than let it decay — otherwise a skeletal muscle would briefly
  // inherit tone it has no way of producing.
  const latchFraction = MUSCLE_TYPES[derived.muscleType].latchCapable
    ? clamp(approach(state.latchFraction, target, dtSeconds, latchTau), 0, 1)
    : 0;

  // --- Shortening, and relengthening once the muscle can no longer hold the load ---
  const sarcomereLengthUm =
    derived.contractionMode === 'isotonic'
      ? clampSarcomereLength(state.sarcomereLengthUm - derived.shorteningVelocityUmPerS * dtSeconds)
      : clampSarcomereLength(
          approach(state.sarcomereLengthUm, derived.restingSarcomereLengthUm, dtSeconds, LENGTH_TENSION.RELENGTHEN_TAU_SECONDS),
        );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    cytosolicCalciumUM,
    srCalciumLoad,
    activeCrossBridgeFraction,
    latchFraction,
    sarcomereLengthUm,
    excitationPulse,
    timeToNextStimulusSeconds: timeToNext,
    refractoryRemainingSeconds: refractoryRemaining,
  };
}

export function step(state: MuscleState, inputs: MuscleInputs, dtSeconds: number): MuscleSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Stimulate" — one action potential arriving at the triad. Deliberately not gated by the
 * refractory period: it represents the user's own stimulating electrode, not a paced train. */
export function perturbStimulate(state: MuscleState): MuscleState {
  return { ...state, excitationPulse: state.excitationPulse + EXCITATION.PULSE };
}

/** "Caffeine" — sensitizes the ryanodine receptor, dumping SR calcium into the cytosol without
 * any excitation at all. The same mechanism as malignant hyperthermia, at a lower dose. */
export function perturbCaffeine(state: MuscleState, fraction = 0.35): MuscleState {
  const dumped = state.srCalciumLoad * fraction * CALCIUM.SR_CAPACITY_UM * 0.05;
  return {
    ...state,
    cytosolicCalciumUM: clamp(state.cytosolicCalciumUM + dumped, CALCIUM.MIN_UM, CALCIUM.MAX_UM),
    srCalciumLoad: clamp(state.srCalciumLoad * (1 - fraction * 0.05), 0, 1),
  };
}

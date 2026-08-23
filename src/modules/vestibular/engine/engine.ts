import { CANAL, HEAD_IMPULSE, HALLPIKE, VESTIBULAR_SIMULATION } from './constants';
import {
  canalFiring,
  classifyVestibular,
  cupulaDeflection,
  oscillopsiaPct,
  patternSummary,
  positionalNystagmusPct,
  rombergUnsteadinessPct,
  spontaneousSlowPhaseVelocity,
  vertigoIntensity,
  vorGain,
} from './vestibularMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { VestibularDerived, VestibularInputs, VestibularInternalState, VestibularSnapshot } from './types';

/** Irritative firing adds ABOVE resting rate — the opposite of a destructive lesion. */
const IRRITATIVE_MAX_SPIKES_PER_SEC = CANAL.RESTING_FIRING_SPIKES_PER_SEC * 0.7;

export function createInitialState(): VestibularInternalState {
  return {
    simTimeSeconds: 0,
    endolymphVelDegPerSec: 0,
    hallpikeSecondsRemaining: 0,
    hallpikeElapsedSeconds: 0,
    impulseSecondsRemaining: 0,
  };
}

export function computeDerived(state: VestibularInternalState, inputs: VestibularInputs): VestibularDerived {
  // During a head-impulse the effective head velocity is the brief test thrust.
  const effectiveHeadVel =
    state.impulseSecondsRemaining > 0 ? HEAD_IMPULSE.VELOCITY_DEG_S : inputs.headTurnVelocityDegPerSec;

  const deflection = cupulaDeflection(effectiveHeadVel, state.endolymphVelDegPerSec);
  const firingRight = canalFiring(deflection, inputs.rightCanalFunction);
  const firingLeft =
    canalFiring(-deflection, inputs.leftCanalFunction) +
    clamp(inputs.irritativeDriveLeft, 0, 1) * IRRITATIVE_MAX_SPIKES_PER_SEC;

  const imbalance = firingRight - firingLeft;
  const spv = spontaneousSlowPhaseVelocity(imbalance, inputs.centralCompensation);
  const positional = positionalNystagmusPct(state, inputs.canalithDebris);
  const gain = vorGain(inputs.rightCanalFunction, inputs.leftCanalFunction);

  const bothCanalsBelow =
    clamp(inputs.rightCanalFunction, 0, 1) < 0.3 && clamp(inputs.leftCanalFunction, 0, 1) < 0.3;
  const acuteUnilateral =
    (clamp(inputs.rightCanalFunction, 0, 1) < 0.4 || clamp(inputs.leftCanalFunction, 0, 1) < 0.4) &&
    !bothCanalsBelow &&
    clamp(inputs.centralCompensation, 0, 1) < 0.5 &&
    clamp(inputs.irritativeDriveLeft, 0, 1) < 0.2;
  const classificationPattern = {
    positionalNystagmusPct: positional,
    bothCanalsBelow,
    irritativeDriveLeft: clamp(inputs.irritativeDriveLeft, 0, 1),
    acuteUnilateral,
  };
  const classification = classifyVestibular(classificationPattern);

  return {
    cupulaDeflection: deflection,
    canalFiringRightSpikesPerSec: firingRight,
    canalFiringLeftSpikesPerSec: firingLeft,
    firingImbalanceSpikesPerSec: imbalance,
    slowPhaseVelocityDegPerSec: spv,
    vertigoIntensityPct: clamp(vertigoIntensity(spv) + positional * 0.8, 0, 100),
    vorGain: gain,
    oscillopsiaPct: oscillopsiaPct(effectiveHeadVel, gain),
    rombergUnsteadinessPct: rombergUnsteadinessPct(inputs),
    positionalNystagmusPct: positional,
    headImpulsePositive:
      state.impulseSecondsRemaining > 0 && gain < HEAD_IMPULSE.ABNORMAL_BELOW_GAIN,
    classification,
    patternSummary: patternSummary({
      classification,
      slowPhaseVelocityDegPerSec: spv,
      vertigoIntensityPct: vertigoIntensity(spv),
      vorGain: gain,
      rombergUnsteadinessPct: rombergUnsteadinessPct(inputs),
      oscillopsiaPct: oscillopsiaPct(effectiveHeadVel, gain),
    }),
    headTurnVelocityDegPerSec: effectiveHeadVel,
    centralCompensation: inputs.centralCompensation,
  };
}

export function tick(
  state: VestibularInternalState,
  derived: VestibularDerived,
  dtSeconds: number,
): VestibularInternalState {
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // The endolymph follows the head with inertia; the cupula reads only their difference.
    endolymphVelDegPerSec: approach(
      state.endolymphVelDegPerSec,
      derived.headTurnVelocityDegPerSec,
      dtSeconds,
      CANAL.ENDOLYMPH_TAU_SECONDS,
    ),
    hallpikeSecondsRemaining: Math.max(0, state.hallpikeSecondsRemaining - dtSeconds),
    hallpikeElapsedSeconds:
      state.hallpikeSecondsRemaining > 0 ? state.hallpikeElapsedSeconds + dtSeconds : 0,
    impulseSecondsRemaining: Math.max(0, state.impulseSecondsRemaining - dtSeconds),
  };
}

export function step(state: VestibularInternalState, inputs: VestibularInputs, dtSeconds: number): VestibularSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Dix-Hallpike: head hung 45 degrees below horizontal to provoke a posterior canal. */
export function perturbPerformHallpike(state: VestibularInternalState): VestibularInternalState {
  return {
    ...state,
    hallpikeSecondsRemaining: HALLPIKE.HOLD_SECONDS,
    hallpikeElapsedSeconds: 0,
    impulseSecondsRemaining: 0,
  };
}

/** Head-impulse test: a brief high-acceleration turn the VOR must cancel. */
export function perturbHeadImpulse(state: VestibularInternalState): VestibularInternalState {
  return { ...state, impulseSecondsRemaining: HEAD_IMPULSE.DURATION_SECONDS };
}

export { VESTIBULAR_SIMULATION };

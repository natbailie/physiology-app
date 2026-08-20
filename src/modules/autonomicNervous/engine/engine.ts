import { BRONCHI, GI, HEART, PUPIL, SECOND_MESSENGER, SECRETION } from './constants';
import { receptorActivations } from './receptorActivation';
import { campTarget, ip3CalciumTarget } from './secondMessenger';
import { bronchialDiameterPercent, giMotilityIndex, heartRateBpm, pupilDiameterMm, secretionIndex } from './organEffectors';
import { approach, clamp, scaleClamped } from '@/shared/lib/math';
import type { AnsDerived, AnsInputs, AnsSnapshot, AnsState } from './types';

/** Effector state is stored normalized 0..1 and mapped back to real units in computeDerived,
 * so every actuator can share the same `approach` smoothing regardless of its output units. */
function normalize(value: number, min: number, max: number): number {
  return scaleClamped(value, min, max, 0, 1);
}

function denormalize(fraction: number, min: number, max: number): number {
  return min + clamp(fraction, 0, 1) * (max - min);
}

export function createInitialState(): AnsState {
  return {
    simTimeSeconds: 0,
    campLevel: 0,
    ip3CalciumLevel: 0,
    heartRateEffect: normalize(70, HEART.MIN_BPM, HEART.MAX_BPM),
    pupilEffect: normalize(PUPIL.BASELINE_MM, PUPIL.MIN_MM, PUPIL.MAX_MM),
    giMotilityEffect: normalize(GI.BASELINE_INDEX, GI.MIN_INDEX, GI.MAX_INDEX),
    bronchialToneEffect: normalize(BRONCHI.BASELINE_PERCENT, BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT),
    secretionEffect: normalize(SECRETION.BASELINE_INDEX, SECRETION.MIN_INDEX, SECRETION.MAX_INDEX),
  };
}

/**
 * Computes receptor activations and the resulting organ outputs. The receptor and
 * second-messenger layers are instantaneous functions of the inputs; the ORGAN outputs come
 * from the smoothed effector state, so each organ responds with its own latency (the heart
 * within seconds, the gut more sluggishly) rather than snapping instantly.
 */
export function computeDerived(state: AnsState, inputs: AnsInputs): AnsDerived {
  const receptors = receptorActivations(
    inputs.sympatheticTone,
    inputs.parasympatheticTone,
    inputs.circulatingEpinephrine,
    inputs.alphaBlockade,
    inputs.betaBlockade,
    inputs.muscarinicBlockade,
    inputs.cholinesteraseInhibition,
  );

  const sympatheticDrive = Math.max(receptors.alpha1, receptors.beta1);

  return {
    alpha1Activation: receptors.alpha1,
    beta1Activation: receptors.beta1,
    beta2Activation: receptors.beta2,
    muscarinicActivation: receptors.muscarinic,
    campLevel: state.campLevel,
    ip3CalciumLevel: state.ip3CalciumLevel,
    heartRateBpm: denormalize(state.heartRateEffect, HEART.MIN_BPM, HEART.MAX_BPM),
    pupilDiameterMm: denormalize(state.pupilEffect, PUPIL.MIN_MM, PUPIL.MAX_MM),
    giMotilityIndex: denormalize(state.giMotilityEffect, GI.MIN_INDEX, GI.MAX_INDEX),
    bronchialDiameterPercent: denormalize(state.bronchialToneEffect, BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT),
    secretionIndex: denormalize(state.secretionEffect, SECRETION.MIN_INDEX, SECRETION.MAX_INDEX),
    autonomicBalance: clamp(sympatheticDrive - receptors.muscarinic, -1, 1),
    sympatheticTone: inputs.sympatheticTone,
    parasympatheticTone: inputs.parasympatheticTone,
    circulatingEpinephrine: inputs.circulatingEpinephrine,
    betaBlockade: inputs.betaBlockade,
    muscarinicBlockade: inputs.muscarinicBlockade,
    alphaBlockade: inputs.alphaBlockade,
    cholinesteraseInhibition: inputs.cholinesteraseInhibition,
  };
}

export function tick(state: AnsState, derived: AnsDerived, dtSeconds: number): AnsState {
  const receptors = {
    alpha1: derived.alpha1Activation,
    beta1: derived.beta1Activation,
    beta2: derived.beta2Activation,
    muscarinic: derived.muscarinicActivation,
  };

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    campLevel: approach(state.campLevel, campTarget(receptors), dtSeconds, SECOND_MESSENGER.TAU_SECONDS),
    ip3CalciumLevel: approach(state.ip3CalciumLevel, ip3CalciumTarget(receptors), dtSeconds, SECOND_MESSENGER.TAU_SECONDS),
    heartRateEffect: approach(
      state.heartRateEffect,
      normalize(heartRateBpm(receptors), HEART.MIN_BPM, HEART.MAX_BPM),
      dtSeconds,
      HEART.TAU_SECONDS,
    ),
    pupilEffect: approach(state.pupilEffect, normalize(pupilDiameterMm(receptors), PUPIL.MIN_MM, PUPIL.MAX_MM), dtSeconds, PUPIL.TAU_SECONDS),
    giMotilityEffect: approach(
      state.giMotilityEffect,
      normalize(giMotilityIndex(receptors), GI.MIN_INDEX, GI.MAX_INDEX),
      dtSeconds,
      GI.TAU_SECONDS,
    ),
    bronchialToneEffect: approach(
      state.bronchialToneEffect,
      normalize(bronchialDiameterPercent(receptors), BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT),
      dtSeconds,
      BRONCHI.TAU_SECONDS,
    ),
    secretionEffect: approach(
      state.secretionEffect,
      normalize(secretionIndex(receptors), SECRETION.MIN_INDEX, SECRETION.MAX_INDEX),
      dtSeconds,
      SECRETION.TAU_SECONDS,
    ),
  };
}

export function step(state: AnsState, inputs: AnsInputs, dtSeconds: number): AnsSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

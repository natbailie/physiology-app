import { CATECHOLAMINE, HAEMODYNAMICS, MEDULLA_SIMULATION, VOLUME } from './constants';
import {
  arrhythmiaRisk,
  classifyMedulla,
  heartRateFromCatecholamines,
  mapFromCatecholamines,
  orthostaticDrop,
  patternSummary,
  triadCount,
} from './medullaMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { MedullaDerived, MedullaInputs, MedullaInternalState, MedullaSnapshot } from './types';

export function createInitialState(): MedullaInternalState {
  return {
    simTimeSeconds: 0,
    plasmaNa: CATECHOLAMINE.BASELINE_NA,
    plasmaAd: CATECHOLAMINE.BASELINE_AD,
    mapMmHg: HAEMODYNAMICS.BASE_MAP_MMHG,
    heartRateBpm: HAEMODYNAMICS.BASE_HR_BPM,
    bloodVolumePct: 100,
    paroxysmSecondsRemaining: 0,
    paroxysmIntensity: 0,
  };
}

export function computeDerived(state: MedullaInternalState, inputs: MedullaInputs): MedullaDerived {
  const triad = triadCount(state.mapMmHg, state.plasmaAd, state.heartRateBpm);
  const classificationPattern = {
    tumourSecretionRate: inputs.tumourSecretionRate,
    naFractionPct: inputs.noradrenalineFractionPct,
    mapMmHg: state.mapMmHg,
    paroxysmActive: state.paroxysmSecondsRemaining > 0,
    alphaBlockPct: clamp(inputs.alphaBlockadePct, 0, 100),
    betaBlockPct: clamp(inputs.betaBlockadePct, 0, 100),
  };
  const classification = classifyMedulla(classificationPattern);

  return {
    plasmaNa: state.plasmaNa,
    plasmaAd: state.plasmaAd,
    mapMmHg: state.mapMmHg,
    heartRateBpm: state.heartRateBpm,
    bloodVolumePct: state.bloodVolumePct,
    orthostaticDropMmHg: orthostaticDrop(state.bloodVolumePct),
    arrhythmiaRiskPct: arrhythmiaRisk(
      state.plasmaAd,
      state.heartRateBpm,
      inputs.betaBlockadePct,
      inputs.alphaBlockadePct,
    ),
    triadHeadache: triad.headache,
    triadSweating: triad.sweating,
    triadPalpitations: triad.palpitations,
    triadCount: triad.count,
    paroxysmActive: state.paroxysmSecondsRemaining > 0,
    classification,
    patternSummary: patternSummary({
      classification,
      mapMmHg: state.mapMmHg,
      heartRateBpm: state.heartRateBpm,
      orthostaticDropMmHg: orthostaticDrop(state.bloodVolumePct),
      naFractionPct: inputs.noradrenalineFractionPct,
      triadCount: triad.count,
    }),
  };
}

export function tick(
  state: MedullaInternalState,
  inputs: MedullaInputs,
  dtSeconds: number,
): MedullaInternalState {
  const secretion = (inputs.tumourSecretionRate / 100) * CATECHOLAMINE.TUMOUR_GAIN;
  const paroxysmBoost = state.paroxysmIntensity;
  const naShare = clamp(inputs.noradrenalineFractionPct / 100, 0, 1);

  const naTarget = CATECHOLAMINE.BASELINE_NA + (secretion + paroxysmBoost) * naShare * 10;
  const adTarget = CATECHOLAMINE.BASELINE_AD + (secretion + paroxysmBoost) * (1 - naShare) * 10;

  const na = approach(state.plasmaNa, naTarget, dtSeconds, CATECHOLAMINE.CLEARANCE_TAU_SECONDS);
  const ad = approach(state.plasmaAd, adTarget, dtSeconds, CATECHOLAMINE.CLEARANCE_TAU_SECONDS);

  const mapTarget = mapFromCatecholamines(na, ad, inputs.alphaBlockadePct, inputs.betaBlockadePct);
  const hrTarget = heartRateFromCatecholamines(na, ad, mapTarget, inputs.betaBlockadePct);

  // Chronic vasoconstriction contracts the volume — the source of orthostatic hypotension.
  const chronicConstriction = clamp((na + ad) / 200, 0, 1) * clamp(inputs.tumourSecretionRate / 60, 0, 1);
  const volumeTarget = 100 - chronicConstriction * VOLUME.CONTRACTION_PER_CHRONIC_UNIT * 100;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    plasmaNa: na,
    plasmaAd: ad,
    mapMmHg: approach(state.mapMmHg, mapTarget, dtSeconds, 30),
    heartRateBpm: approach(state.heartRateBpm, hrTarget, dtSeconds, 20),
    bloodVolumePct: approach(state.bloodVolumePct, volumeTarget, dtSeconds, VOLUME.CHRONIC_TAU_SECONDS),
    paroxysmSecondsRemaining: Math.max(0, state.paroxysmSecondsRemaining - dtSeconds),
    paroxysmIntensity:
      state.paroxysmSecondsRemaining > 0
        ? state.paroxysmIntensity * Math.exp(-dtSeconds / CATECHOLAMINE.PAROXYSM_TAU_SECONDS)
        : 0,
  };
}

export function step(state: MedullaInternalState, inputs: MedullaInputs, dtSeconds: number): MedullaSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

/** A spontaneous paroxysm of secretion. */
export function perturbParoxysm(state: MedullaInternalState): MedullaInternalState {
  return {
    ...state,
    paroxysmSecondsRemaining: 3600,
    paroxysmIntensity: CATECHOLAMINE.PAROXYSM_BURST,
  };
}

export { MEDULLA_SIMULATION };

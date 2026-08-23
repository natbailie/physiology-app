import { AUDIOGRAM_FREQS_HZ, HEARING_SIMULATION, NOISE, PTA_FREQS_HZ, STAPEDIUS } from './constants';
import {
  airConductionThresholdDb,
  classifyHearing,
  loudnessFraction,
  patternSummary,
  rinneResult,
  sensorineuralThresholdDb,
  speechDiscriminationPct,
  stapediusTarget,
  weberCode,
  weberResult,
} from './cochlearMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { HearingDerived, HearingInputs, HearingInternalState, HearingSnapshot } from './types';

export function createInitialState(): HearingInternalState {
  return {
    simTimeSeconds: 0,
    temporaryThresholdShiftDb: 0,
    stapediusContraction: 0,
  };
}

export function computeDerived(state: HearingInternalState, inputs: HearingInputs): HearingDerived {
  const airConductionDb: number[] = [];
  const boneConductionDb: number[] = [];

  for (const f of AUDIOGRAM_FREQS_HZ) {
    const sensorineural = sensorineuralThresholdDb(f, inputs, state.temporaryThresholdShiftDb);
    boneConductionDb.push(sensorineural);
    airConductionDb.push(airConductionThresholdDb(sensorineural, inputs.conductiveLossDb));
  }

  const ptaIndex = (f: number) => AUDIOGRAM_FREQS_HZ.indexOf(f as (typeof AUDIOGRAM_FREQS_HZ)[number]);
  const ptaAir =
    PTA_FREQS_HZ.reduce((sum, f) => sum + (airConductionDb[ptaIndex(f)] ?? 0), 0) / PTA_FREQS_HZ.length;
  const ptaBone =
    PTA_FREQS_HZ.reduce((sum, f) => sum + (boneConductionDb[ptaIndex(f)] ?? 0), 0) / PTA_FREQS_HZ.length;
  const conductive = clamp(inputs.conductiveLossDb, 0, 60);

  // The stimulus is attenuated by whatever stands between it and the cochlea, then partly
  // reclaimed by the stapedius reflex at high levels.
  const stimulusSensorineural = sensorineuralThresholdDb(
    inputs.stimulusFrequencyHz,
    inputs,
    state.temporaryThresholdShiftDb,
  );
  const stimulusAttenuation = inputs.conductiveLossDb + stimulusSensorineural;
  const effectiveLevel = inputs.stimulusLevelDbHl - STAPEDIUS.MAX_ATTENUATION_DB * state.stapediusContraction * 0.5;
  const sensationLevelDb = effectiveLevel - stimulusAttenuation;

  const ohcDeficitAtStimulus = clamp(1 - inputs.outerHairCellIntegrity, 0, 1) *
    (0.4 + 0.6 * Math.min(1, inputs.stimulusFrequencyHz / 4000));
  const { loudnessPct, recruitmentIndex } = loudnessFraction(sensationLevelDb, ohcDeficitAtStimulus);

  const discrimination = speechDiscriminationPct(inputs, state.temporaryThresholdShiftDb, airConductionDb);
  const wCode = weberCode(ptaAir, conductive);
  const worstBone = Math.max(...boneConductionDb);
  const classificationPattern = {
    classification: classifyHearing({ conductiveDb: conductive, sensorineuralPtaDb: ptaBone, worstSensorineuralDb: worstBone }),
  };

  return {
    airConductionDb,
    boneConductionDb,
    ptaDb: ptaAir,
    airBoneGapDb: conductive,
    sensorineuralLossAtStimulusDb: stimulusSensorineural,
    sensationLevelDb,
    loudnessPct,
    recruitmentIndex,
    speechDiscriminationPct: discrimination,
    rinneResult: rinneResult(conductive),
    weberCode: wCode,
    weberResult: weberResult(wCode),
    stapediusActive: state.stapediusContraction > 0.15,
    ...classificationPattern,
    patternSummary: patternSummary({
      ...classificationPattern,
      ptaDb: ptaAir,
      gapDb: conductive,
      recruitmentIndex,
      discriminationPct: discrimination,
      weberCode: wCode,
    }),
    stimulusFrequencyHz: inputs.stimulusFrequencyHz,
    stimulusLevelDbHl: inputs.stimulusLevelDbHl,
  };
}

export function tick(
  state: HearingInternalState,
  derived: HearingDerived,
  dtSeconds: number,
): HearingInternalState {
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // Temporary threshold shift decays over simulated hours; permanent damage does not.
    temporaryThresholdShiftDb:
      state.temporaryThresholdShiftDb *
      Math.exp(-dtSeconds / NOISE.DECAY_TAU_SECONDS),
    stapediusContraction: approach(
      state.stapediusContraction,
      stapediusTarget(derived.stimulusLevelDbHl),
      dtSeconds,
      STAPEDIUS.TAU_SECONDS,
    ),
  };
}

export function step(state: HearingInternalState, inputs: HearingInputs, dtSeconds: number): HearingSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** A night at a loud concert without protection: a temporary threshold shift that decays. */
export function perturbNoiseExposure(state: HearingInternalState): HearingInternalState {
  return {
    ...state,
    temporaryThresholdShiftDb: Math.min(NOISE.MAX_TTS_DB, state.temporaryThresholdShiftDb + NOISE.EXPOSURE_TTS_DB),
  };
}

export { HEARING_SIMULATION };

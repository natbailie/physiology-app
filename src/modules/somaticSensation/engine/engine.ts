import { EVENTS, PAIN, SOMATIC_SIMULATION } from './constants';
import {
  FIRST_PAIN_LATENCY_MS,
  SECOND_PAIN_LATENCY_MS,
  TOUCH_LATENCY_MS,
  applyBlock,
  classifySomatic,
  gateOpenFraction,
  modalityMap,
  painRatingTarget,
  patternSummary,
  transmissionCellOutput,
  windupMultiplier,
} from './somaticMechanics';
import { BLOCK } from './constants';
import { approach, clamp } from '@/shared/lib/math';
import type { SomaticDerived, SomaticInputs, SomaticInternalState, SomaticSnapshot } from './types';

export function createInitialState(): SomaticInternalState {
  return {
    simTimeSeconds: 0,
    painRating: 0,
    sensitisationAccumulated: 0,
    centralAmplification: 0,
    injuryBurst: 0,
    opioidBurst: 0,
  };
}

export function computeDerived(state: SomaticInternalState, inputs: SomaticInputs): SomaticDerived {
  const block = clamp(inputs.localAnaestheticBlock, 0, 100) / 100;
  const sensitisation =
    clamp(inputs.peripheralSensitisation, 0, 100) / 100 * clamp(state.sensitisationAccumulated * 1.6, 0, 1);
  const cRawTraffic = applyBlock(inputs.nociceptiveStimulusDrive + state.injuryBurst, block, BLOCK.C_VULNERABILITY);
  const adTraffic = applyBlock(inputs.nociceptiveStimulusDrive + state.injuryBurst * 0.8, block, BLOCK.AD_VULNERABILITY);
  const abTraffic = applyBlock(inputs.touchStimulusDrive + inputs.rubbingGateDrive * 0.3, block, BLOCK.AB_VULNERABILITY);

  // Sensitised C-terminals are recruited by Aβ input directly — touch arrives through pain
  // fibres, which is why it hurts rather than merely opening the gate wider.
  const allodynicTraffic = abTraffic * sensitisation * PAIN.ALLODYNIA_GAIN;
  const cTraffic = cRawTraffic + allodynicTraffic;

  const allodyniaActive = allodynicTraffic > 8 && clamp(inputs.windUpGain, 0, 100) > 40;

  const gate = gateOpenFraction({
    abTraffic,
    adDeltaTraffic: adTraffic,
    cFibreTraffic: cTraffic,
    rubbing: inputs.rubbingGateDrive,
    descending: inputs.descendingModulation,
    opioidBurst: state.opioidBurst,
    allodynicDrive: 0,
  });

  const output = transmissionCellOutput(
    gate,
    cTraffic,
    adTraffic,
    windupMultiplier(state.centralAmplification * clamp(inputs.windUpGain, 0, 100) / 100),
  );
  const ratingTarget = painRatingTarget(output);
  const map = modalityMap(inputs);

  const sL = clamp(inputs.leftHemisectionSeverity, 0, 100);
  const sR = clamp(inputs.rightHemisectionSeverity, 0, 100);
  const ant = clamp(inputs.anteriorQuadrantSeverity, 0, 100);
  const classificationPattern = {
    sL,
    sR,
    ant,
    central: clamp(inputs.centralCanalSeverity, 0, 100),
    block: clamp(inputs.localAnaestheticBlock, 0, 100),
    allodyniaActive,
    nociceptiveDrive: inputs.nociceptiveStimulusDrive,
  };

  return {
    ...map,
    abTraffic,
    adDeltaTraffic: adTraffic,
    cFibreTraffic: cTraffic,
    gateOpenFraction: gate,
    transmissionCellOutput: output,
    painRatingTarget: ratingTarget,
    perceivedPainScore: state.painRating,
    firstPainLatencyMs: FIRST_PAIN_LATENCY_MS,
    secondPainLatencyMs: SECOND_PAIN_LATENCY_MS,
    touchLatencyMs: TOUCH_LATENCY_MS,
    allodyniaActive,
    classification: classifySomatic(classificationPattern),
    patternSummary: patternSummary({ classification: classifySomatic(classificationPattern), map, painScore: state.painRating, gateOpen: gate }),
    descendingModulation: inputs.descendingModulation,
    rubbingGateDrive: inputs.rubbingGateDrive,
    sensitisationCeiling: clamp(inputs.peripheralSensitisation, 0, 100) / 100,
  };
}

export function tick(
  state: SomaticInternalState,
  derived: SomaticDerived,
  dtSeconds: number,
): SomaticInternalState {
  const chemicalDrive = clamp((derived.cFibreTraffic + derived.adDeltaTraffic) / 100, 0, 1);
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    painRating: approach(state.painRating, derived.painRatingTarget, dtSeconds, PAIN.RATING_TAU_SECONDS),
    // Inflammatory mediators hold the periphery near the ceiling set by the injury state.
    sensitisationAccumulated: approach(
      state.sensitisationAccumulated,
      derived.sensitisationCeiling,
      dtSeconds,
      PAIN.SENSITISATION_TAU_SECONDS,
    ),
    // Sustained traffic (or an already-sensitised periphery) recruits NMDA-dependent
    // amplification slowly; it also decays when the drive stops.
    centralAmplification: approach(
      state.centralAmplification,
      Math.max(chemicalDrive, clamp(derived.sensitisationCeiling, 0, 1) * 0.8),
      dtSeconds,
      PAIN.WINDUP_TAU_SECONDS,
    ),
    injuryBurst: Math.max(0, state.injuryBurst - (state.injuryBurst * dtSeconds) / EVENTS.INJURY_DECAY_TAU_SECONDS),
    opioidBurst: Math.max(0, state.opioidBurst - (state.opioidBurst * dtSeconds) / EVENTS.OPIOID_DECAY_TAU_SECONDS),
  };
}

export function step(state: SomaticInternalState, inputs: SomaticInputs, dtSeconds: number): SomaticSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** An opioid bolus delivered to the descending system. */
export function perturbOpioidBolus(state: SomaticInternalState): SomaticInternalState {
  return { ...state, opioidBurst: Math.min(80, state.opioidBurst + EVENTS.OPIOID_BURST) };
}

/** A fresh tissue injury on top of whatever exists. */
export function perturbTissueInjury(state: SomaticInternalState): SomaticInternalState {
  return { ...state, injuryBurst: Math.min(100, state.injuryBurst + EVENTS.INJURY_BURST) };
}

export { SOMATIC_SIMULATION };

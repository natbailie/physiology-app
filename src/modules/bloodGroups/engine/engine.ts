import { BLOOD_SIMULATION, REACTION, TRANSFUSION } from './constants';
import {
  aboMajorIncompatible,
  classifyReaction,
  crossmatchVerdict,
  patternSummary,
  reactionSeverity,
} from './bloodMechanics';
import { aboName } from './bloodMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  BloodDerived,
  BloodInputs,
  BloodInternalState,
  BloodSnapshot,
} from './types';

export function createInitialState(): BloodInternalState {
  return {
    simTimeSeconds: 0,
    haemolyticSeverity: 0,
  };
}

function reactionArmOf(inputs: BloodInputs): 'none' | 'immediate intravascular (IgM)' | 'delayed extravascular (IgG)' {
  if (aboMajorIncompatible(inputs.recipientAboIndex, inputs.donorAboIndex))
    return 'immediate intravascular (IgM)';
  if (!inputs.recipientRhPositive && inputs.donorRhPositive > 0.5 && inputs.rhSensitised > 0.5)
    return 'delayed extravascular (IgG)';
  return 'none';
}

export function computeDerived(state: BloodInternalState, inputs: BloodInputs): BloodDerived {
  const arm = reactionArmOf(inputs);
  const severityTarget =
    arm === 'immediate intravascular (IgM)'
      ? reactionSeverity(inputs.recipientAboIndex, inputs.donorAboIndex, inputs.transfusionVolumeMl)
      : arm === 'delayed extravascular (IgG)'
        ? clamp((inputs.transfusionVolumeMl / TRANSFUSION.MAX_VOLUME_ML) * 55 * (inputs.rhSensitised > 0.5 ? 1 : 0.15), 0, 100)
        : 0;

  // Severity itself relaxes toward the target along the matching timescale.
  const severity = state.haemolyticSeverity;
  void severityTarget;

  const freeHb = arm === 'immediate intravascular (IgM)' ? clamp(severity * REACTION.FREE_HB_PER_SEVERITY, 0, 350) : clamp(severity * 0.4, 0, 60);
  const complement = arm === 'immediate intravascular (IgM)' ? clamp(severity * REACTION.COMPLEMENT_CONSUMPTION_PER_SEVERITY, 0, 100) : clamp(severity * 0.2, 0, 40);
  const haemoglobinuria = freeHb > 20 ? clamp(((freeHb - 20) / 180) * 100, 0, 100) : 0;
  const dicRisk = arm === 'immediate intravascular (IgM)' ? clamp(((severity - REACTION.DIC_RISK_ONSET_SEVERITY) / (100 - REACTION.DIC_RISK_ONSET_SEVERITY)) * 100, 0, 100) : 0;
  const renalRisk = arm === 'immediate intravascular (IgM)' ? clamp(((severity - REACTION.RENAL_INJURY_ONSET_SEVERITY) / (100 - REACTION.RENAL_INJURY_ONSET_SEVERITY)) * 100, 0, 100) : clamp(severity * 0.1, 0, 10);
  const shockIndex = clamp((severity / 100) * 0.9 + (freeHb / 350) * 0.3, 0, 1.2);

  const aboInc = aboMajorIncompatible(inputs.recipientAboIndex, inputs.donorAboIndex);
  const rhInc = !inputs.recipientRhPositive && inputs.donorRhPositive > 0.5 && inputs.rhSensitised > 0.5;

  const classificationPattern = {
    severity,
    aboIncompatible: aboInc,
    rhIncompatible: rhInc,
    volumeMl: inputs.transfusionVolumeMl,
  };

  return {
    recipientType: `${aboName(inputs.recipientAboIndex)}${inputs.recipientRhPositive > 0.5 ? '+' : '−'}`,
    donorType: `${aboName(inputs.donorAboIndex)}${inputs.donorRhPositive > 0.5 ? '+' : '−'}`,
    crossmatchVerdict: crossmatchVerdict(inputs),
    aboIncompatible: aboInc,
    rhIncompatible: rhInc,
    reactionArm: arm,
    haemolyticSeverity: severity,
    plasmaFreeHaemoglobin: freeHb,
    complementConsumedPct: complement,
    haemoglobinuriaPct: haemoglobinuria,
    dicRiskPct: dicRisk,
    renalInjuryRiskPct: renalRisk,
    shockIndex,
    classification: classifyReaction(classificationPattern),
    patternSummary: patternSummary({
      classification: classifyReaction(classificationPattern),
      freeHb,
      complementPct: complement,
      dicRisk,
      renalRisk,
    }),
  };
}

export function tick(
  state: BloodInternalState,
  inputs: BloodInputs,
  dtSeconds: number,
): BloodInternalState {
  const arm = reactionArmOf(inputs);
  let target = 0;
  let tau: number = REACTION.ABO_FAST_TAU_SECONDS;
  if (arm === 'immediate intravascular (IgM)') {
    target = reactionSeverity(inputs.recipientAboIndex, inputs.donorAboIndex, inputs.transfusionVolumeMl);
  } else if (arm === 'delayed extravascular (IgG)') {
    target = clamp((inputs.transfusionVolumeMl / TRANSFUSION.MAX_VOLUME_ML) * 55 * (inputs.rhSensitised > 0.5 ? 1 : 0.15), 0, 100);
    tau = REACTION.RH_SLOW_TAU_SECONDS;
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    haemolyticSeverity: approach(state.haemolyticSeverity, target, dtSeconds, tau),
  };
}

export function step(state: BloodInternalState, inputs: BloodInputs, dtSeconds: number): BloodSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

export { BLOOD_SIMULATION };

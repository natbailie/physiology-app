import { BLOOD_SIMULATION, HAEMOLYTIC_DISEASE, REACTION, TRANSFUSION } from './constants';
import {
  aboMajorIncompatible,
  classifyReaction,
  crossmatchVerdict,
  patternSummary,
  reactionSeverity,
} from './bloodMechanics';
import {
  cordBilirubinUmolL,
  fetalExposure,
  fetalHaemoglobinGDl,
  nextPregnancySensitisationRiskPct,
} from './hdn';
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

function reactionArmOf(inputs: BloodInputs): 'none' | 'immediate intravascular (IgM)' | 'delayed extravascular (IgG)' | 'fetal haemolysis (maternal IgG)' {
  // The two scenarios are mutually exclusive worlds: in the HDN scenario the transfusion
  // inputs are inert (they describe a unit of blood nobody gave), so only the placental
  // arm can ever fire.
  if (inputs.hdnScenario > 0.5)
    return fetalExposure(inputs) ? 'fetal haemolysis (maternal IgG)' : 'none';
  if (aboMajorIncompatible(inputs.recipientAboIndex, inputs.donorAboIndex))
    return 'immediate intravascular (IgM)';
  if (!inputs.recipientRhPositive && inputs.donorRhPositive > 0.5 && inputs.rhSensitised > 0.5)
    return 'delayed extravascular (IgG)';
  return 'none';
}

/** Severity target for the active reaction arm, plus its timescale in seconds. */
function severityTargetOf(
  inputs: BloodInputs,
): { target: number; tau: number } {
  const arm = reactionArmOf(inputs);
  if (arm === 'immediate intravascular (IgM)')
    return { target: reactionSeverity(inputs.recipientAboIndex, inputs.donorAboIndex, inputs.transfusionVolumeMl), tau: REACTION.ABO_FAST_TAU_SECONDS };
  if (arm === 'delayed extravascular (IgG)')
    return {
      target: clamp((inputs.transfusionVolumeMl / TRANSFUSION.MAX_VOLUME_ML) * 55 * (inputs.rhSensitised > 0.5 ? 1 : 0.15), 0, 100),
      tau: REACTION.RH_SLOW_TAU_SECONDS,
    };
  if (arm === 'fetal haemolysis (maternal IgG)')
    // Continuous placental exposure through the third trimester: slower and deeper than a
    // single transfused unit, which is why severe HDN threatens hydrops rather than shock.
    return { target: clamp(70 + inputs.transfusionVolumeMl / 50, 0, 100), tau: REACTION.RH_SLOW_TAU_SECONDS * 1.4 };
  return { target: 0, tau: REACTION.ABO_FAST_TAU_SECONDS };
}

export function computeDerived(state: BloodInternalState, inputs: BloodInputs): BloodDerived {
  const arm = reactionArmOf(inputs);
  const severityTarget = severityTargetOf(inputs).target;
  void severityTarget;

  // Severity itself relaxes toward the target along the matching timescale.
  const severity = state.haemolyticSeverity;

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
  const isFetal = arm === 'fetal haemolysis (maternal IgG)';
  const baseClassification = classifyReaction(classificationPattern);
  const classification = isFetal ? ('HDN: fetal haemolysis from maternal IgG' as const) : baseClassification;
  const fetalHb = fetalHaemoglobinGDl(severity);
  const cordBilirubin = cordBilirubinUmolL(severity);

  return {
    recipientType: `${aboName(inputs.recipientAboIndex)}${inputs.recipientRhPositive > 0.5 ? '+' : '−'}`,
    donorType: `${aboName(inputs.donorAboIndex)}${inputs.donorRhPositive > 0.5 ? '+' : '−'}`,
    crossmatchVerdict: inputs.hdnScenario > 0.5
      ? nextPregnancySensitisationRiskPct(inputs) > 0
        ? 'anti-D indicated — prevent sensitisation at this delivery'
        : inputs.rhSensitised > 0.5
          ? 'already sensitised — monitor fetal haemolysis; anti-D cannot help now'
          : 'no sensitisation risk'
      : crossmatchVerdict(inputs),
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
    classification,
    hdnScenario: inputs.hdnScenario > 0.5 ? 1 : 0,
    patternSummary: isFetal
      ? `fetal Hb ${fetalHb.toFixed(1)} g/dL, cord bilirubin ${cordBilirubin.toFixed(0)} µmol/L — IgG clears cells extravascularly across the placenta`
      : patternSummary({
          classification: baseClassification,
          freeHb,
          complementPct: complement,
          dicRisk,
          renalRisk,
        }),
    fetalHaemoglobinGDl: inputs.hdnScenario > 0.5 ? fetalHb : HAEMOLYTIC_DISEASE.FETAL_HB_BASELINE_GDL,
    cordBilirubinUmolL: inputs.hdnScenario > 0.5 ? cordBilirubin : 0,
    hydropsRiskPct:
      inputs.hdnScenario > 0.5 && isFetal
        ? clamp(((severity - HAEMOLYTIC_DISEASE.HYDROPS_ONSET_SEVERITY) / (100 - HAEMOLYTIC_DISEASE.HYDROPS_ONSET_SEVERITY)) * 100, 0, 100)
        : 0,
    nextPregnancySensitisationRiskPct: nextPregnancySensitisationRiskPct(inputs),
  };
}

export function tick(
  state: BloodInternalState,
  inputs: BloodInputs,
  dtSeconds: number,
): BloodInternalState {
  const { target, tau } = severityTargetOf(inputs);

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

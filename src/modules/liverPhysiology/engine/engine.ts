import { BILIRUBIN, HAEMOLYSIS, HEPATOCYTE, LIVER_SIMULATION, OBSTRUCTION } from './constants';
import {
  ammoniaUmolL,
  classifyLiver,
  encephalopathyGrade,
  kernicterusRisk,
  lftPatternOf,
  patternSummary,
  rFactor,
  stoolColourPct,
  urineUrobilinogenIndex,
} from './liverMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { LiverDerived, LiverInputs, LiverInternalState, LiverSnapshot } from './types';

/** All rates are per MINUTE of simulated time. */
const RATE = {
  /** Conjugation clearance of the unconjugated pool per unit UGT/excretion. */
  CONJUGATION_PER_MIN: 0.008,
  /** Very slow non-hepatic disposal of unconjugated pigment (keeps extreme models finite). */
  UNCONJUGATED_LOSS_PER_MIN: 0.00005,
} as const;

/** Bile secretion is a saturable pump whose capacity scales with excretory mass AND with
 * pigment load — a chronically haemolysing patient upregulates excretion, which is why
 * their plasma stays conjugated-low despite enormous turnover. */
const SECRETION = {
  VMAX_PER_MIN: 0.14,
  KM_UMOL_L: 10,
  LOAD_GAIN_PER_HAEMOLYSIS: 0.6,
} as const;

export function createInitialState(): LiverInternalState {
  return {
    simTimeSeconds: 0,
    unconjugatedUmolL: 6.5,
    conjugatedUmolL: 3,
    gutBileFlowFraction: 1,
    haemolysisBurst: 0,
    injuryBurst: 0,
    obstructionReliefPct: 0,
  };
}

export function computeDerived(state: LiverInternalState, inputs: LiverInputs): LiverDerived {
  const haemolysisEffective = clamp(
    inputs.haemolysisMultiplier + state.haemolysisBurst,
    0.5,
    HAEMOLYSIS.MAX_MULTIPLIER + 3,
  );
  const excretion = clamp(inputs.hepatocyteExcretionPct, 0, 100);
  const injuryPct = clamp(inputs.hepatocyteInjuryPct + state.injuryBurst, 0, 120);
  const obstructionPct = clamp(inputs.biliaryObstructionPct - state.obstructionReliefPct, 0, 100);

  const altXUlN = 1 + (injuryPct / 100) * ENZYMES_ALT_PER_INJURY;
  const alpXUlN = 1 + (obstructionPct / 100) * ENZYMES_ALP_PER_OBSTRUCTION;
  const r = rFactor(altXUlN, alpXUlN);
  const lftPattern = lftPatternOf(r, altXUlN, alpXUlN);

  const total = state.unconjugatedUmolL + state.conjugatedUmolL;
  const fractionConjugatedPct = total > 0.5 ? (state.conjugatedUmolL / total) * 100 : 50;
  const ammonia = ammoniaUmolL(clamp(excretion - injuryPct * 0.4, 0, 100));
  const grade = encephalopathyGrade(ammonia);

  const classificationPattern = {
    totalBilirubinUmolL: total,
    fractionConjugatedPct,
    haemolysisEffective,
    ugtActivity: clamp(inputs.ugtActivity, 0, 1),
    injuryPct,
    obstructionPct,
    excretionPct: excretion,
    encephalopathyGrade: grade,
  };
  const classification = classifyLiver(classificationPattern);

  return {
    unconjugatedUmolL: state.unconjugatedUmolL,
    conjugatedUmolL: state.conjugatedUmolL,
    totalBilirubinUmolL: total,
    fractionConjugatedPct,
    jaundiceVisible: total > BILIRUBIN.JAUNDICE_VISIBLE_UMOL_L,
    urineBilirubinPresent:
      state.conjugatedUmolL > BILIRUBIN.URINE_THRESHOLD_CONJ_UMOL_L,
    urineUrobilinogenIndex: urineUrobilinogenIndex(state.gutBileFlowFraction, haemolysisEffective),
    stoolColourPct: stoolColourPct(state.gutBileFlowFraction),
    altXUlN,
    alpXUlN,
    rFactor: Number.isFinite(r) ? clamp(r, 0, 60) : 60,
    lftPattern,
    ammoniaUmolL: ammonia,
    encephalopathyGrade: grade,
    kernicterusRiskPct: kernicterusRisk(state.unconjugatedUmolL, inputs.albuminGPerL),
    effectiveObstructionPct: obstructionPct,
    classification,
    patternSummary: patternSummary({
      classification,
      unconjugatedUmolL: state.unconjugatedUmolL,
      conjugatedUmolL: state.conjugatedUmolL,
      urineBilirubinPresent: state.conjugatedUmolL > BILIRUBIN.URINE_THRESHOLD_CONJ_UMOL_L,
      urineUrobilinogenIndex: urineUrobilinogenIndex(state.gutBileFlowFraction, haemolysisEffective),
      stoolColourPct: stoolColourPct(state.gutBileFlowFraction),
      ammoniaUmolL: ammonia,
    }),
    albuminGPerL: inputs.albuminGPerL,
  };
}

const ENZYMES_ALT_PER_INJURY = 28;
const ENZYMES_ALP_PER_OBSTRUCTION = 7;

export function tick(
  state: LiverInternalState,
  derived: LiverDerived,
  inputs: LiverInputs,
  dtSeconds: number,
): LiverInternalState {
  // Rates are defined per minute; dt arrives in seconds.
  const dtMin = dtSeconds / 60;

  const haemolysisEffective = clamp(
    inputs.haemolysisMultiplier + state.haemolysisBurst,
    0.5,
    HAEMOLYSIS.MAX_MULTIPLIER + 3,
  );
  const excr = clamp(inputs.hepatocyteExcretionPct, 0, 100) / 100;
  const ugt = clamp(inputs.ugtActivity, 0, 1);
  const injuryFrac = clamp((inputs.hepatocyteInjuryPct + state.injuryBurst) / 100, 0, 1.2);
  const obstructionFrac = clamp(derived.effectiveObstructionPct / 100, 0, 1);

  const productionAmount = BILIRUBIN.BASE_PRODUCTION_PER_MIN * haemolysisEffective * dtMin;
  // Necrosis leaks freshly conjugated pigment back into plasma instead of down the canaliculus.
  const conjugationAmount =
    RATE.CONJUGATION_PER_MIN * ugt * excr * state.unconjugatedUmolL * dtMin;
  const regurgitation = injuryFrac * HEPATOCYTE.REGURGITATION_FRACTION * conjugationAmount;
  const basalLoss = RATE.UNCONJUGATED_LOSS_PER_MIN * state.unconjugatedUmolL * dtMin;

  const vmax = SECRETION.VMAX_PER_MIN * excr *
    (1 + SECRETION.LOAD_GAIN_PER_HAEMOLYSIS * (haemolysisEffective - 1));
  const bileOutPerMin =
    vmax * (state.conjugatedUmolL / (state.conjugatedUmolL + SECRETION.KM_UMOL_L)) *
    (1 - obstructionFrac) * (1 - injuryFrac * 0.4);
  const bileOut = bileOutPerMin * dtMin;
  const renalLoss =
    RATE_RENAL_PER_MIN *
    Math.max(0, state.conjugatedUmolL - BILIRUBIN.URINE_THRESHOLD_CONJ_UMOL_L) * dtMin;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    unconjugatedUmolL: Math.max(
      0.5,
      state.unconjugatedUmolL + productionAmount - conjugationAmount - basalLoss,
    ),
    conjugatedUmolL: Math.max(
      0,
      state.conjugatedUmolL + conjugationAmount + regurgitation - bileOut - renalLoss,
    ),
    // Gut flow tracks whatever actually leaves via the duct.
    gutBileFlowFraction: approach(state.gutBileFlowFraction, (1 - obstructionFrac) * (1 - injuryFrac * 0.35), dtSeconds, GUT_FLOW_TAU_SECONDS),
    haemolysisBurst: Math.max(0, state.haemolysisBurst - (state.haemolysisBurst * dtSeconds) / HAEMOLYSIS.EPISODE_DECAY_TAU_SECONDS),
    injuryBurst: Math.max(0, state.injuryBurst - (state.injuryBurst * dtSeconds) / HEPATOCYTE.INJURY_DECAY_TAU_SECONDS),
    obstructionReliefPct: Math.max(0, state.obstructionReliefPct - (OBSTRUCTION.RELIEF_RATE_PER_HOUR / 60) * dtMin),
  };
}

const RATE_RENAL_PER_MIN = 0.0006;
const GUT_FLOW_TAU_SECONDS = 1800;

export function step(state: LiverInternalState, inputs: LiverInputs, dtSeconds: number): LiverSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** An acute haemolytic episode on top of the baseline turnover. */
export function perturbHaemolyticEpisode(state: LiverInternalState): LiverInternalState {
  return {
    ...state,
    haemolysisBurst: Math.min(6, state.haemolysisBurst + HAEMOLYSIS.EPISODE_BURST),
  };
}

/** A bout of alcoholic injury: necrosis spike with regurgitation. */
export function perturbAlcoholBinge(state: LiverInternalState): LiverInternalState {
  return { ...state, injuryBurst: Math.min(90, state.injuryBurst + 40) };
}

/** ERCP stent: relieves the obstruction immediately; oedema slowly reclaims it. */
export function perturbStentObstruction(state: LiverInternalState): LiverInternalState {
  return { ...state, obstructionReliefPct: Math.min(OBSTRUCTION.RELIEF_MAX_PCT, state.obstructionReliefPct + 70) };
}

export { LIVER_SIMULATION };

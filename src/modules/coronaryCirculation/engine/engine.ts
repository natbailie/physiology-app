import { EVENTS, ISCHAEMIA, SUPPLY } from './constants';
import {
  cycleTiming,
  lvedpMmHg,
  oxygenDemandIndex,
  ratePressureProduct,
  wallStressIndex,
} from './demand';
import { applyDrugs } from './drugs';
import { classify, contractilityPenalty, isTransmural, patternSummary, supplyGap, updateNecrosis } from './ischaemia';
import { clamp, approach } from '@/shared/lib/math';
import { collateralFlow, effectiveSeverity, maximalLesionFlow, severityCoefficient } from './stenosis';
import {
  closingPressureMmHg,
  diastolicDriving,
  effectiveDriving,
  oxygenCarriageRatio,
} from './supply';
import type {
  CoronaryDerived,
  CoronaryHistoryPoint,
  CoronaryInputs,
  CoronaryInternalState,
  CoronarySnapshot,
} from './types';

export function createInitialState(): CoronaryInternalState {
  return {
    simTimeSeconds: 0,
    ischaemiaLevel: 0,
    exertionDrive: 0,
    spasmBurst: 0,
    necrosisLoad: 0,
  };
}

export function computeDerived(state: CoronaryInternalState, inputs: CoronaryInputs): CoronaryDerived {
  const haemo = applyDrugs(inputs, state.spasmBurst);
  // Sympathetic drive from an exertional event raises the rate above the slider's setting.
  const effectiveHeartRateBpm = haemo.heartRateBpm * (1 + DEMAND_RATE.EXERTION * state.exertionDrive);

  const timing = cycleTiming(effectiveHeartRateBpm);
  const rpp = ratePressureProduct(effectiveHeartRateBpm, haemo.systolicPressureMmHg);
  const stress = wallStressIndex(haemo.endDiastolicVolumeMl, haemo.systolicPressureMmHg);
  const functionalContractility = haemo.contractilityFraction * contractilityPenalty(state.ischaemiaLevel);

  const demandIndex = oxygenDemandIndex({
    ratePressureProduct: rpp,
    wallStressIndex: stress,
    contractility: functionalContractility,
    exertionDrive: state.exertionDrive,
    ischaemiaLevel: state.ischaemiaLevel,
  });
  const requiredFlow = demandIndex;

  // Supply: the diastolic column working against the muscle's own closing pressure.
  const lvedp = lvedpMmHg(haemo.endDiastolicVolumeMl);
  const closing = closingPressureMmHg(lvedp);
  const driving = diastolicDriving(haemo.diastolicPressureMmHg, closing);
  const drivingEffective = effectiveDriving(driving, timing.diastolicTimeFraction);
  const carriage = oxygenCarriageRatio(inputs.haemoglobinGPerDl, inputs.arterialOxygenSaturationPct);

  const narrowing = effectiveSeverity(
    inputs.stenosisPercentDiameter / 100,
    haemo.coronaryToneFraction,
    haemo.spasmBurst,
  );
  const lesionCapacity = maximalLesionFlow(
    drivingEffective,
    SUPPLY.MAX_CONDUCTANCE,
    severityCoefficient(narrowing),
  );
  const capacityBeforeCarriage = lesionCapacity + collateralFlow(inputs.collateralFraction, drivingEffective);
  const maximalFlowCapacity = capacityBeforeCarriage * carriage;

  // Flow reserve against normal resting need — the number the textbooks quote. Purely a flow
  // property: carriage limits delivery but not what the plumbing could carry.
  const flowReserveRatio = capacityBeforeCarriage;

  const gap = supplyGap(requiredFlow, maximalFlowCapacity);
  const transmuralActive = isTransmural(narrowing, maximalFlowCapacity, requiredFlow);
  const classification = classify({
    necrosisLoad: state.necrosisLoad,
    transmuralActive,
    ischaemiaLevel: state.ischaemiaLevel,
  });

  return {
    effectiveHeartRateBpm,
    effectiveSystolicPressureMmHg: haemo.systolicPressureMmHg,
    effectiveDiastolicPressureMmHg: haemo.diastolicPressureMmHg,
    effectiveEndDiastolicVolumeMl: haemo.endDiastolicVolumeMl,
    effectiveContractilityFraction: haemo.contractilityFraction,

    systolicDurationSeconds: timing.systolicDurationSeconds,
    diastolicTimeFraction: timing.diastolicTimeFraction,
    ratePressureProduct: rpp,
    wallStressIndex: stress,
    demandIndex,
    requiredFlow,

    leftVentricularEndDiastolicPressureMmHg: lvedp,
    closingPressureMmHg: closing,
    drivingPressureMmHg: driving,
    effectiveDrivingPressureMmHg: drivingEffective,
    oxygenCarriageRatio: carriage,
    maximalFlowCapacity,
    flowReserveRatio: clamp(flowReserveRatio, 0, 20),

    supplyGap: gap,
    ischaemiaLevel: state.ischaemiaLevel,
    functionalContractility,
    transmuralInjuryActive: transmuralActive,
    anginaActive: state.ischaemiaLevel >= ANGINA_THRESHOLD,
    necrosisLoadPct: state.necrosisLoad * 100,
    classification,
    patternSummary: patternSummary({
      classification,
      flowReserveRatio: flowReserveRatio,
      drivingPressureMmHg: driving,
      oxygenCarriageRatio: carriage,
      diastolicTimeFraction: timing.diastolicTimeFraction,
    }),

    stenosisEffectiveFraction: narrowing,
    collateralFraction: inputs.collateralFraction,
    nitrateDosePercent: inputs.nitrateDosePercent,
    betaBlockerDosePercent: inputs.betaBlockerDosePercent,
    haemoglobinGPerDl: inputs.haemoglobinGPerDl,
    arterialOxygenSaturationPct: inputs.arterialOxygenSaturationPct,
  };
}

const DEMAND_RATE = { EXERTION: 0.55 } as const;
const ANGINA_THRESHOLD = 0.04;

export function tick(
  state: CoronaryInternalState,
  derived: CoronaryDerived,
  _inputs: CoronaryInputs,
  dtSeconds: number,
): CoronaryInternalState {
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // Metabolic signalling has a lag of a few seconds in both directions.
    ischaemiaLevel: approach(state.ischaemiaLevel, derived.supplyGap, dtSeconds, ISCHAEMIA.SMOOTH_TAU_SECONDS),
    exertionDrive: decayTowardZero(state.exertionDrive, dtSeconds, EVENTS.EXERTION_TAU_SECONDS),
    spasmBurst: decayTowardZero(state.spasmBurst, dtSeconds, EVENTS.SPASM_TAU_SECONDS),
    necrosisLoad: updateNecrosis(state.necrosisLoad, derived.transmuralInjuryActive, dtSeconds),
  };
}

function decayTowardZero(value: number, dtSeconds: number, tauSeconds: number): number {
  return Math.max(0, approach(value, 0, dtSeconds, tauSeconds));
}

export function step(state: CoronaryInternalState, inputs: CoronaryInputs, dtSeconds: number): CoronarySnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Exertion: sympathetic drive surges and decays over minutes — climbing the stairs. */
export function perturbExertion(state: CoronaryInternalState): CoronaryInternalState {
  return { ...state, exertionDrive: clamp(state.exertionDrive + 1, 0, 1) };
}

/** Vasospasm: a focal occlusive event at rest, decaying over minutes — Prinzmetal's angina. */
export function perturbVasospasm(state: CoronaryInternalState): CoronaryInternalState {
  return { ...state, spasmBurst: clamp(state.spasmBurst + 1, 0, 1) };
}

export function toHistoryPoint(snapshot: CoronarySnapshot): CoronaryHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    requiredFlow: snapshot.derived.requiredFlow,
    maximalFlowCapacity: snapshot.derived.maximalFlowCapacity,
    ischaemiaLevel: snapshot.derived.ischaemiaLevel,
    diastolicTimeFraction: snapshot.derived.diastolicTimeFraction,
  };
}

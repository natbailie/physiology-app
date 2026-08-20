import { BLOOD_GLUCOSE, COUNTER_REGULATION, EXOGENOUS_INSULIN, GLUCAGON, INSULIN, MEAL } from './constants';
import { mealAbsorptionRateGramsPerSecond } from './mealAbsorption';
import { insulinLevelTarget } from './insulinSecretion';
import { glucagonLevelTarget } from './glucagonSecretion';
import { counterRegulatoryDriveTarget } from './counterRegulation';
import { hepaticGlucoseOutputRate, tickHepaticGlycogenReserve } from './hepaticGlucoseOutput';
import { glucoseUptakeRate } from './peripheralUptake';
import { approach, clamp, scaleClamped } from '@/shared/lib/math';
import type { GlucoseDerived, GlucoseInputs, GlucoseSnapshot, GlucoseState } from './types';

export function createInitialState(): GlucoseState {
  return {
    simTimeSeconds: 0,
    bloodGlucoseMgDl: BLOOD_GLUCOSE.BASELINE_MGDL,
    mealBolusRemaining: 0,
    exogenousInsulinBolus: 0,
    insulinLevel: 0,
    glucagonLevel: 0,
    counterRegulatoryDrive: 0,
    hepaticGlycogenReserve: 1,
  };
}

/**
 * Computes every derived glucose-regulation value for the current tick from the current
 * blood glucose and inputs, using the *smoothed* insulin/glucagon/counter-regulatory
 * actuator levels carried on state (each relaxes toward its target on its own time constant
 * — see `tick`). Mirrors the other modules' computeDerived/tick split.
 */
export function computeDerived(state: GlucoseState, inputs: GlucoseInputs): GlucoseDerived {
  const hepaticOutput = hepaticGlucoseOutputRate(state.glucagonLevel, state.counterRegulatoryDrive, state.hepaticGlycogenReserve);
  const uptake = glucoseUptakeRate(state.insulinLevel, inputs.insulinResistance, state.bloodGlucoseMgDl);

  return {
    bloodGlucoseMgDl: state.bloodGlucoseMgDl,
    mealBolusRemaining: state.mealBolusRemaining,
    exogenousInsulinBolus: state.exogenousInsulinBolus,
    insulinLevel: state.insulinLevel,
    glucagonLevel: state.glucagonLevel,
    counterRegulatoryDrive: state.counterRegulatoryDrive,
    hepaticGlycogenReserve: state.hepaticGlycogenReserve,
    glucoseUptakeRate: uptake,
    hepaticGlucoseOutputRate: hepaticOutput,
    hypoglycemiaSeverity: scaleClamped(state.bloodGlucoseMgDl, COUNTER_REGULATION.ACTIVATION_CEILING_MGDL, COUNTER_REGULATION.ACTIVATION_FLOOR_MGDL, 0, 1),
    insulinSecretionCapacity: inputs.insulinSecretionCapacity,
    insulinResistance: inputs.insulinResistance,
    glucagonSecretionCapacity: inputs.glucagonSecretionCapacity,
  };
}

export function tick(state: GlucoseState, derived: GlucoseDerived, dtSeconds: number): GlucoseState {
  const mealAbsorptionRate = mealAbsorptionRateGramsPerSecond(state.mealBolusRemaining);
  const dGlucose =
    (mealAbsorptionRate * MEAL.GRAMS_TO_MGDL_GAIN + derived.hepaticGlucoseOutputRate - derived.glucoseUptakeRate) * dtSeconds;

  const targetInsulin = insulinLevelTarget(state.bloodGlucoseMgDl, derived.insulinSecretionCapacity, state.exogenousInsulinBolus);
  const targetGlucagon = glucagonLevelTarget(state.bloodGlucoseMgDl, derived.glucagonSecretionCapacity);
  const targetCounterRegulation = counterRegulatoryDriveTarget(state.bloodGlucoseMgDl);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    bloodGlucoseMgDl: clamp(state.bloodGlucoseMgDl + dGlucose, BLOOD_GLUCOSE.MIN_MGDL, BLOOD_GLUCOSE.MAX_MGDL),
    mealBolusRemaining: clamp(state.mealBolusRemaining - mealAbsorptionRate * dtSeconds, 0, MEAL.MAX_BOLUS_GRAMS),
    exogenousInsulinBolus: approach(state.exogenousInsulinBolus, 0, dtSeconds, EXOGENOUS_INSULIN.DECAY_TAU_SECONDS),
    insulinLevel: approach(state.insulinLevel, targetInsulin, dtSeconds, INSULIN.TAU_SECONDS),
    glucagonLevel: approach(state.glucagonLevel, targetGlucagon, dtSeconds, GLUCAGON.TAU_SECONDS),
    counterRegulatoryDrive: approach(state.counterRegulatoryDrive, targetCounterRegulation, dtSeconds, COUNTER_REGULATION.TAU_SECONDS),
    hepaticGlycogenReserve: tickHepaticGlycogenReserve(state.hepaticGlycogenReserve, derived.hepaticGlucoseOutputRate, state.bloodGlucoseMgDl, dtSeconds),
  };
}

export function step(state: GlucoseState, inputs: GlucoseInputs, dtSeconds: number): GlucoseSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Eat meal" perturbation: adds `carbGrams` to the absorption bolus. The amount comes from
 * the current mealCarbLoadGrams slider value, read by the caller (mirrors the GI module's
 * eat-meal pattern, extended here to carry a variable magnitude). */
export function perturbEatMeal(state: GlucoseState, carbGrams: number): GlucoseState {
  return { ...state, mealBolusRemaining: clamp(state.mealBolusRemaining + carbGrams, 0, MEAL.MAX_BOLUS_GRAMS) };
}

/** "Give insulin" perturbation: adds an exogenous insulin bolus, ungated by
 * insulinSecretionCapacity — this is exactly what still works in unmanaged T1DM. */
export function perturbGiveInsulin(state: GlucoseState, units: number): GlucoseState {
  return { ...state, exogenousInsulinBolus: clamp(state.exogenousInsulinBolus + units * EXOGENOUS_INSULIN.UNITS_TO_BOLUS_GAIN, 0, EXOGENOUS_INSULIN.MAX_BOLUS) };
}

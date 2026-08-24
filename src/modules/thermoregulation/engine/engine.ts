import {
  CLINICAL,
  ENVIRONMENT,
  HEAT,
  SETPOINT,
  THERMO_SIMULATION,
} from './constants';
import {
  classifyThermo,
  patternSummary,
  setPointTargetC,
  shiverTargetW,
  skinFlowTarget,
  sweatTargetW,
} from './thermoMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { ThermoDerived, ThermoInputs, ThermoInternalState, ThermoSnapshot } from './types';

export function createInitialState(): ThermoInternalState {
  return {
    simTimeSeconds: 0,
    coreTempC: 37,
    skinTempC: 33.2,
    setPointC: SETPOINT.BASE_C,
    shiveringW: 0,
    sweatW: 0,
    skinFlowFactor: 1,
    antipyreticEffectPct: 0,
    coolingDeviceSecondsRemaining: 0,
    rewarmingDeviceSecondsRemaining: 0,
  };
}

export function computeDerived(state: ThermoInternalState, inputs: ThermoInputs): ThermoDerived {
  const error = state.coreTempC - state.setPointC;
  const metabolicHeatW =
    HEAT.BASAL_METABOLIC_W *
    clamp(inputs.metabolicRateMultiplier, 0.4, 14) *
    // Cold tissue runs slowly: production itself fails as hypothermia deepens.
    clamp((state.coreTempC - 26) / (HEAT.PRODUCTION_SUPPRESSION_ONSET_C - 26), HEAT.PRODUCTION_MIN_FRACTION, 1);
  const dryCoeff =
    HEAT.DRY_COEFF_W_PER_K * (1 + HEAT.WIND_WETNESS_MAX_MULT * clamp(inputs.windWetnessPct, 0, 100) / 100);
  // Vasoconstriction acts through SKIN TEMPERATURE (the gradient), so the coefficient
  // itself must not be scaled by flow again.
  const dryLossW = dryCoeff * (state.skinTempC - inputs.ambientTemperatureC);
  const netStorageW =
    metabolicHeatW + state.shiveringW - dryLossW - state.sweatW - HEAT.INSENSIBLE_W -
    (state.coolingDeviceSecondsRemaining > 0 ? ENVIRONMENT.COOLING_BOOST_W : 0) +
    (state.rewarmingDeviceSecondsRemaining > 0 ? ENVIRONMENT.REWARM_BOOST_W : 0);

  const classificationPattern = {
    coreTempC: state.coreTempC,
    setPointC: state.setPointC,
    shiveringW: state.shiveringW,
    sweatW: state.sweatW,
  };

  return {
    coreTempC: state.coreTempC,
    skinTempC: state.skinTempC,
    setPointC: state.setPointC,
    defenceErrorC: error,
    shiveringW: state.shiveringW,
    sweatW: state.sweatW,
    skinFlowFactor: state.skinFlowFactor,
    metabolicHeatW,
    dryLossW,
    netStorageW,
    feverRising:
      state.setPointC >= CLINICAL.FEVER_SETPONT_C &&
      state.coreTempC < state.setPointC - 0.2,
    classification: classifyThermo(classificationPattern),
    patternSummary: patternSummary({
      ...classificationPattern,
      classification: classifyThermo(classificationPattern),
      netStorageW,
    }),
  };
}

export function tick(
  state: ThermoInternalState,
  derived: ThermoDerived,
  inputs: ThermoInputs,
  dtSeconds: number,
): ThermoInternalState {
  const setPointTarget = setPointTargetC(inputs.pyrogenLevel, state.antipyreticEffectPct);
  const nextSetPoint = approach(state.setPointC, setPointTarget, dtSeconds, SETPOINT.SETPOINT_TAU_SECONDS);

  const deficit = Math.max(0, nextSetPoint - state.coreTempC);
  const excess = Math.max(0, state.coreTempC - nextSetPoint);

  const shiverTarget = shiverTargetW(deficit, state.coreTempC);
  const sweatTarget = sweatTargetW(excess, inputs.humidityPct, inputs.sweatImpairmentPct);
  const flowTarget = skinFlowTarget(excess, deficit);

  const nextShiver = approach(state.shiveringW, shiverTarget, dtSeconds, HEAT.EFFECTOR_TAU_SECONDS);
  const nextSweat = approach(state.sweatW, sweatTarget, dtSeconds, HEAT.EFFECTOR_TAU_SECONDS);
  const nextFlow = approach(state.skinFlowFactor, flowTarget, dtSeconds, HEAT.EFFECTOR_TAU_SECONDS);

  // Heat balance: storage in watts becomes a rate of core temperature change.
  const netW = derived.netStorageW;
  const coreNext = clamp(
    state.coreTempC + (netW * dtSeconds) / HEAT.BODY_CAPACITY_J_PER_C,
    24,
    43.5,
  );

  const skinTargetC =
    inputs.ambientTemperatureC +
    (state.coreTempC - inputs.ambientTemperatureC) *
      clamp(0.42 - 0.16 * (nextFlow - 1), 0.12, 0.8);
  const nextSkin = approach(state.skinTempC, skinTargetC, dtSeconds, HEAT.SKIN_TAU_SECONDS);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    coreTempC: coreNext,
    skinTempC: nextSkin,
    setPointC: nextSetPoint,
    shiveringW: nextShiver,
    sweatW: nextSweat,
    skinFlowFactor: nextFlow,
    antipyreticEffectPct: Math.max(
      0,
      state.antipyreticEffectPct - (state.antipyreticEffectPct * dtSeconds) / SETPOINT.ANTIPYRETIC_DECAY_TAU_SECONDS,
    ),
    coolingDeviceSecondsRemaining: Math.max(0, state.coolingDeviceSecondsRemaining - dtSeconds),
    rewarmingDeviceSecondsRemaining: Math.max(0, state.rewarmingDeviceSecondsRemaining - dtSeconds),
  };
}

export function step(state: ThermoInternalState, inputs: ThermoInputs, dtSeconds: number): ThermoSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Paracetamol/NSAID: blocks the prostaglandin step within minutes — the defended point
 * DROPS below the current core, which is exactly why sweating begins (the crisis). */
export function perturbGiveAntipyretic(state: ThermoInternalState): ThermoInternalState {
  return {
    ...state,
    setPointC: Math.max(SETPOINT.BASE_C - 0.2, state.setPointC - 1.6),
    antipyreticEffectPct: Math.min(100, state.antipyreticEffectPct + 80),
  };
}

/** Fans and ice packs: boosts non-evaporative loss for a window. */
export function perturbActiveCooling(state: ThermoInternalState): ThermoInternalState {
  return { ...state, coolingDeviceSecondsRemaining: ENVIRONMENT.COOLING_WINDOW_SECONDS };
}

/** Warmed blankets / warmed fluids: adds external heat for a window. */
export function perturbActiveRewarming(state: ThermoInternalState): ThermoInternalState {
  return { ...state, rewarmingDeviceSecondsRemaining: ENVIRONMENT.REWARM_WINDOW_SECONDS };
}

export { THERMO_SIMULATION };

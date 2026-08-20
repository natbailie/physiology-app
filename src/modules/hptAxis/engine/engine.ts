import { TRH, TSH, T4, ACUTE_ILLNESS } from './constants';
import { trhDriveTarget } from './trh';
import { tshLevelTarget } from './tsh';
import { t3Level, t4LevelTarget, conversionEfficiency } from './thyroidHormone';
import { approach, clamp } from '@/shared/lib/math';
import type { HptDerived, HptInputs, HptSnapshot, HptState } from './types';

export function createInitialState(): HptState {
  return {
    simTimeSeconds: 0,
    trhDrive: 0,
    tshLevel: 0,
    t4Level: T4.BASAL_UGDL,
    acuteIllnessBolus: 0,
  };
}

/**
 * Computes every derived HPT-axis value for the current tick from the current T4 level and
 * inputs, using the *smoothed* TRH/TSH actuator levels carried on state (each relaxes toward
 * its target on its own time constant — see `tick`). Mirrors the HPA engine's structure.
 */
export function computeDerived(state: HptState, inputs: HptInputs): HptDerived {
  const illnessSignal = clamp(inputs.illnessSeverity / 100 + state.acuteIllnessBolus, 0, 1);
  const t3 = t3Level(state.t4Level, inputs.illnessSeverity, state.acuteIllnessBolus);
  const efficiency = conversionEfficiency(illnessSignal);

  return {
    trhDrive: state.trhDrive,
    tshLevel: state.tshLevel,
    t4Level: state.t4Level,
    t3Level: t3,
    conversionEfficiency: efficiency,
    acuteIllnessBolus: state.acuteIllnessBolus,
    thyroidGlandFunction: inputs.thyroidGlandFunction,
    pituitaryTshFunction: inputs.pituitaryTshFunction,
    autonomousThyroidStimulation: inputs.autonomousThyroidStimulation,
    exogenousLevothyroxine: inputs.exogenousLevothyroxine,
    illnessSeverity: inputs.illnessSeverity,
  };
}

export function tick(state: HptState, derived: HptDerived, dtSeconds: number): HptState {
  const targetTrh = trhDriveTarget(state.t4Level, derived.t3Level);
  const targetTsh = tshLevelTarget(state.trhDrive, state.t4Level, derived.t3Level, derived.pituitaryTshFunction);
  const targetT4 = t4LevelTarget(
    state.tshLevel,
    derived.thyroidGlandFunction,
    derived.autonomousThyroidStimulation,
    derived.exogenousLevothyroxine,
  );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    trhDrive: approach(state.trhDrive, targetTrh, dtSeconds, TRH.TAU_SECONDS),
    tshLevel: approach(state.tshLevel, targetTsh, dtSeconds, TSH.TAU_SECONDS),
    t4Level: clamp(approach(state.t4Level, targetT4, dtSeconds, T4.TAU_SECONDS), T4.MIN_UGDL, T4.MAX_UGDL),
    acuteIllnessBolus: approach(state.acuteIllnessBolus, 0, dtSeconds, ACUTE_ILLNESS.RECOVERY_TAU_SECONDS),
  };
}

export function step(state: HptState, inputs: HptInputs, dtSeconds: number): HptSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute illness perturbation — instant jump on the transient bolus state field, which then
 * relaxes back to 0 via tick()'s own approach() call, mirroring the other modules' perturbations.
 * Transiently suppresses T4→T3 conversion (sick euthyroid) while T4/TSH barely move. */
export function perturbAcuteIllness(state: HptState, magnitude: number = ACUTE_ILLNESS.DEFAULT_MAGNITUDE): HptState {
  return { ...state, acuteIllnessBolus: clamp(state.acuteIllnessBolus + magnitude, 0, 1) };
}

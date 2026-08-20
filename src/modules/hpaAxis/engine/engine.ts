import { CRH, ACTH, CORTISOL, ACUTE_STRESSOR } from './constants';
import { crhDriveTarget } from './crh';
import { acthLevelTarget } from './acth';
import { cortisolLevelTarget } from './cortisol';
import { tickAdrenalReserve } from './adrenalReserve';
import { approach, clamp } from '@/shared/lib/math';
import type { HpaDerived, HpaInputs, HpaSnapshot, HpaState } from './types';

export function createInitialState(): HpaState {
  return {
    simTimeSeconds: 0,
    crhDrive: 0,
    acthLevel: 0,
    cortisolLevel: CORTISOL.BASAL_UGDL,
    adrenalReserve: 1,
    acuteStressBolus: 0,
  };
}

/**
 * Computes every derived HPA-axis value for the current tick from the current cortisol level
 * and inputs, using the *smoothed* CRH/ACTH actuator levels carried on state (each relaxes
 * toward its target on its own time constant — see `tick`). Mirrors the cardiorenal and
 * respiratory engines' computeDerived/tick split.
 */
export function computeDerived(state: HpaState, inputs: HpaInputs): HpaDerived {
  return {
    crhDrive: state.crhDrive,
    acthLevel: state.acthLevel,
    cortisolLevel: state.cortisolLevel,
    adrenalReserve: state.adrenalReserve,
    acuteStressBolus: state.acuteStressBolus,
    pituitaryFunction: inputs.pituitaryFunction,
    adrenalCortexFunction: inputs.adrenalCortexFunction,
    autonomousAdrenalSecretion: inputs.autonomousAdrenalSecretion,
    exogenousGlucocorticoid: inputs.exogenousGlucocorticoid,
    acuteStressLevel: inputs.acuteStressLevel,
  };
}

export function tick(state: HpaState, derived: HpaDerived, dtSeconds: number): HpaState {
  const targetCrh = crhDriveTarget(derived.acuteStressLevel, state.acuteStressBolus, state.cortisolLevel, state.simTimeSeconds);
  const targetActh = acthLevelTarget(state.crhDrive, state.cortisolLevel, derived.pituitaryFunction);
  const targetCortisol = cortisolLevelTarget(
    state.acthLevel,
    derived.adrenalCortexFunction,
    state.adrenalReserve,
    derived.autonomousAdrenalSecretion,
    derived.exogenousGlucocorticoid,
  );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    crhDrive: approach(state.crhDrive, targetCrh, dtSeconds, CRH.TAU_SECONDS),
    acthLevel: approach(state.acthLevel, targetActh, dtSeconds, ACTH.TAU_SECONDS),
    cortisolLevel: clamp(
      approach(state.cortisolLevel, targetCortisol, dtSeconds, CORTISOL.TAU_SECONDS),
      CORTISOL.MIN_UGDL,
      CORTISOL.MAX_UGDL,
    ),
    adrenalReserve: tickAdrenalReserve(state.adrenalReserve, derived.exogenousGlucocorticoid, dtSeconds),
    acuteStressBolus: approach(state.acuteStressBolus, 0, dtSeconds, ACUTE_STRESSOR.RECOVERY_TAU_SECONDS),
  };
}

export function step(state: HpaState, inputs: HpaInputs, dtSeconds: number): HpaSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute stressor perturbation (e.g. trauma, acute illness) — instant jump on the transient
 * bolus state field, which then relaxes back to 0 via tick()'s own approach() call, mirroring
 * perturbBloodVolume/perturbAirwayObstruction's pattern. */
export function perturbAcuteStressor(state: HpaState, magnitude: number = ACUTE_STRESSOR.DEFAULT_MAGNITUDE): HpaState {
  return { ...state, acuteStressBolus: clamp(state.acuteStressBolus + magnitude, 0, 1) };
}

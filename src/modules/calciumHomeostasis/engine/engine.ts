import { CALCITONIN, CALCITRIOL, CALCIUM, PHOSPHATE, PRECIPITATION, PTH } from './constants';
import { pthLevelTarget, pthPgPerML } from './pth';
import { calcitriolLevelTarget } from './calcitriol';
import { calcitoninLevelTarget } from './calcitonin';
import { boneCalciumRelease, bonePhosphateRelease, boneResorptionRate } from './boneRemodeling';
import { renalCaReabsorptionFraction, renalCalciumLoss, renalPhosphateExcretionFraction, renalPhosphateLoss } from './renalHandling';
import { gutCaAbsorptionFraction, gutCalciumInflux, gutPhosphateAbsorptionFraction, gutPhosphateInflux } from './gutAbsorption';
import { approach, clamp } from '@/shared/lib/math';
import type { CalciumDerived, CalciumInputs, CalciumSnapshot, CalciumState } from './types';

export function createInitialState(): CalciumState {
  return {
    simTimeSeconds: 0,
    serumCalciumMgDl: CALCIUM.SETPOINT_MGDL,
    serumPhosphateMgDl: PHOSPHATE.SETPOINT_MGDL,
    pthLevel: 0.33,
    calcitriolLevel: 0.43,
    calcitoninLevel: 0,
  };
}

/** Calcium lost to soft-tissue calcium-phosphate deposition once the Ca × phosphate product
 * exceeds the clinical threshold — the mechanism behind ectopic calcification in CKD-MBD. */
function ectopicCalcificationLoss(calciumPhosphateProduct: number): number {
  return Math.max(0, calciumPhosphateProduct - PRECIPITATION.CA_P_PRODUCT_THRESHOLD) * PRECIPITATION.GAIN;
}

/**
 * Computes every derived calcium/phosphate value for the current tick from the current serum
 * levels and inputs, using the *smoothed* PTH/calcitriol/calcitonin actuator levels carried on
 * state (each relaxes toward its target on its own time constant — see `tick`). Mirrors the
 * other modules' computeDerived/tick split.
 */
export function computeDerived(state: CalciumState, inputs: CalciumInputs): CalciumDerived {
  const resorption = boneResorptionRate(state.pthLevel, state.calcitoninLevel, inputs.serumMagnesium);
  const caReabsorption = renalCaReabsorptionFraction(state.pthLevel, inputs.serumMagnesium);
  const phosphateExcretion = renalPhosphateExcretionFraction(state.pthLevel, inputs.renalFunction);
  const gutCa = gutCaAbsorptionFraction(state.calcitriolLevel);
  const gutPhosphate = gutPhosphateAbsorptionFraction(state.calcitriolLevel);

  return {
    serumCalciumMgDl: state.serumCalciumMgDl,
    serumPhosphateMgDl: state.serumPhosphateMgDl,
    pthLevel: state.pthLevel,
    pthPgPerML: pthPgPerML(state.pthLevel),
    calcitriolLevel: state.calcitriolLevel,
    calcitoninLevel: state.calcitoninLevel,
    boneResorptionRate: resorption,
    renalCaReabsorptionFraction: caReabsorption,
    renalPhosphateExcretionFraction: phosphateExcretion,
    gutCaAbsorptionFraction: gutCa,
    gutPhosphateAbsorptionFraction: gutPhosphate,
    calciumPhosphateProduct: state.serumCalciumMgDl * state.serumPhosphateMgDl,
    dietaryCalciumIntake: inputs.dietaryCalciumIntake,
    dietaryPhosphateIntake: inputs.dietaryPhosphateIntake,
    vitaminDIntake: inputs.vitaminDIntake,
    renalFunction: inputs.renalFunction,
    parathyroidGlandFunction: inputs.parathyroidGlandFunction,
    serumMagnesium: inputs.serumMagnesium,
    autonomousPTHSecretion: inputs.autonomousPTHSecretion,
  };
}

export function tick(state: CalciumState, derived: CalciumDerived, dtSeconds: number): CalciumState {
  // Calcium mass balance: bone resorption + gut absorption in; renal loss, mass-action bone
  // deposition, and any ectopic calcification out.
  const caIn = boneCalciumRelease(derived.boneResorptionRate) + gutCalciumInflux(derived.dietaryCalciumIntake, derived.gutCaAbsorptionFraction);
  const caOut =
    renalCalciumLoss(derived.renalCaReabsorptionFraction) +
    state.serumCalciumMgDl * CALCIUM.DEPOSITION_GAIN +
    ectopicCalcificationLoss(derived.calciumPhosphateProduct);
  const dCalcium = (caIn - caOut) * CALCIUM.FLUX_GAIN * dtSeconds;

  // Phosphate mass balance: PTH's phosphaturic renal action is the main escape route, which is
  // exactly what fails in CKD.
  const phosphateIn =
    bonePhosphateRelease(derived.boneResorptionRate) + gutPhosphateInflux(derived.dietaryPhosphateIntake, derived.gutPhosphateAbsorptionFraction);
  const phosphateOut = renalPhosphateLoss(derived.renalPhosphateExcretionFraction) + state.serumPhosphateMgDl * PHOSPHATE.DEPOSITION_GAIN;
  const dPhosphate = (phosphateIn - phosphateOut) * PHOSPHATE.FLUX_GAIN * dtSeconds;

  const targetPth = pthLevelTarget(state.serumCalciumMgDl, derived.parathyroidGlandFunction, derived.serumMagnesium, derived.autonomousPTHSecretion);
  const targetCalcitriol = calcitriolLevelTarget(state.pthLevel, derived.vitaminDIntake, derived.renalFunction);
  const targetCalcitonin = calcitoninLevelTarget(state.serumCalciumMgDl);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    serumCalciumMgDl: clamp(state.serumCalciumMgDl + dCalcium, CALCIUM.MIN_MGDL, CALCIUM.MAX_MGDL),
    serumPhosphateMgDl: clamp(state.serumPhosphateMgDl + dPhosphate, PHOSPHATE.MIN_MGDL, PHOSPHATE.MAX_MGDL),
    pthLevel: approach(state.pthLevel, targetPth, dtSeconds, PTH.TAU_SECONDS),
    calcitriolLevel: approach(state.calcitriolLevel, targetCalcitriol, dtSeconds, CALCITRIOL.TAU_SECONDS),
    calcitoninLevel: approach(state.calcitoninLevel, targetCalcitonin, dtSeconds, CALCITONIN.TAU_SECONDS),
  };
}

export function step(state: CalciumState, inputs: CalciumInputs, dtSeconds: number): CalciumSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute calcium load perturbation (e.g. an IV calcium infusion) — an instant jump on serum
 * calcium, which the feedback loop then corrects back down, mirroring the other modules'
 * instant-jump-then-relax perturbation pattern. */
export function perturbCalciumInfusion(state: CalciumState, magnitudeMgDl = 2.5): CalciumState {
  return { ...state, serumCalciumMgDl: clamp(state.serumCalciumMgDl + magnitudeMgDl, CALCIUM.MIN_MGDL, CALCIUM.MAX_MGDL) };
}

import { COMMON, FIBRINOLYSIS, INJURY, PLATELETS } from './constants';
import { extrinsicXaGeneration } from './extrinsicPathway';
import { intrinsicXaGeneration } from './intrinsicPathway';
import { anticoagulantBrake, fibrinTarget, thrombinAmplification, thrombinTarget } from './commonPathway';
import { plateletPlugTarget, plateletSurface } from './platelets';
import { dDimerTarget, plasminTarget } from './fibrinolysis';
import {
  activatedPartialThromboplastinTime,
  bleedingTimeMinutes,
  dDimerNgMl,
  fibrinogenMgDl,
  internationalNormalisedRatio,
  plateletCountValue,
  prothrombinTime,
} from './labTests';
import { approach, clamp } from '@/shared/lib/math';
import type { CoagDerived, CoagInputs, CoagSnapshot, CoagState } from './types';

export function createInitialState(): CoagState {
  return {
    simTimeSeconds: 0,
    tissueFactorExposure: 0,
    factorXa: 0,
    thrombin: 0,
    fibrin: 0,
    plateletPlug: 0,
    plasmin: 0,
    dDimer: 0,
    secondsSinceInjury: -1,
    timeToClotSeconds: 0,
  };
}

/** Clot integrity, 0..1. A durable clot needs BOTH arms of haemostasis: the platelet plug
 * seals the breach quickly but is fragile, and the fibrin mesh gives it tensile strength.
 * Either alone leaves the patient bleeding, which is why the two are tested separately. */
export function clotStrength(plateletPlug: number, fibrin: number): number {
  return clamp(plateletPlug * 0.45 + fibrin * 0.55, 0, 1);
}

export function computeDerived(state: CoagState, inputs: CoagInputs): CoagDerived {
  const strength = clotStrength(state.plateletPlug, state.fibrin);
  // Bleeding is judged against whether the breach ever got sealed, not against whether tissue
  // factor is still exposed — in a severe factor deficiency the stimulus fades while the
  // patient is still very much bleeding.
  const injured = state.secondsSinceInjury >= 0;

  return {
    tissueFactorExposure: state.tissueFactorExposure,
    factorXa: state.factorXa,
    thrombin: state.thrombin,
    fibrin: state.fibrin,
    plateletPlug: state.plateletPlug,
    plasmin: state.plasmin,
    dDimer: state.dDimer,
    clotStrength: strength,
    timeToClotSeconds: state.timeToClotSeconds,
    isBleeding: injured && strength < INJURY.HEMOSTASIS_THRESHOLD,
    ptSeconds: prothrombinTime(inputs),
    inr: internationalNormalisedRatio(prothrombinTime(inputs)),
    apttSeconds: activatedPartialThromboplastinTime(inputs),
    bleedingTimeMinutes: bleedingTimeMinutes(inputs),
    fibrinogenMgDl: fibrinogenMgDl(inputs.fibrinogenLevel),
    plateletCountValue: plateletCountValue(inputs.plateletCount),
    dDimerNgMl: dDimerNgMl(state.dDimer),
    factorVIIIActivity: inputs.factorVIIIActivity,
    factorIXActivity: inputs.factorIXActivity,
    vitaminKDependentFactors: inputs.vitaminKDependentFactors,
    vonWillebrandFactor: inputs.vonWillebrandFactor,
    plateletCount: inputs.plateletCount,
    fibrinogenLevel: inputs.fibrinogenLevel,
    heparinDose: inputs.heparinDose,
    aspirinDose: inputs.aspirinDose,
    fibrinolyticActivity: inputs.fibrinolyticActivity,
  };
}

export function tick(state: CoagState, derived: CoagDerived, dtSeconds: number): CoagState {
  const surface = plateletSurface(derived.plateletCount);

  // Both limbs feed the same pool of factor Xa — the convergence the common pathway is named for.
  const extrinsic = extrinsicXaGeneration(state.tissueFactorExposure, derived.vitaminKDependentFactors, state.thrombin);
  const intrinsic = intrinsicXaGeneration(
    derived.factorVIIIActivity,
    derived.factorIXActivity,
    derived.vonWillebrandFactor,
    derived.vitaminKDependentFactors,
    surface,
  );
  // The intrinsic limb only contributes once the extrinsic trigger has produced some thrombin
  // to amplify it — in vivo the two are sequential, not parallel.
  const targetXa = clamp(extrinsic + intrinsic * clamp(state.thrombin * 2, 0, 1), 0, 1);

  const amplification = thrombinAmplification(state.thrombin);
  const brake = anticoagulantBrake(derived.heparinDose, state.thrombin);
  const targetThrombin = thrombinTarget(state.factorXa, derived.vitaminKDependentFactors, amplification, brake);

  const targetPlasmin = plasminTarget(state.fibrin, derived.fibrinolyticActivity);
  const targetFibrin = fibrinTarget(state.thrombin, derived.fibrinogenLevel, state.plasmin);
  const targetPlug = plateletPlugTarget(
    state.tissueFactorExposure,
    derived.plateletCount,
    derived.vonWillebrandFactor,
    derived.aspirinDose,
  );

  const nextFibrin = approach(state.fibrin, targetFibrin, dtSeconds, COMMON.FIBRIN_TAU_SECONDS);
  const nextPlug = approach(state.plateletPlug, targetPlug, dtSeconds, PLATELETS.PLUG_TAU_SECONDS);

  // Track how long the injury has taken to seal.
  const injuryRunning = state.secondsSinceInjury >= 0;
  const secondsSinceInjury = injuryRunning ? state.secondsSinceInjury + dtSeconds : -1;
  const alreadySealed = state.timeToClotSeconds > 0;
  const nowSealed = clotStrength(nextPlug, nextFibrin) >= INJURY.HEMOSTASIS_THRESHOLD;
  const timeToClotSeconds = injuryRunning && !alreadySealed && nowSealed ? secondsSinceInjury : state.timeToClotSeconds;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // The breach is progressively covered as the clot forms, withdrawing the stimulus.
    tissueFactorExposure: approach(state.tissueFactorExposure, 0, dtSeconds, INJURY.SEALING_TAU_SECONDS),
    factorXa: approach(state.factorXa, targetXa, dtSeconds, COMMON.XA_TAU_SECONDS),
    thrombin: approach(state.thrombin, targetThrombin, dtSeconds, COMMON.THROMBIN_TAU_SECONDS),
    fibrin: nextFibrin,
    plateletPlug: nextPlug,
    plasmin: approach(state.plasmin, targetPlasmin, dtSeconds, FIBRINOLYSIS.PLASMIN_TAU_SECONDS),
    dDimer: approach(state.dDimer, dDimerTarget(state.plasmin, state.fibrin, derived.fibrinolyticActivity), dtSeconds, FIBRINOLYSIS.D_DIMER_TAU_SECONDS),
    secondsSinceInjury,
    timeToClotSeconds,
  };
}

export function step(state: CoagState, inputs: CoagInputs, dtSeconds: number): CoagSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Injure vessel" perturbation — exposes tissue factor and starts the clock, firing the
 * cascade exactly as a breached endothelium does. */
export function perturbInjury(state: CoagState, magnitude: number = INJURY.DEFAULT_MAGNITUDE): CoagState {
  return {
    ...state,
    tissueFactorExposure: clamp(magnitude, 0, 1),
    secondsSinceInjury: 0,
    timeToClotSeconds: 0,
  };
}

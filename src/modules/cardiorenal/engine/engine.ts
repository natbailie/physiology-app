import { SIMULATION } from './constants';
import { preloadFactor } from './starling';
import { anpLevel as anpLevelTarget, anpNatriuresisBoost, anpToneReliefMultiplier } from './anp';
import {
  raasActivation as raasActivationTarget,
  angiotensinIIToneMultiplier,
  angiotensinIIEfferentBoost,
  aldosteroneReabsorptionBoost,
} from './raas';
import {
  baroreflexDrive as baroreflexDriveTarget,
  baroreflexToneMultiplier,
  effectiveHeartRate,
} from './baroreflex';
import { strokeVolume, cardiacOutput, effectiveSVR, meanArterialPressure } from './hemodynamics';
import {
  autoregulation,
  renalBloodFlow,
  filtrationFraction,
  gfr,
  reabsorptionFraction,
  urineOutput,
} from './renal';
import { approach, clamp } from '@/shared/lib/math';
import { BAROREFLEX, RAAS, ANP } from './constants';
import type { DerivedValues, SimInputs, SimSnapshot, SimState } from './types';

export function createInitialState(): SimState {
  return {
    bloodVolume: 100,
    simTimeSeconds: 0,
    baroreflexDrive: 0,
    raasActivation: 0,
    anpLevel: 0,
  };
}

/**
 * Computes every derived physiological value for the current tick from the current
 * blood volume and inputs, using the *smoothed* baroreflex/RAAS/ANP actuator levels
 * carried on state (each relaxes toward its target on its own time constant — see
 * `tick`). Using the smoothed values here rather than reacting to this tick's own
 * MAP avoids a circular calculation and is what keeps the loop stable.
 */
export function computeDerived(state: SimState, inputs: SimInputs): DerivedValues {
  const preload = preloadFactor(state.bloodVolume, inputs.contractility);

  const drive = state.baroreflexDrive;
  const raas = state.raasActivation;
  const anp = state.anpLevel;
  const angiotensinII = raas;
  const aldosterone = raas;

  const effHeartRate = effectiveHeartRate(inputs.heartRate, drive);

  const sv = strokeVolume(inputs.contractility, preload);
  const co = cardiacOutput(effHeartRate, sv);

  const svr = effectiveSVR(
    inputs.vascularTone,
    baroreflexToneMultiplier(drive),
    angiotensinIIToneMultiplier(angiotensinII),
    anpToneReliefMultiplier(anp),
  );
  const map = meanArterialPressure(co, svr);

  const autoreg = autoregulation(map);
  const rbf = renalBloodFlow(inputs.kidneyFunction, autoreg, co);
  const ff = filtrationFraction(angiotensinIIEfferentBoost(angiotensinII));
  const currentGfr = gfr(rbf, ff);

  const reabsorption = reabsorptionFraction(
    aldosteroneReabsorptionBoost(aldosterone),
    anpNatriuresisBoost(anp),
  );
  const urine = urineOutput(currentGfr, reabsorption);

  return {
    preloadFactor: preload,
    anpLevel: anp,
    raasActivation: raas,
    angiotensinII,
    aldosterone,
    baroreflexDrive: drive,
    effectiveHeartRate: effHeartRate,
    strokeVolume: sv,
    cardiacOutput: co,
    effectiveSVR: svr,
    meanArterialPressure: map,
    renalAutoregulation: autoreg,
    renalBloodFlow: rbf,
    filtrationFraction: ff,
    gfr: currentGfr,
    reabsorptionFraction: reabsorption,
    urineOutput: urine,
    netFluidBalance: inputs.sodiumIntake - urine,
  };
}

export function tick(state: SimState, derived: DerivedValues, dtSeconds: number): SimState {
  const dBloodVolume = derived.netFluidBalance * SIMULATION.BLOOD_VOLUME_GAIN * dtSeconds;
  const bloodVolume = clamp(
    state.bloodVolume + dBloodVolume,
    SIMULATION.BLOOD_VOLUME_MIN_PCT,
    SIMULATION.BLOOD_VOLUME_MAX_PCT,
  );

  const targetDrive = baroreflexDriveTarget(derived.meanArterialPressure);
  const targetAnp = anpLevelTarget(derived.preloadFactor);
  const targetRaas = raasActivationTarget(derived.meanArterialPressure, derived.gfr, state.anpLevel);

  return {
    bloodVolume,
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    baroreflexDrive: approach(state.baroreflexDrive, targetDrive, dtSeconds, BAROREFLEX.TAU_SECONDS),
    raasActivation: approach(state.raasActivation, targetRaas, dtSeconds, RAAS.TAU_SECONDS),
    anpLevel: approach(state.anpLevel, targetAnp, dtSeconds, ANP.TAU_SECONDS),
  };
}

export function step(state: SimState, inputs: SimInputs, dtSeconds: number): SimSnapshot {
  const derived = computeDerived(state, inputs);
  const nextState = tick(state, derived, dtSeconds);
  return { state: nextState, derived };
}

/** Directly drops blood volume, e.g. for an acute hemorrhage event. */
export function perturbBloodVolume(state: SimState, multiplier: number): SimState {
  return {
    ...state,
    bloodVolume: clamp(
      state.bloodVolume * multiplier,
      SIMULATION.BLOOD_VOLUME_MIN_PCT,
      SIMULATION.BLOOD_VOLUME_MAX_PCT,
    ),
  };
}

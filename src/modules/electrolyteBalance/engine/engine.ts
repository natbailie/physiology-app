import {
  ADH,
  ALDOSTERONE,
  BASELINE,
  CORRECTION,
  EXTRARENAL_LOSSES,
  INFUSIONS,
  INTAKE,
  LIMITS,
  SECONDS_PER_DAY,
  THIRST,
  TRANSCELLULAR,
} from './constants';
import {
  correctedSodium,
  ecfVolume,
  effectiveOsmolality,
  serumOsmolality,
  serumPotassium,
  serumSodium,
  tonicity,
  volumeStatus,
} from './fluidCompartments';
import { targetEcfPotassiumFraction } from './transcellularShift';
import { adhTarget, freeWaterClearance, osmolarLoad, urineOsmolality, urineVolume } from './tonicityRegulation';
import { aldosteroneTarget, sodiumExcretion, thirstTarget } from './volumeRegulation';
import { ecgRisk, potassiumExcretion, transtubularKGradient } from './renalPotassium';
import { classifyDisorder, demyelinationRisk } from './correctionKinetics';
import { approach, clamp } from '@/shared/lib/math';
import type { ElectrolyteDerived, ElectrolyteInputs, ElectrolyteSnapshot, ElectrolyteState } from './types';

export function createInitialState(): ElectrolyteState {
  return {
    simTimeSeconds: 0,
    exchangeableSodiumMeq: BASELINE.EXCHANGEABLE_SODIUM_MEQ,
    exchangeablePotassiumMeq: BASELINE.EXCHANGEABLE_POTASSIUM_MEQ,
    ecfPotassiumMeq: BASELINE.ECF_POTASSIUM_MEQ,
    totalBodyWaterL: BASELINE.TOTAL_BODY_WATER_L,
    adhLevel: 0.31,
    aldosteroneLevel: 1,
    thirstDrive: 0,
    sodiumChangeRateMeqLPerDay: 0,
    adaptedSodiumMeqL: BASELINE.SERUM_SODIUM_MEQ_L,
  };
}

export function computeDerived(state: ElectrolyteState, inputs: ElectrolyteInputs): ElectrolyteDerived {
  const totalBodyPotassiumMeq = state.exchangeablePotassiumMeq;
  const ecfVolumeL = ecfVolume(state.exchangeableSodiumMeq, totalBodyPotassiumMeq, state.totalBodyWaterL, inputs.serumGlucoseMgDl);
  const ecfVolumeRatio = ecfVolumeL / BASELINE.ECF_VOLUME_L;

  const serumSodiumMeqL = serumSodium(state.exchangeableSodiumMeq, totalBodyPotassiumMeq, state.totalBodyWaterL, inputs.serumGlucoseMgDl);
  const serumPotassiumMeqL = serumPotassium(state.ecfPotassiumMeq, ecfVolumeL);
  const osmolality = serumOsmolality(serumSodiumMeqL, inputs.serumGlucoseMgDl);
  const effectiveOsm = effectiveOsmolality(serumSodiumMeqL, inputs.serumGlucoseMgDl);

  const sodiumExcretionMeqPerDay = sodiumExcretion(ecfVolumeRatio, state.aldosteroneLevel, inputs.diuretic);
  const urineOsm = urineOsmolality(state.adhLevel, inputs.diuretic);

  // Urine volume and potassium excretion are mutually dependent: potassium secretion depends on
  // distal flow, and flow depends on the osmolar load that potassium contributes to. Two
  // iterations of the fixed point are more than enough for the loop to settle.
  let currentUrineVolume = 1.5;
  let potassiumExcretionMeqPerDay = 0;
  for (let pass = 0; pass < 2; pass++) {
    potassiumExcretionMeqPerDay = potassiumExcretion(
      serumPotassiumMeqL,
      state.aldosteroneLevel,
      currentUrineVolume,
      inputs.gfrFraction,
      inputs.arterialPH,
      inputs.diuretic,
    );
    currentUrineVolume = urineVolume(osmolarLoad(sodiumExcretionMeqPerDay, potassiumExcretionMeqPerDay), urineOsm);
  }

  const targetFraction = targetEcfPotassiumFraction(inputs.insulinLevel, inputs.beta2Activity, inputs.arterialPH, effectiveOsm);
  const targetEcfPotassiumMeq = totalBodyPotassiumMeq * targetFraction;

  const currentTonicity = tonicity(effectiveOsm);
  const currentVolumeStatus = volumeStatus(ecfVolumeL);

  return {
    serumSodiumMeqL,
    serumPotassiumMeqL,
    correctedSodiumMeqL: correctedSodium(serumSodiumMeqL, inputs.serumGlucoseMgDl),
    serumOsmolality: osmolality,
    effectiveOsmolality: effectiveOsm,
    tonicity: currentTonicity,
    ecfVolumeL,
    icfVolumeL: state.totalBodyWaterL - ecfVolumeL,
    totalBodyWaterL: state.totalBodyWaterL,
    ecfVolumeStatus: currentVolumeStatus,
    ecfPotassiumFraction: state.ecfPotassiumMeq / Math.max(totalBodyPotassiumMeq, 1),
    totalBodyPotassiumMeq,
    // Positive when potassium is being driven into cells.
    transcellularShiftMeqPerDay: ((state.ecfPotassiumMeq - targetEcfPotassiumMeq) / TRANSCELLULAR.TAU_SECONDS) * SECONDS_PER_DAY,
    adhLevel: state.adhLevel,
    aldosteroneLevel: state.aldosteroneLevel,
    thirstDrive: state.thirstDrive,
    urineOsmolality: urineOsm,
    urineVolumeLPerDay: currentUrineVolume,
    freeWaterClearanceLPerDay: freeWaterClearance(currentUrineVolume, urineOsm, osmolality),
    sodiumExcretionMeqPerDay,
    potassiumExcretionMeqPerDay,
    transtubularKGradient: transtubularKGradient(
      potassiumExcretionMeqPerDay,
      currentUrineVolume,
      urineOsm,
      osmolality,
      serumPotassiumMeqL,
    ),
    sodiumChangeRateMeqLPerDay: state.sodiumChangeRateMeqLPerDay,
    adaptedSodiumMeqL: state.adaptedSodiumMeqL,
    demyelinationRisk: demyelinationRisk(state.sodiumChangeRateMeqLPerDay, state.adaptedSodiumMeqL),
    ecgRisk: ecgRisk(serumPotassiumMeqL),
    disorderClassification: classifyDisorder(
      serumSodiumMeqL,
      serumPotassiumMeqL,
      currentTonicity,
      currentVolumeStatus,
      urineOsm,
      inputs.serumGlucoseMgDl,
    ),
    sodiumIntake: inputs.sodiumIntake,
    potassiumIntake: inputs.potassiumIntake,
    waterIntake: inputs.waterIntake,
    insulinLevel: inputs.insulinLevel,
    beta2Activity: inputs.beta2Activity,
    arterialPH: inputs.arterialPH,
    aldosteroneDrive: inputs.aldosteroneDrive,
    gfrFraction: inputs.gfrFraction,
    serumGlucoseMgDl: inputs.serumGlucoseMgDl,
    adhMode: inputs.adhMode,
    extrarenalLoss: inputs.extrarenalLoss,
    diuretic: inputs.diuretic,
    infusion: inputs.infusion,
  };
}

export function tick(state: ElectrolyteState, derived: ElectrolyteDerived, dtSeconds: number): ElectrolyteState {
  const dtDays = dtSeconds / SECONDS_PER_DAY;
  const loss = EXTRARENAL_LOSSES[derived.extrarenalLoss];
  const infusion = INFUSIONS[derived.infusion];

  // --- Balance sheets. Each quantity is conserved: what goes in, minus what goes out. ---
  const sodiumIn = derived.sodiumIntake + infusion.volumeLPerDay * infusion.sodiumMeqPerL;
  const sodiumOut = derived.sodiumExcretionMeqPerDay + loss.volumeLPerDay * loss.sodiumMeqPerL;
  const potassiumIn = derived.potassiumIntake + infusion.volumeLPerDay * infusion.potassiumMeqPerL;
  const potassiumOut = derived.potassiumExcretionMeqPerDay + loss.volumeLPerDay * loss.potassiumMeqPerL;
  const waterIn =
    derived.waterIntake + state.thirstDrive * THIRST.MAX_L_PER_DAY + INTAKE.METABOLIC_WATER_L_PER_DAY + infusion.volumeLPerDay;
  const waterOut = derived.urineVolumeLPerDay + INTAKE.INSENSIBLE_LOSS_L_PER_DAY + loss.volumeLPerDay;

  const exchangeableSodiumMeq = clamp(
    state.exchangeableSodiumMeq + (sodiumIn - sodiumOut) * dtDays,
    LIMITS.MIN_SODIUM_MEQ,
    LIMITS.MAX_SODIUM_MEQ,
  );
  const exchangeablePotassiumMeq = clamp(
    state.exchangeablePotassiumMeq + (potassiumIn - potassiumOut) * dtDays,
    LIMITS.MIN_POTASSIUM_MEQ,
    LIMITS.MAX_POTASSIUM_MEQ,
  );
  const totalBodyWaterL = clamp(
    state.totalBodyWaterL + (waterIn - waterOut) * dtDays,
    LIMITS.MIN_TOTAL_BODY_WATER_L,
    LIMITS.MAX_TOTAL_BODY_WATER_L,
  );

  // Everything entering or leaving the body does so through the ECF, so apply the net flux there
  // first — then let the transcellular shift redistribute toward its target. Keeping these two
  // steps separate is what lets serum potassium and total body potassium move independently.
  const ecfAfterFlux = state.ecfPotassiumMeq + (potassiumIn - potassiumOut) * dtDays;
  const targetEcfPotassiumMeq =
    exchangeablePotassiumMeq *
    targetEcfPotassiumFraction(derived.insulinLevel, derived.beta2Activity, derived.arterialPH, derived.effectiveOsmolality);
  const ecfPotassiumMeq = clamp(
    approach(ecfAfterFlux, targetEcfPotassiumMeq, dtSeconds, TRANSCELLULAR.TAU_SECONDS),
    LIMITS.MIN_ECF_POTASSIUM_MEQ,
    exchangeablePotassiumMeq,
  );

  // --- Rate of change of serum sodium: the number that decides whether treatment is safe ---
  const nextSerumSodium = serumSodium(exchangeableSodiumMeq, exchangeablePotassiumMeq, totalBodyWaterL, derived.serumGlucoseMgDl);
  const instantaneousRate = (nextSerumSodium - derived.serumSodiumMeqL) / Math.max(dtDays, 1e-9);
  const sodiumChangeRateMeqLPerDay = approach(
    state.sodiumChangeRateMeqLPerDay,
    clamp(instantaneousRate, -80, 80),
    dtSeconds,
    CORRECTION.RATE_TAU_SECONDS,
  );

  // --- Actuators, each on its own time constant: shift fastest, then ADH, thirst, aldosterone ---
  const ecfVolumeRatio =
    ecfVolume(exchangeableSodiumMeq, exchangeablePotassiumMeq, totalBodyWaterL, derived.serumGlucoseMgDl) / BASELINE.ECF_VOLUME_L;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    exchangeableSodiumMeq,
    exchangeablePotassiumMeq,
    ecfPotassiumMeq,
    totalBodyWaterL,
    adhLevel: clamp(
      approach(state.adhLevel, adhTarget(derived.effectiveOsmolality, ecfVolumeRatio, derived.adhMode), dtSeconds, ADH.TAU_SECONDS),
      0,
      1,
    ),
    aldosteroneLevel: clamp(
      approach(
        state.aldosteroneLevel,
        aldosteroneTarget(ecfVolumeRatio, derived.serumPotassiumMeqL, derived.aldosteroneDrive),
        dtSeconds,
        ALDOSTERONE.TAU_SECONDS,
      ),
      0,
      ALDOSTERONE.MAX_LEVEL,
    ),
    thirstDrive: clamp(
      approach(state.thirstDrive, thirstTarget(derived.effectiveOsmolality), dtSeconds, THIRST.TAU_SECONDS),
      0,
      1,
    ),
    sodiumChangeRateMeqLPerDay,
    adaptedSodiumMeqL: approach(state.adaptedSodiumMeqL, nextSerumSodium, dtSeconds, CORRECTION.BRAIN_ADAPTATION_TAU_SECONDS),
  };
}

export function step(state: ElectrolyteState, inputs: ElectrolyteInputs, dtSeconds: number): ElectrolyteSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Give insulin" — the classic emergency treatment for hyperkalaemia. It drives potassium into
 * cells within minutes and removes not one milliequivalent from the body, which is exactly why
 * the serum level rebounds later unless something is also done about total body potassium. */
export function perturbGiveInsulin(state: ElectrolyteState, fraction = 0.22): ElectrolyteState {
  return {
    ...state,
    ecfPotassiumMeq: Math.max(LIMITS.MIN_ECF_POTASSIUM_MEQ, state.ecfPotassiumMeq * (1 - fraction)),
  };
}

/** A one-litre bolus of normal saline: isotonic, so it expands the ECF and barely moves the
 * serum sodium — which is the point of giving it to a hypovolaemic patient. */
export function perturbSalineBolus(state: ElectrolyteState, litres = 1): ElectrolyteState {
  return {
    ...state,
    exchangeableSodiumMeq: clamp(
      state.exchangeableSodiumMeq + litres * INFUSIONS.normalSaline.sodiumMeqPerL,
      LIMITS.MIN_SODIUM_MEQ,
      LIMITS.MAX_SODIUM_MEQ,
    ),
    totalBodyWaterL: clamp(state.totalBodyWaterL + litres, LIMITS.MIN_TOTAL_BODY_WATER_L, LIMITS.MAX_TOTAL_BODY_WATER_L),
  };
}

/** An intravenous potassium load — added to the ECF, where it is measured, before the shift has
 * had any time to hide it inside cells. */
export function perturbPotassiumBolus(state: ElectrolyteState, meq = 25): ElectrolyteState {
  return {
    ...state,
    exchangeablePotassiumMeq: clamp(state.exchangeablePotassiumMeq + meq, LIMITS.MIN_POTASSIUM_MEQ, LIMITS.MAX_POTASSIUM_MEQ),
    ecfPotassiumMeq: state.ecfPotassiumMeq + meq,
  };
}

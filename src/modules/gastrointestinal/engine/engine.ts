import { CCK, DUODENAL_PH, GASTRIC_EMPTYING, GASTRIC_PH, GASTRIN, GIP_GLP1, GI_SIMULATION, MOTILITY, SECRETIN, SOMATOSTATIN } from './constants';
import { parietalCellAcidOutput } from './parietalCell';
import { gastrinDriveTarget } from './gastrin';
import { somatostatinDriveTarget } from './somatostatin';
import { cckDriveTarget } from './cck';
import { secretinDriveTarget } from './secretin';
import { gipGlp1DriveTarget } from './gipGlp1';
import { gastricEmptyingRatePerSecond } from './gastricEmptying';
import { approach, clamp, scaleClamped } from '@/shared/lib/math';
import type { GiDerived, GiInputs, GiSnapshot, GiState } from './types';

export function createInitialState(): GiState {
  return {
    simTimeSeconds: 0,
    gastricPH: GASTRIC_PH.UNSTIMULATED_PH,
    gastricVolumeFraction: 0,
    duodenalPH: DUODENAL_PH.BASELINE,
    gastrinDrive: 0,
    cckDrive: 0,
    secretinDrive: 0,
    gipGlp1Drive: 0,
    somatostatinDrive: 0,
    motilinPhase: 0,
  };
}

/**
 * Computes every derived GI value for the current tick from the current gastric/duodenal pH
 * and inputs, using the *smoothed* hormone actuator levels carried on state (each relaxes
 * toward its target on its own time constant — see `tick`). Mirrors the other modules'
 * computeDerived/tick split.
 */
export function computeDerived(state: GiState, inputs: GiInputs): GiDerived {
  const isFasting = state.gastricVolumeFraction < MOTILITY.FASTING_THRESHOLD;
  const emptyingRatePerSecond = gastricEmptyingRatePerSecond(state.cckDrive);
  const acidOutput = parietalCellAcidOutput(state.gastrinDrive, inputs.vagalTone, inputs.ppiDose, inputs.h2BlockerDose);

  return {
    gastricPH: state.gastricPH,
    duodenalPH: state.duodenalPH,
    gastricVolumeFraction: state.gastricVolumeFraction,
    gastricAcidOutput: acidOutput * 100,
    gastricEmptyingRate: isFasting ? 0 : clamp((emptyingRatePerSecond / GASTRIC_EMPTYING.BASE_RATE_PER_SECOND) * 100, 0, 200),
    gastrinDrive: state.gastrinDrive,
    cckDrive: state.cckDrive,
    secretinDrive: state.secretinDrive,
    gipGlp1Drive: state.gipGlp1Drive,
    somatostatinDrive: state.somatostatinDrive,
    motilinPhase: state.motilinPhase,
    isFasting,
    mealFatGrams: inputs.mealFatGrams,
    mealProteinGrams: inputs.mealProteinGrams,
    mealCarbGrams: inputs.mealCarbGrams,
    mealVolumeML: inputs.mealVolumeML,
    ppiDose: inputs.ppiDose,
    h2BlockerDose: inputs.h2BlockerDose,
    vagalTone: inputs.vagalTone,
    autonomousGastrinSecretion: inputs.autonomousGastrinSecretion,
  };
}

export function tick(state: GiState, derived: GiDerived, dtSeconds: number): GiState {
  const isFasting = derived.isFasting;

  // Gastric pH relaxes toward an equilibrium set by current acid output vs. how much
  // buffering meal volume remains in the stomach.
  const acidOutput = parietalCellAcidOutput(state.gastrinDrive, derived.vagalTone, derived.ppiDose, derived.h2BlockerDose);
  const targetGastricPH = clamp(
    GASTRIC_PH.UNSTIMULATED_PH - acidOutput * GASTRIC_PH.ACID_SECRETION_PH_DROP + state.gastricVolumeFraction * GASTRIC_PH.MEAL_BUFFERING_PH_RISE,
    GASTRIC_PH.MIN_PH,
    GASTRIC_PH.MAX_PH,
  );

  // Gastric emptying: exponential decay of remaining volume, slowed by CCK.
  const emptyingRatePerSecond = gastricEmptyingRatePerSecond(state.cckDrive);
  const nextGastricVolumeFraction = clamp(state.gastricVolumeFraction - state.gastricVolumeFraction * emptyingRatePerSecond * dtSeconds, 0, 1);

  // Duodenal pH falls as acidic chyme empties in, rises as secretin-driven pancreatic
  // bicarbonate neutralizes it — the acid-base tie-in between the stomach and duodenum.
  const chymeAcidity = scaleClamped(state.gastricPH, GASTRIC_PH.MIN_PH, 6, 1, 0);
  const targetDuodenalPH = clamp(
    DUODENAL_PH.BASELINE -
      state.gastricVolumeFraction * chymeAcidity * DUODENAL_PH.ACID_LOAD_PH_DROP +
      state.secretinDrive * DUODENAL_PH.BICARB_NEUTRALIZATION_PH_RISE,
    DUODENAL_PH.MIN_PH,
    DUODENAL_PH.MAX_PH,
  );

  const targetGastrin = gastrinDriveTarget(
    derived.mealProteinGrams,
    derived.mealVolumeML,
    derived.vagalTone,
    state.somatostatinDrive,
    derived.autonomousGastrinSecretion,
  );
  const targetSomatostatin = somatostatinDriveTarget(state.gastricPH);
  const targetCck = cckDriveTarget(derived.mealFatGrams, derived.mealProteinGrams, state.gastricVolumeFraction);
  const targetSecretin = secretinDriveTarget(state.duodenalPH);
  const targetGipGlp1 = gipGlp1DriveTarget(derived.mealCarbGrams, derived.mealFatGrams, state.gastricVolumeFraction);

  // Migrating motor complex: advances only while fasting, otherwise relaxes back to 0 —
  // eating interrupts the interdigestive housekeeper sweep.
  const nextMotilinPhase = isFasting
    ? (state.motilinPhase + dtSeconds / MOTILITY.MMC_CYCLE_SECONDS) % 1
    : approach(state.motilinPhase, 0, dtSeconds, MOTILITY.FASTING_RELAX_TAU_SECONDS);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    gastricPH: approach(state.gastricPH, targetGastricPH, dtSeconds, GASTRIC_PH.TAU_SECONDS),
    gastricVolumeFraction: nextGastricVolumeFraction,
    duodenalPH: approach(state.duodenalPH, targetDuodenalPH, dtSeconds, DUODENAL_PH.TAU_SECONDS),
    gastrinDrive: approach(state.gastrinDrive, targetGastrin, dtSeconds, GASTRIN.TAU_SECONDS),
    cckDrive: approach(state.cckDrive, targetCck, dtSeconds, CCK.TAU_SECONDS),
    secretinDrive: approach(state.secretinDrive, targetSecretin, dtSeconds, SECRETIN.TAU_SECONDS),
    gipGlp1Drive: approach(state.gipGlp1Drive, targetGipGlp1, dtSeconds, GIP_GLP1.TAU_SECONDS),
    somatostatinDrive: approach(state.somatostatinDrive, targetSomatostatin, dtSeconds, SOMATOSTATIN.TAU_SECONDS),
    motilinPhase: nextMotilinPhase,
  };
}

export function step(state: GiState, inputs: GiInputs, dtSeconds: number): GiSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "Eat meal" perturbation: refills the stomach to full. Composition is read from the current
 * mealFat/Protein/Carb/Volume slider values via `inputs` on the next tick — this button just
 * triggers the eating event itself, mirroring perturbBloodVolume/perturbAirwayObstruction's
 * instant-jump-then-relax pattern (here the "relaxation" is gastric emptying, not `approach`). */
export function perturbEatMeal(state: GiState): GiState {
  return { ...state, gastricVolumeFraction: GI_SIMULATION.EAT_MEAL_REFILL_FRACTION };
}

import { CARDIO, LACTATE, OXYGEN, VENTILATION } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ExerciseInputs, ExerciseState_Classification } from './types';

/** Maximal oxygen uptake: training raises it, age lowers it. */
export function vo2MaxMlMin(inputs: Pick<ExerciseInputs, 'fitnessPct' | 'ageYears'>): number {
  return (
    2100 +
    24 * clamp(inputs.fitnessPct, 0, 100) -
    Math.max(0, inputs.ageYears - 25) * 22
  );
}

export function maxHeartRateBpm(ageYears: number): number {
  return Math.max(120, CARDIO.MAX_HR_FORMULA_OFFSET - clamp(ageYears, 20, 80));
}

export function restingHeartRateBpm(fitnessPct: number): number {
  return Math.max(
    CARDIO.MIN_REST_HR_BPM,
    CARDIO.REST_HR_BASE_BPM - CARDIO.TRAINED_REST_HR_REDUCTION_PER_UNIT * clamp(fitnessPct, 0, 100),
  );
}

export function restingStrokeVolumeMl(fitnessPct: number): number {
  return CARDIO.SV_REST_ML_PER_FITNESS_UNIT + CARDIO.SV_TRAINING_ML_PER_UNIT * clamp(fitnessPct, 0, 100);
}

export function lactateThresholdFraction(fitnessPct: number): number {
  return LACTATE.THRESHOLD_FRACTION_BASE + LACTATE.THRESHOLD_SHIFT_PER_FITNESS_UNIT * clamp(fitnessPct, 0, 100);
}

/** Target VO2 for a given wattage — linear with work, capped by what the subject has. */
export function vo2DemandMlMin(workloadWatts: number): number {
  return OXYGEN.REST_VO2_ML_MIN + clamp(workloadWatts, 0, 400) * OXYGEN.ML_PER_WATT;
}

/**
 * Heart rate rises with engagement along a sigmoid-ish curve toward age-predicted maximum.
 */
export function heartRateTarget(
  workFrac: number,
  hrRest: number,
  hrMax: number,
): number {
  const span = hrMax - hrRest;
  return hrRest + span * Math.pow(clamp(workFrac, 0, 1.05), 0.62);
}

export function strokeVolumeTarget(workFrac: number, svRestMl: number): number {
  // Stroke volume plateaus by roughly half of maximal work in everyone; training raises the plateau.
  return svRestMl * (1 + (CARDIO.SV_RISE_MAX_PCT / 100) * clamp(workFrac / 0.5, 0, 1));
}

/** Ventilation tracks CO2 (hence VO2) and then hyperventilates as acidosis builds. */
export function ventilationTarget(vo2MlMin: number, lactateMmolL: number): number {
  return (
    VENTILATION.BASE_L_MIN +
    VENTILATION.L_PER_VO2 * vo2MlMin +
    Math.max(0, lactateMmolL - 4) * VENTILATION.EXTRA_PER_LACTATE_ABOVE_4
  );
}

/** Lactate sits at baseline until the threshold, then climbs steeply. */
export function lactateTargetMmol(engagement: number, thresholdFraction: number): number {
  if (engagement <= thresholdFraction) {
    return LACTATE.BASE_MMOL_L;
  }
  const excess = engagement - thresholdFraction;
  return LACTATE.BASE_MMOL_L + excess * (LACTATE.SLOPE_GAIN + LACTATE.STEEPNESS_GAIN * excess);
}

export function classifyExercise(pattern: {
  engagement: number;
  threshold: number;
  aboveVo2Max: boolean;
  fatiguePct: number;
  fitnessPct: number;
  workloadWatts: number;
}): ExerciseState_Classification {
  if (pattern.aboveVo2Max && pattern.fatiguePct > 20) return 'above VO2max: exhausting';
  if (pattern.workloadWatts <= 5 && pattern.fitnessPct >= 75) return 'trained athlete at rest';
  if (pattern.workloadWatts <= 5) return 'at rest';
  if (pattern.engagement > pattern.threshold)
    return 'above lactate threshold';
  if (pattern.engagement < 0.25) return 'light aerobic work';
  if (pattern.engagement < 0.6) return 'moderate aerobic work';
  return 'heavy aerobic work';
}

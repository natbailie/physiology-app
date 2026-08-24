import {
  CARDIO,
  EXERCISE_SIMULATION,
  FATIGUE,
  LACTATE,
  OXYGEN,
  THERMOSTRAIN,
} from './constants';
import {
  classifyExercise,
  heartRateTarget,
  lactateTargetMmol,
  lactateThresholdFraction,
  maxHeartRateBpm,
  restingHeartRateBpm,
  restingStrokeVolumeMl,
  strokeVolumeTarget,
  ventilationTarget,
  vo2DemandMlMin,
  vo2MaxMlMin,
} from './exerciseMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type {
  ExerciseDerived,
  ExerciseInputs,
  ExerciseInternalState,
  ExerciseSnapshot,
} from './types';

export function createInitialState(): ExerciseInternalState {
  return {
    simTimeSeconds: 0,
    heartRateBpm: 72,
    strokeVolumeMl: 90,
    vo2MlMin: OXYGEN.REST_VO2_ML_MIN,
    lactateMmolL: LACTATE.BASE_MMOL_L,
    ventilationLMin: 8,
    coreTempC: 37,
    fatiguePct: 0,
  };
}

export function computeDerived(state: ExerciseInternalState, inputs: ExerciseInputs): ExerciseDerived {
  const fitness = clamp(inputs.fitnessPct, 0, 100);
  const demand = vo2DemandMlMin(inputs.workloadWatts);
  const vMax = vo2MaxMlMin({ fitnessPct: fitness, ageYears: inputs.ageYears });
  const engagement = clamp(demand / vMax, 0, 1.15);
  const threshold = lactateThresholdFraction(fitness);
  const hrMax = maxHeartRateBpm(inputs.ageYears);

  const cardiacOutput = (state.heartRateBpm * state.strokeVolumeMl) / 1000;
  // Fick principle closes the loop: extraction widens to whatever the muscles need.
  const avDiff = clamp(state.vo2MlMin / Math.max(cardiacOutput, 0.5) / 10, 3, 19);

  const muscleShare = clamp(20 + 65 * engagement, 15, 88);
  // Total peripheral resistance index falls as muscle beds open; relative to rest.
  const tprIndex = clamp(100 - 55 * clamp((demand - OXYGEN.REST_VO2_ML_MIN) / Math.max(vMax - OXYGEN.REST_VO2_ML_MIN, 1), 0, 1.05), 35, 100);

  const classificationPattern = {
    engagement,
    threshold,
    aboveThreshold: engagement > threshold || state.lactateMmolL > 4,
    aboveVo2Max: demand > vMax * 1.01 && engagement >= 0.99,
    fatiguePct: state.fatiguePct,
    fitnessPct: fitness,
    workloadWatts: inputs.workloadWatts,
    lactateThresholdFraction: threshold,
  };

  return {
    vo2MlMin: state.vo2MlMin,
    vo2DemandMlMin: demand,
    vo2MaxMlMin: vMax,
    engagementFraction: engagement,
    lactateThresholdFraction: threshold,
    aboveThreshold: classificationPattern.aboveThreshold,
    aboveVo2Max: classificationPattern.aboveVo2Max,
    heartRateBpm: state.heartRateBpm,
    maxHeartRateBpm: hrMax,
    strokeVolumeMl: state.strokeVolumeMl,
    cardiacOutputLMin: cardiacOutput,
    arteriovenousDiffMlDl: avDiff,
    ventilationLMin: state.ventilationLMin,
    lactateMmolL: state.lactateMmolL,
    coreTempC: state.coreTempC,
    fatiguePct: state.fatiguePct,
    muscleFlowSharePct: muscleShare,
    totalResistanceIndex: tprIndex,
    classification: classifyExercise(classificationPattern),
    patternSummary: patternSummaryOf(classificationPattern, state),
  };
}

function patternSummaryOf(
  p: {
    engagement: number;
    lactateThresholdFraction: number;
    aboveThreshold: boolean;
    aboveVo2Max: boolean;
    fatiguePct: number;
    fitnessPct: number;
    workloadWatts: number;
  },
  state: ExerciseInternalState,
): string {
  if (p.aboveVo2Max && p.fatiguePct > 20)
    return `demand exceeds VO2max — VO2 pinned at the ceiling while lactate and fatigue climb`;
  if (p.workloadWatts <= 5)
    return `resting ${state.heartRateBpm.toFixed(0)} bpm, CO ${(state.heartRateBpm * state.strokeVolumeMl) / 1000 > 0 ? ((state.heartRateBpm * state.strokeVolumeMl) / 1000).toFixed(1) : '—'} L/min`;
  if (p.engagement > p.lactateThresholdFraction)
    return `above the threshold (${(p.lactateThresholdFraction * 100).toFixed(0)}% VO2max): lactate ${state.lactateMmolL.toFixed(1)} mmol/L climbing toward exhaustion`;
  return `${(p.engagement * 100).toFixed(0)}% of ceiling, lactate steady at ${state.lactateMmolL.toFixed(1)} mmol/L — sustainable aerobic work`;
}

export function tick(
  state: ExerciseInternalState,
  inputs: ExerciseInputs,
  dtSeconds: number,
): ExerciseInternalState {
  const fitness = clamp(inputs.fitnessPct, 0, 100);
  const hydration = clamp(inputs.hydrationPct, 0, 100);
  const demand = vo2DemandMlMin(inputs.workloadWatts);
  const vMax = vo2MaxMlMin({ fitnessPct: fitness, ageYears: inputs.ageYears });
  const engagement = clamp(demand / vMax, 0, 1.15);
  // Work fraction above REST: zero at rest, 1.0 at the VO2max ceiling.
  const workFrac = clamp((demand - OXYGEN.REST_VO2_ML_MIN) / Math.max(vMax - OXYGEN.REST_VO2_ML_MIN, 1), 0, 1.08);
  const actualVo2 = Math.min(demand, vMax);

  const hrRest = restingHeartRateBpm(fitness);
  const hrMax = maxHeartRateBpm(inputs.ageYears);
  const svRest = restingStrokeVolumeMl(fitness);
  const threshold = lactateThresholdFraction(fitness);

  const nextHr = approach(state.heartRateBpm, heartRateTarget(workFrac, hrRest, hrMax), dtSeconds, CARDIO.HR_TAU_SECONDS);
  const nextSv = approach(state.strokeVolumeMl, strokeVolumeTarget(workFrac, svRest), dtSeconds, CARDIO.SV_TAU_SECONDS);
  const nextVo2 = approach(state.vo2MlMin, actualVo2, dtSeconds, OXYGEN.VO2_TAU_SECONDS);
  const nextLactate = approach(state.lactateMmolL, lactateTargetMmol(engagement, threshold), dtSeconds, LACTATE.TAU_SECONDS);
  const nextVe = approach(state.ventilationLMin, ventilationTarget(actualVo2, state.lactateMmolL), dtSeconds, 60);

  const dehydrationPenalty = 1 + ((100 - hydration) / 100) * 1.1;
  const tempTarget =
    37 + THERMOSTRAIN.CORE_DRIFT_MAX_C * clamp(workFrac, 0, 1) * dehydrationPenalty;

  // Fatigue accumulates above threshold or beyond VO2max; decays slowly at rest.
  const excessLoad = Math.max(0, workFrac - threshold) + (demand > vMax ? 0.25 : 0);
  let fatigueDelta = (excessLoad * FATIGUE.ACCUMULATION_PER_EXCESS * dtSeconds) / 60000;
  if (excessLoad <= 0) fatigueDelta = -(state.fatiguePct * dtSeconds) / FATIGUE.DECAY_TAU_SECONDS;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    heartRateBpm: nextHr,
    strokeVolumeMl: nextSv,
    vo2MlMin: nextVo2,
    lactateMmolL: nextLactate,
    ventilationLMin: nextVe,
    coreTempC: approach(state.coreTempC, tempTarget, dtSeconds, THERMOSTRAIN.CORE_TAU_SECONDS),
    fatiguePct: clamp(state.fatiguePct + fatigueDelta, 0, FATIGUE.MAX_PCT),
  };
}

export function step(state: ExerciseInternalState, inputs: ExerciseInputs, dtSeconds: number): ExerciseSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

/** A short all-out surge on top of the current workload. */
export function perturbSprintSurge(state: ExerciseInternalState): ExerciseInternalState {
  return { ...state, lactateMmolL: state.lactateMmolL + 3.5 };
}

export { EXERCISE_SIMULATION };

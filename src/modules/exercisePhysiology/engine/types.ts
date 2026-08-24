export type ExerciseState_Classification =
  | 'at rest'
  | 'light aerobic work'
  | 'moderate aerobic work'
  | 'heavy aerobic work'
  | 'above lactate threshold'
  | 'above VO2max: exhausting'
  | 'trained athlete at rest';

export interface ExerciseInputs {
  /** External workload on the ergometer, W (0-400). */
  workloadWatts: number;
  /** Training status / fitness, 0-100. */
  fitnessPct: number;
  /** Age, years (20-80) — sets maximal heart rate. */
  ageYears: number;
  /** Hydration status, % (0-100; low impairs sweating and heat control). */
  hydrationPct: number;
}

export interface ExerciseInternalState {
  simTimeSeconds: number;
  heartRateBpm: number;
  strokeVolumeMl: number;
  vo2MlMin: number;
  lactateMmolL: number;
  ventilationLMin: number;
  coreTempC: number;
  fatiguePct: number;
}

export interface ExerciseDerived {
  vo2MlMin: number;
  vo2DemandMlMin: number;
  vo2MaxMlMin: number;
  engagementFraction: number;
  lactateThresholdFraction: number;
  aboveThreshold: boolean;
  aboveVo2Max: boolean;
  heartRateBpm: number;
  maxHeartRateBpm: number;
  strokeVolumeMl: number;
  cardiacOutputLMin: number;
  arteriovenousDiffMlDl: number;
  ventilationLMin: number;
  lactateMmolL: number;
  coreTempC: number;
  fatiguePct: number;
  muscleFlowSharePct: number;
  totalResistanceIndex: number;
  classification: ExerciseState_Classification;
  patternSummary: string;
}

export interface ExerciseSnapshot {
  state: ExerciseInternalState;
  derived: ExerciseDerived;
}

export interface ExerciseHistoryPoint {
  t: number;
  hr: number;
  vo2: number;
  lactate: number;
  fatigue: number;
}

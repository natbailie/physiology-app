import type { CognitionInputs } from './types';

/**
 * The resting well is a relaxed student with a manageable lecture load: low distraction, no fatigue,
 * moderate arousal, a high executive reserve. Everything is a deviation from that humane baseline.
 */
export const DEFAULT_COGNITION_INPUTS: CognitionInputs = {
  memoryLoad: 3,
  distractionLevelPct: 10,
  fatiguePct: 15,
  cognitiveDemandPct: 40,
  baselineArousalPct: 45,
  executiveReservePct: 18,
};

export type CognitionPresetName =
  | 'relaxedLearning'
  | 'examStress'
  | 'sleepDeprived'
  | 'distractedClassroom'
  | 'inTheZone'
  | 'panicAttack';

export const COGNITION_PRESETS: Record<CognitionPresetName, CognitionInputs> = {
  relaxedLearning: DEFAULT_COGNITION_INPUTS,
  examStress: {
    memoryLoad: 6,
    distractionLevelPct: 15,
    fatiguePct: 30,
    cognitiveDemandPct: 82,
    baselineArousalPct: 78,
    executiveReservePct: 12,
  },
  sleepDeprived: {
    memoryLoad: 3,
    distractionLevelPct: 20,
    fatiguePct: 85,
    cognitiveDemandPct: 50,
    baselineArousalPct: 30,
    executiveReservePct: 4,
  },
  distractedClassroom: {
    memoryLoad: 4,
    distractionLevelPct: 72,
    fatiguePct: 10,
    cognitiveDemandPct: 45,
    baselineArousalPct: 42,
    executiveReservePct: 15,
  },
  inTheZone: {
    memoryLoad: 4,
    distractionLevelPct: 5,
    fatiguePct: 8,
    cognitiveDemandPct: 45,
    baselineArousalPct: 34,
    executiveReservePct: 16,
  },
  panicAttack: {
    memoryLoad: 5,
    distractionLevelPct: 60,
    fatiguePct: 50,
    cognitiveDemandPct: 90,
    baselineArousalPct: 95,
    executiveReservePct: 3,
  },
};

export const COGNITION_PRESET_LABELS: Record<CognitionPresetName, string> = {
  relaxedLearning: 'Relaxed learning',
  examStress: 'High-stakes exam',
  sleepDeprived: 'Sleep-deprived',
  distractedClassroom: 'Distracted classroom',
  inTheZone: 'In the zone',
  panicAttack: 'Panic',
};

export const COGNITION_PRESET_ORDER: CognitionPresetName[] = [
  'relaxedLearning',
  'inTheZone',
  'examStress',
  'distractedClassroom',
  'sleepDeprived',
  'panicAttack',
];
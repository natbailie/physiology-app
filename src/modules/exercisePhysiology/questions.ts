import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type {
  ExerciseDerived,
  ExerciseInputs,
  ExerciseInternalState,
} from './engine/types';
import type { ExercisePresetName } from './engine/presets';

type Snapshot = { state: ExerciseInternalState; derived: ExerciseDerived };
export type ExerciseQuestion = ModuleQuestion<ExerciseInputs, ExercisePresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'VO2', unit: 'L/min', value: (s) => s.derived.vo2MlMin / 1000, decimals: 2 },
  { label: 'Heart rate', unit: 'bpm', value: (s) => s.derived.heartRateBpm, decimals: 0 },
  { label: 'Cardiac output', unit: 'L/min', value: (s) => s.derived.cardiacOutputLMin, decimals: 1 },
  { label: 'Lactate', unit: 'mmol/L', value: (s) => s.derived.lactateMmolL, decimals: 1, tolerance: 0.25 },
  { label: 'Ventilation', unit: 'L/min', value: (s) => s.derived.ventilationLMin, decimals: 0 },
  { label: 'Fatigue', unit: '%', value: (s) => s.derived.fatiguePct, decimals: 0, tolerance: 0.35 },
];

const SETTLE = 80000;

export const EXERCISE_QUESTIONS: readonly ExerciseQuestion[] = [
  {
    id: 'untrained-hits-the-wall',
    stem: 'An untrained subject cycles at a workload they can no longer sustain. Oxygen uptake has stopped rising despite increasing effort, and lactate is climbing steeply.',
    answer: 'untrainedExhaustion',
    options: ['untrainedExhaustion', 'eliteEffort', 'vigorousRun', 'rest'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A flat VO2 while effort continues is the definition of VO2max: demand exceeds supply and the difference is paid anaerobically, so lactate and fatigue climb together. The ceiling, not the workload, now sets the limit — which is why the test ends when VO2 plateaus rather than when the subject stops pedalling. Training raises this ceiling; nothing on the day of the test does.',
  },
  {
    id: 'same-watts-different-athletes',
    stem: 'Two subjects cycle at exactly 180 watts. One has a heart rate of 178 with lactate of 6; the other sits at 141 with lactate of 2.',
    answer: 'vigorousRun',
    options: ['vigorousRun', 'eliteEffort', 'lightCycling', 'athleteRest'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'At identical absolute load, training shows up as a smaller fraction of the personal ceiling: lower heart rate, right-shifted lactate threshold, comfortable ventilation for the trained subject. The unfit one is above their threshold and paying anaerobically at the same watts. Absolute workloads mean nothing without knowing whose ceiling you compare against — percentage of VO2max is what the body actually senses.',
  },
  {
    id: 'athlete-resting-bradycardia',
    stem: 'An endurance athlete has a resting heart rate of 46 bpm with a completely normal echocardiogram and cardiac output.',
    answer: 'athleteRest',
    options: ['athleteRest', 'rest', 'vigorousRun', 'dehydratedEffort'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Training enlarges stroke volume, so the same cardiac output arrives in fewer, bigger beats — resting bradycardia reflects an efficient pump, not a failing one. Every other readout stays normal, which separates it from pathology. The same enlargement explains why such athletes reach extraordinary cardiac outputs during exercise: their resting stroke volume starts near where other people peak.',
  },
  {
    id: 'hr-rises-with-load',
    stem: 'A healthy subject begins cycling on an ergometer after resting quietly.',
    setup: { preset: 'rest' },
    intervention: { label: 'Workload set to 150 W.', inputs: { workloadWatts: 150 } },
    prompt: 'What happens to heart rate?',
    watch: 'heart rate',
    correctDirection: 'rises',
    settleSeconds: 10000,
    observeSeconds: 15000,
    explanation:
      'It rises toward the age-predicted maximum — the circulation raises output fastest through rate before stroke volume finishes its smaller rise. Below the lactate threshold it then settles at a steady value proportional to the workload, which is why heart rate works so well as a proxy for intensity in training zones and stress testing alike.',
    metric: (s) => s.derived.heartRateBpm,
  },
  {
    id: 'vo2-plateaus-at-max',
    stem: 'The same untrained subject, already above their maximal capacity, is asked to push the workload higher still.',
    setup: { preset: 'untrainedExhaustion' },
    intervention: { label: 'Workload raised further.', inputs: { workloadWatts: 340 } },
    prompt: 'What happens to oxygen uptake?',
    watch: 'VO2',
    correctDirection: 'unchanged',
    settleSeconds: 60000,
    observeSeconds: 40000,
    tolerance: 0.02,
    explanation:
      'Barely changes — VO2 is pinned at the ceiling. Whatever the workload asks beyond VO2max cannot be paid oxidatively; the deficit runs through anaerobic metabolism, lactate climbs sharply and exhaustion follows within minutes. The plateau is the most important measurement in exercise testing: it separates working hard from working at the absolute limit.',
    metric: (s) => s.derived.vo2MlMin,
  },
  {
    id: 'training-lowers-lactate',
    stem: 'A moderately fit subject cycles at a workload just above their lactate threshold.',
    setup: { preset: 'vigorousRun', inputs: { workloadWatts: 230, fitnessPct: 55 } },
    intervention: { label: 'Eight weeks of endurance training.', inputs: { fitnessPct: 85 } },
    prompt: 'What happens to blood lactate at this workload?',
    watch: 'lactate',
    correctDirection: 'falls',
    settleSeconds: 30000,
    observeSeconds: 60000,
    explanation:
      'It falls — the lactate threshold has been right-SHIFTED, so a workload that sat above threshold and climbing now sits below it, sustainable for hours. Mitochondrial density, capillary growth and oxidative enzymes all improve extraction, meaning less reliance on anaerobic glycolysis at any given pace. This single curve explains most of what endurance training accomplishes.',
    metric: (s) => s.state.lactateMmolL,
  },
  {
    id: 'dehydration-heat-strain',
    stem: 'The cyclist has sweated heavily for two hours without drinking.',
    setup: { preset: 'vigorousRun' },
    intervention: { label: 'Hydration falls.', inputs: { hydrationPct: 30 } },
    prompt: 'What happens to core temperature?',
    watch: 'core temperature',
    correctDirection: 'rises',
    settleSeconds: 30000,
    observeSeconds: 200000,
    tolerance: 0.005,
    explanation:
      'It climbs higher at the same workload — reduced plasma volume compromises sweating and skin flow, so heat from working muscle can no longer be dumped efficiently. Cardiovascular strain compounds it: volume loss raises heart rate for the same output. This is why fluid status decides long events, and why core temperature, not pace, is the variable to watch in the heat.',
    metric: (s) => s.state.coreTempC,
  },
];

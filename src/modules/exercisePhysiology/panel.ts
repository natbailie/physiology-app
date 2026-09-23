import type { PanelField } from '@/shared/assessment/types';
import type { ExerciseDerived, ExerciseInternalState } from './engine/types';

export type ExerciseSnapshot = { state: ExerciseInternalState; derived: ExerciseDerived };

/**
 * The effort panel: oxygen uptake, heart rate, cardiac output, lactate, ventilation and
 * fatigue. Between them these place the subject against their own ceiling — the same watts
 * mean nothing without knowing whose VO2max they sit under — and no one of them does it
 * alone. A flat VO2 with climbing lactate is the ceiling; a low heart rate with normal
 * output at rest is an efficient pump, not a failing one.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole exercise
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const EFFORT_PANEL: readonly PanelField<ExerciseSnapshot>[] = [
  { label: 'VO2', unit: 'L/min', value: (s) => s.derived.vo2MlMin / 1000, decimals: 2 },
  { label: 'Heart rate', unit: 'bpm', value: (s) => s.derived.heartRateBpm, decimals: 0 },
  { label: 'Cardiac output', unit: 'L/min', value: (s) => s.derived.cardiacOutputLMin, decimals: 1 },
  { label: 'Lactate', unit: 'mmol/L', value: (s) => s.derived.lactateMmolL, decimals: 1, tolerance: 0.25 },
  { label: 'Ventilation', unit: 'L/min', value: (s) => s.derived.ventilationLMin, decimals: 0 },
  { label: 'Fatigue', unit: '%', value: (s) => s.derived.fatiguePct, decimals: 0, tolerance: 0.35 },
];

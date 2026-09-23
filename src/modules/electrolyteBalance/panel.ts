import type { PanelField } from '@/shared/assessment/types';
import type { ElectrolyteDerived, ElectrolyteState } from './engine/types';

export type ElectrolyteSnapshot = { state: ElectrolyteState; derived: ElectrolyteDerived };

/**
 * The hyponatraemia workup, in the order it is actually done.
 *
 * The serum sodium is on the panel and is deliberately near-useless: all three causes below
 * produce almost the same number, which is exactly the clinical problem. Volume status and
 * urine osmolality are what separate them, and that is the whole algorithm.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole electrolyte
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const SODIUM_PANEL: readonly PanelField<ElectrolyteSnapshot>[] = [
  { label: 'Serum Na+', unit: 'mEq/L', value: (s) => s.derived.serumSodiumMeqL, decimals: 1, tolerance: 0.004 },
  { label: 'Serum K+', unit: 'mEq/L', value: (s) => s.derived.serumPotassiumMeqL, decimals: 2 },
  { label: 'ECF volume', unit: 'L', value: (s) => s.derived.ecfVolumeL, decimals: 1 },
  { label: 'Urine osmolality', unit: 'mOsm/kg', value: (s) => s.derived.urineOsmolality, decimals: 0 },
];

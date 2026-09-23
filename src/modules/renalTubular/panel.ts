import type { PanelField } from '@/shared/assessment/types';
import type { RenalTubularDerived, RenalTubularState } from './engine/types';

export type RenalTubularSnapshot = { state: RenalTubularState; derived: RenalTubularDerived };

/**
 * The AKI workup: what the urine says when the creatinine will not. A rising creatinine is
 * shared by every cause of renal failure; the fractional excretion of sodium, the urine
 * sodium and the concentrating ability are what split a starving-but-intact nephron from a
 * dead one — and the two are treated in opposite directions.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole renal
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const AKI_PANEL: readonly PanelField<RenalTubularSnapshot>[] = [
  { label: 'FENa (%)', unit: '%', value: (s) => s.derived.fractionalExcretionNaPct, decimals: 2 },
  { label: 'Urine Na (mEq/L)', unit: '', value: (s) => s.derived.urineSodiumMeqL, decimals: 0 },
  { label: 'Urine osmolality (mOsm/kg)', unit: '', value: (s) => s.derived.finalUrineOsmolality, decimals: 0 },
  { label: 'Serum K (mEq/L)', unit: '', value: (s) => s.derived.serumPotassiumEstimateMeqL, decimals: 1 },
  { label: 'Creatinine (mg/dL)', unit: '', value: (s) => s.derived.serumCreatinineMgDl, decimals: 2 },
];

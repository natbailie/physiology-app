import type { PanelField } from '@/shared/assessment/types';
import type { GiSnapshot } from './engine/types';

export type { GiSnapshot };

/**
 * The acid workup: pH, acid output, gastrin drive, emptying rate and duodenal pH. Between
 * them these separate too much acid from too little and autonomous drive from drug effect —
 * and no one of them does it alone. A raised gastrin with a crashed pH is a tumour; the same
 * raised gastrin with a high pH is a drug doing its job.
 *
 * Authored, not extracted: this module asks predict-then-run questions only, so it never had
 * a panel to share (`cardiorenal/panel.ts` is the precedent). The rows follow the quantities
 * the questions are marked against.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole GI engine
 * into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const GI_PANEL: readonly PanelField<GiSnapshot>[] = [
  { label: 'Gastric pH', value: (s) => s.derived.gastricPH, decimals: 1 },
  { label: 'Acid output', unit: '%', value: (s) => s.derived.gastricAcidOutput, decimals: 0 },
  { label: 'Gastrin drive', value: (s) => s.derived.gastrinDrive, decimals: 2 },
  { label: 'Emptying rate', unit: '%', value: (s) => s.derived.gastricEmptyingRate, decimals: 0 },
  { label: 'Duodenal pH', value: (s) => s.derived.duodenalPH, decimals: 1 },
];

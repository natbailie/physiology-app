import type { PanelField } from '@/shared/assessment/types';
import type { HearingDerived, HearingInternalState } from './engine/types';

export type HearingSnapshot = { state: HearingInternalState; derived: HearingDerived };

/**
 * The audiogram plus the forks: pure-tone average, air-bone gap, discrimination, recruitment
 * and Weber. Between them these place the loss — gap or no gap, cochlea working or not — and
 * no one of them does it alone. A gap with intact discrimination is a mechanical problem with
 * a mechanical fix; no gap with recruitment is a cochlear one, managed and never cured.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole hearing
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const AUDIOGRAM_PANEL: readonly PanelField<HearingSnapshot>[] = [
  { label: 'PTA', unit: 'dB', value: (s) => s.derived.ptaDb, decimals: 0 },
  { label: 'Air-bone gap', unit: 'dB', value: (s) => s.derived.airBoneGapDb, decimals: 0 },
  { label: 'Speech discrimination', unit: '%', value: (s) => s.derived.speechDiscriminationPct, decimals: 0 },
  {
    label: 'Recruitment',
    unit: '×',
    value: (s) => s.derived.recruitmentIndex,
    decimals: 2,
    tolerance: 0.15,
  },
  { label: 'Weber', value: (s) => s.derived.weberCode, decimals: 0, tolerance: 0.5 },
];

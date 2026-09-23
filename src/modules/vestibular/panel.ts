import type { PanelField } from '@/shared/assessment/types';
import type { VestibularDerived, VestibularInternalState } from './engine/types';

export type VestibularSnapshot = { state: VestibularInternalState; derived: VestibularDerived };

/**
 * The vertigo workup: spontaneous nystagmus, vertigo, VOR gain, positional nystagmus and
 * Romberg. Between them these place the lesion — one nerve silent, both gone, debris in a
 * canal — and no one of them does it alone. The most disabled patient in the module has the
 * quietest examination, which is why the panel is read whole.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole vestibular
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside shows
 * them — one definition, not two that agree until somebody edits one.
 */
export const VERTIGO_PANEL: readonly PanelField<VestibularSnapshot>[] = [
  { label: 'Spontaneous nystagmus', unit: '°/s', value: (s) => s.derived.slowPhaseVelocityDegPerSec, decimals: 1 },
  { label: 'Vertigo', unit: '%', value: (s) => s.derived.vertigoIntensityPct, decimals: 0, tolerance: 0.15 },
  {
    label: 'VOR gain',
    value: (s) => s.derived.vorGain,
    decimals: 2,
    tolerance: 0.12,
  },
  {
    label: 'Positional nystagmus',
    unit: '%',
    value: (s) => s.derived.positionalNystagmusPct,
    decimals: 0,
    tolerance: 0.25,
  },
  { label: 'Romberg unsteadiness', unit: '%', value: (s) => s.derived.rombergUnsteadinessPct, decimals: 0, tolerance: 0.2 },
];

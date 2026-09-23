import type { PanelField } from '@/shared/assessment/types';
import type { MicturitionDerived, MicturitionInternalState } from './engine/types';

export type MicturitionSnapshot = { state: MicturitionInternalState; derived: MicturitionDerived };

/**
 * The urodynamic picture: volume, pressure, and the two tones plus the afferent signal that
 * decide what happens next. Between them these name the failure; no one of them does it
 * alone — a high pressure with a quiet detrusor is a different patient from a high pressure
 * with an overactive one, and opposite treatments follow.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole
 * micturition engine into the ward-round index that loads on the home page. Both consumers
 * read it here instead, which also means the rows a learner is examined on are the rows the
 * bedside shows them — one definition, not two that agree until somebody edits one.
 */
export const BLADDER_PANEL: readonly PanelField<MicturitionSnapshot>[] = [
  {
    label: 'Volume',
    unit: 'mL',
    value: (s) => s.derived.bladderVolumeML,
    decimals: 0,
    tolerance: 0.08,
  },
  {
    label: 'Pressure',
    unit: 'cmH₂O',
    value: (s) => s.derived.intravesicalPressureCmH2O,
    decimals: 1,
    tolerance: 0.12,
  },
  {
    label: 'Detrusor',
    value: (s) => s.derived.detrusorTone,
    decimals: 2,
    tolerance: 0.15,
  },
  {
    label: 'Sphincter',
    value: (s) => s.derived.externalSphincterTone,
    decimals: 2,
    tolerance: 0.15,
  },
  {
    label: 'Afferent',
    value: (s) => s.derived.afferentFiringRate,
    decimals: 2,
    tolerance: 0.2,
  },
];

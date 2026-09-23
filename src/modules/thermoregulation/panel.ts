import type { PanelField } from '@/shared/assessment/types';
import type { ThermoDerived, ThermoInternalState } from './engine/types';

export type ThermoSnapshot = { state: ThermoInternalState; derived: ThermoDerived };

/**
 * The heat ledger: core temperature against set point, the two effectors, and net storage.
 * Between them these answer the module's only question — is the temperature DEFENDED (fever)
 * or OVERWHELMED (hyperthermia) — and no one of them does it alone. Shivering under blankets
 * at 39 means the point moved; hot dry skin past 40 with a normal point means evaporation
 * failed, and the treatments are opposite.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls values out of
 * the engine, so a case file importing this panel from THERE would drag the whole
 * thermoregulation engine into the ward-round index that loads on the home page. Both
 * consumers read it here instead, which also means the rows a learner is examined on are the
 * rows the bedside shows them — one definition, not two that agree until somebody edits one.
 */
export const THERMO_PANEL: readonly PanelField<ThermoSnapshot>[] = [
  { label: 'Core temp', unit: '°C', value: (s) => s.derived.coreTempC, decimals: 1 },
  { label: 'Set point', unit: '°C', value: (s) => s.derived.setPointC, decimals: 1 },
  { label: 'Shivering', unit: 'W', value: (s) => s.derived.shiveringW, decimals: 0, tolerance: 0.3 },
  { label: 'Sweating', unit: 'W', value: (s) => s.derived.sweatW, decimals: 0, tolerance: 0.3 },
  {
    label: 'Net storage',
    unit: 'W',
    value: (s) => s.derived.netStorageW,
    decimals: 0,
    tolerance: 0.5,
  },
];

import type { PanelField } from '@/shared/assessment/types';
import type { ShockDerived, ShockState } from './engine/types';

export type ShockSnapshot = { state: ShockState; derived: ShockDerived };

/**
 * The haemodynamic panel: output, both filling pressures, resistance, and the two oxygen
 * numbers. Between them these name the cause; no one of them does it alone.
 *
 * A leaf file with type-only imports, and that matters: `questions.ts` pulls `perturbFluidBolus`
 * out of the engine, so a case file importing this panel from THERE would drag the whole shock
 * engine into the ward-round index that loads on the home page. Both consumers read it here
 * instead, which also means the rows a learner is examined on are the rows the bedside showed
 * them — one definition, not two that agree until somebody edits one.
 */
export const SHOCK_PANEL: readonly PanelField<ShockSnapshot>[] = [
  { label: 'Cardiac index', unit: 'L/min/m²', value: (s) => s.derived.cardiacIndex, decimals: 1 },
  { label: 'CVP', unit: 'mmHg', value: (s) => s.derived.centralVenousPressureMmHg, decimals: 0 },
  { label: 'Wedge', unit: 'mmHg', value: (s) => s.derived.wedgePressureMmHg, decimals: 0 },
  { label: 'SVR', value: (s) => s.derived.effectiveSvr, decimals: 2 },
  { label: 'SvO₂', unit: '%', value: (s) => s.derived.mixedVenousSaturationPercent, decimals: 0 },
  { label: 'Lactate', unit: 'mmol/L', value: (s) => s.derived.lactateMmolL, decimals: 1 },
];

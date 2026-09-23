import type { PanelField } from '@/shared/assessment/types';
import type { RespDerived, RespState } from './engine/types';

export type RespSnapshot = { state: RespState; derived: RespDerived };

/**
 * The arterial blood gas, as it is actually reported.
 *
 * Four rows, and no one of them names the disorder alone: pH says how bad it is, PaCO2 and
 * bicarbonate say which half is responsible, and the anion gap separates two acidoses that are
 * otherwise identical. Reading the combination is the skill; these questions show nothing else.
 *
 * A leaf with type-only imports, so `cases.ts` can share it without dragging the engine onto
 * the home page — see `panel.ts` in shockStates for the full reasoning.
 */
export const ABG_PANEL: readonly PanelField<RespSnapshot>[] = [
  { label: 'pH', value: (s) => s.derived.pH, decimals: 2, tolerance: 0.004 },
  { label: 'PaCO2', unit: 'mmHg', value: (s) => s.derived.paCO2, decimals: 0 },
  { label: 'HCO3-', unit: 'mEq/L', value: (s) => s.derived.plasmaHCO3, decimals: 0 },
  { label: 'Anion gap', unit: 'mEq/L', value: (s) => s.derived.anionGapMEqL, decimals: 0 },
];

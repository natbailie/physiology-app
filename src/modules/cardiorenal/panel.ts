import type { PanelField } from '@/shared/assessment/types';
import type { DerivedValues, SimState } from './engine/types';

export type CardiorenalSnapshot = { state: SimState; derived: DerivedValues };

/**
 * The cardiorenal observation set: what the heart is managing, what the kidney is making of it,
 * and how hard the hormones are working to keep the pressure up.
 *
 * Authored here rather than lifted from `questions.ts`, which is the one difference from the
 * other modules with beds: cardiorenal's six questions are all predict-then-run, so this module
 * has never had a panel to share. The rows are chosen on the same rule the pattern panels use —
 * no single one of them names the problem, and the combination does. Output and pressure
 * separate a failing pump from a failing kidney only once RAAS is read alongside them.
 *
 * Four of these rows do not carry the units a bedside chart would assume, and the engine says so
 * itself: `references.ts` records that `gfr`, `urineOutput` and `bloodVolume` are NORMALISED —
 * 100 is normal, not mL/min — and `derived.cardiacOutput` is mL/min, not L/min.
 *
 * Printed against the units they used to claim, that gave "2707.7 L/min" and "109.36 L" on
 * Margaret's chart. GFR hid for longer because a normal GFR really is about 100 mL/min, so the
 * baseline looked right and only the ill beds were wrong; urine never did, since 100 mL/min is
 * 144 litres a day. Percent is what the engine actually computes, so percent is what is shown.
 *
 * Every comparison in `caseSuite` and `verifyPattern` divides by the larger magnitude, so a
 * row scaled by a constant marks identically and a relabelled row does not move at all.
 */
export const CARDIORENAL_PANEL: readonly PanelField<CardiorenalSnapshot>[] = [
  { label: 'Cardiac output', unit: 'L/min', value: (s) => s.derived.cardiacOutput / 1000, decimals: 1 },
  { label: 'MAP', unit: 'mmHg', value: (s) => s.derived.meanArterialPressure, decimals: 0 },
  { label: 'GFR', unit: '%', value: (s) => s.derived.gfr, decimals: 0 },
  { label: 'RAAS', value: (s) => s.derived.raasActivation, decimals: 2 },
  { label: 'Urine', unit: '%', value: (s) => s.derived.urineOutput, decimals: 0 },
  { label: 'Blood volume', unit: '%', value: (s) => s.state.bloodVolume, decimals: 0 },
];

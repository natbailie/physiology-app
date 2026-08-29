import { HAEMOLYTIC_DISEASE } from './constants';
import { clamp } from '@/shared/lib/math';
import type { BloodInputs } from './types';

/**
 * Is the fetus actually exposed to maternal anti-Rh IgG?
 *
 * Exposure happens only when the mother ALREADY carries anti-D — from a previous pregnancy
 * or earlier event (`rhSensitised`). Missing prophylaxis at THIS delivery almost never harms
 * THIS baby (sensitisation occurs at delivery, too late for significant haemolysis); what it
 * does is prime the NEXT pregnancy, which `nextPregnancySensitisationRiskPct` reports. That
 * asymmetry — this baby fine, the next one not — is the entire public-health case for anti-D,
 * and the engine keeps the two facts deliberately separate.
 */
export function fetalExposure(inputs: BloodInputs): boolean {
  if (inputs.hdnScenario < 0.5) return false;
  if (inputs.recipientRhPositive > 0.5) return false; // mother Rh-negative only
  if (inputs.fetusRhPositive < 0.5) return false;
  return inputs.rhSensitised > 0.5;
}

/**
 * Risk that THIS pregnancy sensitises the mother for the NEXT one, %.
 *
 * The classic teaching case: a Rh-negative mother delivers a Rh-positive baby with no
 * anti-D — the first baby is fine, and the second is not. Anti-D at delivery closes that
 * window; once sensitised, no dose of anti-D undoes it.
 */
export function nextPregnancySensitisationRiskPct(inputs: BloodInputs): number {
  if (inputs.hdnScenario < 0.5) return 0;
  if (inputs.recipientRhPositive > 0.5 || inputs.fetusRhPositive < 0.5) return 0;
  if (inputs.rhSensitised > 0.5) return 0; // already sensitised — nothing left to prevent
  return clamp(100 * (1 - inputs.antiDProtectionPct / 100), 0, 100);
}

/** Fetal haemoglobin in g/dL for a given haemolytic severity 0-100. */
export function fetalHaemoglobinGDl(severity: number): number {
  return clamp(HAEMOLYTIC_DISEASE.FETAL_HB_BASELINE_GDL - severity * HAEMOLYTIC_DISEASE.FETAL_HB_FALL_PER_SEVERITY, 2, 20);
}

/** Cord bilirubin in µmol/L for a given severity. */
export function cordBilirubinUmolL(severity: number): number {
  return clamp(severity * HAEMOLYTIC_DISEASE.BILIRUBIN_PER_SEVERITY, 0, 700);
}

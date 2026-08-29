export type BloodState_Classification =
  | 'compatible transfusion'
  | 'minor incompatibility (no red-cell reaction)'
  | 'febrile non-haemolytic reaction'
  | 'ABO-incompatible: acute haemolytic reaction'
  | 'Rh-incompatible: delayed haemolytic reaction'
  | 'massive ABO mismatch: DIC and renal failure'
  | 'HDN: fetal haemolysis from maternal IgG';

export interface BloodInputs {
  /** Recipient ABO type index: 0 O, 1 A, 2 B, 3 AB. */
  recipientAboIndex: number;
  /** Recipient Rh status, 0 = negative, 1 = positive. */
  recipientRhPositive: number;
  /** Donor ABO type index: 0 O, 1 A, 2 B, 3 AB. */
  donorAboIndex: number;
  /** Donor Rh status, 0 = negative, 1 = positive. */
  donorRhPositive: number;
  /** Whether the Rh-negative recipient was previously sensitised, 0 or 1. In the HDN
   * scenario this is the MOTHER's pre-existing sensitisation from an earlier pregnancy. */
  rhSensitised: number;
  /** Volume transfused, mL (0-500). */
  transfusionVolumeMl: number;
  // --- Haemolytic disease of the newborn scenario ---

  /** Model the maternal-fetal pair instead of a transfusion, 0 or 1. The recipient fields
   * above become the mother's status; the fetus has its own Rh below. */
  hdnScenario: number;
  /** Fetal Rh status in the HDN scenario, 0 = negative (never affected), 1 = positive. */
  fetusRhPositive: number;
  /** Anti-D immunoglobulin coverage this pregnancy, % (0-100). It prevents SENSITISATION —
   * it does nothing against IgG already present, which is the whole point of giving it
   * after the FIRST birth rather than waiting. */
  antiDProtectionPct: number;
}

export interface BloodInternalState {
  simTimeSeconds: number;
  /** Haemolytic severity, 0-100 — rises along whichever arm (ABO fast vs Rh slow) applies. */
  haemolyticSeverity: number;
}

export interface BloodDerived {
  recipientType: string;
  donorType: string;
  crossmatchVerdict: string;
  aboIncompatible: boolean;
  rhIncompatible: boolean;
  reactionArm: 'none' | 'immediate intravascular (IgM)' | 'delayed extravascular (IgG)' | 'fetal haemolysis (maternal IgG)';
  haemolyticSeverity: number;
  plasmaFreeHaemoglobin: number;
  complementConsumedPct: number;
  haemoglobinuriaPct: number;
  dicRiskPct: number;
  renalInjuryRiskPct: number;
  shockIndex: number;
  classification: BloodState_Classification;
  patternSummary: string;
  /** Whether the maternal-fetal (HDN) scenario is active — the readout panel switches rows. */
  hdnScenario: number;
  // --- HDN scenario readouts ---
  /** Fetal haemoglobin, g/dL — falls as maternal IgG clears fetal cells extravascularly. */
  fetalHaemoglobinGDl: number;
  /** Cord bilirubin, µmol/L — the number kernicterus risk is read from. */
  cordBilirubinUmolL: number;
  /** Risk this fetus develops hydrops fetalis, %. */
  hydropsRiskPct: number;
  /** Risk of sensitisation for the NEXT pregnancy if prophylaxis is missed now, %. */
  nextPregnancySensitisationRiskPct: number;
}

export interface BloodSnapshot {
  state: BloodInternalState;
  derived: BloodDerived;
}

export interface BloodHistoryPoint {
  t: number;
  severity: number;
  freeHb: number;
}

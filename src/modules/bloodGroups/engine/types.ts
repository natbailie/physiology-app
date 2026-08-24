export type BloodState_Classification =
  | 'compatible transfusion'
  | 'minor incompatibility (no red-cell reaction)'
  | 'febrile non-haemolytic reaction'
  | 'ABO-incompatible: acute haemolytic reaction'
  | 'Rh-incompatible: delayed haemolytic reaction'
  | 'massive ABO mismatch: DIC and renal failure';

export interface BloodInputs {
  /** Recipient ABO type index: 0 O, 1 A, 2 B, 3 AB. */
  recipientAboIndex: number;
  /** Recipient Rh status, 0 = negative, 1 = positive. */
  recipientRhPositive: number;
  /** Donor ABO type index: 0 O, 1 A, 2 B, 3 AB. */
  donorAboIndex: number;
  /** Donor Rh status, 0 = negative, 1 = positive. */
  donorRhPositive: number;
  /** Whether the Rh-negative recipient was previously sensitised, 0 or 1. */
  rhSensitised: number;
  /** Volume transfused, mL (0-500). */
  transfusionVolumeMl: number;
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
  reactionArm: 'none' | 'immediate intravascular (IgM)' | 'delayed extravascular (IgG)';
  haemolyticSeverity: number;
  plasmaFreeHaemoglobin: number;
  complementConsumedPct: number;
  haemoglobinuriaPct: number;
  dicRiskPct: number;
  renalInjuryRiskPct: number;
  shockIndex: number;
  classification: BloodState_Classification;
  patternSummary: string;
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

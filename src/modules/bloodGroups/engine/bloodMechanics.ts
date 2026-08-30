import { ABO, REACTION, TRANSFUSION } from './constants';
import { clamp } from '@/shared/lib/math';
import type { BloodInputs, BloodState_Classification } from './types';

export function aboName(index: number): string {
  return ABO.NAMES[clamp(Math.round(index), 0, 3)] ?? 'O';
}

/**
 * Major ABO incompatibility: does the recipient carry preformed antibodies against the
 * DONOR's red-cell antigens? O carries anti-A AND anti-B; AB carries neither.
 */
export function aboMajorIncompatible(recipientIndex: number, donorIndex: number): boolean {
  const r = aboName(recipientIndex);
  const d = aboName(donorIndex);
  if (r === d) return false;
  const antiA = r === 'O' || r === 'B';
  const antiB = r === 'O' || r === 'A';
  if (d === 'A' && antiA) return true;
  if (d === 'B' && antiB) return true;
  if (d === 'AB' && (antiA || antiB)) return true;
  return false;
}

/** Reaction strength 0-100 from antibody titre × donor antigen load × volume. */
export function reactionSeverity(recipientIndex: number, donorIndex: number, volumeMl: number): number {
  if (!aboMajorIncompatible(recipientIndex, donorIndex)) return 0;
  const titre = ABO.ANTIBODY_STRENGTH[aboName(recipientIndex)] ?? 100;
  const antigen = ABO.ANTIGEN_LOAD[aboName(donorIndex)] ?? 50;
  return clamp((volumeMl / TRANSFUSION.MAX_VOLUME_ML) * (titre / 100) * (antigen / 100) * 100 * REACTION.SEVERITY_PER_ML / (REACTION.SEVERITY_PER_ML * 100 / 100), 0, 100);
}

export function crossmatchVerdict(inputs: BloodInputs): string {
  if (aboMajorIncompatible(inputs.recipientAboIndex, inputs.donorAboIndex)) return 'Major mismatch — do not transfuse';
  if (!inputs.recipientRhPositive && inputs.donorRhPositive > 0.5)
    return inputs.rhSensitised > 0.5
      ? 'Rh mismatch in sensitised recipient — delayed risk'
      : 'Rh mismatch — avoid; risk of sensitisation';
  return 'compatible';
}

export function classifyReaction(pattern: {
  severity: number;
  aboIncompatible: boolean;
  rhIncompatible: boolean;
  volumeMl: number;
}): BloodState_Classification {
  if (pattern.aboIncompatible && pattern.severity >= 60 && pattern.volumeMl >= 350)
    return 'massive ABO mismatch: DIC and renal failure';
  if (pattern.aboIncompatible && pattern.severity >= 8) return 'ABO-incompatible: acute haemolytic reaction';
  if (pattern.rhIncompatible && pattern.severity >= 6) return 'Rh-incompatible: delayed haemolytic reaction';
  if (pattern.severity >= REACTION.FEBRILE_THRESHOLD_SEVERITY * 0.5)
    return 'febrile non-haemolytic reaction';
  return 'compatible transfusion';
}

export function patternSummary(pattern: {
  classification: BloodState_Classification;
  freeHb: number;
  complementPct: number;
  dicRisk: number;
  renalRisk: number;
}): string {
  switch (pattern.classification) {
    case 'compatible transfusion':
      return 'no antigen-antibody meeting: nothing rises, nothing falls';
    case 'minor incompatibility (no red-cell reaction)':
      return 'donor plasma meets recipient cells only — clinically silent at red-cell dose';
    case 'febrile non-haemolytic reaction':
      return 'fever without haemolysis — stop the unit but the kidney is never at risk';
    case 'ABO-incompatible: acute haemolytic reaction':
      return `preformed IgM fixes complement within minutes: free Hb ${pattern.freeHb.toFixed(0)}, complement ${pattern.complementPct.toFixed(0)}% consumed`;
    case 'Rh-incompatible: delayed haemolytic reaction':
      return 'IgG clears cells extravascularly over days — no free Hb surge, a falling Hb next week instead';
    case 'massive ABO mismatch: DIC and renal failure':
      return `DIC ${pattern.dicRisk.toFixed(0)}% and renal injury ${pattern.renalRisk.toFixed(0)}% — the acute haemolytic crisis fully expressed`;
    case 'HDN: fetal haemolysis from maternal IgG':
      return 'maternal IgG crosses the placenta and clears fetal cells slowly — anaemia and jaundice in the fetus, never a transfusion reaction';
  }
}

import { AMMONIA, BILIRUBIN, ENZYMES, KERNICTERUS } from './constants';
import { clamp } from '@/shared/lib/math';
import type { LiverState_Classification } from './types';

/** R-factor: (ALT/ULN) ÷ (ALP/ULN). Above 5 the injury is hepatocellular; below 2 it is
 * cholestatic; between lies the mixed pattern. */
export function rFactor(altXUlN: number, alpXUlN: number): number {
  if (alpXUlN < 0.5) return altXUlN > 0 ? Infinity : 1;
  return altXUlN / alpXUlN;
}

export function lftPatternOf(r: number, altXUlN = Infinity, alpXUlN = Infinity): 'normal' | 'hepatocellular' | 'cholestatic' | 'mixed' {
  // The R-factor only means something once at least one enzyme is actually raised.
  if (altXUlN < 2 && alpXUlN < 2) return 'normal';
  if (r >= ENZYMES.HEPATOCELLULAR_R) return 'hepatocellular';
  if (r <= ENZYMES.CHOLESTATIC_R) return 'cholestatic';
  return 'mixed';
}

/** Urobilinogen: formed by gut flora from bilirubin reaching the gut, partly reabsorbed and
 * excreted in urine. ABSENT when the duct is blocked (nothing arrives); HIGH when haemolysis
 * floods the pathway. */
export function urineUrobilinogenIndex(gutBileFlowFraction: number, haemolysisMultiplier: number): number {
  const flow = clamp(gutBileFlowFraction, 0, 2);
  return clamp(flow * haemolysisMultiplier * 100, 0, 400);
}

/** Stool colour follows pigment arriving in the gut — pale in obstruction, dark in haemolysis. */
export function stoolColourPct(gutBileFlowFraction: number): number {
  return clamp(gutBileFlowFraction * 100, 0, 100);
}

export function ammoniaUmolL(excretionPct: number): number {
  const deficit = clamp(1 - excretionPct / 100, 0, 1);
  return AMMONIA.BASE_UMOL_L + AMMONIA.PER_EXCRETORY_DEFICIT_UMOL_L * deficit * deficit;
}

export function encephalopathyGrade(ammonia: number): 0 | 1 | 2 | 3 | 4 {
  if (ammonia >= AMMONIA.GRADE_IV_UMOL_L) return 4;
  if (ammonia >= AMMONIA.GRADE_III_UMOL_L) return 3;
  if (ammonia >= AMMONIA.GRADE_II_UMOL_L) return 2;
  if (ammonia >= AMMONIA.GRADE_I_UMOL_L) return 1;
  return 0;
}

/** Free (unbound) unconjugated bilirubin is what crosses the neonatal blood-brain barrier. */
export function kernicterusRisk(unconjugatedUmolL: number, albuminGPerL: number): number {
  return clamp((unconjugatedUmolL / Math.max(albuminGPerL, 10)) * KERNICTERUS.RISK_PER_UMOL_PER_G_PER_L * 100, 0, 100);
}

export function classifyLiver(pattern: {
  totalBilirubinUmolL: number;
  fractionConjugatedPct: number;
  haemolysisEffective: number;
  ugtActivity: number;
  injuryPct: number;
  obstructionPct: number;
  excretionPct: number;
  encephalopathyGrade: number;
}): LiverState_Classification {
  // Decompensation outranks pattern-matching: an encephalopathic cirrhotic is its own emergency.
  if (pattern.excretionPct < 40 && pattern.encephalopathyGrade >= 2)
    return 'decompensated cirrhosis with encephalopathy';
  if (pattern.injuryPct >= 35 && pattern.obstructionPct >= 35)
    return 'mixed hepatocellular-cholestatic';
  if (pattern.obstructionPct >= 35 && pattern.fractionConjugatedPct >= 55)
    return 'cholestatic / obstructive jaundice';
  if (pattern.injuryPct >= 30) return 'hepatocellular jaundice';
  if (pattern.haemolysisEffective >= 2.5) return 'pre-hepatic (haemolytic) jaundice';
  if (pattern.totalBilirubinUmolL > BILIRUBIN.NORMAL_TOTAL_UMOL_L || pattern.ugtActivity < 0.55) {
    if (pattern.ugtActivity < 0.12) return 'Crigler-Najjar type I';
    if (pattern.ugtActivity <= 0.45) return 'Gilbert-type: isolated unconjugated';
    if (pattern.ugtActivity < 0.55 && pattern.totalBilirubinUmolL > BILIRUBIN.JAUNDICE_VISIBLE_UMOL_L)
      return 'neonatal physiological jaundice';
    return 'Gilbert-type: isolated unconjugated';
  }
  return 'normal bile pigment handling';
}

export function patternSummary(pattern: {
  classification: LiverState_Classification;
  unconjugatedUmolL: number;
  conjugatedUmolL: number;
  urineBilirubinPresent: boolean;
  urineUrobilinogenIndex: number;
  stoolColourPct: number;
  ammoniaUmolL: number;
}): string {
  switch (pattern.classification) {
    case 'normal bile pigment handling':
      return 'pigment cleared at the rate it is made; no bilirubinuria, stool coloured';
    case 'pre-hepatic (haemolytic) jaundice':
      return `unconjugated ${pattern.unconjugatedUmolL.toFixed(0)} with urobilinogen high and NO bilirubinuria — the liver was never the problem`;
    case 'Gilbert-type: isolated unconjugated':
      return `mild unconjugated ${pattern.unconjugatedUmolL.toFixed(0)} µmol/L, normal enzymes, well during fasting or illness`;
    case 'Crigler-Najjar type I':
      return 'near-total UGT absence — unconjugated levels that threaten the brain from infancy';
    case 'neonatal physiological jaundice':
      return `immature UGT meeting a haemolytic load: unconjugated ${pattern.unconjugatedUmolL.toFixed(0)}, albumin-limited binding`;
    case 'hepatocellular jaundice':
      return `ALT-dominant injury regurgitating both pigments — bilirubinuria present because conjugated reaches plasma directly`;
    case 'cholestatic / obstructive jaundice':
      return `conjugated ${pattern.conjugatedUmolL.toFixed(0)} with dark urine, absent urobilinogen and pale stools — bile cannot leave`;
    case 'mixed hepatocellular-cholestatic':
      return 'both patterns on one chart: necrosis plus blocked outflow must be read separately';
    case 'decompensated cirrhosis with encephalopathy':
      return `ammonia ${pattern.ammoniaUmolL.toFixed(0)} µmol/L with failed hepatic clearance — the encephalopathy tracks the toxin, not the jaundice`;
  }
}

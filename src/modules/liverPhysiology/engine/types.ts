export type LiverState_Classification =
  | 'normal bile pigment handling'
  | 'pre-hepatic (haemolytic) jaundice'
  | 'Gilbert-type: isolated unconjugated'
  | 'Crigler-Najjar type I'
  | 'neonatal physiological jaundice'
  | 'hepatocellular jaundice'
  | 'cholestatic / obstructive jaundice'
  | 'mixed hepatocellular-cholestatic'
  | 'decompensated cirrhosis with encephalopathy';

export interface LiverInputs {
  /** Rate of haemoglobin breakdown, multiple of normal (1-8). */
  haemolysisMultiplier: number;
  /** Hepatic UGT (bilirubin-conjugating enzyme) activity, fraction of normal (0-1). */
  ugtActivity: number;
  /** Chronic hepatocellular excretory capacity — uptake, conjugation, bile secretion, % (0-100). */
  hepatocyteExcretionPct: number;
  /** Acute hepatocyte necrosis with canalicular regurgitation, % (0-100). */
  hepatocyteInjuryPct: number;
  /** Common bile duct obstruction severity, % (0-100). */
  biliaryObstructionPct: number;
  /** Serum albumin, g/L (20-50) — sets unconjugated binding capacity. */
  albuminGPerL: number;
}

export interface LiverInternalState {
  simTimeSeconds: number;
  /** Unconjugated (indirect) bilirubin in plasma, µmol/L. */
  unconjugatedUmolL: number;
  /** Conjugated (direct) bilirubin in plasma, µmol/L. */
  conjugatedUmolL: number;
  /** Pigment reaching the gut per unit time, relative units — drives stool colour and
   * urobilinogen. Falls to nothing when the duct is blocked. */
  gutBileFlowFraction: number;
  /** Transient extra haemolysis from an acute episode, decaying. */
  haemolysisBurst: number;
  /** Transient injury spike, decaying. */
  injuryBurst: number;
  /** Obstruction relief achieved by stenting, decays as oedema recurs. */
  obstructionReliefPct: number;
}

export interface LiverDerived {
  unconjugatedUmolL: number;
  conjugatedUmolL: number;
  totalBilirubinUmolL: number;
  /** Conjugated as a fraction of total — the single most useful split in jaundice. */
  fractionConjugatedPct: number;
  jaundiceVisible: boolean;
  urineBilirubinPresent: boolean;
  /** Urobilinogen index relative to normal (100 = normal). Low when bile never reaches the
   * gut, high when haemolysis floods it. */
  urineUrobilinogenIndex: number;
  stoolColourPct: number;
  altXUlN: number;
  alpXUlN: number;
  rFactor: number;
  lftPattern: 'normal' | 'hepatocellular' | 'cholestatic' | 'mixed';
  ammoniaUmolL: number;
  encephalopathyGrade: 0 | 1 | 2 | 3 | 4;
  kernicterusRiskPct: number;
  effectiveObstructionPct: number;
  classification: LiverState_Classification;
  patternSummary: string;
  // Passthrough so tick() can stay a pure (state, derived, dt) function.
  albuminGPerL: number;
}

export interface LiverSnapshot {
  state: LiverInternalState;
  derived: LiverDerived;
}

export interface LiverHistoryPoint {
  t: number;
  total: number;
  unconjugated: number;
  conjugated: number;
  ammonia: number;
}

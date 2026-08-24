export type AdrenalCortexState_Classification =
  | 'normal steroidogenesis'
  | '21-hydroxylase deficiency: salt-wasting'
  | '21-hydroxylase deficiency: simple virilising'
  | '11β-hydroxylase deficiency'
  | '17α-hydroxylase deficiency'
  | '3β-HSD deficiency'
  | 'CAH on adequate replacement';

export interface AdrenalCortexInputs {
  /** ACTH drive, % of basal (0-200). */
  acthDrivePct: number;
  /** 21-hydroxylase block, % (0-100) — the commonest CAH enzyme defect. */
  block21Pct: number;
  /** 11β-hydroxylase block, % (0-100). */
  block11Pct: number;
  /** 17α-hydroxylase block, % (0-100). */
  block17Pct: number;
  /** 3β-HSD block, % (0-100). */
  block3bhsdPct: number;
  /** Replacement therapy adequacy (hydrocortisone ± fludrocortisone), % (0-100). */
  replacementTherapyPct: number;
}

export interface AdrenalCortexInternalState {
  simTimeSeconds: number;
  cortisolPool: number;
  aldosteronePool: number;
  androgenPool: number;
  docPool: number;
  precursor17ohpPool: number;
}

export interface AdrenalCortexDerived {
  endogenousCortisol: number;
  effectiveCortisol: number;
  aldosterone: number;
  androgens: number;
  docExcess: number;
  marker17ohp: number;
  mineralocorticoidActivity: number;
  saltWasting: boolean;
  hypertensionFromDoc: boolean;
  addisonianCrisisRiskPct: number;
  acthEffectivePct: number;
  classification: AdrenalCortexState_Classification;
  patternSummary: string;
}

export interface AdrenalCortexSnapshot {
  state: AdrenalCortexInternalState;
  derived: AdrenalCortexDerived;
}

export interface AdrenalCortexHistoryPoint {
  t: number;
  cortisol: number;
  androgens: number;
  mcActivity: number;
}

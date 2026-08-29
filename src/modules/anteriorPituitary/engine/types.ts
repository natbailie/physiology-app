export type PituitaryState_Classification =
  | 'normal anterior pituitary'
  | 'acromegaly (GH adenoma)'
  | 'gigantism: GH excess, open epiphyses'
  | 'microprolactinoma'
  | 'macroprolactinoma'
  | 'drug-induced hyperprolactinaemia'
  | 'stalk-effect hyperprolactinaemia'
  | 'TRH-driven hyperprolactinaemia (hypothyroid)'
  | 'non-functioning macroadenoma';

export interface PituitaryInputs {
  /** Autonomous somatotroph secretion beyond hypothalamic control, 0-100. */
  ghAdenomaSecretion: number;
  /** Autonomous lactotroph secretion, 0-100. */
  prolactinomaSecretion: number;
  /** Non-functioning sellar mass volume proxy, 0-100. */
  nonfunctioningMass: number;
  /** Hypothalamic dopamine reaching the lactotrophs, % of normal (0-100). */
  dopamineTonePct: number;
  /** D2 receptor antagonism (antipsychotics, metoclopramide), % (0-100). */
  d2ReceptorBlockPct: number;
  /** TRH drive (elevated in primary hypothyroidism), arbitrary 10 = normal (0-100). */
  trhStimulusUnits: number;
  /** Epiphyseal plates still open, 0 or 1. */
  epiphysesOpen: number;
}

export interface PituitaryInternalState {
  simTimeSeconds: number;
  ghNgMl: number;
  igf1NgMl: number;
  prolactinNgMl: number;
  acromegalicIndex: number;
  glucoseChallengeSecondsRemaining: number;
  bromocriptineEffectPct: number;
}

export interface PituitaryDerived {
  ghNgMl: number;
  igf1NgMl: number;
  prolactinNgMl: number;
  effectiveDopamineFraction: number;
  stalkCompressionFraction: number;
  totalMassCc: number;
  /**
   * The same mass split by which cell line it grew from, cm³. A functioning adenoma IS
   * somatotroph or lactotroph tissue, so the diagram colours the mass by its origin — which
   * is the difference between three presets that all just say "sellar mass".
   */
  ghAdenomaCc: number;
  prlAdenomaCc: number;
  nonfunctioningCc: number;
  visualFieldDefectPct: number;
  heightVelocityCmPerYear: number;
  acromegalicIndex: number;
  gonadalSuppressionPct: number;
  galactorrhoeaRiskPct: number;
  glucoseSuppressionTest: 'not tested' | 'suppressed (normal)' | 'fails to suppress';
  classification: PituitaryState_Classification;
  patternSummary: string;
  // Passthrough of inputs and internal state so the diagram can draw what is acting on the
  // gland — the dopamine brake, the drug blocking it, and the TRH drive — rather than only
  // the hormone levels that result.
  dopamineTonePct: number;
  d2ReceptorBlockPct: number;
  trhStimulusUnits: number;
  bromocriptineEffectPct: number;
}

export interface PituitarySnapshot {
  state: PituitaryInternalState;
  derived: PituitaryDerived;
}

export interface PituitaryHistoryPoint {
  t: number;
  gh: number;
  prolactin: number;
  igf1: number;
}

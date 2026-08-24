export type MedullaState_Classification =
  | 'normal sympathetic tone'
  | 'noradrenaline-predominant phaeochromocytoma'
  | 'adrenaline-predominant phaeochromocytoma'
  | 'adrenergic crisis (uncontrolled)'
  | 'unopposed-alpha crisis: beta given first'
  | 'phaeochromocytoma adequately blocked';

export interface MedullaInputs {
  /** Tumour secretory rate, 0-100 (0 = no tumour). */
  tumourSecretionRate: number;
  /** Noradrenaline share of secretion, % (0 = pure adrenaline, 100 = pure NA). */
  noradrenalineFractionPct: number;
  /** Alpha-receptor blockade coverage, % (0-100). */
  alphaBlockadePct: number;
  /** Beta-receptor blockade coverage, % (0-100). */
  betaBlockadePct: number;
}

export interface MedullaInternalState {
  simTimeSeconds: number;
  plasmaNa: number;
  plasmaAd: number;
  mapMmHg: number;
  heartRateBpm: number;
  bloodVolumePct: number;
  paroxysmSecondsRemaining: number;
  paroxysmIntensity: number;
}

export interface MedullaDerived {
  plasmaNa: number;
  plasmaAd: number;
  mapMmHg: number;
  heartRateBpm: number;
  bloodVolumePct: number;
  orthostaticDropMmHg: number;
  arrhythmiaRiskPct: number;
  triadHeadache: boolean;
  triadSweating: boolean;
  triadPalpitations: boolean;
  triadCount: number;
  paroxysmActive: boolean;
  classification: MedullaState_Classification;
  patternSummary: string;
}

export interface MedullaSnapshot {
  state: MedullaInternalState;
  derived: MedullaDerived;
}

export interface MedullaHistoryPoint {
  t: number;
  map: number;
  hr: number;
  volume: number;
}

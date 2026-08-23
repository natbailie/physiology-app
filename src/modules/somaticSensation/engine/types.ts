export type SomaticState_Classification =
  | 'normal sensation'
  | 'acute nociceptive pain'
  | 'neuropathic: allodynia and wind-up'
  | 'Brown-Séquard: hemicord syndrome'
  | 'anterior cord syndrome'
  | 'syringomyelia: segmental dissociation'
  | 'complete transection'
  | 'local anaesthetic block';

export interface SomaticInputs {
  /** Innocuous mechanical (Aβ) stimulus drive, 0-100. */
  touchStimulusDrive: number;
  /** Nociceptive drive from tissue damage, 0-100. */
  nociceptiveStimulusDrive: number;
  /** Rubbing/counterstimulus recruiting Aβ gate closure, 0-100. */
  rubbingGateDrive: number;
  /** Descending modulation from PAG/RVM, 0-100. */
  descendingModulation: number;
  /** Local anaesthetic sodium-channel block, 0-100. */
  localAnaestheticBlock: number;
  /** Peripheral sensitisation ceiling from inflammatory mediators, 0-100. */
  peripheralSensitisation: number;
  /** Central wind-up gain (NMDA-dependent amplification), 0-100. */
  windUpGain: number;
  /** Left hemicord (dorsal columns + spinothalamic + corticospinal) lesion severity, 0-100. */
  leftHemisectionSeverity: number;
  /** Right hemicord lesion severity, 0-100. */
  rightHemisectionSeverity: number;
  /** Bilateral anterior quadrants (both spinothalamics), 0-100. */
  anteriorQuadrantSeverity: number;
  /** Central canal expansion (syrinx): segmental pain/temp loss, 0-100. */
  centralCanalSeverity: number;
}

export interface SomaticInternalState {
  simTimeSeconds: number;
  /** Perceived pain rating, 0-10 — relaxes toward the transmission-cell target. */
  painRating: number;
  /** Peripheral sensitisation accumulated so far, fraction of the input ceiling. */
  sensitisationAccumulated: number;
  /** Central amplification accumulated by sustained C-input, 0-1. */
  centralAmplification: number;
  /** Transient injury burst added to nociceptive drive, decays over minutes. */
  injuryBurst: number;
  /** Opioid burst to descending modulation, decays over hours (compressed). */
  opioidBurst: number;
}

/** Modality status BELOW the cord lesion, per side, as preserved percentage (100 = intact). */
export interface ModalityMap {
  touchLeftPct: number;
  touchRightPct: number;
  proprioceptionLeftPct: number;
  proprioceptionRightPct: number;
  painTempLeftPct: number;
  painTempRightPct: number;
  /** Segmental (cape-like) pain/temperature at the syrinx level — arms before legs. */
  segmentalPainTempPct: number;
}

export interface SomaticDerived extends ModalityMap {
  abTraffic: number;
  adDeltaTraffic: number;
  cFibreTraffic: number;
  gateOpenFraction: number;
  transmissionCellOutput: number;
  painRatingTarget: number;
  perceivedPainScore: number;
  firstPainLatencyMs: number;
  secondPainLatencyMs: number;
  touchLatencyMs: number;
  allodyniaActive: boolean;
  classification: SomaticState_Classification;
  patternSummary: string;
  // Passthrough so tick() can stay a pure (state, derived, dt) function.
  descendingModulation: number;
  rubbingGateDrive: number;
  /** Ceiling for accumulated peripheral sensitisation, fraction (0-1). */
  sensitisationCeiling: number;
}

export interface SomaticSnapshot {
  state: SomaticInternalState;
  derived: SomaticDerived;
}

export interface SomaticHistoryPoint {
  t: number;
  pain: number;
  sensitisation: number;
  gate: number;
}

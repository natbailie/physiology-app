export type MicturitionPhase =
  | 'filling'
  | 'first desire'
  | 'strong desire'
  | 'micturition'
  | 'voiding'
  | 'overflow';

export interface MicturitionInputs {
  /** Urine production rate, mL/min (1-5, normal ≈ 1.5). */
  urineProductionMLperMin: number;
  /** Parasympathetic (pelvic nerve) drive, % of maximal (0-100). Contracts detrusor. */
  parasympatheticPct: number;
  /** Sympathetic (hypogastric nerve) drive, % of maximal (0-100). Relaxes detrusor, contracts internal sphincter. */
  sympatheticPct: number;
  /** Voluntary external sphincter contraction, % (0-100). Squeeze to hold. */
  voluntarySphincterPct: number;
  /** Higher-brain inhibition of the micturition reflex. When true, voiding is suppressed even if the reflex fires. */
  cortexInhibitsMicturition: boolean;
}

export interface MicturitionInternalState {
  simTimeSeconds: number;
  /** Current bladder volume, mL (0-600). */
  bladderVolumeML: number;
  /** Detrusor smooth-muscle tone, 0-1 (0 = fully relaxed, 1 = maximal contraction). */
  detrusorTone: number;
  /** External urethral sphincter tone, 0-1 (0 = relaxed/voiding, 1 = maximally contracted/holding). */
  externalSphincterTone: number;
  /** Afferent stretch-receptor firing rate, 0-1. */
  afferentFiringRate: number;
}

export interface MicturitionDerived {
  /** Intravesical pressure, cmH₂O — passive wall stretch plus active detrusor contraction. */
  intravesicalPressureCmH2O: number;
  /** Afferent firing rate (pass-through). */
  afferentFiringRate: number;
  /** Parasympathetic nerve activity, relative 0-1. */
  parasympatheticActivity: number;
  /** Sympathetic nerve activity, relative 0-1. */
  sympatheticActivity: number;
  /** External sphincter tone (pass-through). */
  externalSphincterTone: number;
  /** Detrusor tone (pass-through). */
  detrusorTone: number;
  /** Bladder volume mL (pass-through). */
  bladderVolumeML: number;
  /** Current functional phase. */
  phase: MicturitionPhase;
  /** Sensation description for the learner. */
  sensation: string;
  /** Net flow rate mL/min: positive = filling, negative = voiding. */
  netFlowRateMLperMin: number;
}

export interface MicturitionSnapshot {
  state: MicturitionInternalState;
  derived: MicturitionDerived;
}

export interface MicturitionHistoryPoint {
  t: number;
  bladderVolumeML: number;
  intravesicalPressureCmH2O: number;
  detrusorTone: number;
  afferentFiringRate: number;
}

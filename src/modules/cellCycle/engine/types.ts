export type CellPhase = 'G1' | 'S' | 'G2' | 'M';

export type ArrestCause =
  | 'none'
  | 'quiescence (no growth signal)'
  | 'G1/S checkpoint — DNA damage (p53)'
  | 'G1/S checkpoint — CDK4/6 inhibited'
  | 'S phase — replication blocked'
  | 'G2/M checkpoint — DNA damage (p53)'
  | 'M phase — spindle assembly checkpoint';

export interface CellCycleInputs {
  /** Mitogenic growth-factor drive, fraction of a full mitogenic signal (0-1.5). */
  growthFactorDrive: number;
  /** DNA damage load, fraction 0-1 (radiation, chemotherapy, replication errors). */
  dnaDamage: number;
  /** Functional p53, fraction (0-1). Low models TP53 mutation — the most common single
   * gene lesion in human cancer. */
  p53Function: number;
  /** Functional RB1, fraction (0-1). Low removes the restriction point entirely. */
  rbFunction: number;
  /** Constitutive oncogenic proliferative signal (MYC/HER2-class), fraction (0-1) —
   * drives cyclin expression regardless of growth factors and shortens G1. */
  oncogeneDrive: number;
  /** CDK4/6 inhibitor coverage, % (0-100) — palbociclib-class G1 blockade. */
  cdk46InhibitionPct: number;
  /** Spindle poison, % (0-100) — paclitaxel-class: arrests mitosis at the SAC. */
  spindlePoisonPct: number;
  /** Replication blocker, % (0-100) — hydroxyurea-class: stalls S phase. */
  replicationBlockPct: number;
}

export interface CellCycleInternalState {
  simTimeSeconds: number;
  /** Current phase of the tracked cohort. */
  phase: CellPhase;
  /** Progress through the current phase, 0..1. */
  phaseProgress: number;
  /** Completed divisions since the simulation started. */
  completedDivisions: number;
  /** DNA damage actually present, 0-1 — the input is the insult; this is the lesion load,
   * which intact p53 repairs down over time. */
  lesionLoad: number;
  /** Fraction of the population that has undergone apoptosis, 0-1. */
  apoptoticFraction: number;
}

export interface CellCycleDerived {
  phase: CellPhase;
  phaseProgress: number;
  phaseProgressPct: number;
  /** Effective duration of the current phase under current regulation, hours. */
  phaseDurationH: number;
  /** What, if anything, is holding cells where they are. */
  arrestCause: ArrestCause;
  /** Fraction of the population actively cycling rather than parked, %. */
  cyclingRatePct: number;
  /** Estimated population doubling time, hours (9999 when effectively arrested). */
  doublingTimeH: number;
  /** Cyclin D signal driving the restriction point, %. */
  cyclinDDrivePct: number;
  lesionLoadPct: number;
  apoptoticFractionPct: number;
  /** p53 active signal given function and lesion load, %. */
  p53ActivityPct: number;
  // Passthrough so tick() stays pure.
  growthFactorDrive: number;
  dnaDamage: number;
  p53Function: number;
  oncogeneDrive: number;
}

export interface CellCycleSnapshot {
  state: CellCycleInternalState;
  derived: CellCycleDerived;
}

export interface CellCycleHistoryPoint {
  t: number;
  cyclingRatePct: number;
  lesionLoadPct: number;
}

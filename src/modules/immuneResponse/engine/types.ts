/** Extracellular pathogens are cleared mainly by antibody; intracellular ones must be killed
 * by cytotoxic T cells, because antibody cannot reach inside a host cell. */
export type PathogenType = 'extracellular' | 'intracellular';

export type ResponsePhase = 'naive' | 'innate' | 'priming' | 'effector' | 'resolution' | 'memory';

export interface ImmuneInputs {
  /** Replication rate of the challenge organism, % of a reference rate (0-200) */
  pathogenVirulence: number;
  pathogenType: PathogenType;
  /** Innate immune competence, fraction (0-1.5) — neutrophils, macrophages, complement */
  innateImmuneFunction: number;
  /** Helper T cell count, fraction (0-1.5) — the coordinating hub. Low models HIV/AIDS, and
   * because helper cells license BOTH cytotoxic T cells and B cells, losing them cripples
   * cellular and humoral immunity together */
  helperTCellCount: number;
  /** B cell competence, fraction (0-1.5) — low models agammaglobulinemia */
  bCellFunction: number;
  /** Pharmacological immunosuppression, % (0-100) — steroids, transplant regimens */
  immunosuppression: number;
}

export interface ImmuneState {
  simTimeSeconds: number;
  /** Pathogen burden, 0..1 (the plant variable) */
  pathogenLoad: number;
  /** Fast, non-specific first line — no memory, active within hours */
  innateActivity: number;
  /** Dendritic cells carrying antigen to the lymph node; the delay that makes a primary
   * response slow */
  antigenPresentation: number;
  /** Helper T cell activation, 0..1 — the hub that licenses both effector arms */
  helperTActivity: number;
  /** Cytotoxic T cell activity, 0..1 — kills infected host cells */
  cytotoxicTActivity: number;
  /** Activated B cells, 0..1 */
  bCellActivity: number;
  /** IgM appears first; IgG follows after class switching and is far more potent */
  igmTitre: number;
  iggTitre: number;
  /** Persistent memory, 0..1 — survives clearance and is what makes a second exposure different */
  memoryLevel: number;
  /** Inflammatory cytokines driving fever, 0..1 */
  cytokineLevel: number;
  /** Non-replicating vaccine antigen still present, 0..1 — primes the response without any
   * infection ever occurring */
  vaccineAntigen: number;
  /** Days since the current challenge began; -1 when none is in progress */
  daysSinceChallenge: number;
  /** Days taken to clear the current challenge; 0 while unresolved */
  clearanceTimeDays: number;
  /** Peak pathogen load reached during the current challenge */
  peakPathogenLoad: number;
}

export interface ImmuneDerived {
  pathogenLoad: number;
  innateActivity: number;
  antigenPresentation: number;
  helperTActivity: number;
  cytotoxicTActivity: number;
  bCellActivity: number;
  igmTitre: number;
  iggTitre: number;
  memoryLevel: number;
  /** Core body temperature, °C — cytokine-driven */
  temperatureC: number;
  responsePhase: ResponsePhase;
  clearanceTimeDays: number;
  peakPathogenLoad: number;
  daysSinceChallenge: number;
  /** Total killing pressure currently applied to the pathogen */
  totalEffectorActivity: number;
  isCleared: boolean;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  pathogenVirulence: number;
  pathogenType: PathogenType;
  innateImmuneFunction: number;
  helperTCellCount: number;
  bCellFunction: number;
  immunosuppression: number;
}

export interface ImmuneSnapshot {
  state: ImmuneState;
  derived: ImmuneDerived;
}

export interface ImmuneHistoryPoint {
  t: number;
  pathogenLoad: number;
  iggTitre: number;
  memoryLevel: number;
}

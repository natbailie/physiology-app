/**
 * Which effector mechanism did the damage.
 *
 * The classification is Gell and Coombs', and its value is that it is mechanistic rather than
 * descriptive: two reactions to the same antigen can look superficially similar and belong to
 * different types, and the type — not the antigen, and not the severity — is what determines
 * how fast it appears, what it injures, and what treatment does anything.
 */
export type HypersensitivityType = 'I' | 'II' | 'III' | 'IV';

export type DominantMechanism = HypersensitivityType | 'none';

export interface HypersensitivityInputs {
  /** Size of the antigen exposure, % of a reference dose (0-200) */
  antigenDose: number;
  /**
   * Antigen-specific IgE bound to mast cells, fraction (0-1.5) — type I.
   *
   * This is what "sensitised" means, and why a first exposure to a bee sting is uneventful
   * while the second can be fatal. Nothing about the antigen changed.
   */
  igeSensitisation: number;
  /** IgG or IgM against an antigen fixed on a cell surface, fraction (0-1.5) — type II */
  iggAgainstCellSurface: number;
  /**
   * Circulating IgG able to form immune complexes with soluble antigen, fraction (0-1.5) —
   * type III. Complexes need antigen and antibody in comparable amounts, which is why this
   * type has a dose dependence the others do not.
   */
  circulatingIggForComplexes: number;
  /** Antigen-specific memory T cells, fraction (0-1.5) — type IV. No antibody involved at all */
  sensitisedTCells: number;
  /** Complement availability, fraction (0-1.5) — the shared effector of types II and III */
  complementFunction: number;
  /**
   * Mast cell stabilisation, % (0-100) — antihistamine, cromoglicate, corticosteroid.
   *
   * Blocks type I and does essentially nothing to the others, which is the practical reason
   * the classification is worth knowing.
   */
  mastCellStabilisation: number;
}

export interface HypersensitivityState {
  simTimeSeconds: number;
  /** Hours since the challenge; -1 when no challenge is running */
  hoursSinceChallenge: number;
  /** Soluble antigen circulating, 0..1 — what mast cells meet and what forms complexes */
  solubleAntigen: number;
  /** Antigen bound to a cell surface or tissue protein, 0..1 — what antibody binds ON a cell
   * and what T cells come to find. Persists for days, which is why the slow types are slow */
  fixedAntigen: number;
  /** Mast cell granules still loaded, 0..1. A finite store, which is what makes type I a
   * spike rather than a plateau */
  granuleStore: number;
  /** Mast cells that have degranulated, 0..1 — minutes */
  mastCellDegranulation: number;
  /** Released histamine and other preformed mediators, 0..1 */
  histamine: number;
  /** IgG bound to cell surfaces, driving complement lysis and opsonisation, 0..1 — hours */
  boundToCellSurface: number;
  /** Circulating antigen-antibody complexes deposited in vessel walls, 0..1 — hours */
  immuneComplexDeposition: number;
  /** Complement consumed by types II and III, 0..1 — measured clinically as a LOW C3/C4 */
  complementConsumption: number;
  /** Red cells destroyed by opsonisation and lysis, 0..1 */
  cellDestruction: number;
  /** T cells recruited to the site, 0..1 — days */
  tCellRecruitment: number;
  /** Macrophages activated by those T cells, 0..1 — the effector of type IV */
  macrophageActivation: number;
  /** Cumulative tissue injury, 0..1 */
  tissueInjury: number;
  /** Hours at which tissue injury first became clinically apparent; -1 until it does */
  onsetHours: number;
  /** Peak injury reached during this challenge */
  peakInjury: number;
  /** Which arm was dominant at that peak. Held so the verdict names the reaction that
   * HAPPENED rather than whatever is left of it now — an anaphylaxis that has resolved was
   * still an anaphylaxis, and reporting "no reaction" beside a peak of 95% helps nobody. */
  peakMechanism: DominantMechanism;
}

export interface HypersensitivityDerived {
  hoursSinceChallenge: number;
  solubleAntigen: number;
  fixedAntigen: number;
  granuleStore: number;
  mastCellDegranulation: number;
  histamine: number;
  boundToCellSurface: number;
  immuneComplexDeposition: number;
  cellDestruction: number;
  tCellRecruitment: number;
  macrophageActivation: number;
  tissueInjury: number;
  onsetHours: number;
  peakInjury: number;

  /** How much injury each arm is currently responsible for, 0..1. Drives the timeline. */
  armActivity: Record<HypersensitivityType, number>;
  dominantMechanism: DominantMechanism;
  /** One line naming what is happening and how it was worked out. */
  mechanismSummary: string;

  // --- The panel a learner reads ---
  /** Mast cell tryptase, ng/mL. Normal < 11; rises only in type I, and only briefly */
  tryptaseNgMl: number;
  /** C3, mg/dL. Normal ~100; consumed by types II and III, untouched by I and IV */
  c3MgDl: number;
  c4MgDl: number;
  /** Direct antiglobulin (Coombs) test, 0..1 — antibody ON the cell, so positive only in type II */
  directCoombs: number;
  /** Haptoglobin, mg/dL. Normal ~120; mops up free haemoglobin, so it FALLS in haemolysis */
  haptoglobinMgDl: number;
  lactateDehydrogenaseUL: number;
  bilirubinUmolL: number;
  temperatureC: number;
  meanArterialPressureMmHg: number;
  /** Wheal diameter, mm — the immediate weal-and-flare of a type I skin test */
  whealMm: number;
  /** Induration diameter, mm — the firm, delayed swelling of a type IV response. Distinct from
   * a wheal: cellular infiltrate rather than leaked plasma, which is why it takes days and
   * feels hard rather than soft */
  indurationMm: number;

  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  antigenDose: number;
  igeSensitisation: number;
  iggAgainstCellSurface: number;
  circulatingIggForComplexes: number;
  sensitisedTCells: number;
  complementFunction: number;
  mastCellStabilisation: number;
}

export interface HypersensitivitySnapshot {
  state: HypersensitivityState;
  derived: HypersensitivityDerived;
}

export interface HypersensitivityHistoryPoint {
  t: number;
  hoursSinceChallenge: number;
  typeI: number;
  typeII: number;
  typeIII: number;
  typeIV: number;
  tissueInjury: number;
}

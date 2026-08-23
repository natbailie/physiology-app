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

/**
 * Things that injure a transfused patient without being hypersensitivity at all.
 *
 * Worth naming rather than lumping under "no reaction", because two of the three commonest
 * transfusion reactions are here. Recognising that a reaction is NOT one of the four types is
 * a diagnosis in its own right, and it changes the treatment completely — a wet lung from too
 * much volume is offloaded, and a wet lung from leaking capillaries is not.
 */
export type NonImmuneCause = 'volume overload' | 'capillary leak' | 'stored cytokines' | null;

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

  // --- Transfusion: the same four arms, driven by what is in the bag ---

  /**
   * ABO compatibility, fraction (0-1; 1 is fully compatible).
   *
   * The reason a transfusion reaction can be immediate on a FIRST transfusion, which no other
   * scenario in this module allows: anti-A and anti-B are naturally occurring, present without
   * any prior exposure at all. Sensitisation is not required, so the usual reassurance that a
   * first exposure is safe does not apply to blood.
   */
  aboCompatibility: number;
  /** Recipient IgA deficiency with anti-IgA, fraction (0-1) — anaphylaxis to donor plasma */
  recipientIgaDeficiency: number;
  /** Donor leukocytes and the cytokines they have accumulated in storage, % (0-100) */
  productLeukocyteLoad: number;
  /**
   * Donor anti-leukocyte antibody, fraction (0-1) — TRALI.
   *
   * Antibody in the DONOR's plasma against the RECIPIENT's neutrophils, which is why TRALI is a
   * property of the donor rather than of the patient, and why it is prevented by screening
   * donors rather than by pre-medicating recipients.
   */
  donorAntileukocyteAntibody: number;
  /** Anamnestic recall of an antibody against a minor red cell antigen, fraction (0-1) — the
   * delayed haemolytic reaction, where antibody has to be RE-MADE and that takes days */
  anamnesticRecall: number;
  /** Cardiac and renal reserve for handling a volume load, fraction (0-1.5) — low reserve is
   * what turns a routine unit into circulatory overload */
  cardiacReserve: number;
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
  /** Excess plasma volume from the transfusion, litres — the volume arm, which is not an
   * immune mechanism at all and is the commonest transfusion reaction there is */
  plasmaVolumeExcess: number;
  /** Neutrophil-mediated pulmonary capillary leak, 0..1 — TRALI */
  capillaryLeak: number;
  /** Antibody being re-made against a minor red cell antigen, 0..1. Rises over DAYS, which is
   * the entire clinical signature of a delayed haemolytic reaction */
  recalledAntibody: number;
  /** Cytokines carried in with stored donor leukocytes, 0..1 — fever and nothing else */
  transfusedCytokines: number;
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
  /** Set when the injury is real but none of the four arms caused it. */
  nonImmuneCause: NonImmuneCause;
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
  /** Haemoglobin, g/dL. A transfusion should RAISE it; a haemolytic reaction is the case where
   * it falls instead, which is often the first thing anyone notices */
  haemoglobinGDl: number;
  /** Arterial oxygen saturation, % — falls in both TACO and TRALI, and cannot separate them */
  saO2Percent: number;
  /**
   * BNP, pg/mL. The row that DOES separate them: it is released by a stretched ventricle, so
   * it is high when the lung is wet from too much volume (TACO) and normal when the lung is
   * wet from leaking capillaries (TRALI). Same chest film, opposite treatments.
   */
  bnpPgMl: number;
  plasmaVolumeExcess: number;
  capillaryLeak: number;
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
  aboCompatibility: number;
  recipientIgaDeficiency: number;
  productLeukocyteLoad: number;
  donorAntileukocyteAntibody: number;
  anamnesticRecall: number;
  cardiacReserve: number;
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

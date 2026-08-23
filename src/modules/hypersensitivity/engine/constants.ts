/**
 * The four arms, and their time constants.
 *
 * These numbers ARE the classification. Everything else about the four types — what they
 * injure, what the labs show, what treatment works — follows from which effector was
 * recruited, and the effectors differ by three orders of magnitude in how long they take.
 * A reaction that appears in fifteen minutes and one that appears in three days cannot share
 * a mechanism, which is why onset time is the first question asked at the bedside.
 */

export const TYPE_I = {
  /**
   * Rate at which cross-linked mast cells empty their granules, per hour.
   *
   * Enormous, because nothing has to be made: the mediators are already synthesised and sitting
   * in granules waiting for a trigger. This is the only reason a reaction can kill someone in
   * ten minutes, and it is the entire mechanistic difference between type I and the other three.
   */
  RELEASE_RATE_PER_HOUR: 14,
  HISTAMINE_YIELD: 2.1,
  /**
   * Granules are a FINITE store, and modelling that is what makes the reaction a spike rather
   * than a plateau. Without depletion the mast cells keep releasing for as long as antigen is
   * around, and anaphylaxis becomes a slow swell lasting half a day — which is not what it is,
   * and would wreck the one comparison the module exists to make.
   */
  GRANULE_RECOVERY_TAU_HOURS: 60,
  // Histamine is cleared within the hour, which is why tryptase must be sampled early or the
  // diagnosis is lost, and why a reaction can be over before anyone has worked out its cause.
  HISTAMINE_CLEARANCE_TAU_HOURS: 0.45,
  INJURY_GAIN: 0.95,
};

export const TYPE_II = {
  // Antibody must find and bind a cell-surface antigen, then complement or a phagocyte has to
  // do the killing. Hours, not minutes.
  BINDING_TAU_HOURS: 1.4,
  DESTRUCTION_TAU_HOURS: 3.5,
  GAIN: 1.3,
  INJURY_GAIN: 0.95,
  // Complement does much of the lysing, so a complement-deficient host destroys fewer cells.
  COMPLEMENT_SHARE: 0.6,
};

export const TYPE_III = {
  // Complexes have to form in the circulation, travel, and deposit in vessel walls before
  // anything is damaged, so this is the slowest of the antibody-mediated types.
  FORMATION_TAU_HOURS: 3,
  DEPOSITION_TAU_HOURS: 9,
  GAIN: 1.25,
  INJURY_GAIN: 0.9,
  COMPLEMENT_SHARE: 0.75,
  /**
   * Complexes need antigen and antibody in COMPARABLE amounts to form the mid-sized lattices
   * that deposit; a large excess of either dissolves them or clears them. This product term is
   * what gives type III its characteristic dose dependence, and it is why serum sickness needs
   * a substantial antigen load rather than a trace.
   */
  EQUIVALENCE_SHARPNESS: 2.6,
};

export const TYPE_IV = {
  // No antibody at all. T cells must traffic to the site, recognise antigen, and then activate
  // macrophages, which do the actual damage — and each of those steps takes many hours.
  // This is why a tuberculin test is read at 48 to 72 hours and not before.
  RECRUITMENT_TAU_HOURS: 16,
  MACROPHAGE_TAU_HOURS: 22,
  GAIN: 1.3,
  INJURY_GAIN: 0.8,
  // Cellular infiltrate resolves over a week or more, far more slowly than it arrived.
  RESOLUTION_TAU_HOURS: 90,
};

export const ANTIGEN = {
  /**
   * Antigen exists in two forms, and WHICH form is the axis the classification is built on.
   *
   * SOLUBLE antigen circulates and is cleared over a day or so. It is what mast cells meet
   * (type I) and what forms immune complexes with circulating antibody (type III).
   *
   * FIXED antigen is bound to a cell surface or to tissue protein — a drug hapten stuck to a
   * red cell, a transfused blood group antigen, poison ivy oil haptenised onto skin protein.
   * It persists for days, because clearing it means clearing the cell or the tissue. It is
   * what antibody binds ON a cell (type II) and what T cells come to find (type IV).
   *
   * Modelling one pool with one clearance rate does not work: the fast arms need antigen gone
   * within hours and the slow arms need it still there in three days. Splitting it is not a
   * convenience — the split IS the difference between type II and type III.
   */
  SOLUBLE_CLEARANCE_TAU_HOURS: 20,
  // Days. Transfused red cells outlive this window entirely, and a hapten bound to skin
  // protein sits there until the skin turns over — which is why the delayed arms have anything
  // left to react against by the time they get going.
  FIXED_CLEARANCE_TAU_HOURS: 110,
  CHALLENGE_DOSE_SCALE: 0.01,
};

export const COMPLEMENT = {
  NORMAL_C3_MG_DL: 110,
  NORMAL_C4_MG_DL: 28,
  // Consumption is the point: a LOW C3 and C4 mean complement has been used up by an ongoing
  // immune process, which is why they are measured in a suspected type II or III and are
  // stone-normal in type I and type IV.
  CONSUMPTION_TAU_HOURS: 3,
  RECOVERY_TAU_HOURS: 30,
  // C4 is consumed proportionally harder than C3 in classical-pathway activation, and neither
  // is ever driven to literally nothing — an undetectable C4 is a real finding, a negative one
  // is a modelling artefact.
  C4_SENSITIVITY: 1.15,
  FLOOR_FRACTION: 0.04,
};

export const HAEMOLYSIS = {
  NORMAL_HAPTOGLOBIN_MG_DL: 130,
  NORMAL_LDH_U_L: 180,
  NORMAL_BILIRUBIN_UMOL_L: 10,
  // Haptoglobin binds free haemoglobin and the complex is cleared, so haptoglobin is CONSUMED
  // by haemolysis. A low haptoglobin is the most specific routine marker there is.
  HAPTOGLOBIN_CONSUMPTION: 125,
  LDH_RISE_U_L: 900,
  BILIRUBIN_RISE_UMOL_L: 55,
};

export const CLINICAL = {
  NORMAL_TEMPERATURE_C: 37,
  NORMAL_MAP_MMHG: 90,
  NORMAL_TRYPTASE_NG_ML: 5,
  // Anaphylaxis is a distributive shock: histamine dilates and leaks, so the pressure falls
  // fast and steeply. This is the only arm that does it.
  ANAPHYLAXIS_MAP_FALL_MMHG: 52,
  TRYPTASE_PEAK_NG_ML: 85,
  // A weal is leaked plasma — soft, immediate, and gone within the hour.
  WHEAL_PER_UNIT_MM: 22,
  // Induration is a cellular infiltrate — firm, delayed, and lasting days. The physical
  // difference at the bedside IS the mechanistic difference.
  INDURATION_PER_UNIT_MM: 20,
  // Fever tracks complement activation and macrophage activity rather than histamine, which is
  // why anaphylaxis is dramatic and afebrile while serum sickness comes with a temperature.
  FEVER_FROM_COMPLEXES_C: 1.9,
  FEVER_FROM_CELL_DESTRUCTION_C: 1.6,
  FEVER_FROM_MACROPHAGES_C: 1.1,
  FEVER_TAU_HOURS: 2,
};

export const INJURY = {
  /**
   * Injury tracks whichever arm is active almost immediately, because the ARMS are what carry
   * the timing — each one already has its own time constant, and the four of them differing is
   * the entire subject. A slow filter here does not add realism, it destroys the thing being
   * measured: with a 1.2 hour rise constant the fifteen-minute histamine spike of anaphylaxis
   * was flattened to a quarter of its height, and a pre-treated patient scored WORSE than an
   * untreated one because their slower, broader release passed through the filter better.
   */
  TAU_HOURS: 0.1,
  RESOLUTION_TAU_HOURS: 3,
  // Below this the reaction has not declared itself and no onset time is recorded.
  APPARENT_THRESHOLD: 0.08,
};

export const HYPERSENSITIVITY_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 900,
  /**
   * One simulated second is one hour, so a three-day tuberculin reaction plays out in about a
   * minute of watching.
   *
   * This is also the module's central presentational problem, and it is not solved by tuning
   * this number. Type I peaks in minutes and type IV in days; no single linear time axis shows
   * both. The reaction timeline uses a LOGARITHMIC axis for exactly that reason — it is the
   * only way to put "fifteen minutes" and "seventy-two hours" in one picture, and that
   * comparison is the thing being taught.
   */
  HOURS_PER_SECOND: 1,
  TIME_SCALE: 2,
};

/**
 * Transfusion: the same four arms, plus a volume arm that is not immune at all.
 *
 * The organising claim of this half of the module is that every transfusion reaction is one of
 * the mechanisms above driven by something in the bag — with two exceptions that are worth
 * knowing precisely BECAUSE they are exceptions. A febrile non-haemolytic reaction is cytokines
 * carried in with stored donor white cells and belongs to none of the four types; circulatory
 * overload is plain hydrostatics and involves the immune system nowhere.
 */
export const TRANSFUSION = {
  /**
   * How hard naturally-occurring anti-A and anti-B hit an incompatible unit.
   *
   * Large, and it needs no sensitisation whatsoever — these antibodies are present from
   * infancy without any prior exposure to blood. That is why an ABO-incompatible transfusion
   * can kill on someone's FIRST transfusion, and why it is the one reaction in this module
   * where "they have never had it before" offers no protection at all.
   */
  ISOHAEMAGGLUTININ_STRENGTH: 1.45,
  // Anti-IgA in an IgA-deficient recipient, reacting against donor plasma IgA.
  ANTI_IGA_STRENGTH: 1.2,
  // Cytokines accumulated in the bag during storage: fever, and nothing else. No haemolysis,
  // no complement consumption, no hypotension — which is what makes it a diagnosis of
  // exclusion rather than a diagnosis.
  CYTOKINE_TAU_HOURS: 1.5,
  CYTOKINE_CLEARANCE_TAU_HOURS: 6,
  FEVER_FROM_CYTOKINES_C: 1.7,
  /**
   * Antibody against a MINOR red cell antigen has to be re-made from memory, and making
   * antibody takes days. That single fact is the whole clinical picture of a delayed
   * haemolytic reaction: the patient goes home, and their haemoglobin falls a week later.
   */
  RECALL_TAU_HOURS: 80,
  RECALL_STRENGTH: 1.15,
  // One unit, as a fraction of plasma volume. A normal heart clears it without noticing.
  UNIT_VOLUME_LOAD: 0.55,
  VOLUME_CLEARANCE_TAU_HOURS: 7,
  /**
   * How much volume a unit of cardiac and renal reserve can accommodate without the ventricle
   * being stretched.
   *
   * Overload is not the volume given, it is the volume in EXCESS of what the circulation can
   * take — which is exactly why the identical unit is unremarkable in one patient and drowns
   * the next. Without this term a correctly matched unit in a healthy recipient came back with
   * a BNP of 386 and a saturation of 88%, which is a description of the transfusion rather
   * than of anything wrong with it.
   */
  VOLUME_TOLERANCE_PER_RESERVE: 0.62,
  // TRALI: donor antibody activates recipient neutrophils in the pulmonary capillaries. The
  // lung leaks, but nothing is overloaded — which is why the BNP stays normal.
  LEAK_TAU_HOURS: 2.5,
  LEAK_RESOLUTION_TAU_HOURS: 40,
  NORMAL_BNP_PG_ML: 45,
  // BNP comes from a STRETCHED ventricle, so only the volume arm raises it.
  BNP_PER_VOLUME_EXCESS: 620,
  NORMAL_SAO2_PERCENT: 97,
  SAO2_FALL_FROM_OVERLOAD: 16,
  SAO2_FALL_FROM_LEAK: 22,
  NORMAL_HAEMOGLOBIN_G_DL: 9.5,
  // A unit should RAISE the haemoglobin by about this much.
  HAEMOGLOBIN_RISE_PER_UNIT: 1.2,
  HAEMOGLOBIN_FALL_FROM_HAEMOLYSIS: 3.4,
};

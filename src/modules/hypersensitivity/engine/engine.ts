import {
  ANTIGEN,
  CLINICAL,
  COMPLEMENT,
  HAEMOLYSIS,
  HYPERSENSITIVITY_SIMULATION,
  INJURY,
  TYPE_I,
  TYPE_II,
  TRANSFUSION,
  TYPE_III,
  TYPE_IV,
} from './constants';
import {
  cellDestructionTarget,
  cellSurfaceBindingTarget,
  complexInjuryTarget,
  histamineInjury,
  immuneComplexTarget,
  macrophageTarget,
  mastCellReleaseRate,
  blockadeFactor,
  capillaryLeakTarget,
  tCellTarget,
  totalAntiCellAntibody,
  totalMastCellTrigger,
} from './arms';
import { dominantMechanism, mechanismSummary, nonImmuneCause } from './classification';
import { approach, clamp } from '@/shared/lib/math';
import type {
  HypersensitivityDerived,
  HypersensitivityInputs,
  HypersensitivitySnapshot,
  HypersensitivityState,
} from './types';

/** Relaxation with different rise and fall time constants — arms build faster than they resolve. */
function approachAsymmetric(current: number, target: number, dtHours: number, riseTau: number, fallTau: number): number {
  return approach(current, target, dtHours, target >= current ? riseTau : fallTau);
}

export function createInitialState(): HypersensitivityState {
  return {
    simTimeSeconds: 0,
    hoursSinceChallenge: -1,
    solubleAntigen: 0,
    fixedAntigen: 0,
    granuleStore: 1,
    mastCellDegranulation: 0,
    histamine: 0,
    boundToCellSurface: 0,
    immuneComplexDeposition: 0,
    complementConsumption: 0,
    cellDestruction: 0,
    tCellRecruitment: 0,
    macrophageActivation: 0,
    tissueInjury: 0,
    onsetHours: -1,
    peakInjury: 0,
    plasmaVolumeExcess: 0,
    capillaryLeak: 0,
    recalledAntibody: 0,
    transfusedCytokines: 0,
    peakMechanism: 'none',
  };
}

export function computeDerived(
  state: HypersensitivityState,
  inputs: HypersensitivityInputs,
): HypersensitivityDerived {
  // How much injury each arm is responsible for right now. These four numbers are what the
  // timeline plots and what the classifier reads.
  // Volume the circulation cannot accommodate — the volume arm, which is not immune at all.
  const effectiveOverload = Math.max(
    0,
    state.plasmaVolumeExcess - clamp(inputs.cardiacReserve, 0, 1.5) * TRANSFUSION.VOLUME_TOLERANCE_PER_RESERVE,
  );

  const armActivity = {
    I: histamineInjury(state.histamine, blockadeFactor(inputs.mastCellStabilisation)),
    II: state.cellDestruction,
    III: complexInjuryTarget(state.immuneComplexDeposition, inputs.complementFunction),
    IV: state.macrophageActivation * TYPE_IV.INJURY_GAIN,
  };

  // Name the reaction that happened, not the wreckage left over. Once a challenge has produced
  // a real reaction the verdict holds the arm that was dominant at its peak, because that is
  // the diagnosis — a resolved anaphylaxis was still an anaphylaxis. Until then, report live.
  const live = dominantMechanism(armActivity);
  const mechanism = state.peakMechanism !== 'none' ? state.peakMechanism : live;
  const cause = nonImmuneCause(effectiveOverload, state.capillaryLeak, state.transfusedCytokines);


  // Complement is CONSUMED by the two antibody arms and untouched by the other two, which is
  // exactly why C3 and C4 are measured: a low pair localises the problem to II or III.
  const c3 = COMPLEMENT.NORMAL_C3_MG_DL * clamp(1 - state.complementConsumption, COMPLEMENT.FLOOR_FRACTION, 1);
  const c4 =
    COMPLEMENT.NORMAL_C4_MG_DL *
    clamp(1 - state.complementConsumption * COMPLEMENT.C4_SENSITIVITY, COMPLEMENT.FLOOR_FRACTION, 1);

  // Haemolysis markers move only with type II, because only there is a cell being destroyed.
  const haemolysis = state.cellDestruction;



  // Anaphylaxis is a distributive shock and nothing else here is. That single fact separates
  // the most urgent reaction from the rest at the bedside.
  const map = CLINICAL.NORMAL_MAP_MMHG - armActivity.I * CLINICAL.ANAPHYLAXIS_MAP_FALL_MMHG;

  return {
    hoursSinceChallenge: state.hoursSinceChallenge,
    solubleAntigen: state.solubleAntigen,
    fixedAntigen: state.fixedAntigen,
    granuleStore: state.granuleStore,
    mastCellDegranulation: state.mastCellDegranulation,
    histamine: state.histamine,
    boundToCellSurface: state.boundToCellSurface,
    immuneComplexDeposition: state.immuneComplexDeposition,
    cellDestruction: state.cellDestruction,
    tCellRecruitment: state.tCellRecruitment,
    macrophageActivation: state.macrophageActivation,
    tissueInjury: state.tissueInjury,
    onsetHours: state.onsetHours,
    peakInjury: state.peakInjury,

    armActivity,
    dominantMechanism: mechanism,
    nonImmuneCause: cause,
    mechanismSummary: mechanismSummary(mechanism, state.onsetHours, cause),

    // Tryptase is released from the same granules as histamine, so it rises only in type I —
    // and falls again within hours, which is why the sample has to be taken early.
    tryptaseNgMl: CLINICAL.NORMAL_TRYPTASE_NG_ML + state.histamine * CLINICAL.TRYPTASE_PEAK_NG_ML,
    c3MgDl: c3,
    c4MgDl: c4,
    // Antibody sitting ON the cell. Positive in type II by definition, and negative in type III
    // where the complexes are in the circulation rather than on a cell surface.
    directCoombs: clamp(state.boundToCellSurface, 0, 1),
    // The transfused CELLS raise the haemoglobin, and they persist after the plasma they came
    // in has been excreted — so the rise tracks the donor cells rather than the volume load.
    // A haemolytic reaction is the case where the haemoglobin falls after a transfusion
    // instead of rising, which is often the thing that makes anyone look.
    haemoglobinGDl:
      TRANSFUSION.NORMAL_HAEMOGLOBIN_G_DL +
      state.fixedAntigen * TRANSFUSION.HAEMOGLOBIN_RISE_PER_UNIT -
      haemolysis * TRANSFUSION.HAEMOGLOBIN_FALL_FROM_HAEMOLYSIS,
    // Both a wet lung from too much volume and a wet lung from leaking capillaries desaturate,
    // and this row cannot tell them apart. That is the difficulty the BNP exists to resolve.
    saO2Percent: clamp(
      TRANSFUSION.NORMAL_SAO2_PERCENT -
        effectiveOverload * TRANSFUSION.SAO2_FALL_FROM_OVERLOAD -
        state.capillaryLeak * TRANSFUSION.SAO2_FALL_FROM_LEAK,
      40,
      100,
    ),
    // Only a STRETCHED ventricle makes BNP, so the volume arm raises it and the leak does not.
    bnpPgMl: TRANSFUSION.NORMAL_BNP_PG_ML + effectiveOverload * TRANSFUSION.BNP_PER_VOLUME_EXCESS,
    plasmaVolumeExcess: state.plasmaVolumeExcess,
    capillaryLeak: state.capillaryLeak,
    haptoglobinMgDl: Math.max(HAEMOLYSIS.NORMAL_HAPTOGLOBIN_MG_DL - haemolysis * HAEMOLYSIS.HAPTOGLOBIN_CONSUMPTION, 2),
    lactateDehydrogenaseUL: HAEMOLYSIS.NORMAL_LDH_U_L + haemolysis * HAEMOLYSIS.LDH_RISE_U_L,
    bilirubinUmolL: HAEMOLYSIS.NORMAL_BILIRUBIN_UMOL_L + haemolysis * HAEMOLYSIS.BILIRUBIN_RISE_UMOL_L,
    temperatureC: CLINICAL.NORMAL_TEMPERATURE_C + feverRise(state),
    meanArterialPressureMmHg: map,
    whealMm: state.histamine * CLINICAL.WHEAL_PER_UNIT_MM,
    indurationMm: state.macrophageActivation * CLINICAL.INDURATION_PER_UNIT_MM,

    antigenDose: inputs.antigenDose,
    igeSensitisation: inputs.igeSensitisation,
    iggAgainstCellSurface: inputs.iggAgainstCellSurface,
    circulatingIggForComplexes: inputs.circulatingIggForComplexes,
    sensitisedTCells: inputs.sensitisedTCells,
    complementFunction: inputs.complementFunction,
    mastCellStabilisation: inputs.mastCellStabilisation,
    aboCompatibility: inputs.aboCompatibility,
    recipientIgaDeficiency: inputs.recipientIgaDeficiency,
    productLeukocyteLoad: inputs.productLeukocyteLoad,
    donorAntileukocyteAntibody: inputs.donorAntileukocyteAntibody,
    anamnesticRecall: inputs.anamnesticRecall,
    cardiacReserve: inputs.cardiacReserve,
  };
}

/**
 * Fever tracks complement activation and macrophage work, NOT histamine.
 *
 * This is a genuinely useful discriminator: anaphylaxis is dramatic and afebrile, while serum
 * sickness and a haemolytic reaction come with a temperature. A febrile reaction is therefore
 * evidence against type I before any test is sent.
 */
function feverRise(state: HypersensitivityState): number {
  return (
    state.immuneComplexDeposition * CLINICAL.FEVER_FROM_COMPLEXES_C +
    state.cellDestruction * CLINICAL.FEVER_FROM_CELL_DESTRUCTION_C +
    state.macrophageActivation * CLINICAL.FEVER_FROM_MACROPHAGES_C +
    // Cytokines carried in with stored donor white cells: fever, and nothing else at all. No
    // haemolysis, no complement consumption, no hypotension — which is exactly what makes a
    // febrile non-haemolytic reaction a diagnosis of exclusion rather than a diagnosis.
    state.transfusedCytokines * TRANSFUSION.FEVER_FROM_CYTOKINES_C
  );
}

export function tick(
  state: HypersensitivityState,
  derived: HypersensitivityDerived,
  dtSeconds: number,
): HypersensitivityState {
  // The engine works in HOURS; the loop supplies seconds.
  const dtHours = dtSeconds * HYPERSENSITIVITY_SIMULATION.HOURS_PER_SECOND;


  // Soluble antigen is cleared within a day; antigen fixed to a cell or to tissue protein
  // takes days, because clearing it means clearing what it is stuck to.
  const solubleAntigen = approach(state.solubleAntigen, 0, dtHours, ANTIGEN.SOLUBLE_CLEARANCE_TAU_HOURS);
  const fixedAntigen = approach(state.fixedAntigen, 0, dtHours, ANTIGEN.FIXED_CLEARANCE_TAU_HOURS);

  // --- Type I: minutes. Granules are already loaded; nothing has to be made. ---
  // Release EMPTIES a finite store, so the reaction is a spike: it peaks within minutes, and it
  // stops because the mast cells have run out rather than because the antigen has gone.
  const releaseRate = mastCellReleaseRate(
    state.solubleAntigen,
    totalMastCellTrigger(derived.igeSensitisation, derived.recipientIgaDeficiency),
    state.granuleStore,
  );
  const released = Math.min(releaseRate * dtHours, state.granuleStore);
  const granuleStore = clamp(
    state.granuleStore - released + (1 - state.granuleStore) * (dtHours / TYPE_I.GRANULE_RECOVERY_TAU_HOURS),
    0,
    1,
  );
  const mastCellDegranulation = clamp(1 - granuleStore, 0, 1);
  const histamine = clamp(
    state.histamine + released * TYPE_I.HISTAMINE_YIELD - (state.histamine / TYPE_I.HISTAMINE_CLEARANCE_TAU_HOURS) * dtHours,
    0,
    1,
  );

  // --- Type II: hours. Antibody must find a cell-bound antigen, then kill the cell. ---
  const boundToCellSurface = approachAsymmetric(
    state.boundToCellSurface,
    cellSurfaceBindingTarget(
      state.fixedAntigen,
      totalAntiCellAntibody(derived.iggAgainstCellSurface, derived.aboCompatibility, state.recalledAntibody),
    ),
    dtHours,
    TYPE_II.BINDING_TAU_HOURS,
    TYPE_II.DESTRUCTION_TAU_HOURS * 4,
  );
  const cellDestruction = approachAsymmetric(
    state.cellDestruction,
    cellDestructionTarget(boundToCellSurface, derived.complementFunction),
    dtHours,
    TYPE_II.DESTRUCTION_TAU_HOURS,
    TYPE_II.DESTRUCTION_TAU_HOURS * 5,
  );

  // --- Type III: many hours. Complexes form, circulate, then deposit. ---
  const immuneComplexDeposition = approachAsymmetric(
    state.immuneComplexDeposition,
    immuneComplexTarget(state.solubleAntigen, derived.circulatingIggForComplexes),
    dtHours,
    TYPE_III.DEPOSITION_TAU_HOURS,
    TYPE_III.DEPOSITION_TAU_HOURS * 5,
  );

  // --- Type IV: days. Cells have to physically arrive, then activate macrophages. ---
  const tCellRecruitment = approachAsymmetric(
    state.tCellRecruitment,
    tCellTarget(state.fixedAntigen, derived.sensitisedTCells),
    dtHours,
    TYPE_IV.RECRUITMENT_TAU_HOURS,
    TYPE_IV.RESOLUTION_TAU_HOURS,
  );
  const macrophageActivation = approachAsymmetric(
    state.macrophageActivation,
    macrophageTarget(tCellRecruitment),
    dtHours,
    TYPE_IV.MACROPHAGE_TAU_HOURS,
    TYPE_IV.RESOLUTION_TAU_HOURS,
  );

  // --- The transfusion arms ---
  // Antibody against a minor antigen has to be RE-MADE, and that is why the reaction is
  // delayed: the patient goes home well and their haemoglobin falls a week later.
  const recalledAntibody = approach(
    state.recalledAntibody,
    clamp(derived.anamnesticRecall, 0, 1) * (state.fixedAntigen > 0.05 ? 1 : 0),
    dtHours,
    TRANSFUSION.RECALL_TAU_HOURS,
  );
  const transfusedCytokines = approachAsymmetric(
    state.transfusedCytokines,
    clamp((derived.productLeukocyteLoad / 100) * Math.min(state.plasmaVolumeExcess * 2, 1), 0, 1),
    dtHours,
    TRANSFUSION.CYTOKINE_TAU_HOURS,
    TRANSFUSION.CYTOKINE_CLEARANCE_TAU_HOURS,
  );
  // Volume is cleared faster the more cardiac and renal reserve there is. A normal heart never
  // notices a unit; a failing one drowns on it, and nothing immune has happened either way.
  const clearance = TRANSFUSION.VOLUME_CLEARANCE_TAU_HOURS / Math.max(clamp(derived.cardiacReserve, 0.08, 1.5), 0.08);
  const plasmaVolumeExcess = approach(state.plasmaVolumeExcess, 0, dtHours, clearance);
  const capillaryLeak = approachAsymmetric(
    state.capillaryLeak,
    capillaryLeakTarget(derived.donorAntileukocyteAntibody, state.plasmaVolumeExcess),
    dtHours,
    TRANSFUSION.LEAK_TAU_HOURS,
    TRANSFUSION.LEAK_RESOLUTION_TAU_HOURS,
  );

  // Complement is consumed by the antibody arms only.
  const complementDemand = clamp(cellDestruction * 0.9 + immuneComplexDeposition * 1.1, 0, 1);
  const complementConsumption = approachAsymmetric(
    state.complementConsumption,
    complementDemand,
    dtHours,
    COMPLEMENT.CONSUMPTION_TAU_HOURS,
    COMPLEMENT.RECOVERY_TAU_HOURS,
  );

  // Total injury is whatever the busiest arm is doing — they injure different tissues in
  // different ways, so adding them would be meaningless.
  const injuryTarget = Math.max(
    derived.armActivity.I,
    derived.armActivity.II,
    derived.armActivity.III,
    derived.armActivity.IV,
  );
  const tissueInjury = approachAsymmetric(
    state.tissueInjury,
    injuryTarget,
    dtHours,
    INJURY.TAU_HOURS,
    INJURY.RESOLUTION_TAU_HOURS,
  );

  const challengeRunning = state.hoursSinceChallenge >= 0;
  const hoursSinceChallenge = challengeRunning ? state.hoursSinceChallenge + dtHours : -1;
  const justApparent = challengeRunning && state.onsetHours < 0 && tissueInjury >= INJURY.APPARENT_THRESHOLD;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    hoursSinceChallenge,
    solubleAntigen,
    fixedAntigen,
    granuleStore,
    mastCellDegranulation,
    histamine,
    boundToCellSurface,
    immuneComplexDeposition,
    complementConsumption,
    cellDestruction,
    tCellRecruitment,
    macrophageActivation,
    tissueInjury,
    onsetHours: justApparent ? hoursSinceChallenge : state.onsetHours,
    peakInjury: Math.max(state.peakInjury, tissueInjury),
    plasmaVolumeExcess,
    capillaryLeak,
    recalledAntibody,
    transfusedCytokines,
    peakMechanism: tissueInjury > state.peakInjury ? dominantMechanism(derived.armActivity) : state.peakMechanism,
  };
}

export function step(
  state: HypersensitivityState,
  inputs: HypersensitivityInputs,
  dtSeconds: number,
): HypersensitivitySnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/**
 * "Challenge" — expose the host to the antigen and start the clock.
 *
 * Whether anything happens, and how fast, depends entirely on which arm the host has been
 * sensitised in. The same exposure is a non-event, a rash three days later, or an
 * anaphylaxis, and the dose is identical in all three.
 */
export function perturbChallenge(state: HypersensitivityState, dose = 100): HypersensitivityState {
  const amount = dose * ANTIGEN.CHALLENGE_DOSE_SCALE;
  return {
    ...state,
    // One exposure loads both pools: some of any antigen circulates, and some ends up bound to
    // cells or tissue. Which pool matters depends entirely on which arm the host is sensitised
    // in, so the same challenge produces four completely different illnesses.
    solubleAntigen: clamp(state.solubleAntigen + amount, 0, 1),
    fixedAntigen: clamp(state.fixedAntigen + amount, 0, 1),
    hoursSinceChallenge: 0,
    onsetHours: -1,
    peakInjury: 0,
    peakMechanism: 'none',
  };
}

/**
 * "Adrenaline" — the treatment for anaphylaxis, and only for anaphylaxis.
 *
 * It reverses the vasodilatation and bronchospasm histamine has already caused, and it does
 * nothing whatever for a type II, III or IV reaction, because there is no histamine in those
 * to oppose. Watching it rescue one arm and fail against the other three is the most direct
 * argument for why the classification is worth knowing.
 */
export function perturbAdrenaline(state: HypersensitivityState): HypersensitivityState {
  return {
    ...state,
    histamine: state.histamine * 0.12,
  };
}

/**
 * "Transfuse" — give one unit of the product currently configured.
 *
 * Everything that follows depends on what is in the bag and who is receiving it, and the same
 * unit is a non-event, a fever, an anaphylaxis, a haemolysis, a wet lung or a drowning. Note
 * that the donor red cell antigens go into the FIXED pool, because they are stuck to cells —
 * which is what makes an incompatible transfusion a type II reaction rather than a type III.
 */
export function perturbTransfuse(state: HypersensitivityState): HypersensitivityState {
  return {
    ...state,
    // Donor red cell antigens: fixed to cells, and they persist as long as the cells do.
    fixedAntigen: clamp(state.fixedAntigen + 0.9, 0, 1),
    // Donor plasma proteins, including IgA: soluble.
    solubleAntigen: clamp(state.solubleAntigen + 0.7, 0, 1),
    plasmaVolumeExcess: clamp(state.plasmaVolumeExcess + TRANSFUSION.UNIT_VOLUME_LOAD, 0, 2),
    hoursSinceChallenge: 0,
    onsetHours: -1,
    peakInjury: 0,
    peakMechanism: 'none',
  };
}

/**
 * "Diurese" — offload the volume.
 *
 * The treatment for circulatory overload and useless for everything else here, which is the
 * transfusion half's version of the same lesson: it fixes a wet lung caused by too much volume
 * and does nothing at all for a wet lung caused by leaking capillaries. Telling those two
 * apart is what the BNP is for.
 */
export function perturbDiurese(state: HypersensitivityState): HypersensitivityState {
  return { ...state, plasmaVolumeExcess: state.plasmaVolumeExcess * 0.25 };
}

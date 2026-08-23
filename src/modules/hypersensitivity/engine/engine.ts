import {
  ANTIGEN,
  CLINICAL,
  COMPLEMENT,
  HAEMOLYSIS,
  HYPERSENSITIVITY_SIMULATION,
  INJURY,
  TYPE_I,
  TYPE_II,
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
  tCellTarget,
} from './arms';
import { dominantMechanism, mechanismSummary } from './classification';
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
    peakMechanism: 'none',
  };
}

export function computeDerived(
  state: HypersensitivityState,
  inputs: HypersensitivityInputs,
): HypersensitivityDerived {
  // How much injury each arm is responsible for right now. These four numbers are what the
  // timeline plots and what the classifier reads.
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
    mechanismSummary: mechanismSummary(mechanism, state.onsetHours),

    // Tryptase is released from the same granules as histamine, so it rises only in type I —
    // and falls again within hours, which is why the sample has to be taken early.
    tryptaseNgMl: CLINICAL.NORMAL_TRYPTASE_NG_ML + state.histamine * CLINICAL.TRYPTASE_PEAK_NG_ML,
    c3MgDl: c3,
    c4MgDl: c4,
    // Antibody sitting ON the cell. Positive in type II by definition, and negative in type III
    // where the complexes are in the circulation rather than on a cell surface.
    directCoombs: clamp(state.boundToCellSurface, 0, 1),
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
    state.macrophageActivation * CLINICAL.FEVER_FROM_MACROPHAGES_C
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
  const releaseRate = mastCellReleaseRate(state.solubleAntigen, derived.igeSensitisation, state.granuleStore);
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
    cellSurfaceBindingTarget(state.fixedAntigen, derived.iggAgainstCellSurface),
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

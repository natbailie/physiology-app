import { ACCOMMODATION, AQUEOUS, CLINICAL, LUMINANCE, PUPIL, RECEPTOR, VISION_SIMULATION } from './constants';
import {
  acuityDenominator,
  acuityLabel,
  absoluteSignal,
  classifyVision,
  coneWeight,
  patternSummary,
  pupilSceneDrive,
  pupilTargetMm,
  retinalResponses,
  regimeOf,
  torchFlashBoost,
} from './visionMechanics';
import {
  closureTarget,
  effectiveFacility,
  iopTargetMmHg,
  productionRate,
} from './aqueous';
import {
  accommodationDeficit,
  accommodativeResponse,
  convergenceDemandPrismD,
  demandForDistance,
  isBlurActive,
  nearPointCm,
  nearMiosisMm,
} from './accommodation';
import { mapFieldLesion } from './visualFields';
import { approach, clamp } from '@/shared/lib/math';
import type {
  FlashEye,
  VisionDerived,
  VisionInputs,
  VisionInternalState,
  VisionSnapshot,
} from './types';

const DEFAULT_SCENE_LOG_CD = 2;

export function createInitialState(): VisionInternalState {
  return {
    simTimeSeconds: 0,
    luminanceShiftLog: 0,
    bleachedFraction: 0,
    // Begin adapted to the default daylight scene.
    rodAdaptedLogCd: RECEPTOR.ROD_ADAPTATION_CEILING_LOG_CD,
    coneAdaptedLogCd: DEFAULT_SCENE_LOG_CD,
    pupilRightMm: 3.6,
    pupilLeftMm: 3.6,
    flashEye: 0,
    intraocularPressureMmHg: 15,
    angleClosureFraction: 0,
    accommodativeResponseD: 0.2,
  };
}

export function computeDerived(state: VisionInternalState, inputs: VisionInputs): VisionDerived {
  const effectiveLuminanceLogCd = clamp(
    inputs.sceneLuminanceLogCd + state.luminanceShiftLog,
    LUMINANCE.MIN_LOG_CD,
    LUMINANCE.MAX_LOG_CD,
  );
  const regime = regimeOf(effectiveLuminanceLogCd);
  const { rodResponse, coneResponse } = retinalResponses(
    effectiveLuminanceLogCd,
    state.rodAdaptedLogCd,
    state.coneAdaptedLogCd,
    state.bleachedFraction,
    inputs.rodIntegrity,
    inputs.coneIntegrity,
  );

  const totalSignal = clamp(rodResponse + coneResponse, 0, 1);
  // Perception adapts; the membrane does not fully. Brightness blends both so a dark-adapted
  // scene reads dimmer than daylight even though the receptors have partly caught up.
  const absolute = absoluteSignal(effectiveLuminanceLogCd, inputs.rodIntegrity, inputs.coneIntegrity);
  const glutamateRelease = clamp(1 - 0.85 * absolute, 0, 1);
  const perceivedBrightness = (0.35 * totalSignal + 0.65 * absolute) * 100;

  // The steady scene reaches both reflex circuits through the AVERAGE afferent limb; the torch
  // adds a boost scaled by the illuminated eye's own afferent gain, delivered bilaterally.
  const averageAfferent = (1 + clamp(inputs.leftOpticNerveAfferent, 0, 1)) / 2;
  const sceneDrive = pupilSceneDrive(effectiveLuminanceLogCd) * averageAfferent;
  const flashingRight = state.flashEye === 1;
  const flashingLeft = state.flashEye === -1;
  const boostRight = torchFlashBoost(sceneDrive, 1, flashingRight);
  const boostLeft = torchFlashBoost(sceneDrive, clamp(inputs.leftOpticNerveAfferent, 0, 1), flashingLeft);

  // Antimuscarinics weaken the constrictor limb in BOTH eyes — the pharmacological pupil.
  const efferentGainRight =
    clamp(inputs.rightPupilEfferentGain, 0, 1) *
    (1 - MYDRIATIC_EFFERENT_BLOCK * clamp(inputs.mydriaticDosePct / 100, 0, 1));
  const efferentGainLeft = 1 - MYDRIATIC_EFFERENT_BLOCK * clamp(inputs.mydriaticDosePct / 100, 0, 1);

  const targetRightRest = pupilTargetMm(sceneDrive, 0, efferentGainRight);
  const targetLeftRest = pupilTargetMm(sceneDrive, 0, efferentGainLeft);
  const targetRightFlash = pupilTargetMm(
    sceneDrive,
    Math.max(boostRight, boostLeft),
    efferentGainRight,
  );
  const targetLeftFlash = pupilTargetMm(sceneDrive, Math.max(boostRight, boostLeft), efferentGainLeft);

  const constrictionSpan = PUPIL.DARK_MM - PUPIL.CONSTRICTED_MM;
  // Reflex scores compare the illuminated against the unilluminated state of the same eye —
  // what the swinging-torch test compares between eyes is these two numbers.
  const directReflexRightScore =
    (clamp((targetRightRest - targetRightFlash) / constrictionSpan, 0, 1)) * 100;
  const directReflexLeftScore =
    (clamp((targetLeftRest - targetLeftFlash) / constrictionSpan, 0, 1)) * 100;

  // The near triad's third limb: accommodative effort adds miosis on top of the light reflex.
  const nearConstrictionMm = nearMiosisMm(state.accommodativeResponseD);
  const pupilRightMm = clamp(
    (flashingRight || flashingLeft ? targetRightFlash : targetRightRest) -
      nearConstrictionMm * clamp(efferentGainRight, 0, 1),
    PUPIL.CONSTRICTED_MM,
    PUPIL.DARK_MM,
  );
  const pupilLeftMm = clamp(
    (flashingRight || flashingLeft ? targetLeftFlash : targetLeftRest) -
      nearConstrictionMm * clamp(efferentGainLeft, 0, 1),
    PUPIL.CONSTRICTED_MM,
    PUPIL.DARK_MM,
  );

  const anisocoriaMm = Math.abs(targetRightRest - targetLeftRest);

  const rapdPositive = clamp(inputs.leftOpticNerveAfferent, 0, 1) <
    1 - CLINICAL.RAPD_AFFERENT_ASYMMETRY;
  const efferentDefect =
    clamp(inputs.rightPupilEfferentGain, 0, 1) < 0.5 &&
    anisocoriaMm > CLINICAL.ANISOCORIA_SIGNIFICANT_MM;
  const nightBlindness = regime !== 'photopic' && clamp(inputs.rodIntegrity, 0, 1) < 0.4;
  const macularFailure = clamp(inputs.coneIntegrity, 0, 1) < CLINICAL.MACULAR_FAILURE_CONE_INTEGRITY;

  const photopicWeight = coneWeight(effectiveLuminanceLogCd);
  const glarePenalty = 0.15 * state.bleachedFraction + cornealHazePenalty(state.intraocularPressureMmHg);
  const denominator = acuityDenominator(inputs.coneIntegrity, photopicWeight, glarePenalty);

  const fieldMapping = mapFieldLesion(inputs.fieldLesionSite);

  const demandD = demandForDistance(inputs.targetDistanceMetres);
  const responseD = accommodativeResponse(demandD, inputs.maximumAccommodationD);
  const deficitD = accommodationDeficit(demandD, inputs.maximumAccommodationD);
  const blurActive = isBlurActive(deficitD);

  const classificationPattern = {
    regime,
    nightBlindness,
    macularFailure,
    rapdPositive,
    efferentDefect,
    intraocularPressureMmHg: state.intraocularPressureMmHg,
    blurActive,
  };

  return {
    effectiveLuminanceLogCd,
    regime,
    rodResponse,
    coneResponse,
    rodDrive: rodResponse / (rodResponse + coneResponse + 1e-6),
    coneDrive: coneResponse / (rodResponse + coneResponse + 1e-6),
    glutamateRelease,
    perceivedBrightness,
    pupilRightMm,
    pupilLeftMm,
    anisocoriaMm,
    rapdPositive,
    directReflexRightScore,
    directReflexLeftScore,
    acuityDenominator: denominator,
    acuityLabel: acuityLabel(denominator),
    nightBlindness,
    classification: classifyVision(classificationPattern),
    patternSummary: patternSummary({
      ...classificationPattern,
      anisocoriaMm,
      acuityDenominator: denominator,
      angleClosureFraction: state.angleClosureFraction,
      nearPointCm: nearPointCm(inputs.maximumAccommodationD),
      fieldDefectLabel: fieldMapping.label,
    }),

    intraocularPressureMmHg: state.intraocularPressureMmHg,
    angleClosureFraction: state.angleClosureFraction,
    aqueousProductionUlPerMin: productionRate(inputs.aqueousProductionRate, inputs.acetazolamideDosePct),
    outflowFacilityUlPerMinPerMmhg: currentFacility(inputs, state.angleClosureFraction),

    accommodationDemandD: demandD,
    accommodativeResponseD: state.accommodativeResponseD,
    accommodationDeficitD: deficitD,
    blurActive,
    nearPointCm: nearPointCm(inputs.maximumAccommodationD),
    convergenceDemandPrismD: convergenceDemandPrismD(responseD),

    fieldSectors: { rightEye: fieldMapping.rightEye, leftEye: fieldMapping.leftEye },
    fieldDefectLabel: fieldMapping.label,
    fieldLesionSite: inputs.fieldLesionSite,
    maculaSpared: fieldMapping.maculaSpared,

    rodIntegrity: inputs.rodIntegrity,
    coneIntegrity: inputs.coneIntegrity,
    leftOpticNerveAfferent: inputs.leftOpticNerveAfferent,
    rightPupilEfferentGain: inputs.rightPupilEfferentGain,
  };
}

const MYDRIATIC_EFFERENT_BLOCK = 0.75;

/** Corneal oedema at crisis pressures fogs the acuity readout — the eye sees worse because
 * it has swollen, not because the retina failed. */
function cornealHazePenalty(iopMmHg: number): number {
  return clamp((iopMmHg - 35) / 25, 0, 1) * 0.8;
}

/** The facility actually acting on pressure. */
function currentFacility(inputs: VisionInputs, closureFraction: number): number {
  return effectiveFacility({
    trabecularOutflowFacility: inputs.trabecularOutflowFacility,
    angleClosureFraction: closureFraction,
    pilocarpineDosePct: inputs.pilocarpineDosePct,
  });
}

export function tick(
  state: VisionInternalState,
  derived: VisionDerived,
  inputs: VisionInputs,
  dtSeconds: number,
): VisionInternalState {
  const effLog = derived.effectiveLuminanceLogCd;
  // Each class shifts its operating range toward the scene, bounded by its physiological range:
  // rods cannot light-adapt past saturation, cones cannot dark-adapt into starlight.
  const rodTarget = Math.min(effLog, RECEPTOR.ROD_ADAPTATION_CEILING_LOG_CD);
  const coneTarget = Math.max(effLog, RECEPTOR.CONE_ADAPTATION_FLOOR_LOG_CD);

  const flashing = state.flashEye !== 0;
  const sceneDrive = pupilSceneDrive(effLog) * ((1 + clamp(derived.leftOpticNerveAfferent, 0, 1)) / 2);
  const boostRight = torchFlashBoost(sceneDrive, 1, flashing);
  const boostLeft = torchFlashBoost(sceneDrive, clamp(derived.leftOpticNerveAfferent, 0, 1), flashing);
  const flashBoost = Math.max(boostRight, boostLeft);

  const mydriasisBlock = MYDRIATIC_EFFERENT_BLOCK * clamp(inputs.mydriaticDosePct / 100, 0, 1);
  const targetRight =
    pupilTargetMm(sceneDrive, flashBoost, clamp(inputs.rightPupilEfferentGain, 0, 1) * (1 - mydriasisBlock)) -
    nearMiosisMm(state.accommodativeResponseD) * clamp(inputs.rightPupilEfferentGain, 0, 1);
  const targetLeft =
    pupilTargetMm(sceneDrive, flashBoost, 1 - mydriasisBlock) - nearMiosisMm(state.accommodativeResponseD);

  const facilityNow = currentFacility(inputs, state.angleClosureFraction);
  const iopTarget = iopTargetMmHg({
    productionUlPerMin: derived.aqueousProductionUlPerMin,
    effectiveFacilityUlPerMinPerMmhg: facilityNow,
  });
  // Pilocarpine does not merely drain past a closed angle — it pulls the peripheral iris
  // back OUT of it. The relief belongs in the closure's own target.
  const closureTargetFraction =
    closureTarget(inputs.angleWidthPct, inputs.mydriaticDosePct) *
    (1 - AQUEOUS.PILOCARPINE_CLOSURE_RELIEF * clamp(inputs.pilocarpineDosePct / 100, 0, 1));

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    luminanceShiftLog: state.luminanceShiftLog,
    // Rhodopsin regenerates slowly — the second, long phase of dark adaptation.
    bleachedFraction: Math.max(0, state.bleachedFraction - (state.bleachedFraction * dtSeconds) / RECEPTOR.RHODOPSIN_REGENERATION_TAU_SECONDS),
    rodAdaptedLogCd: approach(state.rodAdaptedLogCd, rodTarget, dtSeconds, RECEPTOR.ROD_ADAPTATION_TAU_SECONDS),
    coneAdaptedLogCd: approach(state.coneAdaptedLogCd, coneTarget, dtSeconds, RECEPTOR.CONE_TAU_SECONDS),
    pupilRightMm: clamp(approach(state.pupilRightMm, targetRight, dtSeconds, PUPIL.TAU_SECONDS), PUPIL.CONSTRICTED_MM, PUPIL.DARK_MM),
    pupilLeftMm: clamp(approach(state.pupilLeftMm, targetLeft, dtSeconds, PUPIL.TAU_SECONDS), PUPIL.CONSTRICTED_MM, PUPIL.DARK_MM),
    // The torch persists while held: the state carries it forward until switched off.
    flashEye: state.flashEye,
    intraocularPressureMmHg: approach(state.intraocularPressureMmHg, iopTarget, dtSeconds, AQUEOUS.IOP_TAU_SECONDS),
    angleClosureFraction: approach(
      state.angleClosureFraction,
      closureTargetFraction,
      dtSeconds,
      AQUEOUS.CLOSURE_TAU_SECONDS,
    ),
    accommodativeResponseD: approach(
      state.accommodativeResponseD,
      accommodativeResponse(derived.accommodationDemandD, inputs.maximumAccommodationD),
      dtSeconds,
      ACCOMMODATION.RESPONSE_TAU_SECONDS,
    ),
  };
}

export function step(state: VisionInternalState, inputs: VisionInputs, dtSeconds: number): VisionSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Lights out: a step down in ambient luminance that persists until reversed or reset. */
export function perturbLightsOut(state: VisionInternalState): VisionInternalState {
  return { ...state, luminanceShiftLog: state.luminanceShiftLog - 2.5, flashEye: 0 };
}

/** A camera flash: bleaches rod pigment wholesale. The scene itself does not change — the
 * blindness that follows is the missing sensitivity, not missing light. */
export function perturbBrightGlare(state: VisionInternalState): VisionInternalState {
  return { ...state, bleachedFraction: 1, flashEye: 0 };
}

/** The swinging-torch test, one eye at a time. */
export function perturbShineTorch(state: VisionInternalState, eye: Exclude<FlashEye, 0>): VisionInternalState {
  return { ...state, flashEye: eye };
}

export function perturbTorchOff(state: VisionInternalState): VisionInternalState {
  return { ...state, flashEye: 0 };
}

export { VISION_SIMULATION };

import { ACUITY, PUPIL, PUPIL_DRIVE, RECEPTOR } from './constants';
import { clamp } from '@/shared/lib/math';
import type { VisionState_Classification } from './types';

function scale01(value: number, min: number, max: number): number {
  return clamp((value - min) / (max - min), 0, 1);
}

/** Naka-Rushton intensity-response: output saturates once the scene sits far above the
 * receptor's current half-saturation point. Adaptation works by MOVING that point to track
 * the background — which is why a fixed-exposure camera fails where the eye does not. */
export function nakaRushton(intensityLogCd: number, i50LogCd: number): number {
  const x = Math.pow(10, intensityLogCd - i50LogCd);
  const xn = Math.pow(x, RECEPTOR.EXPONENT_N);
  return xn / (xn + 1);
}

export function regimeOf(luminanceLogCd: number): 'scotopic' | 'mesopic' | 'photopic' {
  if (luminanceLogCd < -3) return 'scotopic';
  if (luminanceLogCd < 1) return 'mesopic';
  return 'photopic';
}

/**
 * The mesopic crossover weights. Rods dominate below moonlight and contribute nothing above
 * about 0 log cd/m2 — not because they stop working but because they SATURATE, which is why
 * no amount of intact retina helps a rod-only eye in daylight. Cones cannot follow the scene
 * into deep darkness, so their weight fades out below moonlight.
 */
export function rodWeight(luminanceLogCd: number): number {
  return 1 - scale01(luminanceLogCd, -3.5, 0);
}

export function coneWeight(luminanceLogCd: number): number {
  return 0.05 + 0.95 * scale01(luminanceLogCd, -4, -2.8);
}

/**
 * Each class's response at the current scene, after adaptation and bleaching. Bleaching
 * multiplies the rod half-saturation point: a flashed eye is temporarily blind to dim scenes
 * not because pigment is missing as signal but because its operating range has been pushed
 * far above the ambient light.
 */
export function retinalResponses(
  luminanceLogCd: number,
  rodAdaptedLogCd: number,
  coneAdaptedLogCd: number,
  bleachedFraction: number,
  rodIntegrity: number,
  coneIntegrity: number,
): { rodResponse: number; coneResponse: number } {
  const rodI50 =
    Math.min(rodAdaptedLogCd, RECEPTOR.ROD_ADAPTATION_CEILING_LOG_CD) +
    bleachedFraction * Math.log10(RECEPTOR.BLEACH_I50_MULTIPLIER);
  const coneI50 = Math.max(coneAdaptedLogCd, RECEPTOR.CONE_ADAPTATION_FLOOR_LOG_CD);
  const rodResponse = nakaRushton(luminanceLogCd, rodI50) * clamp(rodIntegrity, 0, 1) * rodWeight(luminanceLogCd);
  const coneResponse = nakaRushton(luminanceLogCd, coneI50) * clamp(coneIntegrity, 0, 1) * coneWeight(luminanceLogCd);
  return { rodResponse: clamp(rodResponse, 0, 1), coneResponse: clamp(coneResponse, 0, 1) };
}

/** The unadapted photoreceptor response: the membrane still reports absolute intensity even
 * once perception has adapted away from it. This is what glutamate release follows. */
export function absoluteSignal(luminanceLogCd: number, rodIntegrity: number, coneIntegrity: number): number {
  const wRod = rodWeight(luminanceLogCd);
  const wCone = coneWeight(luminanceLogCd);
  const integrity = (wRod * clamp(rodIntegrity, 0, 1) + wCone * clamp(coneIntegrity, 0, 1)) /
    Math.max(wRod + wCone, 1e-6);
  return nakaRushton(luminanceLogCd, RECEPTOR.ABSOLUTE_I50_LOG_CD) * integrity;
}

/** Raw drive to the pupil reflex — near-unadapted, spanning about seven log units. */
export function pupilSceneDrive(luminanceLogCd: number): number {
  return scale01(luminanceLogCd, PUPIL_DRIVE.MIN_LOG_CD, PUPIL_DRIVE.MAX_LOG_CD);
}

/**
 * Pupil diameter for one eye. The afferent signal is shared bilaterally — each pretectal
 * nucleus projects to BOTH Edinger-Westphal nuclei — so direct and consensual reflexes stay
 * equal unless the efferent limb of one side has failed. That asymmetry of failure is exactly
 * how an afferent defect (RAPD: pupils equal, weak constriction from one eye) is told apart
 * from an efferent one (anisocoria with preserved consensual response).
 */
export function pupilTargetMm(brightnessSignal: number, flashBoost: number, efferentGain: number): number {
  const drive = clamp(brightnessSignal + flashBoost, 0, 2);
  // Sigmoid rising with drive: bright scene -> maximal constriction.
  const p = 1 / (1 + Math.exp(-(drive - PUPIL.SIGNAL_MIDPOINT) / PUPIL.SIGNAL_WIDTH));
  return PUPIL.DARK_MM - (PUPIL.DARK_MM - PUPIL.CONSTRICTED_MM) * p * clamp(efferentGain, 0, 1);
}

/** Torch boost delivered when shone in one eye, scaled by that eye's afferent gain: shining
 * it into an optic-neuritis eye constricts BOTH pupils only weakly — the swinging-torch sign. */
export function torchFlashBoost(baseSignal: number, afferentGain: number, flashing: boolean): number {
  if (!flashing) return 0;
  return clamp(afferentGain, 0, 1) * (0.9 + baseSignal * 0.6);
}

/**
 * Snellen acuity. Foveal acuity belongs to cones; under scotopic vision the rod-free fovea
 * is effectively blind and resolution collapses toward the peripheral rod ceiling of roughly
 * 6/60 — which is why you cannot read starlight-lit print no matter how dark-adapted.
 */
export function acuityDenominator(coneIntegrity: number, photopicWeight: number, glarePenalty: number): number {
  const coneScore = clamp(coneIntegrity, 0, 1) * (1 - glarePenalty);
  const blended = photopicWeight * coneScore + (1 - photopicWeight) * ACUITY.ROD_ACUITY_SCORE;
  const denominators = ACUITY.SNELLEN_DENOMINATORS;
  for (const d of denominators) {
    if (blended >= 6 / d - 0.06) return d;
  }
  return denominators[denominators.length - 1] ?? 60;
}

export function acuityLabel(denominator: number): string {
  return `6/${denominator}`;
}

export function classifyVision(pattern: {
  regime: 'scotopic' | 'mesopic' | 'photopic';
  nightBlindness: boolean;
  macularFailure: boolean;
  rapdPositive: boolean;
  efferentDefect: boolean;
}): VisionState_Classification {
  // Efferent and afferent defects outrank the lighting regime: they are present in every light.
  if (pattern.efferentDefect) return 'efferent defect: fixed dilated pupil';
  if (pattern.rapdPositive) return 'left RAPD (afferent defect)';
  if (pattern.nightBlindness) return 'night blindness (rod failure)';
  if (pattern.macularFailure && pattern.regime === 'photopic') return 'macular cone failure';
  return pattern.regime;
}

export function patternSummary(pattern: {
  nightBlindness: boolean;
  macularFailure: boolean;
  rapdPositive: boolean;
  efferentDefect: boolean;
  anisocoriaMm: number;
  regime: string;
  acuityDenominator: number;
}): string {
  if (pattern.efferentDefect)
    return `right pupil ${pattern.anisocoriaMm.toFixed(1)} mm larger with consensual reflex intact — the lesion is outgoing`;
  if (pattern.rapdPositive)
    return 'pupils equal at rest; illumination of the left eye constricts neither well — swinging-torch positive';
  if (pattern.nightBlindness)
    return `rods fail in ${pattern.regime} light while daylight vision is spared`;
  if (pattern.macularFailure)
    return `daylight acuity ${acuityLabel(pattern.acuityDenominator)} with pupils and night vision normal — the fovea is the problem`;
  return `${pattern.regime} operating point, acuity ${acuityLabel(pattern.acuityDenominator)}`;
}

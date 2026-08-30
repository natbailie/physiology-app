import {
  AUDIOGRAM_FREQS_HZ,
  CLINICAL,
  COCHLEA,
  MENIERES,
  NOISE,
  PRESBYCUSIS,
  SPEECH,
  STAPEDIUS,
} from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { HearingInputs, HearingState_Classification } from './types';

function gaussOctaves(distance: number): number {
  return Math.exp(-(distance * distance) / (2 * 0.6 * 0.6));
}

/** Noise-induced damage peaks near 4 kHz — the classic notch — with roughly an octave spread. */
function noiseNotchDb(frequencyHz: number, depthDb: number): number {
  if (depthDb <= 0) return 0;
  const octaves = Math.log2(frequencyHz / NOISE.NOTCH_CENTRE_HZ);
  return depthDb * gaussOctaves(octaves / NOISE.NOTCH_WIDTH_OCTAVES);
}

/** Ménière-type involvement favours the low frequencies first. */
function meniereDb(frequencyHz: number, severityDb: number): number {
  if (severityDb <= 0) return 0;
  const octaves = Math.log2(frequencyHz / MENIERES.LOW_CENTRE_HZ);
  return severityDb * Math.exp(-(octaves * octaves) / (2 * MENIERES.LOW_WIDTH_OCTAVES * MENIERES.LOW_WIDTH_OCTAVES));
}

/** Age-related loss slopes above 1 kHz and spares the lows. */
export function presbycusisDb(frequencyHz: number, severity: number): number {
  if (severity <= 0) return 0;
  const kHz = frequencyHz / 1000;
  const slope = Math.max(0, kHz - 1) * PRESBYCUSIS.DB_PER_KHZ;
  return severity * (slope + PRESBYCUSIS.LOW_FREQ_RESIDUAL_DB);
}

/**
 * Sensorineural threshold at one frequency, dB HL above normal.
 *
 * Outer hair cell failure raises thresholds broadly with high-frequency emphasis; inner hair
 * cell failure costs transmission outright. Temporary threshold shift adds on top, weighted
 * toward the noise-sensitive region.
 */
export function sensorineuralThresholdDb(
  frequencyHz: number,
  inputs: Pick<HearingInputs, 'outerHairCellIntegrity' | 'innerHairCellIntegrity' | 'noiseNotchDepthDb' | 'presbycusisSeverity' | 'meniereLowFreqLossDb'>,
  temporaryShiftDb: number,
): number {
  const ohcDeficit = 1 - clamp(inputs.outerHairCellIntegrity, 0, 1);
  const ihcDeficit = 1 - clamp(inputs.innerHairCellIntegrity, 0, 1);
  const kHz = frequencyHz / 1000;

  const ohcLoss =
    ohcDeficit * COCHLEA.OHC_BROAD_LOSS_DB +
    ohcDeficit * Math.max(0, kHz - 1) * COCHLEA.OHC_HIGHFREQ_EXTRA_DB +
    ohcDeficit * noiseNotchDb(frequencyHz, inputs.noiseNotchDepthDb);
  const ihcLoss = ihcDeficit * COCHLEA.IHC_LOSS_DB;
  const ttsComponent =
    temporaryShiftDb > 0 ? temporaryShiftDb * (0.35 + 0.65 * noiseNotchDb(frequencyHz, 60) / 60) : 0;

  return (
    ohcLoss +
    ihcLoss +
    presbycusisDb(frequencyHz, inputs.presbycusisSeverity) +
    meniereDb(frequencyHz, inputs.meniereLowFreqLossDb) +
    ttsComponent
  );
}

/** Air conduction adds the conductive component; bone skips the middle ear entirely. */
export function airConductionThresholdDb(sensorineuralDb: number, conductiveDb: number): number {
  return sensorineuralDb + conductiveDb;
}

/**
 * Loudness at the stimulus, as a fraction of a comfortable ceiling.
 *
 * The healthy cochlea is compressive: loudness grows slowly once past threshold because outer
 * hair cells give way gracefully. When they are damaged the compression is lost and growth
 * steepens toward linear — recruitment — which is why a cochlear ear is both deaf to whispers
 * and intolerant of shouts while a conductive ear is simply quieter throughout.
 */
export function loudnessFraction(sensationLevelDb: number, ohcDeficitAtStimulus: number): { loudnessPct: number; recruitmentIndex: number } {
  if (sensationLevelDb <= 0) return { loudnessPct: 0, recruitmentIndex: 1 };
  const exponent =
    COCHLEA.NORMAL_LOUDNESS_EXPONENT +
    (COCHLEA.RECRUITED_LOUDNESS_EXPONENT - COCHLEA.NORMAL_LOUDNESS_EXPONENT) * clamp(ohcDeficitAtStimulus, 0, 1);
  const units = Math.pow((sensationLevelDb + 5) / 25, exponent);
  return { loudnessPct: clamp(units * 100, 0, 100), recruitmentIndex: exponent / COCHLEA.NORMAL_LOUDNESS_EXPONENT };
}

/**
 * Speech discrimination: audibility across the conversational band at ordinary effort, then
 * degraded by inner hair cell distortion — amplifying a dead transducer does not restore
 * clarity, which is why discrimination separates cochlear from conductive disease.
 */
export function speechDiscriminationPct(
  inputs: HearingInputs,
  temporaryShiftDb: number,
  airConduction: readonly number[],
): number {
  let coverage = 0;
  for (const band of SPEECH.BAND_FREQS_HZ) {
    const index = nearestFrequencyIndex(band);
    const threshold = airConduction[index] ?? 0;
    coverage += scaleClamped(SPEECH.CONVERSATIONAL_LEVEL_DB_HL, threshold, threshold + SPEECH.DYNAMIC_RANGE_DB, 0, 1);
  }
  coverage /= SPEECH.BAND_FREQS_HZ.length;
  const ihcDeficit = 1 - clamp(inputs.innerHairCellIntegrity, 0, 1);
  const distortion = ihcDeficit * COCHLEA.IHC_DISTORTION_PENALTY_PCT;
  void temporaryShiftDb; // already inside airConduction thresholds
  return clamp(coverage * 100 - distortion, 0, 100);
}

function nearestFrequencyIndex(frequencyHz: number): number {
  let best = 0;
  let bestDistance = Infinity;
  AUDIOGRAM_FREQS_HZ.forEach((f, i) => {
    const d = Math.abs(Math.log2(f / frequencyHz));
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  });
  return best;
}

/** Rinne: negative (bone heard better than air) only when the gap is significant. */
export function rinneResult(conductiveDb: number): string {
  return conductiveDb >= CLINICAL.SIGNIFICANT_GAP_DB
    ? 'negative: bone ≥ air'
    : 'positive: air > bone';
}

/**
 * Weber code: −1 lateralises AWAY from the tested ear (sensorineural), 0 central, +1 TOWARD it
 * (conductive). Lateralisation toward the worse-hearing ear is the counterintuitive signature
 * of conductive loss: the occluded cochlea hears the tuning fork without middle-ear competition.
 */
export function weberCode(ptaAirDb: number, conductiveDb: number): number {
  if (conductiveDb >= CLINICAL.SIGNIFICANT_GAP_DB) return 1;
  if (ptaAirDb - conductiveDb >= CLINICAL.SIGNIFICANT_SNHL_DB) return -1;
  return 0;
}

export function weberResult(code: number): string {
  if (code === 1) return 'lateralises TO tested ear';
  if (code === -1) return 'lateralises away from tested ear';
  return 'central';
}

export function stapediusTarget(stimulusLevelDbHl: number): number {
  return scaleClamped(stimulusLevelDbHl, STAPEDIUS.ONSET_DB_HL, STAPEDIUS.SATURATION_DB_HL, 0, 1);
}

export function classifyHearing(pattern: {
  conductiveDb: number;
  /** Bone-conduction PTA — the cochlea's own threshold. */
  sensorineuralPtaDb: number;
  /** Worst single-frequency bone threshold: catches a 4 kHz notch hiding inside a normal PTA. */
  worstSensorineuralDb: number;
}): HearingState_Classification {
  const hasGap = pattern.conductiveDb >= CLINICAL.SIGNIFICANT_GAP_DB;
  const hasSnhl =
    pattern.sensorineuralPtaDb >= CLINICAL.SIGNIFICANT_SNHL_DB ||
    pattern.worstSensorineuralDb >= 35;
  if (hasGap && hasSnhl) return 'mixed loss';
  if (hasGap) return 'conductive loss';
  if (hasSnhl) return 'sensorineural loss';
  return 'normal hearing';
}

export function patternSummary(pattern: {
  classification: HearingState_Classification;
  ptaDb: number;
  gapDb: number;
  recruitmentIndex: number;
  discriminationPct: number;
  weberCode: number;
}): string {
  switch (pattern.classification) {
    case 'normal hearing':
      return `thresholds within normal limits, discrimination ${pattern.discriminationPct.toFixed(0)}%`;
    case 'conductive loss':
      return `${pattern.gapDb.toFixed(0)} dB gap with bone conduction spared, Weber toward, no recruitment — the fault is before the cochlea`;
    case 'sensorineural loss':
      return `cochlea at fault${pattern.recruitmentIndex > 1.3 ? ', recruitment present' : ''}, Weber away, discrimination ${pattern.discriminationPct < CLINICAL.NORMAL_DISCRIMINATION_PCT ? 'degraded' : 'preserved'}`;
    case 'mixed loss':
      return `${pattern.gapDb.toFixed(0)} dB gap ON top OF sensorineural loss — both components must be read separately`;
  }
}

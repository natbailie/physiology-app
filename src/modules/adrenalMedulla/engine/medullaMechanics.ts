import { BLOCKADE, CATECHOLAMINE, HAEMODYNAMICS, TRIAD, VOLUME } from './constants';
import { clamp } from '@/shared/lib/math';
import type { MedullaState_Classification } from './types';

/**
 * Alpha-mediated pressure. Beta-blockade WITHOUT alpha coverage does not just fail to help —
 * it removes beta2 vasodilatation and leaves alpha vasoconstriction UNOPPOSED, so pressure
 * rises above the untreated tumour. This is the classic prescribing disaster.
 */
export function mapFromCatecholamines(
  plasmaNa: number,
  plasmaAd: number,
  alphaBlockPct: number,
  betaBlockPct: number,
): number {
  const alphaOpen = 1 - clamp(alphaBlockPct / 100, 0, 1);
  // Only the EXCESS over basal tone raises pressure — resting sympathetic output is already
  // priced into the baseline MAP.
  const naAlpha = Math.max(0, plasmaNa - CATECHOLAMINE.BASELINE_NA) * HAEMODYNAMICS.NA_ALPHA_GAIN_PER_UNIT * alphaOpen;
  const adAlpha = Math.max(0, plasmaAd - CATECHOLAMINE.BASELINE_AD) * HAEMODYNAMICS.AD_ALPHA_GAIN_PER_UNIT * alphaOpen;
  const unopposedMultiplier =
    clamp(betaBlockPct / 100, 0, 1) > 0.4 && alphaOpen > 0.6 ? BLOCKADE.BETA_UNOPPOSED_ALPHA_MULTIPLIER : 1;
  return HAEMODYNAMICS.BASE_MAP_MMHG + (naAlpha + adAlpha) * unopposedMultiplier;
}

export function heartRateFromCatecholamines(
  plasmaNa: number,
  plasmaAd: number,
  mapMmHg: number,
  betaBlockPct: number,
): number {
  const betaOpen = 1 - clamp(betaBlockPct / 100, 0, 1);
  const direct = (Math.max(0, plasmaAd - CATECHOLAMINE.BASELINE_AD) * HAEMODYNAMICS.AD_BETA_CHRONOTROPIC_PER_UNIT + Math.max(0, plasmaNa - CATECHOLAMINE.BASELINE_NA) * HAEMODYNAMICS.NA_BETA_CHRONOTROPIC_PER_UNIT) * betaOpen;
  // Baroreflex: a high MAP slows the sinus node — unless beta receptors are blocked too.
  const reflex = Math.max(0, mapMmHg - HAEMODYNAMICS.BASE_MAP_MMHG) * HAEMODYNAMICS.REFLEX_BRADY_PER_MAP_POINT * betaOpen;
  return clamp(HAEMODYNAMICS.BASE_HR_BPM + direct - reflex, 35, 220);
}

export function orthostaticDrop(bloodVolumePct: number): number {
  return clamp((100 - bloodVolumePct) / 100, 0, 1) * VOLUME.ORTHOSTATIC_DROP_PER_VOLUME_LOSS_MMHG;
}

export function arrhythmiaRisk(plasmaAd: number, heartRateBpm: number, betaBlockPct: number, alphaBlockPct: number): number {
  const adrenergic = clamp(plasmaAd / 120, 0, 1);
  const rateComponent = clamp((heartRateBpm - 90) / 90, 0, 1);
  // Beta-blockade without alpha cover raises risk; proper sequential blockade lowers it.
  const protection = clamp((alphaBlockPct / 100) * (betaBlockPct / 100), 0, 1);
  const danger = clamp((betaBlockPct / 100) * (1 - alphaBlockPct / 100), 0, 1) * BLOCKADE.ARRHYTHMIA_RISK_PER_BETA_BLOCKED_UNIT;
  return clamp((adrenergic * 0.5 + rateComponent * 0.5) * (0.6 + danger) * (1 - protection) * 100, 0, 100);
}

export function triadCount(mapMmHg: number, plasmaAd: number, heartRateBpm: number): {
  headache: boolean;
  sweating: boolean;
  palpitations: boolean;
  count: number;
} {
  const headache = mapMmHg >= TRIAD.HEADACHE_MAP_THRESHOLD;
  const sweating = plasmaAd >= TRIAD.SWEATING_AD_THRESHOLD;
  const palpitations = heartRateBpm >= TRIAD.PALPITATION_HR_THRESHOLD;
  return { headache, sweating, palpitations, count: Number(headache) + Number(sweating) + Number(palpitations) };
}

export function classifyMedulla(pattern: {
  tumourSecretionRate: number;
  naFractionPct: number;
  mapMmHg: number;
  paroxysmActive: boolean;
  alphaBlockPct: number;
  betaBlockPct: number;
}): MedullaState_Classification {
  if (pattern.tumourSecretionRate < 10) return 'normal sympathetic tone';
  if (pattern.betaBlockPct > 40 && pattern.alphaBlockPct < 25 && pattern.mapMmHg > 165)
    return 'unopposed-alpha crisis: beta given first';
  if (pattern.mapMmHg > 175 || (pattern.paroxysmActive && pattern.mapMmHg > 160))
    return 'adrenergic crisis (uncontrolled)';
  if (pattern.alphaBlockPct >= 55 && pattern.mapMmHg < 125) return 'phaeochromocytoma adequately blocked';
  if (pattern.naFractionPct >= 60) return 'noradrenaline-predominant phaeochromocytoma';
  return 'adrenaline-predominant phaeochromocytoma';
}

export function patternSummary(pattern: {
  classification: MedullaState_Classification;
  mapMmHg: number;
  heartRateBpm: number;
  orthostaticDropMmHg: number;
  naFractionPct: number;
  triadCount: number;
}): string {
  switch (pattern.classification) {
    case 'normal sympathetic tone':
      return 'catecholamines basal, pressure and pulse ordinary, volume replete';
    case 'noradrenaline-predominant phaeochromocytoma':
      return `sustained MAP ${pattern.mapMmHg.toFixed(0)} with pallor and headache; orthostatic drop ${pattern.orthostaticDropMmHg.toFixed(0)} mmHg from contracted volume`;
    case 'adrenaline-predominant phaeochromocytoma':
      return `paroxysmal palpitations and anxiety (HR ${pattern.heartRateBpm.toFixed(0)}) over a less sustained pressure — the β-heavy secretion`;
    case 'adrenergic crisis (uncontrolled)':
      return `MAP ${pattern.mapMmHg.toFixed(0)} with ${pattern.triadCount}/3 of the triad — treat before anything else is done`;
    case 'unopposed-alpha crisis: beta given first':
      return `beta-blockade removed β2 vasodilatation: MAP ${pattern.mapMmHg.toFixed(0)} worse than untreated — always block alpha first`;
    case 'phaeochromocytoma adequately blocked':
      return `pressure controlled (${pattern.mapMmHg.toFixed(0)}) on sequential alpha-then-beta blockade — safe for surgery`;
  }
}

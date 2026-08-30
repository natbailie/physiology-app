import { BROMOCRIPTINE, GH_AXIS, GONADAL, MASS, PROLACTIN_AXIS, SOMATIC } from './constants';
import { clamp } from '@/shared/lib/math';
import type { PituitaryState_Classification } from './types';

/**
 * Effective dopamine braking the lactotroph: hypothalamic tone reduced by stalk compression
 * (ANY sellar mass — the stalk effect) and by receptor antagonism (antipsychotics), partially
 * restored by agonists (bromocriptine).
 */
export function effectiveDopamineFraction(
  dopamineTonePct: number,
  d2BlockPct: number,
  bromocriptineEffectPct: number,
  stalkCompressionFraction: number,
): number {
  const tone = clamp(dopamineTonePct / 100, 0, 1);
  const netBlock = clamp(d2BlockPct / 100 - (bromocriptineEffectPct / 100) * BROMOCRIPTINE.DOSE_EFFECT_PCT / 55, 0, 1);
  const stalk = clamp(stalkCompressionFraction, 0, MASS.MAX_STALK_COMPRESSION_FRACTION);
  return clamp(tone * (1 - netBlock) * (1 - stalk), 0.03, 1.2);
}

/** The dopamine brake is logarithmic: proportional loss of inhibition reads as a
 * logarithmic climb across exactly the clinical ranges that matter. */
export function prolactinFromBrake(effectiveDopamine: number): number {
  return PROLACTIN_AXIS.BASE_PROLACTIN_NG_ML + PROLACTIN_AXIS.LN_GAIN * Math.log(1 / clamp(effectiveDopamine, 0.03, 1));
}

export function stalkCompressionFraction(totalMassCc: number): number {
  return clamp(totalMassCc * MASS.STALK_COMPRESSION_PER_CC, 0, MASS.MAX_STALK_COMPRESSION_FRACTION);
}

export function visualFieldDefectPct(totalMassCc: number): number {
  const beyond = totalMassCc - MASS.FIELD_DEFECT_ONSET_CC;
  if (beyond <= 0) return 0;
  return clamp((beyond / (MASS.FIELD_DEFECT_FULL_CC - MASS.FIELD_DEFECT_ONSET_CC)) * 100, 0, 100);
}

export function gonadalSuppressionPct(prolactinNgMl: number): number {
  return clamp(
    ((prolactinNgMl - GONADAL.SUPPRESSION_ONSET_PROLACTIN_NG_ML) /
      (GONADAL.SUPPRESSION_FULL_PROLACTIN_NG_ML - GONADAL.SUPPRESSION_ONSET_PROLACTIN_NG_ML)) *
      100,
    0,
    100,
  );
}

export function heightVelocityCmPerYear(igf1NgMl: number, epiphysesOpen: boolean): number {
  if (!epiphysesOpen) return 0;
  const excess = clamp((igf1NgMl - 200) / 250, -1, 2);
  return SOMATIC.HEIGHT_VELOCITY_NORMAL_CM_PER_YEAR + SOMATIC.HEIGHT_VELOCITY_CM_PER_YEAR_AT_EXCESS * clamp(excess, -0.6, 1.6) / 1.6;
}

export function classifyPituitary(pattern: {
  ghNgMl: number;
  igf1NgMl: number;
  prolactinNgMl: number;
  ghAdenomaSecretion: number;
  prolactinomaSecretion: number;
  nonfunctioningMass: number;
  d2BlockPct: number;
  trhStimulusUnits: number;
  epiphysesOpen: number;
}): PituitaryState_Classification {
  // Secretory syndromes outrank mass effect; the mass label only stands alone when silent.
  if (pattern.ghAdenomaSecretion >= 25 && pattern.epiphysesOpen >= 0.5)
    return 'gigantism: GH excess, open epiphyses';
  if (pattern.ghAdenomaSecretion >= 25 || pattern.igf1NgMl >= GH_AXIS.IGF1_ACROMEGALY_THRESHOLD)
    return 'acromegaly (GH adenoma)';
  if (pattern.prolactinomaSecretion >= 30 && pattern.prolactinNgMl >= PROLACTIN_AXIS.MACROADENOMA_LIKELY_NG_ML)
    return 'macroprolactinoma';
  if (pattern.prolactinomaSecretion > 3) return 'microprolactinoma';
  if (pattern.d2BlockPct >= 60) return 'drug-induced hyperprolactinaemia';
  if (pattern.trhStimulusUnits >= 45 && pattern.nonfunctioningMass < 40)
    return 'TRH-driven hyperprolactinaemia (hypothyroid)';
  if (pattern.nonfunctioningMass >= 35) return 'non-functioning macroadenoma';
  if (pattern.prolactinNgMl > PROLACTIN_AXIS.UPPER_LIMIT_NG_ML) return 'stalk-effect hyperprolactinaemia';
  return 'normal anterior pituitary';
}

export function patternSummary(pattern: {
  classification: PituitaryState_Classification;
  ghNgMl: number;
  igf1NgMl: number;
  prolactinNgMl: number;
  visualFieldDefectPct: number;
  gonadalSuppressionPct: number;
}): string {
  switch (pattern.classification) {
    case 'normal anterior pituitary':
      return `GH ${pattern.ghNgMl.toFixed(1)} suppressible with glucose · prolactin ${pattern.prolactinNgMl.toFixed(0)} under dopamine brake`;
    case 'acromegaly (GH adenoma)':
      return `GH ${pattern.ghNgMl.toFixed(1)} autonomous and IGF-1 ${pattern.igf1NgMl.toFixed(0)} — acral growth, sweating, glucose that fails to suppress`;
    case 'gigantism: GH excess, open epiphyses':
      return `same adenoma before fusion: linear growth ${pattern.igf1NgMl.toFixed(0)}-driven instead of acral`;
    case 'microprolactinoma':
      return `prolactin ${pattern.prolactinNgMl.toFixed(0)} with suppressed gonadotrophins (${pattern.gonadalSuppressionPct.toFixed(0)}%) and no chiasmal threat`;
    case 'macroprolactinoma':
      return `prolactin ${pattern.prolactinNgMl.toFixed(0)}, field deficit ${pattern.visualFieldDefectPct.toFixed(0)}% — bromocriptine shrinks it`;
    case 'drug-induced hyperprolactinaemia':
      return 'D2 blockade removes the brake with NO mass on imaging — check the drug list first';
    case 'stalk-effect hyperprolactinaemia':
      return 'any sellar mass cutting dopamine delivery lifts prolactin moderately — never to prolactinoma levels';
    case 'TRH-driven hyperprolactinaemia (hypothyroid)':
      return 'TRH is a prolactin secretagogue: treat the thyroid and the prolactin follows down';
    case 'non-functioning macroadenoma':
      return `mass effect first — fields ${pattern.visualFieldDefectPct.toFixed(0)}%, mild stalk-rise of prolactin, hormones otherwise spared`;
  }
}

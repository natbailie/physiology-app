import { STEROID } from './constants';
import { clamp } from '@/shared/lib/math';
import type { AdrenalCortexInputs, AdrenalCortexState_Classification } from './types';

export function efficiency(blockPct: number): number {
  return clamp(1 - blockPct / 100, 0, 1);
}

/**
 * ACTH effective drive: the input amplified by cortisol deficit (the failed gland is flogged
 * harder, which is WHY precursors accumulate) and suppressed by adequate replacement.
 */
export function acthEffective(
  acthDrivePct: number,
  endogenousCortisol: number,
  replacementTherapyPct: number,
): number {
  const deficit = clamp(1 - endogenousCortisol / 100, 0, 1);
  return (
    clamp(acthDrivePct, 0, 200) *
    (1 + STEROID.FEEDBACK_GAIN * deficit) *
    (1 - (replacementTherapyPct / 100) * STEROID.REPLACEMENT_ACTH_SUPPRESSION)
  );
}

/** Flux model of the steroidogenic pathway. All outputs in relative units, 100 = normal. */
export function steroidFlux(inputs: AdrenalCortexInputs): {
  endogenousCortisol: number;
  aldosterone: number;
  androgens: number;
  docExcess: number;
  marker17ohp: number;
} {
  const e3 = efficiency(inputs.block3bhsdPct);
  const e17 = efficiency(inputs.block17Pct);
  const e21 = efficiency(inputs.block21Pct);
  const e11 = efficiency(inputs.block11Pct);

  // Cortisol needs the whole chain: 3β-HSD → 17α → 21 → 11β.
  const endogenousCortisol = 100 * e3 * e17 * e21 * e11;
  // Aldosterone skips the 17α step entirely — which is why a 17α block spares the ENZYME,
  // though renin suppression later lowers it clinically.
  const aldosterone = 100 * e3 * e21 * e11 * (1 - 0.7 * (inputs.block17Pct / 100));

  // Androgens need 3β-HSD and 17α; blocks at 21 or 11 DIVERT flux toward them.
  const diversion =
    1 +
    STEROID.ANDROGEN_DIVERSION_21 * (inputs.block21Pct / 100) * e3 * e17 +
    STEROID.ANDROGEN_DIVERSION_11 * (inputs.block11Pct / 100) * e3 * e17;
  const androgens = clamp(100 * Math.pow(e3, 1.2) * e17 * diversion, 0, 400);

  // DOC accumulates two ways: 11β blocked below it, or 17α blocked ABOVE it flooding the
  // mineralocorticoid arm faster than aldosterone synthase can cope.
  const docExcess =
    100 *
    e3 *
    ((1 - inputs.block17Pct / 100) * e21 * (inputs.block11Pct / 100) * 2.4 +
      (inputs.block17Pct / 100) * e21 * 0.95);

  // 17-OHP is the diagnostic analyte of 21-hydroxylase deficiency: made, never converted.
  const marker17ohp = 100 * e3 * e17 * (inputs.block21Pct / 100) * 2.8;

  return { endogenousCortisol, aldosterone, androgens, docExcess, marker17ohp };
}

export function mineralocorticoidActivity(aldosterone: number, docExcess: number): number {
  return aldosterone + docExcess * STEROID.DOC_MC_ACTIVITY_FRACTION * 10;
}

export function saltWasting(mcActivity: number, replacementPct: number): boolean {
  return mcActivity < STEROID.MC_SALT_WASTING_THRESHOLD && replacementPct < 70;
}

export function hypertensionFromDoc(docExcess: number): boolean {
  return docExcess > 60 && docExcess * STEROID.DOC_MC_ACTIVITY_FRACTION * 10 > STEROID.MC_HYPERTENSION_ONSET - 100 + 55;
}

export function addisonianCrisisRisk(effectiveCortisol: number, replacementPct: number): number {
  if (effectiveCortisol >= STEROID.CRISIS_CORTISOL_THRESHOLD || replacementPct >= 70) return clamp(20 - replacementPct / 5, 0, 20);
  return clamp(((STEROID.CRISIS_CORTISOL_THRESHOLD - effectiveCortisol) / STEROID.CRISIS_CORTISOL_THRESHOLD) * 100, 0, 100);
}

export function classifyAdrenalCortex(pattern: {
  block21Pct: number;
  block11Pct: number;
  block17Pct: number;
  block3bhsdPct: number;
  replacementTherapyPct: number;
  mcActivity: number;
}): AdrenalCortexState_Classification {
  const anyBlock =
    pattern.block21Pct >= 25 || pattern.block11Pct >= 40 || pattern.block17Pct >= 40 || pattern.block3bhsdPct >= 40;
  if (!anyBlock) return 'normal steroidogenesis';
  if (pattern.replacementTherapyPct >= 70) return 'CAH on adequate replacement';
  if (pattern.block17Pct >= 40) return '17α-hydroxylase deficiency';
  if (pattern.block3bhsdPct >= 40) return '3β-HSD deficiency';
  if (pattern.block11Pct >= 40) return '11β-hydroxylase deficiency';
  if (pattern.mcActivity < STEROID.MC_SALT_WASTING_THRESHOLD) return '21-hydroxylase deficiency: salt-wasting';
  return '21-hydroxylase deficiency: simple virilising';
}

export function patternSummary(pattern: {
  classification: AdrenalCortexState_Classification;
  cortisol: number;
  androgens: number;
  marker17ohp: number;
  mcActivity: number;
  docExcess: number;
}): string {
  switch (pattern.classification) {
    case 'normal steroidogenesis':
      return `cortisol ${pattern.cortisol.toFixed(0)}, aldosterone ${pattern.mcActivity.toFixed(0)}, androgens ${pattern.androgens.toFixed(0)} — flux balanced`;
    case '21-hydroxylase deficiency: salt-wasting':
      return `cortisol and aldosterone lost while androgens soar (${pattern.androgens.toFixed(0)}) with 17-OHP ${pattern.marker17ohp.toFixed(0)} — crisis plus virilisation`;
    case '21-hydroxylase deficiency: simple virilising':
      return `enough residual enzyme to avoid salt loss, not enough to stop androgen excess (${pattern.androgens.toFixed(0)})`;
    case '11β-hydroxylase deficiency':
      return `DOC piles up (${pattern.docExcess.toFixed(0)}) driving hypertension while androgens rise — salt-wasting absent`;
    case '17α-hydroxylase deficiency':
      return `androgens absent (${pattern.androgens.toFixed(0)}) with DOC-driven hypertension — the opposite sexual phenotype to 21-OH`;
    case '3β-HSD deficiency':
      return `everything downstream falls including androgens (${pattern.androgens.toFixed(0)}) — salt-wasting with under-virilisation, 17-OHP low`;
    case 'CAH on adequate replacement':
      return 'replacement covers the deficits — the biochemistry is managed even though the blocks remain';
  }
}

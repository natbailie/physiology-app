import { clamp } from '@/shared/lib/math';

export interface CoxInputs {
  /** Nonselective NSAID dose, % of standard (0-200). Blocks both COX-1 and COX-2. */
  nonselectiveDose: number;
  /** COX-2-selective inhibitor dose, % of standard (0-200). Spars gastric COX-1, preserving
   * mucosal protection, at the cost of leaving renal/CV consequences in play. */
  cox2Dose: number;
  /** Inflammatory drive (0-100). The disease being treated — how much prostaglandin the tissue
   * would make if uninhibited, which is what sets fever/pain and how much the drug must overcome. */
  inflammatoryDrive: number;
}

export interface CoxResult {
  /** COX-1-mediated prostaglandin output, % of the gastric-protective baseline (100 = intact). */
  cox1Output: number;
  /** COX-2-mediated inflammatory prostaglandin output over the drive, 0..100, lower is a better
   * anti-inflammatory effect. */
  cox2Output: number;
  /** Composite gastric protection score, 0..100 (higher = protected). Falls when COX-1 output
   * falls — the ulcer-risk face of the same inhibition that treats the inflammation. */
  gastricProtection: number;
  /** Net therapeutic benefit of the anti-inflammatory effect, 0..100 (higher = more pain/fever
   * controlled), so the learner sees benefit and risk move in opposite directions. */
  antiInflammatory: number;
}

const COX = {
  // How far a full nonselective dose suppresses its target isoform.
  NONSELECTIVE_MAX: 0.9,
  // COX-2-selective drugs pin COX-2 but leave COX-1 (gastric protection) largely intact.
  COX2_SELECTIVE_MAX: 0.95,
  COX2_COX1_SPILL: 0.15,
  // COX-1 gastric protection scales with live COX-1 output, in the "protected" direction.
  PROTECTION_GAIN: 1.0,
};

/**
 * The NSAID's paradox is that the very reaction it treats is also the one that defends the
 * stomach. Prostaglandins are made by two cyclooxygenases: COX-1 constitutively guards the
 * gastric mucosa (and the kidney), COX-2 is induced by inflammation to drive fever and pain.
 * A nonselective NSAID blinds both, so as the fever comes down the gastric mucosal barrier
 * comes down with it — that is the ulcer. A COX-2-selective drug buys selectivity at the price
 * of the renal and cardiovascular protection COX-1 still provides, which is why "safer on the
 * stomach" is not the same as "safer".
 */
export function computeCoxInhibition({ nonselectiveDose, cox2Dose, inflammatoryDrive }: CoxInputs): CoxResult {
  const ns = clamp(nonselectiveDose / 100, 0, 1) * COX.NONSELECTIVE_MAX;
  // Selective drug suppresses COX-2 deeply, with only a small spill onto COX-1.
  const c2 = clamp(cox2Dose / 100, 0, 1) * COX.COX2_SELECTIVE_MAX;
  const c2Spill = clamp(cox2Dose / 100, 0, 1) * COX.COX2_COX1_SPILL;

  const cox1Inhibition = clamp(ns + c2Spill, 0, 1);
  const cox2Inhibition = clamp(ns + c2, 0, 1);

  const cox1Output = (1 - cox1Inhibition) * 100;
  const drive = clamp(inflammatoryDrive, 0, 100);
  const cox2Output = (1 - cox2Inhibition) * drive;

  const gastricProtection = clamp(cox1Output * COX.PROTECTION_GAIN, 0, 100);
  const antiInflammatory = clamp(100 - cox2Output, 0, 100);

  return { cox1Output, cox2Output, gastricProtection, antiInflammatory };
}

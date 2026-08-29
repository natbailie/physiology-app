import { clamp } from '@/shared/lib/math';

export interface StatinInputs {
  /** Statin dose, % of a standard therapeutic dose (0-200). Inhibits HMG-CoA reductase — the
   * rate-limiting enzyme of cholesterol synthesis — competitively with the endogenous substrate. */
  statinDose: number;
  /** CETP-inhibitor dose, % of standard (0-200). The optional add-on that pushes LDL down further
   * than a statin alone ever can, by slowing the exchange that would repackage the LDL precursor. */
  cetpDose: number;
  /** Baseline (untreated) plasma LDL, mmol/L (1-6). The patient's starting point — a high baseline
   * is exactly who gains most from a statin. */
  baselineLDL: number;
}

export interface StatinResult {
  /** Fraction of the enzyme's cholesterol-synthesis output remaining, 0..1 — falls with dose and
   * saturates, the Michaelis-Menten shape of competitive inhibition. */
  synthesisFraction: number;
  /** Final plasma LDL, mmol/L. The reduction saturates, so LDL falls briskly then flatlines toward
   * a real-world floor — never to zero, which is why residual risk needs a different lever. */
  plasmaLDL: number;
  /** The CETP-inhibitor add-on's extra LDL reduction, as a 0..1 multiplier on what remains. */
  cetpAugmenter: number;
}

const HMG = {
  // Statin dose (%, competitive with mevalonate) that gives half of the maximum LDL reduction.
  IC50_PERCENT: 60,
  // The largest LDL reduction a statin can achieve on its own — ~40%, so most of the drop lands
  // in the first therapeutic step and doubling the dose buys a little, not a lot.
  MAX_REDUCTION: 0.42,
  // Hard floor so plasma LDL never reads as "zero" — physiologically LDL is never abolished.
  LDL_FLOOR: 0.6,
  // Extra LDL cut from the CETP inhibitor, applied to what the statin leaves behind.
  CETP_MULTIPLIER_PER_DOSE: 0.55,
};

/**
 * The statin's mechanism is one of the cleanest "why the drug works" stories in medicine, and a
 * favourite for the "why do you still need more" question. HMG-CoA reductase makes cholesterol;
 * inhibit it and hepatocytes, short of the product, up-regulate their LDL receptors and pull
 * more LDL out of plasma. But the enzyme chase is competitive and clinically the response
 * saturates, so a double dose does not halve LDL — it inched down toward a floor that never
 * reaches zero. That saturation is the payoff: it is why "give a bigger statin" is the wrong
 * answer to residual risk after a big statin, and the right answer is a different lever (a CETP
 * or PCSK9 inhibitor).
 */
export function computeStatinEffect({ statinDose, cetpDose, baselineLDL }: StatinInputs): StatinResult {
  const dose = clamp(statinDose, 0, 200);
  // Competitive inhibition of synthesis — Michaelis-Menten/saturating shape.
  const inhibition = (dose * HMG.MAX_REDUCTION) / (HMG.IC50_PERCENT + dose);
  const synthesisFraction = clamp(1 - inhibition, 0, 1);

  const afterStatin = clamp(clamp(baselineLDL, 1, 6) * (1 - inhibition), HMG.LDL_FLOOR, 6);

  // CETP inhibitor multiplies down whatever the statin leaves behind.
  const cetpMult = clamp(cetpDose / 100, 0, 1) * HMG.CETP_MULTIPLIER_PER_DOSE;
  const plasmaLDL = clamp(afterStatin * (1 - cetpMult), HMG.LDL_FLOOR, 6);

  return { synthesisFraction, plasmaLDL, cetpAugmenter: cetpMult };
}

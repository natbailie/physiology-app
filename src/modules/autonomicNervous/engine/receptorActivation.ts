import { RECEPTORS } from './constants';
import { clamp } from '@/shared/lib/math';

/** Fraction of receptors still available after competitive blockade. */
function unblocked(blockadePercent: number): number {
  return clamp(1 - blockadePercent / 100, 0, 1);
}

export interface ReceptorActivations {
  alpha1: number;
  beta1: number;
  beta2: number;
  muscarinic: number;
}

/**
 * Effective activation at each receptor class (0..1), combining neural outflow, circulating
 * epinephrine, and any pharmacological blockade.
 *
 * The neural-vs-hormonal split matters: sympathetic NERVES drive alpha-1 and beta-1 strongly
 * but reach beta-2 weakly, while circulating epinephrine is a potent beta-2 agonist. Blockade
 * acts at the receptor, so it removes both neural and hormonal drive at that receptor
 * regardless of where the agonist came from.
 *
 * Cholinesterase inhibition amplifies existing parasympathetic outflow rather than generating
 * it — an organophosphate on a fully vagotomized synapse would have nothing to amplify.
 */
export function receptorActivations(
  sympatheticTone: number,
  parasympatheticTone: number,
  circulatingEpinephrine: number,
  alphaBlockade: number,
  betaBlockade: number,
  muscarinicBlockade: number,
  cholinesteraseInhibition: number,
): ReceptorActivations {
  const sympathetic = clamp(sympatheticTone / 100, 0, 1);
  const epinephrine = clamp(circulatingEpinephrine / 100, 0, 1);

  const cholinergicAmplification = 1 + (clamp(cholinesteraseInhibition / 100, 0, 1) * RECEPTORS.CHOLINESTERASE_AMPLIFICATION);
  const parasympathetic = clamp((parasympatheticTone / 100) * cholinergicAmplification, 0, 1);

  return {
    alpha1: clamp(
      (sympathetic * RECEPTORS.SYMPATHETIC_ALPHA1_GAIN + epinephrine * RECEPTORS.EPINEPHRINE_ALPHA1_GAIN) * unblocked(alphaBlockade),
      0,
      1,
    ),
    beta1: clamp(
      (sympathetic * RECEPTORS.SYMPATHETIC_BETA1_GAIN + epinephrine * RECEPTORS.EPINEPHRINE_BETA1_GAIN) * unblocked(betaBlockade),
      0,
      1,
    ),
    beta2: clamp(
      (sympathetic * RECEPTORS.SYMPATHETIC_BETA2_GAIN + epinephrine * RECEPTORS.EPINEPHRINE_BETA2_GAIN) * unblocked(betaBlockade),
      0,
      1,
    ),
    muscarinic: clamp(parasympathetic * unblocked(muscarinicBlockade), 0, 1),
  };
}

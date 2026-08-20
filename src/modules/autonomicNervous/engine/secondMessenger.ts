import { SECOND_MESSENGER } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ReceptorActivations } from './receptorActivation';

/**
 * Target cAMP level (0..1). Both beta-1 and beta-2 are Gs-coupled, so they converge on
 * adenylyl cyclase and raise cAMP — which is why one intracellular signal can produce
 * effects as different as cardiac stimulation and bronchial relaxation. The receptor decides
 * which tissue listens; the second messenger is shared.
 */
export function campTarget(receptors: ReceptorActivations): number {
  return clamp(receptors.beta1 * SECOND_MESSENGER.CAMP_BETA1_GAIN + receptors.beta2 * SECOND_MESSENGER.CAMP_BETA2_GAIN, 0, 1);
}

/**
 * Target IP3/Ca2+ level (0..1). Alpha-1 and the M1/M3 muscarinic receptors are both
 * Gq-coupled, so sympathetic and parasympathetic signaling can converge on the SAME second
 * messenger in different tissues — a reminder that "sympathetic vs parasympathetic" is not
 * the same distinction as "which intracellular cascade".
 */
export function ip3CalciumTarget(receptors: ReceptorActivations): number {
  return clamp(receptors.alpha1 * SECOND_MESSENGER.IP3_ALPHA1_GAIN + receptors.muscarinic * SECOND_MESSENGER.IP3_MUSCARINIC_GAIN, 0, 1);
}

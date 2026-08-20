import { BRONCHI, GI, HEART, PUPIL, SECRETION } from './constants';
import { clamp } from '@/shared/lib/math';
import type { ReceptorActivations } from './receptorActivation';

/**
 * Heart rate: beta-1 stimulation accelerates, muscarinic (vagal) slows. At rest vagal tone
 * dominates the intrinsic pacemaker rate of ~100 bpm, which is why blocking muscarinic
 * receptors with atropine drives heart rate UP toward that intrinsic rate rather than
 * producing no effect.
 */
export function heartRateBpm(receptors: ReceptorActivations): number {
  const rate = HEART.INTRINSIC_RATE_BPM + receptors.beta1 * HEART.BETA1_GAIN_BPM - receptors.muscarinic * HEART.MUSCARINIC_GAIN_BPM;
  return clamp(rate, HEART.MIN_BPM, HEART.MAX_BPM);
}

/** Pupil diameter: alpha-1 contracts the radial dilator muscle (mydriasis), muscarinic
 * contracts the circular sphincter (miosis). Two different muscles, not one muscle pushed
 * both ways. */
export function pupilDiameterMm(receptors: ReceptorActivations): number {
  const diameter =
    PUPIL.BASELINE_MM + receptors.alpha1 * PUPIL.ALPHA1_DILATION_MM - receptors.muscarinic * PUPIL.MUSCARINIC_CONSTRICTION_MM;
  return clamp(diameter, PUPIL.MIN_MM, PUPIL.MAX_MM);
}

/**
 * GI motility: THE DIRECTION IS REVERSED relative to the heart. Sympathetic activity inhibits
 * gut motility while muscarinic activity stimulates it — "rest and digest" versus "fight or
 * flight". The same two transmitters, acting through the same receptor families, produce
 * opposite signs in different organs; that is why autonomic effects have to be learned per
 * organ rather than as a single global "sympathetic = more" rule.
 */
export function giMotilityIndex(receptors: ReceptorActivations): number {
  const sympatheticDrive = Math.max(receptors.alpha1, receptors.beta2);
  const motility = GI.BASELINE_INDEX - sympatheticDrive * GI.SYMPATHETIC_INHIBITION + receptors.muscarinic * GI.MUSCARINIC_STIMULATION;
  return clamp(motility, GI.MIN_INDEX, GI.MAX_INDEX);
}

/** Bronchial calibre: beta-2 relaxes the smooth muscle (salbutamol), muscarinic M3 constricts
 * it (organophosphate bronchospasm; ipratropium blocks this). */
export function bronchialDiameterPercent(receptors: ReceptorActivations): number {
  const diameter =
    BRONCHI.BASELINE_PERCENT +
    receptors.beta2 * BRONCHI.BETA2_DILATION_PERCENT -
    receptors.muscarinic * BRONCHI.MUSCARINIC_CONSTRICTION_PERCENT;
  return clamp(diameter, BRONCHI.MIN_PERCENT, BRONCHI.MAX_PERCENT);
}

/** Glandular secretion (salivary, lacrimal, bronchial, GI): overwhelmingly muscarinic. This
 * is the axis behind both the dry mouth of anticholinergics and the SLUDGE picture of
 * cholinergic excess. */
export function secretionIndex(receptors: ReceptorActivations): number {
  const secretion =
    SECRETION.BASELINE_INDEX + receptors.muscarinic * SECRETION.MUSCARINIC_GAIN + receptors.alpha1 * SECRETION.SYMPATHETIC_GAIN;
  return clamp(secretion, SECRETION.MIN_INDEX, SECRETION.MAX_INDEX);
}

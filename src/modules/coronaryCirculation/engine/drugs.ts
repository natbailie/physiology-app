import { DRUGS } from './constants';
import { clamp } from '@/shared/lib/math';

/** What the pharmacology does to the haemodynamic inputs before any physiology sees them.
 *
 * Nitrates are venodilators first: preload falls, and with it Laplace wall stress. They also
 * relax the epicardial segment — tone and spasm — which is why they work in vasospastic angina
 * where the lesion is dynamic rather than fixed. The price is a lower diastolic head, which is
 * why a patient can feel faint standing quickly after a spray.
 *
 * Beta-blockade removes sympathetic drive: slower rate (less demand AND a longer diastolic
 * window) and blunted contractility (less demand again). */
export interface EffectiveHaemodynamics {
  heartRateBpm: number;
  systolicPressureMmHg: number;
  diastolicPressureMmHg: number;
  endDiastolicVolumeMl: number;
  contractilityFraction: number;
  coronaryToneFraction: number;
  spasmBurst: number;
}

export function applyDrugs(
  inputs: {
    heartRateBpm: number;
    aorticSystolicPressureMmHg: number;
    aorticDiastolicPressureMmHg: number;
    endDiastolicVolumeMl: number;
    contractilityFraction: number;
    coronaryTonePercent: number;
    nitrateDosePercent: number;
    betaBlockerDosePercent: number;
  },
  rawSpasmBurst: number,
): EffectiveHaemodynamics {
  const nitrate = clamp(inputs.nitrateDosePercent / 100, 0, 1);
  const beta = clamp(inputs.betaBlockerDosePercent / 100, 0, 1);
  return {
    heartRateBpm: inputs.heartRateBpm * (1 - DRUGS.BETA_CHRONOTROPY * beta),
    systolicPressureMmHg: inputs.aorticSystolicPressureMmHg,
    diastolicPressureMmHg: inputs.aorticDiastolicPressureMmHg * (1 - DRUGS.NITRATE_HYPOTENSION * nitrate),
    endDiastolicVolumeMl: inputs.endDiastolicVolumeMl * (1 - DRUGS.NITRATE_PRELOAD_GAIN * nitrate),
    contractilityFraction: inputs.contractilityFraction * (1 - DRUGS.BETA_INOTROPY * beta),
    coronaryToneFraction: clamp((inputs.coronaryTonePercent / 100) * (1 - DRUGS.NITRATE_TONE_RELIEF * nitrate), 0, 0.8),
    spasmBurst: clamp(rawSpasmBurst * (1 - DRUGS.NITRATE_SPASM_RELIEF * nitrate), 0, 1),
  };
}

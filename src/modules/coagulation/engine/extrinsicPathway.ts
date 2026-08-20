import { EXTRINSIC } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Effective factor VII activity, 0..1.
 *
 * VII is vitamin K-dependent and has by far the SHORTEST half-life of the clotting factors,
 * so when vitamin K is antagonised it is the first to fall. That single fact is why warfarin
 * prolongs the PT days before it meaningfully touches the APTT, and why the INR is the test
 * used to monitor it.
 */
export function factorVIIActivity(vitaminKDependentFactors: number): number {
  return clamp((vitaminKDependentFactors / 100) * EXTRINSIC.VII_SENSITIVITY, 0, 1.5);
}

/**
 * Rate at which the extrinsic pathway generates factor Xa. Tissue factor is exposed only when
 * a vessel is breached, so this limb is silent until injury and then fires within seconds —
 * it is the trigger, while the intrinsic limb is the amplifier.
 */
export function extrinsicXaGeneration(tissueFactorExposure: number, vitaminKDependentFactors: number, currentThrombin: number): number {
  const vii = factorVIIActivity(vitaminKDependentFactors);
  // Tissue factor pathway inhibitor quenches this limb once thrombin has appeared, handing
  // the reaction over to the intrinsic amplification loop.
  const tfpi = 1 - EXTRINSIC.TFPI_SUPPRESSION * clamp(currentThrombin * 2.5, 0, 1);
  return clamp(tissueFactorExposure * vii * EXTRINSIC.TF_ACTIVATION_GAIN * tfpi, 0, 2);
}

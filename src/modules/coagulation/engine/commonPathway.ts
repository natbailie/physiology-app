import { AMPLIFICATION, ANTICOAGULANTS, COMMON } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target thrombin level, 0..1.
 *
 * Factor Xa with its cofactor Va converts prothrombin to thrombin. Both limbs of the cascade
 * converge here, which is why a defect in the COMMON pathway — low prothrombin, low factor X,
 * low fibrinogen — prolongs the PT and the APTT together, while a defect confined to one limb
 * prolongs only its own test. That contrast is the whole diagnostic logic of the screen.
 */
export function thrombinTarget(factorXa: number, vitaminKDependentFactors: number, amplification: number, antithromboticBrake: number): number {
  // Prothrombin (factor II) is itself vitamin K-dependent.
  const prothrombin = clamp(vitaminKDependentFactors / 100, 0, 1.5);
  const generated = factorXa * prothrombin * COMMON.XA_TO_THROMBIN_GAIN * amplification;
  return clamp(generated * (1 - antithromboticBrake), 0, 1);
}

/**
 * Thrombin's positive-feedback multiplier.
 *
 * Thrombin activates factors V, VIII and XI — the very cofactors needed to make more thrombin.
 * A trace therefore recruits a burst, which is what lets a vessel seal in seconds rather than
 * minutes. It is the second genuine positive-feedback loop in this app, after the ovulatory LH
 * surge, and like that one it needs a threshold: below a minimum the burst never ignites,
 * which is precisely what a severe factor deficiency does.
 */
export function thrombinAmplification(currentThrombin: number): number {
  if (currentThrombin < AMPLIFICATION.THRESHOLD) return 1;
  return 1 + currentThrombin * AMPLIFICATION.FEEDBACK_GAIN;
}

/**
 * The combined anticoagulant brake, 0..1.
 *
 * Antithrombin neutralises thrombin and Xa continuously, and heparin accelerates it about a
 * thousandfold — which is why heparin works within minutes while warfarin, which starves the
 * liver of usable vitamin K, takes days. Protein C, activated BY thrombin bound to
 * thrombomodulin, shuts off factors Va and VIIIa: the cascade carries its own brake, switched
 * on by its own product, which is what keeps the clot confined to the injury.
 */
export function anticoagulantBrake(heparinDose: number, currentThrombin: number): number {
  const antithrombin = ANTICOAGULANTS.ANTITHROMBIN_BASE * (1 + (heparinDose / 100) * ANTICOAGULANTS.HEPARIN_POTENTIATION * 6);
  const proteinC = currentThrombin * ANTICOAGULANTS.PROTEIN_C_GAIN;
  return clamp(antithrombin + proteinC, 0, 0.97);
}

/** Target fibrin level, 0..1 — thrombin cleaving fibrinogen into the mesh that gives the clot
 * its tensile strength, offset by whatever plasmin is simultaneously digesting. */
export function fibrinTarget(thrombin: number, fibrinogenLevel: number, plasmin: number): number {
  const fibrinogen = clamp(fibrinogenLevel / 100, 0, 1.5);
  const formed = thrombin * fibrinogen * COMMON.THROMBIN_TO_FIBRIN_GAIN;
  return clamp(formed - plasmin * 0.5, 0, 1);
}

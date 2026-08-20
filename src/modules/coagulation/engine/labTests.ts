import { LAB_BASELINE, PLATELETS } from './constants';
import { clamp } from '@/shared/lib/math';
import { effectiveFactorVIII } from './intrinsicPathway';
import { factorVIIActivity } from './extrinsicPathway';
import { plateletAvailability, plateletFunction } from './platelets';
import type { CoagInputs } from './types';

/**
 * Clotting times lengthen non-linearly as factor activity falls: a level around 50% is barely
 * detectable, 30% is clearly abnormal, and below 10% the time runs away. This curve reproduces
 * that, and it is why mild deficiencies hide on a screening panel.
 */
function timeFromActivity(activity: number, baselineSeconds: number, maxSeconds: number): number {
  const level = clamp(activity, 0.01, 1.5);
  // Reciprocal response, normalised so activity = 1 gives exactly the baseline time.
  const prolongation = clamp(1 / level - 1, 0, 20);
  return clamp(baselineSeconds + prolongation * baselineSeconds * 0.85, baselineSeconds, maxSeconds);
}

/**
 * Prothrombin time. Probes the EXTRINSIC and COMMON pathways: factor VII, then X, V,
 * prothrombin and fibrinogen. It is insensitive to factors VIII and IX, so hemophilia leaves
 * it completely normal — the single most useful discrimination on the panel.
 */
export function prothrombinTime(inputs: CoagInputs): number {
  const vii = factorVIIActivity(inputs.vitaminKDependentFactors);
  const common = clamp(inputs.vitaminKDependentFactors / 100, 0, 1.5);
  const fibrinogen = clamp(inputs.fibrinogenLevel / 100, 0, 1.5);
  // The slowest step limits the whole reaction, so the weakest link sets the time.
  const limiting = Math.min(vii, common, fibrinogen);
  // Heparin has some effect on the PT, but far less than on the APTT.
  const heparinEffect = 1 - clamp(inputs.heparinDose / 100, 0, 1) * 0.25;
  return timeFromActivity(limiting * heparinEffect, LAB_BASELINE.PT_SECONDS, LAB_BASELINE.PT_MAX_SECONDS);
}

/** INR — the PT normalised against a laboratory control, so warfarin can be monitored
 * consistently between labs. */
export function internationalNormalisedRatio(ptSeconds: number): number {
  return ptSeconds / LAB_BASELINE.INR_REFERENCE_SECONDS;
}

/**
 * Activated partial thromboplastin time. Probes the INTRINSIC and COMMON pathways: factors
 * XII, XI, IX and VIII, then the shared limb. Prolonged by hemophilia A and B, by von
 * Willebrand disease (through its carriage of factor VIII), and markedly by heparin — which
 * is why the APTT is the test used to monitor unfractionated heparin.
 */
export function activatedPartialThromboplastinTime(inputs: CoagInputs): number {
  const viii = effectiveFactorVIII(inputs.factorVIIIActivity, inputs.vonWillebrandFactor);
  // The APTT is genuinely less sensitive to vitamin K antagonism than the PT is — factor VII,
  // which only the PT sees, has the shortest half-life and falls furthest first. Softening the
  // vitamin-K terms here reproduces the clinical reality that warfarin drives the INR up while
  // moving the APTT comparatively little.
  const vitK = clamp(inputs.vitaminKDependentFactors / 100, 0.01, 1.5);
  const softenedVitK = Math.pow(vitK, 0.55);
  const ix = clamp((inputs.factorIXActivity / 100) * softenedVitK, 0, 1.5);
  const common = softenedVitK;
  const fibrinogen = clamp(inputs.fibrinogenLevel / 100, 0, 1.5);
  const limiting = Math.min(viii, ix, common, fibrinogen);
  // Heparin's antithrombin effect hits this test hardest.
  const heparinEffect = 1 - clamp(inputs.heparinDose / 100, 0, 1) * 0.82;
  return timeFromActivity(limiting * heparinEffect, LAB_BASELINE.APTT_SECONDS, LAB_BASELINE.APTT_MAX_SECONDS);
}

/**
 * Bleeding time. Probes PRIMARY haemostasis only — platelet number and function — and is
 * completely blind to the coagulation cascade. This is why thrombocytopenia and aspirin
 * prolong it with a normal PT and APTT, while hemophilia does the exact opposite.
 */
export function bleedingTimeMinutes(inputs: CoagInputs): number {
  const availability = plateletAvailability(inputs.plateletCount);
  const functionLevel = plateletFunction(inputs.vonWillebrandFactor, inputs.aspirinDose);
  const effective = clamp(availability * functionLevel, 0.02, 1.4);
  return clamp(
    LAB_BASELINE.BLEEDING_TIME_MINUTES / effective,
    LAB_BASELINE.BLEEDING_TIME_MINUTES * 0.7,
    LAB_BASELINE.BLEEDING_TIME_MAX_MINUTES,
  );
}

export function fibrinogenMgDl(fibrinogenLevel: number): number {
  return (fibrinogenLevel / 100) * LAB_BASELINE.FIBRINOGEN_MG_DL;
}

export function plateletCountValue(plateletCount: number): number {
  return clamp(plateletCount, 0, PLATELETS.NORMAL_COUNT * 2);
}

export function dDimerNgMl(dDimer: number): number {
  return LAB_BASELINE.D_DIMER_NG_ML + dDimer * (LAB_BASELINE.D_DIMER_MAX_NG_ML - LAB_BASELINE.D_DIMER_NG_ML);
}

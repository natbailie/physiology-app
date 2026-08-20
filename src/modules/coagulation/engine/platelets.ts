import { PLATELETS } from './constants';
import { clamp } from '@/shared/lib/math';

/** Platelet availability relative to a normal count, 0..1. */
export function plateletAvailability(plateletCount: number): number {
  return clamp(plateletCount / PLATELETS.NORMAL_COUNT, 0, 1.4);
}

/**
 * Platelet function, 0..1 — how well available platelets can actually aggregate.
 *
 * Adhesion needs von Willebrand factor to bridge the platelet to exposed collagen, while
 * aggregation needs thromboxane, which aspirin removes irreversibly for the platelet's
 * lifetime. Both are qualitative defects: the COUNT is untouched, which is exactly why they
 * prolong the bleeding time while leaving PT and APTT completely normal.
 */
export function plateletFunction(vonWillebrandFactor: number, aspirinDose: number): number {
  const adhesion = clamp(vonWillebrandFactor / 100, 0, 1) * PLATELETS.VWF_ADHESION_WEIGHT + (1 - PLATELETS.VWF_ADHESION_WEIGHT);
  const aggregation = 1 - clamp(aspirinDose / 100, 0, 1) * PLATELETS.ASPIRIN_MAX_INHIBITION;
  return clamp(adhesion * aggregation, 0, 1);
}

/** Target platelet plug size, 0..1 — the primary haemostatic response, needing both enough
 * platelets and platelets that work. */
export function plateletPlugTarget(tissueFactorExposure: number, plateletCount: number, vonWillebrandFactor: number, aspirinDose: number): number {
  return clamp(tissueFactorExposure * plateletAvailability(plateletCount) * plateletFunction(vonWillebrandFactor, aspirinDose), 0, 1);
}

/**
 * The procoagulant phospholipid surface activated platelets provide, 0..1.
 *
 * The tenase and prothrombinase complexes assemble on this membrane, so severe
 * thrombocytopenia slows thrombin generation as well as plug formation — the two arms of
 * haemostasis are not as independent as the textbook diagram suggests.
 */
export function plateletSurface(plateletCount: number): number {
  const availability = plateletAvailability(plateletCount);
  return clamp(1 - PLATELETS.SURFACE_CONTRIBUTION + PLATELETS.SURFACE_CONTRIBUTION * availability, 0, 1);
}

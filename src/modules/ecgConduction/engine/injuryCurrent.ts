import { INJURY, INJURY_TERRITORY_VECTORS } from './constants';
import { projectOntoLead } from './leadProjection';
import { clamp } from '@/shared/lib/math';
import type { InjuryTerritory, LeadName } from './types';

/**
 * ST deviation from an ischemic injury current, mV.
 *
 * Ischemic myocardium cannot hold a normal resting potential, so a current flows between
 * injured and healthy tissue whenever the healthy tissue is NOT depolarised. The recorder
 * treats the resulting offset as the baseline, so the deflection actually shows up during the
 * ST segment — the window when healthy myocardium is uniformly depolarised and everything
 * would otherwise be isoelectric.
 *
 * Because the offset is a vector projected onto each lead like any other, both LOCALISATION
 * and RECIPROCAL CHANGE fall out for free. An inferior injury elevates ST in the inferior
 * leads (II, III, aVF) and simultaneously depresses it in aVL, because that lead faces the
 * other way. An anterior injury elevates V2 to V4 and leaves the limb leads comparatively
 * quiet. And a POSTERIOR injury — which no electrode faces directly — appears only as its own
 * mirror image: ST depression with tall R waves in V1 and V2. That last one is the classic
 * miss, and here it is a consequence of the geometry rather than a special case.
 */
export function stDeviationMv(ischemicInjury: number, territory: InjuryTerritory, lead: LeadName): number {
  const severity = clamp(ischemicInjury, 0, 1);
  if (severity === 0) return 0;

  const direction = INJURY_TERRITORY_VECTORS[territory];
  return severity * INJURY.ST_DEVIATION_MV_PER_UNIT * projectOntoLead(direction, lead);
}

/** True while the ventricle is uniformly depolarised — the ST segment window, where the
 * injury current becomes visible. */
export function isStSegment(ventricularTimeMs: number, qrsOffsetMs: number, repolarizationStartMs: number): boolean {
  return ventricularTimeMs >= qrsOffsetMs && ventricularTimeMs < repolarizationStartMs;
}

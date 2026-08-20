import { INJURY, LEAD_AXES } from './constants';
import { clamp } from '@/shared/lib/math';
import type { LeadName } from './types';

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * ST deviation from an ischemic injury current, mV.
 *
 * Ischemic myocardium cannot hold a normal resting potential, so a current flows between
 * injured and healthy tissue whenever the healthy tissue is NOT depolarised. The recorder
 * treats the resulting offset as the baseline, so the deflection actually shows up during the
 * ST segment — the window when healthy myocardium is uniformly depolarised and everything
 * would otherwise be isoelectric.
 *
 * Because the offset is a vector projected onto each lead like any other, RECIPROCAL CHANGES
 * fall out for free: an inferior injury (+90°) elevates ST in the inferior leads (II, III,
 * aVF) and simultaneously depresses it in aVL (−30°), because cos(120°) is negative. That
 * pairing is a real diagnostic signature, and here it is a consequence of the geometry rather
 * than something drawn in.
 */
export function stDeviationMv(ischemicInjury: number, lead: LeadName): number {
  const severity = clamp(ischemicInjury, 0, 1);
  if (severity === 0) return 0;

  const territory = INJURY.TERRITORY_ANGLE_DEGREES * DEGREES_TO_RADIANS;
  const leadAngle = LEAD_AXES[lead] * DEGREES_TO_RADIANS;
  const projection = Math.cos(territory - leadAngle);

  return severity * INJURY.ST_DEVIATION_MV_PER_UNIT * projection;
}

/** True while the ventricle is uniformly depolarised — the ST segment window, where the
 * injury current becomes visible. */
export function isStSegment(ventricularTimeMs: number, qrsOffsetMs: number, repolarizationStartMs: number): boolean {
  return ventricularTimeMs >= qrsOffsetMs && ventricularTimeMs < repolarizationStartMs;
}

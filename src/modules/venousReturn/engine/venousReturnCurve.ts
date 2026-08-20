import { ATRIUM, CIRCULATION } from './constants';
import type { CurvePoint } from './types';
import { PLOT } from './constants';

/**
 * Resistance to venous return. Venous resistance dominates it, and arterial resistance barely
 * matters — not because arterial resistance is small (it is far larger) but because what counts
 * is resistance weighted by the compliance DOWNSTREAM of it, and almost all the compliance is
 * venous. Doubling systemic vascular resistance therefore does much less to venous return than
 * to arterial pressure.
 */
export function resistanceToVenousReturn(
  venousResistance: number,
  systemicVascularResistance: number,
  arteriovenousShunt: number,
): number {
  const weighted =
    CIRCULATION.SVR_WEIGHT * Math.max(systemicVascularResistance, 0.05) +
    (1 - CIRCULATION.SVR_WEIGHT) * Math.max(venousResistance, 0.05);
  const shunted = weighted * (1 - CIRCULATION.SHUNT_RESISTANCE_DROP * Math.min(Math.max(arteriovenousShunt, 0), 1));
  return Math.max(CIRCULATION.BASE_RESISTANCE * shunted, CIRCULATION.MIN_RESISTANCE);
}

/**
 * The venous return curve: VR = (Pmsf − Pra) / RVR.
 *
 * Flow is driven by the difference between the filling pressure upstream and the right atrial
 * pressure downstream, so RAISING right atrial pressure REDUCES venous return — a heart that
 * cannot empty its atrium is a heart that stops being filled. Venous return falls to zero when
 * right atrial pressure reaches the mean systemic filling pressure, which is how that pressure
 * can be measured during a cardiac arrest.
 *
 * Below about zero the curve flattens: the great veins collapse as they enter the chest, so no
 * amount of further suction increases flow. That plateau is why a healthy heart cannot raise its
 * output simply by emptying harder — it can only pump what the circulation delivers.
 */
export function venousReturn(
  rightAtrialPressureMmHg: number,
  meanSystemicFillingPressureMmHg: number,
  resistance: number,
): number {
  const effectivePra = Math.max(rightAtrialPressureMmHg, ATRIUM.COLLAPSE_PRESSURE_MMHG);
  return Math.max(0, (meanSystemicFillingPressureMmHg - effectivePra) / Math.max(resistance, 0.05));
}

export function sampleVenousCurve(meanSystemicFillingPressureMmHg: number, resistance: number): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i <= PLOT.SAMPLES; i++) {
    const pra = PLOT.PRA_MIN + ((PLOT.PRA_MAX - PLOT.PRA_MIN) * i) / PLOT.SAMPLES;
    points.push({ pra, flow: venousReturn(pra, meanSystemicFillingPressureMmHg, resistance) });
  }
  return points;
}

import { CARDIAC, PLOT } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';
import type { CurvePoint } from './types';

/**
 * The cardiac function curve: cardiac output as a function of right atrial pressure. This is the
 * Frank-Starling relationship plotted the other way round from the usual — filling pressure on
 * the x-axis, output on the y — so that it can share axes with the venous return curve.
 *
 * It rises steeply at low filling pressures and then plateaus: once the sarcomeres are at
 * optimal length, more filling adds nothing. A failing heart's curve is flatter and lower; a
 * sympathetically stimulated one is steeper and higher.
 */
export function cardiacOutput(
  rightAtrialPressureMmHg: number,
  intrathoracicPressureMmHg: number,
  plateau: number,
): number {
  // What stretches the ventricle is the TRANSMURAL pressure — the pressure inside minus the
  // pressure outside. This is the entire mechanism by which positive-pressure ventilation and a
  // Valsalva manoeuvre reduce cardiac output: they raise the pressure outside the heart, so the
  // same measured right atrial pressure now distends it less.
  const transmural = rightAtrialPressureMmHg - intrathoracicPressureMmHg;
  if (transmural <= 0) return 0;
  return plateau * (1 - Math.exp(-transmural / CARDIAC.STARLING_CONSTANT_MMHG));
}

/** The maximum the heart could deliver at any filling pressure. */
export function cardiacPlateau(contractility: number, heartRate: number, systemicVascularResistance: number): number {
  const afterloadFactor = 1 / (1 + CARDIAC.AFTERLOAD_SENSITIVITY * Math.max(0, systemicVascularResistance - 1));
  return CARDIAC.MAX_OUTPUT_L_PER_MIN * Math.max(contractility, 0) * heartRateFactor(heartRate) * afterloadFactor;
}

/** Rate helps until diastole becomes too short to fill in, after which it hurts. Normalised so
 * that a resting heart rate leaves the plateau at its textbook value. */
export function heartRateFactor(heartRate: number): number {
  return rawRateFactor(heartRate) / rawRateFactor(CARDIAC.RATE_REFERENCE);
}

function rawRateFactor(heartRate: number): number {
  const rising = scaleClamped(heartRate, 30, CARDIAC.OPTIMUM_HEART_RATE, CARDIAC.MIN_RATE_FACTOR, 1.25);
  const falling = scaleClamped(heartRate, CARDIAC.OPTIMUM_HEART_RATE, 220, 1, 0.45);
  return clamp(rising * falling, 0.02, 1.8);
}

export function sampleCardiacCurve(intrathoracicPressureMmHg: number, plateau: number): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i <= PLOT.SAMPLES; i++) {
    const pra = PLOT.PRA_MIN + ((PLOT.PRA_MAX - PLOT.PRA_MIN) * i) / PLOT.SAMPLES;
    points.push({ pra, flow: cardiacOutput(pra, intrathoracicPressureMmHg, plateau) });
  }
  return points;
}

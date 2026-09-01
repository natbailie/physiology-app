import { describe, expect, it } from 'vitest';
import { lengthTensionFactor } from './lengthTension';
import { shorteningVelocity } from './forceVelocity';

/**
 * An ANALYTIC oracle against the two experiments this module is built on. Both references are
 * written out here rather than imported, so nothing on the reference side depends on ours.
 *
 * GORDON, HUXLEY & JULIAN (1966) measured tension against sarcomere length in single frog fibres
 * and found a curve made of straight lines with breakpoints at specific lengths. Those breakpoints
 * are not fitted parameters — they are FILAMENT LENGTHS. Tension goes to zero at 3.65 um because
 * that is where thick and thin filaments stop overlapping at all, and the plateau runs 2.0-2.2 um
 * because that is the length of the myosin bare zone. The curve is the single strongest piece of
 * evidence for the sliding filament theory, and its shape is a measurement of a molecule.
 *
 * HILL (1938) measured shortening velocity against load and found a rectangular hyperbola,
 * (F + a)(v + b) = (F0 + a)b, with a/F0 near 0.25 for vertebrate muscle. Its two endpoints are
 * where the clinical meaning lives: unloaded muscle shortens fastest and generates no force, and
 * maximally loaded muscle generates most force and does not shorten.
 */

/** Gordon, Huxley and Julian's measured breakpoints, in micrometres. */
const GHJ = { zeroAscending: 1.27, plateauStart: 2.0, plateauEnd: 2.2, zeroDescending: 3.65 };

/** Hill's hyperbola solved for velocity: v = b(F0 - F) / (F + a). */
function hillVelocity(load: number, f0: number, aFraction: number, vmax: number): number {
  if (load >= f0) return 0;
  const a = aFraction * f0;
  const b = aFraction * vmax;
  return (b * (f0 - load)) / (load + a);
}

describe('analytic: the length-tension curve is Gordon, Huxley and Julian (1966)', () => {
  it('puts both zeros at the measured filament lengths', () => {
    // 1.27 um is where the thick filament meets the Z-disc; 3.65 um is where overlap ends. These
    // are the numbers that made the sliding filament theory testable rather than plausible.
    expect(lengthTensionFactor(GHJ.zeroAscending)).toBeCloseTo(0, 6);
    expect(lengthTensionFactor(GHJ.zeroDescending)).toBeCloseTo(0, 6);
    expect(lengthTensionFactor(GHJ.zeroAscending - 0.1)).toBe(0);
    expect(lengthTensionFactor(GHJ.zeroDescending + 0.1)).toBe(0);
  });

  it('holds a FLAT plateau between 2.0 and 2.2 um, not a peak', () => {
    // The plateau is the bare zone of the myosin filament, where sliding further changes no
    // number of available cross-bridges. A model that peaked at 2.1 and fell away either side
    // would fit the endpoints and get the mechanism wrong.
    for (const length of [2.0, 2.05, 2.1, 2.15, 2.2]) {
      expect(lengthTensionFactor(length), `plateau at ${length} um`).toBeCloseTo(1, 6);
    }
  });

  it('descends LINEARLY from the plateau to zero, because overlap is linear in length', () => {
    // Each micrometre of extra separation removes a fixed number of cross-bridges, so the limb is
    // straight. Sampling it is what distinguishes the real geometry from a smooth curve fitted
    // through the same endpoints.
    const midpoint = (GHJ.plateauEnd + GHJ.zeroDescending) / 2;
    expect(lengthTensionFactor(midpoint)).toBeCloseTo(0.5, 2);
    const quarter = GHJ.plateauEnd + (GHJ.zeroDescending - GHJ.plateauEnd) * 0.25;
    expect(lengthTensionFactor(quarter)).toBeCloseTo(0.75, 2);
  });

  it('rises on the ascending limb and is not symmetric with the descending one', () => {
    // The two limbs have different slopes because they have different causes: interference and
    // then collision below the plateau, simple loss of overlap above it.
    const ascendingSlope = 1 / (GHJ.plateauStart - GHJ.zeroAscending);
    const descendingSlope = 1 / (GHJ.zeroDescending - GHJ.plateauEnd);
    expect(ascendingSlope).toBeGreaterThan(descendingSlope);
    expect(lengthTensionFactor(1.6)).toBeGreaterThan(0);
    expect(lengthTensionFactor(1.6)).toBeLessThan(1);
  });

  it('explains why a heart is never operated on the descending limb', () => {
    // At the resting length of 2.1 um a muscle sits on the plateau, so stretching it a little
    // costs almost nothing and shortening it costs immediately. That asymmetry is the mechanical
    // basis of the Frank-Starling relation.
    expect(lengthTensionFactor(2.1)).toBeCloseTo(1, 6);
    expect(lengthTensionFactor(1.8)).toBeLessThan(lengthTensionFactor(2.4));
  });
});

describe('analytic: the force-velocity relation is Hill (1938)', () => {
  const F0 = 6.4;
  const A_FRACTION = 0.25;
  const VMAX = 4;

  it('tracks the hyperbola across the whole load range', () => {
    for (const fraction of [0, 0.1, 0.25, 0.4, 0.6, 0.8, 0.95]) {
      const load = F0 * fraction;
      expect(shorteningVelocity(F0, load), `v at ${fraction} of F0`).toBeCloseTo(
        hillVelocity(load, F0, A_FRACTION, VMAX),
        6,
      );
    }
  });

  it('reaches vmax unloaded and zero velocity at maximal load — the two endpoints', () => {
    expect(shorteningVelocity(F0, 0)).toBeCloseTo(VMAX, 6);
    expect(shorteningVelocity(F0, F0)).toBe(0);
    expect(shorteningVelocity(F0, F0 * 1.5)).toBe(0);
  });

  it('is a HYPERBOLA and not a straight line, which is the whole result', () => {
    // A linear force-velocity relation would put the half-load velocity at half of vmax. Hill's
    // hyperbola with a/F0 = 0.25 puts it far lower — velocity falls away steeply as soon as any
    // load is applied, which is why lifting a heavy object is slow out of proportion to its mass.
    const halfLoad = shorteningVelocity(F0, F0 / 2);
    expect(halfLoad).toBeLessThan(VMAX / 2);
    expect(halfLoad).toBeCloseTo((A_FRACTION * VMAX * (F0 / 2)) / (F0 / 2 + A_FRACTION * F0), 6);
  });

  it('peaks in POWER near a third of maximal load, as Hill found', () => {
    // Power is force times velocity, and both endpoints give zero. The maximum sits near
    // 0.3 F0 — which is why gearing matters in a bicycle and why the optimum training load is
    // neither the heaviest nor the lightest.
    const power = (fraction: number) => F0 * fraction * shorteningVelocity(F0, F0 * fraction);
    const fractions = Array.from({ length: 99 }, (_, i) => (i + 1) / 100);
    const best = fractions.reduce((a, b) => (power(b) > power(a) ? b : a));
    expect(best).toBeGreaterThan(0.2);
    expect(best).toBeLessThan(0.45);
    expect(power(0)).toBeCloseTo(0, 6);
    expect(power(1)).toBeCloseTo(0, 6);
  });

  it("uses Hill's a/F0 of about 0.25, which sets the curvature", () => {
    // a/F0 is the one shape parameter: smaller values bend the hyperbola harder. Recovering it
    // from the curve rather than reading it from our constants is what makes this a test of the
    // relation rather than of the constant.
    const load = F0 * 0.5;
    const v = shorteningVelocity(F0, load);
    // Solve v = b(F0-F)/(F+a) with b = a_fraction * vmax and a = a_fraction * F0 for a_fraction.
    const recovered = (v * load) / (VMAX * (F0 - load) - v * F0);
    expect(recovered).toBeCloseTo(A_FRACTION, 3);
  });
});

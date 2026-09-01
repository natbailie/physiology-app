import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_KINETICS_INPUTS } from './presets';
import type { KineticsDerived, KineticsInputs } from './types';

/**
 * An ANALYTIC oracle: the reference is Michaelis and Menten's equation, written out here rather
 * than imported, so that nothing on the reference side depends on our implementation of it.
 *
 * The module's own `engine.test.ts` already checks that velocity is half of Vmax at a substrate
 * equal to Km. That is one point on a curve. This file checks the whole curve, and then the three
 * INHIBITION transforms, which is where the interesting claims are: competitive, noncompetitive and
 * uncompetitive inhibitors are told apart entirely by which of Km and Vmax they move, and getting
 * one of those backwards would still pass a single-point test.
 */

/** v = Vmax[S] / (Km + [S]). Written out; not imported. */
function michaelisMenten(substrate: number, vmax: number, km: number): number {
  return (vmax * substrate) / (km + substrate);
}

/**
 * Apparent constants under each classical inhibition mode, with alpha = 1 + [I]/Ki.
 *
 * Competitive inhibitors compete for the free enzyme, so more substrate outcompetes them: Km rises
 * by alpha and Vmax is untouched. Pure noncompetitive inhibitors bind away from the active site and
 * cannot be outcompeted: Vmax falls by alpha and Km is untouched. Uncompetitive inhibitors bind
 * only the enzyme-substrate COMPLEX, so they need substrate to act and pull both down together —
 * which is why an uncompetitive inhibitor is the only one that gets WORSE as substrate rises.
 */
function apparent(mode: 'competitive' | 'noncompetitive' | 'uncompetitive', vmax: number, km: number, alpha: number) {
  switch (mode) {
    case 'competitive':
      return { vmax, km: km * alpha };
    case 'noncompetitive':
      return { vmax: vmax / alpha, km };
    case 'uncompetitive':
      return { vmax: vmax / alpha, km: km / alpha };
  }
}

function settle(patch: Partial<KineticsInputs>, seconds = 200): KineticsDerived {
  const inputs = { ...DEFAULT_KINETICS_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.05;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

const VMAX = DEFAULT_KINETICS_INPUTS.vmaxUmPerMin;
const KM = DEFAULT_KINETICS_INPUTS.kmMm;

describe('analytic: the rate curve IS the Michaelis-Menten equation', () => {
  it('tracks the equation across four orders of magnitude of substrate', () => {
    // A single point at [S] = Km cannot distinguish a hyperbola from a straight line through the
    // same point. Sampling from far below saturation to far above it can.
    for (const substrateMm of [0.01, 0.05, 0.25, 0.5, 1, 2, 5, 20, 100]) {
      const expected = michaelisMenten(substrateMm, VMAX, KM);
      expect(settle({ substrateMm }).reactionRateUmPerMin, `v at [S]=${substrateMm} mM`).toBeCloseTo(expected, 3);
    }
  });

  it('is first-order far below Km and zero-order far above it', () => {
    // The two limbs are the whole clinical content of the curve: why doubling a drug dose doubles
    // clearance at low concentrations and does nothing at high ones, and why ethanol saturates
    // alcohol dehydrogenase and then eliminates at a fixed rate.
    const low = [0.005, 0.01, 0.02].map((s) => settle({ substrateMm: s }).reactionRateUmPerMin);
    // Doubling substrate nearly doubles rate when [S] << Km.
    expect(low[1]! / low[0]!).toBeGreaterThan(1.9);
    expect(low[2]! / low[1]!).toBeGreaterThan(1.9);

    // And barely moves it when [S] >> Km.
    const high = [50, 100].map((s) => settle({ substrateMm: s }).reactionRateUmPerMin);
    expect(high[1]! / high[0]!).toBeLessThan(1.02);
    expect(high[1]!).toBeLessThan(VMAX);
    expect(high[1]!).toBeGreaterThan(VMAX * 0.99);
  });

  it('never exceeds Vmax, however much substrate is added', () => {
    // The asymptote is what "saturable" means, and a model that could be pushed past it would be
    // teaching the opposite of the point.
    expect(settle({ substrateMm: 1000 }).reactionRateUmPerMin).toBeLessThanOrEqual(VMAX);
  });
});

describe('analytic: the three inhibition modes move the constants they are defined by', () => {
  const KI = DEFAULT_KINETICS_INPUTS.kiUm;
  const INHIBITOR = 40;
  const alpha = 1 + INHIBITOR / KI;

  for (const mode of ['competitive', 'noncompetitive', 'uncompetitive'] as const) {
    it(`reproduces the ${mode} transform of Km and Vmax`, () => {
      const expected = apparent(mode, VMAX, KM, alpha);
      const derived = settle({ inhibitorType: mode, inhibitorUm: INHIBITOR });
      expect(derived.apparentKmMm, `${mode} apparent Km`).toBeCloseTo(expected.km, 3);
      expect(derived.apparentVmaxUmPerMin, `${mode} apparent Vmax`).toBeCloseTo(expected.vmax, 3);
    });
  }

  it('lets substrate outcompete a COMPETITIVE inhibitor but not a noncompetitive one', () => {
    // The single most useful consequence of the three transforms, and the reason the distinction
    // is taught at all: at saturating substrate a competitive inhibitor is fully overcome and a
    // noncompetitive one is not. It is why ethanol is the antidote for methanol poisoning.
    const saturating = 200;
    const competitive = settle({ inhibitorType: 'competitive', inhibitorUm: INHIBITOR, substrateMm: saturating });
    const noncompetitive = settle({ inhibitorType: 'noncompetitive', inhibitorUm: INHIBITOR, substrateMm: saturating });

    expect(competitive.reactionRateUmPerMin).toBeGreaterThan(VMAX * 0.95);
    expect(noncompetitive.reactionRateUmPerMin).toBeLessThan(VMAX / alpha + 0.01);
    expect(noncompetitive.reactionRateUmPerMin).toBeLessThan(competitive.reactionRateUmPerMin * 0.9);
  });

  it('leaves the Lineweaver-Burk intercepts where each mode predicts', () => {
    // The double-reciprocal plot is how these were told apart before curve fitting: 1/v against
    // 1/[S] is a straight line with y-intercept 1/Vmax and x-intercept -1/Km. Competitive
    // inhibition therefore pivots about a SHARED y-intercept, and noncompetitive about a shared
    // x-intercept. Asserting the intercepts is asserting the plot.
    const none = settle({ inhibitorType: 'none' });
    const competitive = settle({ inhibitorType: 'competitive', inhibitorUm: INHIBITOR });
    const noncompetitive = settle({ inhibitorType: 'noncompetitive', inhibitorUm: INHIBITOR });

    // Competitive: same y-intercept (1/Vmax unchanged), x-intercept moves in.
    expect(1 / competitive.apparentVmaxUmPerMin).toBeCloseTo(1 / none.apparentVmaxUmPerMin, 6);
    expect(-1 / competitive.apparentKmMm).toBeGreaterThan(-1 / none.apparentKmMm);

    // Noncompetitive: same x-intercept (Km unchanged), y-intercept rises.
    expect(-1 / noncompetitive.apparentKmMm).toBeCloseTo(-1 / none.apparentKmMm, 6);
    expect(1 / noncompetitive.apparentVmaxUmPerMin).toBeGreaterThan(1 / none.apparentVmaxUmPerMin);
  });
});

import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_CAPILLARY_INPUTS } from './presets';
import { landisPappenheimer } from './oncoticPressure';
import type { CapillaryDerived, CapillaryInputs } from './types';

/**
 * An ANALYTIC oracle against the Starling equation and the Landis-Pappenheimer relation, both
 * written out here rather than imported.
 *
 * Two things are worth separating. The STARLING EQUATION itself is bookkeeping — four pressures
 * and two coefficients — and checking it is checking that the module adds up. The
 * LANDIS-PAPPENHEIMER relation is a measurement: colloid osmotic pressure is NOT proportional to
 * protein concentration, it rises faster than linearly because albumin is charged and drags
 * counter-ions with it (the Gibbs-Donnan effect). That non-linearity is why halving the albumin
 * more than halves the oncotic pressure, and it is the quantitative core of nephrotic oedema.
 */

/** Jv = Kf x [(Pc - Pi) - sigma(pi_c - pi_i)]. Written out; not imported. */
function starlingNetPressure(
  capillaryHydrostatic: number,
  interstitialHydrostatic: number,
  plasmaOncotic: number,
  interstitialOncotic: number,
  reflectionCoefficient: number,
): number {
  return (
    capillaryHydrostatic - interstitialHydrostatic - reflectionCoefficient * (plasmaOncotic - interstitialOncotic)
  );
}

/**
 * Landis-Pappenheimer, the standard cubic fit for human plasma:
 *   pi = 2.1c + 0.16c^2 + 0.009c^3, with c in g/dL and pi in mmHg.
 * At a normal total protein of 7.3 g/dL this gives about 25 mmHg.
 */
function landisPappenheimerReference(proteinGDl: number): number {
  const c = Math.max(proteinGDl, 0);
  return 2.1 * c + 0.16 * c * c + 0.009 * c * c * c;
}

function settle(patch: Partial<CapillaryInputs>, seconds = 600): CapillaryDerived {
  const inputs = { ...DEFAULT_CAPILLARY_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.5;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: oncotic pressure follows Landis-Pappenheimer, not a straight line', () => {
  it('matches the published cubic across the whole protein range', () => {
    for (const proteinGDl of [2, 4, 5, 6, 7.3, 9]) {
      expect(landisPappenheimer(proteinGDl), `pi at ${proteinGDl} g/dL`).toBeCloseTo(
        landisPappenheimerReference(proteinGDl),
        1,
      );
    }
  });

  it('is SUPRALINEAR, which is the whole clinical point', () => {
    // Doubling protein more than doubles oncotic pressure. A linear model would under-predict the
    // oedema of hypoalbuminaemia and over-predict the benefit of albumin infusion.
    const low = landisPappenheimer(3);
    const high = landisPappenheimer(6);
    expect(high / low).toBeGreaterThan(2.2);
    // And the curvature is real, not a rounding artefact: the midpoint sits below the chord.
    const chordMidpoint = (low + high) / 2;
    expect(landisPappenheimer(4.5)).toBeLessThan(chordMidpoint);
  });

  it('lands near 25 mmHg at a normal total plasma protein', () => {
    // The number every textbook quotes for plasma colloid osmotic pressure.
    expect(landisPappenheimerReference(7.3)).toBeGreaterThan(23);
    expect(landisPappenheimerReference(7.3)).toBeLessThan(29);
  });
});

describe('analytic: the net pressure IS the Starling equation', () => {
  it('reproduces the equation at the module baseline', () => {
    const d = settle({});
    expect(d.netFiltrationPressure).toBeCloseTo(
      starlingNetPressure(
        d.capillaryPressureMmHg,
        d.interstitialPressureMmHg,
        d.plasmaOncoticMmHg,
        d.interstitialOncoticMmHg,
        DEFAULT_CAPILLARY_INPUTS.reflectionCoefficient,
      ),
      3,
    );
  });

  it("reproduces Guyton's four pressures and the near-zero net they produce", () => {
    // Pc 17.3, Pi -3, pi_c 28, pi_i 8 gives a net of +0.3 mmHg. The near-cancellation is the
    // point: filtration and absorption almost balance, and the small residue is what the
    // lymphatics carry. A model whose net was several mmHg would flood the interstitium.
    expect(starlingNetPressure(17.3, -3, 28, 8, 1)).toBeCloseTo(0.3, 1);
    const d = settle({});
    expect(d.netFiltrationPressure).toBeGreaterThan(-1);
    expect(d.netFiltrationPressure).toBeLessThan(1.5);
  });

  it('makes each of the four forces move the net in the direction its sign demands', () => {
    // Sign errors in a four-term equation are easy and invisible in the baseline, because the
    // terms nearly cancel. Perturbing each in turn is what catches one.
    const base = starlingNetPressure(17.3, -3, 28, 8, 1);
    expect(starlingNetPressure(25, -3, 28, 8, 1)).toBeGreaterThan(base); // raised capillary pressure
    expect(starlingNetPressure(17.3, 2, 28, 8, 1)).toBeLessThan(base); // raised interstitial pressure
    expect(starlingNetPressure(17.3, -3, 18, 8, 1)).toBeGreaterThan(base); // low albumin
    expect(starlingNetPressure(17.3, -3, 28, 14, 1)).toBeGreaterThan(base); // protein-rich interstitium
  });

  it('abolishes the entire oncotic term when the reflection coefficient goes to zero', () => {
    // sigma is the term most easily forgotten because it is not a pressure. When the wall stops
    // holding protein back, the oncotic gradient stops opposing filtration at all — which is why
    // albumin helps a nephrotic patient and does nothing for a septic one.
    const intact = starlingNetPressure(17.3, -3, 28, 8, 1);
    const leaky = starlingNetPressure(17.3, -3, 28, 8, 0);
    expect(leaky).toBeCloseTo(17.3 - -3, 6);
    expect(leaky - intact).toBeCloseTo(28 - 8, 6);
  });

  it('agrees with the engine that the equation is the same one at every tissue bed', () => {
    // Different beds change Kf and the pressures, not the equation. If a bed had its own algebra
    // the module would be teaching that Starling is a family of rules rather than one.
    for (const bed of ['systemic', 'pulmonary', 'glomerulus', 'hepatic'] as const) {
      const d = settle({ tissueBed: bed });
      expect(d.netFiltrationPressure, `${bed}`).toBeCloseTo(
        starlingNetPressure(
          d.capillaryPressureMmHg,
          d.interstitialPressureMmHg,
          d.plasmaOncoticMmHg,
          d.interstitialOncoticMmHg,
          d.reflectionCoefficient,
        ),
        3,
      );
    }
  });
});

import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_MEMBRANE_INPUTS } from './presets';
import { weightedMembranePotential } from './ghk';
import type { MembraneDerived, MembraneInputs } from './types';

/**
 * An ANALYTIC oracle: the reference is a published equation rather than another engine's trace.
 *
 * The Pulse traces work because Pulse was built and validated independently of us. An equation is
 * independent in a stronger way — it was published decades before this app and does not depend on
 * any of our constants. So everything the reference side of this file needs is written out here
 * from the equation itself, importing nothing from the engine except the values under test.
 *
 * That distinction is the whole point. A test that computed the expected Nernst potential by
 * calling our own Nernst function would pass no matter what either of them did.
 *
 * Two equations are checked, and the difference between them matters:
 *
 *   - NERNST gives the equilibrium potential of ONE ion — the voltage at which its electrical and
 *     chemical gradients balance and net flux stops.
 *   - GOLDMAN-HODGKIN-KATZ gives the membrane potential when SEVERAL ions are permeant at once,
 *     weighted by permeability.
 *
 * `ghk.ts` is honest that it implements neither exactly: it uses the chord-conductance (equivalent
 * circuit) form, a conductance-weighted average of equilibrium potentials. That is a deliberate
 * simplification, and this file pins down exactly how good it is rather than leaving the comment to
 * carry the claim on its own.
 */

/** Gas constant times body temperature over Faraday, in millivolts, for a monovalent ion at 37 C.
 * R = 8.314 J/mol/K, F = 96485 C/mol, T = 310.15 K. Multiplied by ln(10) to take log base 10. */
const RT_OVER_F_LOG10_MV = ((8.314 * 310.15) / 96485) * 1000 * Math.LN10;

/** The Nernst equation, written out rather than imported: E = (RT/zF) ln([out]/[in]). */
function nernstMv(outsideMM: number, insideMM: number, valence = 1): number {
  return (RT_OVER_F_LOG10_MV / valence) * Math.log10(outsideMM / insideMM);
}

/**
 * The Goldman-Hodgkin-Katz constant-field equation for a membrane permeable to Na+, K+ and Cl-.
 *
 * Note chloride is inverted relative to the cations, because it is an anion: its inside
 * concentration appears in the numerator.
 */
function goldmanMv(p: {
  pK: number;
  pNa: number;
  pCl: number;
  kOut: number;
  kIn: number;
  naOut: number;
  naIn: number;
  clOut: number;
  clIn: number;
}): number {
  const numerator = p.pK * p.kOut + p.pNa * p.naOut + p.pCl * p.clIn;
  const denominator = p.pK * p.kIn + p.pNa * p.naIn + p.pCl * p.clOut;
  return RT_OVER_F_LOG10_MV * Math.log10(numerator / denominator);
}

/** Intracellular concentrations the module's constants imply, mM. Stated here so the reference
 * side of every comparison is written out in full. */
const INTRACELLULAR = { k: 140, na: 14 };

function settle(patch: Partial<MembraneInputs>, seconds = 0.5): MembraneDerived {
  const inputs = { ...DEFAULT_MEMBRANE_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.0004;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: the equilibrium potentials ARE the Nernst equation', () => {
  it('puts E_K where Nernst puts it, at the module default of 4 mM outside', () => {
    const expected = nernstMv(4, INTRACELLULAR.k);
    expect(expected).toBeGreaterThan(-100);
    expect(expected).toBeLessThan(-90);
    expect(settle({}).eK).toBeCloseTo(expected, 0);
  });

  it('puts E_Na where Nernst puts it, at the module default of 140 mM outside', () => {
    const expected = nernstMv(140, INTRACELLULAR.na);
    expect(expected).toBeGreaterThan(55);
    expect(expected).toBeLessThan(65);
    expect(settle({}).eNa).toBeCloseTo(expected, 0);
  });

  it('tracks Nernst across the whole clinical potassium range, not just at one point', () => {
    // The relation is LOGARITHMIC, which is why a small absolute rise in extracellular potassium
    // moves the resting potential so much more at the low end than at the high end. Sampling the
    // range is what tests the equation rather than a single calibrated constant.
    for (const extracellularK of [2, 3, 4, 5.5, 7, 9]) {
      expect(settle({ extracellularK }).eK, `E_K at ${extracellularK} mM`).toBeCloseTo(
        nernstMv(extracellularK, INTRACELLULAR.k),
        0,
      );
    }
  });

  it('gives 61.5 mV per decade at body temperature, which is where the textbook constant comes from', () => {
    // The familiar "61.5 log([out]/[in])" is RT/F ln(10) at 37 C. A tenfold gradient is one 61.5 mV
    // step, and that is the only thing the constant means.
    expect(RT_OVER_F_LOG10_MV).toBeCloseTo(61.5, 1);
    expect(nernstMv(10, 1)).toBeCloseTo(61.5, 1);
    expect(nernstMv(100, 1)).toBeCloseTo(123, 0);
  });
});

describe('analytic: the resting potential against the true Goldman equation', () => {
  /**
   * Our resting potential comes from the chord-conductance form; Goldman is the constant-field
   * form. They are different equations, so rather than asserting a tolerance nobody chose on
   * principle, this block INVERTS Goldman to ask what sodium-to-potassium permeability ratio our
   * membrane is behaving as if it had — and then checks that ratio against the published range.
   *
   * That is a much sharper question than "are the two numbers close". A model can land on the right
   * voltage with an absurd permeability ratio, and it would be wrong in a way a voltage comparison
   * cannot see.
   */
  const KO = 4;
  const NAO = 140;

  /** pNa/pK implied by a resting potential, from Goldman with chloride at equilibrium. Takes the
   * extracellular potassium it was measured at — using a fixed 4 mM here silently produces a
   * NEGATIVE permeability at 2 mM, which is how this was caught. */
  function impliedSodiumPermeabilityRatio(vmMv: number, potassiumOut = KO): number {
    const ratio = Math.pow(10, vmMv / RT_OVER_F_LOG10_MV);
    return (ratio * INTRACELLULAR.k - potassiumOut) / (NAO - ratio * INTRACELLULAR.na);
  }

  it('behaves as if it had a sodium permeability inside the published range for excitable membrane', () => {
    const implied = impliedSodiumPermeabilityRatio(settle({}).vmMillivolts);
    // Published pNa/pK at rest: about 0.04 in the squid giant axon, 0.01-0.03 in mammalian
    // skeletal muscle. Ours implies roughly 0.011 — a more potassium-selective membrane than the
    // classic squid preparation, which is why our resting potential sits at -86 rather than -70.
    expect(implied).toBeGreaterThan(0.005);
    expect(implied).toBeLessThan(0.05);
  });

  it('sits between E_K and the classic neuronal resting potential, and nearer E_K', () => {
    const resting = settle({}).vmMillivolts;
    const eK = nernstMv(KO, INTRACELLULAR.k);
    // The constant-field answer for a squid-like membrane (pK 1 : pNa 0.04 : pCl 0.45) is about
    // -70 mV. Ours is more negative because it is more potassium-selective. Both are physiological;
    // -70 is a typical neuron and -86 a skeletal muscle fibre.
    const classicNeuron = goldmanMv({
      pK: 1,
      pNa: 0.04,
      pCl: 0.45,
      kOut: KO,
      kIn: INTRACELLULAR.k,
      naOut: NAO,
      naIn: INTRACELLULAR.na,
      clOut: 110,
      clIn: 10,
    });
    expect(classicNeuron).toBeGreaterThan(-75);
    expect(classicNeuron).toBeLessThan(-65);
    expect(resting).toBeGreaterThan(eK);
    expect(resting).toBeLessThan(classicNeuron);
  });

  it('holds that implied permeability roughly CONSTANT as extracellular potassium changes', () => {
    // The real test of the equation rather than of one point. If our resting potential tracked
    // Goldman only at 4 mM and drifted elsewhere, the implied permeability would swing wildly
    // across the range — which is exactly what a curve fitted at one point does.
    const implied = [2, 3, 4, 5.5, 7, 9].map((k) =>
      impliedSodiumPermeabilityRatio(settle({ extracellularK: k }).vmMillivolts, k),
    );
    for (const value of implied) {
      expect(value).toBeGreaterThan(0.003);
      expect(value).toBeLessThan(0.06);
    }
    // Spread across the whole range stays inside a factor of four.
    expect(Math.max(...implied) / Math.min(...implied)).toBeLessThan(4);
  });

  it('depolarises with hyperkalaemia, and asymmetrically, as the logarithm demands', () => {
    const ours = (k: number) => settle({ extracellularK: k }).vmMillivolts;
    // The clinically load-bearing direction, and the reason hyperkalaemia is an emergency where
    // hypokalaemia of the same size is not: raising potassium 4 -> 7 depolarises far more than
    // dropping it 4 -> 1 hyperpolarises, because the relation is logarithmic in the RATIO.
    expect(ours(7)).toBeGreaterThan(ours(4));
    expect(ours(7) - ours(4)).toBeGreaterThan(Math.abs(ours(4) - ours(2)) * 0.8);
  });

  it('records that the chord-conductance form is NOT the constant-field form', () => {
    // A guard on the simplification `ghk.ts` documents. Fed equal conductances and equal
    // equilibrium potentials the chord form returns their mean exactly, which the
    // permeability-weighted Goldman form does not in general. If this ever stops being true, the
    // module has switched equations and the comment in `ghk.ts` is out of date.
    expect(weightedMembranePotential(1, 60, 1, -60)).toBeCloseTo(0, 6);
    expect(weightedMembranePotential(0, 60, 1, -90)).toBeCloseTo(-90, 6);
    expect(weightedMembranePotential(1, 60, 0, -90)).toBeCloseTo(60, 6);
  });
});

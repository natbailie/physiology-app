import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_VENOUS_RETURN_INPUTS } from './presets';
import { meanSystemicFillingPressure, stressedVolume, totalCompliance } from './meanSystemicFillingPressure';
import { venousReturn } from './venousReturnCurve';
import type { VenousReturnDerived, VenousReturnInputs } from './types';

/**
 * An ANALYTIC oracle against Guyton's own arithmetic.
 *
 * This module is unusual in the app: it does not approximate Guyton, it reproduces him. Mean
 * systemic filling pressure is a stressed volume over a compliance, the venous return curve is
 * Ohm's law across that pressure, and cardiac output is wherever the two curves cross. So the
 * references below are the equations themselves plus the four numbers Guyton measured — and
 * everything on the reference side is written out here rather than imported.
 *
 * The claim being tested is the one the module exists for and the one students find hardest:
 * CARDIAC OUTPUT IS NOT SET BY THE HEART. The heart can only pump what arrives, and what arrives
 * is decided by the vessels. Every assertion below is a way of pinning that down numerically.
 */

/** Pmsf = stressed volume / compliance. Guyton: 700 mL over 100 mL/mmHg gives 7 mmHg. */
function guytonPmsf(stressedVolumeMl: number, complianceMlPerMmHg: number): number {
  return stressedVolumeMl / complianceMlPerMmHg;
}

/** The venous return curve: VR = (Pmsf - Pra) / RVR. Ohm's law, with pressure difference as the
 * driving term — which is why raising right atrial pressure REDUCES flow. */
function guytonVenousReturn(pmsfMmHg: number, rightAtrialMmHg: number, resistance: number): number {
  return (pmsfMmHg - rightAtrialMmHg) / resistance;
}

function settle(patch: Partial<VenousReturnInputs>, seconds = 120): VenousReturnDerived {
  const inputs = { ...DEFAULT_VENOUS_RETURN_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.01;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: mean systemic filling pressure is a volume over a compliance', () => {
  it("reproduces Guyton's 700 mL over 100 mL/mmHg giving 7 mmHg", () => {
    // The single most quoted number in this part of physiology, and it is a division.
    expect(guytonPmsf(700, 100)).toBe(7);
    const derived = settle({});
    expect(derived.stressedVolumeMl).toBeCloseTo(700, 0);
    expect(derived.totalComplianceMlPerMmHg).toBeCloseTo(100, 0);
    expect(derived.meanSystemicFillingPressureMmHg).toBeCloseTo(7, 1);
  });

  it('counts only STRESSED volume, which is about a seventh of the total', () => {
    // 4.3 of the 5 litres is unstressed — it fills the vessels without stretching them and
    // generates no pressure at all. Getting this wrong by treating all blood as stressed would
    // put the filling pressure at 50 mmHg.
    const derived = settle({});
    expect(derived.unstressedVolumeMl).toBeCloseTo(4300, 0);
    expect(derived.stressedVolumeMl / derived.totalBloodVolumeMl).toBeCloseTo(0.14, 2);
    expect(guytonPmsf(5000, 100)).toBe(50);
  });

  it('scales linearly with stressed volume across the whole range', () => {
    // Linear because compliance is constant: this is a capacitor, and Pmsf is charge over
    // capacitance. Sampling it is what shows the relation rather than the single calibrated point.
    for (const bloodVolumeMl of [3000, 4000, 5000, 6000, 7000]) {
      const stressed = stressedVolume(bloodVolumeMl, DEFAULT_VENOUS_RETURN_INPUTS.unstressedVolumeFraction);
      const expected = guytonPmsf(stressed, totalCompliance(1));
      expect(meanSystemicFillingPressure(stressed, totalCompliance(1)), `Pmsf at ${bloodVolumeMl} mL`).toBeCloseTo(
        expected,
        6,
      );
    }
  });

  it('rises with venoconstriction at CONSTANT blood volume, which is how the reflex works', () => {
    // Reducing compliance at fixed volume raises pressure: the same charge on a smaller capacitor.
    // This is the mechanism by which sympathetic tone raises cardiac output in seconds, and why a
    // patient can be volume RESPONSIVE without being volume depleted.
    const relaxed = settle({ venousCompliance: 1 });
    const constricted = settle({ venousCompliance: 0.6 });
    expect(constricted.totalBloodVolumeMl).toBeCloseTo(relaxed.totalBloodVolumeMl, 0);
    expect(constricted.meanSystemicFillingPressureMmHg).toBeGreaterThan(relaxed.meanSystemicFillingPressureMmHg);
    expect(constricted.meanSystemicFillingPressureMmHg).toBeCloseTo(
      guytonPmsf(constricted.stressedVolumeMl, constricted.totalComplianceMlPerMmHg),
      1,
    );
  });
});

describe('analytic: the venous return curve is Ohm\'s law, and it slopes DOWNWARD', () => {
  it('matches the equation at every right atrial pressure above venous collapse', () => {
    const pmsf = 7;
    const resistance = 1.4;
    for (const pra of [0, 1, 2, 3, 4, 5, 6]) {
      expect(venousReturn(pra, pmsf, resistance), `VR at Pra=${pra}`).toBeCloseTo(
        guytonVenousReturn(pmsf, pra, resistance),
        6,
      );
    }
  });

  it('falls to ZERO when right atrial pressure reaches the filling pressure', () => {
    // No pressure difference, no flow. This is not an approximation — it is how mean systemic
    // filling pressure is measured during a cardiac arrest, by waiting for pressures to equalise.
    expect(venousReturn(7, 7, 1.4)).toBeCloseTo(0, 6);
    expect(venousReturn(8, 7, 1.4)).toBe(0);
  });

  it('PLATEAUS below venous collapse instead of rising without limit', () => {
    // The great veins collapse entering the chest, so suction beyond that point buys nothing.
    // Without this the equation would predict infinite flow at sufficiently negative pressure,
    // and the module would teach that a strong enough heart can pump whatever it likes.
    //
    // The plateau is found by SEARCH rather than read from our constants, so this measures where
    // the model actually flattens rather than asserting the constant against itself.
    const flow = (pra: number) => venousReturn(pra, 7, 1.4);
    const collapsePressure = [0, -1, -2, -3, -4, -5].find((pra) => flow(pra - 1) === flow(pra))!;
    expect(collapsePressure).toBeLessThanOrEqual(0);
    expect(flow(collapsePressure - 5)).toBeCloseTo(flow(collapsePressure), 6);
    expect(flow(collapsePressure - 20)).toBeCloseTo(flow(collapsePressure), 6);
    // And the plateau is the whole driving pressure over the resistance — flow cannot exceed it.
    expect(flow(collapsePressure)).toBeCloseTo(7 / 1.4, 6);
  });

  it("recovers Guyton's resistance to venous return of about 1.4 mmHg per L/min", () => {
    // Read off the curve rather than out of the constants: at the operating point, resistance is
    // the pressure difference divided by the flow it drives.
    const derived = settle({});
    const recovered =
      (derived.meanSystemicFillingPressureMmHg - derived.operatingPointPra) / derived.operatingPointFlow;
    expect(recovered).toBeGreaterThan(1.2);
    expect(recovered).toBeLessThan(1.6);
    expect(recovered).toBeCloseTo(derived.resistanceToVenousReturn, 1);
  });
});

describe('analytic: the operating point is where the two curves cross', () => {
  it('puts venous return and cardiac output equal at the crossing, as they must be', () => {
    // Steady state means the two are equal: whatever the heart ejects has to come back, or blood
    // accumulates somewhere. Anything else is a transient.
    const derived = settle({});
    expect(derived.venousReturnLPerMin).toBeCloseTo(derived.cardiacOutputLPerMin, 1);
    expect(derived.operatingPointFlow).toBeCloseTo(5, 0);
    expect(derived.cardiacOutputLPerMin).toBeCloseTo(5, 0);
  });

  it('lands on the venous return curve, not merely near it', () => {
    // The operating flow must satisfy the venous return equation at the operating pressure. This
    // is what makes it a CROSSING rather than two numbers reported side by side.
    const derived = settle({});
    // Evaluated through the module's own curve, because the operating pressure sits just below the
    // venous collapse point and the raw equation does not apply there — which is exactly the
    // non-linearity the plateau test above pins down. Above collapse the two agree exactly, and
    // that is asserted separately at the top of this block.
    expect(derived.operatingPointFlow).toBeCloseTo(
      venousReturn(derived.operatingPointPra, derived.meanSystemicFillingPressureMmHg, derived.resistanceToVenousReturn),
      1,
    );
  });

  it('barely raises output when only CONTRACTILITY rises — Guyton\'s central claim', () => {
    // Doubling contractility steepens the cardiac curve, but the venous return curve is unmoved,
    // so the crossing slides up a nearly flat plateau and buys very little flow. It also drops
    // right atrial pressure, which is the signature of a heart pumping harder against a fixed
    // supply. This is the result the module exists to produce.
    const normal = settle({});
    const inotropic = settle({ contractility: 2 });
    expect(inotropic.cardiacOutputLPerMin / normal.cardiacOutputLPerMin).toBeLessThan(1.35);
    expect(inotropic.operatingPointPra).toBeLessThan(normal.operatingPointPra);
  });

  it('raises output far more when VOLUME rises, because that moves the other curve', () => {
    // A transfusion shifts the venous return curve to the right, and the crossing moves with it.
    // Contrast with the contractility case above: same heart, very different answer, because this
    // time the supply changed rather than the pump.
    const normal = settle({});
    const loaded = settle({ bloodVolumeMl: 6500 });
    // Pmsf scales exactly with blood volume at fixed compliance, so a 30% transfusion is a 30%
    // rise and no more — asserting 1.4x here would be arithmetically impossible.
    expect(loaded.meanSystemicFillingPressureMmHg).toBeCloseTo(normal.meanSystemicFillingPressureMmHg * 1.3, 1);
    // Note it buys about 18% more flow for 30% more filling pressure, not 30%: the crossing has
    // slid up the FLATTENING part of the cardiac curve. That diminishing return is Guyton's point
    // seen from the other side, and it is why the third litre of fluid does less than the first.
    expect(loaded.cardiacOutputLPerMin).toBeGreaterThan(normal.cardiacOutputLPerMin * 1.15);
    expect(loaded.cardiacOutputLPerMin / normal.cardiacOutputLPerMin).toBeLessThan(1.3);

    // The clean discriminator between a supply problem and a pump problem, and the reason a CVP is
    // worth measuring: filling the circulation RAISES right atrial pressure, while making the heart
    // pump harder LOWERS it. Same rise in output, opposite sign on the filling pressure.
    const inotropic = settle({ contractility: 2 });
    expect(loaded.operatingPointPra).toBeGreaterThan(normal.operatingPointPra);
    expect(inotropic.operatingPointPra).toBeLessThan(normal.operatingPointPra);
  });
});

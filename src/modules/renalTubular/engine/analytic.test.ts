import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS } from './presets';
import type { RenalTubularDerived, RenalTubularInputs } from './types';

/**
 * An ANALYTIC oracle against the clearance identities, written out here rather than imported.
 *
 * These are DEFINITIONS rather than measurements, which makes them a different kind of reference
 * from a textbook range: clearance is U x V / P because that is what clearance means, and
 * fractional excretion is the ratio of two clearances because that is what fractional means. A
 * model that reported a fractional excretion inconsistent with its own urine and plasma values
 * would not be approximating anything — it would be self-contradictory, and a learner computing
 * the number by hand from the readouts would get a different answer from the one on screen.
 *
 * That is the specific failure this file exists to prevent, and it is not hypothetical: these are
 * exactly the calculations a student is asked to do on a data-interpretation question.
 */

/** Clearance = urine concentration x urine flow / plasma concentration. */
function clearance(urineConc: number, urineFlowMlPerMin: number, plasmaConc: number): number {
  return (urineConc * urineFlowMlPerMin) / plasmaConc;
}

/** Filtration fraction = GFR / renal plasma flow. */
function filtrationFraction(gfrMlMin: number, renalPlasmaFlowMlMin: number): number {
  return gfrMlMin / renalPlasmaFlowMlMin;
}

/** Free water clearance = V - osmolar clearance = V x (1 - Uosm/Posm). */
function freeWaterClearance(urineFlowMlPerMin: number, urineOsm: number, plasmaOsm: number): number {
  return urineFlowMlPerMin * (1 - urineOsm / plasmaOsm);
}

/** Renal plasma flow from renal blood flow and haematocrit: RPF = RBF x (1 - Hct). */
function renalPlasmaFlow(renalBloodFlowMlMin: number, haematocrit: number): number {
  return renalBloodFlowMlMin * (1 - haematocrit);
}

function settle(patch: Partial<RenalTubularInputs>, seconds = 120000): RenalTubularDerived {
  const inputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 10;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: the clearance identities hold against the module\'s own readouts', () => {
  it('makes creatinine clearance equal U x V / P, computed by hand', () => {
    // The calculation a student does on paper from the four numbers on screen. If it disagrees,
    // one of the readouts is wrong.
    const d = settle({});
    const byHand = clearance(
      // Creatinine clearance in a steady state equals production over plasma concentration, and
      // the module reports the flow and the plasma level, so the urine concentration follows.
      (d.creatinineClearanceMLMin * d.serumCreatinineMgDl) / d.urineFlowRateMLPerMin,
      d.urineFlowRateMLPerMin,
      d.serumCreatinineMgDl,
    );
    expect(byHand).toBeCloseTo(d.creatinineClearanceMLMin, 6);
  });

  it('makes filtration fraction the ratio of GFR to renal plasma flow', () => {
    for (const preset of Object.values(RENAL_TUBULAR_PRESETS)) {
      const d = settle(preset);
      expect(d.filtrationFractionPct / 100).toBeCloseTo(
        filtrationFraction(d.gfrAfterTGF, d.renalPlasmaFlowMLMin),
        2,
      );
    }
  });

  it('derives renal plasma flow from blood flow and haematocrit', () => {
    // RPF is what is actually filtered — the cells are not. At a haematocrit of 0.45 a renal blood
    // flow of about 1.1 L/min gives the classical 600 mL/min of plasma.
    expect(renalPlasmaFlow(1100, 0.45)).toBeCloseTo(605, 0);
    const d = settle({});
    expect(d.renalPlasmaFlowMLMin).toBeGreaterThan(450);
    expect(d.renalPlasmaFlowMLMin).toBeLessThan(750);
  });

  it('makes fractional excretion of sodium a ratio of two clearances', () => {
    // FENa = (U_Na x P_Cr) / (P_Na x U_Cr), which is sodium clearance over creatinine clearance.
    // It is dimensionless precisely so that it does not depend on how concentrated the urine is,
    // which is why it survives a diuretic where a spot urine sodium does not.
    const d = settle({});
    const sodiumClearance = clearance(d.urineSodiumMeqL, d.urineFlowRateMLPerMin, 140);
    expect(sodiumClearance / d.creatinineClearanceMLMin).toBeCloseTo(d.fractionalExcretionNaPct / 100, 2);
  });

  it('keeps FENa below 1% on a normal diet, as an avid tubule requires', () => {
    // More than 99% of filtered sodium is reabsorbed. That is not an approximation: filtering 25000
    // mEq a day and excreting 150 is what the number means.
    expect(settle({}).fractionalExcretionNaPct).toBeLessThan(1);
  });
});

describe('analytic: free water clearance is V x (1 - Uosm/Posm)', () => {
  it('matches the identity at the baseline and under water deprivation', () => {
    for (const [name, patch] of [
      ['baseline', {}],
      ['water deprived', { waterIntakeRate: 20 }],
      ['water loaded', { waterIntakeRate: 300 }],
    ] as const) {
      const d = settle(patch);
      expect(d.freeWaterClearance, `${name}`).toBeCloseTo(
        freeWaterClearance(d.urineFlowRateMLPerMin, d.finalUrineOsmolality, d.plasmaOsmolality),
        3,
      );
    }
  });

  it('falls toward zero as water is withheld, but does NOT yet go negative', () => {
    /**
     * A REAL GAP, recorded rather than asserted around.
     *
     * Withholding water should concentrate the urine above plasma and drive free water clearance
     * NEGATIVE — water being returned to the body. Ours moves the right way (0.35 -> 0.07 mL/min
     * as intake drops from 100% to 20%) but never crosses zero, because the urine never becomes
     * hypertonic: across the whole reachable intake range urine osmolality spans only 237-281
     * mOsm/kg against a plasma of ~281. A real kidney spans 50-1200.
     *
     * So the DIRECTION is right and the RANGE is not, and exogenous ADH does not help — see the
     * `finalUrineOsmolality` entry in `references.ts` for the write-up. This test pins the
     * direction so the gap cannot widen unnoticed, and stops short of asserting a concentrating
     * ability the module does not have.
     */
    const deprived = settle({ waterIntakeRate: 20 });
    const baseline = settle({});
    expect(deprived.freeWaterClearance).toBeLessThan(baseline.freeWaterClearance);
    expect(deprived.finalUrineOsmolality).toBeGreaterThan(baseline.finalUrineOsmolality);
    // The identity still holds exactly, which is what makes the gap a MODELLING gap rather than
    // an arithmetic one.
    expect(deprived.freeWaterClearance).toBeCloseTo(
      freeWaterClearance(deprived.urineFlowRateMLPerMin, deprived.finalUrineOsmolality, deprived.plasmaOsmolality),
      3,
    );
  });

  it('goes POSITIVE when urine is dilute, and crosses zero at isosthenuria', () => {
    const loaded = settle({ waterIntakeRate: 300 });
    expect(loaded.finalUrineOsmolality).toBeLessThan(loaded.plasmaOsmolality);
    expect(loaded.freeWaterClearance).toBeGreaterThan(0);
    // The identity is exactly zero when urine and plasma osmolality match, whatever the flow.
    expect(freeWaterClearance(5, 290, 290)).toBeCloseTo(0, 9);
  });
});

describe('analytic: the urine anion gap as a proxy for ammonium', () => {
  it('is negative in health, because unmeasured ammonium is being excreted', () => {
    // UAG = (Na + K) - Cl. Ammonium is the unmeasured cation, so a kidney excreting acid normally
    // produces a NEGATIVE gap. A positive gap in a hyperchloraemic acidosis says the kidney is the
    // problem rather than the gut, which is the entire diagnostic use of the number.
    const d = settle({});
    expect(d.urineAnionGapMeqL).toBeLessThan(-10);
  });

  it('turns positive in distal renal tubular acidosis, where ammonium excretion fails', () => {
    // Ammonium excretion needs ammoniagenesis AND distal H+ secretion to trap the NH3, so it is
    // limited by whichever is scarcer. Keyed to aldosterone alone the gap sat pinned at its -25
    // floor in every reachable state, including this one — inert in the exact scenario it exists
    // to report. See `acidHandling.ts`.
    const healthy = settle({});
    const rta = settle({ distalAcidSecretion: 0.05 });
    expect(healthy.urineAnionGapMeqL).toBeLessThan(-10);
    expect(rta.urineAnionGapMeqL).toBeGreaterThan(0);
    // With the inappropriately alkaline urine that goes with it.
    expect(rta.urinePH).toBeGreaterThan(5.5);
  });

  it('leaves the gap negative when the lesion is PROXIMAL rather than distal', () => {
    // Type 2 RTA wastes bicarbonate but the distal nephron still acidifies, so ammonium excretion
    // is preserved and the gap stays negative. That contrast is the diagnostic use of the number.
    const proximal = settle({ proximalAcidReclaim: 0.35 });
    expect(proximal.urineAnionGapMeqL).toBeLessThan(-10);
  });
});

import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './presets';
import type { RespDerived, RespInputs } from './types';

/**
 * An ANALYTIC oracle. The references here are the four equations an arterial blood gas is actually
 * read with, written out rather than imported:
 *
 *   - HENDERSON-HASSELBALCH, which is what makes pH a statement about the RATIO of bicarbonate to
 *     carbon dioxide rather than about either alone;
 *   - the ALVEOLAR GAS equation, which gives the oxygen tension the alveolus should contain;
 *   - the A-a GRADIENT that falls out of it, which is what separates hypoventilation from
 *     mismatch;
 *   - and the compensation rules (Winters and the four Boston-style bands), which say how far the
 *     partner value should have moved and therefore when a SECOND disorder must be present.
 *
 * The last of those is the reason this file is worth having. Our engine reaches its compensation by
 * integrating a chemoreceptor reflex and a renal bicarbonate handler; the rules are empirical
 * regressions fitted to patients. They are arrived at completely differently, so agreement is
 * evidence rather than bookkeeping.
 */

/** pH = 6.1 + log10(HCO3 / (0.03 x PaCO2)). */
function hendersonHasselbalch(bicarbonateMEqL: number, paCO2MmHg: number): number {
  return 6.1 + Math.log10(bicarbonateMEqL / (0.03 * paCO2MmHg));
}

/** PAO2 = FiO2 x (Patm - PH2O) - PaCO2 / R, at sea level with R = 0.8. */
function alveolarPO2(fiO2: number, paCO2MmHg: number, respiratoryQuotient = 0.8): number {
  return fiO2 * (760 - 47) - paCO2MmHg / respiratoryQuotient;
}

/** Winters' formula: the PaCO2 a fully compensated metabolic acidosis should reach. */
function wintersExpectedPaCO2(bicarbonateMEqL: number): { low: number; high: number } {
  const centre = 1.5 * bicarbonateMEqL + 8;
  return { low: centre - 2, high: centre + 2 };
}

function settle(patch: Partial<RespInputs>, seconds = 30000): RespDerived {
  const inputs = { ...DEFAULT_RESP_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('analytic: pH is Henderson-Hasselbalch, at every point we can reach', () => {
  it('holds across the whole range of disorders the module ships', () => {
    // The equation is an identity, so any disagreement is an internal inconsistency: it would mean
    // the pH shown to a learner is not the pH the displayed bicarbonate and PaCO2 imply.
    for (const [name, preset] of Object.entries(RESP_PRESETS)) {
      const d = settle(preset);
      expect(d.pH, `${name}: pH against its own HCO3 and PaCO2`).toBeCloseTo(
        hendersonHasselbalch(d.plasmaHCO3, d.paCO2),
        2,
      );
    }
  });

  it('shows pH depending on the RATIO, not on either value alone', () => {
    // Two patients with wildly different bicarbonate and PaCO2 but the same ratio have the same pH.
    // This is the single most useful thing the equation says, and it is why a normal pH never means
    // a normal blood gas.
    const retainerWithCompensation = settle(RESP_PRESETS.copdChronicAcidosis);
    expect(retainerWithCompensation.paCO2).toBeGreaterThan(60);
    expect(retainerWithCompensation.plasmaHCO3).toBeGreaterThan(28);
    // Both grossly abnormal, and the pH is far closer to normal than either component suggests.
    expect(Math.abs(retainerWithCompensation.pH - 7.4)).toBeLessThan(0.2);
  });
});

describe('analytic: oxygenation against the alveolar gas equation', () => {
  it('puts the resting A-a gradient where the alveolar gas equation puts it', () => {
    const d = settle({});
    const expectedGradient = alveolarPO2(DEFAULT_RESP_INPUTS.fiO2, d.paCO2) - d.paO2;
    expect(expectedGradient).toBeGreaterThan(0);
    expect(expectedGradient).toBeLessThan(15);
    expect(d.aaGradient).toBeCloseTo(expectedGradient, 1);
  });

  it('keeps the gradient NORMAL in pure hypoventilation and WIDE in mismatch', () => {
    // The clinical discrimination the equation exists to make. A retainer is hypoxaemic because the
    // alveolar oxygen has been displaced by carbon dioxide, so the gradient is normal; a patient
    // with mismatch is hypoxaemic across an intact alveolus, so it is not.
    const retainer = settle(RESP_PRESETS.copdChronicAcidosis);
    const exacerbation = settle(RESP_PRESETS.copdExacerbation);

    expect(retainer.aaGradient).toBeLessThan(15);
    expect(exacerbation.aaGradient).toBeGreaterThan(40);
    // And the retainer's hypoxaemia is fully explained by its CO2: predicted PaO2 from the
    // equation alone lands within a few mmHg of the measured one.
    expect(Math.abs(alveolarPO2(0.21, retainer.paCO2) - retainer.aaGradient - retainer.paO2)).toBeLessThan(2);
  });

  it('raises alveolar oxygen the way the equation says supplemental oxygen must', () => {
    // FiO2 enters the equation linearly through the barometric term, so the alveolar tension rises
    // roughly 7 mmHg per percentage point of inspired oxygen at sea level.
    const room = settle({});
    const supplemented = settle({ fiO2: 0.4 });
    const predictedRise = alveolarPO2(0.4, supplemented.paCO2) - alveolarPO2(0.21, room.paCO2);
    expect(predictedRise).toBeGreaterThan(100);
    expect(supplemented.paO2 - room.paO2).toBeGreaterThan(predictedRise * 0.8);
  });
});

describe('analytic: compensation against the published rules', () => {
  it("reaches the PaCO2 Winters' formula predicts for a metabolic acidosis", () => {
    // Ours gets there by integrating a chemoreceptor reflex; Winters is a regression fitted to
    // patients. Two completely different routes to the same number is what makes this evidence.
    const dka = settle(RESP_PRESETS.dkaMetabolicAcidosis);
    expect(dka.plasmaHCO3).toBeLessThan(20);
    const expected = wintersExpectedPaCO2(dka.plasmaHCO3);
    // Widened by 4 mmHg beyond Winters' own +/-2 band: our respiratory drive is a modelled reflex
    // with a ceiling rather than a fitted line, and the ceiling is deliberate — see
    // VENTILATION.MAX_CHEMO_VENTILATION_GAIN.
    expect(dka.paCO2).toBeGreaterThan(expected.low - 4);
    expect(dka.paCO2).toBeLessThan(expected.high + 4);
  });

  it('compensates a chronic respiratory acidosis at roughly the published 3.5 mEq per 10 mmHg', () => {
    // The chronic band: bicarbonate rises about 3.5 mEq/L for every 10 mmHg of PaCO2 above 40,
    // against about 1 mEq/L in the acute phase. That difference is how a chronic retainer is told
    // from an acute one on a single gas.
    const normal = settle({});
    const retainer = settle(RESP_PRESETS.copdChronicAcidosis);
    const co2Rise = retainer.paCO2 - normal.paCO2;
    const bicarbRise = retainer.plasmaHCO3 - normal.plasmaHCO3;
    expect(co2Rise).toBeGreaterThan(20);
    const perTenMmHg = (bicarbRise / co2Rise) * 10;
    expect(perTenMmHg).toBeGreaterThan(1.5);
    expect(perTenMmHg).toBeLessThan(5.5);
  });

  it('never fully normalises the pH by compensation alone', () => {
    // The rule with no exceptions in acid-base, and the one that makes a normal pH with abnormal
    // components diagnostic of a MIXED disorder rather than of a well-compensated single one.
    for (const name of ['copdChronicAcidosis', 'dkaMetabolicAcidosis', 'pyloricStenosis'] as const) {
      const d = settle(RESP_PRESETS[name]);
      expect(Math.abs(d.pH - 7.4), `${name} overcompensated to a normal pH`).toBeGreaterThan(0.01);
    }
  });
});

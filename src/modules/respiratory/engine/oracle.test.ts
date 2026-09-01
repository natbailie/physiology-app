/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './presets';
import type { RespDerived, RespInputs } from './types';

/**
 * Reference trace from Pulse's COPD exacerbation scenario — see `tools/pulse-oracle/`.
 *
 * The trace is used for two different things. First as a calibration check on the normal ABG.
 * Second, and more usefully, as an independent oxygen dissociation curve: across the scenario
 * Pulse's PaO2 falls from 89 mmHg to 27, so its 103 samples trace out the whole sigmoid, and we
 * can ask whether our curve passes through the same points. That is a test of one mechanism
 * rather than of a whole preset, which is why it is worth more than it looks.
 *
 * Note the unit difference: Pulse reports `OxygenSaturation` as a FRACTION, our `saO2` is a
 * percentage.
 */

interface OracleSample {
  t: number;
  arterialPH: number;
  paO2MmHg: number;
  paCO2MmHg: number;
  bicarbonateMEqL: number;
  oxygenSaturation: number;
  respirationRatePerMin: number;
  tidalVolumeMl: number;
  totalAlveolarVentilationLPerMin: number;
  endTidalCO2MmHg: number;
}

interface OracleTrace {
  landmarks: Record<string, number>;
  samples: OracleSample[];
}

const trace = JSON.parse(
  readFileSync(fileURLToPath(new URL('./__oracle__/copd-exacerbation.json', import.meta.url)), 'utf8'),
) as OracleTrace;

function at(landmark: string): OracleSample {
  const t = trace.landmarks[landmark];
  const sample = trace.samples.find((s) => s.t === t);
  if (!sample) throw new Error(`no sample at landmark "${landmark}" (t=${t})`);
  return sample;
}

function settle(patch: Partial<RespInputs>, seconds = 3000): RespDerived {
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

/** Linear interpolation of saturation at a given PaO2, over a curve sorted by PaO2. */
function saturationAt(curve: { paO2: number; saO2: number }[], paO2: number): number {
  const sorted = [...curve].sort((a, b) => a.paO2 - b.paO2);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) throw new Error('empty curve');
  if (paO2 <= first.paO2 || paO2 >= last.paO2) {
    throw new Error(`PaO2 ${paO2} is outside the curve (${first.paO2}-${last.paO2})`);
  }
  for (let i = 1; i < sorted.length; i += 1) {
    const lo = sorted[i - 1];
    const hi = sorted[i];
    if (!lo || !hi || hi.paO2 < paO2) continue;
    const span = hi.paO2 - lo.paO2;
    if (span === 0) return lo.saO2;
    return lo.saO2 + ((paO2 - lo.paO2) / span) * (hi.saO2 - lo.saO2);
  }
  throw new Error(`no bracketing samples for PaO2 ${paO2}`);
}

const pulseBaseline = at('baseline');
const pulseSevere = at('severe');
const ourNormal = settle(RESP_PRESETS.normal);

// Pulse's own curve, read off the whole scenario as its PaO2 falls from 89 to 27.
const pulseCurve = trace.samples.map((s) => ({ paO2: s.paO2MmHg, saO2: s.oxygenSaturation * 100 }));
// Ours, swept by dropping inspired oxygen — the only input that moves PaO2 without moving CO2.
const ourCurve = [0.21, 0.19, 0.18, 0.17, 0.16, 0.15, 0.14, 0.13, 0.12, 0.115, 0.11, 0.105, 0.1].map((fiO2) => {
  const d = settle({ fiO2 });
  return { paO2: d.paO2, saO2: d.saO2 };
});

describe('oracle: the trace is the scenario it claims to be', () => {
  it('starts from a healthy gas and ends in severe hypoxaemia', () => {
    expect(pulseBaseline.paO2MmHg).toBeGreaterThan(80);
    expect(pulseBaseline.oxygenSaturation).toBeGreaterThan(0.95);
    expect(pulseSevere.paO2MmHg).toBeLessThan(40);
    expect(pulseSevere.oxygenSaturation).toBeLessThan(0.7);
  });

  it('sweeps enough of the dissociation curve to be worth interpolating', () => {
    // The whole point of using this scenario is the range it covers.
    expect(pulseBaseline.paO2MmHg - pulseSevere.paO2MmHg).toBeGreaterThan(50);
  });
});

describe('oracle: baseline arterial blood gas agrees with an independently validated engine', () => {
  const checks = [
    ['pH', () => ourNormal.pH, () => pulseBaseline.arterialPH, 0.05],
    ['PaCO2', () => ourNormal.paCO2, () => pulseBaseline.paCO2MmHg, 5],
    ['PaO2', () => ourNormal.paO2, () => pulseBaseline.paO2MmHg, 10],
    ['bicarbonate', () => ourNormal.plasmaHCO3, () => pulseBaseline.bicarbonateMEqL, 3],
    ['oxygen saturation', () => ourNormal.saO2, () => pulseBaseline.oxygenSaturation * 100, 2],
  ] as const;

  for (const [label, ours, theirs, tolerance] of checks) {
    it(`puts a normal adult's ${label} where Pulse does`, () => {
      expect(Math.abs(ours() - theirs())).toBeLessThan(tolerance);
    });
  }
});

describe('oracle: our oxygen dissociation curve is Pulse’s curve', () => {
  it('overlaps Pulse across the range the assertions below use', () => {
    // Pulse's scenario only reaches PaO2 89.3 at its healthiest, so 85 is the top of the
    // comparable range — asserting above that would silently extrapolate.
    const span = (c: { paO2: number }[]) => [Math.min(...c.map((p) => p.paO2)), Math.max(...c.map((p) => p.paO2))];
    const [ourLow, ourHigh] = span(ourCurve);
    const [theirLow, theirHigh] = span(pulseCurve);
    expect(Math.max(ourLow ?? 0, theirLow ?? 0)).toBeLessThan(30);
    expect(Math.min(ourHigh ?? 0, theirHigh ?? 0)).toBeGreaterThan(85);
  });

  // The flat upper part and the steep part are asserted separately because they fail for
  // different reasons: the plateau is set by the maximum carriage, the steep limb by the P50.
  for (const paO2 of [85, 80, 70, 60]) {
    it(`agrees within 6% saturation on the flat part, at PaO2 ${paO2}`, () => {
      expect(Math.abs(saturationAt(ourCurve, paO2) - saturationAt(pulseCurve, paO2))).toBeLessThan(6);
    });
  }

  for (const paO2 of [50, 40, 30]) {
    it(`agrees within 8% saturation on the steep limb, at PaO2 ${paO2}`, () => {
      expect(Math.abs(saturationAt(ourCurve, paO2) - saturationAt(pulseCurve, paO2))).toBeLessThan(8);
    });
  }

  it('puts the clinical 90% threshold at a PaO2 of about 60, as Pulse does', () => {
    // The landmark every student is taught, and the one that decides who gets oxygen.
    expect(saturationAt(ourCurve, 60)).toBeGreaterThan(87);
    expect(saturationAt(ourCurve, 60)).toBeLessThan(93);
    expect(saturationAt(pulseCurve, 60)).toBeGreaterThan(87);
    expect(saturationAt(pulseCurve, 60)).toBeLessThan(93);
  });

  it('keeps the plateau flat in both engines — a big PaO2 fall costs little saturation', () => {
    expect(saturationAt(ourCurve, 85) - saturationAt(ourCurve, 70)).toBeLessThan(6);
    expect(saturationAt(pulseCurve, 85) - saturationAt(pulseCurve, 70)).toBeLessThan(6);
  });

  it('makes the steep limb genuinely steep in both engines', () => {
    // Same 20 mmHg drop, far down the curve, must cost much more saturation than on the plateau.
    expect(saturationAt(ourCurve, 50) - saturationAt(ourCurve, 30)).toBeGreaterThan(15);
    expect(saturationAt(pulseCurve, 50) - saturationAt(pulseCurve, 30)).toBeGreaterThan(15);
  });
});

/**
 * The two COPD patients, and the reason there had to be two.
 *
 * Pulse's exacerbation is dominated by hypoxaemia — PaO2 89 -> 27 mmHg — with only mild CO2
 * retention (40 -> 45). Our `copdChronicAcidosis` preset is pure hypoventilation, PaCO2 71 with a
 * normal A-a gradient, which is a real patient but a different one. Both are now shipped, and what
 * separates them is a mechanism rather than a severity: hypoventilation moves O2 and CO2 together
 * in the ratio the alveolar gas equation fixes, while V/Q mismatch pulls them apart.
 */
describe('oracle: hypoxaemia out of proportion to hypercapnia is a different lesion', () => {
  const chronic = settle(RESP_PRESETS.copdChronicAcidosis);
  const exacerbation = settle(RESP_PRESETS.copdExacerbation);
  const severe = at('severe');

  it('reproduces Pulse’s exacerbation gases, which the retainer preset could not', () => {
    expect(exacerbation.paO2).toBeGreaterThan(severe.paO2MmHg - 10);
    expect(exacerbation.paO2).toBeLessThan(severe.paO2MmHg + 10);
    expect(exacerbation.paCO2).toBeGreaterThan(severe.paCO2MmHg - 8);
    expect(exacerbation.paCO2).toBeLessThan(severe.paCO2MmHg + 8);
    // Pulse reports saturation as a FRACTION; ours is a percentage.
    expect(Math.abs(exacerbation.saO2 - severe.oxygenSaturation * 100)).toBeLessThan(10);
  });

  it('separates the two patients by MECHANISM, not by severity', () => {
    // The retainer: CO2 high, gradient normal — every mmHg of oxygen lost is explained by the CO2.
    expect(chronic.paCO2).toBeGreaterThan(60);
    expect(chronic.aaGradient).toBeLessThan(15);
    // The exacerbation: CO2 near normal, gradient wide. Same disease, opposite blood gas.
    expect(exacerbation.paCO2).toBeLessThan(55);
    expect(exacerbation.aaGradient).toBeGreaterThan(40);
    // And it is the more hypoxaemic of the two despite the better CO2, which is the whole point.
    expect(exacerbation.paO2).toBeLessThan(chronic.paO2);
  });

  it('leaves the acid-base half of the exacerbation looking reassuring', () => {
    // The trap: a learner reading pH and bicarbonate alone finds nothing wrong with a patient whose
    // saturation is in the fifties.
    expect(exacerbation.pH).toBeGreaterThan(7.35);
    expect(exacerbation.pH).toBeLessThan(7.45);
    expect(exacerbation.saO2).toBeLessThan(70);
  });
});

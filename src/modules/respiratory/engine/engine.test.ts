import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAirwayObstruction, step } from './engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './presets';
import { BICARBONATE } from './constants';
import type { RespInputs, RespState } from './types';

function runFor(inputs: RespInputs, seconds: number, dt = 1, startState?: RespState) {
  let state = startState ?? createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return { state, derived };
}

describe('engine — baseline steady state', () => {
  it('settles near normal PaCO2/pH/HCO3-/SaO2', () => {
    const { state, derived } = runFor(DEFAULT_RESP_INPUTS, 3600);
    expect(derived.paCO2).toBeGreaterThan(37);
    expect(derived.paCO2).toBeLessThan(43);
    expect(derived.pH).toBeGreaterThan(7.37);
    expect(derived.pH).toBeLessThan(7.43);
    expect(state.plasmaHCO3).toBeGreaterThan(22);
    expect(state.plasmaHCO3).toBeLessThan(26);
    expect(derived.saO2).toBeGreaterThan(95);
  });

  it('never produces NaN/Infinity, and keeps pH/HCO3/PaCO2/PaO2/SaO2 within physiologic clamps', () => {
    const extremes: RespInputs[] = [];
    for (const minuteVentilation of [20, 300]) {
      for (const fiO2 of [0.05, 1.0]) {
        for (const co2Production of [50, 300]) {
          for (const metabolicAcidLoad of [-100, 100]) {
            for (const renalCompensationCapacity of [0, 1.5]) {
              for (const acidType of ['anionGap', 'hyperchloraemic'] as const) {
                for (const vqMismatch of [0, 1]) {
                  extremes.push({
                    minuteVentilation,
                    fiO2,
                    co2Production,
                    metabolicAcidLoad,
                    acidType,
                    renalCompensationCapacity,
                    vqMismatch,
                  });
                }
              }
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { state, derived } = runFor(inputs, 600, 1);
      // Every NUMERIC derived value must be finite. The panel also carries the two expected-
      // compensation bands (null when the disorder is not of that kind) and the interpretation
      // itself, so the sweep checks the bands element-wise rather than treating them as scalars.
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value !== 'number') continue;
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
      }
      for (const band of [derived.expectedPaCO2Range, derived.expectedHCO3Range]) {
        if (band === null) continue;
        expect(band.every(Number.isFinite), `band finite for ${JSON.stringify(inputs)}`).toBe(true);
        expect(band[0]).toBeLessThan(band[1]);
      }
      expect(typeof derived.interpretation.label).toBe('string');
      // Henderson-Hasselbalch pH at the extremes of the HCO3-/PaCO2 clamps (HCO3 5-45,
      // PaCO2 10-150) ranges roughly 6.1-8.3 — wider than any real survivable pH, but this
      // sweep intentionally covers input combinations far outside physiologic norms.
      expect(derived.pH).toBeGreaterThan(6.0);
      expect(derived.pH).toBeLessThan(8.5);
      expect(state.plasmaHCO3).toBeGreaterThanOrEqual(BICARBONATE.MIN_MEQ_L - 1e-6);
      expect(state.plasmaHCO3).toBeLessThanOrEqual(BICARBONATE.MAX_MEQ_L + 1e-6);
      expect(derived.saO2).toBeGreaterThanOrEqual(0);
      expect(derived.saO2).toBeLessThanOrEqual(100);
    }
  });
});

describe('engine — acute bronchospasm', () => {
  it('acutely worsens gas exchange, then recovers as obstruction resolves', () => {
    const baseline = runFor(DEFAULT_RESP_INPUTS, 600).state;
    const obstructed = perturbAirwayObstruction(baseline);
    const immediate = computeDerived(obstructed, DEFAULT_RESP_INPUTS);
    const baselineDerived = computeDerived(baseline, DEFAULT_RESP_INPUTS);

    expect(immediate.paCO2).toBeGreaterThan(baselineDerived.paCO2);
    expect(immediate.paO2).toBeLessThan(baselineDerived.paO2);
    expect(immediate.pH).toBeLessThan(baselineDerived.pH);

    // The fast chemoreceptor drive should already be pushing back within seconds.
    const soon = runFor(DEFAULT_RESP_INPUTS, 10, 1, obstructed);
    expect(soon.derived.chemoreceptorDrive).toBeGreaterThan(0);

    const recovered = runFor(DEFAULT_RESP_INPUTS, 600, 1, obstructed);
    expect(recovered.state.airwayObstruction).toBeLessThan(obstructed.airwayObstruction * 0.2);
    expect(recovered.derived.paCO2).toBeLessThan(immediate.paCO2);
  });
});

describe('engine — COPD (chronic respiratory acidosis with renal compensation)', () => {
  it('sustains elevated PaCO2 with renal compensation raising HCO3- and partially normalizing pH', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.copdChronicAcidosis };
    const { state, derived } = runFor(inputs, 10800);

    expect(derived.paCO2).toBeGreaterThan(45);
    expect(state.plasmaHCO3).toBeGreaterThan(BICARBONATE.BASELINE_MEQ_L);
    expect(derived.pH).toBeGreaterThan(7.25);
    expect(derived.pH).toBeLessThan(7.4);
    expect(derived.renalCompensationDrive).toBeGreaterThan(0);
  });
});

describe('engine — supplemental O2 in a chronic CO2 retainer', () => {
  const copd: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.copdChronicAcidosis };

  it('leaves the retainer hypoxaemic on room air, which is what earns them oxygen', () => {
    const { derived } = runFor(copd, 10800);
    expect(derived.paO2).toBeLessThan(60);
    expect(derived.saO2).toBeLessThan(90);
    expect(derived.paCO2).toBeGreaterThan(60);
  });

  it('raises PaCO2 while improving SaO2 — the titrate-to-target trade-off, not a free win', () => {
    const roomAir = runFor(copd, 10800);
    const onOxygen = runFor({ ...copd, fiO2: 0.6 }, 900, 1, roomAir.state);

    // Oxygenation genuinely improves — the intervention is not simply harmful.
    expect(onOxygen.derived.saO2).toBeGreaterThan(roomAir.derived.saO2);
    expect(onOxygen.derived.paO2).toBeGreaterThan(roomAir.derived.paO2);

    // ...and it costs ventilation, because the hypoxic component of drive is withdrawn.
    expect(onOxygen.derived.chemoreceptorDrive).toBeLessThan(roomAir.derived.chemoreceptorDrive);
    expect(onOxygen.derived.effectiveMinuteVentilation).toBeLessThan(roomAir.derived.effectiveMinuteVentilation);

    // A rise a learner can actually see on the readout, not a rounding artefact.
    const rise = (onOxygen.derived.paCO2 - roomAir.derived.paCO2) / roomAir.derived.paCO2;
    expect(rise).toBeGreaterThan(0.05);
    expect(onOxygen.derived.pH).toBeLessThan(roomAir.derived.pH);
  });

  it('does not raise PaCO2 in a patient who was never hypoxaemic', () => {
    // The same intervention on healthy lungs: no hypoxic drive to withdraw, so nothing to lose.
    const roomAir = runFor(DEFAULT_RESP_INPUTS, 3600);
    const onOxygen = runFor({ ...DEFAULT_RESP_INPUTS, fiO2: 0.6 }, 900, 1, roomAir.state);
    expect(onOxygen.derived.paCO2).toBeCloseTo(roomAir.derived.paCO2, 1);
  });

  it('still cannot fully compensate the hypoventilation — the ventilation cap holds', () => {
    // The reflex must not normalize PaCO2; that COPD stays hypercapnic is the point of the cap.
    const { derived } = runFor(copd, 10800);
    expect(derived.effectiveMinuteVentilation).toBeLessThan(DEFAULT_RESP_INPUTS.minuteVentilation);
    expect(derived.paCO2).toBeGreaterThan(45);
  });
});

describe('engine — panic attack (acute, uncompensated respiratory alkalosis)', () => {
  it('shows low PaCO2 and high pH with only mild HCO3- change at a short duration', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.panicHyperventilation };
    const { state, derived } = runFor(inputs, 30);

    expect(derived.paCO2).toBeLessThan(32);
    expect(derived.pH).toBeGreaterThan(7.45);
    expect(state.plasmaHCO3).toBeGreaterThan(BICARBONATE.BASELINE_MEQ_L - 4);
  });
});

describe('engine — DKA (metabolic acidosis with respiratory/Kussmaul compensation)', () => {
  it('produces reduced HCO3-, compensatorily low PaCO2 emerging from chemoreceptor drive alone, and acidemia', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.dkaMetabolicAcidosis };
    const { state, derived } = runFor(inputs, 3600 * 6);

    expect(inputs.minuteVentilation).toBe(DEFAULT_RESP_INPUTS.minuteVentilation);
    expect(state.plasmaHCO3).toBeLessThan(18);
    expect(derived.paCO2).toBeLessThan(38);
    expect(derived.pH).toBeLessThan(7.38);
    expect(derived.chemoreceptorDrive).toBeGreaterThan(0);
  });
});

describe('engine — high altitude (hypoxic respiratory alkalosis)', () => {
  it('produces hypoxemia driving compensatory hyperventilation and mild alkalosis', () => {
    const inputs: RespInputs = { ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS.highAltitude };
    const { derived } = runFor(inputs, 1800);

    expect(derived.paO2).toBeLessThan(55);
    expect(derived.saO2).toBeLessThan(88);
    expect(derived.paCO2).toBeLessThan(38);
    expect(derived.pH).toBeGreaterThan(7.4);
  });
});

describe('engine — acid production meets acid clearance', () => {
  const withLoad = (metabolicAcidLoad: number) =>
    runFor({ ...DEFAULT_RESP_INPUTS, metabolicAcidLoad }, 4000, 0.5);

  it('settles a mild acid load at a mildly low bicarbonate rather than consuming all of it', () => {
    // Acid is metabolised and excreted as well as produced, so a fixed production rate reaches
    // a fixed deficit. Without a clearance term the model had production and no disposal, and
    // every sustained load — trivial or lethal — ended at the same floored bicarbonate.
    const { derived } = withLoad(15);
    expect(derived.plasmaHCO3).toBeGreaterThan(17);
    expect(derived.plasmaHCO3).toBeLessThan(23);
    expect(derived.pH).toBeGreaterThan(7.28);
  });

  it('grades severity: a larger load settles at a lower bicarbonate and a lower pH', () => {
    const mild = withLoad(15);
    const severe = withLoad(70);
    expect(severe.derived.plasmaHCO3).toBeLessThan(mild.derived.plasmaHCO3 - 4);
    expect(severe.derived.pH).toBeLessThan(mild.derived.pH - 0.03);
  });

  it('holds a steady state instead of drifting on toward the clamp', () => {
    const early = runFor({ ...DEFAULT_RESP_INPUTS, metabolicAcidLoad: 40 }, 2000, 0.5);
    const late = runFor({ ...DEFAULT_RESP_INPUTS, metabolicAcidLoad: 40 }, 6000, 0.5);
    expect(Math.abs(late.derived.plasmaHCO3 - early.derived.plasmaHCO3)).toBeLessThan(1);
  });

  it('widens the anion gap for an organic acid and leaves it alone for a hyperchloraemic one', () => {
    const organic = runFor({ ...DEFAULT_RESP_INPUTS, metabolicAcidLoad: 45, acidType: 'anionGap' }, 4000, 0.5);
    const chloride = runFor({ ...DEFAULT_RESP_INPUTS, metabolicAcidLoad: 45, acidType: 'hyperchloraemic' }, 4000, 0.5);
    // Same acid load, so the pH and the bicarbonate are identical...
    expect(organic.derived.pH).toBeCloseTo(chloride.derived.pH, 6);
    expect(organic.derived.plasmaHCO3).toBeCloseTo(chloride.derived.plasmaHCO3, 6);
    // ...and only the gap tells them apart.
    expect(organic.derived.anionGapMEqL).toBeGreaterThan(chloride.derived.anionGapMEqL + 8);
  });
});

describe('engine — chemical buffering and the kidney are separate defences', () => {
  it('answers an acute CO2 rise with buffering long before the kidney has moved', () => {
    const early = runFor({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 40 }, 120, 0.25);
    expect(early.state.bufferOffsetMEqL).toBeGreaterThan(early.state.renalOffsetMEqL);
  });

  it('and with renal compensation once it has had time — the arm that does the heavy lifting', () => {
    const late = runFor({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 40 }, 4000, 0.5);
    expect(late.state.renalOffsetMEqL).toBeGreaterThan(late.state.bufferOffsetMEqL);
  });

  it('never fully normalises the pH, because the kidney runs out of capacity', () => {
    // Compensation restores the RATIO far enough to survive and then stops. A chronic retainer
    // whose pH reached 7.40 would mean the disorder had been cured, not compensated.
    const { derived } = runFor({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 30 }, 8000, 0.5);
    expect(derived.pH).toBeLessThan(7.36);
    expect(derived.paCO2).toBeGreaterThan(60);
  });
});

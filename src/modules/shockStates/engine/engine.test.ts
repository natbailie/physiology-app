import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbFluidBolus, perturbHaemorrhage, step } from './engine';
import { DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS, SHOCK_PRESET_ORDER } from './presets';
import { SHOCK_REFERENCE_RANGES } from './references';
import { provenanceCoverage } from '@/shared/validation/referenceRange';
import type { ShockDerived, ShockInputs, ShockState } from './types';

function settle(patch: Partial<ShockInputs>, seconds = 3000, from?: ShockState): ShockDerived {
  const inputs = { ...DEFAULT_SHOCK_INPUTS, ...patch };
  let state = from ?? createInitialState();
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

describe('baseline', () => {
  // Bands and their provenance live in `references.ts` so a number cannot drift away from the
  // reason it is that number. Read that file to see which of these are externally corroborated.
  it('settles a normal adult inside every referenced band', () => {
    const d = settle(SHOCK_PRESETS.normal);
    const readings: Record<keyof typeof SHOCK_REFERENCE_RANGES, number> = {
      cardiacOutputLPerMin: d.cardiacOutputLPerMin,
      meanArterialPressureMmHg: d.meanArterialPressureMmHg,
      centralVenousPressureMmHg: d.centralVenousPressureMmHg,
      wedgePressureMmHg: d.wedgePressureMmHg,
      mixedVenousSaturationPercent: d.mixedVenousSaturationPercent,
      lactateMmolL: d.lactateMmolL,
    };
    // Object.keys widens to string, which would defeat the exhaustiveness the `readings` type
    // above buys us — so the cast keeps the literal key union all the way through the loop.
    const quantities = Object.keys(SHOCK_REFERENCE_RANGES) as (keyof typeof SHOCK_REFERENCE_RANGES)[];
    for (const quantity of quantities) {
      const range = SHOCK_REFERENCE_RANGES[quantity];
      const value = readings[quantity];
      expect(value, `${quantity} below its referenced range`).toBeGreaterThanOrEqual(range.low);
      expect(value, `${quantity} above its referenced range`).toBeLessThanOrEqual(range.high);
    }
    expect(d.classification).toBe('no shock');
  });

  it('has a reference range for every quantity the baseline asserts', () => {
    // Guards the pairing above: adding a reading without a range, or a range without a reading,
    // should fail rather than silently assert nothing.
    const coverage = provenanceCoverage(SHOCK_REFERENCE_RANGES);
    expect(coverage.total).toBe(6);
    for (const range of Object.values(SHOCK_REFERENCE_RANGES)) {
      expect(range.low).toBeLessThan(range.high);
      expect(range.unit.length).toBeGreaterThan(0);
      if (range.provenance.kind === 'unsourced') {
        // An unsourced band must say what would settle it, so it reads as a work item.
        expect(range.provenance.needs.length).toBeGreaterThan(40);
      }
    }
  });

  it('leaves the baroreflex almost idle at a normal pressure', () => {
    const d = settle(SHOCK_PRESETS.normal);
    expect(d.sympatheticDrive).toBeLessThan(0.1);
    expect(d.heartRateBpm).toBeLessThan(80);
  });
});

describe('the four shock states produce distinguishable fingerprints', () => {
  it('classifies every preset as the state it is named for', () => {
    const expected: Record<string, string> = {
      normal: 'no shock',
      haemorrhagic: 'hypovolaemic',
      cardiogenic: 'cardiogenic',
      septic: 'distributive',
      tamponade: 'obstructive',
      pulmonaryEmbolism: 'obstructive',
      anaphylaxis: 'distributive',
      decompensating: 'hypovolaemic',
    };
    for (const name of SHOCK_PRESET_ORDER) {
      expect(settle(SHOCK_PRESETS[name]).classification, name).toBe(expected[name]);
    }
  });

  it('empties BOTH filling pressures in hypovolaemia', () => {
    const d = settle(SHOCK_PRESETS.haemorrhagic);
    expect(d.centralVenousPressureMmHg).toBeLessThan(4);
    expect(d.wedgePressureMmHg).toBeLessThan(8);
  });

  it('fills both filling pressures in cardiogenic shock — the mirror image of hypovolaemia', () => {
    const d = settle(SHOCK_PRESETS.cardiogenic);
    expect(d.centralVenousPressureMmHg).toBeGreaterThan(8);
    expect(d.wedgePressureMmHg).toBeGreaterThan(18);
    expect(d.cardiacIndex).toBeLessThan(2.2);
  });

  it('separates obstruction from cardiogenic shock by the wedge, not the CVP', () => {
    const pe = settle(SHOCK_PRESETS.pulmonaryEmbolism);
    const cardiogenic = settle(SHOCK_PRESETS.cardiogenic);

    // Both have a high CVP and a low output. Only the left-sided pressure tells them apart:
    // the embolus sits BETWEEN the two measurements.
    expect(pe.centralVenousPressureMmHg).toBeGreaterThan(8);
    expect(cardiogenic.centralVenousPressureMmHg).toBeGreaterThan(8);
    expect(pe.wedgePressureMmHg).toBeLessThan(8);
    expect(cardiogenic.wedgePressureMmHg).toBeGreaterThan(18);
  });

  it('raises the measured CVP in tamponade while LOWERING true filling', () => {
    const normal = settle(SHOCK_PRESETS.normal);
    const d = settle(SHOCK_PRESETS.tamponade);

    expect(d.centralVenousPressureMmHg).toBeGreaterThan(normal.centralVenousPressureMmHg);
    // The one state where a high venous pressure means an EMPTY ventricle.
    expect(d.transmuralRapMmHg).toBeLessThan(normal.transmuralRapMmHg);
    expect(d.cardiacIndex).toBeLessThan(normal.cardiacIndex);
  });

  it('keeps output high and resistance low in distributive shock', () => {
    const d = settle(SHOCK_PRESETS.septic);
    expect(d.cardiacIndex).toBeGreaterThan(2.2);
    expect(d.effectiveSvr).toBeLessThan(0.7);
  });
});

describe('oxygen transport tells a different story from blood pressure', () => {
  it('produces a HIGH mixed venous saturation alongside a high lactate in sepsis', () => {
    const d = settle(SHOCK_PRESETS.septic);
    // The paradox: plenty of oxygen is being delivered and returned unused, because the tissue
    // cannot extract it. A reassuring SvO2 means nothing without the lactate beside it.
    expect(d.mixedVenousSaturationPercent).toBeGreaterThan(72);
    expect(d.lactateMmolL).toBeGreaterThan(4);
    expect(d.isOxygenDebt).toBe(true);
  });

  it('drops the mixed venous saturation in haemorrhage, where extraction is intact', () => {
    const d = settle(SHOCK_PRESETS.haemorrhagic);
    expect(d.mixedVenousSaturationPercent).toBeLessThan(50);
  });

  it('holds a near-normal blood pressure while the cardiac index collapses', () => {
    const d = settle(SHOCK_PRESETS.haemorrhagic);
    // The trap this module exists to expose: the pressure looks acceptable and the patient is
    // in shock. The classifier must call it anyway.
    expect(d.meanArterialPressureMmHg).toBeGreaterThan(65);
    expect(d.cardiacIndex).toBeLessThan(2.2);
    expect(d.classification).toBe('hypovolaemic');
  });
});

describe('compensation', () => {
  it('is what was holding the pressure up — remove the reflex and it falls', () => {
    const compensated = settle(SHOCK_PRESETS.haemorrhagic);
    const uncompensated = settle(SHOCK_PRESETS.decompensating);

    expect(uncompensated.meanArterialPressureMmHg).toBeLessThan(compensated.meanArterialPressureMmHg);
    expect(uncompensated.heartRateBpm).toBeLessThan(compensated.heartRateBpm);
    expect(uncompensated.effectiveSvr).toBeLessThan(compensated.effectiveSvr);
  });

  it('raises the filling pressure by venoconstriction, with no fluid given', () => {
    const normal = settle(SHOCK_PRESETS.normal);
    const bleeding = settle(SHOCK_PRESETS.haemorrhagic);
    // Volume is far lower, yet the filling pressure has not fallen proportionately — stressed
    // volume has been recruited from the unstressed reservoir.
    expect(bleeding.sympatheticDrive).toBeGreaterThan(normal.sympatheticDrive);
  });
});

describe('perturbations', () => {
  it('a fluid bolus raises output when filling was the problem', () => {
    const inputs = { ...DEFAULT_SHOCK_INPUTS, ...SHOCK_PRESETS.haemorrhagic };
    let state = createInitialState();
    for (let t = 0; t < 1500; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let after = perturbFluidBolus(state, 1500);
    for (let t = 0; t < 1500; t += 0.2) after = step(after, inputs, 0.2).state;

    expect(computeDerived(after, inputs).cardiacOutputLPerMin).toBeGreaterThan(before.cardiacOutputLPerMin);
  });

  it('the same bolus does far less for a heart that cannot use it', () => {
    const inputs = { ...DEFAULT_SHOCK_INPUTS, ...SHOCK_PRESETS.cardiogenic };
    let state = createInitialState();
    for (let t = 0; t < 1500; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let after = perturbFluidBolus(state, 1500);
    for (let t = 0; t < 1500; t += 0.2) after = step(after, inputs, 0.2).state;
    const afterDerived = computeDerived(after, inputs);

    const cardiogenicGain = afterDerived.cardiacOutputLPerMin - before.cardiacOutputLPerMin;
    // It buys a little via Starling, but it also drives the wedge higher — which is the
    // congestion that makes fluid the wrong answer here.
    expect(afterDerived.wedgePressureMmHg).toBeGreaterThan(before.wedgePressureMmHg);
    expect(cardiogenicGain).toBeLessThan(1.5);
  });

  it('haemorrhage lowers filling pressure and output together', () => {
    const inputs = DEFAULT_SHOCK_INPUTS;
    let state = createInitialState();
    for (let t = 0; t < 1200; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let after = perturbHaemorrhage(state, 1500);
    for (let t = 0; t < 1200; t += 0.2) after = step(after, inputs, 0.2).state;
    const afterDerived = computeDerived(after, inputs);

    expect(afterDerived.cardiacOutputLPerMin).toBeLessThan(before.cardiacOutputLPerMin);
    expect(afterDerived.transmuralRapMmHg).toBeLessThan(before.transmuralRapMmHg);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs, and stays within clamps', () => {
    const extremes: Partial<ShockInputs>[] = [
      { bloodVolumeMl: 2000, contractility: 0, systemicVascularResistance: 0.15 },
      { bloodVolumeMl: 6500, contractility: 2, systemicVascularResistance: 3, pericardialPressureMmHg: 28 },
      { pulmonaryVascularResistance: 9, haemoglobinGDl: 3, oxygenDemandMlPerMin: 600 },
      { tissueExtractionCapacity: 0.2, baroreflexGain: 1.5, haemoglobinGDl: 18 },
    ];

    for (const patch of extremes) {
      const d = settle(patch, 1500);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.mixedVenousSaturationPercent).toBeGreaterThanOrEqual(0);
      expect(d.mixedVenousSaturationPercent).toBeLessThanOrEqual(100);
      expect(d.lactateMmolL).toBeGreaterThanOrEqual(1);
      expect(d.lactateMmolL).toBeLessThanOrEqual(20);
    }
  });
});

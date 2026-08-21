import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_FETAL_INPUTS, FETAL_PRESETS } from './presets';
import type { FetalDerived, FetalInputs } from './types';

function settle(patch: Partial<FetalInputs>, seconds = 5000): FetalDerived {
  const inputs = { ...DEFAULT_FETAL_INPUTS, ...patch };
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

describe('the fetal circulation', () => {
  it('bypasses lungs that are doing nothing', () => {
    const d = settle(FETAL_PRESETS.fetal);
    expect(d.pulmonaryFlowFraction).toBeLessThan(0.2);
    // Most right ventricular output takes the short cut across the duct.
    expect(d.ductalShuntFraction).toBeGreaterThan(0.7);
    expect(d.foramenOvalePatency).toBeGreaterThan(0.8);
  });

  it('runs on a placenta that is a low-resistance bed', () => {
    const withPlacenta = settle(FETAL_PRESETS.fetal);
    const clamped = settle({ ...FETAL_PRESETS.fetal, placentalCirculation: 0 });
    // Clamping the cord RAISES systemic resistance — half of the transition, and the half
    // usually forgotten.
    expect(clamped.systemicVascularResistance).toBeGreaterThan(withPlacenta.systemicVascularResistance);
  });

  it('never achieves an adult saturation, even at its best', () => {
    const d = settle(FETAL_PRESETS.fetal);
    expect(d.preDuctalSaturationPercent).toBeLessThan(85);
    expect(d.preDuctalSaturationPercent).toBeGreaterThan(60);
    // The upper body gets the better blood — the point of the streaming through the foramen.
    expect(d.postDuctalSaturationPercent).toBeLessThan(d.preDuctalSaturationPercent);
  });
});

describe('the transition', () => {
  it('drops pulmonary resistance below systemic, reversing every gradient', () => {
    const before = settle(FETAL_PRESETS.fetal);
    const after = settle(FETAL_PRESETS.transitioned);

    expect(before.pulmonaryVascularResistance).toBeGreaterThan(before.systemicVascularResistance);
    expect(after.pulmonaryVascularResistance).toBeLessThan(after.systemicVascularResistance);
  });

  it('closes both shunts and normalises the saturation', () => {
    const d = settle(FETAL_PRESETS.transitioned);
    expect(d.ductusArteriosusPatency).toBeLessThan(0.15);
    expect(d.foramenOvalePatency).toBeLessThan(0.15);
    expect(d.preDuctalSaturationPercent).toBeGreaterThan(90);
    expect(d.saturationGradientPercent).toBeLessThan(3);
    expect(d.phase).toBe('neonatal');
  });

  it('happens on room air — supplemental oxygen is not what triggers it', () => {
    const roomAir = settle(FETAL_PRESETS.transitioned);
    // A healthy newborn transitions breathing air. If the model needed supplemental oxygen,
    // it would be modelling something that does not happen.
    expect(roomAir.inspiredOxygen).toBeCloseTo(0.21, 2);
    expect(roomAir.pulmonaryFlowFraction).toBeGreaterThan(0.9);
  });

  it('needs BOTH aeration and oxygen — an inflated but hypoxic lung stays constricted', () => {
    const aeratedAndOxygenated = settle(FETAL_PRESETS.transitioned);
    const aeratedButUnreactive = settle(FETAL_PRESETS.pphn);

    expect(aeratedButUnreactive.lungInflation).toBe(1);
    expect(aeratedButUnreactive.pulmonaryVascularResistance).toBeGreaterThan(
      aeratedAndOxygenated.pulmonaryVascularResistance * 5,
    );
  });
});

describe('when the transition fails', () => {
  it('produces differential cyanosis in persistent pulmonary hypertension', () => {
    const d = settle(FETAL_PRESETS.pphn);

    // Pink above the duct, blue below: the shunt enters the aorta BELOW the head and right arm.
    expect(d.preDuctalSaturationPercent).toBeGreaterThan(85);
    expect(d.postDuctalSaturationPercent).toBeLessThan(70);
    expect(d.saturationGradientPercent).toBeGreaterThan(8);
    expect(d.phase).toBe('persistent fetal circulation');
  });

  it('keeps the duct open when the baby is hypoxaemic', () => {
    const d = settle(FETAL_PRESETS.pphn);
    // The duct responds to the oxygen tension of the blood flowing through it, which here is
    // desaturated — so it stays open exactly when it does most harm.
    expect(d.ductusArteriosusPatency).toBeGreaterThan(0.7);
  });

  it('reverses the shunt through the SAME channel once resistances invert', () => {
    const fetal = settle(FETAL_PRESETS.fetal);
    const persistent = settle(FETAL_PRESETS.patentDuctus);

    expect(fetal.ductalShuntFraction).toBeGreaterThan(0);
    // Left-to-right now: the duct did not change, the pressures either side of it did.
    expect(persistent.ductalShuntFraction).toBeLessThan(-0.1);
    expect(persistent.phase).toBe('left-to-right shunt');
  });

  it('holds the duct open with prostaglandin despite full oxygenation', () => {
    const d = settle(FETAL_PRESETS.ductDependent);
    expect(d.inspiredOxygen).toBeGreaterThan(0.5);
    expect(d.ductusArteriosusPatency).toBeGreaterThan(0.8);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<FetalInputs>[] = [
      { placentalCirculation: 0, lungInflation: 0, inspiredOxygen: 1, pulmonaryVasoreactivity: 0 },
      { placentalCirculation: 1, lungInflation: 1, inspiredOxygen: 0.21, prostaglandinLevel: 100 },
      { systemicToneScale: 0.4, pulmonaryVasoreactivity: 2, inspiredOxygen: 1 },
      { systemicToneScale: 2, placentalCirculation: 0.5, lungInflation: 0.5 },
    ];

    for (const patch of extremes) {
      const d = settle(patch, 2000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.preDuctalSaturationPercent).toBeGreaterThanOrEqual(0);
      expect(d.preDuctalSaturationPercent).toBeLessThanOrEqual(100);
      expect(d.postDuctalSaturationPercent).toBeGreaterThanOrEqual(0);
      expect(d.postDuctalSaturationPercent).toBeLessThanOrEqual(100);
    }
  });
});

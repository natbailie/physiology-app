import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbDrainCsf, step } from './engine';
import { CEREBRAL_PRESETS, DEFAULT_CEREBRAL_INPUTS } from './presets';
import type { CerebralDerived, CerebralInputs } from './types';

function settle(patch: Partial<CerebralInputs>, seconds = 4000): CerebralDerived {
  const inputs = { ...DEFAULT_CEREBRAL_INPUTS, ...patch };
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

describe('baseline', () => {
  it('settles a normal adult on textbook values', () => {
    const d = settle(CEREBRAL_PRESETS.normal);
    expect(d.intracranialPressureMmHg).toBeCloseTo(10, 0);
    expect(d.cerebralPerfusionPressureMmHg).toBeCloseTo(80, 0);
    expect(d.cerebralBloodFlow).toBeCloseTo(50, 0);
    expect(d.classification).toBe('normal');
  });
});

describe('the Monro-Kellie doctrine', () => {
  it('absorbs a large mass with no rise in pressure at all', () => {
    const d = settle(CEREBRAL_PRESETS.compensatedMass);
    // CSF and venous blood are displaced first. This patient has 68 mL of tumour, a normal
    // intracranial pressure, and almost nothing left in reserve.
    expect(d.massVolumeMl).toBeGreaterThan(60);
    expect(d.intracranialPressureMmHg).toBeLessThan(15);
    expect(d.compensatoryReserveMl).toBeLessThan(12);
  });

  it('then rises steeply once the reserve is spent', () => {
    const compensated = settle(CEREBRAL_PRESETS.compensatedMass);
    const decompensated = settle(CEREBRAL_PRESETS.decompensatedMass);

    // Fifty extra millilitres bought almost nothing; the next fifty cost everything.
    expect(decompensated.intracranialPressureMmHg).toBeGreaterThan(
      compensated.intracranialPressureMmHg * 2.5,
    );
    expect(decompensated.elastanceMmHgPerMl).toBeGreaterThan(compensated.elastanceMmHgPerMl * 5);
  });

  it('makes draining a few millilitres dramatically effective at the steep end', () => {
    const inputs = { ...DEFAULT_CEREBRAL_INPUTS, ...CEREBRAL_PRESETS.decompensatedMass };
    let state = createInitialState();
    for (let t = 0; t < 3000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let after = perturbDrainCsf(state, 15);
    for (let t = 0; t < 1500; t += 0.2) after = step(after, inputs, 0.2).state;

    expect(computeDerived(after, inputs).intracranialPressureMmHg).toBeLessThan(
      before.intracranialPressureMmHg,
    );
  });
});

describe('perfusion pressure', () => {
  it('is what is left of the arterial pressure after the intracranial pressure is subtracted', () => {
    const d = settle({ meanArterialPressureMmHg: 90, massVolumeMl: 118 });
    expect(d.cerebralPerfusionPressureMmHg).toBeCloseTo(
      90 - Math.max(d.intracranialPressureMmHg, d.venousOutflowPressureMmHg),
      0,
    );
  });

  it('is limited by venous pressure when that is the higher of the two', () => {
    const d = settle(CEREBRAL_PRESETS.venousObstruction, 30000);
    // A vessel is compressed by whatever surrounds it, so the higher of the two downstream
    // pressures is what counts.
    expect(d.venousOutflowPressureMmHg).toBeGreaterThan(15);
    expect(d.cerebralPerfusionPressureMmHg).toBeLessThan(d.meanArterialPressureMmHg - 15);
  });

  it('triggers hypertension with BRADYCARDIA when it falls critically', () => {
    const d = settle({ massVolumeMl: 150, paCO2MmHg: 55 });
    expect(d.cushingResponseActive).toBe(true);
    // The combination is the point: a rising pressure with a falling pulse is never benign.
    expect(d.reflexHeartRateBpm).toBeLessThan(60);
  });
});

describe('autoregulation and CO2', () => {
  it('holds flow steady across a wide range of pressures while intact', () => {
    const low = settle({ meanArterialPressureMmHg: 70 });
    const high = settle({ meanArterialPressureMmHg: 140 });
    expect(Math.abs(low.cerebralBloodFlow - high.cerebralBloodFlow)).toBeLessThan(12);
  });

  it('lets flow follow pressure passively once it is lost', () => {
    const intact = settle({ meanArterialPressureMmHg: 130, autoregulationIntegrity: 1 });
    const lost = settle({ meanArterialPressureMmHg: 130, autoregulationIntegrity: 0 });
    expect(lost.cerebralBloodFlow).toBeGreaterThan(intact.cerebralBloodFlow);
    expect(lost.classification).toBe('hyperaemic');
  });

  it('makes hyperventilation the fastest lever on intracranial pressure', () => {
    const normalCO2 = settle({ massVolumeMl: 95, paCO2MmHg: 40 });
    const hyperventilated = settle(CEREBRAL_PRESETS.hyperventilated);

    // Constricting the vessels shrinks cerebral blood volume, and in a full skull that is the
    // quickest volume anyone can remove.
    expect(hyperventilated.cerebralBloodVolumeMl).toBeLessThan(normalCO2.cerebralBloodVolumeMl);
    expect(hyperventilated.intracranialPressureMmHg).toBeLessThan(normalCO2.intracranialPressureMmHg);
  });

  it('but buys that pressure at the cost of flow', () => {
    const normalCO2 = settle({ massVolumeMl: 95, paCO2MmHg: 40 });
    const hyperventilated = settle(CEREBRAL_PRESETS.hyperventilated);
    expect(hyperventilated.cerebralBloodFlow).toBeLessThan(normalCO2.cerebralBloodFlow);
  });

  it('makes hypoventilation a catastrophe in a skull with no reserve', () => {
    const hyperventilated = settle(CEREBRAL_PRESETS.hyperventilated);
    const hypoventilated = settle(CEREBRAL_PRESETS.hypoventilated);
    expect(hypoventilated.intracranialPressureMmHg).toBeGreaterThan(
      hyperventilated.intracranialPressureMmHg * 3,
    );
  });
});

describe('CSF', () => {
  it('accumulates when absorption fails, until pressure rises', () => {
    const d = settle(CEREBRAL_PRESETS.hydrocephalus, 30000);
    expect(d.csfExcessMl).toBeGreaterThan(30);
    expect(d.intracranialPressureMmHg).toBeGreaterThan(20);
  });

  it('cannot be absorbed against a raised venous pressure', () => {
    const d = settle(CEREBRAL_PRESETS.venousObstruction, 30000);
    // Absorption needs a gradient into the venous sinus, so nothing is wrong inside the skull
    // and the pressure rises anyway.
    expect(d.csfExcessMl).toBeGreaterThan(20);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<CerebralInputs>[] = [
      { meanArterialPressureMmHg: 40, massVolumeMl: 150, paCO2MmHg: 80 },
      { meanArterialPressureMmHg: 170, autoregulationIntegrity: 0, paCO2MmHg: 15 },
      { csfProductionRate: 2.5, csfAbsorptionCapacity: 0, venousOutflowPressureMmHg: 25 },
      { paO2MmHg: 25, massVolumeMl: 0, csfAbsorptionCapacity: 1.5 },
    ];

    for (const patch of extremes) {
      const d = settle(patch, 2000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.intracranialPressureMmHg).toBeGreaterThan(0);
      expect(d.intracranialPressureMmHg).toBeLessThanOrEqual(90);
      expect(d.cerebralBloodFlow).toBeGreaterThanOrEqual(0);
    }
  });
});

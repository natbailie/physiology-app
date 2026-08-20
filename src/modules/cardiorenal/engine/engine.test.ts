import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbBloodVolume, step } from './engine';
import { DEFAULT_INPUTS, PRESETS } from './presets';
import { HEMODYNAMICS, SIMULATION } from './constants';
import type { SimInputs, SimState } from './types';

function runFor(inputs: SimInputs, seconds: number, dt = 1, startState?: SimState) {
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
  it('settles near the MAP setpoint with minimal RAAS/ANP activation', () => {
    const { state, derived } = runFor(DEFAULT_INPUTS, 3600);
    expect(derived.meanArterialPressure).toBeGreaterThan(HEMODYNAMICS.MAP_SETPOINT - 5);
    expect(derived.meanArterialPressure).toBeLessThan(HEMODYNAMICS.MAP_SETPOINT + 5);
    expect(state.bloodVolume).toBeGreaterThan(90);
    expect(state.bloodVolume).toBeLessThan(110);
    expect(derived.raasActivation).toBeLessThan(0.2);
    expect(derived.anpLevel).toBeLessThan(0.2);
  });

  it('never produces NaN/Infinity/negative values across extreme input combinations', () => {
    const extremes: SimInputs[] = [];
    for (const heartRate of [40, 180]) {
      for (const contractility of [0, 2]) {
        for (const vascularTone of [0.5, 1.5]) {
          for (const kidneyFunction of [0, 1.5]) {
            for (const sodiumIntake of [0, 300]) {
              extremes.push({ heartRate, contractility, vascularTone, kidneyFunction, sodiumIntake });
            }
          }
        }
      }
    }

    // baroreflexDrive is signed (-1..1) and netFluidBalance can legitimately go negative.
    const signedFields = new Set(['baroreflexDrive', 'netFluidBalance']);

    for (const inputs of extremes) {
      const { state, derived } = runFor(inputs, 600, 1);
      for (const [key, value] of Object.entries(derived)) {
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        if (!signedFields.has(key)) {
          expect(
            value,
            `${key} should be non-negative for ${JSON.stringify(inputs)}`,
          ).toBeGreaterThanOrEqual(-1e-6);
        }
      }
      expect(Number.isFinite(state.bloodVolume)).toBe(true);
      expect(state.bloodVolume).toBeGreaterThanOrEqual(SIMULATION.BLOOD_VOLUME_MIN_PCT - 1e-6);
      expect(state.bloodVolume).toBeLessThanOrEqual(SIMULATION.BLOOD_VOLUME_MAX_PCT + 1e-6);
    }
  });
});

describe('engine — hemorrhage', () => {
  it('drops MAP acutely, then baroreflex/RAAS drive partial recovery over time', () => {
    const baseline = runFor(DEFAULT_INPUTS, 600).state;
    const bled = perturbBloodVolume(baseline, SIMULATION.HEMORRHAGE_BV_MULTIPLIER);
    const immediate = computeDerived(bled, DEFAULT_INPUTS);

    expect(immediate.meanArterialPressure).toBeLessThan(HEMODYNAMICS.MAP_SETPOINT - 10);

    // A few seconds in, the (fast) baroreflex should already be pushing back.
    const soon = runFor(DEFAULT_INPUTS, 10, 1, bled);
    expect(soon.derived.baroreflexDrive).toBeGreaterThan(0);

    const recovered = runFor(DEFAULT_INPUTS, 3600, 1, bled);

    // MAP should recover substantially from the acute drop, via baroreflex + RAAS.
    expect(recovered.derived.meanArterialPressure).toBeGreaterThan(immediate.meanArterialPressure);
    // Blood volume should be rebuilding (retention via aldosterone), not still falling.
    expect(recovered.state.bloodVolume).toBeGreaterThan(bled.bloodVolume);
  });
});

describe('engine — heart failure (cardiorenal syndrome)', () => {
  it('triggers sustained RAAS activation and fluid retention without fully restoring MAP', () => {
    const inputs: SimInputs = { ...DEFAULT_INPUTS, ...PRESETS.heartFailure };
    const early = runFor(inputs, 600).state;
    const late = runFor(inputs, 3600, 1, early).state;
    const lateDerived = computeDerived(late, inputs);

    // Congestion: blood volume keeps rising rather than settling back to baseline.
    expect(late.bloodVolume).toBeGreaterThan(early.bloodVolume);
    // RAAS stays chronically activated — compensation is incomplete.
    expect(lateDerived.raasActivation).toBeGreaterThan(0.15);
    // Despite fluid retention, MAP does not fully normalize.
    expect(lateDerived.meanArterialPressure).toBeLessThan(HEMODYNAMICS.MAP_SETPOINT);
  });
});

describe('engine — kidney failure (CKD)', () => {
  it('causes chronic fluid retention and settles at an elevated MAP', () => {
    const inputs: SimInputs = { ...DEFAULT_INPUTS, ...PRESETS.kidneyFailure };
    const early = runFor(inputs, 600).state;
    const late = runFor(inputs, 5400, 1, early).state;
    const lateDerived = computeDerived(late, inputs);

    expect(late.bloodVolume).toBeGreaterThan(100);
    expect(lateDerived.meanArterialPressure).toBeGreaterThan(HEMODYNAMICS.MAP_SETPOINT);
  });
});

describe('engine — high salt diet', () => {
  it('raises blood volume and shifts MAP upward relative to baseline', () => {
    const inputs: SimInputs = { ...DEFAULT_INPUTS, ...PRESETS.highSaltDiet };
    const { state, derived } = runFor(inputs, 3600);

    expect(state.bloodVolume).toBeGreaterThan(100);
    expect(derived.meanArterialPressure).toBeGreaterThan(HEMODYNAMICS.MAP_SETPOINT);
  });
});

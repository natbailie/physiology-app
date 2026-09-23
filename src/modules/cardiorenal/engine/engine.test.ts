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
              // Both ends of the reflex too: a blocked reflex and a supranormal one are the two
              // ways the loop's gain can leave its calibrated value, and an unstable controller
              // shows up at the extremes of gain before it shows up anywhere else.
              for (const baroreflexGain of [0, 1.5]) {
                extremes.push({ heartRate, contractility, vascularTone, kidneyFunction, sodiumIntake, baroreflexGain });
              }
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

/**
 * The baroreflex as something a learner can switch off.
 *
 * Baroreceptors RESET — the setpoint chases the pressure it is actually seeing over fifteen
 * minutes — so an insult that drops the pressure is defended, then accepted as the new normal, and
 * the heart rate and vascular tone the reflex was holding slide back to their slider values while
 * the insult is still applied. That is correct physiology and it is why chronic hypertension
 * persists, but with the reflex permanently on there is no way to watch the insult bare.
 *
 * The assertions are monotonic in the gain rather than pinned to numbers: "more gain defends
 * better" is true of any correct implementation and false of a gain wired to the wrong sign, the
 * wrong term, or the time constant, and it survives the next recalibration. A snapshot does not.
 */
describe('engine — baroreflex gain', () => {
  const bled = (baroreflexGain: number) => {
    const start = perturbBloodVolume(createInitialState(), SIMULATION.HEMORRHAGE_BV_MULTIPLIER);
    return runFor({ ...DEFAULT_INPUTS, baroreflexGain }, 120, 1, start);
  };

  it('leaves the baseline untouched at unity gain, which is what keeps every band calibrated', () => {
    const withGain = runFor(DEFAULT_INPUTS, 3600);
    const withoutTheField = runFor({ ...DEFAULT_INPUTS, baroreflexGain: 1 }, 3600);
    expect(withGain.derived.meanArterialPressure).toBeCloseTo(withoutTheField.derived.meanArterialPressure, 9);
  });

  it('defends mean arterial pressure after a bleed when the reflex is intact', () => {
    expect(bled(1).derived.meanArterialPressure).toBeGreaterThan(bled(0).derived.meanArterialPressure);
  });

  it('raises the heart rate to do it — a high-gain loop keeps a small error with a large output', () => {
    expect(bled(1).derived.effectiveHeartRate).toBeGreaterThan(bled(0).derived.effectiveHeartRate);
  });

  it('leaves heart rate and vascular tone exactly on their sliders when the reflex is blocked', () => {
    const { derived } = bled(0);
    expect(derived.effectiveHeartRate).toBeCloseTo(DEFAULT_INPUTS.heartRate, 9);
    expect(derived.baroreflexDrive).toBeCloseTo(0, 9);
  });

  it('defends pressure monotonically in the gain', () => {
    const pressures = [0, 0.5, 1, 1.5].map((gain) => bled(gain).derived.meanArterialPressure);
    for (let i = 1; i < pressures.length; i++) {
      expect(pressures[i]!).toBeGreaterThan(pressures[i - 1]!);
    }
  });

  /**
   * The resetting, pinned so it cannot change quietly — and so the reason for the control is on the
   * record beside it.
   *
   * With the reflex intact the bled patient's heart rate climbs, holds the pressure, and then comes
   * back DOWN as the setpoint accepts the new pressure as normal: a learner who looks away for two
   * minutes returns to a rate that no longer shows the bleed. With the reflex off there was never a
   * rate rise to lose, which is what makes the insult watchable.
   *
   * RAAS is deliberately not part of this claim. It is the slow controller that keeps working with
   * the reflex blocked — the kidney is the long-term regulator of arterial pressure, not the
   * baroreceptors — so nothing here asserts that a bled patient is frozen.
   */
  it('hands the defence back as the setpoint resets, and has nothing to hand back when blocked', () => {
    const start = perturbBloodVolume(createInitialState(), SIMULATION.HEMORRHAGE_BV_MULTIPLIER);
    const intact = { ...DEFAULT_INPUTS, baroreflexGain: 1 };
    const defended = runFor(intact, 60, 1, start).derived.effectiveHeartRate;
    const handedBack = runFor(intact, 1800, 1, start).derived.effectiveHeartRate;
    expect(defended).toBeGreaterThan(DEFAULT_INPUTS.heartRate);
    expect(handedBack).toBeLessThan(defended);

    const blocked = { ...DEFAULT_INPUTS, baroreflexGain: 0 };
    expect(runFor(blocked, 60, 1, start).derived.effectiveHeartRate).toBeCloseTo(DEFAULT_INPUTS.heartRate, 9);
    expect(runFor(blocked, 1800, 1, start).derived.effectiveHeartRate).toBeCloseTo(DEFAULT_INPUTS.heartRate, 9);
  });
});

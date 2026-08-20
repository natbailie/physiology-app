import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbStimulate, step } from './engine';
import { DEFAULT_MUSCLE_INPUTS, MUSCLE_PRESETS } from './presets';
import { lengthTensionFactor, passiveTension } from './lengthTension';
import { shorteningVelocity } from './forceVelocity';
import { effectiveStimulusIntervalMs, isFused } from './motorUnit';
import type { MuscleInputs, MuscleState } from './types';

const DT = 0.0002;

function presetInputs(name: keyof typeof MUSCLE_PRESETS): MuscleInputs {
  return { ...DEFAULT_MUSCLE_INPUTS, ...MUSCLE_PRESETS[name] };
}

function settle(inputs: MuscleInputs, seconds = 1.5): MuscleState {
  let state = createInitialState();
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return state;
}

/** Fires one stimulus into a settled muscle and records the shape of the resulting twitch. */
function fireTwitch(inputs: MuscleInputs, seconds = 0.5) {
  let state = perturbStimulate(settle(inputs));
  let peakCalcium = -Infinity;
  let peakTension = -Infinity;
  let timeOfPeakCalcium = 0;
  let timeOfPeakTension = 0;
  let minLength = Infinity;

  for (let i = 0; i <= seconds / DT; i++) {
    const derived = computeDerived(state, inputs);
    const t = i * DT;
    if (derived.cytosolicCalciumUM > peakCalcium) {
      peakCalcium = derived.cytosolicCalciumUM;
      timeOfPeakCalcium = t;
    }
    if (derived.totalTension > peakTension) {
      peakTension = derived.totalTension;
      timeOfPeakTension = t;
    }
    minLength = Math.min(minLength, derived.sarcomereLengthUm);
    state = step(state, inputs, DT).state;
  }
  return { peakCalcium, peakTension, timeOfPeakCalcium, timeOfPeakTension, minLength, state };
}

/** Mean tension over a window of sustained stimulation, after the response has settled. */
function meanTension(inputs: MuscleInputs, settleSeconds = 1.5, windowSeconds = 0.5): number {
  let state = settle(inputs, settleSeconds);
  let total = 0;
  let count = 0;
  for (let i = 0; i < windowSeconds / DT; i++) {
    total += computeDerived(state, inputs).totalTension;
    count++;
    state = step(state, inputs, DT).state;
  }
  return total / count;
}

describe('lengthTension — the Gordon-Huxley curve', () => {
  it('peaks on the plateau and falls away on both limbs', () => {
    expect(lengthTensionFactor(2.1)).toBeCloseTo(1, 5);
    expect(lengthTensionFactor(2)).toBeCloseTo(1, 5);
    expect(lengthTensionFactor(2.2)).toBeCloseTo(1, 5);

    expect(lengthTensionFactor(1.6)).toBeLessThan(1);
    expect(lengthTensionFactor(3)).toBeLessThan(1);
    // No overlap at either extreme means no active force at all.
    expect(lengthTensionFactor(1.27)).toBeCloseTo(0, 5);
    expect(lengthTensionFactor(3.65)).toBeCloseTo(0, 5);
  });

  it('adds passive tension only past the plateau, and steeply', () => {
    expect(passiveTension(2.1)).toBe(0);
    expect(passiveTension(2.6)).toBeGreaterThan(0);
    expect(passiveTension(3.2)).toBeGreaterThan(passiveTension(2.6) * 3);
  });
});

describe('forceVelocity — Hill relation', () => {
  it('shortens at vmax unloaded and not at all against maximal load', () => {
    expect(shorteningVelocity(100, 0)).toBeCloseTo(4, 5);
    expect(shorteningVelocity(100, 100)).toBe(0);
    expect(shorteningVelocity(100, 150)).toBe(0);
  });

  it('falls monotonically as the load rises', () => {
    const velocities = [0, 20, 40, 60, 80, 100].map((load) => shorteningVelocity(100, load));
    for (let i = 1; i < velocities.length; i++) {
      expect(velocities[i]!).toBeLessThan(velocities[i - 1]!);
    }
  });

  it('produces zero power at both ends and a maximum in between', () => {
    const power = (load: number) => load * shorteningVelocity(100, load);
    expect(power(0)).toBeCloseTo(0, 5);
    expect(power(100)).toBeCloseTo(0, 5);
    expect(power(30)).toBeGreaterThan(power(0));
    expect(power(30)).toBeGreaterThan(power(95));
  });
});

describe('engine — the twitch', () => {
  it('rests with a low cytosolic calcium, a full SR and no attached bridges', () => {
    const inputs = presetInputs('singleTwitch');
    const derived = computeDerived(settle(inputs), inputs);

    expect(derived.cytosolicCalciumUM).toBeGreaterThan(0.05);
    expect(derived.cytosolicCalciumUM).toBeLessThan(0.2);
    expect(derived.srCalciumLoad).toBeGreaterThan(0.9);
    expect(derived.activeCrossBridgeFraction).toBeLessThan(0.05);
    expect(derived.totalTension).toBeLessThan(1);
  });

  it('peaks calcium BEFORE tension — excitation and contraction are separate events', () => {
    const { peakCalcium, peakTension, timeOfPeakCalcium, timeOfPeakTension } = fireTwitch(presetInputs('singleTwitch'));

    expect(peakCalcium).toBeGreaterThan(1);
    expect(peakTension).toBeGreaterThan(5);
    expect(timeOfPeakCalcium).toBeLessThan(timeOfPeakTension);
  });

  it('returns to rest afterward rather than staying contracted', () => {
    const inputs = presetInputs('singleTwitch');
    let state = perturbStimulate(settle(inputs));
    for (let i = 0; i < 1 / DT; i++) state = step(state, inputs, DT).state;
    const derived = computeDerived(state, inputs);

    expect(derived.cytosolicCalciumUM).toBeLessThan(0.2);
    expect(derived.totalTension).toBeLessThan(1);
  });
});

describe('engine — summation and tetanus', () => {
  it('raises mean tension monotonically with stimulation frequency', () => {
    const tensions = [2, 8, 15, 30, 60].map((stimulationFrequencyHz) =>
      meanTension({ ...presetInputs('singleTwitch'), stimulationFrequencyHz }),
    );
    for (let i = 1; i < tensions.length; i++) {
      expect(tensions[i]!).toBeGreaterThan(tensions[i - 1]!);
    }
  });

  it('reaches a fused plateau at high frequency, well above single-twitch tension', () => {
    const twitch = fireTwitch(presetInputs('singleTwitch')).peakTension;
    const fused = meanTension(presetInputs('fusedTetanus'));

    expect(fused).toBeGreaterThan(twitch * 2);
    expect(isFused(effectiveStimulusIntervalMs(50, 'skeletal'), 'skeletal')).toBe(true);
    expect(isFused(effectiveStimulusIntervalMs(15, 'skeletal'), 'skeletal')).toBe(false);
  });
});

describe('engine — cardiac muscle cannot be tetanized', () => {
  it('discards stimuli during its long refractory period, at every frequency', () => {
    for (const stimulationFrequencyHz of [10, 50, 100]) {
      const inputs: MuscleInputs = { ...presetInputs('cardiacMuscle'), stimulationFrequencyHz };
      const derived = computeDerived(settle(inputs), inputs);
      expect(derived.isFused, `cardiac should never fuse at ${stimulationFrequencyHz}Hz`).toBe(false);
      expect(derived.isTetanic, `cardiac should never tetanize at ${stimulationFrequencyHz}Hz`).toBe(false);
    }
    // Skeletal muscle at the same frequency does both.
    const skeletal = computeDerived(settle(presetInputs('fusedTetanus')), presetInputs('fusedTetanus'));
    expect(skeletal.isFused).toBe(true);
  });

  it('lets calcium fall back toward rest between beats instead of accumulating', () => {
    const inputs = presetInputs('cardiacMuscle');
    let state = settle(inputs);
    let minCalcium = Infinity;
    for (let i = 0; i < 0.6 / DT; i++) {
      minCalcium = Math.min(minCalcium, computeDerived(state, inputs).cytosolicCalciumUM);
      state = step(state, inputs, DT).state;
    }
    expect(minCalcium).toBeLessThan(0.4);
  });
});

describe('engine — excitation-contraction coupling differs by muscle type', () => {
  it('makes cardiac force depend on extracellular calcium, and skeletal force not', () => {
    const cardiacPeak = (extracellularCalcium: number) =>
      fireTwitch({ ...presetInputs('cardiacMuscle'), stimulationFrequencyHz: 0, extracellularCalcium }).peakTension;
    const skeletalPeak = (extracellularCalcium: number) =>
      fireTwitch({ ...presetInputs('singleTwitch'), extracellularCalcium }).peakTension;

    // Calcium-induced calcium release: no trigger influx, much less release.
    expect(cardiacPeak(0.5)).toBeLessThan(cardiacPeak(1.5) * 0.8);
    // Mechanical DHPR-RyR coupling: the bath calcium barely matters.
    expect(Math.abs(skeletalPeak(0.5) - skeletalPeak(1.5))).toBeLessThan(skeletalPeak(1) * 0.02);
  });
});

describe('engine — length-tension in the running model', () => {
  it('develops most tension at the plateau length and less on either limb', () => {
    const tensionAt = (restingSarcomereLengthUm: number) =>
      meanTension({ ...presetInputs('fusedTetanus'), restingSarcomereLengthUm });

    const plateau = tensionAt(2.1);
    expect(tensionAt(1.6)).toBeLessThan(plateau);
    expect(tensionAt(3)).toBeLessThan(plateau);
  });

  it('trades falling active tension for rising passive tension when overstretched', () => {
    const inputs = presetInputs('overstretched');
    const derived = computeDerived(settle(inputs), inputs);

    expect(derived.lengthTensionFactor).toBeLessThan(0.7);
    expect(derived.passiveTension).toBeGreaterThan(5);
  });
});

describe('engine — isotonic contraction', () => {
  it('shortens against a light load and relengthens once stimulation stops', () => {
    const inputs = presetInputs('isotonicLift');
    const shortened = settle(inputs, 1);
    expect(shortened.sarcomereLengthUm).toBeLessThan(inputs.restingSarcomereLengthUm - 0.05);
    expect(computeDerived(shortened, inputs).contractionMode).toBe('isotonic');

    let state = shortened;
    const quiescent: MuscleInputs = { ...inputs, stimulationFrequencyHz: 0 };
    for (let i = 0; i < 1 / DT; i++) state = step(state, quiescent, DT).state;
    expect(state.sarcomereLengthUm).toBeCloseTo(inputs.restingSarcomereLengthUm, 1);
  });

  it('holds length and develops full tension when the load cannot be lifted', () => {
    const inputs = presetInputs('fusedTetanus');
    const state = settle(inputs, 1);
    const derived = computeDerived(state, inputs);

    expect(derived.contractionMode).toBe('isometric');
    expect(derived.shorteningVelocityUmPerS).toBe(0);
    expect(state.sarcomereLengthUm).toBeCloseTo(inputs.restingSarcomereLengthUm, 1);
  });
});

describe('engine — rigor mortis', () => {
  it('leaves cross-bridges attached and immobile once ATP is gone', () => {
    const inputs = presetInputs('rigorMortis');
    const state = settle(inputs, 4);
    const derived = computeDerived(state, inputs);

    // SERCA has stopped, so the standing SR leak drives cytosolic calcium up.
    expect(derived.cytosolicCalciumUM).toBeGreaterThan(1);
    expect(derived.activeCrossBridgeFraction).toBeGreaterThan(0.6);
    expect(derived.isInRigor).toBe(true);
    expect(derived.shorteningVelocityUmPerS).toBe(0);
  });

  it('is an ATP problem, not a calcium problem — the same calcium with ATP relaxes', () => {
    const rigor = presetInputs('rigorMortis');
    const withAtp: MuscleInputs = { ...rigor, atpAvailability: 1 };
    expect(computeDerived(settle(withAtp, 4), withAtp).activeCrossBridgeFraction).toBeLessThan(0.1);
  });
});

describe('engine — malignant hyperthermia', () => {
  it('produces sustained contracture, SR depletion and a rising temperature', () => {
    const normalInputs = presetInputs('singleTwitch');
    const inputs = presetInputs('malignantHyperthermia');
    const derived = computeDerived(settle(inputs, 4), inputs);
    const normal = computeDerived(settle(normalInputs, 4), normalInputs);

    expect(derived.cytosolicCalciumUM).toBeGreaterThan(normal.cytosolicCalciumUM * 5);
    expect(derived.totalTension).toBeGreaterThan(20);
    expect(derived.srCalciumLoad).toBeLessThan(normal.srCalciumLoad);
    expect(derived.temperatureC).toBeGreaterThan(38.5);
    expect(normal.temperatureC).toBeCloseTo(37, 1);
  });
});

describe('engine — smooth muscle latch', () => {
  it('holds tension after calcium has fallen, unlike skeletal muscle', () => {
    const inputs = presetInputs('smoothLatch');
    let state = settle(inputs, 4);
    expect(computeDerived(state, inputs).isLatched).toBe(true);

    const quiescent: MuscleInputs = { ...inputs, stimulationFrequencyHz: 0 };
    for (let i = 0; i < 1.5 / DT; i++) state = step(state, quiescent, DT).state;
    const derived = computeDerived(state, quiescent);

    expect(derived.cytosolicCalciumUM).toBeLessThan(0.3);
    expect(derived.latchFraction).toBeGreaterThan(0.2);
    expect(derived.totalTension).toBeGreaterThan(10);
  });
});

describe('engine — motor unit recruitment', () => {
  it('grades force independently of firing frequency', () => {
    const tensions = [0.2, 0.5, 1].map((motorUnitRecruitment) =>
      meanTension({ ...presetInputs('fusedTetanus'), motorUnitRecruitment }),
    );
    expect(tensions[0]!).toBeLessThan(tensions[1]!);
    expect(tensions[1]!).toBeLessThan(tensions[2]!);
    expect(computeDerived(createInitialState(), { ...DEFAULT_MUSCLE_INPUTS, motorUnitRecruitment: 0.5 }).activeMotorUnits).toBe(60);
  });
});

describe('engine — numerical robustness', () => {
  it('stays finite and within bounds across extreme inputs and every muscle type', () => {
    const extremes: MuscleInputs[] = [];
    for (const muscleType of ['skeletal', 'cardiac', 'smooth'] as const) {
      for (const atpAvailability of [0, 1]) {
        for (const ryrLeak of [0, 1]) {
          for (const sercaActivity of [0, 1.5]) {
            for (const restingSarcomereLengthUm of [1.3, 3.8]) {
              extremes.push({
                ...DEFAULT_MUSCLE_INPUTS,
                muscleType,
                atpAvailability,
                ryrLeak,
                sercaActivity,
                restingSarcomereLengthUm,
                stimulationFrequencyHz: 100,
                afterload: 0,
                extracellularCalcium: 2,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const state = settle(inputs, 2);
      const derived = computeDerived(state, inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(state.cytosolicCalciumUM).toBeGreaterThan(0);
      expect(state.srCalciumLoad).toBeGreaterThanOrEqual(0);
      expect(state.srCalciumLoad).toBeLessThanOrEqual(1);
      expect(state.activeCrossBridgeFraction).toBeGreaterThanOrEqual(0);
      expect(state.activeCrossBridgeFraction).toBeLessThanOrEqual(1);
      expect(state.sarcomereLengthUm).toBeGreaterThanOrEqual(1.3);
      expect(state.sarcomereLengthUm).toBeLessThanOrEqual(3.8);
    }
  });
});

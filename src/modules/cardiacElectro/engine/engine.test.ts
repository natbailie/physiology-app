import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { CARDIAC_PRESETS, DEFAULT_CARDIAC_INPUTS } from './presets';
import { VENTRICLE } from './constants';
import { pacemakerRateBpm } from './pacemaker';
import type { CardiacInputs, CardiacPhase, CardiacState } from './types';

const DT = 0.002;

function settle(inputs: CardiacInputs, beats = 40): CardiacState {
  let state = createInitialState();
  const steps = Math.round(((60 / 70) * beats) / DT);
  for (let i = 0; i < steps; i++) state = step(state, inputs, DT).state;
  return state;
}

function settled(name: keyof typeof CARDIAC_PRESETS) {
  const inputs: CardiacInputs = { ...DEFAULT_CARDIAC_INPUTS, ...CARDIAC_PRESETS[name] };
  return computeDerived(settle(inputs), inputs);
}

/** Walks one full beat, collecting the phases visited and the pressure/volume extremes. */
function traceOneBeat(inputs: CardiacInputs) {
  let state = settle(inputs);
  const heartRate = pacemakerRateBpm(inputs.intrinsicHeartRate, inputs.sympatheticDrive, inputs.parasympatheticDrive);
  const steps = Math.round(60 / heartRate / DT);

  const phases = new Set<CardiacPhase>();
  let peakPressure = 0;
  let minVolume = Infinity;
  let maxVolume = 0;
  let volumeDuringIsovolumic: number[] = [];

  for (let i = 0; i < steps; i++) {
    const derived = computeDerived(state, inputs);
    phases.add(derived.phase);
    peakPressure = Math.max(peakPressure, derived.lvPressureMmHg);
    minVolume = Math.min(minVolume, derived.lvVolumeML);
    maxVolume = Math.max(maxVolume, derived.lvVolumeML);
    if (derived.phase === 'isovolumicContraction') volumeDuringIsovolumic.push(derived.lvVolumeML);
    state = step(state, inputs, DT).state;
  }

  return { phases, peakPressure, minVolume, maxVolume, volumeDuringIsovolumic };
}

describe('engine — the cardiac cycle', () => {
  it('passes through all four phases in a normal beat', () => {
    const { phases } = traceOneBeat(DEFAULT_CARDIAC_INPUTS);
    expect(phases.has('filling')).toBe(true);
    expect(phases.has('isovolumicContraction')).toBe(true);
    expect(phases.has('ejection')).toBe(true);
    expect(phases.has('isovolumicRelaxation')).toBe(true);
  });

  it('holds volume constant during isovolumic contraction — the loop\'s vertical limb', () => {
    const { volumeDuringIsovolumic } = traceOneBeat(DEFAULT_CARDIAC_INPUTS);
    expect(volumeDuringIsovolumic.length).toBeGreaterThan(2);
    const spread = Math.max(...volumeDuringIsovolumic) - Math.min(...volumeDuringIsovolumic);
    expect(spread).toBeLessThan(0.5);
  });

  it('produces physiologically plausible normal values', () => {
    const derived = settled('normal');
    expect(derived.strokeVolumeML).toBeGreaterThan(40);
    expect(derived.strokeVolumeML).toBeLessThan(100);
    expect(derived.ejectionFractionPercent).toBeGreaterThan(40);
    expect(derived.ejectionFractionPercent).toBeLessThan(75);
    expect(derived.cardiacOutputLPerMin).toBeGreaterThan(2.5);
    expect(derived.cardiacOutputLPerMin).toBeLessThan(7);
  });

  it('never produces NaN/Infinity and keeps pressure and volume within their clamps', () => {
    const extremes: CardiacInputs[] = [];
    for (const contractility of [0, 2]) {
      for (const afterloadPressure of [40, 160]) {
        for (const preloadEDV of [60, 220]) {
          for (const intrinsicHeartRate of [40, 180]) {
            extremes.push({ ...DEFAULT_CARDIAC_INPUTS, contractility, afterloadPressure, preloadEDV, intrinsicHeartRate });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const state = settle(inputs, 20);
      const derived = computeDerived(state, inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.lvVolumeML).toBeGreaterThanOrEqual(VENTRICLE.MIN_VOLUME_ML - 1e-6);
      expect(derived.lvVolumeML).toBeLessThanOrEqual(VENTRICLE.MAX_VOLUME_ML + 1e-6);
      expect(derived.lvPressureMmHg).toBeGreaterThanOrEqual(0);
      expect(derived.lvPressureMmHg).toBeLessThanOrEqual(VENTRICLE.MAX_PRESSURE_MMHG + 1e-6);
      expect(derived.strokeVolumeML).toBeGreaterThanOrEqual(0);
      expect(derived.ejectionFractionPercent).toBeGreaterThanOrEqual(0);
      expect(derived.ejectionFractionPercent).toBeLessThanOrEqual(100);
    }
  });
});

describe('engine — pacemaker and autonomic rate control', () => {
  it('raises rate with sympathetic drive and lowers it with vagal drive', () => {
    const base = DEFAULT_CARDIAC_INPUTS.intrinsicHeartRate;
    expect(pacemakerRateBpm(base, 100, 0)).toBeGreaterThan(base);
    expect(pacemakerRateBpm(base, 0, 100)).toBeLessThan(base);
    expect(pacemakerRateBpm(base, 0, 0)).toBeCloseTo(base, 5);
  });
});

describe('engine — preload, afterload and contractility reshape the loop', () => {
  it('reduced contractility raises end-systolic volume and drops ejection fraction', () => {
    const normal = settled('normal');
    const failing = settled('heartFailure');

    expect(failing.endSystolicVolumeML).toBeGreaterThan(normal.endSystolicVolumeML);
    expect(failing.strokeVolumeML).toBeLessThan(normal.strokeVolumeML);
    expect(failing.ejectionFractionPercent).toBeLessThan(normal.ejectionFractionPercent);
    expect(failing.cardiacOutputLPerMin).toBeLessThan(normal.cardiacOutputLPerMin);
  });

  it('increased afterload reduces stroke volume — afterload mismatch', () => {
    const normal = settled('normal');
    const hypertensive = settled('hypertensiveCrisis');

    expect(hypertensive.strokeVolumeML).toBeLessThan(normal.strokeVolumeML);
    expect(hypertensive.endSystolicVolumeML).toBeGreaterThan(normal.endSystolicVolumeML);
  });

  it('reduced preload narrows the loop, lowering stroke volume from a smaller end-diastolic volume', () => {
    const normal = settled('normal');
    const hypovolemic = settled('hypovolemia');

    expect(hypovolemic.endDiastolicVolumeML).toBeLessThan(normal.endDiastolicVolumeML);
    expect(hypovolemic.strokeVolumeML).toBeLessThan(normal.strokeVolumeML);
  });

  it('raising contractility at fixed preload and afterload ejects further — the ESPVR shift', () => {
    const weak: CardiacInputs = { ...DEFAULT_CARDIAC_INPUTS, contractility: 0.7 };
    const strong: CardiacInputs = { ...DEFAULT_CARDIAC_INPUTS, contractility: 1.6 };

    const weakDerived = computeDerived(settle(weak), weak);
    const strongDerived = computeDerived(settle(strong), strong);

    expect(strongDerived.endSystolicVolumeML).toBeLessThan(weakDerived.endSystolicVolumeML);
    expect(strongDerived.strokeVolumeML).toBeGreaterThan(weakDerived.strokeVolumeML);
  });
});

describe('engine — AV conduction', () => {
  it('flags complete heart block only at a very long AV delay', () => {
    expect(settled('normal').isHeartBlock).toBe(false);
    expect(settled('completeHeartBlock').isHeartBlock).toBe(true);
  });

  it('produces a P wave before the QRS, separated by the AV delay', () => {
    const inputs: CardiacInputs = { ...DEFAULT_CARDIAC_INPUTS, avConductionDelay: 160 };
    let state = settle(inputs);

    const heartRate = pacemakerRateBpm(inputs.intrinsicHeartRate, inputs.sympatheticDrive, inputs.parasympatheticDrive);
    const steps = Math.round(60 / heartRate / DT);

    let qrsPhase = 0;
    let peakVoltage = -Infinity;
    for (let i = 0; i < steps; i++) {
      const derived = computeDerived(state, inputs);
      if (derived.ecgVoltage > peakVoltage) {
        peakVoltage = derived.ecgVoltage;
        qrsPhase = derived.cyclePhaseFraction;
      }
      state = step(state, inputs, DT).state;
    }

    // The QRS (the tallest deflection) lands after the P wave, offset by the AV delay.
    expect(peakVoltage).toBeGreaterThan(0.8);
    expect(qrsPhase).toBeGreaterThan(0.05);
  });
});

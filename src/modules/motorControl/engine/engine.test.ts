import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbLevodopaDose, perturbToggleDbs, step } from './engine';
import { DEFAULT_MOTOR_INPUTS, MOTOR_PRESETS } from './presets';
import type { MotorDerived, MotorInputs } from './types';

function settle(patch: Partial<MotorInputs>, seconds = 3000): MotorDerived {
  const inputs = { ...DEFAULT_MOTOR_INPUTS, ...patch };
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
  it('initiates quickly and lands on target with no tremor', () => {
    const d = settle(MOTOR_PRESETS.normal);
    expect(d.initiationLatencyMs).toBeLessThan(250);
    expect(d.amplitudeErrorPct).toBeLessThan(10);
    expect(d.restingTremorAmp).toBeLessThan(0.5);
    expect(d.classification).toBe('normal motor control');
  });
});

describe('dopamine depletion', () => {
  it('slows initiation, shrinks amplitude, raises rest tremor and rigidity', () => {
    const d = settle(MOTOR_PRESETS.advancedParkinson);
    expect(d.initiationLatencyMs).toBeGreaterThan(700);
    expect(d.achievedAmplitudePct).toBeLessThan(MOTOR_PRESETS.advancedParkinson.movementCommandAmplitude! * 0.6);
    expect(d.restingTremorAmp).toBeGreaterThan(3);
    expect(d.rigidityScore).toBeGreaterThan(5);
    expect(d.spasticityScore).toBeLessThan(0.5);
    expect(d.gaitClass).toContain('festinating');
  });

  it('keeps early disease recognisable but milder', () => {
    const early = settle(MOTOR_PRESETS.earlyParkinson);
    expect(early.initiationLatencyMs).toBeGreaterThan(350);
    expect(early.initiationLatencyMs).toBeLessThan(
      settle(MOTOR_PRESETS.advancedParkinson).initiationLatencyMs,
    );
    expect(early.classification).toBe('early parkinsonism');
  });

  it('quiets the resting tremor during voluntary movement', () => {
    const atRest = settle({ dopamineFraction: 12, movementCommandAmplitude: 0 });
    const moving = settle(MOTOR_PRESETS.advancedParkinson);
    expect(moving.restingTremorAmp).toBeLessThan(atRest.restingTremorAmp * 0.5);
  });

  it('responds to levodopa and wears off again', () => {
    const inputs = { ...DEFAULT_MOTOR_INPUTS, dopamineFraction: 12 };
    let state = createInitialState();
    for (let t = 0; t < 1000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let dosed = perturbLevodopaDose(state);
    const duringDose = computeDerived(dosed, inputs);
    expect(duringDose.effectiveDopaminePct).toBeGreaterThan(before.effectiveDopaminePct + 20);
    expect(duringDose.initiationLatencyMs).toBeLessThan(before.initiationLatencyMs);

    for (let t = 0; t < 25000; t += 0.2) dosed = step(dosed, inputs, 0.2).state;
    expect(computeDerived(dosed, inputs).effectiveDopaminePct).toBeLessThan(
      duringDose.effectiveDopaminePct,
    );
  });
});

describe('released involuntary movement', () => {
  it('gives chorea with NORMAL initiation when the indirect pathway is lost', () => {
    const d = settle(MOTOR_PRESETS.huntingtonChorea);
    expect(d.choreaAmp).toBeGreaterThan(4);
    expect(d.initiationLatencyMs).toBeLessThan(300);
    expect(d.restingTremorAmp).toBeLessThan(1);
    expect(d.classification).toBe('choreiform syndrome (Huntington-type)');
  });

  it('releases violent proximal ballism only with a subthalamic lesion', () => {
    const d = settle(MOTOR_PRESETS.hemiballismus);
    expect(d.ballismAmp).toBeGreaterThan(8);
    expect(d.choreaAmp).toBeLessThan(1);
    expect(d.classification).toBe('hemiballismus');
  });
});

describe('cerebellum versus pyramidal', () => {
  it('puts tremor INTO movement with dysmetria, initiation spared', () => {
    const d = settle(MOTOR_PRESETS.cerebellarAtaxia);
    expect(d.intentionTremorAmp).toBeGreaterThan(4);
    expect(d.dysmetriaPct).toBeGreaterThan(30);
    expect(d.initiationLatencyMs).toBeLessThan(250);
    expect(d.rigidityScore).toBeLessThan(0.5);
    expect(d.gaitClass).toContain('broad-based');
  });

  it('makes spasticity velocity-dependent with no tremor in UMN lesions', () => {
    const d = settle(MOTOR_PRESETS.strokeUmnHemiparesis);
    expect(d.spasticityScore).toBeGreaterThan(7);
    expect(d.rigidityScore).toBeLessThan(0.5);
    expect(d.restingTremorAmp).toBeLessThan(0.5);
    expect(d.intentionTremorAmp).toBeLessThan(0.5);
  });
});

describe('essential tremor', () => {
  it('is postural with everything else intact, and responds to suppressants', () => {
    const d = settle(MOTOR_PRESETS.essentialTremor);
    expect(d.posturalTremorAmp).toBeGreaterThan(4);
    expect(d.restingTremorAmp).toBeLessThan(0.5);
    expect(d.initiationLatencyMs).toBeLessThan(250);
    expect(d.classification).toBe('essential tremor');

    const suppressed = settle({ ...MOTOR_PRESETS.essentialTremor, tremorSuppressantEffect: 70 });
    expect(suppressed.posturalTremorAmp).toBeLessThan(d.posturalTremorAmp / 2);
  });
});

describe('deep brain stimulation', () => {
  it('damps the parkinsonian resting tremor while active', () => {
    const inputs = { ...DEFAULT_MOTOR_INPUTS, dopamineFraction: 12 };
    let state = createInitialState();
    for (let t = 0; t < 500; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);
    const toggled = perturbToggleDbs(state); // toggles ON
    expect(toggled.dbsActive).toBe(true);
    expect(computeDerived(toggled, inputs).restingTremorAmp).toBeLessThan(
      before.restingTremorAmp / 3,
    );
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<MotorInputs>[] = [
      { dopamineFraction: 0, striatalOutputLoss: 100, subthalamicLesion: 100 },
      { cerebellarCalibration: 0, corticospinalIntegrity: 0, movementCommandAmplitude: 100 },
      { essentialTremorDrive: 100, tremorSuppressantEffect: 100 },
      { movementCommandAmplitude: 0, dopamineFraction: 130 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 1500);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
    }
  });
});

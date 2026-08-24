import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbSprintSurge, step } from './engine';
import { DEFAULT_EXERCISE_INPUTS, EXERCISE_PRESETS } from './presets';
import { vo2MaxMlMin } from './exerciseMechanics';
import type { ExerciseDerived, ExerciseInputs } from './types';

function settle(patch: Partial<ExerciseInputs>, seconds = 60000): ExerciseDerived {
  const inputs = { ...DEFAULT_EXERCISE_INPUTS, ...patch };
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
  it('sits a resting adult on textbook values', () => {
    const d = settle(EXERCISE_PRESETS.rest);
    expect(d.vo2MlMin).toBeGreaterThan(200);
    expect(d.heartRateBpm).toBeGreaterThan(55);
    expect(d.cardiacOutputLMin).toBeGreaterThan(4);
    expect(d.lactateMmolL).toBeLessThan(2);
    expect(d.classification).toBe('at rest');
  });
});

describe('graded aerobic response', () => {
  it('raises VO2 linearly with workload and widens extraction', () => {
    const light = settle({ workloadWatts: 75 });
    const heavy = settle({ workloadWatts: 200, fitnessPct: 70 });
    expect(light.vo2MlMin).toBeGreaterThan(900);
    expect(light.vo2MlMin).toBeLessThan(1100);
    expect(heavy.vo2MlMin).toBeGreaterThan(light.vo2MlMin * 1.8);
    expect(heavy.arteriovenousDiffMlDl).toBeGreaterThan(light.arteriovenousDiffMlDl);
  });

  it('multiplies cardiac output through rate AND stroke volume while resistance falls', () => {
    const d = settle({ fitnessPct: 65, workloadWatts: 180 });
    expect(d.cardiacOutputLMin).toBeGreaterThan(12);
    expect(d.strokeVolumeMl).toBeGreaterThan(95);
    expect(d.totalResistanceIndex).toBeLessThan(70);
  });

  it('keeps ventilation matched to metabolism below the threshold', () => {
    const d = settle({ workloadWatts: 120, fitnessPct: 60 });
    expect(d.ventilationLMin).toBeGreaterThan(25);
    expect(d.ventilationLMin).toBeLessThan(55);
    expect(d.lactateMmolL).toBeLessThan(4);
  });

  it('drifts core temperature upward with sustained work', () => {
    const d = settle({ workloadWatts: 200, fitnessPct: 70 }, 400000);
    expect(d.coreTempC).toBeGreaterThan(37.5);
  });
});

describe('the ceiling', () => {
  it('pins VO2 at max and accumulates fatigue beyond it in the untrained', () => {
    const d = settle({ ...EXERCISE_PRESETS.untrainedExhaustion }, 200000);
    expect(d.aboveVo2Max).toBe(true);
    expect(d.vo2MlMin).toBeLessThan(vo2MaxMlMin({ fitnessPct: 15, ageYears: 30 }) + 5);
    expect(d.fatiguePct).toBeGreaterThan(20);
    expect(d.classification).toContain('exhausting');
  });

  it('reaches a much higher ceiling when trained at the same age', () => {
    const untrained = vo2MaxMlMin({ fitnessPct: 15, ageYears: 30 });
    const elite = vo2MaxMlMin({ fitnessPct: 92, ageYears: 30 });
    expect(elite).toBeGreaterThan(untrained * 1.7);
  });

  it('lowers maximal heart rate with age', () => {
    expect(settle({ ageYears: 70 }).maxHeartRateBpm).toBeLessThan(
      settle({ ageYears: 25 }).maxHeartRateBpm,
    );
  });
});

describe('training shifts everything together', () => {
  it('gives the trained athlete resting bradycardia', () => {
    const d = settle(EXERCISE_PRESETS.athleteRest);
    expect(d.heartRateBpm).toBeLessThan(52);
    expect(d.strokeVolumeMl).toBeGreaterThan(100);
    expect(d.classification).toBe('trained athlete at rest');
  });

  it('right-shifts the lactate threshold: less lactate at the same absolute load', () => {
    const load = { workloadWatts: 180 };
    const untrained = settle({ ...load, fitnessPct: 20 });
    const trained = settle({ ...load, fitnessPct: 85 });
    expect(trained.lactateMmolL).toBeLessThan(untrained.lactateMmolL);
    expect(trained.heartRateBpm).toBeLessThan(untrained.heartRateBpm);
  });
});

describe('dehydration and anaerobic surges', () => {
  it('runs hotter when dehydrated at identical workload', () => {
    const euhydrated = settle({ workloadWatts: 220, hydrationPct: 100, fitnessPct: 60 }, 500000);
    const dry = settle({ workloadWatts: 220, hydrationPct: 25, fitnessPct: 60 }, 500000);
    expect(dry.coreTempC).toBeGreaterThan(euhydrated.coreTempC + 0.3);
  }, 20000);

  it('spikes lactate after an anaerobic surge', () => {
    const inputs = { ...DEFAULT_EXERCISE_INPUTS, workloadWatts: 150, fitnessPct: 50 };
    let state = createInitialState();
    for (let t = 0; t < 60000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = state.lactateMmolL;
    let surged = perturbSprintSurge(state);
    for (let t = 0; t < 30000; t += 0.2) surged = step(surged, inputs, 0.2).state;
    expect(surged.lactateMmolL).toBeGreaterThan(before);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<ExerciseInputs>[] = [
      { workloadWatts: 400, fitnessPct: 0, ageYears: 80 },
      { workloadWatts: 0, fitnessPct: 100, hydrationPct: 0 },
      { fitnessPct: 100, ageYears: 20, workloadWatts: 350 },
      { hydrationPct: 0, workloadWatts: 400, fitnessPct: 100 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 40000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.fatiguePct).toBeLessThanOrEqual(100);
      expect(d.arteriovenousDiffMlDl).toBeGreaterThanOrEqual(3);
    }
  });
});

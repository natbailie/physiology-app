import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_METABOLISM_INPUTS, METABOLISM_PRESETS } from './presets';
import type { MetabolismInputs } from './types';

const DT = 0.05;

function settled(inputs: MetabolismInputs, seconds = 180): ReturnType<typeof computeDerived> {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += DT) state = step(state, inputs, DT).state;
  return computeDerived(state, inputs);
}

function withInputs(overrides: Partial<MetabolismInputs>): MetabolismInputs {
  return { ...DEFAULT_METABOLISM_INPUTS, ...overrides };
}

describe('the fed-fasting-starvation axis', () => {
  it('reads as fed just after a meal and as starved by 60 hours', () => {
    const fed = settled(withInputs({ hoursPostAbsorptive: 2 }));
    const starved = settled(withInputs({ hoursPostAbsorptive: 60 }));

    expect(fed.metabolicState).toBe('Fed');
    expect(starved.metabolicState).toBe('Starvation');

    // Glucose stays defended above the floor while the fuels flip.
    expect(fed.bgmmolPerL).toBeGreaterThan(5.5);
    expect(starved.bgmmolPerL).toBeGreaterThan(3.6);
    expect(starved.bgmmolPerL).toBeLessThan(fed.bgmmolPerL);

    // The mix tips from carbohydrate to fat.
    expect(fed.carbOxidationPct).toBeGreaterThan(starved.carbOxidationPct);
    expect(starved.fatOxidationPct).toBeGreaterThan(fed.fatOxidationPct);
  });

  it('produces frank ketosis in starvation and none in the fed state', () => {
    const fed = settled(withInputs({ hoursPostAbsorptive: 0 }));
    const starved = settled(withInputs({ hoursPostAbsorptive: 60 }));

    expect(fed.ketonesMmolPerL).toBeLessThan(0.1);
    expect(starved.ketonesMmolPerL).toBeGreaterThan(4);
  });

  it('drains glycogen through the fast', () => {
    const fed = settled(withInputs({ hoursPostAbsorptive: 0 }));
    const starved = settled(withInputs({ hoursPostAbsorptive: 60 }));

    expect(fed.glycogenPct).toBeGreaterThan(90);
    expect(starved.glycogenPct).toBeLessThan(fed.glycogenPct);
  });
});

describe('insulin resistance', () => {
  it('raises glucose and suppresses ketosis', () => {
    const sensitive = settled(withInputs({ hoursPostAbsorptive: 48, insulinResistance: 1 }));
    const resistant = settled(withInputs({ hoursPostAbsorptive: 48, insulinResistance: 2.5 }));

    expect(resistant.bgmmolPerL).toBeGreaterThan(sensitive.bgmmolPerL);
    // At 48 hours a healthy liver is making ketones in earnest; the resistant liver is not.
    expect(sensitive.ketonesMmolPerL).toBeGreaterThan(2);
    expect(resistant.ketonesMmolPerL).toBeLessThan(sensitive.ketonesMmolPerL);
  });

  it('blunts the fed-state carbohydrate burn', () => {
    const sensitive = settled(withInputs({ insulinResistance: 1 }));
    const resistant = settled(withInputs({ insulinResistance: 2.5 }));

    expect(resistant.carbOxidationPct).toBeLessThan(sensitive.carbOxidationPct);
  });
});

describe('catabolic stress', () => {
  it('raises the energy bill and shifts the mix to protein', () => {
    const rest = settled(withInputs({ hoursPostAbsorptive: 12, injuryStress: 0 }));
    const stressed = settled(withInputs({ hoursPostAbsorptive: 12, injuryStress: 1 }));

    expect(stressed.energyKcalPerDay).toBeGreaterThan(rest.energyKcalPerDay * 2);
    expect(stressed.proteinOxidationPct).toBeGreaterThan(rest.proteinOxidationPct);
    expect(stressed.proteinOxidationGPerDay).toBeGreaterThan(rest.proteinOxidationGPerDay);
  });
});

describe('diet composition', () => {
  it('a carbohydrate-heavy diet raises the carbohydrate share of the fed mix', () => {
    const lowCarb = settled(withInputs({ hoursPostAbsorptive: 2, carbohydrateIntake: 0 }));
    const highCarb = settled(withInputs({ hoursPostAbsorptive: 2, carbohydrateIntake: 600 }));

    expect(highCarb.carbOxidationPct).toBeGreaterThan(lowCarb.carbOxidationPct * 1.2);
  });

  it('energy expenditure tracks BMR and activity', () => {
    const rest = settled(withInputs({ basalMetabolicRate: 2000, activityMet: 1 }));
    const active = settled(withInputs({ basalMetabolicRate: 2000, activityMet: 4 }));

    expect(active.energyKcalPerDay).toBeCloseTo(rest.energyKcalPerDay * 4, -1);
  });
});

describe('model hygiene', () => {
  it('never produces NaN across extreme inputs', () => {
    const hourValues = [0, 72];
    const resistanceValues = [0.5, 2.5];
    const stressValues = [0, 1];
    const intakeValues = [0, 600];
    for (const h of hourValues) {
      for (const res of resistanceValues) {
        for (const stress of stressValues) {
          for (const intake of intakeValues) {
            const inputs: MetabolismInputs = {
              ...DEFAULT_METABOLISM_INPUTS,
              hoursPostAbsorptive: h,
              insulinResistance: res,
              injuryStress: stress,
              carbohydrateIntake: intake,
              fatIntake: intake,
              proteinIntake: intake,
            };
            const derived = computeDerived(createInitialState(), inputs);
            for (const [key, value] of Object.entries(derived)) {
              if (typeof value === 'number') {
                expect(Number.isFinite(value), `${key} at ${JSON.stringify(inputs)}`).toBe(true);
              }
            }
          }
        }
      }
    }
  });

  it('every shipped preset settles to the state its label promises', () => {
    const labels = Object.entries(METABOLISM_PRESETS);
    for (const [name, override] of labels) {
      const inputs = { ...DEFAULT_METABOLISM_INPUTS, ...override };
      const derived = settled(inputs);
      const state = derived.metabolicState;
      if (name === 'fed') expect(state).toBe('Fed');
      if (name === 'fasted24') expect(state).toBe('Fasting');
      if (name === 'starvation') expect(state).toBe('Starvation');
      if (name === 'ituCatabolic') expect(state).toBe('Catabolic stress');
    }
  });
});
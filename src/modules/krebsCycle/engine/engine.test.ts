import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_KREBS_CYCLE_INPUTS, KREBS_CYCLE_PRESETS } from './presets';
import type { KrebsCycleInputs } from './types';

const DT = 0.05;

function settled(inputs: KrebsCycleInputs, seconds = 300): ReturnType<typeof computeDerived> {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += DT) state = step(state, inputs, DT).state;
  return computeDerived(state, inputs);
}

function withInputs(overrides: Partial<KrebsCycleInputs>): KrebsCycleInputs {
  return { ...DEFAULT_KREBS_CYCLE_INPUTS, ...overrides };
}

describe('aerobic balance', () => {
  it('opens with resting gases, a mixed quotient and a flat lactate', () => {
    const baseline = settled(withInputs({}));

    expect(baseline.o2mLPerMin).toBeGreaterThan(200);
    expect(baseline.o2mLPerMin).toBeLessThan(300);
    expect(baseline.co2mLPerMin).toBeGreaterThan(150);
    expect(baseline.co2mLPerMin).toBeLessThan(250);
    expect(baseline.rqProxy).toBeGreaterThan(0.7);
    expect(baseline.rqProxy).toBeLessThan(0.95);
    expect(baseline.lactateMmolL).toBeLessThan(2);
    expect(baseline.krebsState).toBe('Aerobic balance');
  });

  it('answers exercise with flux, not lactate, while air keeps up', () => {
    const rest = settled(withInputs({}));
    const run = settled(withInputs({ atpDemandMet: 5 }));

    expect(run.tcaFlux).toBeGreaterThan(rest.tcaFlux * 1.5);
    expect(run.atpYield).toBeGreaterThan(rest.atpYield * 1.5);
    expect(run.o2mLPerMin).toBeGreaterThan(rest.o2mLPerMin * 1.5);
    expect(run.lactateMmolL).toBeLessThan(2);
  });

  it('slides the quotient toward fat on a fasted high-fat substrate', () => {
    const mixed = settled(withInputs({}));
    const fat = settled(withInputs({ glucoseSupplyPct: 15, fattyAcidSupplyPct: 90 }));

    expect(fat.rqProxy).toBeLessThan(mixed.rqProxy - 0.05);
    expect(fat.rqProxy).toBeGreaterThan(0.68);
  });
});

describe('when the chain cannot take electrons', () => {
  it('hypoxia stalls the turns and spills lactate', () => {
    const baseline = settled(withInputs({}));
    const hypoxic = settled(withInputs({ oxygenPct: 15 }));

    expect(hypoxic.tcaFlux).toBeLessThan(baseline.tcaFlux * 0.5);
    expect(hypoxic.atpYield).toBeLessThan(baseline.atpYield * 0.5);
    expect(hypoxic.lactateMmolL).toBeGreaterThan(4);
    expect(hypoxic.krebsState).toBe('Oxygen-limited');
  });

  it('an all-out sprint outpaces delivery where a tempo run does not', () => {
    const tempo = settled(withInputs({ atpDemandMet: 5, oxygenPct: 100 }));
    const sprint = settled(withInputs({ atpDemandMet: 6, oxygenPct: 60 }));

    expect(tempo.lactateMmolL).toBeLessThan(2);
    expect(sprint.lactateMmolL).toBeGreaterThan(4);
  });
});

describe('when the carbohydrate gate chokes', () => {
  it('thiamine deficiency spills lactate with a distinctive low quotient', () => {
    const baseline = settled(withInputs({}));
    const deficient = settled(withInputs({ thiaminePct: 10 }));

    expect(deficient.lactateMmolL).toBeGreaterThan(4);
    expect(deficient.tcaFlux).toBeLessThan(baseline.tcaFlux);
    expect(deficient.rqProxy).toBeLessThan(baseline.rqProxy);
    expect(deficient.krebsState).toBe('Cofactor-limited');
  });

  it('a PDH defect denies carbohydrate whatever the demand', () => {
    const baseline = settled(withInputs({}));
    const defect = settled(withInputs({ pdhActivity: 0.2 }));

    expect(defect.lactateMmolL).toBeGreaterThan(4);
    expect(defect.pdhFlux).toBeLessThan(baseline.pdhFlux * 0.5);
    expect(defect.krebsState).toBe('Cofactor-limited');
  });
});

describe('model hygiene', () => {
  it('never produces NaN across extreme inputs', () => {
    for (const glucose of [0, 100]) {
      for (const fat of [0, 100]) {
        for (const o2 of [5, 100]) {
          for (const demand of [1, 8]) {
            for (const thiamine of [0, 100]) {
              for (const pdh of [0.1, 1]) {
                const inputs: KrebsCycleInputs = {
                  glucoseSupplyPct: glucose,
                  fattyAcidSupplyPct: fat,
                  oxygenPct: o2,
                  atpDemandMet: demand,
                  thiaminePct: thiamine,
                  pdhActivity: pdh,
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
      }
    }
  });

  it('every shipped preset settles to the state its label promises', () => {
    for (const [name, override] of Object.entries(KREBS_CYCLE_PRESETS)) {
      const inputs = { ...DEFAULT_KREBS_CYCLE_INPUTS, ...override };
      const derived = settled(inputs);
      const state = derived.krebsState;
      if (name === 'normal') expect(state).toBe('Aerobic balance');
      if (name === 'exercise') expect(state).toBe('High demand');
      if (name === 'anaerobicThreshold') expect(state).toBe('High demand');
      if (name === 'hypoxia') expect(state).toBe('Oxygen-limited');
      if (name === 'thiamineDeficiency') expect(state).toBe('Cofactor-limited');
      if (name === 'pdhDeficiency') expect(state).toBe('Cofactor-limited');
      if (name === 'fastedFat') expect(state).toBe('Aerobic balance');
    }
  });
});

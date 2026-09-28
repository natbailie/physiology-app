import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_UREA_CYCLE_INPUTS, UREA_CYCLE_PRESETS } from './presets';
import type { UreaCycleInputs } from './types';

const DT = 0.2;

function settled(inputs: UreaCycleInputs, seconds = 3600): ReturnType<typeof computeDerived> {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += DT) state = step(state, inputs, DT).state;
  return computeDerived(state, inputs);
}

function withInputs(overrides: Partial<UreaCycleInputs>): UreaCycleInputs {
  return { ...DEFAULT_UREA_CYCLE_INPUTS, ...overrides };
}

describe('the nitrogen balance', () => {
  it('opens balanced: mid-twenties ammonia, mid-band urea, excretion matching intake', () => {
    const baseline = settled(withInputs({}));

    expect(baseline.ammoniaUmolL).toBeGreaterThan(15);
    expect(baseline.ammoniaUmolL).toBeLessThan(40);
    expect(baseline.ureaMmolL).toBeGreaterThan(2.5);
    expect(baseline.ureaMmolL).toBeLessThan(6.5);
    expect(baseline.urineNitrogenGPerDay).toBeCloseTo(baseline.nitrogenLoadGPerDay, 0);
    expect(baseline.encephalopathyGrade).toBe(0);
    expect(baseline.ureaCycleState).toBe('Balanced');
  });

  it('raises urea with protein while the liver copes, without hyperammonaemia', () => {
    const baseline = settled(withInputs({}));
    const loaded = settled(withInputs({ proteinIntakeGPerDay: 180 }));

    expect(loaded.ureaMmolL).toBeGreaterThan(baseline.ureaMmolL * 1.5);
    expect(loaded.bunMgDl).toBeGreaterThan(baseline.bunMgDl);
    expect(loaded.ammoniaUmolL).toBeLessThan(55);
    expect(loaded.encephalopathyGrade).toBe(0);
  });

  it('turns a GI bleed into a nitrogen load without a single bite eaten', () => {
    const baseline = settled(withInputs({}));
    const bleed = settled(withInputs({ catabolicStress: 1 }));

    expect(bleed.nitrogenLoadGPerDay).toBeGreaterThan(baseline.nitrogenLoadGPerDay * 1.5);
    expect(bleed.ureaMmolL).toBeGreaterThan(baseline.ureaMmolL);
  });
});

describe('when the cycle fails', () => {
  it('liver failure raises ammonia into encephalopathy while urea paradoxically falls', () => {
    const baseline = settled(withInputs({}));
    const failed = settled(withInputs({ liverFunctionPct: 25 }));

    expect(failed.ammoniaUmolL).toBeGreaterThan(90);
    expect(failed.encephalopathyGrade).toBeGreaterThanOrEqual(2);
    // The paradox the module exists to teach: the product disappears with the function.
    expect(failed.ureaMmolL).toBeLessThan(baseline.ureaMmolL);
    expect(failed.ureaCycleState).toBe('Liver failure');
  });

  it('an OTC defect shares the ammonia but adds the orotic signature', () => {
    const failed = settled(withInputs({ liverFunctionPct: 25 }));
    const otc = settled(withInputs({ enzymeCapacity: 0.25 }));

    expect(otc.ammoniaUmolL).toBeGreaterThan(90);
    expect(otc.ureaMmolL).toBeLessThan(3);
    expect(otc.oroticAcidIndex).toBeGreaterThan(5);
    expect(failed.oroticAcidIndex).toBeLessThan(1);
    expect(otc.ureaCycleState).toBe('Enzyme block');
  });

  it('valproate sits between health and a true defect, with a milder orotate', () => {
    const baseline = settled(withInputs({}));
    const valproate = settled({ ...DEFAULT_UREA_CYCLE_INPUTS, ...UREA_CYCLE_PRESETS.valproateBlock });
    const otc = settled({ ...DEFAULT_UREA_CYCLE_INPUTS, ...UREA_CYCLE_PRESETS.otcDeficiency });

    expect(valproate.ammoniaUmolL).toBeGreaterThan(baseline.ammoniaUmolL * 2);
    expect(valproate.ammoniaUmolL).toBeLessThan(otc.ammoniaUmolL);
    expect(valproate.oroticAcidIndex).toBeGreaterThan(2);
    expect(valproate.oroticAcidIndex).toBeLessThan(otc.oroticAcidIndex);
  });
});

describe('hydration', () => {
  it('concentrates urea when dry without changing the ammonia', () => {
    const hydrated = settled(withInputs({ hydrationLPerDay: 3 }));
    const dry = settled(withInputs({ hydrationLPerDay: 0.5 }));

    expect(dry.ureaMmolL).toBeGreaterThan(hydrated.ureaMmolL * 1.3);
    expect(dry.bunMgDl).toBeGreaterThan(hydrated.bunMgDl);
    expect(Math.abs(dry.ammoniaUmolL - hydrated.ammoniaUmolL) / hydrated.ammoniaUmolL).toBeLessThan(0.05);
  });
});

describe('model hygiene', () => {
  it('never produces NaN across extreme inputs', () => {
    for (const protein of [0, 200]) {
      for (const liver of [10, 100]) {
        for (const hyd of [0.5, 4]) {
          for (const enz of [0.2, 1]) {
            for (const stress of [0, 1]) {
              const inputs: UreaCycleInputs = {
                proteinIntakeGPerDay: protein,
                liverFunctionPct: liver,
                hydrationLPerDay: hyd,
                enzymeCapacity: enz,
                catabolicStress: stress,
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
  });

  it('every shipped preset settles to the state its label promises', () => {
    for (const [name, override] of Object.entries(UREA_CYCLE_PRESETS)) {
      const inputs = { ...DEFAULT_UREA_CYCLE_INPUTS, ...override };
      const derived = settled(inputs);
      const state = derived.ureaCycleState;
      if (name === 'normal') expect(state).toBe('Balanced');
      if (name === 'highProtein') expect(state).toBe('High nitrogen load');
      if (name === 'giBleed') expect(state).toBe('High nitrogen load');
      if (name === 'liverFailure') expect(state).toBe('Liver failure');
      if (name === 'otcDeficiency') expect(state).toBe('Enzyme block');
      if (name === 'valproateBlock') expect(state).toBe('Enzyme block');
    }
  });
});

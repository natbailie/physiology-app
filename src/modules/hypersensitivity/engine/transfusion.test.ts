import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbDiurese, perturbTransfuse, step } from './engine';
import { DEFAULT_HYPERSENSITIVITY_INPUTS, HYPERSENSITIVITY_PRESETS } from './presets';
import type { HypersensitivityDerived, HypersensitivityInputs } from './types';

const DT = 0.05;

const preset = (name: keyof typeof HYPERSENSITIVITY_PRESETS): HypersensitivityInputs => ({
  ...DEFAULT_HYPERSENSITIVITY_INPUTS,
  ...HYPERSENSITIVITY_PRESETS[name],
});

/** Give one unit and read the labs `hours` later. */
function transfuseFor(inputs: HypersensitivityInputs, hours: number): HypersensitivityDerived {
  let state = perturbTransfuse(createInitialState());
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < hours; t += DT) {
    const result = step(state, inputs, DT);
    state = result.state;
    derived = result.derived;
  }
  return derived;
}

/** Worst value a scenario reaches, for quantities that peak and then resolve. */
function worst(inputs: HypersensitivityInputs, hours: number, read: (d: HypersensitivityDerived) => number): number {
  let state = perturbTransfuse(createInitialState());
  let extreme = read(computeDerived(state, inputs));
  for (let t = 0; t < hours; t += DT) {
    const result = step(state, inputs, DT);
    state = result.state;
    extreme = Math.min(extreme, read(result.derived));
  }
  return extreme;
}

describe('a correctly matched unit does what it is supposed to', () => {
  it('raises the haemoglobin and disturbs nothing else', () => {
    const derived = transfuseFor(preset('compatibleTransfusion'), 6);
    expect(derived.haemoglobinGDl).toBeGreaterThan(10.2);
    expect(derived.temperatureC).toBeLessThan(37.2);
    expect(derived.saO2Percent).toBeGreaterThan(95);
    expect(derived.bnpPgMl).toBeLessThan(80);
    expect(derived.directCoombs).toBeLessThan(0.05);
    expect(derived.c3MgDl).toBeGreaterThan(100);
  });

  it('and a normal heart absorbs the volume without being stretched at all', () => {
    // Overload is volume in EXCESS of what the circulation can take, not volume given. The
    // identical unit is unremarkable here and drowns the TACO patient.
    expect(worst(preset('compatibleTransfusion'), 24, (d) => -d.bnpPgMl)).toBeGreaterThan(-80);
  });
});

describe('an ABO-incompatible unit needs no prior exposure at all', () => {
  it('destroys the transfused cells within hours on a FIRST transfusion', () => {
    // Anti-A and anti-B are naturally occurring, so the usual reassurance that a first
    // exposure is safe does not apply to blood. This is the one reaction in the module that
    // a never-transfused patient is fully primed for.
    const derived = transfuseFor(preset('aboIncompatible'), 24);
    expect(derived.directCoombs).toBeGreaterThan(0.8);
    expect(derived.haptoglobinMgDl).toBeLessThan(40);
    expect(derived.c3MgDl).toBeLessThan(50);
    expect(derived.temperatureC).toBeGreaterThan(38);
  });

  it('and the haemoglobin FALLS after a transfusion instead of rising', () => {
    const compatible = transfuseFor(preset('compatibleTransfusion'), 24);
    const incompatible = transfuseFor(preset('aboIncompatible'), 24);
    expect(compatible.haemoglobinGDl).toBeGreaterThan(10);
    expect(incompatible.haemoglobinGDl).toBeLessThan(8);
  });

  it('is a type II reaction, using the same arm as an autoimmune haemolysis', () => {
    expect(transfuseFor(preset('aboIncompatible'), 24).dominantMechanism).toBe('II');
  });
});

describe('the reaction that is delayed by DAYS, because antibody has to be re-made', () => {
  it('leaves the patient well on the first day', () => {
    const derived = transfuseFor(preset('delayedHaemolytic'), 6);
    expect(derived.directCoombs).toBeLessThan(0.15);
    expect(derived.haemoglobinGDl).toBeGreaterThan(10);
  });

  it('and drops their haemoglobin three days later, with a positive Coombs', () => {
    // The clinical signature exactly: they go home well, and it is a blood count that finds it.
    const derived = transfuseFor(preset('delayedHaemolytic'), 76);
    expect(derived.haemoglobinGDl).toBeLessThan(9);
    expect(derived.directCoombs).toBeGreaterThan(0.3);
  });

  it('which is far slower than the same mechanism driven by standing antibody', () => {
    const abo = transfuseFor(preset('aboIncompatible'), 6).directCoombs;
    const delayed = transfuseFor(preset('delayedHaemolytic'), 6).directCoombs;
    expect(abo).toBeGreaterThan(delayed * 4);
  });
});

describe('two reactions that are not hypersensitivity at all', () => {
  it('gives a febrile non-haemolytic reaction fever and NOTHING else', () => {
    // The emptiness is the diagnosis. No haemolysis, no complement consumption, no hypotension.
    const derived = transfuseFor(preset('febrileNonHaemolytic'), 5);
    expect(derived.temperatureC).toBeGreaterThan(37.8);
    expect(derived.directCoombs).toBeLessThan(0.05);
    expect(derived.c3MgDl).toBeGreaterThan(100);
    expect(derived.haptoglobinMgDl).toBeGreaterThan(120);
    expect(derived.meanArterialPressureMmHg).toBeGreaterThan(85);
    expect(derived.haemoglobinGDl).toBeGreaterThan(10);
    expect(derived.dominantMechanism).toBe('none');
    expect(derived.nonImmuneCause).toBe('stored cytokines');
  });

  it('names circulatory overload as a non-immune cause rather than "no reaction"', () => {
    const derived = transfuseFor(preset('taco'), 3);
    expect(derived.dominantMechanism).toBe('none');
    expect(derived.nonImmuneCause).toBe('volume overload');
  });
});

describe('BNP is the row that separates a wet lung from a wet lung', () => {
  it('desaturates the patient in BOTH circulatory overload and TRALI', () => {
    // Which is exactly the difficulty: the chest film and the saturation look the same.
    expect(worst(preset('taco'), 24, (d) => d.saO2Percent)).toBeLessThan(93);
    expect(worst(preset('trali'), 24, (d) => d.saO2Percent)).toBeLessThan(93);
  });

  it('and raises the BNP in only ONE of them', () => {
    // BNP comes from a stretched ventricle. In TACO the ventricle is stretched by volume it
    // cannot clear; in TRALI the capillaries leak and the ventricle is never loaded at all.
    expect(transfuseFor(preset('taco'), 2).bnpPgMl).toBeGreaterThan(250);
    expect(transfuseFor(preset('trali'), 6).bnpPgMl).toBeLessThan(80);
  });

  it('so the two are told apart on one number, and treated in opposite directions', () => {
    const taco = transfuseFor(preset('taco'), 2);
    const trali = transfuseFor(preset('trali'), 6);
    expect(taco.saO2Percent).toBeLessThan(94);
    expect(trali.saO2Percent).toBeLessThan(94);
    expect(taco.bnpPgMl).toBeGreaterThan(trali.bnpPgMl * 3);
  });

  it('and neither of them is febrile or haemolysing', () => {
    for (const name of ['taco', 'trali'] as const) {
      const derived = transfuseFor(preset(name), 6);
      expect(derived.temperatureC, name).toBeLessThan(37.3);
      expect(derived.directCoombs, name).toBeLessThan(0.05);
      expect(derived.haemoglobinGDl, name).toBeGreaterThan(10);
    }
  });
});

describe('treatment follows the cause here too', () => {
  it('offloading volume rescues circulatory overload', () => {
    const inputs = preset('taco');
    let state = perturbTransfuse(createInitialState());
    for (let t = 0; t < 2; t += DT) state = step(state, inputs, DT).state;
    const before = computeDerived(state, inputs);
    expect(before.bnpPgMl).toBeGreaterThan(250);

    let after = computeDerived(perturbDiurese(state), inputs);
    expect(after.bnpPgMl).toBeLessThan(before.bnpPgMl * 0.5);
    expect(after.saO2Percent).toBeGreaterThan(before.saO2Percent);
  });

  it('and does essentially nothing for a leaking lung', () => {
    // Same wet lung, same desaturation, and the treatment that fixes one is useless for the
    // other. This is why the BNP is worth sending before the furosemide.
    const inputs = preset('trali');
    let state = perturbTransfuse(createInitialState());
    for (let t = 0; t < 6; t += DT) state = step(state, inputs, DT).state;
    const before = computeDerived(state, inputs);
    const after = computeDerived(perturbDiurese(state), inputs);
    expect(after.saO2Percent).toBeCloseTo(before.saO2Percent, 1);
  });
});

describe('every transfusion reaction is one of the mechanisms, or explicitly not one', () => {
  it('assigns each scenario to an arm or names why it has none', () => {
    const expected: [keyof typeof HYPERSENSITIVITY_PRESETS, string, number][] = [
      ['aboIncompatible', 'II', 24],
      ['anaphylacticIgaDeficient', 'I', 1],
      ['delayedHaemolytic', 'II', 76],
    ];
    for (const [name, arm, hours] of expected) {
      expect(transfuseFor(preset(name), hours).dominantMechanism, name).toBe(arm);
    }
    for (const [name, cause, hours] of [
      ['febrileNonHaemolytic', 'stored cytokines', 5],
      ['taco', 'volume overload', 3],
      ['trali', 'capillary leak', 6],
    ] as const) {
      const derived = transfuseFor(preset(name), hours);
      expect(derived.dominantMechanism, name).toBe('none');
      expect(derived.nonImmuneCause, name).toBe(cause);
    }
  });
});

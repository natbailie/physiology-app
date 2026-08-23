import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAdrenaline, perturbChallenge, step } from './engine';
import { DEFAULT_HYPERSENSITIVITY_INPUTS, HYPERSENSITIVITY_PRESETS } from './presets';
import type { HypersensitivityDerived, HypersensitivityInputs, HypersensitivityState } from './types';

const DT = 0.05;

function challenge(inputs: HypersensitivityInputs, hours: number) {
  let state = perturbChallenge(createInitialState(), inputs.antigenDose);
  let derived = computeDerived(state, inputs);
  let peak = { injury: 0, hours: 0 };
  let atPeak = derived;
  for (let t = 0; t < hours; t += DT) {
    const result = step(state, inputs, DT);
    state = result.state;
    derived = result.derived;
    if (derived.tissueInjury > peak.injury) {
      peak = { injury: derived.tissueInjury, hours: state.hoursSinceChallenge };
      atPeak = derived;
    }
  }
  return { state, derived, peak, atPeak };
}

const preset = (name: keyof typeof HYPERSENSITIVITY_PRESETS): HypersensitivityInputs => ({
  ...DEFAULT_HYPERSENSITIVITY_INPUTS,
  ...HYPERSENSITIVITY_PRESETS[name],
});

/** Injury at a given number of hours after the challenge. */
function injuryAt(inputs: HypersensitivityInputs, hours: number): number {
  let state = perturbChallenge(createInitialState(), inputs.antigenDose);
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < hours; t += DT) {
    const result = step(state, inputs, DT);
    state = result.state;
    derived = result.derived;
  }
  return derived.tissueInjury;
}

describe('sensitisation is what a previous exposure leaves behind', () => {
  it('does nothing at all to a naive host, however large the dose', () => {
    // The correct and slightly counter-intuitive answer: a first bee sting is uneventful. There
    // is no arm to mediate a reaction, because sensitisation has not happened yet.
    const { peak, derived } = challenge({ ...preset('naiveFirstExposure'), antigenDose: 200 }, 96);
    expect(peak.injury).toBeLessThan(0.02);
    expect(derived.dominantMechanism).toBe('none');
  });

  it('and nearly kills the same host once they are sensitised, on an identical dose', () => {
    const naive = challenge(preset('naiveFirstExposure'), 24);
    const sensitised = challenge(preset('typeIAnaphylaxis'), 24);
    expect(sensitised.peak.injury).toBeGreaterThan(0.7);
    expect(naive.peak.injury).toBeLessThan(0.02);
  });
});

describe('the four arms cannot work at each other speeds', () => {
  it('type I peaks within the hour, because the mediators are already made', () => {
    const { peak } = challenge(preset('typeIAnaphylaxis'), 96);
    expect(peak.hours).toBeLessThan(1);
    expect(injuryAt(preset('typeIAnaphylaxis'), 0.25)).toBeGreaterThan(0.5);
  });

  it('and is over within the day, because the granules run out rather than the antigen', () => {
    // Antigen is still present at 12 hours; the reaction has stopped anyway.
    expect(injuryAt(preset('typeIAnaphylaxis'), 12)).toBeLessThan(0.1);
  });

  it('type II takes hours: antibody must find a cell-bound antigen, then kill the cell', () => {
    const inputs = preset('typeIIHaemolysis');
    expect(injuryAt(inputs, 0.5)).toBeLessThan(0.1);
    expect(injuryAt(inputs, 24)).toBeGreaterThan(0.7);
  });

  it('type III takes hours too, but through complexes that must form and then deposit', () => {
    const inputs = preset('typeIIISerumSickness');
    expect(injuryAt(inputs, 0.5)).toBeLessThan(0.1);
    expect(injuryAt(inputs, 12)).toBeGreaterThan(0.3);
  });

  it('type IV takes DAYS, because cells have to physically arrive', () => {
    // Which is why a tuberculin test is read at 48 to 72 hours, and reading it at 6 would call
    // every positive patient negative.
    const inputs = preset('typeIVContactDermatitis');
    expect(injuryAt(inputs, 6)).toBeLessThan(0.05);
    expect(injuryAt(inputs, 48)).toBeGreaterThan(0.35);
    expect(injuryAt(inputs, 72)).toBeGreaterThan(injuryAt(inputs, 48));
  });

  it('orders the four peaks the way the classification does', () => {
    const peaks = (['typeIAnaphylaxis', 'typeIIHaemolysis', 'typeIIISerumSickness', 'typeIVContactDermatitis'] as const).map(
      (name) => challenge(preset(name), 120).peak.hours,
    );
    expect(peaks[0]).toBeLessThan(peaks[1]!);
    expect(peaks[1]).toBeLessThan(peaks[3]!);
    expect(peaks[2]).toBeLessThan(peaks[3]!);
  });
});

describe('each arm names itself on the labs', () => {
  it('raises tryptase in type I and in nothing else', () => {
    expect(challenge(preset('typeIAnaphylaxis'), 96).atPeak.tryptaseNgMl).toBeGreaterThan(40);
    for (const name of ['typeIIHaemolysis', 'typeIIISerumSickness', 'typeIVContactDermatitis'] as const) {
      expect(challenge(preset(name), 120).atPeak.tryptaseNgMl, name).toBeLessThan(10);
    }
  });

  it('consumes complement in types II and III, and leaves it untouched in I and IV', () => {
    // A low C3 and C4 localise the problem to the two antibody arms before any other test.
    expect(challenge(preset('typeIIHaemolysis'), 120).atPeak.c3MgDl).toBeLessThan(50);
    expect(challenge(preset('typeIIISerumSickness'), 120).atPeak.c3MgDl).toBeLessThan(80);
    expect(challenge(preset('typeIAnaphylaxis'), 96).atPeak.c3MgDl).toBeGreaterThan(100);
    expect(challenge(preset('typeIVContactDermatitis'), 120).atPeak.c3MgDl).toBeGreaterThan(100);
  });

  it('turns the Coombs positive in type II only — the antibody is ON the cell there', () => {
    // The whole difference between II and III is where the antigen sits, and this is the test
    // that finds out. In type III the complexes are in the circulation, not on a cell.
    expect(challenge(preset('typeIIHaemolysis'), 120).atPeak.directCoombs).toBeGreaterThan(0.8);
    expect(challenge(preset('typeIIISerumSickness'), 120).atPeak.directCoombs).toBeLessThan(0.1);
  });

  it('consumes haptoglobin only where a cell is actually being destroyed', () => {
    expect(challenge(preset('typeIIHaemolysis'), 120).atPeak.haptoglobinMgDl).toBeLessThan(40);
    expect(challenge(preset('typeIIISerumSickness'), 120).atPeak.haptoglobinMgDl).toBeGreaterThan(100);
  });

  it('drops the blood pressure only in type I — the one distributive shock here', () => {
    expect(challenge(preset('typeIAnaphylaxis'), 96).atPeak.meanArterialPressureMmHg).toBeLessThan(65);
    for (const name of ['typeIIHaemolysis', 'typeIIISerumSickness', 'typeIVContactDermatitis'] as const) {
      expect(challenge(preset(name), 120).atPeak.meanArterialPressureMmHg, name).toBeGreaterThan(85);
    }
  });

  it('produces fever where complement and macrophages are working, and NOT in anaphylaxis', () => {
    // A febrile reaction is evidence against type I before any test is sent.
    expect(challenge(preset('typeIAnaphylaxis'), 96).atPeak.temperatureC).toBeLessThan(37.2);
    expect(challenge(preset('typeIIHaemolysis'), 120).atPeak.temperatureC).toBeGreaterThan(38);
    expect(challenge(preset('typeIIISerumSickness'), 120).atPeak.temperatureC).toBeGreaterThan(37.5);
  });

  it('makes a soft immediate weal in type I and a firm delayed induration in type IV', () => {
    // Leaked plasma versus a cellular infiltrate. The difference you can feel with a finger is
    // the mechanistic difference.
    const typeI = challenge(preset('typeIAnaphylaxis'), 96).atPeak;
    const typeIV = challenge(preset('typeIVContactDermatitis'), 120).atPeak;
    expect(typeI.whealMm).toBeGreaterThan(10);
    expect(typeI.indurationMm).toBeLessThan(1);
    // Over 10 mm of induration is a positive Mantoux.
    expect(typeIV.indurationMm).toBeGreaterThan(10);
    expect(typeIV.whealMm).toBeLessThan(1);
  });

  it('names the right mechanism for each preset', () => {
    expect(challenge(preset('typeIAnaphylaxis'), 96).atPeak.dominantMechanism).toBe('I');
    expect(challenge(preset('typeIIHaemolysis'), 120).atPeak.dominantMechanism).toBe('II');
    expect(challenge(preset('typeIIISerumSickness'), 120).atPeak.dominantMechanism).toBe('III');
    expect(challenge(preset('typeIVContactDermatitis'), 120).atPeak.dominantMechanism).toBe('IV');
  });
});

describe('treatment follows the mechanism, not the severity', () => {
  it('blunts a type I reaction with mast cell blockade', () => {
    const untreated = challenge(preset('typeIAnaphylaxis'), 96);
    const treated = challenge(preset('treatedAnaphylaxis'), 96);
    expect(treated.peak.injury).toBeLessThan(untreated.peak.injury * 0.4);
  });

  it('and leaves the tryptase raised anyway, so the diagnosis survives the treatment', () => {
    // Blockade stops histamine ACTING; it does not stop the granules emptying. Useful: a
    // tryptase taken after adrenaline still tells you what happened.
    expect(challenge(preset('treatedAnaphylaxis'), 96).atPeak.tryptaseNgMl).toBeGreaterThan(40);
  });

  it('does nothing whatever to the other three arms', () => {
    // The practical payoff of the classification in one assertion.
    for (const name of ['typeIIHaemolysis', 'typeIIISerumSickness', 'typeIVContactDermatitis'] as const) {
      const plain = challenge(preset(name), 120).peak.injury;
      const blocked = challenge({ ...preset(name), mastCellStabilisation: 100 }, 120).peak.injury;
      expect(blocked, name).toBeCloseTo(plain, 5);
    }
  });

  it('rescues an anaphylaxis in progress when adrenaline is given', () => {
    const inputs = preset('typeIAnaphylaxis');
    let state = perturbChallenge(createInitialState(), inputs.antigenDose);
    for (let t = 0; t < 0.4; t += DT) state = step(state, inputs, DT).state;
    const before = computeDerived(state, inputs);
    expect(before.meanArterialPressureMmHg).toBeLessThan(70);

    let rescued: HypersensitivityState = perturbAdrenaline(state);
    let after: HypersensitivityDerived = computeDerived(rescued, inputs);
    for (let t = 0; t < 0.3; t += DT) {
      const result = step(rescued, inputs, DT);
      rescued = result.state;
      after = result.derived;
    }
    expect(after.meanArterialPressureMmHg).toBeGreaterThan(before.meanArterialPressureMmHg + 15);
  });
});

describe('complement deficiency spares the arms that need complement', () => {
  it('reduces type II cell destruction when complement is absent', () => {
    const intact = challenge(preset('typeIIHaemolysis'), 120).peak.injury;
    const deficient = challenge({ ...preset('typeIIHaemolysis'), complementFunction: 0 }, 120).peak.injury;
    expect(deficient).toBeLessThan(intact * 0.8);
  });

  it('and leaves type I completely unaffected, because it never used complement', () => {
    const intact = challenge(preset('typeIAnaphylaxis'), 96).peak.injury;
    const deficient = challenge({ ...preset('typeIAnaphylaxis'), complementFunction: 0 }, 96).peak.injury;
    expect(deficient).toBeCloseTo(intact, 5);
  });
});

describe('numerical safety', () => {
  it('never produces NaN or a value outside its range across extreme inputs', () => {
    for (const antigenDose of [0, 200]) {
      for (const igeSensitisation of [0, 1.5]) {
        for (const iggAgainstCellSurface of [0, 1.5]) {
          for (const sensitisedTCells of [0, 1.5]) {
            for (const complementFunction of [0, 1.5]) {
              const inputs: HypersensitivityInputs = {
                ...DEFAULT_HYPERSENSITIVITY_INPUTS,
                antigenDose,
                igeSensitisation,
                iggAgainstCellSurface,
                circulatingIggForComplexes: 1.5,
                sensitisedTCells,
                complementFunction,
                mastCellStabilisation: 0,
              };
              const { derived } = challenge(inputs, 60);
              for (const [key, value] of Object.entries(derived)) {
                if (typeof value !== 'number') continue;
                expect(Number.isFinite(value), `${key}`).toBe(true);
              }
              expect(derived.tissueInjury).toBeGreaterThanOrEqual(0);
              expect(derived.tissueInjury).toBeLessThanOrEqual(1);
              expect(derived.meanArterialPressureMmHg).toBeGreaterThan(20);
            }
          }
        }
      }
    }
  });
});

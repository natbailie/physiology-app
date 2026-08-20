import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbInfect, perturbVaccinate, responsePhase, step } from './engine';
import { DEFAULT_IMMUNE_INPUTS, IMMUNE_PRESETS } from './presets';
import { CYTOKINES } from './constants';
import type { ImmuneInputs, ImmuneState } from './types';

const DT = 0.05;

function run(inputs: ImmuneInputs, days: number, start?: ImmuneState) {
  let state = start ?? createInitialState();
  let peakLoad = 0;
  let peakTemperature = 0;
  for (let i = 0; i < days / DT; i++) {
    const derived = computeDerived(state, inputs);
    peakLoad = Math.max(peakLoad, derived.pathogenLoad);
    peakTemperature = Math.max(peakTemperature, derived.temperatureC);
    state = step(state, inputs, DT).state;
  }
  return { derived: computeDerived(state, inputs), peakLoad, peakTemperature, state };
}

function preset(name: keyof typeof IMMUNE_PRESETS, overrides: Partial<ImmuneInputs> = {}): ImmuneInputs {
  return { ...DEFAULT_IMMUNE_INPUTS, ...IMMUNE_PRESETS[name], ...overrides };
}

describe('immune — the primary response', () => {
  it('runs innate first, then adaptive, and clears the infection', () => {
    const { derived, peakLoad, peakTemperature } = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));

    expect(peakLoad).toBeGreaterThan(0.2);
    expect(derived.clearanceTimeDays).toBeGreaterThan(4);
    expect(derived.clearanceTimeDays).toBeLessThan(25);
    expect(derived.pathogenLoad).toBe(0);
    // Cytokine-driven fever accompanies the response and settles once it resolves.
    expect(peakTemperature).toBeGreaterThan(CYTOKINES.NORMAL_TEMPERATURE_C + 1);
    expect(derived.temperatureC).toBeLessThan(CYTOKINES.NORMAL_TEMPERATURE_C + 0.5);
  });

  it('makes IgM before IgG — class switching takes helper T cell support and time', () => {
    const inputs = DEFAULT_IMMUNE_INPUTS;
    let state = perturbInfect(createInitialState());

    let igmFirstDay = Infinity;
    let iggFirstDay = Infinity;
    for (let i = 0; i < 40 / DT; i++) {
      const derived = computeDerived(state, inputs);
      const day = i * DT;
      if (igmFirstDay === Infinity && derived.igmTitre > 0.05) igmFirstDay = day;
      if (iggFirstDay === Infinity && derived.iggTitre > 0.05) iggFirstDay = day;
      state = step(state, inputs, DT).state;
    }

    expect(igmFirstDay).toBeLessThan(iggFirstDay);
  });

  it('leaves durable memory behind after clearing', () => {
    const { derived } = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));
    expect(derived.memoryLevel).toBeGreaterThan(0.5);
    expect(derived.responsePhase).toBe('memory');
  });

  it('never produces NaN across extreme inputs', () => {
    const extremes: ImmuneInputs[] = [];
    for (const innateImmuneFunction of [0, 1.5]) {
      for (const helperTCellCount of [0, 1.5]) {
        for (const bCellFunction of [0, 1.5]) {
          for (const immunosuppression of [0, 100]) {
            extremes.push({ ...DEFAULT_IMMUNE_INPUTS, innateImmuneFunction, helperTCellCount, bCellFunction, immunosuppression });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived } = run(inputs, 30, perturbInfect(createInitialState()));
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      for (const level of [derived.pathogenLoad, derived.iggTitre, derived.memoryLevel, derived.helperTActivity]) {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('immune — memory makes the second exposure different', () => {
  it('clears a re-challenge far faster and at a far lower peak', () => {
    const primary = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));
    const secondary = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(primary.state));

    // The pathogen barely gets going before it is met by an existing response...
    expect(secondary.peakLoad).toBeLessThan(primary.peakLoad * 0.3);
    // ...and clearance is dramatically quicker.
    expect(secondary.derived.clearanceTimeDays).toBeLessThan(primary.derived.clearanceTimeDays * 0.4);
    // Little enough happens that there is essentially no fever — clinically, no illness.
    expect(secondary.peakTemperature).toBeLessThan(CYTOKINES.NORMAL_TEMPERATURE_C + 0.6);
  });

  it('is emergent from persisting memory, not scripted — a naive host does worse', () => {
    const naive = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));
    const experienced = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(naive.state));

    // Identical inputs and an identical inoculum; only the retained memory state differs.
    expect(naive.state.memoryLevel).toBeGreaterThan(0.5);
    expect(experienced.peakLoad).toBeLessThan(naive.peakLoad);
  });
});

describe('immune — vaccination', () => {
  it('builds memory without the host ever becoming infected', () => {
    const vaccinated = run(DEFAULT_IMMUNE_INPUTS, 40, perturbVaccinate(createInitialState()));

    // Nothing ever replicated...
    expect(vaccinated.peakLoad).toBe(0);
    expect(vaccinated.peakTemperature).toBeLessThan(CYTOKINES.NORMAL_TEMPERATURE_C + 0.3);
    // ...yet the adaptive system was primed and memory was laid down.
    expect(vaccinated.derived.memoryLevel).toBeGreaterThan(0.5);
  });

  it('protects against a subsequent challenge as well as surviving the infection would', () => {
    const naive = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));
    const vaccinated = run(DEFAULT_IMMUNE_INPUTS, 40, perturbVaccinate(createInitialState()));
    const challenged = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(vaccinated.state));

    expect(challenged.peakLoad).toBeLessThan(naive.peakLoad * 0.3);
    expect(challenged.derived.clearanceTimeDays).toBeLessThan(naive.derived.clearanceTimeDays * 0.4);
  });
});

describe('immune — immunodeficiency', () => {
  it('losing innate immunity lets the pathogen run riot before adaptive immunity arrives', () => {
    const healthy = run(preset('healthyHost'), 60, perturbInfect(createInitialState()));
    const neutropenic = run(preset('neutropenia'), 60, perturbInfect(createInitialState()));

    // The adaptive response still eventually engages, but the burden it has to deal with is
    // vastly greater because nothing restrained the organism in the first few days.
    expect(neutropenic.peakLoad).toBeGreaterThan(healthy.peakLoad * 1.5);
  });

  it('CD4 depletion cripples BOTH the cellular and humoral arms at once', () => {
    const healthy = run(preset('healthyHost'), 60, perturbInfect(createInitialState()));
    const hiv = run(preset('hivCd4Depletion'), 60, perturbInfect(createInitialState()));

    // Helper T cells license cytotoxic T cells AND support B cells, so losing them takes out
    // antibody and cell-mediated killing together — the reason CD4 count predicts risk so well.
    expect(hiv.derived.iggTitre).toBeLessThan(healthy.derived.iggTitre);
    expect(hiv.derived.cytotoxicTActivity).toBeLessThan(0.2);
    expect(hiv.derived.clearanceTimeDays).toBe(0);
    expect(hiv.derived.pathogenLoad).toBeGreaterThan(0);
  });

  it('B-cell deficiency removes antibody but leaves cell-mediated immunity intact', () => {
    const bDeficient = run(preset('bCellDeficiency'), 60, perturbInfect(createInitialState()));
    const hiv = run(preset('hivCd4Depletion'), 60, perturbInfect(createInitialState()));

    expect(bDeficient.derived.iggTitre).toBeLessThan(0.1);
    // The cellular arm is untouched — the contrast that distinguishes it from CD4 depletion.
    expect(bDeficient.derived.cytotoxicTActivity).toBeGreaterThan(0.3);
    expect(bDeficient.derived.cytotoxicTActivity).toBeGreaterThan(hiv.derived.cytotoxicTActivity * 3);
  });

  it('broad immunosuppression disables every arm', () => {
    const suppressed = run(preset('transplantImmunosuppression'), 60, perturbInfect(createInitialState()));

    expect(suppressed.derived.iggTitre).toBeLessThan(0.1);
    expect(suppressed.derived.cytotoxicTActivity).toBeLessThan(0.1);
    expect(suppressed.derived.clearanceTimeDays).toBe(0);
    expect(suppressed.peakLoad).toBeGreaterThan(0.8);
  });
});

describe('immune — pathogen type selects which arm matters', () => {
  it('an extracellular organism is cleared largely by antibody', () => {
    const withAntibody = run(preset('healthyHost'), 60, perturbInfect(createInitialState()));
    const withoutAntibody = run(preset('bCellDeficiency'), 60, perturbInfect(createInitialState()));

    expect(withAntibody.derived.clearanceTimeDays).toBeGreaterThan(0);
    // Antibody is what this organism needs, so losing it prevents clearance entirely.
    expect(withoutAntibody.derived.clearanceTimeDays).toBe(0);
  });

  it('an intracellular organism still gets cleared, because cytotoxic T cells reach it', () => {
    const intracellular = run(preset('intracellularPathogen'), 60, perturbInfect(createInitialState()));
    expect(intracellular.derived.clearanceTimeDays).toBeGreaterThan(0);
    expect(intracellular.derived.pathogenLoad).toBe(0);
  });
});

describe('immune — response phase', () => {
  it('reports naive before exposure and memory after clearance', () => {
    expect(responsePhase(createInitialState())).toBe('naive');
    const { state } = run(DEFAULT_IMMUNE_INPUTS, 40, perturbInfect(createInitialState()));
    expect(responsePhase(state)).toBe('memory');
  });
});

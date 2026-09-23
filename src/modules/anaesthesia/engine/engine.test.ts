import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_ANAESTHESIA_INPUTS, ANAESTHESIA_PRESETS } from './presets';
import type { AnaesthesiaInputs } from './types';

const DT = 0.05;

function settled(inputs: AnaesthesiaInputs, seconds = 300): ReturnType<typeof computeDerived> {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += DT) state = step(state, inputs, DT).state;
  return computeDerived(state, inputs);
}

function withInputs(overrides: Partial<AnaesthesiaInputs>): AnaesthesiaInputs {
  return { ...DEFAULT_ANAESTHESIA_INPUTS, ...overrides };
}

describe('the wash-in story', () => {
  it('settles the baseline into maintenance and reads the ceiling near the circuit-delivered dial', () => {
    const d = settled(withInputs({}));
    expect(d.state).toBe('Equilibrated — maintenance');
    expect(d.washInProgress).toBeGreaterThan(0.9);
    // The circuit delivers ~2/3 of the 2% dial at 6 L/min fresh gas, so the alveolar level sits
    // just over a percent rather than at the dial itself.
    expect(d.alveolarAgentPct).toBeGreaterThan(0.9);
    expect(d.alveolarAgentPct).toBeLessThan(2);
    expect(d.inspiredFractionPct).toBeLessThan(d.dialPct);
    expect(d.timeTo90PctMinutes).toBeGreaterThan(2);
    expect(d.timeTo90PctMinutes).toBeLessThan(8);
  });

  it('wakens the effect site only after the alveoli have charged', () => {
    const early = settled(withInputs({}), 20);
    const late = settled(withInputs({}), 300);
    expect(early.effectSiteAgentPct).toBeLessThan(early.alveolarAgentPct);
    // By settlement the brain has caught almost all of the alveolar level — the residual lag is the
    // last few percent the rising alveolar keeps ahead by.
    expect(late.effectSiteAgentPct).toBeCloseTo(late.alveolarAgentPct, 1);
    expect(late.effectSiteAgentPct).toBeGreaterThan(early.effectSiteAgentPct);
  });

  it('makes desflurane reach 90% far sooner than halothane', () => {
    const des = settled(withInputs({ bloodGasSolubility: 0.45 }));
    const halo = settled(withInputs({ bloodGasSolubility: 2.3 }));
    expect(des.timeTo90PctMinutes).toBeLessThan(halo.timeTo90PctMinutes * 0.55);
  });

  it('rises toward the dial faster as the fresh gas flow climbs', () => {
    const rebreathing = settled(withInputs({ freshGasFlowLMin: 1 }), 300);
    const flushed = settled(withInputs({ freshGasFlowLMin: 10 }), 300);
    expect(flushed.timeTo90PctMinutes).toBeLessThan(rebreathing.timeTo90PctMinutes * 0.55);
    // At low flow the circuit re-breathes more, so the delivered fraction falls short of the dial.
    expect(rebreathing.inspiredToDialRatio).toBeLessThan(flushed.inspiredToDialRatio);
  });

  it('lets a high cardiac output both absorb more and equilibrate its effect site sooner', () => {
    const normal = settled(withInputs({ cardiacOutputLMin: 5 }));
    const high = settled(withInputs({ cardiacOutputLMin: 8 }));
    expect(high.absorptionIndex).toBeGreaterThan(normal.absorptionIndex * 1.5);
    // More blood per minute charges the compartments faster: the alveolar level and the effect site
    // reach their ceilings sooner, at the price of stripping more agent from the circuit.
    expect(high.timeTo90PctMinutes).toBeLessThan(normal.timeTo90PctMinutes);
    expect(high.washInProgress).toBeGreaterThan(normal.washInProgress);
  });

  it('reads as emergence the moment the dial drops to zero', () => {
    const d = settled(withInputs({ dialPct: 0 }));
    expect(d.state).toBe('Wash-out — emergence');
  });
});

describe('presets settle into the phase their label promises', () => {
  it('every shipped preset lands where its name says', () => {
    const expectations: Record<keyof typeof ANAESTHESIA_PRESETS, string> = {
      sevofluraneInduction: 'Equilibrated — maintenance',
      desfluraneRapidWashin: 'Equilibrated — maintenance',
      // Halothane and a low fresh-gas flow are the two that are NOT done after five minutes —
      // that is precisely the teaching, and why the presets are named as they are.
      halothaneSlowWashin: 'Rising toward steady state',
      lowFlowRebreathing: 'Rising toward steady state',
      highCardiacOutput: 'Equilibrated — maintenance',
      emergenceWashout: 'Wash-out — emergence',
    };
    for (const name of Object.keys(ANAESTHESIA_PRESETS) as (keyof typeof ANAESTHESIA_PRESETS)[]) {
      const d = settled(ANAESTHESIA_PRESETS[name]);
      expect(d.state, `${name}: expected ${expectations[name]}, got ${d.state}`).toBe(expectations[name]);
    }
  });

  it('the four volatile presets are ranked by their wash-in speed', () => {
    const desflurane = settled(ANAESTHESIA_PRESETS.desfluraneRapidWashin).timeTo90PctMinutes;
    const sevoflurane = settled(ANAESTHESIA_PRESETS.sevofluraneInduction).timeTo90PctMinutes;
    const halothane = settled(ANAESTHESIA_PRESETS.halothaneSlowWashin).timeTo90PctMinutes;
    // Desflurane at 10 L/min must beat sevoflurane at 8 L/min, and halothane the lot.
    expect(desflurane).toBeLessThan(sevoflurane);
    expect(sevoflurane).toBeLessThan(halothane);
  });
});

describe('model hygiene', () => {
  it('never produces NaN across extreme inputs', () => {
    const dials = [0, 8];
    const flows = [0.5, 10];
    const lambdas = [0.2, 2.5];
    const cos = [1, 10];
    for (const dialPct of dials) {
      for (const freshGasFlowLMin of flows) {
        for (const bloodGasSolubility of lambdas) {
          for (const cardiacOutputLMin of cos) {
            const inputs: AnaesthesiaInputs = {
              dialPct,
              freshGasFlowLMin,
              bloodGasSolubility,
              cardiacOutputLMin,
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

  it('keeps the reading inside the dial when high flows cannot flush more gas in', () => {
    const d = settled(withInputs({ dialPct: 8, freshGasFlowLMin: 10 }));
    expect(d.alveolarAgentPct).toBeLessThanOrEqual(8);
  });
});
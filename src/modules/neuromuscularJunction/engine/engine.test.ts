import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_NMJ_INPUTS, NMJ_PRESETS, NMJ_PRESET_ORDER } from './presets';
import type { NmjDerived, NmjInputs } from './types';

function settle(patch: Partial<NmjInputs>, seconds = 120): NmjDerived {
  const inputs = { ...DEFAULT_NMJ_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.02);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('the safety factor', () => {
  it('gives a normal junction a large reserve', () => {
    const d = settle(NMJ_PRESETS.normal);
    expect(d.safetyFactor).toBeGreaterThan(3);
    expect(d.muscleForcePercent).toBeGreaterThan(99);
  });

  it('means losing half the receptors changes nothing a patient would notice', () => {
    const half = settle({ receptorDensity: 0.5 });
    // Half of a fourfold reserve still fires the fibre every time. This is why neuromuscular
    // disease is silent until it is severe, and then declares itself quickly.
    expect(half.safetyFactor).toBeGreaterThan(1.6);
    expect(half.muscleForcePercent).toBeGreaterThan(90);
  });

  it('collapses once the reserve is actually spent', () => {
    const severe = settle({ receptorDensity: 0.26 });
    expect(severe.muscleForcePercent).toBeLessThan(85);
  });
});

describe('the train-of-four', () => {
  it('does not fade in a normal junction', () => {
    const d = settle(NMJ_PRESETS.normal);
    expect(d.trainOfFourRatio).toBeGreaterThan(0.97);
  });

  it('fades in myasthenia, because the same depletion now crosses threshold', () => {
    const d = settle(NMJ_PRESETS.myastheniaGravis);
    expect(d.trainOfFourRatio).toBeLessThan(0.9);
  });

  it('fades under a competitive blocker but much less under a depolarising one', () => {
    const competitive = settle(NMJ_PRESETS.nondepolarisingBlock);
    const depolarising = settle(NMJ_PRESETS.depolarisingBlock);

    // A competitive blocker also occupies presynaptic autoreceptors and cripples mobilisation.
    // An agonist does not, which is why fade distinguishes the two classes at the bedside.
    expect(competitive.trainOfFourRatio).toBeLessThan(0.8);
    expect(depolarising.trainOfFourRatio).toBeGreaterThan(competitive.trainOfFourRatio);
  });
});

describe('presynaptic versus postsynaptic', () => {
  it('increments dramatically at high rates in Lambert-Eaton', () => {
    const d = settle(NMJ_PRESETS.lambertEaton);
    // Calcium accumulates faster than it decays, and release goes as a steep power of calcium.
    expect(d.postTetanicRatio).toBeGreaterThan(3);
    expect(d.classification).toBe('Lambert-Eaton');
  });

  it('does NOT increment like that in myasthenia — release was never the limiting step', () => {
    const mg = settle(NMJ_PRESETS.myastheniaGravis);
    const lems = settle(NMJ_PRESETS.lambertEaton);

    expect(mg.postTetanicRatio).toBeLessThan(lems.postTetanicRatio);
    expect(mg.classification).toBe('myasthenia gravis');
  });

  it('classifies every preset as the lesion it is named for', () => {
    const expected: Record<string, string> = {
      normal: 'normal transmission',
      myastheniaGravis: 'myasthenia gravis',
      lambertEaton: 'Lambert-Eaton',
      botulism: 'botulism',
      nondepolarisingBlock: 'non-depolarising block',
      depolarisingBlock: 'depolarising block',
      organophosphate: 'cholinergic excess',
      pyridostigmine: 'myasthenia gravis',
    };
    for (const name of NMJ_PRESET_ORDER) {
      expect(settle(NMJ_PRESETS[name]).classification, name).toBe(expected[name]);
    }
  });
});

describe('pharmacology', () => {
  it('an anticholinesterase restores strength in myasthenia', () => {
    const untreated = settle(NMJ_PRESETS.myastheniaGravis);
    const treated = settle(NMJ_PRESETS.pyridostigmine);

    // Each quantum is bigger and lasts longer, so the surviving receptors are driven harder.
    expect(treated.muscleForcePercent).toBeGreaterThan(untreated.muscleForcePercent + 15);
  });

  it('but taken far enough produces a block of its own', () => {
    const therapeutic = settle({ acetylcholinesteraseActivity: 0.45 });
    const poisoned = settle(NMJ_PRESETS.organophosphate);

    expect(therapeutic.muscleForcePercent).toBeGreaterThan(95);
    // Transmitter accumulates until the end plate is persistently depolarised and stops
    // responding — which is why an anticholinesterase deepens a depolarising block.
    expect(poisoned.desensitisation).toBeGreaterThan(0.5);
    expect(poisoned.classification).toBe('cholinergic excess');
  });

  it('blocks transmission at the first step in botulism, whatever the end plate is doing', () => {
    const d = settle(NMJ_PRESETS.botulism);
    expect(d.quantalContent).toBeLessThan(15);
    expect(d.muscleForcePercent).toBeLessThan(20);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<NmjInputs>[] = [
      { vesicleReleaseCapacity: 0, calciumChannelFunction: 0, receptorDensity: 0 },
      { acetylcholinesteraseActivity: 0, depolarisingBlocker: 100, stimulationFrequencyHz: 50 },
      { nondepolarisingBlocker: 100, stimulationFrequencyHz: 0.5 },
      { vesicleReleaseCapacity: 1.5, calciumChannelFunction: 1.5, receptorDensity: 1.5, acetylcholinesteraseActivity: 2 },
    ];

    for (const patch of extremes) {
      const d = settle(patch, 40);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      for (const response of d.trainOfFour) expect(Number.isFinite(response)).toBe(true);
      expect(d.muscleForcePercent).toBeGreaterThanOrEqual(0);
      expect(d.muscleForcePercent).toBeLessThanOrEqual(100);
    }
  });
});

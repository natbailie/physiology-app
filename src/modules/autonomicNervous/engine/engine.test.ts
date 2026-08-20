import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { ANS_PRESETS, DEFAULT_ANS_INPUTS } from './presets';
import { HEART } from './constants';
import type { AnsInputs, AnsState } from './types';

function settle(inputs: AnsInputs, seconds = 400, dt = 1): AnsState {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += dt) state = step(state, inputs, dt).state;
  return state;
}

function settled(name: keyof typeof ANS_PRESETS) {
  const inputs: AnsInputs = { ...DEFAULT_ANS_INPUTS, ...ANS_PRESETS[name] };
  return computeDerived(settle(inputs), inputs);
}

describe('engine — resting balance', () => {
  it('rests with vagal tone holding heart rate below the intrinsic pacemaker rate', () => {
    const derived = computeDerived(settle(DEFAULT_ANS_INPUTS), DEFAULT_ANS_INPUTS);
    expect(derived.heartRateBpm).toBeLessThan(HEART.INTRINSIC_RATE_BPM);
    expect(derived.heartRateBpm).toBeGreaterThan(50);
  });

  it('never produces NaN/Infinity, and keeps every output within its clamps', () => {
    const extremes: AnsInputs[] = [];
    for (const sympatheticTone of [0, 100]) {
      for (const parasympatheticTone of [0, 100]) {
        for (const circulatingEpinephrine of [0, 100]) {
          for (const blockade of [0, 100]) {
            extremes.push({
              sympatheticTone,
              parasympatheticTone,
              circulatingEpinephrine,
              betaBlockade: blockade,
              muscarinicBlockade: blockade,
              alphaBlockade: blockade,
              cholinesteraseInhibition: blockade,
            });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const derived = computeDerived(settle(inputs), inputs);
      for (const [key, value] of Object.entries(derived)) {
        expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
      }
      expect(derived.heartRateBpm).toBeGreaterThanOrEqual(HEART.MIN_BPM - 1e-6);
      expect(derived.heartRateBpm).toBeLessThanOrEqual(HEART.MAX_BPM + 1e-6);
      for (const activation of [derived.alpha1Activation, derived.beta1Activation, derived.beta2Activation, derived.muscarinicActivation]) {
        expect(activation).toBeGreaterThanOrEqual(0);
        expect(activation).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('engine — reciprocal organ responses', () => {
  it('drives heart rate UP but gut motility DOWN in fight-or-flight — the direction flips by organ', () => {
    const rest = settled('restAndDigest');
    const stress = settled('fightOrFlight');

    expect(stress.heartRateBpm).toBeGreaterThan(rest.heartRateBpm);
    // The sign reversal is the whole teaching point: same sympathetic surge, opposite effect.
    expect(stress.giMotilityIndex).toBeLessThan(rest.giMotilityIndex);
    expect(stress.pupilDiameterMm).toBeGreaterThan(rest.pupilDiameterMm);
    expect(stress.bronchialDiameterPercent).toBeGreaterThan(rest.bronchialDiameterPercent);
  });

  it('rest-and-digest raises gut motility and secretions while slowing the heart', () => {
    const rest = settled('restAndDigest');
    const stress = settled('fightOrFlight');

    expect(rest.giMotilityIndex).toBeGreaterThan(stress.giMotilityIndex);
    expect(rest.secretionIndex).toBeGreaterThan(stress.secretionIndex);
    expect(rest.autonomicBalance).toBeLessThan(0);
    expect(stress.autonomicBalance).toBeGreaterThan(0);
  });
});

describe('engine — beta blockade', () => {
  it('blunts the tachycardia of a sympathetic surge without touching muscarinic effects', () => {
    const unblockedInputs: AnsInputs = { ...DEFAULT_ANS_INPUTS, sympatheticTone: 70, parasympatheticTone: 20 };
    const blockedInputs: AnsInputs = { ...DEFAULT_ANS_INPUTS, ...ANS_PRESETS.betaBlocker };

    const unblocked = computeDerived(settle(unblockedInputs), unblockedInputs);
    const blocked = computeDerived(settle(blockedInputs), blockedInputs);

    expect(blocked.heartRateBpm).toBeLessThan(unblocked.heartRateBpm);
    expect(blocked.beta1Activation).toBeLessThan(unblocked.beta1Activation);
    // Muscarinic receptors are untouched by beta blockade.
    expect(blocked.muscarinicActivation).toBeCloseTo(unblocked.muscarinicActivation, 5);
  });
});

describe('engine — anticholinergic toxidrome (atropine)', () => {
  it('produces tachycardia, mydriasis, dry secretions and reduced gut motility', () => {
    const baseline = computeDerived(settle(DEFAULT_ANS_INPUTS), DEFAULT_ANS_INPUTS);
    const atropinized = settled('atropine');

    // Removing the vagal brake lets heart rate rise toward the intrinsic pacemaker rate.
    expect(atropinized.heartRateBpm).toBeGreaterThan(baseline.heartRateBpm);
    expect(atropinized.pupilDiameterMm).toBeGreaterThan(baseline.pupilDiameterMm);
    expect(atropinized.secretionIndex).toBeLessThan(baseline.secretionIndex);
    expect(atropinized.giMotilityIndex).toBeLessThan(baseline.giMotilityIndex);
    expect(atropinized.muscarinicActivation).toBeLessThan(0.05);
  });
});

describe('engine — cholinergic crisis (organophosphate)', () => {
  it('produces the mirror-image SLUDGE picture: bradycardia, miosis, hypersecretion, bronchoconstriction', () => {
    const baseline = computeDerived(settle(DEFAULT_ANS_INPUTS), DEFAULT_ANS_INPUTS);
    const poisoned = settled('organophosphate');
    const atropinized = settled('atropine');

    expect(poisoned.heartRateBpm).toBeLessThan(baseline.heartRateBpm);
    expect(poisoned.pupilDiameterMm).toBeLessThan(baseline.pupilDiameterMm);
    expect(poisoned.secretionIndex).toBeGreaterThan(baseline.secretionIndex);
    expect(poisoned.bronchialDiameterPercent).toBeLessThan(baseline.bronchialDiameterPercent);
    expect(poisoned.giMotilityIndex).toBeGreaterThan(baseline.giMotilityIndex);

    // Every sign points the opposite way to the anticholinergic toxidrome.
    expect(poisoned.heartRateBpm).toBeLessThan(atropinized.heartRateBpm);
    expect(poisoned.pupilDiameterMm).toBeLessThan(atropinized.pupilDiameterMm);
    expect(poisoned.secretionIndex).toBeGreaterThan(atropinized.secretionIndex);
  });

  it('cholinesterase inhibition amplifies existing vagal outflow rather than creating it', () => {
    const noVagalTone: AnsInputs = { ...DEFAULT_ANS_INPUTS, parasympatheticTone: 0, cholinesteraseInhibition: 90 };
    const derived = computeDerived(settle(noVagalTone), noVagalTone);
    expect(derived.muscarinicActivation).toBeCloseTo(0, 5);
  });
});

describe('engine — pheochromocytoma', () => {
  it('reaches beta-2 receptors more strongly than neural sympathetic outflow does', () => {
    const neuralInputs: AnsInputs = { ...DEFAULT_ANS_INPUTS, sympatheticTone: 90 };
    const hormonalInputs: AnsInputs = { ...DEFAULT_ANS_INPUTS, ...ANS_PRESETS.pheochromocytoma };

    const neural = computeDerived(settle(neuralInputs), neuralInputs);
    const hormonal = computeDerived(settle(hormonalInputs), hormonalInputs);

    // Circulating epinephrine is a potent beta-2 agonist; sympathetic nerves barely innervate
    // beta-2-rich tissue such as bronchial smooth muscle.
    expect(hormonal.beta2Activation).toBeGreaterThan(neural.beta2Activation);
    expect(hormonal.bronchialDiameterPercent).toBeGreaterThan(neural.bronchialDiameterPercent);
  });
});

describe('engine — second messengers', () => {
  it('routes beta receptors through cAMP and alpha-1/muscarinic through IP3/Ca2+', () => {
    const betaOnly: AnsInputs = { ...DEFAULT_ANS_INPUTS, sympatheticTone: 0, parasympatheticTone: 0, circulatingEpinephrine: 90, alphaBlockade: 100 };
    const muscarinicOnly: AnsInputs = { ...DEFAULT_ANS_INPUTS, sympatheticTone: 0, parasympatheticTone: 90 };

    const beta = computeDerived(settle(betaOnly), betaOnly);
    const muscarinic = computeDerived(settle(muscarinicOnly), muscarinicOnly);

    expect(beta.campLevel).toBeGreaterThan(muscarinic.campLevel);
    expect(muscarinic.ip3CalciumLevel).toBeGreaterThan(beta.ip3CalciumLevel);
  });
});

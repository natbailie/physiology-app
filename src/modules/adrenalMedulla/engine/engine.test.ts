import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbParoxysm, step } from './engine';
import { DEFAULT_MEDULLA_INPUTS, MEDULLA_PRESETS } from './presets';
import type { MedullaDerived, MedullaInputs } from './types';

function settle(patch: Partial<MedullaInputs>, seconds = 40000): MedullaDerived {
  const inputs = { ...DEFAULT_MEDULLA_INPUTS, ...patch };
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
  it('keeps a normal subject ordinary', () => {
    const d = settle(MEDULLA_PRESETS.normal);
    expect(d.mapMmHg).toBeLessThan(100);
    expect(d.heartRateBpm).toBeLessThan(85);
    expect(d.triadCount).toBe(0);
    expect(d.classification).toBe('normal sympathetic tone');
  });
});

describe('phaeochromocytoma phenotypes', () => {
  it('gives NA-dominant tumours sustained pressure with contracted volume', () => {
    const d = settle({ ...MEDULLA_PRESETS.naPhaeochromocytoma }, 900000);
    expect(d.mapMmHg).toBeGreaterThan(125);
    expect(d.plasmaNa).toBeGreaterThan(20);
    expect(d.classification).toBe('noradrenaline-predominant phaeochromocytoma');
    // Weeks of vasoconstriction contract the plasma volume.
    expect(d.bloodVolumePct).toBeLessThan(95);
  });

  it('gives AD-dominant tumours palpitations and higher arrhythmia risk over pressure', () => {
    const naTumour = settle(MEDULLA_PRESETS.naPhaeochromocytoma);
    const adTumour = settle(MEDULLA_PRESETS.adPhaeochromocytoma);
    expect(adTumour.heartRateBpm).toBeGreaterThan(naTumour.heartRateBpm);
    expect(adTumour.arrhythmiaRiskPct).toBeGreaterThan(naTumour.arrhythmiaRiskPct);
    expect(adTumour.classification).toBe('adrenaline-predominant phaeochromocytoma');
  });
});

describe('the beta-first disaster', () => {
  it('produces WORSE pressure than the untreated tumour', () => {
    const untreated = settle(MEDULLA_PRESETS.crisisUncontrolled);
    const misprescribed = settle(MEDULLA_PRESETS.betaFirstError);
    expect(misprescribed.mapMmHg).toBeGreaterThan(untreated.mapMmHg);
    expect(misprescribed.classification).toContain('unopposed-alpha');
  });

  it('is rescued by proper sequential alpha-then-beta blockade', () => {
    const d = settle(MEDULLA_PRESETS.properlyBlocked);
    expect(d.mapMmHg).toBeLessThan(125);
    expect(d.classification).toBe('phaeochromocytoma adequately blocked');
    const crisis = settle(MEDULLA_PRESETS.crisisUncontrolled);
    expect(crisis.mapMmHg).toBeGreaterThan(d.mapMmHg + 40);
  });
});

describe('paroxysms', () => {
  it('spikes pressure in an unblocked tumour and is blunted by alpha coverage', () => {
    const unblockedInputs = { ...DEFAULT_MEDULLA_INPUTS, ...MEDULLA_PRESETS.naPhaeochromocytoma };
    let state = createInitialState();
    for (let t = 0; t < 30000; t += 0.2) state = step(state, unblockedInputs, 0.2).state;
    const before = computeDerived(state, unblockedInputs);

    let paroxysmic = perturbParoxysm(state);
    for (let t = 0; t < 1200; t += 0.2) paroxysmic = step(paroxysmic, unblockedInputs, 0.2).state;
    const during = computeDerived(paroxysmic, unblockedInputs);
    expect(during.mapMmHg).toBeGreaterThan(before.mapMmHg + 15);
    expect(during.paroxysmActive).toBe(true);

    // Alpha coverage flattens the same surge.
    const blockedInputs = { ...unblockedInputs, alphaBlockadePct: 80 };
    let covered = createInitialState();
    for (let t = 0; t < 20000; t += 0.2) covered = step(covered, blockedInputs, 0.2).state;
    let coveredParoxysm = perturbParoxysm(covered);
    for (let t = 0; t < 1200; t += 0.2) coveredParoxysm = step(coveredParoxysm, blockedInputs, 0.2).state;
    expect(computeDerived(coveredParoxysm, blockedInputs).mapMmHg).toBeLessThan(during.mapMmHg - 20);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<MedullaInputs>[] = [
      { tumourSecretionRate: 100, noradrenalineFractionPct: 100 },
      { tumourSecretionRate: 100, noradrenalineFractionPct: 0 },
      { alphaBlockadePct: 100, betaBlockadePct: 100, tumourSecretionRate: 80 },
      { betaBlockadePct: 100, tumourSecretionRate: 60 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 20000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.mapMmHg).toBeGreaterThan(60);
      expect(d.mapMmHg).toBeLessThan(320);
      expect(d.heartRateBpm).toBeGreaterThanOrEqual(35);
    }
  });
});

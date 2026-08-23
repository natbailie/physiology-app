import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbNoiseExposure, step } from './engine';
import { AUDIOGRAM_FREQS_HZ } from './constants';
import { DEFAULT_HEARING_INPUTS, HEARING_PRESETS } from './presets';
import type { HearingDerived, HearingInputs } from './types';

function settle(patch: Partial<HearingInputs>, seconds = 4000): HearingDerived {
  const inputs = { ...DEFAULT_HEARING_INPUTS, ...patch };
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

function thresholdAt(derived: HearingDerived, frequencyHz: number): number {
  const index = AUDIOGRAM_FREQS_HZ.indexOf(frequencyHz as (typeof AUDIOGRAM_FREQS_HZ)[number]);
  return derived.airConductionDb[index] ?? NaN;
}

describe('baseline', () => {
  it('settles a normal ear on textbook values', () => {
    const d = settle(HEARING_PRESETS.normal);
    expect(d.ptaDb).toBeLessThan(10);
    expect(d.classification).toBe('normal hearing');
    expect(d.speechDiscriminationPct).toBeGreaterThan(90);
    expect(d.rinneResult).toContain('positive');
    expect(d.weberCode).toBe(0);
  });
});

describe('conductive versus sensorineural', () => {
  it('shows otosclerosis as a pure gap with everything else spared', () => {
    const d = settle(HEARING_PRESETS.otosclerosis);
    expect(d.airBoneGapDb).toBeGreaterThanOrEqual(35);
    // Bone conduction bypasses the middle ear entirely.
    const bone = d.boneConductionDb.reduce((a, b) => a + b, 0) / d.boneConductionDb.length;
    expect(bone).toBeLessThan(5);
    expect(d.classification).toBe('conductive loss');
    expect(d.rinneResult).toContain('negative');
    expect(d.weberCode).toBe(1);
    // The cochlea is intact: no recruitment, and discrimination survives once loud enough.
    expect(d.recruitmentIndex).toBeCloseTo(1, 1);
  });

  it('marks the noise-damaged cochlea with a 4 kHz notch and recruitment', () => {
    const d = settle(HEARING_PRESETS.noiseNotch);
    expect(thresholdAt(d, 4000) - thresholdAt(d, 1000)).toBeGreaterThan(30);
    expect(d.classification).toBe('sensorineural loss');
    // Loudness grows abnormally fast past threshold where the amplifier is gone.
    expect(d.recruitmentIndex).toBeGreaterThan(1.2);
  });

  it('gives presbycusis a downsloping audiogram that spares the lows', () => {
    const d = settle(HEARING_PRESETS.presbycusis);
    expect(thresholdAt(d, 8000) - thresholdAt(d, 500)).toBeGreaterThan(20);
    expect(thresholdAt(d, 500)).toBeLessThan(15);
  });

  it("keeps Ménière's loss in the LOW frequencies", () => {
    const d = settle(HEARING_PRESETS.menieres);
    expect(thresholdAt(d, 250) - thresholdAt(d, 4000)).toBeGreaterThan(15);
    expect(d.classification).toBe('sensorineural loss');
  });

  it('destroys discrimination when inner hair cells fail, even with amplification', () => {
    const mild = settle({ innerHairCellIntegrity: 0.8 });
    const severe = settle(HEARING_PRESETS.severeCochlearLoss);
    expect(severe.ptaDb).toBeGreaterThan(60);
    expect(severe.speechDiscriminationPct).toBeLessThan(mild.speechDiscriminationPct);
    expect(severe.speechDiscriminationPct).toBeLessThan(40);
  });
});

describe('loudness behaviour', () => {
  it('goes deaf to quiet sounds but recruits loudly when outer hair cells are lost', () => {
    const healthy = settle({ stimulusLevelDbHl: 80 });
    const damaged = settle({
      ...HEARING_PRESETS.noiseNotch,
      stimulusLevelDbHl: 80,
      stimulusFrequencyHz: 4000,
    });
    // At high level the recruited ear is not proportionally quieter — compression is gone.
    expect(damaged.loudnessPct).toBeGreaterThan(healthy.loudnessPct * 0.4);
    expect(damaged.recruitmentIndex).toBeGreaterThan(1.2);
  });

  it('contracts the stapedius reflex only at high stimulus levels', () => {
    const loud = settle({ stimulusLevelDbHl: 105 });
    const soft = settle({ stimulusLevelDbHl: 50 });
    expect(loud.stapediusActive).toBe(true);
    expect(soft.stapediusActive).toBe(false);
  });
});

describe('temporary threshold shift', () => {
  it('raises thresholds after exposure and recovers over simulated hours', () => {
    const inputs = { ...DEFAULT_HEARING_INPUTS };
    let state = createInitialState();
    for (let t = 0; t < 1000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);

    let shifted = perturbNoiseExposure(state);
    expect(shifted.temporaryThresholdShiftDb).toBeGreaterThan(0);
    for (let t = 0; t < 100; t += 0.2) shifted = step(shifted, inputs, 0.2).state;
    const during = computeDerived(shifted, inputs);
    expect(during.ptaDb).toBeGreaterThan(before.ptaDb);

    for (let t = 0; t < 20000; t += 0.2) shifted = step(shifted, inputs, 0.2).state;
    const recovered = computeDerived(shifted, inputs);
    expect(recovered.ptaDb).toBeLessThan(during.ptaDb);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<HearingInputs>[] = [
      { stimulusFrequencyHz: 125, stimulusLevelDbHl: -10, innerHairCellIntegrity: 0 },
      { stimulusFrequencyHz: 8000, stimulusLevelDbHl: 110, conductiveLossDb: 60 },
      { outerHairCellIntegrity: 0, noiseNotchDepthDb: 60, presbycusisSeverity: 1 },
      { meniereLowFreqLossDb: 60, innerHairCellIntegrity: 0.05 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 1500);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      if (Array.isArray(d.airConductionDb)) {
        for (const v of d.airConductionDb) expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});

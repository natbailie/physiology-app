import { describe, expect, it } from 'vitest';
import { anionGapMEqL, deltaRatio } from './anionGap';
import { ANION_GAP } from './constants';

describe('anionGapMEqL', () => {
  it('is normal in a healthy patient with no acid load at all', () => {
    expect(anionGapMEqL(0, 'anionGap')).toBe(ANION_GAP.NORMAL_MEQ_L);
    expect(anionGapMEqL(0, 'hyperchloraemic')).toBe(ANION_GAP.NORMAL_MEQ_L);
  });

  it('widens with an organic acid load, because the conjugate base stays in the plasma', () => {
    expect(anionGapMEqL(14, 'anionGap')).toBeGreaterThan(ANION_GAP.NORMAL_MEQ_L + 10);
  });

  it('stays normal in a hyperchloraemic acidosis of exactly the same severity', () => {
    // The whole clinical point: identical pH, identical bicarbonate, different gap. Diarrhoea
    // and ketoacidosis are told apart on this row and nothing else.
    expect(anionGapMEqL(14, 'hyperchloraemic')).toBe(ANION_GAP.NORMAL_MEQ_L);
  });

  it('does not widen for a base load — an alkalosis adds no unmeasured anion', () => {
    expect(anionGapMEqL(-14, 'anionGap')).toBe(ANION_GAP.NORMAL_MEQ_L);
  });
});

describe('deltaRatio', () => {
  it('is near 1 when the gap has opened as far as the bicarbonate has fallen', () => {
    // 12 mEq/L of bicarbonate consumed, 12 mEq/L of ketoacid anion left behind.
    const ratio = deltaRatio(ANION_GAP.NORMAL_MEQ_L + 12, 12);
    expect(ratio).toBeGreaterThan(0.9);
    expect(ratio).toBeLessThan(1.1);
  });

  it('falls below 1 when bicarbonate has dropped further than the gap explains', () => {
    // Only 6 of the 16 mEq/L lost is accounted for by organic anion, so a normal-gap acidosis
    // is present as well — a diarrhoeal loss on top of a ketoacidosis.
    expect(deltaRatio(ANION_GAP.NORMAL_MEQ_L + 6, 8)).toBeLessThan(0.8);
  });

  it('rises above 2 when something is propping the bicarbonate up', () => {
    // A wide gap with a nearly preserved bicarbonate means a metabolic alkalosis is hiding
    // underneath the acidosis — the vomiting ketoacidotic patient.
    expect(deltaRatio(ANION_GAP.NORMAL_MEQ_L + 15, 20)).toBeGreaterThan(2);
  });

  it('reports nothing when the bicarbonate has barely moved', () => {
    // A ratio computed across a 1 mEq/L change is noise divided by noise.
    expect(deltaRatio(ANION_GAP.NORMAL_MEQ_L + 1, 23.5)).toBe(0);
  });
});

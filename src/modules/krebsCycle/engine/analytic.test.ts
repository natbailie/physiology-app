import { describe, expect, it } from 'vitest';
import { yieldsOf } from './engine';
import { KREBS_CYCLE } from './constants';

/**
 * Analytic oracles: the per-turn stoichiometry of the cycle, written out inside the test and
 * importing nothing from the engine but the yields under test.
 *
 * One acetyl-CoA makes one turn, and one turn makes three NADH, one FADH2, one GTP and two
 * CO2 (Lehninger). Those ratios hold for ANY acetyl-CoA quantity at all — which is what makes
 * them identities rather than calibrations, and why no amount of miscalibration could fake
 * them while breaking them.
 */
describe('krebs-cycle analytic identities', () => {
  it('yields 3 NADH, 1 FADH2, 1 GTP and 2 CO2 per acetyl-CoA for arbitrary flux', () => {
    for (const acetyl of [0, 0.25, 1, 2.5, 10]) {
      const yields = yieldsOf(acetyl);
      expect(yields.nadh).toBeCloseTo(3 * acetyl, 10);
      expect(yields.fadh2).toBeCloseTo(1 * acetyl, 10);
      expect(yields.gtp).toBeCloseTo(1 * acetyl, 10);
      expect(yields.co2).toBeCloseTo(2 * acetyl, 10);
    }
  });

  it('holds the cross-ratios independently of the constants it was built from', () => {
    // Written from the textbook sentence, not from the constant table: two decarboxylations
    // per turn (isocitrate DH, alpha-KGDH) means CO2 is twice GTP, and three NADH-linked
    // dehydrogenases against one FAD-linked step (succinate DH) fixes the redox split.
    for (const acetyl of [0.5, 1.7, 4]) {
      const yields = yieldsOf(acetyl);
      expect(yields.co2 / yields.gtp).toBeCloseTo(2, 10);
      expect(yields.nadh / yields.co2).toBeCloseTo(1.5, 10);
      expect(yields.fadh2).toBeCloseTo(yields.gtp, 10);
    }
  });

  it('reads the constants the engine actually runs on', () => {
    expect(KREBS_CYCLE.NADH_PER_TURN).toBe(3);
    expect(KREBS_CYCLE.FADH2_PER_TURN).toBe(1);
    expect(KREBS_CYCLE.GTP_PER_TURN).toBe(1);
    expect(KREBS_CYCLE.CO2_PER_TURN).toBe(2);
  });
});

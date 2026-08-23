import { describe, expect, it } from 'vitest';
import { FORMULAS } from './formulas';
import { MODULES } from '@/home/moduleRegistry';

describe('formula reference', () => {
  it('gives every formula a unique id', () => {
    const ids = FORMULAS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces a finite result from every formula at its own defaults', () => {
    for (const formula of FORMULAS) {
      const defaults = Object.fromEntries(formula.inputs.map((i) => [i.key, i.default]));
      const result = formula.compute(defaults);
      expect(Number.isFinite(result), `${formula.id} at defaults`).toBe(true);
    }
  });

  it('survives every input being driven to either extreme', () => {
    // A learner will drag these. A formula that divides by an input must not return NaN when
    // that input reaches its own stated minimum.
    for (const formula of FORMULAS) {
      for (const extreme of ['min', 'max'] as const) {
        const values = Object.fromEntries(formula.inputs.map((i) => [i.key, i[extreme]]));
        expect(Number.isFinite(formula.compute(values)), `${formula.id} at ${extreme}`).toBe(true);
      }
    }
  });

  it('starts every input inside its own range', () => {
    for (const formula of FORMULAS) {
      for (const input of formula.inputs) {
        expect(input.default, `${formula.id}.${input.key}`).toBeGreaterThanOrEqual(input.min);
        expect(input.default, `${formula.id}.${input.key}`).toBeLessThanOrEqual(input.max);
      }
    }
  });

  it('only links to modules that exist', () => {
    const ids = new Set(MODULES.map((m) => m.id));
    const broken = FORMULAS.filter((f) => f.moduleId && !ids.has(f.moduleId)).map((f) => f.id);
    expect(broken.join(', ')).toBe('');
  });

  it('explains every formula at length, since the explanation is the product', () => {
    for (const formula of FORMULAS) {
      expect(formula.explanation.length, `${formula.id}`).toBeGreaterThan(200);
    }
  });
});

/**
 * Values a learner could check against a textbook. These are the guard against a refactor
 * quietly changing an engine function the reference calls through to.
 */
describe('known values', () => {
  const at = (id: string, values: Record<string, number>) => {
    const formula = FORMULAS.find((f) => f.id === id)!;
    const defaults = Object.fromEntries(formula.inputs.map((i) => [i.key, i.default]));
    return formula.compute({ ...defaults, ...values });
  };

  it('puts the potassium equilibrium potential near -95 mV', () => {
    expect(at('nernst', { out: 4, inside: 140, temperature: 37 })).toBeCloseTo(-94.7, 0);
  });

  it('puts a normal gas at pH 7.4', () => {
    expect(at('hendersonHasselbalch', { hco3: 24, paco2: 40 })).toBeCloseTo(7.4, 2);
  });

  it("expects a PaCO2 of 26 for a bicarbonate of 12 by Winter's", () => {
    expect(at('wintersFormulaExpected', { hco3: 12 })).toBeCloseTo(26, 5);
  });

  it('leaves QTc equal to QT at 60 bpm, where RR is exactly one second', () => {
    expect(at('bazettQtc', { qt: 400, rate: 60 })).toBeCloseTo(400, 5);
  });

  it('corrects a sodium of 128 at a glucose of 600 up to about 136', () => {
    expect(at('correctedSodium', { sodium: 128, glucose: 600 })).toBeCloseTo(136, 0);
  });

  it('gives a normal capillary a small positive filtration pressure', () => {
    expect(at('starlingEquation', {})).toBeGreaterThan(0);
  });

  it('reads a normal arterial oxygen content near 20 mL/dL', () => {
    expect(at('oxygenContent', { hb: 15, sao2: 98, pao2: 95 })).toBeCloseTo(19.9, 0);
  });

  it('reads a normal oxygen delivery near 1000 mL/min', () => {
    expect(at('oxygenDelivery', { co: 5, hb: 15, sao2: 98 })).toBeGreaterThan(900);
    expect(at('oxygenDelivery', { co: 5, hb: 15, sao2: 98 })).toBeLessThan(1100);
  });

  it('calls a pre-renal FENa low and a tubular one high', () => {
    expect(at('fena', { una: 10, pna: 140, ucr: 100, pcr: 2 })).toBeLessThan(1);
    expect(at('fena', { una: 60, pna: 140, ucr: 30, pcr: 2 })).toBeGreaterThan(2);
  });
});

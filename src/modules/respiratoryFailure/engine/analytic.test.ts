import { describe, expect, it } from 'vitest';
import { alveolarPAO2, paO2FromShunt } from './gas';
import { paCo2MmHg, plasmaPH } from './engine';

/**
 * Analytic oracles. Each reference equation is written out IN this test, importing nothing from
 * the engine but the value under test — the same discipline respiratory applies to
 * Henderson-Hasselbalch and membranePotentials applies to Nernst.
 */

describe('gasExchange — the published equations', () => {
  it('the shunt equation recovers alveolar PO2 at zero shunt', () => {
    // With no shunt, arterial gas exchange IS alveolar gas exchange, so PaO2 = PAO2.
    for (const fiO2 of [0.21, 0.3, 0.4, 0.6]) {
      const paCO2 = 40;
      const PAO2 = (760 - 47) * fiO2 - paCO2 / 0.8;
      expect(paO2FromShunt(PAO2, 0)).toBeCloseTo(PAO2, 6);
    }
  });

  it('a rising shunt lowers PaO2 monotonically and drags it toward venous blood', () => {
    const PAO2 = alveolarPAO2(0.21, 40);
    const open = paO2FromShunt(PAO2, 0);
    const half = paO2FromShunt(PAO2, 0.5);
    const huge = paO2FromShunt(PAO2, 0.99);

    expect(half).toBeLessThan(open);
    expect(huge).toBeLessThan(half);
    // A near-complete shunt approximates mixed venous PO2, not atmospheric O2.
    expect(huge).toBeLessThan(55);
  });

  it('the alveolar gas equation reproduces its own terms', () => {
    // PAO2 = (PB - PH2O)·FiO2 - PaCO2/RQ, written out by hand here.
    expect(alveolarPAO2(0.21, 40)).toBeCloseTo((760 - 47) * 0.21 - 40 / 0.8, 12);
    expect(alveolarPAO2(1, 40)).toBeCloseTo(713 - 50, 12);
  });

  it('arterial CO2 is inversely proportional to alveolar ventilation', () => {
    // Reference pair: VA doubles → CO2 halves; the baseline clears 40 mmHg at VA 4200.
    expect(paCo2MmHg(1, 4200)).toBeCloseTo(40, 5);
    expect(paCo2MmHg(1, 8400)).toBeCloseTo(20, 1);
    expect(paCo2MmHg(2, 4200)).toBeCloseTo(80, 1);
  });

  it('pH obeys Henderson-Hasselbalch as written', () => {
    for (const paCO2 of [25, 40, 70]) {
      const hco3 = 24 + Math.max(paCO2 - 40, 0) * 0.4;
      // The equation, re-written here: pH = 6.1 + log10( [HCO3] / (0.03·PaCO2) ).
      expect(plasmaPH(hco3, paCO2)).toBeCloseTo(6.1 + Math.log10(hco3 / (0.03 * paCO2)), 12);
    }
  });
});
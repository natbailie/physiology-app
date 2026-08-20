import { describe, expect, it } from 'vitest';
import { paCO2, paO2, saO2, aaGradient, alveolarVentilationFraction } from './gasExchange';

describe('paCO2', () => {
  it('falls as alveolar ventilation rises', () => {
    const low = paCO2(100, alveolarVentilationFraction(80, 0));
    const high = paCO2(100, alveolarVentilationFraction(150, 0));
    expect(high).toBeLessThan(low);
  });

  it('rises as CO2 production rises', () => {
    const low = paCO2(80, alveolarVentilationFraction(100, 0));
    const high = paCO2(200, alveolarVentilationFraction(100, 0));
    expect(high).toBeGreaterThan(low);
  });
});

describe('paO2', () => {
  it('matches the alveolar gas equation at baseline room air', () => {
    expect(paO2(0.21, 40, 5)).toBeCloseTo(95, 0);
  });

  it('falls as PaCO2 rises', () => {
    expect(paO2(0.21, 60, 5)).toBeLessThan(paO2(0.21, 40, 5));
  });

  it('falls as FiO2 falls', () => {
    expect(paO2(0.12, 40, 5)).toBeLessThan(paO2(0.21, 40, 5));
  });
});

describe('saO2', () => {
  it('matches the classic 40/70/90 O2-Hb dissociation curve teaching points', () => {
    expect(saO2(100)).toBeCloseTo(97.8, 0);
    expect(saO2(60)).toBeCloseTo(90.6, 0);
    expect(saO2(40)).toBeCloseTo(75.0, 0);
  });

  it('is monotonically increasing with PaO2', () => {
    expect(saO2(40)).toBeLessThan(saO2(60));
    expect(saO2(60)).toBeLessThan(saO2(100));
  });
});

describe('aaGradient', () => {
  it('widens with airway obstruction', () => {
    expect(aaGradient(1)).toBeGreaterThan(aaGradient(0));
  });
});

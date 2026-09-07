import { describe, expect, it } from 'vitest';
import {
  aaGradientMmHg,
  alveolarPAO2,
  arterialPaO2MmHg,
  paCo2MmHg,
  plasmaHco3MmEqPerL,
  plasmaPH,
  severinghausPaO2,
} from './gasExchange';
import { airwayPressureAtPhase, drivingPressureCmH2O, inspiratoryPressureCmH2O } from './pressures';
import { effectiveRatePerMin, tidalVolumeML } from './ventilation';
import { DEFAULT_MV_INPUTS } from './presets';
import type { MvInputs } from './types';

function valid(overrides: Partial<MvInputs>): MvInputs {
  return { ...DEFAULT_MV_INPUTS, ...overrides };
}

/**
 * Analytic oracles. Each reference equation is written out IN the test, importing nothing from
 * the engine but the value under test — the same discipline membranePotentials applies to Nernst
 * and respiratory applies to Henderson-Hasselbalch.
 */

describe('gasExchange — the published equations', () => {
  it('inverse Severinghaus inverts Severinghaus across the clinically relevant range', () => {
    // Written out from the reference: SaO2 = 100 / (1 + 23400/(P^3 + 150P)).
    for (let pO2 = 30; pO2 <= 600; pO2 += 20) {
      const sat = 100 / (1 + 23400 / (pO2 ** 3 + 150 * pO2));
      expect(severinghausPaO2(sat / 100)).toBeCloseTo(pO2, 0.4);
    }
  });

  it('the content-based shunt equation recovers alveolar PO2 at zero shunt', () => {
    // With no shunt, arterial content IS end-capillary content, so PaO2 must equal PAO2.
    // Kept within the FiO2 range where PAO2 stays under the PaO2 ceiling.
    for (const fiO2 of [0.21, 0.3, 0.4, 0.6]) {
      const paCO2 = 40;
      const PAO2 = (760 - 47) * fiO2 - paCO2 / 0.8;
      const paO2 = arterialPaO2MmHg(PAO2, 0, 15, 0.72);
      expect(paO2).toBeCloseTo(PAO2, 0);
    }
  });

  it('shunt lowers PaO2 monotonically and drags it toward mixed venous PO2', () => {
    const PAO2 = alveolarPAO2(0.21, 40);
    const open = arterialPaO2MmHg(PAO2, 0, 15, 0.72);
    const half = arterialPaO2MmHg(PAO2, 0.5, 15, 0.72);
    const huge = arterialPaO2MmHg(PAO2, 0.99, 15, 0.72);

    expect(half).toBeLessThan(open);
    expect(huge).toBeLessThan(half);
    // A nearly complete shunt approximates venous blood.
    expect(huge).toBeLessThan(55);
  });

  it('arterial CO2 is inversely proportional to alveolar ventilation', () => {
    // Reference pair: VA doubles → CO2 halves; the baseline clears 40 at VA 4200.
    expect(paCo2MmHg(1, 4200)).toBeCloseTo(40, 5);
    expect(paCo2MmHg(1, 8400)).toBeCloseTo(20, 1);
    expect(paCo2MmHg(2, 4200)).toBeCloseTo(80, 1);
  });

  it('pH obeys Henderson-Hasselbalch as written', () => {
    for (const paCO2 of [25, 40, 70]) {
      const hco3 = plasmaHco3MmEqPerL(paCO2, 1);
      // The equation, re-written here: pH = 6.1 + log10( [HCO3] / (0.03·PaCO2) ).
      expect(plasmaPH(hco3, paCO2)).toBeCloseTo(6.1 + Math.log10(hco3 / (0.03 * paCO2)), 12);
    }
  });

  it('the A-a gradient is exactly the alveolar minus the arterial oxygen', () => {
    const paO2 = 95;
    const PAO2 = 100;
    expect(aaGradientMmHg(PAO2, paO2)).toBeCloseTo(5, 12);
  });
});

describe('pressures — the ventilator identities', () => {
  it('driving pressure is inspiratory pressure minus dialled PEEP, and is zero in CPAP', () => {
    for (const icon of [5, 10, 25]) {
      for (const peep of [0, 4, 10]) {
        const insp = inspiratoryPressureCmH2O('invasive', icon, peep);
        expect(drivingPressureCmH2O('invasive', insp, peep)).toBeCloseTo(Math.max(0, insp - peep), 12);
      }
    }
    expect(drivingPressureCmH2O('cpap', 4, 4)).toBe(0);
  });

  it('CPAP draws a flat airway-pressure line at EPAP', () => {
    for (let phase = 0; phase <= 1; phase += 0.1) {
      expect(airwayPressureAtPhase(phase, 5, 5)).toBe(5);
    }
  });

  it('the pressure waveform closes the cycle back on PEEP', () => {
    expect(airwayPressureAtPhase(0, 5, 14)).toBeCloseTo(5, 5);
    // Late expiration has effectively returned to PEEP.
    expect(airwayPressureAtPhase(0.999, 5, 14)).toBeLessThan(5.05);
    expect(airwayPressureAtPhase(0.5, 5, 14)).toBeGreaterThan(5);
  });

  it('support pressure is IPAP minus EPAP (invasive: PIP minus PEEP), never negative', () => {
    expect(inspiratoryPressureCmH2O('niv', 8, 4)).toBeCloseTo(8, 12);
    expect(inspiratoryPressureCmH2O('niv', 4, 8)).toBe(8); // clamped to PEEP, support 0
    expect(inspiratoryPressureCmH2O('cpap', 10, 4)).toBe(4);
  });
});

describe('ventilation — the mode rules', () => {
  it('invasive ventilation sets the rate outright; NIV and CPAP keep the stronger of the two drivers', () => {
    expect(effectiveRatePerMin(valid({ mode: 'cpap', nativeRatePerMin: 12, ventRatePerMin: 4 }))).toBe(12);
    expect(effectiveRatePerMin(valid({ mode: 'niv', nativeRatePerMin: 12, ventRatePerMin: 30 }))).toBe(30);
    expect(effectiveRatePerMin(valid({ mode: 'invasive', nativeRatePerMin: 12, ventRatePerMin: 4 }))).toBe(4);
  });

  it('NIV wastes 15% of each supported breath to mask leak', () => {
    const base = {
      mode: 'invasive' as const,
      nativeTidalVolumeML: 500,
      nativeDrive: 0,
      complianceMLPerCmH2O: 100,
      ipapPipCmH2O: 12,
      epapPeepCmH2O: 4,
      upperAirwayCollapse: 0,
    };
    const invasive = tidalVolumeML(valid(base), 4);
    const niv = tidalVolumeML(valid({ ...base, mode: 'niv' }), 4);
    expect(niv).toBeCloseTo(invasive * 0.85, 5);
  });

  it('CPAP recovers the patient\u2019s own tidal volume via the upper-airway splint', () => {
    const patient = {
      nativeTidalVolumeML: 500,
      nativeDrive: 1,
      upperAirwayCollapse: 1,
      mode: 'cpap' as const,
      ipapPipCmH2O: 8,
    };
    const weak = tidalVolumeML(valid({ ...patient, epapPeepCmH2O: 2 }), 2);
    const open = tidalVolumeML(valid({ ...patient, epapPeepCmH2O: 10 }), 10);
    expect(open).toBeGreaterThan(weak * 1.5);
  });
});
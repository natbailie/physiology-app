import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_MV_INPUTS, MV_PRESETS } from './presets';
import type { MvInputs, MvState } from './types';

const DT = 0.01;

function settle(inputs: MvInputs, seconds = 10): MvState {
  let state = createInitialState();
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return state;
}

function settled(name: keyof typeof MV_PRESETS, overrides: Partial<MvInputs> = {}) {
  const inputs: MvInputs = { ...DEFAULT_MV_INPUTS, ...MV_PRESETS[name], ...overrides };
  return computeDerived(settle(inputs), inputs);
}

describe('engine — the calibrated normal baseline', () => {
  it('opens on textbook gas exchange, breathing surface, and no risk from the machine', () => {
    const derived = settled('normal');

    expect(derived.paO2).toBeGreaterThan(80);
    expect(derived.paO2).toBeLessThan(100);
    expect(derived.paCO2).toBeGreaterThan(35);
    expect(derived.paCO2).toBeLessThan(45);
    expect(derived.saO2).toBeGreaterThan(95);
    expect(derived.pH).toBeGreaterThan(7.35);
    expect(derived.pH).toBeLessThan(7.45);
    expect(derived.tidalVolumeML).toBeGreaterThan(400);
    expect(derived.tidalVolumeML).toBeLessThan(600);
    expect(derived.alveolarVentilationMLPerMin).toBeCloseTo(4200, -2);
    expect(derived.failureType).toBe('none');
    expect(derived.viliRisk).toBe('low');
    expect(derived.airTrapping).toBeLessThan(0.01);
  });

  it('never produces NaN/Infinity across extreme settings', () => {
    const extremes: MvInputs[] = [];
    for (const mode of ['cpap', 'niv', 'invasive']) {
      for (const epapPeepCmH2O of [0, 2, 20]) {
        for (const ipapPipCmH2O of [0, 10, 35]) {
          for (const ventRatePerMin of [4, 12, 40]) {
            for (const fiO2 of [0.21, 0.6, 1]) {
              extremes.push({
                ...DEFAULT_MV_INPUTS,
                mode: mode as MvInputs['mode'],
                epapPeepCmH2O,
                ipapPipCmH2O,
                ventRatePerMin,
                fiO2,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const derived = computeDerived(settle(inputs, 5), inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.paCO2).toBeGreaterThan(9);
      expect(derived.paCO2).toBeLessThan(151);
      expect(derived.paO2).toBeGreaterThan(19);
      expect(derived.paO2).toBeLessThan(651);
      expect(derived.pH).toBeGreaterThan(6.5);
      expect(derived.pH).toBeLessThan(8.0);
    }
  });
});

describe('engine — ARDS: stiff, shunted lungs under the ventilator', () => {
  it('starts under-supported: steep driving pressure, severe type-1 hypoxaemia, high VILI risk', () => {
    const derived = settled('ards');

    // Driving pressure = 22 − 3 = 19 cmH2O — above the 15 threshold, on purpose.
    expect(derived.drivingPressureCmH2O).toBeGreaterThan(15);
    expect(derived.viliRisk).toBe('high');
    // Shunt wasted at low PEEP is still shunted.
    expect(derived.effectiveShuntFraction).toBeGreaterThan(0.4);
    expect(derived.hypoxaemia).toBe('severe');
    expect(derived.failureType).toBe('type 1');
    // A classic early-ARDS number: P/F ~ 180-200 at FiO2 0.30.
    expect(derived.paO2FiO2Ratio).toBeGreaterThan(100);
    expect(derived.paO2FiO2Ratio).toBeLessThan(250);
  });

  it('PEEP recruitment reopens shunt and rescues PaO2 without changing the ventilated dead space', () => {
    const low = settled('ards');
    const recruited = settled('ards', { epapPeepCmH2O: 12, fiO2: 0.6 });

    expect(recruited.effectiveShuntFraction).toBeLessThan(low.effectiveShuntFraction * 0.4);
    expect(recruited.recruitmentLevel).toBeGreaterThan(0.5);
    expect(recruited.paO2).toBeGreaterThan(80);
    expect(recruited.hypoxaemia).not.toBe('severe');
    // Driving pressure is unchanged by FiO2/PEEP dialling that leaves pressure alone... here it
    // falls only because PIP stays 22 against a higher PEEP.
    expect(recruited.drivingPressureCmH2O).toBeGreaterThan(5);
    expect(recruited.drivingPressureCmH2O).toBeLessThan(15);
  });

  it('shunt is the failure mode oxygen can never fix', () => {
    const onRoomAir = settled('ards');
    const onPureOxygen = settled('ards', { fiO2: 1 });

    // The survivor leans on shunt blood — a generous shunted fraction stays shunted at any FiO2.
    expect(onPureOxygen.effectiveShuntFraction).toBeCloseTo(onRoomAir.effectiveShuntFraction, 5);
    expect(onPureOxygen.paO2).toBeGreaterThan(onRoomAir.paO2);
  });
});

describe('engine — COPD: obstructed, trapping lung on NIV', () => {
  it('traps air, stacks auto-PEEP, and under-ventilates into type-2 failure compensated by the kidney', () => {
    const derived = settled('copd');

    expect(derived.airTrapping).toBeGreaterThan(0.3);
    expect(derived.intrinsicPeepCmH2O).toBeGreaterThan(8);
    // EPAP 4 dialled, auto-PEEP stacked on top.
    expect(derived.totalPeepCmH2O).toBeGreaterThan(12);
    expect(derived.paCO2).toBeGreaterThan(60);
    expect(derived.failureType).toBe('type 2');
    // Chronic compensation: the pH is still acidotic but the bicarbonate has bought time.
    expect(derived.plasmaHCO3).toBeGreaterThan(30);
    expect(derived.pH).toBeGreaterThan(7.2);
    expect(derived.pH).toBeLessThan(7.45);
  });

  it('trapped gas adds dead space the anatomy never had', () => {
    const normal = settled('normal');
    const copd = settled('copd');

    expect(copd.effectiveDeadSpaceFraction).toBeGreaterThan(normal.effectiveDeadSpaceFraction + 0.1);
  });
});

describe('engine — OSA hypoventilation: CPAP splints the collapsible airway', () => {
  it('is a type-2 failure at rest (weak splint) and resolves once EPAP opens the airway', () => {
    const weak = settled('osaHypoventilation');
    expect(weak.paCO2).toBeGreaterThan(50);
    expect(weak.failureType).toBe('type 2');

    const splinted = settled('osaHypoventilation', { epapPeepCmH2O: 10 });
    expect(splinted.paCO2).toBeLessThan(48);
    expect(splinted.failureType).toBe('none');
  });
});

describe('engine — neuromuscular weakness: the ventilator carries the load', () => {
  it('delivers large supported breaths, near-zero patient effort, and lands in respiratory alkalosis', () => {
    const derived = settled('neuromuscular');

    expect(derived.tidalVolumeML).toBeGreaterThan(700);
    expect(derived.wobEffortPct).toBeLessThan(30);
    expect(derived.paCO2).toBeLessThan(35);
    expect(derived.pH).toBeGreaterThan(7.45);
  });
});

describe('engine — mode mechanics', () => {
  it('NIV wastes a share of each supported breath to mask leak', () => {
    const invasive = settled('normal', { mode: 'invasive', ipapPipCmH2O: 12, epapPeepCmH2O: 4 });
    const niv = settled('normal', { mode: 'niv', ipapPipCmH2O: 12, epapPeepCmH2O: 4 });

    expect(niv.tidalVolumeML).toBeLessThan(invasive.tidalVolumeML);
    expect(niv.paCO2).toBeGreaterThan(invasive.paCO2);
  });

  it('invasive ventilation sets the rate outright where NIV waits on the patient', () => {
    const fastBackUp = settled('normal', { mode: 'niv', ventRatePerMin: 30 });
    const invasiveFast = settled('normal', { mode: 'invasive', ventRatePerMin: 30 });

    // Both are driven to the back-up rate, so both hypoventilate the CO2 out...
    expect(invasiveFast.effectiveRatePerMin).toBe(30);
    expect(fastBackUp.effectiveRatePerMin).toBe(30);
    // ...but a slow back-up rate leaves a normally driving patient alone in NIV. With the
    // support pressure turned to zero the patient's own breath clears the normal CO2 load.
    const slowBackUp = settled('normal', { mode: 'niv', ipapPipCmH2O: 2, ventRatePerMin: 4 });
    expect(slowBackUp.effectiveRatePerMin).toBe(12);
    expect(slowBackUp.paCO2).toBeCloseTo(40, 0);
  });

  it('CPAP at normal physiology is a flat airway-pressure line; support modes hump it', () => {
    const cpap = settled('normal');
    const supported = settled('normal', { mode: 'niv', epapPeepCmH2O: 4, ipapPipCmH2O: 12 });

    expect(cpap.peakPressureCmH2O).toBeCloseTo(cpap.totalPeepCmH2O, 1);
    expect(supported.peakPressureCmH2O).toBeGreaterThan(supported.totalPeepCmH2O + 5);
  });

  it('the pressure waveform closes the cycle back onto PEEP', () => {
    const derived = settled('normal', { mode: 'invasive', epapPeepCmH2O: 5, ipapPipCmH2O: 14 });
    expect(derived.airwayPressureCmH2O).toBeLessThan(15);
    expect(derived.airwayPressureCmH2O).toBeGreaterThanOrEqual(4);
  });
});
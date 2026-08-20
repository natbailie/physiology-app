import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbHemorrhage, perturbTransfusion, perturbValsalva, step } from './engine';
import { DEFAULT_VENOUS_RETURN_INPUTS, VENOUS_RETURN_PRESETS } from './presets';
import { meanSystemicFillingPressure, stressedVolume } from './meanSystemicFillingPressure';
import { resistanceToVenousReturn, venousReturn } from './venousReturnCurve';
import { findOperatingPoint } from './operatingPoint';
import { ATRIUM } from './constants';
import type { VenousReturnInputs, VenousReturnState } from './types';

const DT = 0.02;

function presetInputs(name: keyof typeof VENOUS_RETURN_PRESETS): VenousReturnInputs {
  return { ...DEFAULT_VENOUS_RETURN_INPUTS, ...VENOUS_RETURN_PRESETS[name] };
}

function run(inputs: VenousReturnInputs, seconds: number, from = createInitialState()): VenousReturnState {
  let state = from;
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return state;
}

function settle(inputs: VenousReturnInputs, seconds = 60) {
  const state = run(inputs, seconds);
  return { state, derived: computeDerived(state, inputs) };
}

describe('meanSystemicFillingPressure — set by the vessels, not the heart', () => {
  it('gives the textbook 7 mmHg from stressed volume and compliance', () => {
    const stressed = stressedVolume(5000, 0.86);
    expect(stressed).toBeCloseTo(700, 0);
    expect(meanSystemicFillingPressure(stressed, 100)).toBeCloseTo(7, 1);
  });

  it('counts only stressed volume — the other 86% generates no pressure at all', () => {
    expect(stressedVolume(5000, 0.86)).toBeLessThan(5000 * 0.2);
  });
});

describe('engine — the operating point emerges rather than being solved for', () => {
  it('converges on the crossing of the two curves from any starting pressure', () => {
    const inputs = presetInputs('normal');
    const target = findOperatingPoint(7, 1.4, -4, 13);

    for (const startPra of [-6, 0, 12, 20]) {
      const state = run(inputs, 60, { ...createInitialState(), rightAtrialPressureMmHg: startPra });
      expect(state.rightAtrialPressureMmHg, `should converge from ${startPra}`).toBeCloseTo(target.pra, 1);
    }
  });

  it('settles where venous return exactly equals cardiac output', () => {
    const { derived } = settle(presetInputs('normal'));

    expect(derived.meanSystemicFillingPressureMmHg).toBeCloseTo(7, 1);
    expect(derived.cardiacOutputLPerMin).toBeCloseTo(5, 1);
    expect(derived.venousReturnLPerMin).toBeCloseTo(derived.cardiacOutputLPerMin, 2);
    expect(derived.rightAtrialPressureMmHg).toBeCloseTo(derived.operatingPointPra, 1);
    // A normal circulation sits on the steep part of the cardiac curve: the heart pumps whatever
    // arrives, so it is the veins that are setting the output.
    expect(derived.limitingFactor).toBe('preload');
  });
});

describe('engine — the venous return curve', () => {
  it('falls to zero when right atrial pressure reaches the filling pressure', () => {
    expect(venousReturn(7, 7, 1.4)).toBeCloseTo(0, 5);
    expect(venousReturn(3, 7, 1.4)).toBeGreaterThan(0);
  });

  it('plateaus below zero, because the great veins collapse as they enter the chest', () => {
    const atCollapse = venousReturn(ATRIUM.COLLAPSE_PRESSURE_MMHG, 7, 1.4);
    expect(venousReturn(-3, 7, 1.4)).toBeCloseTo(atCollapse, 5);
    expect(venousReturn(-6, 7, 1.4)).toBeCloseTo(atCollapse, 5);
  });

  it('stops the circulation at the filling pressure when the heart stops', () => {
    const arrested: VenousReturnInputs = { ...presetInputs('normal'), contractility: 0 };
    const { derived } = settle(arrested, 120);

    // With no pump, pressure equalises at the mean systemic filling pressure — which is how it
    // is actually measured.
    expect(derived.rightAtrialPressureMmHg).toBeCloseTo(derived.meanSystemicFillingPressureMmHg, 0);
    expect(derived.venousReturnLPerMin).toBeCloseTo(0, 1);
  });
});

describe('engine — volume and venous tone', () => {
  it('raises filling pressure and cardiac output when blood volume rises', () => {
    const normal = settle(presetInputs('normal'));
    const loaded = settle(presetInputs('volumeOverload'));
    const bled = settle(presetInputs('haemorrhage'));

    expect(loaded.derived.meanSystemicFillingPressureMmHg).toBeGreaterThan(normal.derived.meanSystemicFillingPressureMmHg);
    expect(loaded.derived.cardiacOutputLPerMin).toBeGreaterThan(normal.derived.cardiacOutputLPerMin);
    expect(bled.derived.meanSystemicFillingPressureMmHg).toBeLessThan(normal.derived.meanSystemicFillingPressureMmHg);
    // A normal heart, producing less output purely because less is arriving.
    expect(bled.derived.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin);
    expect(bled.derived.cardiacCurvePlateau).toBeCloseTo(normal.derived.cardiacCurvePlateau, 5);
  });

  it('raises cardiac output by venoconstriction alone, with blood volume unchanged', () => {
    const normal = settle(presetInputs('normal'));
    const constricted = settle({ ...presetInputs('normal'), unstressedVolumeFraction: 0.78 });

    expect(constricted.derived.totalBloodVolumeMl).toBe(normal.derived.totalBloodVolumeMl);
    expect(constricted.derived.stressedVolumeMl).toBeGreaterThan(normal.derived.stressedVolumeMl);
    expect(constricted.derived.meanSystemicFillingPressureMmHg).toBeGreaterThan(
      normal.derived.meanSystemicFillingPressureMmHg,
    );
    expect(constricted.derived.cardiacOutputLPerMin).toBeGreaterThan(normal.derived.cardiacOutputLPerMin * 1.15);
  });

  it('lowers filling pressure when the veins are dilated, without losing any blood', () => {
    const normal = settle(presetInputs('normal'));
    const dilated = settle(presetInputs('venodilation'));

    expect(dilated.derived.totalBloodVolumeMl).toBe(normal.derived.totalBloodVolumeMl);
    expect(dilated.derived.meanSystemicFillingPressureMmHg).toBeLessThan(normal.derived.meanSystemicFillingPressureMmHg);
    expect(dilated.derived.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin);
  });

  it('responds to haemorrhage and transfusion', () => {
    const inputs = presetInputs('normal');
    const normal = settle(inputs);

    const bled = computeDerived(run(inputs, 30, perturbHemorrhage(normal.state)), inputs);
    const transfused = computeDerived(run(inputs, 30, perturbTransfusion(normal.state)), inputs);

    expect(bled.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin);
    expect(transfused.cardiacOutputLPerMin).toBeGreaterThan(normal.derived.cardiacOutputLPerMin);
  });
});

describe('engine — the heart', () => {
  it('raises right atrial pressure and lowers output when the cardiac curve flattens', () => {
    const normal = settle(presetInputs('normal'));
    const failing = settle(presetInputs('heartFailure'));

    // Both findings come from one intersection moving, not from two separate problems.
    expect(failing.derived.rightAtrialPressureMmHg).toBeGreaterThan(normal.derived.rightAtrialPressureMmHg + 2);
    expect(failing.derived.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin * 0.7);
    expect(failing.derived.meanSystemicFillingPressureMmHg).toBeCloseTo(normal.derived.meanSystemicFillingPressureMmHg, 5);
    expect(failing.derived.limitingFactor).toBe('pump');
  });

  it('gains little output from more volume once it is on the flat part of its curve', () => {
    const failing = presetInputs('heartFailure');
    const base = settle(failing);
    const loaded = settle({ ...failing, bloodVolumeMl: 6600 });

    const gain = loaded.derived.cardiacOutputLPerMin - base.derived.cardiacOutputLPerMin;
    // The filling pressure rises far more than the output does — congestion without benefit.
    const pressureRise = loaded.derived.rightAtrialPressureMmHg - base.derived.rightAtrialPressureMmHg;
    expect(pressureRise).toBeGreaterThan(gain);
  });
});

describe('engine — pressure around the heart', () => {
  it('lowers cardiac output and raises right atrial pressure under positive-pressure ventilation', () => {
    const normal = settle(presetInputs('normal'));
    const ventilated = settle(presetInputs('positivePressureVentilation'));

    expect(ventilated.derived.totalBloodVolumeMl).toBe(normal.derived.totalBloodVolumeMl);
    expect(ventilated.derived.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin);
    // The clinical signature: a HIGH central venous pressure with a LOW output. The pressure is
    // high because the heart is being squeezed from outside, not because it is full.
    expect(ventilated.derived.rightAtrialPressureMmHg).toBeGreaterThan(normal.derived.rightAtrialPressureMmHg + 4);
  });

  it('drops cardiac output during a Valsalva strain and recovers afterwards', () => {
    const inputs = presetInputs('normal');
    const normal = settle(inputs);

    const straining = computeDerived(run(inputs, 1, perturbValsalva(normal.state)), inputs);
    const recovered = computeDerived(run(inputs, 40, perturbValsalva(normal.state)), inputs);

    expect(straining.cardiacOutputLPerMin).toBeLessThan(normal.derived.cardiacOutputLPerMin * 0.6);
    expect(recovered.cardiacOutputLPerMin).toBeCloseTo(normal.derived.cardiacOutputLPerMin, 1);
  });
});

describe('engine — resistance', () => {
  it('weights venous resistance far more heavily than arterial resistance', () => {
    const base = resistanceToVenousReturn(1, 1, 0);
    const doubledVenous = resistanceToVenousReturn(2, 1, 0);
    const doubledArterial = resistanceToVenousReturn(1, 2, 0);

    // Almost all the compliance is downstream of the arterioles, so systemic vascular resistance
    // contributes much less to resistance to venous return than intuition suggests.
    expect(doubledVenous - base).toBeGreaterThan(doubledArterial - base);
  });

  it('raises cardiac output through an AV fistula without the heart doing anything different', () => {
    const normal = settle(presetInputs('normal'));
    const fistula = settle(presetInputs('avFistula'));

    expect(fistula.derived.resistanceToVenousReturn).toBeLessThan(normal.derived.resistanceToVenousReturn);
    expect(fistula.derived.cardiacOutputLPerMin).toBeGreaterThan(normal.derived.cardiacOutputLPerMin);
    expect(fistula.derived.cardiacCurvePlateau).toBeCloseTo(normal.derived.cardiacCurvePlateau, 5);
  });
});

describe('engine — the plotted curves', () => {
  it('samples two curves that actually cross at the reported operating point', () => {
    const { derived } = settle(presetInputs('normal'));

    const nearest = derived.cardiacCurve.reduce((best, point, index) => {
      const gap = Math.abs(point.flow - derived.venousCurve[index]!.flow);
      return gap < best.gap ? { gap, pra: point.pra } : best;
    }, { gap: Infinity, pra: 0 });

    expect(nearest.pra).toBeCloseTo(derived.operatingPointPra, 0);
    expect(derived.cardiacCurve.length).toBe(derived.venousCurve.length);
  });
});

describe('engine — numerical robustness', () => {
  it('stays finite and bounded across extreme inputs', () => {
    const extremes: VenousReturnInputs[] = [];
    for (const contractility of [0, 2.5]) {
      for (const bloodVolumeMl of [3000, 7000]) {
        for (const intrathoracicPressure of [-10, 20]) {
          for (const venousCompliance of [0.3, 3]) {
            for (const systemicVascularResistance of [0.3, 3]) {
              extremes.push({
                ...DEFAULT_VENOUS_RETURN_INPUTS,
                contractility,
                bloodVolumeMl,
                intrathoracicPressure,
                venousCompliance,
                systemicVascularResistance,
                heartRate: 200,
                arteriovenousShunt: 1,
                unstressedVolumeFraction: 0.95,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const state = run(inputs, 60);
      const derived = computeDerived(state, inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(state.rightAtrialPressureMmHg).toBeGreaterThanOrEqual(ATRIUM.MIN_PRESSURE_MMHG);
      expect(state.rightAtrialPressureMmHg).toBeLessThanOrEqual(ATRIUM.MAX_PRESSURE_MMHG);
      expect(derived.cardiacOutputLPerMin).toBeGreaterThanOrEqual(0);
      expect(derived.venousReturnLPerMin).toBeGreaterThanOrEqual(0);
      for (const point of [...derived.cardiacCurve, ...derived.venousCurve]) {
        expect(Number.isFinite(point.flow)).toBe(true);
      }
    }
  });
});

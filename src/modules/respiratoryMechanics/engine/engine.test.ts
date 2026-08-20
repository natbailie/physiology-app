import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, hasAirTrapping, perturbFvcManeuver, step } from './engine';
import { DEFAULT_RESP_MECH_INPUTS, RESP_MECH_PRESETS } from './presets';
import { expiratoryFlowAtVolume } from './fvcManeuver';
import type { RespMechInputs, RespMechState } from './types';

const DT = 0.01;

function settle(inputs: RespMechInputs, seconds = 40): RespMechState {
  let state = createInitialState();
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return state;
}

function settled(name: keyof typeof RESP_MECH_PRESETS, overrides: Partial<RespMechInputs> = {}) {
  const inputs: RespMechInputs = { ...DEFAULT_RESP_MECH_INPUTS, ...RESP_MECH_PRESETS[name], ...overrides };
  return computeDerived(settle(inputs), inputs);
}

describe('engine — normal mechanics', () => {
  it('produces textbook static volumes and a normal spirometry pattern', () => {
    const derived = settled('normal');

    expect(derived.vitalCapacityML).toBeGreaterThan(3500);
    expect(derived.totalLungCapacityML).toBeGreaterThan(derived.vitalCapacityML);
    expect(derived.functionalResidualCapacityML).toBeGreaterThan(derived.residualVolumeML);
    expect(derived.fev1RatioPercent).toBeGreaterThan(70);
    expect(derived.spirometryPattern).toBe('normal');
  });

  it('never produces NaN/Infinity across extreme settings', () => {
    const extremes: RespMechInputs[] = [];
    for (const airwayResistance of [0.5, 20]) {
      for (const lungCompliance of [20, 150]) {
        for (const surfactantFunction of [0, 1.5]) {
          for (const deadSpaceFraction of [0, 70]) {
            for (const shuntFraction of [0, 50]) {
              extremes.push({
                ...DEFAULT_RESP_MECH_INPUTS,
                airwayResistance,
                lungCompliance,
                surfactantFunction,
                deadSpaceFraction,
                shuntFraction,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const derived = computeDerived(settle(inputs, 15), inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.lungVolumeML).toBeGreaterThanOrEqual(derived.residualVolumeML - 1);
      expect(derived.lungVolumeML).toBeLessThanOrEqual(derived.totalLungCapacityML + 1);
      expect(derived.fev1RatioPercent).toBeGreaterThan(0);
      expect(derived.fev1RatioPercent).toBeLessThanOrEqual(100);
    }
  });
});

describe('engine — obstructive vs restrictive patterns', () => {
  it('obstruction drops the FEV1/FVC ratio while preserving vital capacity', () => {
    const normal = settled('normal');
    const copd = settled('copd');

    expect(copd.fev1RatioPercent).toBeLessThan(70);
    expect(copd.spirometryPattern).toBe('obstructive');
    // The hallmark: it is the RATIO that falls, not the vital capacity.
    expect(copd.fvcML).toBeGreaterThan(normal.fvcML * 0.9);
    expect(copd.peakExpiratoryFlowMLPerSec).toBeLessThan(normal.peakExpiratoryFlowMLPerSec * 0.5);
  });

  it('obstruction traps air, raising residual volume and total lung capacity', () => {
    const normal = settled('normal');
    const copd = settled('copd');

    expect(copd.residualVolumeML).toBeGreaterThan(normal.residualVolumeML);
    expect(copd.functionalResidualCapacityML).toBeGreaterThan(normal.functionalResidualCapacityML);
    expect(copd.timeConstantSeconds).toBeGreaterThan(normal.timeConstantSeconds * 5);
  });

  it('restriction cuts vital capacity while PRESERVING the ratio — the key contrast', () => {
    const normal = settled('normal');
    const fibrosis = settled('pulmonaryFibrosis');

    expect(fibrosis.fvcML).toBeLessThan(normal.fvcML * 0.8);
    expect(fibrosis.totalLungCapacityML).toBeLessThan(normal.totalLungCapacityML);
    expect(fibrosis.fev1RatioPercent).toBeGreaterThan(70);
    expect(fibrosis.spirometryPattern).toBe('restrictive');
  });

  it('surfactant loss produces restriction by a different route than fibrosis', () => {
    const normal = settled('normal');
    const rds = settled('neonatalRDS');

    expect(rds.effectiveCompliance).toBeLessThan(normal.effectiveCompliance * 0.5);
    expect(rds.vitalCapacityML).toBeLessThan(normal.vitalCapacityML * 0.8);
    expect(rds.spirometryPattern).toBe('restrictive');
  });

  it('the obstructed expiratory limb is scooped — flow collapses at low lung volumes', () => {
    const normal = settled('normal');
    const copd = settled('copd');

    // Compare flow late in the maneuver, expressed as a fraction of each subject's own peak.
    const normalLateFraction =
      expiratoryFlowAtVolume(0.75, normal.peakExpiratoryFlowMLPerSec, normal.timeConstantSeconds) /
      normal.peakExpiratoryFlowMLPerSec;
    const copdLateFraction =
      expiratoryFlowAtVolume(0.75, copd.peakExpiratoryFlowMLPerSec, copd.timeConstantSeconds) / copd.peakExpiratoryFlowMLPerSec;

    expect(copdLateFraction).toBeLessThan(normalLateFraction);
  });
});

describe('engine — the R × C time constant and air trapping', () => {
  it('flags air trapping when expiratory time is too short for the lung to empty', () => {
    const normal = settled('normal');
    const copd = settled('copd');

    expect(hasAirTrapping(14, normal.timeConstantSeconds)).toBe(false);
    // The same obstructed lung traps air at a fast rate but not at a slow one — which is why
    // slowing the respiratory rate helps dynamic hyperinflation.
    expect(hasAirTrapping(30, copd.timeConstantSeconds)).toBe(true);
    expect(hasAirTrapping(8, normal.timeConstantSeconds)).toBe(false);
  });
});

describe('engine — the FVC maneuver', () => {
  it('sweeps lung volume from total lung capacity down toward residual volume', () => {
    const inputs: RespMechInputs = { ...DEFAULT_RESP_MECH_INPUTS };
    let state = perturbFvcManeuver(settle(inputs));
    expect(state.fvcManeuverActive).toBe(true);

    const startDerived = computeDerived(state, inputs);
    let minVolume = Infinity;
    for (let i = 0; i < 8 / DT; i++) {
      minVolume = Math.min(minVolume, computeDerived(state, inputs).lungVolumeML);
      state = step(state, inputs, DT).state;
    }

    expect(minVolume).toBeLessThan(startDerived.functionalResidualCapacityML);
    // The maneuver ends and normal tidal breathing resumes.
    expect(state.fvcManeuverActive).toBe(false);
  });
});

describe('engine — V/Q mismatch: dead space vs shunt', () => {
  it('dead space raises the affected unit\'s V/Q ratio and cuts alveolar ventilation', () => {
    const normal = settled('normal');
    const pe = settled('pulmonaryEmbolism');

    expect(pe.vqRatioB).toBeGreaterThan(normal.vqRatioB * 3);
    expect(pe.alveolarVentilationMLPerMin).toBeLessThan(normal.alveolarVentilationMLPerMin);
  });

  it('shunt lowers the affected unit\'s V/Q ratio', () => {
    const normal = settled('normal');
    const pneumonia = settled('pneumonia');

    expect(pneumonia.vqRatioB).toBeLessThan(normal.vqRatioB * 0.6);
  });

  it('HPV partially corrects shunt but does nothing at all for dead space', () => {
    const shuntNoHpv = settled('pneumonia', { hpvStrength: 0 });
    const shuntWithHpv = settled('pneumonia', { hpvStrength: 1.5 });

    // Blood is actively diverted away from the poorly ventilated unit, pulling its V/Q back
    // up toward 1.
    expect(shuntWithHpv.hpvDiversionLevel).toBeGreaterThan(0.1);
    expect(shuntWithHpv.perfusionUnitB).toBeLessThan(shuntNoHpv.perfusionUnitB);
    expect(shuntWithHpv.vqRatioB).toBeGreaterThan(shuntNoHpv.vqRatioB);

    const deadSpaceNoHpv = settled('pulmonaryEmbolism', { hpvStrength: 0 });
    const deadSpaceWithHpv = settled('pulmonaryEmbolism', { hpvStrength: 1.5 });

    // There is no perfusion left in a dead-space unit to redirect, so HPV is powerless.
    expect(deadSpaceWithHpv.hpvDiversionLevel).toBeCloseTo(0, 5);
    expect(deadSpaceWithHpv.perfusionUnitB).toBeCloseTo(deadSpaceNoHpv.perfusionUnitB, 5);
    expect(deadSpaceWithHpv.vqRatioB).toBeCloseTo(deadSpaceNoHpv.vqRatioB, 5);
  });
});

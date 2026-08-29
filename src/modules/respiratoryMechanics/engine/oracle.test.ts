/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RESP_MECH_INPUTS, RESP_MECH_PRESETS } from './presets';
import type { RespMechDerived, RespMechInputs } from './types';

/**
 * Reference trace from Pulse's severe acute asthma scenario — see `tools/pulse-oracle/`.
 *
 * This module's lesion parameters are INPUTS, not outputs, so what an oracle can check here is
 * different from the other modules: it is whether our presets are scaled the way an independent
 * engine scales the same disease, and whether we model the disease as the same KIND of lesion.
 * Pulse's severe asthma raises airway resistance roughly fourteen-fold while leaving compliance,
 * dead space and shunt alone — so an obstructive preset that quietly changed compliance too
 * would be modelling something else.
 *
 * Two things are deliberately NOT compared. Pulse's `LungCompliance` (0.2 L/cmH2O) is lung
 * compliance where our `lungCompliance` (100 mL/cmH2O) is respiratory-system compliance; both
 * are textbook-correct for their own definition and the absolute values must not be matched.
 * And Pulse's `TotalLungVolume` is an instantaneous volume sampled at an arbitrary point in the
 * breath, so it is not a usable stand-in for FRC or for air trapping.
 */

interface OracleSample {
  t: number;
  totalLungVolumeMl: number;
  tidalVolumeMl: number;
  respirationRatePerMin: number;
  oxygenSaturation: number;
  totalAlveolarVentilationLPerMin: number;
  inspiratoryResistanceCmH2OSPerL: number;
  expiratoryResistanceCmH2OSPerL: number;
  lungComplianceLPerCmH2O: number;
  shuntFraction: number;
  deadSpaceTidalVolumeRatio: number;
}

interface OracleTrace {
  landmarks: Record<string, number>;
  samples: OracleSample[];
}

function load<T>(id: string): T {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`./__oracle__/${id}.json`, import.meta.url)), 'utf8'),
  ) as T;
}

const trace = load<OracleTrace>('asthma-severe');

/** The condition traces are steady states, not time courses: one settled sample each. */
interface ConditionSample {
  t: number;
  shuntFraction: number;
  lungComplianceLPerCmH2O: number;
  respiratoryComplianceLPerCmH2O: number;
  inspiratoryResistanceCmH2OSPerL: number;
  deadSpaceTidalVolumeRatio: number;
  oxygenSaturation: number;
  tidalVolumeMl: number;
  respirationRatePerMin: number;
  paO2MmHg: number;
}

function condition(id: string): ConditionSample {
  const t = load<{ samples: ConditionSample[] }>(id);
  const settled = t.samples.find((s) => s.t === 120);
  if (!settled) throw new Error(`no settled sample in ${id}`);
  return settled;
}

const healthyLung = condition('pneumonia-zero');
const pneumonia = condition('pneumonia-moderate');
const ards = condition('ards-moderate');

function at(landmark: string): OracleSample {
  const t = trace.landmarks[landmark];
  const sample = trace.samples.find((s) => s.t === t);
  if (!sample) throw new Error(`no sample at landmark "${landmark}" (t=${t})`);
  return sample;
}

function settle(patch: Partial<RespMechInputs>, seconds = 120): RespMechDerived {
  const inputs = { ...DEFAULT_RESP_MECH_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.02);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

const pulseBaseline = at('baseline');
const pulseAttack = at('attack');
const pulseRecovered = at('recovered');

const ourNormal = settle(RESP_MECH_PRESETS.normal);
const ourObstructed = settle(RESP_MECH_PRESETS.copd);

const pulseResistanceRatio =
  pulseAttack.inspiratoryResistanceCmH2OSPerL / pulseBaseline.inspiratoryResistanceCmH2OSPerL;

describe('oracle: the trace is the scenario it claims to be', () => {
  it('records a severe obstruction that then resolves', () => {
    expect(pulseResistanceRatio).toBeGreaterThan(5);
    expect(pulseRecovered.inspiratoryResistanceCmH2OSPerL).toBeCloseTo(
      pulseBaseline.inspiratoryResistanceCmH2OSPerL,
      1,
    );
  });
});

describe('oracle: our obstructive preset is scaled the way Pulse scales the same disease', () => {
  it('raises airway resistance by a comparable multiple', () => {
    // Ours is a multiple of normal by construction; Pulse's is absolute, so the comparison is
    // ratio against ratio. Within a factor of two is the claim — this is calibration, not identity.
    const ourRatio = ourObstructed.airwayResistance / ourNormal.airwayResistance;
    expect(ourRatio).toBeGreaterThan(pulseResistanceRatio / 2);
    expect(ourRatio).toBeLessThan(pulseResistanceRatio * 2);
  });

  it('obstructs expiration as much as inspiration, as Pulse does', () => {
    expect(pulseAttack.expiratoryResistanceCmH2OSPerL / pulseAttack.inspiratoryResistanceCmH2OSPerL).toBeCloseTo(1, 1);
  });
});

describe('oracle: we model obstruction as the same KIND of lesion Pulse does', () => {
  it('leaves compliance alone, as Pulse does', () => {
    expect(pulseAttack.lungComplianceLPerCmH2O).toBeCloseTo(pulseBaseline.lungComplianceLPerCmH2O, 2);
    expect(ourObstructed.effectiveCompliance).toBeCloseTo(ourNormal.effectiveCompliance, 5);
  });

  it('leaves dead space alone, as Pulse does', () => {
    expect(pulseAttack.deadSpaceTidalVolumeRatio).toBeCloseTo(pulseBaseline.deadSpaceTidalVolumeRatio, 2);
    expect(ourObstructed.deadSpaceFraction).toBe(ourNormal.deadSpaceFraction);
  });

  it('leaves shunt essentially alone, as Pulse does', () => {
    expect(Math.abs(pulseAttack.shuntFraction - pulseBaseline.shuntFraction)).toBeLessThan(0.05);
    expect(ourObstructed.shuntFraction).toBe(ourNormal.shuntFraction);
  });
});

describe('oracle: the consequences of obstruction match', () => {
  it('lengthens the expiratory time constant, which is what resistance does', () => {
    expect(ourObstructed.timeConstantSeconds).toBeGreaterThan(ourNormal.timeConstantSeconds * 5);
  });

  it('produces an obstructive spirometry pattern below the diagnostic threshold', () => {
    expect(ourNormal.spirometryPattern).toBe('normal');
    expect(ourObstructed.spirometryPattern).toBe('obstructive');
    // FEV1/FVC under 70% is the threshold that defines obstruction.
    expect(ourObstructed.fev1RatioPercent).toBeLessThan(70);
  });

  it('cuts the volume of each breath, as Pulse does', () => {
    expect(pulseAttack.tidalVolumeMl).toBeLessThan(pulseBaseline.tidalVolumeMl * 0.8);
  });

  it('drives the patient to breathe faster, as Pulse does', () => {
    expect(pulseAttack.respirationRatePerMin).toBeGreaterThan(pulseBaseline.respirationRatePerMin);
  });
});

describe('oracle: our pneumonia preset is scaled the way Pulse scales pneumonia', () => {
  const ourNormalShunt = settle(RESP_MECH_PRESETS.normal).shuntFraction;
  const ourPneumonia = settle(RESP_MECH_PRESETS.pneumonia);

  it('lands on the same shunt fraction Pulse does', () => {
    // Ours is a percentage, Pulse's a fraction. This is the closest agreement anywhere in the
    // oracle suite: our preset says 35%, Pulse's moderate pneumonia settles at 0.35.
    expect(Math.abs(ourPneumonia.shuntFraction / 100 - pneumonia.shuntFraction)).toBeLessThan(0.08);
  });

  it('starts from the same negligible physiological shunt', () => {
    expect(healthyLung.shuntFraction).toBeLessThan(0.05);
    expect(ourNormalShunt).toBeLessThan(5);
  });

  it('produces the hypoxaemia that shunt causes, in Pulse', () => {
    expect(pneumonia.paO2MmHg).toBeLessThan(healthyLung.paO2MmHg * 0.7);
    expect(pneumonia.oxygenSaturation).toBeLessThan(0.9);
  });
});

describe('oracle: Pulse does not distinguish ARDS from pneumonia', () => {
  it('gives byte-identical mechanics for both conditions at the same severity', () => {
    // Different PatientConditions (Pneumonia vs AcuteRespiratoryDistressSyndrome), both at
    // severity 0.6 in both lungs, produce the same numbers on every column we record — so ARDS
    // cannot serve as an independent check on compliance. If this test ever FAILS, Pulse has
    // gained a mechanism that separates them and an ARDS trace becomes worth having.
    expect(ards.shuntFraction).toBe(pneumonia.shuntFraction);
    expect(ards.lungComplianceLPerCmH2O).toBe(pneumonia.lungComplianceLPerCmH2O);
    expect(ards.deadSpaceTidalVolumeRatio).toBe(pneumonia.deadSpaceTidalVolumeRatio);
    expect(ards.paO2MmHg).toBe(pneumonia.paO2MmHg);
  });
});

describe('oracle: open questions', () => {
  it.todo(
    'decide whether the pneumonia preset should do more than shunt — Pulse’s moderate pneumonia ' +
      'also cuts lung compliance (0.20 -> 0.11 L/cmH2O), raises airway resistance (1.5 -> 3.6) and ' +
      'nearly doubles the dead-space ratio (0.29 -> 0.55), where ours changes shuntFraction alone. ' +
      'The shunt magnitude is right; the consolidated lung is also stiffer and wastes more of each ' +
      'breath, and a student currently sees none of that',
  );
  it.todo(
    'decide whether obstruction should raise the respiratory RATE — Pulse answers a severe attack ' +
      'with 12 -> 18.6 breaths/min and a tidal volume cut from 535 to 314 mL, where our ' +
      'respiratoryRate and tidalVolumeML are inputs the learner sets, so the compensatory response ' +
      'is not modelled and a student never sees the work of breathing rise',
  );
});

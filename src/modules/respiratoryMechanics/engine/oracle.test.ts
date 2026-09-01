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
/**
 * The two open divergences this trace found, both now closed.
 *
 * Neither was a tolerance to widen. One was a preset that modelled a single mechanism where the
 * disease has three; the other was a quantity the module computed nowhere and so could not show.
 */
describe('oracle: what the pneumonia and asthma traces changed', () => {
  it('makes the consolidated lung stiffer and wasteful of each breath, as Pulse does', () => {
    // Pulse's moderate pneumonia does far more than shunt: lung compliance 0.20 -> 0.11 L/cmH2O,
    // airway resistance 1.5 -> 3.6, dead-space ratio 0.29 -> 0.55. Ours changed shuntFraction alone,
    // so a student saw the oxygenation fall and none of the mechanics behind it.
    //
    // Compared as FRACTIONS of each engine's own healthy value, because the two compliances are not
    // the same quantity — Pulse reports lung compliance where ours is respiratory-system compliance,
    // and matching the absolute numbers would be wrong.
    const theirComplianceRatio = pneumonia.lungComplianceLPerCmH2O / healthyLung.lungComplianceLPerCmH2O;
    const theirResistanceRatio = pneumonia.inspiratoryResistanceCmH2OSPerL / healthyLung.inspiratoryResistanceCmH2OSPerL;
    const ourComplianceRatio = RESP_MECH_PRESETS.pneumonia.lungCompliance! / DEFAULT_RESP_MECH_INPUTS.lungCompliance;
    const ourResistanceRatio = RESP_MECH_PRESETS.pneumonia.airwayResistance! / DEFAULT_RESP_MECH_INPUTS.airwayResistance;

    // Both engines stiffen the lung by roughly half and roughly double the resistance.
    expect(ourComplianceRatio).toBeLessThan(1);
    expect(Math.abs(ourComplianceRatio - theirComplianceRatio)).toBeLessThan(0.2);
    expect(ourResistanceRatio).toBeGreaterThan(1.5);
    expect(Math.abs(ourResistanceRatio - theirResistanceRatio)).toBeLessThan(1);
    // And it now wastes more of each breath, which is the dead-space half of the same lesion.
    expect(RESP_MECH_PRESETS.pneumonia.deadSpaceFraction!).toBeGreaterThan(15);
  });

  it('shows the work of breathing rising, which no reading used to', () => {
    // The other half of this module's open question. Respiratory rate and tidal volume are inputs
    // the learner sets, so the compensatory response Pulse produces — 12 -> 18.6 breaths/min with
    // tidal volume cut from 535 to 314 mL — cannot emerge here, and turning them into outputs would
    // take away the instrument the module is built on. What CAN be shown, and now is, is the COST
    // of that pattern: the Otis, Fenn & Rahn (1950) decomposition of work into elastic and
    // resistive halves. A stiff lung and a narrow airway each raise it, by opposite routes.
    const healthy = settle({});
    const consolidated = settle(RESP_MECH_PRESETS.pneumonia);
    const obstructed = settle(RESP_MECH_PRESETS.copd);

    expect(healthy.workOfBreathingJPerMin).toBeGreaterThan(0);
    expect(consolidated.workOfBreathingJPerMin).toBeGreaterThan(healthy.workOfBreathingJPerMin * 2);
    expect(obstructed.workOfBreathingJPerMin).toBeGreaterThan(healthy.workOfBreathingJPerMin * 2);
  });

  it('punishes tachypnoea far harder in an obstructed lung than in a stiff one', () => {
    // The two halves of the work scale differently with RATE, which is what makes the breathing
    // pattern diagnostic. Elastic work per minute rises in proportion to frequency; resistive work
    // rises with its SQUARE, because breathing faster at the same tidal volume means driving gas
    // through the airways faster as well as more often. So doubling the rate costs an obstructed
    // patient much more than a stiff-lunged one — which is why dynamic hyperinflation is treated by
    // slowing the rate down.
    const cost = (preset: Partial<RespMechInputs>) =>
      settle({ ...preset, respiratoryRate: 28, tidalVolumeML: 500 }).workOfBreathingJPerMin /
      settle({ ...preset, respiratoryRate: 14, tidalVolumeML: 500 }).workOfBreathingJPerMin;

    expect(cost(RESP_MECH_PRESETS.copd)).toBeGreaterThan(cost(RESP_MECH_PRESETS.pulmonaryFibrosis));
    // Both still cost more, so this is a difference of degree in the right direction.
    expect(cost(RESP_MECH_PRESETS.pulmonaryFibrosis)).toBeGreaterThan(2);
  });
});

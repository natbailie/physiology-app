import type { CerebralInputs } from './types';

export const DEFAULT_CEREBRAL_INPUTS: CerebralInputs = {
  meanArterialPressureMmHg: 90,
  massVolumeMl: 0,
  paCO2MmHg: 40,
  paO2MmHg: 95,
  csfProductionRate: 1,
  csfAbsorptionCapacity: 1,
  autoregulationIntegrity: 1,
  venousOutflowPressureMmHg: 5,
  bbbPermeabilityPct: 100,
};

export type CerebralPresetName =
  | 'normal'
  | 'compensatedMass'
  | 'decompensatedMass'
  | 'hyperventilated'
  | 'hypoventilated'
  | 'lostAutoregulation'
  | 'hydrocephalus'
  | 'venousObstruction'
  | 'bbbDisruption';

/**
 * The presets walk the pressure-volume curve and then the levers that move along it. Each
 * produces a distinct combination of intracranial pressure, perfusion pressure, remaining
 * reserve and blood flow.
 */
export const CEREBRAL_PRESETS: Record<CerebralPresetName, Partial<CerebralInputs>> = {
  normal: { ...DEFAULT_CEREBRAL_INPUTS },
  // A mass the skull has absorbed by displacing CSF and venous blood: pressure still normal,
  // and almost no reserve left. This patient looks well and is one bleed from disaster.
  compensatedMass: { ...DEFAULT_CEREBRAL_INPUTS, massVolumeMl: 68 },
  // A few millilitres more, and the exponential part of the curve does the rest.
  decompensatedMass: { ...DEFAULT_CEREBRAL_INPUTS, massVolumeMl: 118 },
  // Hyperventilation constricts cerebral vessels within a minute, shrinking blood volume and
  // buying pressure — at the cost of flow.
  hyperventilated: { ...DEFAULT_CEREBRAL_INPUTS, massVolumeMl: 95, paCO2MmHg: 26 },
  // The reverse, and a common iatrogenic disaster in a head injury.
  hypoventilated: { ...DEFAULT_CEREBRAL_INPUTS, massVolumeMl: 95, paCO2MmHg: 58 },
  // After injury, flow follows pressure passively — the same blood pressure that was harmless
  // becomes ischaemia at one end and hyperaemia at the other.
  lostAutoregulation: { ...DEFAULT_CEREBRAL_INPUTS, autoregulationIntegrity: 0, meanArterialPressureMmHg: 130 },
  // Absorption fails at the arachnoid granulations, so CSF accumulates until pressure rises.
  hydrocephalus: { ...DEFAULT_CEREBRAL_INPUTS, csfAbsorptionCapacity: 0.12 },
  // Nothing is wrong inside the skull; the blood simply cannot leave it.
  venousObstruction: { ...DEFAULT_CEREBRAL_INPUTS, venousOutflowPressureMmHg: 22 },
  // A disrupted BBB leaks protein and fluid into the interstitial space: vasogenic oedema
  // adds to the mass effect inside the skull over hours, raising ICP and lowering perfusion.
  bbbDisruption: { ...DEFAULT_CEREBRAL_INPUTS, bbbPermeabilityPct: 180, massVolumeMl: 20 },
};

export const CEREBRAL_PRESET_LABELS: Record<CerebralPresetName, string> = {
  normal: 'Normal',
  compensatedMass: 'Compensated mass',
  decompensatedMass: 'Decompensated mass',
  hyperventilated: 'Hyperventilated',
  hypoventilated: 'Hypoventilated',
  lostAutoregulation: 'Autoregulation lost',
  hydrocephalus: 'Hydrocephalus',
  venousObstruction: 'Venous obstruction',
  bbbDisruption: 'BBB disruption (vasogenic oedema)',
};

export const CEREBRAL_PRESET_ORDER: CerebralPresetName[] = [
  'normal',
  'compensatedMass',
  'decompensatedMass',
  'hyperventilated',
  'hypoventilated',
  'lostAutoregulation',
  'hydrocephalus',
  'venousObstruction',
  'bbbDisruption',
];

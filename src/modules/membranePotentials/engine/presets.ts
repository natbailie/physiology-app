import type { MembraneInputs } from './types';

export const DEFAULT_MEMBRANE_INPUTS: MembraneInputs = {
  stimulusIntensity: 0,
  extracellularK: 4,
  extracellularNa: 140,
  gNaMaxDensity: 1,
  gKMaxDensity: 1,
  temperature: 37,
  myelination: 1,
};

export type MembranePresetName =
  | 'normal'
  | 'hyperkalemia'
  | 'localAnesthetic'
  | 'demyelination'
  | 'hypothermia'
  | 'potassiumBlocker';

export const MEMBRANE_PRESETS: Record<MembranePresetName, Partial<MembraneInputs>> = {
  normal: { ...DEFAULT_MEMBRANE_INPUTS },
  // Raising extracellular K+ moves E_K toward zero, depolarizing the resting membrane. The
  // cell sits closer to threshold but with sodium inactivation (h) already partly engaged —
  // hence the paradox: closer to firing, yet harder to fire.
  hyperkalemia: { ...DEFAULT_MEMBRANE_INPUTS, extracellularK: 8.5 },
  // Sodium channel blockade (lidocaine, class I antiarrhythmics): no regenerative upstroke.
  localAnesthetic: { ...DEFAULT_MEMBRANE_INPUTS, gNaMaxDensity: 0.12 },
  // Loss of myelin slows saltatory conduction dramatically without stopping the axon from
  // generating an action potential — a conduction problem, not an excitability one.
  demyelination: { ...DEFAULT_MEMBRANE_INPUTS, myelination: 0.08 },
  // Cooling slows every gate via Q10, prolonging the action potential and slowing conduction.
  hypothermia: { ...DEFAULT_MEMBRANE_INPUTS, temperature: 31 },
  // Potassium channel blockade (class III antiarrhythmics): repolarization is delayed, so the
  // action potential — and with it the refractory period — is prolonged.
  potassiumBlocker: { ...DEFAULT_MEMBRANE_INPUTS, gKMaxDensity: 0.3 },
};

export const MEMBRANE_PRESET_LABELS: Record<MembranePresetName, string> = {
  normal: 'Normal',
  hyperkalemia: 'Hyperkalemia',
  localAnesthetic: 'Local anesthetic',
  demyelination: 'Demyelination',
  hypothermia: 'Hypothermia',
  potassiumBlocker: 'K+ channel blocker',
};

export const PRESET_ORDER: MembranePresetName[] = [
  'normal',
  'hyperkalemia',
  'localAnesthetic',
  'demyelination',
  'hypothermia',
  'potassiumBlocker',
];

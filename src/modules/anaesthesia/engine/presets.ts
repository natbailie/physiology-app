import type { AnaesthesiaInputs } from './types';

/**
 * The resting well is a routine maintenance anaesthetic: two percent sevoflurane at a
 * breathing-system flow of six litres a minute, in a patient with a normal cardiac output,
 * already settled (the page opens at the equilibrium those settings produce).
 */
export const DEFAULT_ANAESTHESIA_INPUTS: AnaesthesiaInputs = {
  dialPct: 2,
  freshGasFlowLMin: 6,
  bloodGasSolubility: 0.65,
  cardiacOutputLMin: 5,
};

export type AnaesthesiaPresetName =
  | 'sevofluraneInduction'
  | 'desfluraneRapidWashin'
  | 'halothaneSlowWashin'
  | 'lowFlowRebreathing'
  | 'highCardiacOutput'
  | 'emergenceWashout';

export const ANAESTHESIA_PRESETS: Record<AnaesthesiaPresetName, AnaesthesiaInputs> = {
  sevofluraneInduction: {
    dialPct: 5,
    freshGasFlowLMin: 8,
    bloodGasSolubility: 0.65,
    cardiacOutputLMin: 5,
  },
  desfluraneRapidWashin: {
    dialPct: 6,
    freshGasFlowLMin: 10,
    bloodGasSolubility: 0.45,
    cardiacOutputLMin: 5,
  },
  halothaneSlowWashin: {
    dialPct: 2.5,
    freshGasFlowLMin: 4,
    bloodGasSolubility: 2.3,
    cardiacOutputLMin: 5,
  },
  lowFlowRebreathing: {
    dialPct: 2,
    freshGasFlowLMin: 1,
    bloodGasSolubility: 0.65,
    cardiacOutputLMin: 5,
  },
  highCardiacOutput: {
    dialPct: 3,
    freshGasFlowLMin: 6,
    bloodGasSolubility: 0.65,
    cardiacOutputLMin: 8,
  },
  emergenceWashout: {
    dialPct: 0,
    freshGasFlowLMin: 10,
    bloodGasSolubility: 0.65,
    cardiacOutputLMin: 5,
  },
};

export const ANAESTHESIA_PRESET_LABELS: Record<AnaesthesiaPresetName, string> = {
  sevofluraneInduction: 'Sevoflurane induction',
  desfluraneRapidWashin: 'Desflurane, rapid wash-in',
  halothaneSlowWashin: 'Halothane, slow wash-in',
  lowFlowRebreathing: 'Low flow / rebreathing',
  highCardiacOutput: 'High cardiac output',
  emergenceWashout: 'Emergence wash-out',
};

export const ANAESTHESIA_PRESET_ORDER: AnaesthesiaPresetName[] = [
  'sevofluraneInduction',
  'desfluraneRapidWashin',
  'halothaneSlowWashin',
  'lowFlowRebreathing',
  'highCardiacOutput',
  'emergenceWashout',
];
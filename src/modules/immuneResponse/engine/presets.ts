import type { ImmuneInputs } from './types';

export const DEFAULT_IMMUNE_INPUTS: ImmuneInputs = {
  pathogenVirulence: 100,
  pathogenType: 'extracellular',
  innateImmuneFunction: 1,
  helperTCellCount: 1,
  bCellFunction: 1,
  immunosuppression: 0,
};

export type ImmunePresetName =
  | 'healthyHost'
  | 'intracellularPathogen'
  | 'neutropenia'
  | 'hivCd4Depletion'
  | 'bCellDeficiency'
  | 'transplantImmunosuppression';

export const IMMUNE_PRESETS: Record<ImmunePresetName, Partial<ImmuneInputs>> = {
  // Baseline. Hit "Infect" for a primary response, then — once it has cleared — "Infect"
  // again to see what memory buys.
  healthyHost: { ...DEFAULT_IMMUNE_INPUTS },
  // Antibody cannot reach inside a host cell, so clearance now depends on cytotoxic T cells.
  intracellularPathogen: { ...DEFAULT_IMMUNE_INPUTS, pathogenType: 'intracellular' },
  // No effective first line: the pathogen replicates unchecked through the days the adaptive
  // response needs to get going, so it reaches a far higher peak.
  neutropenia: { ...DEFAULT_IMMUNE_INPUTS, innateImmuneFunction: 0.08 },
  // Helper T cells license BOTH arms, so losing them disables cellular and humoral immunity
  // together — the reason CD4 count predicts opportunistic infection so well.
  hivCd4Depletion: { ...DEFAULT_IMMUNE_INPUTS, helperTCellCount: 0.06 },
  // Cellular immunity is intact but no antibody can be made, which matters most against
  // extracellular organisms.
  bCellDeficiency: { ...DEFAULT_IMMUNE_INPUTS, bCellFunction: 0.05 },
  // Broad pharmacological suppression of every arm at once.
  transplantImmunosuppression: { ...DEFAULT_IMMUNE_INPUTS, immunosuppression: 85 },
};

export const IMMUNE_PRESET_LABELS: Record<ImmunePresetName, string> = {
  healthyHost: 'Healthy host',
  intracellularPathogen: 'Intracellular pathogen',
  neutropenia: 'Neutropenia',
  hivCd4Depletion: 'HIV / CD4 depletion',
  bCellDeficiency: 'B-cell deficiency',
  transplantImmunosuppression: 'Immunosuppressed',
};

export const PRESET_ORDER: ImmunePresetName[] = [
  'healthyHost',
  'intracellularPathogen',
  'neutropenia',
  'hivCd4Depletion',
  'bCellDeficiency',
  'transplantImmunosuppression',
];

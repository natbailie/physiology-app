import type { HypersensitivityInputs } from './types';

/**
 * A naive host: exposed to the antigen, sensitised to nothing.
 *
 * Every arm is at zero because sensitisation is what a previous exposure LEAVES BEHIND, and
 * this host has not had one. Challenge them and nothing happens at all — which is the correct
 * and slightly counter-intuitive answer, and the reason a first bee sting is uneventful.
 */
export const DEFAULT_HYPERSENSITIVITY_INPUTS: HypersensitivityInputs = {
  antigenDose: 100,
  igeSensitisation: 0,
  iggAgainstCellSurface: 0,
  circulatingIggForComplexes: 0,
  sensitisedTCells: 0,
  complementFunction: 1,
  mastCellStabilisation: 0,
};

export type HypersensitivityPresetName =
  | 'naiveFirstExposure'
  | 'typeIAnaphylaxis'
  | 'typeIIHaemolysis'
  | 'typeIIISerumSickness'
  | 'typeIVContactDermatitis'
  | 'treatedAnaphylaxis';

/**
 * The four types, each set up so it is the ONLY arm available to the host.
 *
 * That isolation is deliberate: a real patient can have more than one, but the point being
 * taught is that the four effectors differ in speed, in what they injure and in what they
 * leave on a lab report, and that only shows cleanly when one is running at a time.
 */
export const HYPERSENSITIVITY_PRESETS: Record<HypersensitivityPresetName, Partial<HypersensitivityInputs>> = {
  naiveFirstExposure: { ...DEFAULT_HYPERSENSITIVITY_INPUTS },
  // Minutes. Preformed granules, so nothing has to be synthesised — the only mechanism fast
  // enough to kill someone before they reach hospital.
  typeIAnaphylaxis: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, igeSensitisation: 1.15 },
  // Hours. Antibody against an antigen fixed on a cell, so the cell is destroyed and the
  // antibody is sitting on it where a direct Coombs test can find it.
  typeIIHaemolysis: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, iggAgainstCellSurface: 1.1 },
  // Many hours to days. Soluble antigen and antibody in comparable amounts, forming complexes
  // that deposit in vessel walls — so it needs a substantial antigen load, unlike the others.
  typeIIISerumSickness: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, circulatingIggForComplexes: 1, antigenDose: 130 },
  // Days. No antibody at all; T cells must traffic to the site and activate macrophages, which
  // is why a tuberculin test is read at 48 to 72 hours and not before.
  typeIVContactDermatitis: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, sensitisedTCells: 1.15 },
  // The same sensitised host, pre-treated. Mast cell stabilisation blunts type I and would do
  // nothing at all to any of the others — which is the practical payoff of the classification.
  treatedAnaphylaxis: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, igeSensitisation: 1.15, mastCellStabilisation: 85 },
};

export const HYPERSENSITIVITY_PRESET_LABELS: Record<HypersensitivityPresetName, string> = {
  naiveFirstExposure: 'Naive (first exposure)',
  typeIAnaphylaxis: 'Type I — anaphylaxis',
  typeIIHaemolysis: 'Type II — haemolysis',
  typeIIISerumSickness: 'Type III — serum sickness',
  typeIVContactDermatitis: 'Type IV — contact dermatitis',
  treatedAnaphylaxis: 'Type I, pre-treated',
};

export const PRESET_ORDER: HypersensitivityPresetName[] = [
  'naiveFirstExposure',
  'typeIAnaphylaxis',
  'typeIIHaemolysis',
  'typeIIISerumSickness',
  'typeIVContactDermatitis',
  'treatedAnaphylaxis',
];

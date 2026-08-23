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
  aboCompatibility: 1,
  recipientIgaDeficiency: 0,
  productLeukocyteLoad: 0,
  donorAntileukocyteAntibody: 0,
  anamnesticRecall: 0,
  cardiacReserve: 1,
};

export type HypersensitivityPresetName =
  | 'naiveFirstExposure'
  | 'typeIAnaphylaxis'
  | 'typeIIHaemolysis'
  | 'typeIIISerumSickness'
  | 'typeIVContactDermatitis'
  | 'treatedAnaphylaxis'
  | 'compatibleTransfusion'
  | 'aboIncompatible'
  | 'anaphylacticIgaDeficient'
  | 'febrileNonHaemolytic'
  | 'delayedHaemolytic'
  | 'taco'
  | 'trali';

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

  // --- Transfusion reactions: the same four arms, driven by what is in the bag ---
  // Press "Transfuse" rather than "Challenge" for these.

  // The control. A correctly matched unit in a patient who can handle the volume does exactly
  // what it is supposed to: the haemoglobin goes up and nothing else happens.
  compatibleTransfusion: { ...DEFAULT_HYPERSENSITIVITY_INPUTS },
  // Type II, and the one reaction here that needs no prior exposure at all — anti-A and anti-B
  // are naturally occurring, so a first transfusion can kill. Minutes to hours, haemoglobinuria,
  // a positive Coombs, and a haemoglobin that FALLS after a transfusion.
  aboIncompatible: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, aboCompatibility: 0 },
  // Type I. An IgA-deficient recipient with anti-IgA meets donor plasma IgA, and reacts to the
  // plasma rather than to the cells — which is why washed cells prevent it.
  anaphylacticIgaDeficient: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, recipientIgaDeficiency: 1 },
  // NOT one of the four types: cytokines that accumulated in the bag during storage. Fever and
  // nothing else — no haemolysis, no complement consumption, no hypotension. That emptiness is
  // the diagnosis, and it is why leukodepletion prevents it.
  febrileNonHaemolytic: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, productLeukocyteLoad: 90 },
  // Type II again, but the antibody has to be RE-MADE from memory against a minor antigen, and
  // making antibody takes days. The patient goes home well and their haemoglobin falls a week
  // later — which is why this one is found on a blood count rather than at the bedside.
  delayedHaemolytic: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, anamnesticRecall: 1 },
  // Not immune at all. Plain hydrostatics in a patient without the reserve to clear a unit —
  // and the commonest transfusion reaction there is. High BNP; treat by offloading volume.
  taco: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, cardiacReserve: 0.12 },
  // Donor antibody against the RECIPIENT's neutrophils, so it is a property of the donor. The
  // lung leaks rather than being overloaded, so the BNP stays normal — the one row that
  // separates it from TACO, and the treatments are opposites.
  trali: { ...DEFAULT_HYPERSENSITIVITY_INPUTS, donorAntileukocyteAntibody: 1 },
};

export const HYPERSENSITIVITY_PRESET_LABELS: Record<HypersensitivityPresetName, string> = {
  naiveFirstExposure: 'Naive (first exposure)',
  typeIAnaphylaxis: 'Type I — anaphylaxis',
  typeIIHaemolysis: 'Type II — haemolysis',
  typeIIISerumSickness: 'Type III — serum sickness',
  typeIVContactDermatitis: 'Type IV — contact dermatitis',
  treatedAnaphylaxis: 'Type I, pre-treated',
  compatibleTransfusion: 'Compatible unit',
  aboIncompatible: 'ABO incompatible',
  anaphylacticIgaDeficient: 'Anaphylactic (IgA)',
  febrileNonHaemolytic: 'Febrile non-haemolytic',
  delayedHaemolytic: 'Delayed haemolytic',
  taco: 'TACO (overload)',
  trali: 'TRALI',
};

/** The classic four, where each arm is isolated so its timing and labs read cleanly. */
export const MECHANISM_PRESET_ORDER: HypersensitivityPresetName[] = [
  'naiveFirstExposure',
  'typeIAnaphylaxis',
  'typeIIHaemolysis',
  'typeIIISerumSickness',
  'typeIVContactDermatitis',
  'treatedAnaphylaxis',
];

/** The same mechanisms met clinically, where the antigen arrives in a bag. */
export const TRANSFUSION_PRESET_ORDER: HypersensitivityPresetName[] = [
  'compatibleTransfusion',
  'aboIncompatible',
  'anaphylacticIgaDeficient',
  'febrileNonHaemolytic',
  'delayedHaemolytic',
  'taco',
  'trali',
];

export const PRESET_ORDER: HypersensitivityPresetName[] = [
  ...MECHANISM_PRESET_ORDER,
  ...TRANSFUSION_PRESET_ORDER,
];

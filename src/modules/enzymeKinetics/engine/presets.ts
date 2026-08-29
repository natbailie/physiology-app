import type { KineticsInputs } from './types';

export const DEFAULT_KINETICS_INPUTS: KineticsInputs = {
  substrateMm: 0.5,
  vmaxUmPerMin: 50,
  kmMm: 0.5,
  inhibitorType: 'none',
  inhibitorUm: 0,
  kiUm: 5,
  temperatureC: 37,
  ph: 7.4,
};

export type KineticsPresetName =
  | 'normal'
  | 'competitive'
  | 'noncompetitive'
  | 'uncompetitive'
  | 'ethanolForMethanol'
  | 'febrile'
  | 'heatDenatured'
  | 'acidaemic';

export const KINETICS_PRESETS: Record<KineticsPresetName, Partial<KineticsInputs>> = {
  normal: { ...DEFAULT_KINETICS_INPUTS },
  // A competitive inhibitor at ten times Ki: apparent Km inflates, Vmax is untouched —
  // enough substrate always outcompetes it.
  competitive: { ...DEFAULT_KINETICS_INPUTS, inhibitorType: 'competitive', inhibitorUm: 50, kiUm: 5 },
  // A pure noncompetitive inhibitor: the enzyme is disabled regardless of substrate —
  // Vmax falls and no amount of substrate recovers it.
  noncompetitive: { ...DEFAULT_KINETICS_INPUTS, inhibitorType: 'noncompetitive', inhibitorUm: 50, kiUm: 5 },
  // Uncompetitive inhibition binds only the enzyme-substrate complex: BOTH apparent values
  // fall together — rare in isolation, common as a second drug effect.
  uncompetitive: { ...DEFAULT_KINETICS_INPUTS, inhibitorType: 'uncompetitive', inhibitorUm: 50, kiUm: 5 },
  // Methanol poisoning: ethanol floods alcohol dehydrogenase (a huge competitive dose of a
  // safer substrate) so methanol is excreted unchanged instead of becoming formaldehyde.
  ethanolForMethanol: {
    ...DEFAULT_KINETICS_INPUTS,
    substrateMm: 0.2,
    vmaxUmPerMin: 60,
    kmMm: 0.4,
    inhibitorType: 'competitive',
    inhibitorUm: 90,
    kiUm: 8,
  },
  // A fever of 41°C: Q10 kinetics still win, so reactions NET accelerate.
  febrile: { ...DEFAULT_KINETICS_INPUTS, temperatureC: 41 },
  // Heat illness territory: denaturation has overwhelmed the Q10 gain and activity collapses.
  heatDenatured: { ...DEFAULT_KINETICS_INPUTS, temperatureC: 47 },
  // The enzymic view of acidaemia: pH 6.8 sits far from the optimum and everything slows.
  acidaemic: { ...DEFAULT_KINETICS_INPUTS, ph: 6.8 },
};

export const KINETICS_PRESET_LABELS: Record<KineticsPresetName, string> = {
  normal: 'Normal',
  competitive: 'Competitive inhibitor',
  noncompetitive: 'Noncompetitive inhibitor',
  uncompetitive: 'Uncompetitive inhibitor',
  ethanolForMethanol: 'Ethanol for methanol',
  febrile: 'Fever 41°C',
  heatDenatured: 'Heat-denatured 47°C',
  acidaemic: 'Acidaemia pH 6.8',
};

export const KINETICS_PRESET_ORDER: KineticsPresetName[] = [
  'normal',
  'competitive',
  'noncompetitive',
  'uncompetitive',
  'ethanolForMethanol',
  'febrile',
  'heatDenatured',
  'acidaemic',
];

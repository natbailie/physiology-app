import type { InflammationInputs } from './types';

export const DEFAULT_INFLAMMATION_INPUTS: InflammationInputs = {
  insultSeverityPct: 0,
  insultType: 'bacterial',
  antibioticEfficacyPct: 0,
  steroidDosePct: 0,
  innateImmuneFunctionPct: 100,
  sourceControlPct: 0,
};

export type InflammationPresetName =
  | 'normal'
  | 'acuteCellulitis'
  | 'severeBacterialLoad'
  | 'abscessFormation'
  | 'goutFlare'
  | 'foreignBodySuture'
  | 'steroidsOverInfection'
  | 'immunosuppressedSmoulder';

/**
 * The presets are the classic temporal patterns. The bacterial ones differ in how hard they
 * are to clear; the crystal and suture presets exist because WHAT the insult is decides
 * whether clearance is even possible.
 */
export const INFLAMMATION_PRESETS: Record<InflammationPresetName, Partial<InflammationInputs>> = {
  normal: { ...DEFAULT_INFLAMMATION_INPUTS },
  // A typical skin infection in an immunocompetent host: hot, swollen, and self-limiting
  // within about a week even untreated.
  acuteCellulitis: { ...DEFAULT_INFLAMMATION_INPUTS, insultSeverityPct: 45 },
  // Pneumonia-grade load: SIRS territory, CRP into the hundreds, a real fight.
  severeBacterialLoad: { ...DEFAULT_INFLAMMATION_INPUTS, insultSeverityPct: 85 },
  // A big load meeting a struggling response: pus collects faster than it drains.
  abscessFormation: { ...DEFAULT_INFLAMMATION_INPUTS, insultSeverityPct: 78, innateImmuneFunctionPct: 55 },
  // Urate crystals in a joint: sterile, ferociously painful, and self-resolving in days.
  goutFlare: { ...DEFAULT_INFLAMMATION_INPUTS, insultSeverityPct: 60, insultType: 'sterileCrystal' },
  // A retained suture: nothing degrades, so week three looks like day three did.
  foreignBodySuture: { ...DEFAULT_INFLAMMATION_INPUTS, insultSeverityPct: 55, insultType: 'foreignBody' },
  // High-dose steroids over an untreated infection: the patient looks better and is worse.
  steroidsOverInfection: {
    ...DEFAULT_INFLAMMATION_INPUTS,
    insultSeverityPct: 50,
    steroidDosePct: 75,
  },
  // Blunted killing AND blunted recruitment: the load grows quietly behind a calm surface.
  immunosuppressedSmoulder: {
    ...DEFAULT_INFLAMMATION_INPUTS,
    insultSeverityPct: 55,
    steroidDosePct: 65,
    innateImmuneFunctionPct: 45,
  },
};

export const INFLAMMATION_PRESET_LABELS: Record<InflammationPresetName, string> = {
  normal: 'Quiescent',
  acuteCellulitis: 'Acute cellulitis',
  severeBacterialLoad: 'Severe bacterial load',
  abscessFormation: 'Abscess forming',
  goutFlare: 'Gout flare (crystal)',
  foreignBodySuture: 'Foreign body (suture)',
  steroidsOverInfection: 'Steroids over infection',
  immunosuppressedSmoulder: 'Immunosuppressed smoulder',
};

export const INFLAMMATION_PRESET_ORDER: InflammationPresetName[] = [
  'normal',
  'acuteCellulitis',
  'severeBacterialLoad',
  'abscessFormation',
  'goutFlare',
  'foreignBodySuture',
  'steroidsOverInfection',
  'immunosuppressedSmoulder',
];

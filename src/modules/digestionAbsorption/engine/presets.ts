import type { DigestionInputs } from './types';

export const DEFAULT_DIGESTION_INPUTS: DigestionInputs = {
  mealFatGrams: 40,
  mealLactoseGrams: 12,
  pancreaticEnzymeCapacityPct: 100,
  hepaticSynthesisCapacityPct: 100,
  ilealReabsorptionFraction: 0.98,
  mucosalSurfaceAreaPct: 100,
  terminalIlealFunctionPct: 100,
  lactaseActivityPct: 100,
  colonicFunctionPct: 100,
  secretoryDrivePct: 0,
  transitMultiplier: 1,
};

export type DigestionPresetName =
  | 'normal'
  | 'pancreaticInsufficiency'
  | 'lactaseDeficiency'
  | 'coeliacDisease'
  | 'terminalIlealResection'
  | 'partialIlealLoss'
  | 'vipoma'
  | 'shortBowelSyndrome';

/**
 * The presets are the classic malabsorption examinations. Each fails a different arm of the
 * chain — hydrolysis, emulsion, brush border, surface area, site specificity, colonic
 * salvage — and the stool tells you which arm it was.
 */
export const DIGESTION_PRESETS: Record<DigestionPresetName, Partial<DigestionInputs>> = {
  normal: { ...DEFAULT_DIGESTION_INPUTS },
  // Chronic pancreatitis or cystic fibrosis: the emulsion forms but nothing cuts it.
  pancreaticInsufficiency: { ...DEFAULT_DIGESTION_INPUTS, pancreaticEnzymeCapacityPct: 4 },
  // Most adults worldwide: enough lactase for cheese, not for a glass of milk.
  lactaseDeficiency: { ...DEFAULT_DIGESTION_INPUTS, lactaseActivityPct: 6, mealLactoseGrams: 24 },
  // Villous atrophy weighted to the proximal gut: iron and folate go first, B12 holds.
  coeliacDisease: { ...DEFAULT_DIGESTION_INPUTS, mucosalSurfaceAreaPct: 22 },
  // Resection takes bile salt recycling AND the B12 receptor site in one stroke.
  terminalIlealResection: {
    ...DEFAULT_DIGESTION_INPUTS,
    ilealReabsorptionFraction: 0.05,
    terminalIlealFunctionPct: 5,
    hepaticSynthesisCapacityPct: 100,
  },
  // Crohn's with partial ileal loss: synthesis holds the pool, spilled salts water the colon.
  partialIlealLoss: {
    ...DEFAULT_DIGESTION_INPUTS,
    ilealReabsorptionFraction: 0.55,
    terminalIlealFunctionPct: 55,
  },
  // A WDHA-secretory drive that waters the patient whether or not they eat.
  vipoma: { ...DEFAULT_DIGESTION_INPUTS, secretoryDrivePct: 75 },
  // Massive resection: surface, ileum and colon all compromised at once.
  shortBowelSyndrome: {
    ...DEFAULT_DIGESTION_INPUTS,
    mucosalSurfaceAreaPct: 35,
    ilealReabsorptionFraction: 0.1,
    terminalIlealFunctionPct: 5,
    colonicFunctionPct: 60,
  },
};

export const DIGESTION_PRESET_LABELS: Record<DigestionPresetName, string> = {
  normal: 'Normal',
  pancreaticInsufficiency: 'Pancreatic insufficiency',
  lactaseDeficiency: 'Lactase deficiency',
  coeliacDisease: 'Coeliac disease',
  terminalIlealResection: 'Terminal ileal resection',
  partialIlealLoss: "Partial ileal loss (Crohn's)",
  vipoma: 'Secretory (VIP) drive',
  shortBowelSyndrome: 'Short bowel syndrome',
};

export const DIGESTION_PRESET_ORDER: DigestionPresetName[] = [
  'normal',
  'pancreaticInsufficiency',
  'lactaseDeficiency',
  'coeliacDisease',
  'terminalIlealResection',
  'partialIlealLoss',
  'vipoma',
  'shortBowelSyndrome',
];

import type { LiverInputs } from './types';

export const DEFAULT_LIVER_INPUTS: LiverInputs = {
  haemolysisMultiplier: 1,
  ugtActivity: 1,
  hepatocyteExcretionPct: 100,
  hepatocyteInjuryPct: 0,
  biliaryObstructionPct: 0,
  albuminGPerL: 42,
};

export type LiverPresetName =
  | 'normal'
  | 'gilbert'
  | 'criglerNajjar'
  | 'haemolyticAnaemia'
  | 'neonatalPhysiological'
  | 'acuteHepatitisA'
  | 'alcoholicCirrhosis'
  | 'choledocholithiasis'
  | 'pancreaticHeadCa';

/**
 * The presets walk the bilirubin pathway from load (haemolysis) through processing (UGT,
 * hepatocyte) to drainage (obstruction). Each produces a distinct urine/stool/enzyme
 * signature — the clinical triad examiners test before any scan is ordered.
 */
export const LIVER_PRESETS: Record<LiverPresetName, Partial<LiverInputs>> = {
  normal: { ...DEFAULT_LIVER_INPUTS },
  // Mild UGT reduction, everything else normal: the commonest inherited jaundice.
  gilbert: { ...DEFAULT_LIVER_INPUTS, ugtActivity: 0.32 },
  criglerNajjar: { ...DEFAULT_LIVER_INPUTS, ugtActivity: 0.03 },
  haemolyticAnaemia: { ...DEFAULT_LIVER_INPUTS, haemolysisMultiplier: 5 },
  // Immature UGT meeting a modestly raised haemolytic load on less albumin.
  neonatalPhysiological: { ...DEFAULT_LIVER_INPUTS, ugtActivity: 0.18, haemolysisMultiplier: 1.6, albuminGPerL: 34 },
  acuteHepatitisA: { ...DEFAULT_LIVER_INPUTS, hepatocyteExcretionPct: 55, hepatocyteInjuryPct: 80 },
  alcoholicCirrhosis: { ...DEFAULT_LIVER_INPUTS, hepatocyteExcretionPct: 36, hepatocyteInjuryPct: 15, albuminGPerL: 28 },
  choledocholithiasis: { ...DEFAULT_LIVER_INPUTS, biliaryObstructionPct: 85 },
  pancreaticHeadCa: { ...DEFAULT_LIVER_INPUTS, biliaryObstructionPct: 96 },
};

export const LIVER_PRESET_LABELS: Record<LiverPresetName, string> = {
  normal: 'Normal',
  gilbert: "Gilbert's syndrome",
  criglerNajjar: 'Crigler-Najjar I',
  haemolyticAnaemia: 'Haemolytic anaemia',
  neonatalPhysiological: 'Neonatal physiological',
  acuteHepatitisA: 'Acute hepatitis',
  alcoholicCirrhosis: 'Decompensated cirrhosis',
  choledocholithiasis: 'Bile duct stone',
  pancreaticHeadCa: 'Pancreatic head cancer',
};

export const LIVER_PRESET_ORDER: LiverPresetName[] = [
  'normal',
  'gilbert',
  'criglerNajjar',
  'haemolyticAnaemia',
  'neonatalPhysiological',
  'acuteHepatitisA',
  'alcoholicCirrhosis',
  'choledocholithiasis',
  'pancreaticHeadCa',
];

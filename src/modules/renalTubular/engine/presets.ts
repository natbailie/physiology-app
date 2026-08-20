import type { RenalTubularInputs } from './types';

export const DEFAULT_RENAL_TUBULAR_INPUTS: RenalTubularInputs = {
  gfrMLPerMin: 100,
  waterIntakeRate: 100,
  adhSecretionCapacity: 1,
  collectingDuctADHSensitivity: 1,
  exogenousADH: 0,
  loopDiureticDose: 0,
  thiazideDose: 0,
  maculaDensaFeedbackStrength: 1,
};

export type RenalTubularPresetName =
  | 'normal'
  | 'centralDI'
  | 'nephrogenicDI'
  | 'siadh'
  | 'loopDiuretic'
  | 'thiazide';

export const RENAL_TUBULAR_PRESETS: Record<RenalTubularPresetName, Partial<RenalTubularInputs>> = {
  normal: { ...DEFAULT_RENAL_TUBULAR_INPUTS },
  // No ADH is made, but the collecting duct is perfectly responsive — so raising "Exogenous
  // ADH" concentrates the urine. This is the differentiating step of the water deprivation test.
  centralDI: { ...DEFAULT_RENAL_TUBULAR_INPUTS, adhSecretionCapacity: 0.03 },
  // ADH is made normally but the duct cannot respond — so exogenous ADH changes nothing.
  // Identical presentation to central DI until desmopressin is given.
  nephrogenicDI: { ...DEFAULT_RENAL_TUBULAR_INPUTS, collectingDuctADHSensitivity: 0.05 },
  // Inappropriately high ADH regardless of plasma osmolality: concentrated urine and a
  // dilutional fall in plasma osmolality (hyponatremia).
  siadh: { ...DEFAULT_RENAL_TUBULAR_INPUTS, exogenousADH: 120 },
  // Blocks NKCC2: abolishes the diluting segment AND washes out the medullary gradient, so
  // the kidney can neither dilute nor concentrate well.
  loopDiuretic: { ...DEFAULT_RENAL_TUBULAR_INPUTS, loopDiureticDose: 90 },
  // Blocks the distal NaCl cotransporter: a milder natriuresis that leaves the medullary
  // gradient — and therefore concentrating ability — intact.
  thiazide: { ...DEFAULT_RENAL_TUBULAR_INPUTS, thiazideDose: 90 },
};

export const RENAL_TUBULAR_PRESET_LABELS: Record<RenalTubularPresetName, string> = {
  normal: 'Normal',
  centralDI: 'Central DI',
  nephrogenicDI: 'Nephrogenic DI',
  siadh: 'SIADH',
  loopDiuretic: 'Loop diuretic',
  thiazide: 'Thiazide',
};

export const PRESET_ORDER: RenalTubularPresetName[] = ['normal', 'centralDI', 'nephrogenicDI', 'siadh', 'loopDiuretic', 'thiazide'];

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
  aldosteroneTone: 1,
  enacBlockade: 0,
  distalAcidSecretion: 1,
  proximalAcidReclaim: 1,
  acetazolamideDose: 0,
  sglt2Blockade: 0,
  osmoticLoad: 0,
  v2Blockade: 0,
  tubularInjury: 0,
};

export type RenalTubularPresetName =
  | 'normal'
  | 'centralDI'
  | 'nephrogenicDI'
  | 'siadh'
  | 'loopDiuretic'
  | 'thiazide'
  | 'acetazolamide'
  | 'sglt2Inhibitor'
  | 'amiloride'
  | 'mannitol'
  | 'tolvaptan'
  | 'proximalRTA'
  | 'distalRTA'
  | 'type4RTA'
  | 'preRenalAzotaemia'
  | 'atn';

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
  // Carbonic anhydrase inhibition in the proximal tubule: bicarbonate pours out, so this is
  // a pharmacological proximal RTA — acidosis with an ALKALINE urine.
  acetazolamide: { ...DEFAULT_RENAL_TUBULAR_INPUTS, acetazolamideDose: 85 },
  // Glucose stays in the lumen and drags water with it: osmotic diuresis without any sodium
  // transporter being touched at all.
  sglt2Inhibitor: { ...DEFAULT_RENAL_TUBULAR_INPUTS, sglt2Blockade: 90 },
  // ENaC blocked directly: K+-sparing diuresis with a mild tendency to retain acid — the
  // same lumen-negative potential was doing double duty for both.
  amiloride: { ...DEFAULT_RENAL_TUBULAR_INPUTS, enacBlockade: 75 },
  // Non-reabsorbable solute obligating water everywhere downstream: profuse dilute-ish
  // diuresis driven by no hormone and no transporter block whatsoever.
  mannitol: { ...DEFAULT_RENAL_TUBULAR_INPUTS, osmoticLoad: 120 },
  // The V2 receptor cannot hear ADH. Urine dilutes as if in diabetes insipidus, but giving
  // desmopressin changes nothing MORE — the receptor is the bottleneck, not the hormone.
  tolvaptan: { ...DEFAULT_RENAL_TUBULAR_INPUTS, v2Blockade: 85, exogenousADH: 60 },
  // Proximal (type 2) RTA: the HCO3 reclaim threshold falls until serum bicarbonate meets
  // what the failing proximal tubule can hold. Hypokalaemic, but the urine CAN be acidified.
  proximalRTA: { ...DEFAULT_RENAL_TUBULAR_INPUTS, proximalAcidReclaim: 0.45 },
  // Distal (type 1) RTA: the H+-ATPase fails, daily acid simply cannot be excreted, and the
  // urine pH stays ABOVE 5.5 however acidemic the patient becomes. Nephrocalcinosis follows.
  distalRTA: { ...DEFAULT_RENAL_TUBULAR_INPUTS, distalAcidSecretion: 0.08 },
  // Hypoaldosteronism (diabetic nephropathy, spironolactone, ACE inhibitors in CKD): K+
  // rises, ammoniagenesis fails, and a mild acidosis arrives with a POSITIVE urine anion gap
  // — yet the urine can still be acidified below 5.5. That trio IS type 4.
  type4RTA: { ...DEFAULT_RENAL_TUBULAR_INPUTS, aldosteroneTone: 0.12 },
  // Prerenal azotaemia: the tubules are intact and aldosterone-driven, so sodium is
  // reclaimed hard (FENa <1%) while GFR has collapsed — creatinine rises, kidney saves salt.
  // Hypovolaemia also drives vasopressin non-osmotically, modelled here as exogenous ADH,
  // which is why prerenal urine is CONCENTRATED while ATN urine cannot be.
  preRenalAzotaemia: { ...DEFAULT_RENAL_TUBULAR_INPUTS, gfrMLPerMin: 35, aldosteroneTone: 1.5, exogenousADH: 60 },
  // Acute tubular necrosis: dead tubules waste sodium (FENa >2%), lose concentrating ability
  // (isosthenuria) and let creatinine climb. Same rising creatinine as prerenal — opposite
  // urine, which is the whole point of asking for it.
  atn: { ...DEFAULT_RENAL_TUBULAR_INPUTS, tubularInjury: 0.9, gfrMLPerMin: 45 },
};

export const RENAL_TUBULAR_PRESET_LABELS: Record<RenalTubularPresetName, string> = {
  normal: 'Normal',
  centralDI: 'Central DI',
  nephrogenicDI: 'Nephrogenic DI',
  siadh: 'SIADH',
  loopDiuretic: 'Loop diuretic',
  thiazide: 'Thiazide',
  acetazolamide: 'Acetazolamide',
  sglt2Inhibitor: 'SGLT2 inhibitor',
  amiloride: 'Amiloride (ENaC)',
  mannitol: 'Mannitol (osmotic)',
  tolvaptan: 'Tolvaptan (V2 block)',
  proximalRTA: 'Proximal (type 2) RTA',
  distalRTA: 'Distal (type 1) RTA',
  type4RTA: 'Type 4 RTA',
  preRenalAzotaemia: 'Prerenal azotaemia',
  atn: 'Acute tubular necrosis',
};

export const PRESET_ORDER: RenalTubularPresetName[] = [
  'normal',
  'centralDI',
  'nephrogenicDI',
  'siadh',
  'loopDiuretic',
  'thiazide',
  'acetazolamide',
  'sglt2Inhibitor',
  'amiloride',
  'mannitol',
  'tolvaptan',
  'proximalRTA',
  'distalRTA',
  'type4RTA',
  'preRenalAzotaemia',
  'atn',
];

import type { RespInputs } from './types';

export const DEFAULT_RESP_INPUTS: RespInputs = {
  minuteVentilation: 100,
  vqMismatch: 0,
  fiO2: 0.21,
  co2Production: 100,
  metabolicAcidLoad: 0,
  acidType: 'anionGap',
  renalCompensationCapacity: 1,
};

export type RespPresetName =
  | 'normal'
  | 'copdChronicAcidosis'
  | 'copdExacerbation'
  | 'panicHyperventilation'
  | 'dkaMetabolicAcidosis'
  | 'highAltitude'
  | 'diarrhoeaNonGap'
  | 'pyloricStenosis'
  | 'salicylatePoisoning'
  | 'cardiacArrest'
  | 'vomitingOnCopd';

export const RESP_PRESETS: Record<RespPresetName, Partial<RespInputs>> = {
  normal: { ...DEFAULT_RESP_INPUTS },
  // Chronic hypoventilation — renal compensation (slow) partially normalizes pH over time.
  // Severe enough to be genuinely hypoxaemic on room air (PaO2 ~55, SaO2 ~88%), not just
  // hypercapnic: a retainer who is not hypoxaemic is never given oxygen, so the milder
  // setting this replaced could not show what oxygen does to such a patient.
  copdChronicAcidosis: { minuteVentilation: 30 },
  // The OTHER COPD patient, and the commoner one in an emergency department. Pulse's own
  // exacerbation is dominated by hypoxaemia — PaO2 89 -> 27 mmHg — with the CO2 barely moving
  // (40 -> 45). That is V/Q mismatch, not hypoventilation, and until this preset existed the module
  // could only teach the retainer above.
  //
  // Note the ventilation is set BELOW baseline even though Pulse's patient is breathing 36 times a
  // minute. Rate is not alveolar ventilation: breathing fast and shallow over a large dead space
  // moves less gas than breathing normally, which is exactly why the effort is not rewarded. Lands
  // at PaCO2 46, PaO2 29, SaO2 55% against Pulse's 45, 27 and 51% — and on an acid-base
  // interpretation that reads NORMAL, which is the trap: half the gas is reassuring and the patient
  // is dying of the other half.
  copdExacerbation: { minuteVentilation: 60, vqMismatch: 0.78 },
  // Acute hyperventilation, e.g. a panic attack — renal compensation hasn't had time to engage.
  panicHyperventilation: { minuteVentilation: 260 },
  // Ketoacid production drives a primary metabolic acidosis; Kussmaul hyperventilation
  // emerges from the chemoreceptor reflex alone — minuteVentilation stays at baseline.
  dkaMetabolicAcidosis: { metabolicAcidLoad: 70 },
  // Reduced inspired O2 (modeling reduced atmospheric pressure at altitude).
  highAltitude: { fiO2: 0.12 },

  // --- The same pH by different routes, and the disorders that need two names ---

  // Bicarbonate lost from the gut with chloride taking its place. The pH and the bicarbonate
  // are indistinguishable from a mild ketoacidosis; only the anion gap separates them, which
  // is the entire reason it is calculated.
  diarrhoeaNonGap: { metabolicAcidLoad: 45, acidType: 'hyperchloraemic' },
  // Vomiting gastric acid is losing hydrogen ion, so the bicarbonate left behind is in excess.
  // Respiratory compensation is hypoventilation, which is limited by the need to breathe at
  // all — the reason the compensation band for a metabolic alkalosis is so much wider.
  pyloricStenosis: { metabolicAcidLoad: -35 },
  // Two PRIMARY disorders at once, not one compensating the other: salicylate stimulates the
  // respiratory centre directly AND uncouples oxidative phosphorylation. The respiratory
  // alkalosis is not a response to the acidosis, and no compensation rule will fit the numbers.
  salicylatePoisoning: { minuteVentilation: 190, metabolicAcidLoad: 40 },
  // Ventilation stops and perfusion fails together, so CO2 accumulates while anaerobic
  // metabolism pours out lactate. Both arms acidotic, nothing compensating anything.
  cardiacArrest: { minuteVentilation: 22, metabolicAcidLoad: 95 },
  // A chronic retainer who starts vomiting. Both derangements push the bicarbonate up, so the
  // pH can look reassuringly normal while both components are grossly abnormal.
  vomitingOnCopd: { minuteVentilation: 30, metabolicAcidLoad: -30 },
};

export const RESP_PRESET_LABELS: Record<RespPresetName, string> = {
  normal: 'Normal',
  copdChronicAcidosis: 'COPD (chronic)',
  copdExacerbation: 'COPD (exacerbation)',
  panicHyperventilation: 'Panic attack',
  dkaMetabolicAcidosis: 'DKA',
  highAltitude: 'High altitude',
  diarrhoeaNonGap: 'Diarrhoea (non-gap)',
  pyloricStenosis: 'Vomiting',
  salicylatePoisoning: 'Salicylate',
  cardiacArrest: 'Cardiac arrest',
  vomitingOnCopd: 'Vomiting on COPD',
};

export const PRESET_ORDER: RespPresetName[] = [
  'normal',
  'copdChronicAcidosis',
  'copdExacerbation',
  'panicHyperventilation',
  'dkaMetabolicAcidosis',
  'highAltitude',
  'diarrhoeaNonGap',
  'pyloricStenosis',
  'salicylatePoisoning',
  'cardiacArrest',
  'vomitingOnCopd',
];

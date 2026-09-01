import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult who has not bled and is on no anticoagulant.
 *
 * These bands used to be asserted against the engine's own LAB_BASELINE constants, which passes by
 * construction and could never catch a wrong constant. They are published literals now.
 */
export const COAGULATION_REFERENCE_RANGES: ReferenceRanges = {
  ptSeconds: {
    low: 11.0,
    high: 13.5,
    unit: 's',
    provenance: {
      kind: 'literature',
      citation: 'Prothrombin time reference interval, roughly 11-13.5 s.',
      note: 
        'Was asserted against LAB_BASELINE.PT_SECONDS, so the engine was compared to itself. The' +
        'literal makes the assertion real.',
    },
  },
  inr: {
    low: 0.8,
    high: 1.2,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation: 
        'International normalised ratio 0.8-1.2 in an untreated adult; 2.0-3.0 is the usual' +
        'warfarin target.',
    },
  },
  apttSeconds: {
    low: 25.0,
    high: 35.0,
    unit: 's',
    provenance: {
      kind: 'literature',
      citation: 'Activated partial thromboplastin time reference interval, roughly 25-35 s.',
    },
  },
  fibrinogenMgDl: {
    low: 200.0,
    high: 400.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 
        'Plasma fibrinogen 200-400 mg/dL. Below 100 is the usual replacement threshold in major' +
        'haemorrhage.',
    },
  },
  plateletCountValue: {
    low: 150.0,
    high: 400.0,
    unit: 'x10^9/L',
    provenance: {
      kind: 'literature',
      citation: 'Platelet count 150-400 x10^9/L.',
    },
  },
  dDimerNgMl: {
    low: 0.0,
    high: 500.0,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation: 
        'D-dimer below 500 ng/mL FEU is the conventional negative cut-off used to exclude venous' +
        'thromboembolism in a low-probability patient.',
    },
  },
  bleedingTimeMinutes: {
    low: 2.0,
    high: 9.0,
    unit: 'min',
    provenance: {
      kind: 'literature',
      citation: 
        'Template bleeding time 2-9 min. Largely abandoned clinically, but it is the classic' +
        'measure of PRIMARY haemostasis and separates a platelet problem from a factor problem.',
    },
  },
};

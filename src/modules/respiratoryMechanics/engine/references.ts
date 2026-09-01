import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult breathing quietly at rest.
 *
 * The static volumes are the ones a spirometry report is read against, and the FEV1/FVC ratio is
 * the single number that separates obstruction from restriction.
 */
export const RESP_MECH_REFERENCE_RANGES: ReferenceRanges = {
  functionalResidualCapacityML: {
    low: 2000.0,
    high: 3000.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation:
        'Functional residual capacity about 2.4 L in a 70 kg adult — the volume the lung relaxes ' +
        'to when respiratory-system recoil balances chest-wall recoil.',
    },
  },
  residualVolumeML: {
    low: 1000.0,
    high: 1600.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation: 'Residual volume about 1.2 L in a healthy adult.',
    },
  },
  vitalCapacityML: {
    low: 3500.0,
    high: 5500.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation: 'Vital capacity 3.5-5.5 L in an adult male, varying with height and age.',
    },
  },
  totalLungCapacityML: {
    low: 5000.0,
    high: 7000.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation: 'Total lung capacity about 6 L in an adult male.',
    },
  },
  fev1RatioPercent: {
    low: 70.0,
    high: 90.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'FEV1/FVC above 70% is the GOLD criterion for excluding airflow obstruction; a healthy ' +
        'young adult sits near 80%.',
    },
  },
  alveolarVentilationMLPerMin: {
    low: 4000.0,
    high: 8000.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Alveolar ventilation about 4-5 L/min at rest, from a minute ventilation near 6-8 L/min ' +
        'less anatomical dead space.',
    },
  },
  workOfBreathingJPerMin: {
    low: 0.5,
    high: 6.0,
    unit: 'J/min',
    provenance: {
      kind: 'literature',
      citation:
        'Work of breathing in quiet breathing is a few joules per minute, roughly 0.3-0.6 J/L of ' +
        'ventilation, and accounts for under 5% of resting oxygen consumption. Otis, Fenn and ' +
        'Rahn (1950).',
    },
  },
  timeConstantSeconds: {
    low: 0.05,
    high: 0.5,
    unit: 's',
    provenance: {
      kind: 'literature',
      citation:
        'The respiratory time constant, resistance times compliance, is about 0.1 s in a normal ' +
        'lung; three constants empty roughly 95% of the tidal volume.',
    },
  },
};

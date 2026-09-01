import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult on a normal salt and water intake.
 *
 * The compartment volumes matter as much as the concentrations here: the Edelman relation makes
 * serum sodium a statement about TOTAL BODY WATER rather than about sodium, which is the single
 * idea this module exists to install.
 */
export const ELECTROLYTE_REFERENCE_RANGES: ReferenceRanges = {
  serumSodiumMeqL: {
    low: 135.0,
    high: 145.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'literature',
      citation: 'Serum sodium reference interval, 135-145 mEq/L.',
    },
  },
  serumPotassiumMeqL: {
    low: 3.5,
    high: 5.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'literature',
      citation: 'Serum potassium reference interval, 3.5-5.0 mEq/L.',
    },
  },
  serumOsmolality: {
    low: 275.0,
    high: 295.0,
    unit: 'mOsm/kg',
    provenance: {
      kind: 'literature',
      citation: 'Plasma osmolality 275-295 mOsm/kg, the range ADH defends to within about 1%.',
    },
  },
  totalBodyWaterL: {
    low: 36.0,
    high: 48.0,
    unit: 'L',
    provenance: {
      kind: 'literature',
      citation: 'Total body water is about 60% of body mass in an adult male, so roughly 42 L at 70 kg.',
    },
  },
  ecfVolumeL: {
    low: 12.0,
    high: 16.0,
    unit: 'L',
    provenance: {
      kind: 'literature',
      citation:
        'Extracellular fluid is about one third of total body water, roughly 14 L at 70 kg. The ' +
        'ECF/TBW ratio is what the Edelman regression is built on.',
    },
  },
  urineVolumeLPerDay: {
    low: 0.8,
    high: 2.5,
    unit: 'L/day',
    provenance: {
      kind: 'literature',
      citation: 'Normal adult urine output 0.8-2.5 L/day on an unrestricted water intake.',
    },
  },
  sodiumExcretionMeqPerDay: {
    low: 100.0,
    high: 200.0,
    unit: 'mEq/day',
    provenance: {
      kind: 'literature',
      citation:
        'At steady state sodium excretion equals sodium intake; a typical Western intake is 150 ' +
        'mEq/day. That equality IS the steady state, and it is why a salt load raises pressure ' +
        'rather than sodium.',
    },
  },
};

import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * An untrained adult at rest, before any work has been asked of them.
 */
export const EXERCISE_REFERENCE_RANGES: ReferenceRanges = {
  vo2MlMin: {
    low: 200.0,
    high: 350.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Resting oxygen consumption is one metabolic equivalent, about 3.5 mL/kg/min, so roughly ' +
        '250 mL/min at 70 kg.',
    },
  },
  vo2MaxMlMin: {
    low: 2400.0,
    high: 4000.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'VO2max about 35-45 mL/kg/min in an untrained young adult, so roughly 2.5-3.2 L/min at 70 ' +
        'kg. Endurance athletes reach 70-85 mL/kg/min.',
    },
  },
  maxHeartRateBpm: {
    low: 170.0,
    high: 200.0,
    unit: 'bpm',
    provenance: {
      kind: 'literature',
      citation:
        'Maximum heart rate approximated by 220 minus age, or by Tanaka 208 minus 0.7 times age; ' +
        'about 190 bpm at 30 years.',
    },
  },
  cardiacOutputLMin: {
    low: 4.0,
    high: 7.0,
    unit: 'L/min',
    provenance: {
      kind: 'literature',
      citation: 'Resting cardiac output 4-6 L/min, rising five-fold in a trained athlete at maximal work.',
    },
  },
  lactateMmolL: {
    low: 0.5,
    high: 2.2,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Resting arterial lactate 0.5-2.2 mmol/L. The lactate threshold sits near 60-70% of ' +
        'VO2max in an untrained subject.',
    },
  },
  arteriovenousDiffMlDl: {
    low: 4.0,
    high: 6.0,
    unit: 'mL/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Resting arteriovenous oxygen difference about 5 mL/dL, widening to 15-16 at maximal ' +
        'exercise. Fick: VO2 equals cardiac output times this difference.',
    },
  },
  ventilationLMin: {
    low: 5.0,
    high: 10.0,
    unit: 'L/min',
    provenance: {
      kind: 'literature',
      citation: 'Resting minute ventilation 6-8 L/min, rising to over 100 L/min at maximal exercise.',
    },
  },
};

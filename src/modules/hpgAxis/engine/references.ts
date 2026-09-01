import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult woman at the end of a cycle, which is where the module's baseline lands.
 *
 * Every hormone here is a 0-1 index, so the cycle's SHAPE is testable and its magnitudes are not.
 * That is the gap: the LH surge is defined by a concentration and a duration.
 */
export const HPG_REFERENCE_RANGES: ReferenceRanges = {
  cycleDay: {
    low: 21.0,
    high: 35.0,
    unit: 'days',
    provenance: {
      kind: 'literature',
      citation:
        'A normal menstrual cycle is 21-35 days, conventionally 28, with a luteal phase fixed ' +
        'near 14 days and the follicular phase carrying the variation.',
    },
  },
  lhLevel: {
    low: 0.2,
    high: 0.7,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Luteinising hormone is measured in IU/L, and the ovulatory surge is defined by exceeding ' +
        'roughly 20-40 IU/L for about 48 hours. As a 0-1 index the surge can be shown to happen ' +
        'but not to be the right size or duration, and LH-to-FSH ratio (raised above 2 in ' +
        'polycystic ovary syndrome) cannot be read at all.',
    },
  },
  estrogenLevel: {
    low: 0.1,
    high: 0.6,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Estradiol is measured in pmol/L, and the threshold that TRIGGERS the LH surge is a ' +
        'concentration sustained above roughly 200 pg/mL for about 50 hours. That threshold is ' +
        'the mechanism behind the switch from negative to positive feedback and cannot be stated ' +
        'on this scale.',
    },
  },
};

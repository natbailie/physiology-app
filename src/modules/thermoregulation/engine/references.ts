import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A clothed adult at rest in a thermoneutral room.
 *
 * One band here is deliberately NOT sourced, and it is the most interesting entry in the file — see
 * `skinTempC`.
 */
export const THERMO_REFERENCE_RANGES: ReferenceRanges = {
  coreTempC: {
    low: 36.5,
    high: 37.5,
    unit: 'degC',
    provenance: {
      kind: 'literature',
      citation:
        'Core body temperature 36.5-37.5 degrees, defended to within a few tenths by a ' +
        'hypothalamic set point. Below 35 is hypothermia and below 32 is severe.',
    },
  },
  setPointC: {
    low: 36.8,
    high: 37.2,
    unit: 'degC',
    provenance: {
      kind: 'literature',
      citation:
        'The defended set point is about 37 degrees and is RAISED by pyrogens in fever, which is ' +
        'what distinguishes fever from hyperthermia.',
    },
  },
  metabolicHeatW: {
    low: 70.0,
    high: 110.0,
    unit: 'W',
    provenance: {
      kind: 'literature',
      citation:
        'Basal metabolic rate of an adult is about 80-100 W, which is the heat the body must ' +
        'continuously lose to hold a steady core temperature.',
    },
  },
  skinTempC: {
    low: 26.0,
    high: 30.0,
    unit: 'degC',
    provenance: {
      kind: 'unsourced',
      needs:
        'This band is where our model actually sits (27.7 degrees) and it does not agree with the ' +
        'literature: mean skin temperature at thermal neutrality is usually given as 33-35 ' +
        'degrees, and the core-to-skin gradient here is therefore about twice what partitional ' +
        'calorimetry reports. Settling it needs the Hardy-DuBois or Fiala data, and it probably ' +
        'means the skin blood flow term or the ambient assumption is wrong rather than the band.',
    },
  },
};

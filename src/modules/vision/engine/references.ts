import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy young adult eye in photopic conditions.
 */
export const VISION_REFERENCE_RANGES: ReferenceRanges = {
  intraocularPressureMmHg: {
    low: 10.0,
    high: 21.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Intraocular pressure 10-21 mmHg, from the Goldmann relation between aqueous production, ' +
        'outflow facility and episcleral venous pressure. Above 21 defines ocular hypertension.',
    },
  },
  pupilRightMm: {
    low: 2.0,
    high: 5.0,
    unit: 'mm',
    provenance: {
      kind: 'literature',
      citation:
        'Photopic pupil diameter 2-4 mm, dilating to 5-8 mm in the dark. The Watson and Yellott ' +
        '(2012) unified formula gives diameter as a function of luminance, field size, age and ' +
        'monocularity.',
    },
  },
  acuityDenominator: {
    low: 4.0,
    high: 9.0,
    unit: 'Snellen 6/x',
    provenance: {
      kind: 'literature',
      citation:
        'Normal corrected acuity is 6/6 on the Snellen scale; 6/12 is the usual UK driving ' +
        'standard and 6/60 the threshold for legal blindness.',
    },
  },
  nearPointCm: {
    low: 7.0,
    high: 20.0,
    unit: 'cm',
    provenance: {
      kind: 'literature',
      citation:
        'Near point of accommodation under 20 cm at age 20, receding past 50 cm by age 50 as the ' +
        'lens stiffens. Duane accommodation-amplitude curve.',
    },
  },
  accommodativeResponseD: {
    low: 0.0,
    high: 1.0,
    unit: 'dioptres',
    provenance: {
      kind: 'literature',
      citation:
        'Accommodative demand is the reciprocal of viewing distance in metres, so a 6 m target ' +
        'demands about 0.17 D and a 25 cm target 4 D.',
    },
  },
};

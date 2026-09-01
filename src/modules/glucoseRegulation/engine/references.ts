import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A fasting, non-diabetic adult before anything has been eaten.
 */
export const GLUCOSE_REFERENCE_RANGES: ReferenceRanges = {
  bloodGlucoseMgDl: {
    low: 70.0,
    high: 100.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 
        'ADA fasting plasma glucose: normal below 100 mg/dL, impaired fasting glucose 100-125,' +
        'diabetes 126 or above.',
      note: 
        'Ours settles at 91.5. Those diagnostic thresholds are what the presets are built to' +
        'straddle.',
    },
  },
  hepaticGlycogenReserve: {
    low: 0.8,
    high: 1.0,
    unit: 'fraction',
    provenance: {
      kind: 'unsourced',
      needs: 
        'A fed liver holds roughly 100 g of glycogen, about a 24-hour fasting supply, but this is' +
        'a fraction of a full store rather than grams. Expressing it in grams would let it be' +
        'checked against the hepatic glycogen literature and against the timing of the fasting-' +
        'to-starvation transition.',
    },
  },
};

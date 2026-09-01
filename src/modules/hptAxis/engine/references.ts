import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A euthyroid adult. TSH is the one that matters most and the one that was hardest to state: it was
 * a 0-1 index until `TSH_ASSAY` gave it real units, and a thyroid function test cannot be read
 * without them.
 */
export const HPT_REFERENCE_RANGES: ReferenceRanges = {
  tshMilliUnitsPerL: {
    low: 0.4,
    high: 4.0,
    unit: 'mIU/L',
    provenance: {
      kind: 'literature',
      citation: 
        'Standard third-generation TSH assay reference interval, 0.4-4.0 mIU/L, used by' +
        'essentially every clinical laboratory.',
      note: 
        'Ours settles at 1.5, mid-range. The band is what makes "Graves TSH below 0.05" and' +
        '"subclinical hypothyroidism" expressible at all.',
    },
  },
  t4Level: {
    low: 5.0,
    high: 12.0,
    unit: 'ug/dL',
    provenance: {
      kind: 'literature',
      citation: 'Total thyroxine reference interval, 5-12 ug/dL (64-154 nmol/L).',
    },
  },
  t3Level: {
    low: 80.0,
    high: 200.0,
    unit: 'ng/dL',
    provenance: {
      kind: 'literature',
      citation: 'Total triiodothyronine reference interval, 80-200 ng/dL.',
    },
  },
};

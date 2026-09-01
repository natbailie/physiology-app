import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult on a normal calcium and phosphate intake.
 *
 * PTH is what makes the others interpretable: the same calcium means primary hyperparathyroidism
 * with a PTH of 100 and malignancy with a PTH of 5. See `PTH_ASSAY`.
 */
export const CALCIUM_REFERENCE_RANGES: ReferenceRanges = {
  serumCalciumMgDl: {
    low: 8.5,
    high: 10.5,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 'Total serum calcium reference interval, 8.5-10.5 mg/dL (2.12-2.62 mmol/L).',
    },
  },
  serumPhosphateMgDl: {
    low: 2.5,
    high: 4.5,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 'Adult serum phosphate reference interval, 2.5-4.5 mg/dL.',
    },
  },
  pthPgPerML: {
    low: 15.0,
    high: 65.0,
    unit: 'pg/mL',
    provenance: {
      kind: 'literature',
      citation: 'Intact PTH reference interval, roughly 15-65 pg/mL.',
      note: 'Ours settles at 35, mid-range.',
    },
  },
  calciumPhosphateProduct: {
    low: 20.0,
    high: 55.0,
    unit: 'mg2/dL2',
    provenance: {
      kind: 'literature',
      citation: 
        'A calcium-phosphate product below 55 mg2/dL2 is the conventional threshold above which' +
        'ectopic calcification risk rises, used in CKD-MBD management.',
    },
  },
};

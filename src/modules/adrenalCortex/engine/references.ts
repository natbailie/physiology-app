import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adrenal cortex with all three zones intact.
 *
 * Every output here is a percentage of normal, which is why every band below is unsourced. That is
 * the honest position and it is also the work item: the enzyme blocks this module teaches are
 * diagnosed on 17-hydroxyprogesterone in nmol/L and on renin-aldosterone ratios, not on indices.
 */
export const ADRENAL_CORTEX_REFERENCE_RANGES: ReferenceRanges = {
  endogenousCortisol: {
    low: 80.0,
    high: 120.0,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'Expressed as a percentage of normal rather than in assay units, so no published ' +
        'reference interval can be applied to it. Cortisol has a well-defined interval (morning ' +
        '10-20 ug/dL) and the sibling hpaAxis module already expresses it that way, so the two ' +
        'modules currently disagree about what units cortisol has.',
    },
  },
  aldosterone: {
    low: 80.0,
    high: 120.0,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'Expressed as a percentage of normal rather than in assay units, so no published ' +
        'reference interval can be applied to it. Plasma aldosterone is measured in ng/dL and ' +
        'interpreted as an aldosterone-to-renin RATIO, which is the screening test for primary ' +
        'hyperaldosteronism and cannot be expressed on this scale.',
    },
  },
  marker17ohp: {
    low: 0.5,
    high: 1.5,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        '17-hydroxyprogesterone is the diagnostic marker for 21-hydroxylase deficiency and has a ' +
        'hard published cut-off (above about 100 nmol/L on newborn screening, against a normal ' +
        'below 6). As an index this cannot be compared with that threshold, which is the single ' +
        'most useful number in the module.',
    },
  },
  mineralocorticoidActivity: {
    low: 80.0,
    high: 120.0,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'A composite of aldosterone and of the cortisol and deoxycorticosterone that spill onto ' +
        'the mineralocorticoid receptor. Real units would need each contributor separately, which ' +
        'is a modelling change rather than a units change.',
    },
  },
};

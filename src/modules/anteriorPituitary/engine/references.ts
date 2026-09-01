import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult anterior pituitary with no adenoma.
 */
export const PITUITARY_REFERENCE_RANGES: ReferenceRanges = {
  ghNgMl: {
    low: 0.0,
    high: 5.0,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation:
        'Random growth hormone in an adult is usually below 5 ng/mL and is pulsatile. Failure to ' +
        'suppress below 1 ng/mL on an oral glucose tolerance test is the diagnostic test for ' +
        'acromegaly.',
    },
  },
  igf1NgMl: {
    low: 100.0,
    high: 300.0,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation:
        'Adult IGF-1 roughly 100-300 ng/mL. It integrates GH over the day, which is why it is the ' +
        'screening test where a random GH is not.',
      note:
        'Not age-normalised here, and IGF-1 reference intervals are strongly age-dependent — see ' +
        'the needs on gonadalSuppressionPct for the general form of that gap.',
    },
  },
  prolactinNgMl: {
    low: 2.0,
    high: 25.0,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation:
        'Prolactin below about 25 ng/mL in a non-pregnant adult. Above 250 ng/mL is essentially ' +
        'diagnostic of a macroprolactinoma, where a modest rise can be stalk compression instead.',
    },
  },
  dopamineTonePct: {
    low: 90.0,
    high: 110.0,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'Expressed as a percentage of normal rather than in assay units, so no published ' +
        'reference interval can be applied to it. Hypothalamic dopamine tone is the tonic ' +
        'INHIBITION that makes prolactin unique among pituitary hormones, and expressing it in ' +
        'real terms would need a portal dopamine concentration, which is not measurable ' +
        'clinically.',
    },
  },
};

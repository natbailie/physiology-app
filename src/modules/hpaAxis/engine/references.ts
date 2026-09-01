import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult somewhere in the circadian day.
 *
 * Both bands are deliberately the TWENTY-FOUR HOUR range rather than a morning reference interval,
 * because this module's baseline is an oscillation and the settle lands wherever the rhythm has
 * reached. A morning-only band would fail a correct model for being sampled at midnight.
 */
export const HPA_REFERENCE_RANGES: ReferenceRanges = {
  cortisolLevel: {
    low: 2.0,
    high: 22.0,
    unit: 'ug/dL',
    provenance: {
      kind: 'literature',
      citation: 
        'Serum cortisol across the circadian day: morning peak 10-20 ug/dL, late-evening nadir' +
        'below 5.',
      note: 
        'Ours settles at 8.6, between peak and trough. The circadian SHAPE is asserted separately' +
        'in engine.test.ts; this band only holds the level plausible.',
    },
  },
  acthPgPerML: {
    low: 1.0,
    high: 60.0,
    unit: 'pg/mL',
    provenance: {
      kind: 'literature',
      citation: 'Plasma ACTH morning reference interval 10-60 pg/mL, with a circadian nadir well below 10.',
      note: 
        'Ours settles at 3.3 at the phase the module opens on. See ACTH_ASSAY: the discrimination' +
        'between primary and secondary adrenal failure is made entirely on this number, and it' +
        'was a percentage until now.',
    },
  },
};

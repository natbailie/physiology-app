import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting adult with no catecholamine-secreting tumour.
 */
export const MEDULLA_REFERENCE_RANGES: ReferenceRanges = {
  mapMmHg: {
    low: 80.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Mean arterial pressure about 93 mmHg at rest, from a 120/80 cuff pressure.',
    },
  },
  heartRateBpm: {
    low: 60.0,
    high: 100.0,
    unit: 'bpm',
    provenance: {
      kind: 'literature',
      citation: 'Normal adult resting heart rate 60-100 bpm.',
    },
  },
  orthostaticDropMmHg: {
    low: 0.0,
    high: 20.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Orthostatic hypotension is defined as a fall of 20 mmHg systolic or 10 mmHg diastolic ' +
        'within three minutes of standing. A patient with a phaeochromocytoma is volume-deplete ' +
        'and often orthostatic despite being hypertensive supine.',
    },
  },
  plasmaNa: {
    low: 5.0,
    high: 20.0,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Plasma noradrenaline has a reference interval (roughly 100-500 pg/mL supine) and ' +
        'phaeochromocytoma is diagnosed on plasma free METANEPHRINES rather than on ' +
        'catecholamines, because metanephrines are secreted continuously while catecholamines are ' +
        'episodic. Neither can be checked against this scale.',
    },
  },
};

import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * An adult at rest with no injury and no stimulus applied.
 *
 * The three latencies are the only quantities here with an external anchor, and they are a good one:
 * first and second pain are separated because A-delta and C fibres conduct at different speeds, so
 * the RATIO of the latencies is a statement about the Erlanger-Gasser classification.
 */
export const SOMATIC_REFERENCE_RANGES: ReferenceRanges = {
  firstPainLatencyMs: {
    low: 40.0,
    high: 150.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'First (sharp) pain arrives over myelinated A-delta fibres conducting at 5-30 m/s, so ' +
        'about 0.1 s from a limb. Erlanger-Gasser fibre classification.',
    },
  },
  secondPainLatencyMs: {
    low: 700.0,
    high: 2000.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'Second (burning) pain arrives over unmyelinated C fibres conducting at 0.5-2 m/s, about ' +
        'a second later from the same site. The gap is the double-pain phenomenon.',
    },
  },
  touchLatencyMs: {
    low: 8.0,
    high: 30.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'Light touch travels on large myelinated A-beta fibres at 30-70 m/s, faster than either ' +
        'pain fibre — which is the anatomical basis of the gate-control account of why rubbing an ' +
        'injury helps.',
    },
  },
  perceivedPainScore: {
    low: 0.0,
    high: 1.0,
    unit: '0-10',
    provenance: {
      kind: 'literature',
      citation:
        'No pain at rest with no stimulus. The 0-10 numerical rating scale is the standard ' +
        'clinical instrument, so the SCALE is real even though the mapping onto it here is ' +
        'modelled.',
    },
  },
};

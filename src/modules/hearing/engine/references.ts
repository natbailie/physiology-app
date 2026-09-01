import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A young adult with normal hearing, tested at 1 kHz.
 */
export const HEARING_REFERENCE_RANGES: ReferenceRanges = {
  ptaDb: {
    low: -10.0,
    high: 20.0,
    unit: 'dB HL',
    provenance: {
      kind: 'literature',
      citation:
        'Pure-tone average below 20 dB HL is normal hearing; 21-40 is mild loss, 41-70 moderate ' +
        'and above 90 profound. WHO grades.',
    },
  },
  airBoneGapDb: {
    low: -5.0,
    high: 10.0,
    unit: 'dB',
    provenance: {
      kind: 'literature',
      citation:
        'An air-bone gap below 10 dB is normal. A gap above about 15 dB defines a conductive ' +
        'component, and its absence with a raised threshold defines a sensorineural one.',
    },
  },
  sensationLevelDb: {
    low: 0.0,
    high: 100.0,
    unit: 'dB SL',
    provenance: {
      kind: 'literature',
      citation:
        'Sensation level is the amount by which a stimulus exceeds the listener threshold; ' +
        'comfortable speech sits about 40-50 dB SL.',
    },
  },
  speechDiscriminationPct: {
    low: 90.0,
    high: 100.0,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'Word recognition scores are measured against standard word lists and are the finding ' +
        'that separates a cochlear from a retrocochlear loss, including rollover at high levels. ' +
        'The score here is computed from an index rather than from a modelled word list, so it ' +
        'cannot be checked against published norms.',
    },
  },
};

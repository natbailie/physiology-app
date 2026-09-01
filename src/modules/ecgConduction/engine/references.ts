import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A normal sinus rhythm in an adult.
 *
 * These are the intervals a twelve-lead ECG is actually read by, and every one of them is a
 * threshold a student is examined on.
 */
export const ECG_REFERENCE_RANGES: ReferenceRanges = {
  prIntervalMs: {
    low: 120.0,
    high: 200.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'PR interval 120-200 ms. Above 200 ms is first-degree atrioventricular block; below 120 ' +
        'ms with a delta wave is pre-excitation.',
    },
  },
  qrsDurationMs: {
    low: 60.0,
    high: 120.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'QRS duration below 120 ms in normal conduction. At or above 120 ms defines a bundle ' +
        'branch block.',
    },
  },
  qtcMs: {
    low: 340.0,
    high: 450.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'Bazett-corrected QT below about 440 ms in men and 460 ms in women; above 500 ms carries ' +
        'a markedly raised torsades risk.',
    },
  },
  meanQrsAxisDegrees: {
    low: -30.0,
    high: 90.0,
    unit: 'degrees',
    provenance: {
      kind: 'literature',
      citation:
        'Normal frontal-plane QRS axis is -30 to +90 degrees. Beyond -30 is left axis deviation ' +
        'and beyond +90 right axis deviation.',
    },
  },
  heartRateBpm: {
    low: 60.0,
    high: 100.0,
    unit: 'bpm',
    provenance: {
      kind: 'literature',
      citation: 'Sinus rhythm is 60-100 bpm by definition; outside it is sinus bradycardia or tachycardia.',
    },
  },
};

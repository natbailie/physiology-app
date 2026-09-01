import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult heart and kidney at steady state.
 *
 * Four of these are corroborated by Kitware's own baroreflex trace. Note the scale trap this module
 * carries: `gfr`, `urineOutput` and `bloodVolume` are NORMALISED, 100 = normal, not mL/min — which
 * is why the oracle compares fractions of each engine's own baseline rather than absolute values.
 */
export const CARDIORENAL_REFERENCE_RANGES: ReferenceRanges = {
  meanArterialPressure: {
    low: 85.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'baroreflex-class1',
      observed: 95.3,
      note: 'Pulse\'s StandardMale sits at 95.3 against our 93.0.',
    },
  },
  effectiveHeartRate: {
    low: 60.0,
    high: 100.0,
    unit: 'bpm',
    provenance: {
      kind: 'oracle',
      trace: 'baroreflex-class1',
      observed: 72.0,
      note: 'Pulse 72 against our 70.',
    },
  },
  cardiacOutput: {
    low: 4000.0,
    high: 6500.0,
    unit: 'mL/min',
    provenance: {
      kind: 'oracle',
      trace: 'baroreflex-class1',
      observed: 5790.0,
      note:
        'Pulse 5.79 L/min against our 4.9. Pulse\'s own validation table gives an expected 5.6 ' +
        'L/min for this patient, attributed there to Guyton 2006.',
    },
  },
  strokeVolume: {
    low: 60.0,
    high: 100.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation: 'Resting stroke volume 60-100 mL in an adult, from a 5 L/min output at 70 bpm.',
    },
  },
  filtrationFraction: {
    low: 0.15,
    high: 0.22,
    unit: 'fraction',
    provenance: {
      kind: 'literature',
      citation:
        'Filtration fraction, GFR over renal plasma flow, is normally 0.15-0.22 and RISES under ' +
        'angiotensin II because efferent constriction defends filtration as flow falls.',
    },
  },
  gfr: {
    low: 90.0,
    high: 110.0,
    unit: 'normalised',
    provenance: {
      kind: 'unsourced',
      needs:
        'Normalised so 100 equals a normal GFR, rather than being expressed in mL/min/1.73m2 ' +
        'where the CKD staging thresholds (90, 60, 45, 30, 15) live. Expressing it in real units ' +
        'would let the stages be read straight off the readout and would let this band be checked ' +
        'against a measured clearance.',
    },
  },
};

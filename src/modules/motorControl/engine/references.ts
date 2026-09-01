import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult with an intact basal ganglia loop and no movement disorder.
 *
 * Movement disorders are graded clinically rather than measured, so most of this module is scored
 * on invented scales. The one quantity with a hard published anchor is TREMOR FREQUENCY, and it is
 * not asserted anywhere yet — see the needs below.
 */
export const MOTOR_REFERENCE_RANGES: ReferenceRanges = {
  initiationLatencyMs: {
    low: 120.0,
    high: 260.0,
    unit: 'ms',
    provenance: {
      kind: 'literature',
      citation:
        'Simple reaction time in a healthy adult is 150-250 ms. Bradykinesia in Parkinson disease ' +
        'lengthens movement initiation specifically, rather than slowing conduction.',
    },
  },
  effectiveDopaminePct: {
    low: 90.0,
    high: 110.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Nigrostriatal dopamine is intact by definition in a healthy subject. Motor signs of ' +
        'Parkinson disease appear only after roughly 60-80% of nigral neurons are lost, which is ' +
        'why the disease is advanced at diagnosis.',
    },
  },
  restingTremorAmp: {
    low: 0.0,
    high: 0.5,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Tremor AMPLITUDE is an index here, but tremor FREQUENCY is the discriminating feature ' +
        'and has hard published bands: 4-6 Hz for parkinsonian rest tremor, 8-12 Hz for essential ' +
        'tremor and 3-5 Hz for cerebellar intention tremor (Deuschl consensus). The engine does ' +
        'not currently produce a frequency at all, so the one externally checkable fact about ' +
        'tremor cannot be checked.',
    },
  },
};

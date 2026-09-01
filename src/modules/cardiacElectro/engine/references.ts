import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting adult heart.
 *
 * The pressure-volume quantities are corroborated by Pulse's own left-heart trace, sampled at 50 Hz
 * over two windows of Kitware's baroreflex scenario. The comparison there is made at MATCHED
 * PRELOAD, because for Pulse end-diastolic volume is emergent and for us it is a slider.
 */
export const CARDIAC_ELECTRO_REFERENCE_RANGES: ReferenceRanges = {
  endDiastolicVolumeML: {
    low: 100.0,
    high: 160.0,
    unit: 'mL',
    provenance: {
      kind: 'oracle',
      trace: 'pv-loop',
      observed: 142.0,
      note:
        'Pulse\'s healthy ventricle fills to 142 mL against our 119. Both are inside the textbook ' +
        '100-160 mL band; ours is the conventional teaching value and Pulse sits at the top of ' +
        'the range.',
    },
  },
  endSystolicVolumeML: {
    low: 40.0,
    high: 75.0,
    unit: 'mL',
    provenance: {
      kind: 'oracle',
      trace: 'pv-loop',
      observed: 60.0,
      note:
        'At matched preload Pulse reaches ESV 60.0 and we reach 60.5 — the closest agreement in ' +
        'the loop, and the one that tests our end-systolic elastance directly.',
    },
  },
  strokeVolumeML: {
    low: 55.0,
    high: 100.0,
    unit: 'mL',
    provenance: {
      kind: 'oracle',
      trace: 'pv-loop',
      observed: 80.4,
      note:
        'Pulse reports 80.4 mL at its own larger preload; at matched preload it produces 62.4 ' +
        'against our 61.4.',
    },
  },
  ejectionFractionPercent: {
    low: 50.0,
    high: 70.0,
    unit: '%',
    provenance: {
      kind: 'oracle',
      trace: 'pv-loop',
      observed: 57.0,
      note:
        'Pulse 57% at its own preload and 51.0% at matched preload, against our 50.3%. Below 50% ' +
        'is the conventional threshold for systolic dysfunction.',
    },
  },
  cardiacOutputLPerMin: {
    low: 3.5,
    high: 8.0,
    unit: 'L/min',
    provenance: {
      kind: 'literature',
      citation:
        'Resting cardiac output 4-8 L/min in an adult. Ours settles at 4.0 because the module ' +
        'opens at 66 bpm rather than 72.',
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
};

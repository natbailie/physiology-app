import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult with the head still.
 *
 * Resting tonic firing is the thing that makes the system work: both canals fire continuously so
 * that head rotation can be encoded as a DIFFERENCE, and a dead labyrinth causes vertigo by
 * unbalancing that pair rather than by falling silent.
 */
export const VESTIBULAR_REFERENCE_RANGES: ReferenceRanges = {
  canalFiringRightSpikesPerSec: {
    low: 70.0,
    high: 110.0,
    unit: 'spikes/s',
    provenance: {
      kind: 'literature',
      citation:
        'Vestibular afferents fire tonically at about 90 spikes/s at rest, giving room to both ' +
        'increase and decrease with rotation direction.',
    },
  },
  firingImbalanceSpikesPerSec: {
    low: -5.0,
    high: 5.0,
    unit: 'spikes/s',
    provenance: {
      kind: 'literature',
      citation:
        'The two labyrinths balance at rest. Any sustained imbalance produces nystagmus and ' +
        'vertigo, which is why a unilateral lesion is symptomatic and a bilateral one is not.',
    },
  },
  vorGain: {
    low: 0.85,
    high: 1.05,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Vestibulo-ocular reflex gain, eye velocity over head velocity, is 0.85-1.0 in health. ' +
        'Below about 0.6 produces oscillopsia and a positive head-impulse test.',
    },
  },
  slowPhaseVelocityDegPerSec: {
    low: -3.0,
    high: 3.0,
    unit: 'deg/s',
    provenance: {
      kind: 'literature',
      citation:
        'No spontaneous nystagmus with the head still; slow-phase velocity above about 5 deg/s is ' +
        'pathological.',
    },
  },
};

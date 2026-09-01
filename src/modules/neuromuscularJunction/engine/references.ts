import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy neuromuscular junction stimulated at 2 Hz.
 *
 * The safety factor is the reason this synapse is interesting: transmission is normally so far
 * above threshold that half the receptors can be blocked before anything is visible, which is why
 * myasthenia is a fatiguable disease rather than a paralytic one.
 */
export const NMJ_REFERENCE_RANGES: ReferenceRanges = {
  quantalContent: {
    low: 20.0,
    high: 120.0,
    unit: 'quanta',
    provenance: {
      kind: 'literature',
      citation:
        'Quantal content at the mammalian neuromuscular junction is roughly 20-100 quanta per ' +
        'impulse, from del Castillo and Katz quantal analysis. It falls below about 15 in ' +
        'botulism and Lambert-Eaton.',
    },
  },
  endPlatePotentialMv: {
    low: 25.0,
    high: 60.0,
    unit: 'mV',
    provenance: {
      kind: 'literature',
      citation:
        'The end-plate potential is about 40 mV where roughly 20 mV depolarisation is needed to ' +
        'reach threshold. That excess IS the safety factor.',
    },
  },
  safetyFactor: {
    low: 3.0,
    high: 6.0,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Neuromuscular safety factor of 3-5 in health (Wood and Slater). It is why about 75% of ' +
        'acetylcholine receptors must be lost before weakness appears in myasthenia gravis.',
    },
  },
  trainOfFourRatio: {
    low: 0.9,
    high: 1.0,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Train-of-four ratio is 1.0 with intact transmission. Below 0.9 defines residual ' +
        'neuromuscular block and is the standard extubation criterion; fade is characteristic of ' +
        'NON-depolarising block and absent in depolarising block.',
    },
  },
};

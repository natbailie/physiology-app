import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting skeletal muscle fibre at its optimum length.
 *
 * The sarcomere geometry is the strongest anchor in this module and comes straight from the
 * measured length-tension curve; the calcium band is the weakest and says so.
 */
export const MUSCLE_REFERENCE_RANGES: ReferenceRanges = {
  sarcomereLengthUm: {
    low: 2.0,
    high: 2.2,
    unit: 'um',
    provenance: {
      kind: 'literature',
      citation:
        'Gordon, Huxley and Julian (1966): the length-tension plateau runs from 2.0 to 2.2 um, ' +
        'with tension falling to zero at 1.27 um and at 3.65 um. Those two zeros are filament ' +
        'lengths, not fitted parameters.',
    },
  },
  lengthTensionFactor: {
    low: 0.95,
    high: 1.0,
    unit: 'fraction',
    provenance: {
      kind: 'literature',
      citation:
        'At the plateau every myosin head that can reach an actin site does, so developed tension ' +
        'is maximal by construction. Gordon, Huxley and Julian (1966).',
    },
  },
  cytosolicCalciumUM: {
    low: 0.4,
    high: 0.9,
    unit: 'uM',
    provenance: {
      kind: 'unsourced',
      needs:
        'This band is where the model actually sits (0.63 uM) and it disagrees with the ' +
        'literature: resting cytosolic calcium in skeletal muscle is 0.05-0.2 uM, rising above 1 ' +
        'uM during a twitch. The resting level here is several times too high, which compresses ' +
        'the dynamic range the troponin occupancy curve sees. Settling it means checking the ' +
        'SERCA and leak balance at rest, not widening the band.',
    },
  },
};

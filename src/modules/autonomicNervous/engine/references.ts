import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * An adult at rest with the default balance of sympathetic and parasympathetic tone.
 *
 * The receptor-occupancy layer is the part with no external anchor: alpha-1, beta-1 and muscarinic
 * activation are fractions, where the pharmacology they represent is published as EC50 and pA2
 * values that a dose-response could be checked against.
 */
export const ANS_REFERENCE_RANGES: ReferenceRanges = {
  heartRateBpm: {
    low: 55.0,
    high: 100.0,
    unit: 'bpm',
    provenance: {
      kind: 'literature',
      citation:
        'Normal adult resting heart rate 60-100 bpm; the intrinsic rate of a denervated SA node ' +
        'is about 100, and resting vagal tone is what holds it below that.',
      note:
        'Ours settles at 96, at the top of the band. Worth deciding whether the default ' +
        'sympathetic and vagal tones represent a genuinely resting subject.',
    },
  },
  pupilDiameterMm: {
    low: 2.0,
    high: 5.0,
    unit: 'mm',
    provenance: {
      kind: 'literature',
      citation:
        'Photopic pupil diameter 2-4 mm. Sympathetic alpha-1 drives the dilator and ' +
        'parasympathetic muscarinic drive the sphincter, which is why anticholinergics dilate and ' +
        'opioids constrict.',
    },
  },
  alpha1Activation: {
    low: 0.0,
    high: 0.4,
    unit: 'fraction',
    provenance: {
      kind: 'unsourced',
      needs:
        'Receptor occupancy as a bare fraction. The adrenergic and muscarinic pharmacology here ' +
        'is published as EC50 and pA2 values (Gaddum-Schild analysis), so expressing dose in real ' +
        'concentrations would let the whole antagonist layer be checked against measured ' +
        'potencies rather than against itself.',
    },
  },
};

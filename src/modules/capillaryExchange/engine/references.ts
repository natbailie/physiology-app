import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A systemic capillary in a resting adult.
 *
 * Guyton's four Starling pressures, and the module's defaults were built to reproduce them. That
 * attribution has always been in `constants.ts`; putting it here is what lets a test hold it.
 */
export const CAPILLARY_REFERENCE_RANGES: ReferenceRanges = {
  capillaryPressureMmHg: {
    low: 15.0,
    high: 20.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Guyton, mean systemic capillary hydrostatic pressure 17.3 mmHg.',
      note: 'Ours settles at 17.2. The four pressures below are the same source and the same table.',
    },
  },
  interstitialPressureMmHg: {
    low: -6.0,
    high: 0.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Guyton, mean interstitial fluid hydrostatic pressure about -3 mmHg. Subatmospheric ' +
        'interstitial pressure is the finding that made the lymphatic-drainage account of oedema ' +
        'necessary.',
    },
  },
  plasmaOncoticMmHg: {
    low: 25.0,
    high: 31.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Plasma colloid osmotic pressure about 28 mmHg at an albumin of 4.2 g/dL; the Landis- ' +
        'Pappenheimer relation gives the dependence on protein concentration.',
    },
  },
  interstitialOncoticMmHg: {
    low: 6.0,
    high: 10.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Guyton, interstitial colloid osmotic pressure about 8 mmHg.',
    },
  },
  netFiltrationPressure: {
    low: -1.0,
    high: 1.5,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Guyton, mean net filtration pressure about 0.3 mmHg. It is very nearly zero on purpose: ' +
        'filtration and absorption almost balance, and the small residue is what the lymphatics ' +
        'carry.',
    },
  },
  safetyFactorMmHg: {
    low: 12.0,
    high: 25.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Guyton puts the total safety factor against oedema at about 17 mmHg: roughly 7 from the ' +
        'rise in interstitial hydrostatic pressure, 7 from lymph flow and 3 from interstitial ' +
        'protein washout.',
    },
  },
};

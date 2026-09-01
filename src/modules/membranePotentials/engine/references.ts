import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting mammalian neuron at 37 degrees on normal extracellular ions.
 *
 * The two equilibrium potentials are not calibration at all: they are the Nernst equation evaluated
 * at the module's own ion concentrations, so a wrong value would be an arithmetic error rather than
 * a modelling choice. `analytic.test.ts` checks them against the equation directly.
 */
export const MEMBRANE_REFERENCE_RANGES: ReferenceRanges = {
  vmMillivolts: {
    low: -95.0,
    high: -60.0,
    unit: 'mV',
    provenance: {
      kind: 'literature',
      citation:
        'Resting membrane potential -70 to -90 mV in a mammalian neuron, sitting close to the ' +
        'potassium equilibrium potential because the resting membrane is dominated by potassium ' +
        'leak.',
    },
  },
  eNa: {
    low: 55.0,
    high: 70.0,
    unit: 'mV',
    provenance: {
      kind: 'literature',
      citation:
        'Nernst potential for sodium at 140 mM out and 14 mM in, 37 degrees: 61.5 mV. Exact, not ' +
        'calibrated.',
    },
  },
  eK: {
    low: -100.0,
    high: -85.0,
    unit: 'mV',
    provenance: {
      kind: 'literature',
      citation:
        'Nernst potential for potassium at 4 mM out and 140 mM in, 37 degrees: -95 mV. Exact, not ' +
        'calibrated.',
    },
  },
  thresholdMv: {
    low: -60.0,
    high: -45.0,
    unit: 'mV',
    provenance: {
      kind: 'literature',
      citation:
        'Action potential threshold about -55 mV, roughly 15-20 mV depolarised from rest, where ' +
        'inward sodium current first exceeds outward potassium current.',
    },
  },
  conductionVelocityMPerS: {
    low: 30.0,
    high: 80.0,
    unit: 'm/s',
    provenance: {
      kind: 'literature',
      citation:
        'Conduction velocity of a large myelinated fibre: Erlanger-Gasser A-alpha 70-120 m/s, ' +
        'A-beta 30-70 m/s. Unmyelinated C fibres run at 0.5-2 m/s.',
    },
  },
};

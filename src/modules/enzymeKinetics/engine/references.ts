import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A modest enzyme at a substrate concentration equal to its Michaelis constant.
 *
 * These are not calibration: at [S] = Km the Michaelis-Menten equation puts velocity at exactly half
 * Vmax, so the band is an algebraic identity and `analytic.test.ts` checks it as one across the
 * whole curve rather than at this single point.
 */
export const KINETICS_REFERENCE_RANGES: ReferenceRanges = {
  reactionRateUmPerMin: {
    low: 24.5,
    high: 25.5,
    unit: 'umol/min',
    provenance: {
      kind: 'literature',
      citation:
        'Michaelis-Menten: v = Vmax[S]/(Km+[S]). At [S] = Km this is exactly Vmax/2, so 25 ' +
        'umol/min for a Vmax of 50.',
    },
  },
  apparentKmMm: {
    low: 0.49,
    high: 0.51,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Km is unchanged by a noncompetitive inhibitor, raised by a competitive one and LOWERED ' +
        'by an uncompetitive one; those three signatures are what a Lineweaver-Burk plot is read ' +
        'for.',
    },
  },
  saturationPct: {
    low: 49.0,
    high: 51.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Fractional saturation equals [S]/(Km+[S]), so exactly 50% when substrate equals Km. This ' +
        'is the definition of Km rather than a measurement of it.',
    },
  },
  temperatureFactor: {
    low: 0.95,
    high: 1.05,
    unit: 'factor',
    provenance: {
      kind: 'literature',
      citation:
        'Normalised to 1 at 37 degrees. Below the optimum the rate follows a Q10 near 2; above ' +
        'about 42 degrees denaturation wins, which is why fever accelerates metabolism and ' +
        'heatstroke does not.',
    },
  },
};

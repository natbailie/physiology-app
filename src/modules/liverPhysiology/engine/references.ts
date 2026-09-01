import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult liver with a patent biliary tree.
 *
 * The conjugated FRACTION is what makes a bilirubin interpretable: the same total means haemolysis
 * or Gilbert's if it is unconjugated and obstruction if it is conjugated.
 */
export const LIVER_REFERENCE_RANGES: ReferenceRanges = {
  totalBilirubinUmolL: {
    low: 3.0,
    high: 17.0,
    unit: 'umol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Total serum bilirubin 3-17 umol/L (0.2-1.0 mg/dL). Jaundice becomes clinically visible ' +
        'above about 40 umol/L.',
    },
  },
  fractionConjugatedPct: {
    low: 20.0,
    high: 60.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Conjugated bilirubin is normally under about 30% of the total; a conjugated fraction ' +
        'above 50% defines a cholestatic or hepatocellular picture rather than a haemolytic one.',
    },
  },
  ammoniaUmolL: {
    low: 11.0,
    high: 40.0,
    unit: 'umol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Plasma ammonia 11-32 umol/L. Levels above about 90 correlate with overt hepatic ' +
        'encephalopathy, though poorly with grade.',
    },
  },
  albuminGPerL: {
    low: 35.0,
    high: 50.0,
    unit: 'g/L',
    provenance: {
      kind: 'literature',
      citation:
        'Serum albumin 35-50 g/L. Its three-week half-life makes it a marker of CHRONIC synthetic ' +
        'function, where the prothrombin time reports acute failure.',
    },
  },
  rFactor: {
    low: 0.5,
    high: 2.0,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'R factor, ALT over its upper limit divided by ALP over its upper limit. Above 5 is ' +
        'hepatocellular injury, below 2 cholestatic, and in between mixed.',
    },
  },
};

import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A patient before any antigen challenge or transfusion.
 *
 * Unusually well anchored for an immunology module, because the transfusion-reaction work-up is
 * built on ordinary laboratory tests with published cut-offs.
 */
export const HYPERSENSITIVITY_REFERENCE_RANGES: ReferenceRanges = {
  tryptaseNgMl: {
    low: 0.0,
    high: 11.4,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation:
        'Serum tryptase below 11.4 ng/mL is the standard cut-off; a rise above it within 1-4 ' +
        'hours of a reaction supports mast cell degranulation and is the confirmatory test for ' +
        'anaphylaxis.',
    },
  },
  c3MgDl: {
    low: 90.0,
    high: 180.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Complement C3 90-180 mg/dL. It is CONSUMED in type II and type III reactions, so a ' +
        'falling C3 with a falling C4 points at classical-pathway activation.',
    },
  },
  c4MgDl: {
    low: 10.0,
    high: 40.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 'Complement C4 10-40 mg/dL.',
    },
  },
  haptoglobinMgDl: {
    low: 30.0,
    high: 200.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Haptoglobin 30-200 mg/dL. It is consumed binding free haemoglobin, so an undetectable ' +
        'haptoglobin is one of the most specific markers of INTRAVASCULAR haemolysis.',
    },
  },
  lactateDehydrogenaseUL: {
    low: 140.0,
    high: 280.0,
    unit: 'U/L',
    provenance: {
      kind: 'literature',
      citation:
        'Lactate dehydrogenase 140-280 U/L; it rises with cell lysis of any kind and completes ' +
        'the haemolysis screen alongside haptoglobin and bilirubin.',
    },
  },
  bnpPgMl: {
    low: 0.0,
    high: 100.0,
    unit: 'pg/mL',
    provenance: {
      kind: 'literature',
      citation:
        'B-type natriuretic peptide below 100 pg/mL argues against cardiac failure. It is the ' +
        'test that separates TACO (circulatory overload, BNP high) from TRALI (lung injury, BNP ' +
        'normal), which is otherwise a hard bedside distinction.',
    },
  },
  temperatureC: {
    low: 36.5,
    high: 37.5,
    unit: 'degC',
    provenance: {
      kind: 'literature',
      citation:
        'A rise of 1 degree or more with a transfusion defines a febrile non-haemolytic reaction, ' +
        'which is why the pre-transfusion baseline matters.',
    },
  },
};

import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult breathing room air at sea level.
 *
 * Four of these are corroborated by an independently built engine as well as by the textbook: the
 * committed Pulse COPD trace records a resting arterial blood gas before its exacerbation begins.
 */
export const RESP_REFERENCE_RANGES: ReferenceRanges = {
  pH: {
    low: 7.35,
    high: 7.45,
    unit: 'pH',
    provenance: {
      kind: 'oracle',
      trace: 'copd-exacerbation',
      observed: 7.4,
      note:
        'Pulse and ours agree to three decimal places at rest, and the band is the universal ' +
        'arterial reference interval.',
    },
  },
  paCO2: {
    low: 35.0,
    high: 45.0,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'copd-exacerbation',
      observed: 40.0,
      note: 'Pulse 40.0 against our 40.04. This is the tightest agreement anywhere in the app.',
    },
  },
  paO2: {
    low: 80.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'oracle',
      trace: 'copd-exacerbation',
      observed: 89.3,
      note:
        'Pulse 89.3 against our 94.7; both sit inside the conventional 80-100 mmHg band for a ' +
        'young adult on room air.',
    },
  },
  saO2: {
    low: 95.0,
    high: 100.0,
    unit: '%',
    provenance: {
      kind: 'oracle',
      trace: 'copd-exacerbation',
      observed: 97.4,
      note:
        'Pulse reports saturation as a fraction (0.974); ours is a percentage. The whole ' +
        'dissociation curve is compared against this trace in oracle.test.ts, not just this ' +
        'point.',
    },
  },
  plasmaHCO3: {
    low: 22.0,
    high: 26.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'oracle',
      trace: 'copd-exacerbation',
      observed: 24.0,
      note: 'Pulse 24.0 against our 24.0.',
    },
  },
  anionGapMEqL: {
    low: 8.0,
    high: 16.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'literature',
      citation:
        'Serum anion gap 8-16 mEq/L when calculated without potassium. The gap is what separates ' +
        'an organic acidosis from a hyperchloraemic one at identical pH and bicarbonate.',
    },
  },
  aaGradient: {
    low: 0.0,
    high: 15.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Alveolar-arterial oxygen gradient below about 15 mmHg in a young adult, rising with age ' +
        'by roughly age/4 + 4. A normal gradient in a hypoxaemic patient means hypoventilation; a ' +
        'wide one means mismatch or shunt.',
    },
  },
};

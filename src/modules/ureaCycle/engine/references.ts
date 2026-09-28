import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is a healthy adult eating ~70 g protein with an intact liver and ordinary hydration.
 * Every band here is a published interval — the flux indices the engine carries (orotic shunt,
 * cycle state) are deliberately NOT asserted, because no textbook interval can apply to them.
 */
export const UREA_CYCLE_REFERENCE_RANGES: ReferenceRanges = {
  ammoniaUmolL: {
    low: 11.0,
    high: 40.0,
    unit: 'umol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Plasma ammonia 11-32 umol/L in health; levels above about 90 correlate with overt ' +
        'hepatic encephalopathy. The model sits mid-twenties at baseline and crosses 90 only ' +
        'when capacity fails.',
    },
  },
  ureaMmolL: {
    low: 2.5,
    high: 6.5,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Fasting plasma urea roughly 2.5-6.5 mmol/L in a healthy adult. The model sits near 5 ' +
        'at baseline, rises with protein load, and falls when the cycle itself fails.',
    },
  },
  bunMgDl: {
    low: 7.0,
    high: 20.0,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Blood urea nitrogen 7-20 mg/dL. The model converts its own urea by molecular weight ' +
        '(two nitrogens per urea, 2.8 mg/dL per mmol/L), so this band checks the same ' +
        'physiology in ward units.',
    },
  },
  urineNitrogenGPerDay: {
    low: 8.0,
    high: 14.0,
    unit: 'g/day',
    provenance: {
      kind: 'literature',
      citation:
        'Urinary nitrogen excretion tracks intake at nitrogen balance: the reference protein ' +
        'intake of 0.8 g/kg/day for a 70 kg adult is ~56 g protein, ~9 g nitrogen, which the ' +
        'model excretes at baseline.',
    },
  },
  nitrogenLoadGPerDay: {
    low: 8.0,
    high: 14.0,
    unit: 'g/day',
    provenance: {
      kind: 'literature',
      citation:
        'Dietary nitrogen from the same reference intake: 56 g protein carries ~9 g nitrogen ' +
        '(protein is ~16% nitrogen by mass), which is the load the model presents at baseline.',
    },
  },
};

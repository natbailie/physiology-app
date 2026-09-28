import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is a rested adult on mixed substrates with full oxygen and intact cofactors. Every
 * band here is a published interval — the normalised flux indices the engine carries (turns,
 * NADH rate, ATP yield) are deliberately NOT asserted, because no textbook interval can apply
 * to a model index.
 */
export const KREBS_CYCLE_REFERENCE_RANGES: ReferenceRanges = {
  lactateMmolL: {
    low: 0.5,
    high: 2.0,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Resting venous lactate roughly 0.5-2.0 mmol/L in health, rising past 4 in lactic ' +
        'acidosis. The model sits under 1 at baseline and crosses 4 whenever the PDH gate, ' +
        'thiamine or oxygen chokes.',
    },
  },
  o2mLPerMin: {
    low: 200.0,
    high: 300.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Resting oxygen consumption near 250 mL/min in a healthy adult (roughly 3.5 mL/kg/min ' +
        'at 1 MET). The model scales its electron flux onto this value at baseline.',
    },
  },
  co2mLPerMin: {
    low: 150.0,
    high: 250.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Resting CO2 production near 200 mL/min, the product of VO2 and a mixed-diet RQ near ' +
        '0.8. The model reads its turns through the same product at baseline.',
    },
  },
  rqProxy: {
    low: 0.7,
    high: 0.95,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Respiratory quotient 1.0 for pure carbohydrate, 0.7 for pure fat, about 0.8 mixed ' +
        '(Guyton & Hall). The model derives the same ratio from its fuel shares and sits ' +
        'near 0.85 at baseline.',
    },
  },
};

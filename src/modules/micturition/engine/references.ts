import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A bladder early in its filling phase, which is where this module opens.
 *
 * The baseline here is a TRAJECTORY rather than a steady state — the bladder is filling, and that is
 * the point of the module — so these bands describe an early-filling bladder rather than a set point.
 */
export const MICTURITION_REFERENCE_RANGES: ReferenceRanges = {
  bladderVolumeML: {
    low: 0.0,
    high: 150.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation:
        'First sensation of filling at about 100-200 mL, first desire to void at 250-300 mL, ' +
        'strong desire at 400-500 mL and functional capacity around 500-600 mL. ICS urodynamic ' +
        'terminology.',
    },
  },
  intravesicalPressureCmH2O: {
    low: 0.0,
    high: 10.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation:
        'Detrusor pressure stays under about 10 cmH2O throughout normal filling, which is what ' +
        'receptive relaxation achieves; normal bladder compliance exceeds 30 mL/cmH2O.',
    },
  },
  netFlowRateMLperMin: {
    low: 0.5,
    high: 2.5,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation: 'Bladder fills at roughly 1 mL/min on a normal urine output of 1-1.5 L/day.',
    },
  },
};

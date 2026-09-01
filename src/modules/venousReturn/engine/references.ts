import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting adult circulation at its normal operating point.
 *
 * This module reproduces Guyton's numbers rather than approximating them, which is why the bands
 * here are unusually tight: mean systemic filling pressure falls out of a 700 mL stressed volume
 * over a 100 mL/mmHg compliance, and the two curves are checked to intersect where he says.
 */
export const VENOUS_RETURN_REFERENCE_RANGES: ReferenceRanges = {
  meanSystemicFillingPressureMmHg: {
    low: 6.0,
    high: 8.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Guyton (1955), mean systemic filling pressure about 7 mmHg — the pressure the ' +
        'circulation settles at with the heart stopped.',
    },
  },
  stressedVolumeMl: {
    low: 600.0,
    high: 800.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation:
        'About 700 mL of a 5 L circulation is stressed volume, the part actually stretching the ' +
        'vessels and generating filling pressure. The other 4.3 L merely fills them.',
    },
  },
  resistanceToVenousReturn: {
    low: 1.2,
    high: 1.6,
    unit: 'mmHg/L/min',
    provenance: {
      kind: 'literature',
      citation:
        'Guyton, resistance to venous return about 1.4 mmHg per L/min. It is dominated by the ' +
        'venous side because most of the pressure drop back to the atrium happens there.',
    },
  },
  cardiacOutputLPerMin: {
    low: 4.0,
    high: 6.0,
    unit: 'L/min',
    provenance: {
      kind: 'literature',
      citation:
        'Resting cardiac output about 5 L/min, and in this module it EMERGES from where the two ' +
        'curves cross rather than being set.',
    },
  },
  rightAtrialPressureMmHg: {
    low: -2.0,
    high: 4.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Right atrial pressure near 0 mmHg at rest, slightly subatmospheric on inspiration.',
    },
  },
  meanArterialPressureMmHg: {
    low: 85.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Mean arterial pressure about 93 mmHg, from a 120/80 cuff pressure.',
    },
  },
};

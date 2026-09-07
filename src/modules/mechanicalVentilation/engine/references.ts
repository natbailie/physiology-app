import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A 70 kg adult with normal lungs breathing spontaneously on 2 cmH2O of CPAP at room air — the
 * ventilator module's resting state. Everything below is the reading a ventilator's own monitor
 * would bring to the bed.
 */
export const MV_REFERENCE_RANGES: ReferenceRanges = {
  paO2: {
    low: 80.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Arterial PaO2 80-100 mmHg on room air in a healthy young adult.',
    },
  },
  paCO2: {
    low: 35.0,
    high: 45.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'Arterial PaCO2 35-45 mmHg — the level the central chemoreceptors defend.',
    },
  },
  saO2: {
    low: 95.0,
    high: 100.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation: 'Arterial oxygen saturation above 95% on room air.',
    },
  },
  pH: {
    low: 7.35,
    high: 7.45,
    unit: 'pH units',
    provenance: {
      kind: 'literature',
      citation: 'Arterial pH 7.35-7.45, the Henderson-Hasselbalch operating point.',
    },
  },
  tidalVolumeML: {
    low: 400.0,
    high: 600.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation: 'Resting tidal volume roughly 6-8 mL/kg ideal body weight — 400-600 mL in a 70 kg adult.',
    },
  },
  alveolarVentilationMLPerMin: {
    low: 3500.0,
    high: 6000.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation: 'Alveolar ventilation about 4-5 L/min, from a minute ventilation near 6-8 L/min less anatomical dead space.',
    },
  },
  drivingPressureCmH2O: {
    low: 0.0,
    high: 12.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation: 'A lung-protective strategy keeps driving pressure (plateau minus PEEP) at or below 15 cmH2O and commonly under 12; Amato et al. (2015) showed 15 is a threshold for survival.',
    },
  },
  meanAirwayPressureCmH2O: {
    low: 0.0,
    high: 12.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation: 'Mean airway pressure on light CPAP sits near zero a few cmH2O; invasive ventilation at standard settings typically runs 8-15.',
    },
  },
  totalPeepCmH2O: {
    low: 0.0,
    high: 8.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation: 'Physiological PEEP is close to zero and typical applied PEEP 5-8 cmH2O; higher values are a deliberate ARDS recruitment maneuver.',
    },
  },
  peakPressureCmH2O: {
    low: 0.0,
    high: 30.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation: 'Peak airway pressure on a normal ventilator breath rarely exceeds 25-30 cmH2O; above that injures lung or circuit.',
    },
  },
  supportPressureCmH2O: {
    low: 0.0,
    high: 25.0,
    unit: 'cmH2O',
    provenance: {
      kind: 'literature',
      citation: 'Pressure support is typically titrated 5-15 cmH2O and rarely set much above 20.',
    },
  },
};
import type { ReferenceRanges } from '@/shared/validation/referenceRange';

import { computeDerived, createInitialState } from './engine';
import { DEFAULT_RF_INPUTS } from './constants';
import { RF_PRESETS } from './presets';

/** The resting baseline this module's gases aim for. */
const baseline = computeDerived(createInitialState(), { ...DEFAULT_RF_INPUTS, ...RF_PRESETS.normal });

const ARTERIAL_O2_SOURCE =
  'Thresholds and ranges from the 2001 European Respiratory Society position statement on acute hypoxaemic respiratory failure.';
const ARTERIAL_CO2_SOURCE =
  'The 45 mmHg threshold for type II (hypercapnic) respiratory failure follows the NICE guideline on ventilator management.';

export const RESPIRATORY_FAILURE_REFERENCE_RANGES: ReferenceRanges = {
  paO2: {
    low: 80.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: { kind: 'literature', citation: ARTERIAL_O2_SOURCE },
  },
  paCO2: {
    low: 35.0,
    high: 45.0,
    unit: 'mmHg',
    provenance: { kind: 'literature', citation: ARTERIAL_CO2_SOURCE },
  },
  saO2: {
    low: 95.0,
    high: 100.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation: 'Target oxygen saturation on room air from the Royal College of Physicians oxygen guidelines, 2022.',
    },
  },
  pH: {
    low: 7.35,
    high: 7.45,
    unit: 'pH units',
    provenance: { kind: 'literature', citation: 'Arterial pH 7.35-7.45, the Henderson-Hasselbalch operating point.' },
  },
  plasmaHCO3: {
    low: 22.0,
    high: 26.0,
    unit: 'mEq/L',
    provenance: { kind: 'literature', citation: 'Bicarbonate 22-26 mEq/L in the healthy adult.' },
  },
  paO2FiO2Ratio: {
    low: 300.0,
    high: 500.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Berlin definition of ARDS: mild 200-300, moderate 100-200, severe below 100; a healthy lung on room air sits well above 300.',
    },
  },
  aaGradient: {
    low: 0.0,
    high: 15.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation: 'A normal young adult breathing room air has an A-a gradient of 15 mmHg at most.',
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
};

export { baseline as respiratoryFailureBaseline };
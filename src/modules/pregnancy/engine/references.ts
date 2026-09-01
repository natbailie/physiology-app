import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy singleton pregnancy in the third trimester, which is where the module's baseline sits.
 *
 * Almost every value here is abnormal by non-pregnant standards and normal by pregnant ones, which
 * is the entire point: a creatinine of 0.9 is reassuring in a non-pregnant adult and alarming at
 * 34 weeks.
 */
export const PREGNANCY_REFERENCE_RANGES: ReferenceRanges = {
  haemoglobinGPerDl: {
    low: 10.5,
    high: 12.5,
    unit: 'g/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Third-trimester haemoglobin 10.5-12.3 g/dL. The fall is DILUTIONAL: plasma volume rises ' +
        'about 45% against a red cell mass rise of about 25%.',
    },
  },
  paCO2MmHg: {
    low: 27.0,
    high: 34.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Progesterone-driven hyperventilation puts pregnant PaCO2 at 28-32 mmHg, a chronic ' +
        'respiratory alkalosis that is normal in pregnancy.',
    },
  },
  bicarbonateMmolL: {
    low: 18.0,
    high: 23.0,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Renal bicarbonate excretion compensates the respiratory alkalosis, giving a pregnant ' +
        'bicarbonate of 18-22 mmol/L.',
    },
  },
  phArterial: {
    low: 7.4,
    high: 7.47,
    unit: 'pH',
    provenance: {
      kind: 'literature',
      citation: 'Arterial pH in pregnancy 7.40-7.45, slightly alkalotic and incompletely compensated.',
    },
  },
  creatinineMgDl: {
    low: 0.3,
    high: 0.6,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation:
        'Pregnant serum creatinine falls to 0.4-0.5 mg/dL on a GFR raised about 50%. A creatinine ' +
        'of 0.9 in pregnancy is abnormal.',
    },
  },
  gfrIncreasePct: {
    low: 30.0,
    high: 55.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Glomerular filtration rate rises about 40-50% by the second trimester, one of the ' +
        'largest single organ adaptations in pregnancy.',
    },
  },
  cardiacOutputIncreasePct: {
    low: 25.0,
    high: 50.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Cardiac output rises 30-50% by the third trimester, from a rise in both stroke volume ' +
        'and rate against a fallen systemic vascular resistance.',
    },
  },
  fetalWeightG: {
    low: 1000.0,
    high: 2500.0,
    unit: 'g',
    provenance: {
      kind: 'literature',
      citation: 'Hadlock fetal growth: roughly 1400 g at 30 weeks and 2400 g at 35 weeks.',
    },
  },
};

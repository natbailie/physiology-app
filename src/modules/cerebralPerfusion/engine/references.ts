import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult brain inside an intact skull.
 *
 * The Monro-Kellie doctrine is what makes these interdependent: the vault is fixed, so a rising
 * mass is paid for out of the CSF and venous blood until they run out.
 */
export const CEREBRAL_REFERENCE_RANGES: ReferenceRanges = {
  intracranialPressureMmHg: {
    low: 5.0,
    high: 15.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Normal adult intracranial pressure 5-15 mmHg supine. Above 20-22 mmHg is the ' +
        'conventional treatment threshold in traumatic brain injury.',
    },
  },
  cerebralPerfusionPressureMmHg: {
    low: 60.0,
    high: 100.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Cerebral perfusion pressure, mean arterial pressure minus intracranial pressure. ' +
        'Guidelines target 60-70 mmHg after brain injury.',
    },
  },
  cerebralBloodFlow: {
    low: 45.0,
    high: 60.0,
    unit: 'mL/100g/min',
    provenance: {
      kind: 'literature',
      citation:
        'Global cerebral blood flow about 50 mL per 100 g per minute. Below 20 causes electrical ' +
        'failure and below 10 infarction, which is the ischaemic penumbra.',
    },
  },
  cerebralBloodVolumeMl: {
    low: 60.0,
    high: 110.0,
    unit: 'mL',
    provenance: {
      kind: 'literature',
      citation:
        'Cerebral blood volume about 75 mL, roughly 10% of the intracranial contents; the CSF is ' +
        'another 10% and brain tissue the remaining 80%.',
    },
  },
};

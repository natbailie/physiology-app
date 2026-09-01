import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A resting adult heart with unobstructed coronaries.
 *
 * The coronary bed is the one that has to be perfused while it is being squeezed, so the diastolic
 * time fraction matters as much as the driving pressure.
 */
export const CORONARY_REFERENCE_RANGES: ReferenceRanges = {
  ratePressureProduct: {
    low: 7000.0,
    high: 12000.0,
    unit: 'mmHg/min',
    provenance: {
      kind: 'literature',
      citation:
        'Rate-pressure product, heart rate times systolic pressure, is roughly 8000-10000 at rest ' +
        'and is the standard clinical proxy for myocardial oxygen demand.',
    },
  },
  diastolicTimeFraction: {
    low: 0.6,
    high: 0.85,
    unit: 'fraction',
    provenance: {
      kind: 'literature',
      citation:
        'Diastole occupies about two thirds of the cardiac cycle at 70 bpm and shortens ' +
        'disproportionately as rate rises, which is why tachycardia is ischaemic.',
    },
  },
  flowReserveRatio: {
    low: 3.0,
    high: 5.5,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Coronary flow reserve, the ratio of maximal hyperaemic to resting flow, is 3.5-5 in a ' +
        'normal artery. Below 2 marks a haemodynamically significant stenosis. Gould and Lipscomb ' +
        '(1974).',
    },
  },
  leftVentricularEndDiastolicPressureMmHg: {
    low: 4.0,
    high: 15.0,
    unit: 'mmHg',
    provenance: {
      kind: 'literature',
      citation:
        'Left ventricular end-diastolic pressure 4-12 mmHg normally. It is subtracted from aortic ' +
        'diastolic pressure to give the subendocardial driving pressure, which is why a failing ' +
        'ventricle is also an ischaemic one.',
    },
  },
};

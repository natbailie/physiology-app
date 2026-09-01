import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A term fetus in utero, before the first breath.
 *
 * The two saturations are the point of the module: a pre-ductal to post-ductal GRADIENT is normal in
 * the fetus and pathological after transition, which is what pulse oximetry screening looks for.
 */
export const FETAL_REFERENCE_RANGES: ReferenceRanges = {
  pulmonaryFlowFraction: {
    low: 0.03,
    high: 0.15,
    unit: 'fraction',
    provenance: {
      kind: 'literature',
      citation:
        'Only about 7-10% of fetal combined ventricular output reaches the lungs; the rest is ' +
        'shunted across the ductus arteriosus. Rudolph, fetal lamb flow distribution.',
    },
  },
  preDuctalSaturationPercent: {
    low: 60.0,
    high: 80.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Fetal pre-ductal (ascending aortic) oxygen saturation about 65%, supplied preferentially ' +
        'by the streamed ductus venosus flow crossing the foramen ovale.',
    },
  },
  postDuctalSaturationPercent: {
    low: 45.0,
    high: 65.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Fetal post-ductal (descending aortic) saturation about 55-60%, diluted by the ' +
        'desaturated right ventricular blood arriving through the duct.',
    },
  },
  saturationGradientPercent: {
    low: 5.0,
    high: 30.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'The pre-to-post-ductal gradient exists because of ductal shunting. After transition a ' +
        'gradient above 3% is abnormal and is what newborn pulse oximetry screening for critical ' +
        'congenital heart disease detects.',
    },
  },
  systemicVascularResistance: {
    low: 0.3,
    high: 0.8,
    unit: 'relative',
    provenance: {
      kind: 'literature',
      citation:
        'Fetal systemic resistance is LOW because the placenta is a large low-resistance bed in ' +
        'parallel with the body; pulmonary resistance is HIGH. Birth inverts both, which is the ' +
        'whole transition.',
    },
  },
};

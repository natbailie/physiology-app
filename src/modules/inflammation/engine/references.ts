import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Quiet tissue with no insult deposited.
 *
 * CRP is the anchor: it has a reference interval, a known half-life and a thousand-fold dynamic
 * range, which is why it is the acute-phase marker that is actually followed serially.
 */
export const INFLAMMATION_REFERENCE_RANGES: ReferenceRanges = {
  crpMgL: {
    low: 0.0,
    high: 10.0,
    unit: 'mg/L',
    provenance: {
      kind: 'literature',
      citation:
        'C-reactive protein below 10 mg/L in health, rising above 150 in severe bacterial ' +
        'infection. Its half-life is about 19 hours and it peaks near 48 hours, so it lags the ' +
        'insult and tracks resolution. Pepys.',
    },
  },
  neutrophilCount10e9PerL: {
    low: 2.0,
    high: 8.0,
    unit: 'x10^9/L',
    provenance: {
      kind: 'literature',
      citation:
        'Absolute neutrophil count 2.0-7.5 x10^9/L. Below 0.5 defines severe neutropenia and the ' +
        'febrile-neutropenia emergency.',
      note:
        'Ours settles at 7.78, just above the conventional upper limit — worth deciding whether ' +
        'the resting marginated pool is set slightly high.',
    },
  },
  coreTemperatureC: {
    low: 36.5,
    high: 37.5,
    unit: 'degC',
    provenance: {
      kind: 'literature',
      citation:
        'Normal core temperature; fever is a RAISED SET POINT driven by prostaglandin E2, which ' +
        'is why a febrile patient shivers on the way up.',
    },
  },
  tissueDamage: {
    low: 0.0,
    high: 0.1,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Tissue damage, pus burden and granuloma load are all 0-1 indices with no measurable ' +
        'counterpart, which is inherent to modelling histology. The published quantitative work ' +
        'here is on cytokine kinetics (Vodovotz and Clermont), so anchoring would mean modelling ' +
        'named cytokines in pg/mL rather than a single mediator level.',
    },
  },
};

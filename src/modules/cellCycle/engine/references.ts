import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A normally cycling somatic cell population early in G1.
 *
 * This module's baseline is a TRAJECTORY, not a steady state — the population is progressing through
 * the cycle, which is the whole subject — so these bands describe cycle STRUCTURE rather than a set
 * point.
 */
export const CELL_CYCLE_REFERENCE_RANGES: ReferenceRanges = {
  phaseDurationH: {
    low: 8.0,
    high: 14.0,
    unit: 'h',
    provenance: {
      kind: 'literature',
      citation:
        'A typical mammalian somatic cycle is about 24 hours: G1 roughly 11 hours, S 8, G2 4 and ' +
        'M under 1. G1 is both the longest phase and the only one with a genuine restriction ' +
        'point.',
    },
  },
  doublingTimeH: {
    low: 18.0,
    high: 36.0,
    unit: 'h',
    provenance: {
      kind: 'literature',
      citation: 'Population doubling time of about 24 hours for a normally cycling somatic cell line.',
    },
  },
  cyclingRatePct: {
    low: 90.0,
    high: 110.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Normalised to 100 for an unperturbed population. The growth fraction — the proportion ' +
        'actually in cycle rather than in G0 — is what chemotherapy that targets cycling cells ' +
        'depends on.',
    },
  },
  apoptoticFractionPct: {
    low: 0.0,
    high: 5.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Baseline apoptosis is a few percent in a healthy population. The p53-dependent rise ' +
        'after DNA damage is the checkpoint this module exists to teach.',
    },
  },
};

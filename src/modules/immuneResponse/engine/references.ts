import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy host before any challenge has been delivered.
 *
 * This module's baseline is a HOST WAITING FOR AN EVENT — nothing has been infected yet — so most
 * readings are legitimately zero and the bands below mostly assert that quiescence.
 */
export const IMMUNE_REFERENCE_RANGES: ReferenceRanges = {
  temperatureC: {
    low: 36.5,
    high: 37.5,
    unit: 'degC',
    provenance: {
      kind: 'literature',
      citation: 'Normal core temperature in an unchallenged host.',
    },
  },
  pathogenLoad: {
    low: 0.0,
    high: 0.05,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Pathogen burden is an index rather than CFU/mL or viral copies/mL, so the within-host ' +
        'dynamics cannot be checked against the target-cell-limited models (Nowak-May, Perelson) ' +
        'that are the published quantitative standard for this.',
    },
  },
  igmTitre: {
    low: 0.0,
    high: 0.05,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Antibody titres are measured as dilutions and the textbook facts about the secondary ' +
        'response are quantitative: the peak is roughly ten-fold higher and about three days ' +
        'earlier than the primary. As an index the ORDERING can be shown but neither magnitude ' +
        'can.',
    },
  },
  helperTActivity: {
    low: 0.0,
    high: 0.05,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'CD4 counts have hard clinical thresholds (below 200 cells/uL defines AIDS and sets ' +
        'prophylaxis decisions) and the module ships an HIV depletion preset that cannot express ' +
        'them.',
    },
  },
};

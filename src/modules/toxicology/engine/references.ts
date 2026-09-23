import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is exactly the UK treatment threshold: 75 mg/kg of paracetamol, four hours
 * post-ingestion, NAAC started on arrival. Nearly everything here is a published number —
 * this is one of the few modules where the anchor points are explicit clinical cut-offs.
 */
export const TOXICOLOGY_REFERENCE_RANGES: ReferenceRanges = {
  plasmaMgL: {
    low: 0,
    high: 100,
    unit: 'mg/L',
    provenance: {
      kind: 'literature',
      citation:
        'The Rumack-Matthew nomogram treatment line runs from 100 mg/L at 4 hours to 15 mg/L ' +
        'at 24 hours (log-linear); plasma above it at any point predicts hepatotoxicity without ' +
        'NAC, and below 100 at 4 hours is the "safe" zone this baseline sits in.',
    },
  },
  nomogramLineMgL: {
    low: 99,
    high: 101,
    unit: 'mg/L',
    provenance: {
      kind: 'literature',
      citation:
        'At exactly four hours the treatment line reads 100 mg/L by definition (Rumack & ' +
        'Matthew 1975). The baseline presents at four hours, so the line value has to land on ' +
        'that published anchor.',
    },
  },
  absorbedDoseMgPerKg: {
    low: 0,
    high: 75,
    unit: 'mg/kg',
    provenance: {
      kind: 'literature',
      citation:
        'The UK threshold for starting NAC is a single ingest of 75 mg/kg or more (current ' +
        'UK paracetamol guidelines). The baseline is exactly that value — the largest dose ' +
        'this module treats as "threshold rather than overdose".',
    },
  },
  hepatotoxicityRisk: {
    low: 0,
    high: 0.5,
    unit: 'index',
    provenance: {
      kind: 'unsourced',
      needs:
        'Risk is a composite index from nomogram position and NAC timing. It would take a ' +
        'published outcome study linking nomogram ratio and NAC delay to measured ALT / ' +
        'hepatotoxicity rates to anchor the curve to a real probability.',
    },
  },
  antidoteWindowHours: {
    low: 0,
    high: 8,
    unit: 'h',
    provenance: {
      kind: 'literature',
      citation:
        'NAC is protective when begun within 8 hours of ingestion; benefit is greatest ' +
        'within 8 hours and falls off sharply beyond 24 (prescott et al. 1979). The derived ' +
        'window is simply the remaining hours of that published window at presentation.',
    },
  },
  charcoalReductionPct: {
    low: 0,
    high: 50,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Activated charcoal given within the first hour or two sequesters up to roughly half ' +
        'the ingested load of an absorbable poison; later administration does little. The ' +
        'model lets charcoal take up to 50% and no more.',
    },
  },
};
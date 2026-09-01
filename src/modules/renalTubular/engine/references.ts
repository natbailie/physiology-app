import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult nephron on a normal diet and a normal water intake.
 *
 * Several of these are RATIOS rather than concentrations, and that is deliberate: fractional
 * excretion and the urine anion gap are diagnostic precisely because they are independent of how
 * concentrated the urine happens to be.
 */
export const RENAL_TUBULAR_REFERENCE_RANGES: ReferenceRanges = {
  serumBicarbonateMeqL: {
    low: 22.0,
    high: 26.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'literature',
      citation: 'Serum bicarbonate reference interval, 22-26 mEq/L.',
    },
  },
  urinePH: {
    low: 4.5,
    high: 8.0,
    unit: 'pH',
    provenance: {
      kind: 'literature',
      citation:
        'Urine pH spans 4.5-8.0. A pH above 5.5 in the face of a systemic acidosis is the ' +
        'defining finding of distal renal tubular acidosis.',
    },
  },
  netAcidExcretionMeqPerDay: {
    low: 50.0,
    high: 100.0,
    unit: 'mEq/day',
    provenance: {
      kind: 'literature',
      citation:
        'Net acid excretion 50-100 mEq/day on a normal Western diet, matching endogenous acid ' +
        'production.',
    },
  },
  urineAnionGapMeqL: {
    low: -50.0,
    high: -10.0,
    unit: 'mEq/L',
    provenance: {
      kind: 'literature',
      citation:
        'The urine anion gap is normally NEGATIVE because unmeasured ammonium is being excreted. ' +
        'A positive gap in a hyperchloraemic acidosis points at the kidney rather than the gut.',
    },
  },
  creatinineClearanceMLMin: {
    low: 90.0,
    high: 140.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Creatinine clearance 90-140 mL/min in a healthy young adult; it modestly overestimates ' +
        'GFR because of tubular secretion.',
    },
  },
  renalPlasmaFlowMLMin: {
    low: 500.0,
    high: 700.0,
    unit: 'mL/min',
    provenance: {
      kind: 'literature',
      citation:
        'Effective renal plasma flow about 600 mL/min, from a renal blood flow of roughly 1.1 ' +
        'L/min at a haematocrit of 45%.',
    },
  },
  filtrationFractionPct: {
    low: 15.0,
    high: 22.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation: 'Filtration fraction, GFR over renal plasma flow, is normally 0.15-0.22.',
    },
  },
  fractionalExcretionNaPct: {
    low: 0.0,
    high: 1.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation:
        'Fractional excretion of sodium below 1% on a normal diet; below 1% in acute kidney ' +
        'injury suggests a prerenal cause and above 2% acute tubular necrosis.',
    },
  },
  serumCreatinineMgDl: {
    low: 0.6,
    high: 1.2,
    unit: 'mg/dL',
    provenance: {
      kind: 'literature',
      citation: 'Serum creatinine reference interval, 0.6-1.2 mg/dL.',
    },
  },
  plasmaOsmolality: {
    low: 275.0,
    high: 295.0,
    unit: 'mOsm/kg',
    provenance: {
      kind: 'literature',
      citation: 'Plasma osmolality 275-295 mOsm/kg — the quantity ADH secretion is keyed to.',
    },
  },
  finalUrineOsmolality: {
    low: 230,
    high: 290,
    unit: 'mOsm/kg',
    provenance: {
      kind: 'unsourced',
      needs:
        'This band is where the model actually sits and it is far too narrow. A human kidney spans ' +
        '50 mOsm/kg when water-loaded to 1200 when maximally concentrating; ours spans only 237-281 ' +
        'across the entire reachable water-intake range and NEVER rises above plasma osmolality, so ' +
        'it cannot produce hypertonic urine at all. Free water clearance therefore never goes ' +
        'negative, which means water conservation — the thing the countercurrent multiplier exists ' +
        'to do — cannot be demonstrated. Exogenous ADH does not help either, so the limit is in the ' +
        'medullary gradient rather than in the ADH signal. Settling this needs the Layton and Layton ' +
        'countercurrent model or the Boron and Boulpaep segment-osmolality figure, and it is a ' +
        'modelling change rather than a band to widen. Baseline urine output is also about 8.8 L/day, ' +
        'which is the same defect seen from the volume side.',
    },
  },
  medullaryGradientStrength: {
    low: 0.5,
    high: 1.0,
    unit: 'fraction',
    provenance: {
      kind: 'unsourced',
      needs:
        'The corticomedullary gradient is expressed as a 0-1 fraction of a full gradient rather ' +
        'than in mOsm/kg. The papillary tip reaches about 1200 mOsm/kg against a cortical 300, ' +
        'and expressing it that way would let the countercurrent multiplier be checked against ' +
        'Layton and Layton or against the Boron and Boulpaep segment-osmolality figure.',
    },
  },
};

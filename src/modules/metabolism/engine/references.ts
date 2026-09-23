import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * Baseline is a healthy adult at rest, eight hours post-absorptive.
 *
 * Bands whose unit is a model index (glycogen remaining) are honestly unsourced — no textbook
 * interval exists for it — and say what would settle them. Quantities with a real reference
 * interval (glucose, energy, RQ, ketones, resting protein oxidation) cite one.
 */
export const METABOLISM_REFERENCE_RANGES: ReferenceRanges = {
  bgmmolPerL: {
    low: 4.0,
    high: 5.4,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Normal fasting plasma glucose for a healthy adult is roughly 4.0-5.4 mmol/L (Diabetes ' +
        'UK, WHO). The model sits mid-range post-absorptively with glycogen still defending it.',
    },
  },
  energyKcalPerDay: {
    low: 1600,
    high: 2600,
    unit: 'kcal/day',
    provenance: {
      kind: 'literature',
      citation:
        'Resting energy expenditure for a healthy adult at 1 MET is on the order of 1500-2500 ' +
        'kcal/day (Harris-Benedict/Mifflin-St Jeor estimates, which the model multiplies by ' +
        'activity and a catabolic stress factor).',
    },
  },
  ketonesMmolPerL: {
    low: 0.0,
    high: 0.6,
    unit: 'mmol/L',
    provenance: {
      kind: 'literature',
      citation:
        'Beta-hydroxybutyrate in a healthy post-absorptive adult is below about 0.6 mmol/L; it ' +
        'needs 24-48 hours of fasting to climb into frank ketosis (Cahill, Fuel Metabolism in ' +
        'Starvation).',
    },
  },
  respiratoryQuotient: {
    low: 0.78,
    high: 0.9,
    unit: 'ratio',
    provenance: {
      kind: 'literature',
      citation:
        'Resting RQ of a mixed-fed adult is about 0.82 (Guyton & Hall). Pure carbohydrate is 1.0, ' +
        'pure fat 0.7, protein 0.8, so the mix the model computes lands just above the textbook ' +
        '"mixed" value.',
    },
  },
  glycogenPct: {
    low: 55,
    high: 100,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'Glycogen remaining is a combined liver-plus-muscle index with no published single '
        + 'interval. It would take a reference time-course of liver and muscle glycogen depletion '
        + 'across a fast to anchor the stored percentage to a measured trajectory.',
    },
  },
  proteinOxidationGPerDay: {
    low: 40,
    high: 90,
    unit: 'g/day',
    provenance: {
      kind: 'literature',
      citation:
        'Resting protein oxidation tracks intake at nitrogen balance: the reference protein '
        + 'intake of 0.8 g/kg/day for a 70 kg adult is ~56 g/day, which the model shows leaking '
        + 'away as the fast deepens and gluconeogenesis takes over (UK/EU protein reference '
        + 'intakes).',
    },
  },
  fatOxidationPct: {
    low: 15,
    high: 50,
    unit: '%',
    provenance: {
      kind: 'unsourced',
      needs:
        'As for carbohydrate oxidation: a normalised model index. Indirect calorimetry across '
        + 'the fed-fasting continuum would anchor the fat share to measured oxidation; the '
        + 'literature RQ band above at least pins the carb-to-fat balance it must be consistent with.',
    },
  },
};
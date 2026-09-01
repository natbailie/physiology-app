import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult small intestine after a normal mixed meal.
 *
 * The bile salt pool is the anchor here: it is small, and it works only because it is recycled
 * several times per meal — which is why terminal ileal disease causes fat malabsorption.
 */
export const DIGESTION_REFERENCE_RANGES: ReferenceRanges = {
  bileSaltPoolG: {
    low: 2.5,
    high: 5.0,
    unit: 'g',
    provenance: {
      kind: 'literature',
      citation:
        'The bile acid pool is only 3-4 g and recirculates 6-8 times a day, so 20-30 g is ' +
        'delivered to the gut on a 0.5 g/day synthesis rate. Enterohepatic circulation.',
    },
  },
  enterohepaticLossGPerDay: {
    low: 0.2,
    high: 0.8,
    unit: 'g/day',
    provenance: {
      kind: 'literature',
      citation:
        'About 0.5 g of bile acid escapes ileal reabsorption each day and is lost in stool; ' +
        'hepatic synthesis matches it exactly at steady state.',
    },
  },
  faecalFatGPerDay: {
    low: 0.0,
    high: 7.0,
    unit: 'g/day',
    provenance: {
      kind: 'literature',
      citation:
        'Faecal fat below 7 g/day on a 100 g/day fat intake; above that is steatorrhoea by ' +
        'definition. The 72-hour faecal fat collection is the reference test.',
    },
  },
  stoolWaterMlPerDay: {
    low: 50.0,
    high: 200.0,
    unit: 'mL/day',
    provenance: {
      kind: 'literature',
      citation:
        'Normal stool water 100-200 mL/day, from roughly 9 L presented to the gut and 98% ' +
        'reabsorbed. Diarrhoea is defined above about 200 g/day.',
    },
  },
};

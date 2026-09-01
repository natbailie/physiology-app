import type { ReferenceRanges } from '@/shared/validation/referenceRange';

/**
 * The bands this module's baseline is asserted against, and where each one comes from.
 *
 * A healthy adult male with replete iron stores.
 *
 * The iron studies are the point of the panel: ferritin, transferrin saturation and TIBC move in
 * different directions in deficiency and in inflammation, which is what separates them.
 */
export const ERYTHRO_REFERENCE_RANGES: ReferenceRanges = {
  hemoglobinGDl: {
    low: 13.0,
    high: 17.0,
    unit: 'g/dL',
    provenance: {
      kind: 'literature',
      citation: 'WHO and standard adult male haemoglobin reference interval, 13-17 g/dL.',
    },
  },
  hematocritPercent: {
    low: 40.0,
    high: 52.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation: 'Adult male haematocrit reference interval, 40-52%.',
    },
  },
  mcv: {
    low: 80.0,
    high: 100.0,
    unit: 'fL',
    provenance: {
      kind: 'literature',
      citation: 
        'Mean corpuscular volume 80-100 fL. Below is microcytic and above macrocytic, which is' +
        'the first branch of any anaemia work-up.',
    },
  },
  ferritinNgMl: {
    low: 30.0,
    high: 300.0,
    unit: 'ng/mL',
    provenance: {
      kind: 'literature',
      citation: 
        'Serum ferritin 30-300 ng/mL. Below 30 is the conventional threshold for iron deficiency' +
        'and below 12 is diagnostic.',
    },
  },
  serumIronUgDl: {
    low: 60.0,
    high: 170.0,
    unit: 'ug/dL',
    provenance: {
      kind: 'literature',
      citation: 'Serum iron reference interval, 60-170 ug/dL.',
    },
  },
  tibcUgDl: {
    low: 250.0,
    high: 400.0,
    unit: 'ug/dL',
    provenance: {
      kind: 'literature',
      citation: 
        'Total iron-binding capacity 250-400 ug/dL. It RISES in iron deficiency and FALLS in' +
        'anaemia of chronic disease, which is how the two are told apart.',
    },
  },
  transferrinSaturationPct: {
    low: 20.0,
    high: 50.0,
    unit: '%',
    provenance: {
      kind: 'literature',
      citation: 
        'Transferrin saturation 20-50%. Below 20% supports iron deficiency; above 45% raises' +
        'haemochromatosis.',
    },
  },
  reticulocyteIndex: {
    low: 0.5,
    high: 1.5,
    unit: 'index',
    provenance: {
      kind: 'literature',
      citation: 
        'Reticulocyte production index around 1 in a non-anaemic adult. Above 2 marks an adequate' +
        'marrow response to anaemia and below 2 an inadequate one.',
    },
  },
};

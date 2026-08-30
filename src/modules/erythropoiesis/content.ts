import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { ErythroPresetName } from './engine/presets';

export const erythropoiesisContent: ExplainerContent<ErythroPresetName> = {
  title: 'The reticulocyte count, not the haemoglobin, tells you why',
  sections: [
    {
      heading: 'A slow feedback loop with its sensor in the kidney',
      paragraphs: [
        'Erythropoiesis is a slow negative-feedback loop with an unusual sensor. Peritubular cells in the kidney detect tissue oxygen and release erythropoietin, which drives the marrow to make red cells, which carry oxygen, which switches the signal back off. Because the sensor and the hormone are both renal, chronic kidney disease causes anemia through hormone deficiency while the marrow itself remains perfectly capable — which is exactly why recombinant EPO treats it and iron alone does not.',
      ],
      demos: [
        { preset: 'normal', watch: 'EPO' },
      ],
    },
    {
      heading: 'The two common deficiencies push cell size opposite ways',
      paragraphs: [
        'The MCV splits the differential first, and the two common deficiencies push cell size in opposite directions for a reason worth holding onto. Without iron, haemoglobin accumulates too slowly, so the precursor keeps dividing while it waits to reach its haemoglobin threshold and ends up small — microcytic. Without B12 or folate, DNA synthesis stalls while the cytoplasm matures on schedule, so the cell cannot divide on time and is released oversized — macrocytic. Same organ, same hormone, opposite morphology.',
      ],
      demos: [
        { preset: 'ironDeficiency', watch: 'MCV' },
        { preset: 'b12FolateDeficiency', watch: 'MCV' },
      ],
    },
    {
      heading: 'The reticulocyte index answers what the haemoglobin cannot',
      paragraphs: [
        'The reticulocyte index then answers the question the haemoglobin cannot: is the marrow actually responding? Below about 2 it is not — a hypoproliferative anemia, where the marrow lacks the signal (renal failure), the raw materials (iron, B12) or the capacity (aplasia). Above it, the marrow is working hard and the problem lies downstream in destruction or loss. Two patients can sit at an identical haemoglobin with completely different diagnoses, and it is this index that separates them.',
      ],
      demos: [
        { preset: 'hemolyticAnemia', watch: 'reticulocyte index' },
        { preset: 'chronicBloodLoss', watch: 'reticulocyte index' },
      ],
    },
    {
      heading: 'What the body defends is delivery, not haemoglobin',
      paragraphs: [
        'What the body is actually defending is oxygen delivery, not haemoglobin. Delivery is haemoglobin times its carrying capacity times saturation times cardiac output, and because cardiac output is one of the terms, a falling haemoglobin can be compensated simply by pumping the remaining red cells around faster. That is why chronic anaemia is tolerated to concentrations that sound alarming, and why the same haemoglobin is dangerous in someone who cannot raise their output. Watch the delivery readout rather than the haemoglobin and the compensation becomes visible.',
      ],
      demos: [
        { preset: 'highAltitude', watch: 'oxygen delivery' },
      ],
    },
    {
      heading: 'A reticulocyte count taken too early lies to you',
      paragraphs: [
        'A reticulocyte count taken too early lies to you. After an acute bleed the haemoglobin falls immediately, but the marrow needs days to expand and release new reticulocytes — so a count in the first day or two looks hypoproliferative in a patient whose marrow is entirely healthy and already responding. Trigger the acute bleed here and watch the order of events: the haemoglobin drops, EPO climbs, and only afterwards does the reticulocyte index rise. Timing is part of interpreting the number.',
      ],
    },
    {
      heading: 'Compare the presets on EPO as well as on reticulocytes',
      paragraphs: [
        'Compare the presets on EPO as well as on retics and you get the full logic. In aplastic anemia EPO is maximal and the retic index is near zero — the signal is deafening and there is nothing left to answer it. In anemia of CKD the retic index is equally low but the EPO is inappropriately low too, because the failing organ is the one that makes it. In haemolysis the retic index climbs above 2: the marrow is doing everything right and the cells are being destroyed faster than it can replace them. And altitude shows the loop working exactly as designed on a person who is not ill at all — low inspired oxygen is sensed as hypoxia at a perfectly normal haemoglobin, and the red cell mass rises until delivery is restored.',
      ],
      demos: [
        { preset: 'aplasticAnemia', watch: 'EPO' },
        { preset: 'anemiaOfCkd', watch: 'EPO' },
        { preset: 'erythropoieticDriveHigh', watch: 'reticulocyte index' },
      ],
    },
    {
      heading: 'Hepcidin controls every door iron uses',
      paragraphs: [
        'Beneath all of it runs a second hormone with its own logic. Hepcidin, made by the liver, destroys ferroportin — the only exporter iron has — so it simultaneously throttles gut absorption and macrophage release: one hormone controlling every door iron uses. Full stores raise it; inflammation raises it several-fold harder, which is why chronic disease starves a replete marrow while ferritin climbs as an acute-phase reactant and transferrin falls as a negative one. A marrow driving beyond its supply suppresses hepcidin (erythroferrone), and HFE disease breaks the sensor entirely — both routes to overload without a single transfusion. Once you see hepcidin as the hub, the four iron-study patterns stop being a table to memorise: iron deficiency is low hepcidin with nothing to carry, anaemia of chronic disease is high hepcidin with nowhere to deliver, and haemochromatosis is a brake that no longer reads the hill it is on.',
      ],
      demos: [
        { preset: 'anaemiaChronicDisease', watch: 'hepcidin' },
        { preset: 'ironDeficientAndInflamed', watch: 'hepcidin' },
        { preset: 'haemochromatosis', watch: 'iron stores' },
      ],
    },
  ],
};

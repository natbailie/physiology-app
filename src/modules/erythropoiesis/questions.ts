import type { PatternQuestion } from '@/shared/assessment/types';
import type { ErythroDerived, ErythroState } from './engine/types';
import type { ErythroPresetName } from './engine/presets';

type Snapshot = { state: ErythroState; derived: ErythroDerived };
export type ErythroQuestion = PatternQuestion<ErythroPresetName, Snapshot>;

/** Size and reticulocyte response split most anaemias; the iron studies rows split the rest —
 * which is exactly how the workup runs at the bedside. */
const PANEL = [
  { label: 'Haemoglobin', unit: 'g/dL', value: (s: Snapshot) => s.derived.hemoglobinGDl, decimals: 1 },
  { label: 'MCV', unit: 'fL', value: (s: Snapshot) => s.derived.mcv, decimals: 0 },
  { label: 'Retic index', value: (s: Snapshot) => s.derived.reticulocyteIndex, decimals: 2 },
  { label: 'Ferritin', unit: 'ng/mL', value: (s: Snapshot) => s.derived.ferritinNgMl, decimals: 0 },
  {
    label: 'Transferrin sat',
    unit: '%',
    value: (s: Snapshot) => s.derived.transferrinSaturationPct,
    decimals: 0,
    tolerance: 0.09,
  },
  { label: 'TIBC', unit: 'µg/dL', value: (s: Snapshot) => s.derived.tibcUgDl, decimals: 0, tolerance: 0.08 },
  {
    label: 'Hepcidin',
    unit: '%',
    value: (s: Snapshot) => s.derived.hepcidinFraction * 100,
    decimals: 0,
    tolerance: 0.15,
  },
  { label: 'EPO', value: (s: Snapshot) => s.derived.epoLevel, decimals: 2 },
] as const;

export const ERYTHROPOIESIS_QUESTIONS: readonly ErythroQuestion[] = [
  {
    id: 'microcytic-low-ferritin',
    stem: 'A menstruating woman is tired and short of breath on the stairs. Her red cells are small and her marrow is not replacing them quickly.',
    answer: 'ironDeficiency',
    options: ['ironDeficiency', 'b12FolateDeficiency', 'anemiaOfCkd', 'hemolyticAnemia'],
    panel: PANEL,
    explanation:
      'Small cells plus an empty iron store is iron deficiency. The size is the clue to the mechanism: haemoglobin is what fills a red cell, so a precursor short of iron keeps dividing while its cytoplasm stays thin, and the cell that emerges is small. The low reticulocyte index confirms the marrow cannot respond however hard it is being asked to — the raw material simply is not there. In an adult the diagnosis is not the endpoint; the question is always where the iron went.',
  },
  {
    id: 'macrocytic',
    stem: 'An older patient with a restricted diet has become anaemic. Their red cells are unusually large and the marrow is not keeping up.',
    answer: 'b12FolateDeficiency',
    options: ['b12FolateDeficiency', 'ironDeficiency', 'hemolyticAnemia', 'aplasticAnemia'],
    panel: PANEL,
    explanation:
      'Large cells point to a problem with the nucleus rather than the cytoplasm. B12 and folate are needed for DNA synthesis, so the nucleus divides slowly while haemoglobin production carries on at its normal pace — the cell spends longer growing between divisions and is released oversized. It is the mirror image of iron deficiency, where the cytoplasm is the limiting side, and the MCV alone tells you which half of the cell is in trouble.',
  },
  {
    id: 'high-retic',
    stem: 'A patient is anaemic and jaundiced. Their marrow is working extremely hard — the reticulocyte response is well above normal — yet the haemoglobin stays low.',
    answer: 'hemolyticAnemia',
    options: ['hemolyticAnemia', 'aplasticAnemia', 'anemiaOfCkd', 'ironDeficiency'],
    panel: PANEL,
    explanation:
      'A high reticulocyte index separates a marrow that CANNOT respond from one that is responding hard and still losing ground. Here production is up and the haemoglobin is still falling, so cells are being destroyed faster than they can be replaced. That single index is the most useful discriminator in the whole workup: hypoproliferative anaemias sit below it, haemolysis and acute blood loss above it, and the EPO drive is high in both because the tissue hypoxia is real.',
  },
  {
    id: 'ckd-low-epo',
    stem: 'A patient with long-standing kidney disease is anaemic. Their red cells are normal in size, their iron stores are adequate, and their marrow is structurally intact.',
    answer: 'anemiaOfCkd',
    options: ['anemiaOfCkd', 'aplasticAnemia', 'ironDeficiency', 'hemolyticAnemia'],
    panel: PANEL,
    explanation:
      'Normal cell size with adequate iron and a poor reticulocyte response points away from a raw-material problem and towards the signal. The kidney is the oxygen sensor and the source of erythropoietin, so in renal failure the marrow is never told to work — this is a hormone deficiency, not a marrow disease. That distinction is what makes it treatable with an erythropoiesis-stimulating agent, whereas an aplastic marrow would not respond however loudly it were asked.',
  },
  {
    id: 'the-ferritin-trap',
    stem: 'Two patients both have small red cells and a saturation under ten. One has a ferritin of 3; the other, recovering from pneumonia, has a ferritin of 90.',
    answer: 'ironDeficientAndInflamed',
    options: ['ironDeficientAndInflamed', 'ironDeficiency', 'anaemiaChronicDisease', 'normal'],
    panel: PANEL,
    settleSeconds: 90000,
    explanation:
      'Same empty stores, wildly different readouts — because ferritin is an acute-phase reactant as well as a storage protein. Interleukin-6 multiplies hepatic ferritin output on top of whatever is actually stored, so the inflamed patient produces a deceptively reassuring number while just as deficient. A ferritin below about 100 in an inflamed patient should be read as consistent with iron deficiency until proven otherwise; the saturation and hepcidin rows here tell the truth the ferritin is hiding.',
  },
  {
    id: 'locked-away-not-lost',
    stem: 'A patient with active rheumatoid disease has become anaemic. Her saturation is low and her marrow is quiet — but her ferritin is high and her MCV is normal.',
    answer: 'anaemiaChronicDisease',
    options: ['anaemiaChronicDisease', 'ironDeficiency', 'anemiaOfCkd', 'normal'],
    panel: PANEL,
    settleSeconds: 90000,
    explanation:
      'Interleukin-6 drives hepcidin up several-fold, and hepcidin destroys ferroportin — the only exit door for iron from enterocytes and macrophages. So iron is neither absorbed nor released: the marrow starves while the stores sit untouched, ferritin climbs as an acute-phase reactant, and transferrin falls as a negative one. Contrast the iron-deficiency row: there the TIBC is HIGH and the stores are GONE. Treating means silencing the inflammation or out-shouting hepcidin with intravenous iron.',
  },
  {
    id: 'saturated-and-overloading',
    stem: 'A man has a transferrin saturation above forty-five with no history of transfusion. His ferritin is climbing year on year.',
    answer: 'haemochromatosis',
    options: ['haemochromatosis', 'erythropoieticDriveHigh', 'anaemiaChronicDisease', 'ironDeficiency'],
    panel: PANEL,
    settleSeconds: 90000,
    explanation:
      'Hepcidin is the brake on iron entry, and HFE mutations break the sensor that applies it. Stores pile up, yet hepcidin stays low BECAUSE the sensing is what failed — the hormone answers a signal the body can no longer read. The erythropoietic-drive preset reaches a similar place by a different road (erythroferrone suppressing hepcidin from a marauding marrow), but its drive row and anaemic picture separate the two. Venesection works because it re-creates the demand the sensor can no longer manufacture.',
  },
];

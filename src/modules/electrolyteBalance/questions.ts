import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { ElectrolyteDerived, ElectrolyteInputs, ElectrolyteState } from './engine/types';
import type { ElectrolytePresetName } from './engine/presets';

type Snapshot = { state: ElectrolyteState; derived: ElectrolyteDerived };
export type ElectrolyteQuestion = ModuleQuestion<ElectrolyteInputs, ElectrolytePresetName, Snapshot>;

/**
 * The hyponatraemia workup, in the order it is actually done.
 *
 * The serum sodium is on the panel and is deliberately near-useless: all three causes below
 * produce almost the same number, which is exactly the clinical problem. Volume status and
 * urine osmolality are what separate them, and that is the whole algorithm.
 */
const SODIUM_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Serum Na+', unit: 'mEq/L', value: (s) => s.derived.serumSodiumMeqL, decimals: 1, tolerance: 0.004 },
  { label: 'Serum K+', unit: 'mEq/L', value: (s) => s.derived.serumPotassiumMeqL, decimals: 2 },
  { label: 'ECF volume', unit: 'L', value: (s) => s.derived.ecfVolumeL, decimals: 1 },
  { label: 'Urine osmolality', unit: 'mOsm/kg', value: (s) => s.derived.urineOsmolality, decimals: 0 },
];

/**
 * Sodium moves over DAYS, and this engine works in real seconds — so a settle short enough to
 * feel quick leaves every preset sitting at 140 and the panel meaningless. Roughly eleven hours
 * of simulated time is the point at which the three causes have genuinely separated.
 */
const SETTLE = 40_000;

export const ELECTROLYTE_QUESTIONS: readonly ElectrolyteQuestion[] = [
  {
    id: 'dka-insulin-potassium',
    stem: 'A patient in diabetic ketoacidosis has a serum potassium at the upper end of normal. Insulin is absent, they are acidaemic, and an osmotic diuresis has been running for days.',
    setup: { preset: 'dka' },
    intervention: { label: 'You start an insulin infusion.', inputs: { insulinLevel: 3 } },
    prompt: 'What happens to the serum potassium?',
    watch: 'serum potassium',
    correctDirection: 'falls',
    explanation:
      'Insulin drives potassium into cells through the Na+/K+-ATPase without removing a single milliequivalent from the body. The pre-treatment number was never measuring the deficit: acidaemia and insulin deficiency had shifted potassium out of cells while the osmotic diuresis stripped total body stores. Treat the DKA and the serum level collapses toward the true deficit underneath. This is why potassium is replaced alongside insulin rather than after it.',
    metric: (s) => s.derived.serumPotassiumMeqL,
  },
  {
    id: 'vomiting-potassium',
    stem: 'A patient has been vomiting repeatedly for three days. Gastric fluid is rich in acid and chloride, but contains relatively little potassium.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'Protracted vomiting begins.',
      inputs: { extrarenalLoss: 'vomiting', arterialPH: 7.52, sodiumIntake: 40, potassiumIntake: 20 },
    },
    prompt: 'What happens to the serum potassium?',
    watch: 'serum potassium',
    correctDirection: 'falls',
    explanation:
      'It falls, but barely any of it leaves in the vomit. The losses are renal: the volume depletion raises aldosterone, and the metabolic alkalosis both drives potassium into cells and increases distal secretion, so the kidney wastes potassium into the urine while the patient is losing it from above. This is why the treatment is saline and chloride repletion rather than potassium alone — correct the volume and the alkalosis, and the kidney stops throwing potassium away.',
    metric: (s) => s.derived.serumPotassiumMeqL,
  },
  {
    id: 'hyperglycaemia-measured-sodium',
    stem: 'A patient arrives with a glucose of 550 mg/dL. Their kidneys are working, they have been drinking, and nothing has been done to their salt or water balance: not a milliequivalent of sodium has been lost, and total body water has not moved.',
    setup: { preset: 'normal' },
    intervention: { label: 'Serum glucose climbs from 90 to 550 mg/dL.', inputs: { serumGlucoseMgDl: 550 } },
    prompt: 'What happens to the measured serum sodium?',
    watch: 'serum sodium',
    correctDirection: 'falls',
    // Sodium is defended within a few mEq/L, so the 5% default would be a catastrophe rather
    // than a teaching point; 1% is roughly 1.4 mEq/L and is the right scale for this quantity.
    tolerance: 0.01,
    explanation:
      'It falls, by roughly 8 mEq/L, and no sodium has gone anywhere. Without insulin glucose cannot enter cells, so it sits in the ECF as an effective osmole and holds water there. Water leaves the cells until both sides are iso-osmolar again — watch the ICF shrink and the ECF expand by the same volume while total body water does not move at all. The sodium is diluted by water that was previously intracellular. This is translocational hyponatraemia, and giving saline for it would be treating a number rather than a patient: the treatment is insulin.',
    metric: (s) => s.derived.serumSodiumMeqL,
  },
  {
    id: 'hyperglycaemia-corrected-sodium',
    stem: 'The same patient, the same glucose of 550 mg/dL. The laboratory reports a serum sodium around 132 and the house officer is reaching for hypertonic saline.',
    setup: { preset: 'normal' },
    intervention: { label: 'Serum glucose climbs from 90 to 550 mg/dL.', inputs: { serumGlucoseMgDl: 550 } },
    prompt: 'What happens to the corrected sodium — the sodium adjusted for the glucose?',
    watch: 'corrected sodium',
    correctDirection: 'unchanged',
    // Wider than the sodium question above on purpose: the bedside rule adds a flat 1.6 mEq/L
    // per 100 mg/dL where the true displacement is nearer 1.8-2.0, so it undershoots by about
    // a milliequivalent here. Anything inside 2% is inside the rule's own error.
    tolerance: 0.02,
    explanation:
      'It barely moves — which is the whole point of calculating it. The measured sodium fell because water moved, not because sodium was lost, so adding back the ~1.6 mEq/L per 100 mg/dL of glucose above normal recovers the sodium the patient would have had all along. A corrected sodium near 140 says this is not a sodium disorder and needs no sodium treatment; correct the glucose and the water goes back into the cells on its own. Had the corrected value come back low, there would be a genuine hypotonic hyponatraemia hiding underneath the hyperglycaemia — a different patient with a different treatment. Read the two readouts together; either one alone will mislead you.',
    metric: (s) => s.derived.correctedSodiumMeqL,
  },
  {
    id: 'siadh-sodium',
    stem: 'A patient with a small-cell lung cancer secretes ADH autonomously. They are drinking normally, their kidneys work, and they look clinically euvolaemic.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'ADH becomes fixed high regardless of osmolality.',
      inputs: { adhMode: 'inappropriate', waterIntake: 2.5 },
    },
    prompt: 'What happens to the serum sodium?',
    watch: 'serum sodium',
    correctDirection: 'falls',
    // Sodium is defended within a few mEq/L, so a 5% swing would be a catastrophe rather than a
    // teaching point; 1% is roughly 1.4 mEq/L and is the right scale for this quantity.
    observeSeconds: 80_000,
    tolerance: 0.01,
    explanation:
      'ADH that ignores osmolality keeps the collecting duct permeable to water no matter how dilute the plasma becomes, so ingested water is retained and the sodium it dilutes falls. Note the two findings that define the syndrome and both appear here: the urine stays inappropriately concentrated while the plasma is hypotonic, and free water clearance goes negative. The patient stays euvolaemic throughout, which is what separates this from hypovolaemic hyponatraemia — same low sodium, opposite treatment.',
    metric: (s) => s.derived.serumSodiumMeqL,
  },

  // --- Working up a hyponatraemia: the sodium is the finding, not the diagnosis ---

  {
    id: 'pattern-siadh',
    stem: 'A patient with a recently diagnosed small cell lung cancer is confused. Their sodium is low. They look neither dehydrated nor oedematous, and they are on no diuretic.',
    answer: 'siadh',
    options: ['siadh', 'hypovolemicHyponatremia', 'polydipsia', 'normal'],
    panel: SODIUM_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A concentrated urine in a patient who is hyponatraemic and NOT volume-deplete. That combination is the definition of inappropriate ADH: the only physiological reason to hold on to water is to defend volume or tonicity, and neither applies here — the tonicity is already low and the volume is normal. So the ADH is coming from somewhere the feedback loop cannot switch off, which in the stem is the tumour. Note the serum sodium alone would not have told you any of this; all three options here have essentially the same value.',
  },
  {
    id: 'pattern-hypovolemic-hyponatraemia',
    stem: 'An elderly patient has had several days of vomiting and diarrhoea. They are hypotensive, tachycardic and dry, and their sodium is low.',
    answer: 'hypovolemicHyponatremia',
    options: ['hypovolemicHyponatremia', 'siadh', 'polydipsia', 'normal'],
    panel: SODIUM_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The contracted ECF volume is what separates this from SIADH, and the raised potassium is the corroborating clue — a volume-deplete patient has an activated renin-angiotensin-aldosterone axis, and that is what has retained the sodium and shifted the potassium. The ADH here is entirely appropriate: faced with a choice between defending volume and defending tonicity, the body defends volume every time and accepts the low sodium as the price. That is also why the treatment is saline, where in SIADH saline makes matters worse.',
  },
  {
    id: 'pattern-polydipsia',
    stem: 'A patient with schizophrenia is found confused and fitting. They are known to drink very large volumes of water. Their sodium is low.',
    answer: 'polydipsia',
    options: ['polydipsia', 'siadh', 'hypovolemicHyponatremia', 'normal'],
    panel: SODIUM_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A maximally DILUTE urine, which is the opposite of every other cause here. The kidney is working perfectly — ADH is appropriately switched off and it is excreting water as fast as it can — and the patient is simply drinking faster than that. This is the one hyponatraemia where the kidney is not part of the problem, and it is why the treatment is to stop the intake rather than to do anything to the patient. The urine osmolality is the single row that makes the call, and it is why it is sent on every hyponatraemia.',
  },
];

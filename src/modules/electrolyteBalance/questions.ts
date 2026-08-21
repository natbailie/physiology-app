import type { PredictQuestion } from '@/shared/assessment/types';
import type { ElectrolyteDerived, ElectrolyteInputs, ElectrolyteState } from './engine/types';
import type { ElectrolytePresetName } from './engine/presets';

type Snapshot = { state: ElectrolyteState; derived: ElectrolyteDerived };
export type ElectrolyteQuestion = PredictQuestion<ElectrolyteInputs, ElectrolytePresetName, Snapshot>;

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
    prompt: 'What happens to the MEASURED serum sodium?',
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
    prompt: 'What happens to the CORRECTED sodium — the sodium adjusted for the glucose?',
    watch: 'corrected sodium',
    correctDirection: 'unchanged',
    // Wider than the sodium question above on purpose: the bedside rule adds a flat 1.6 mEq/L
    // per 100 mg/dL where the true displacement is nearer 1.8-2.0, so it undershoots by about
    // a milliequivalent here. Anything inside 2% is inside the rule's own error.
    tolerance: 0.02,
    explanation:
      'It barely moves — which is the whole point of calculating it. The measured sodium fell because water moved, not because sodium was lost, so adding back the ~1.6 mEq/L per 100 mg/dL of glucose above normal recovers the sodium the patient would have had all along. A corrected sodium near 140 says this is not a sodium disorder and needs no sodium treatment; correct the glucose and the water goes back into the cells on its own. Had the corrected value come back LOW, there would be a genuine hypotonic hyponatraemia hiding underneath the hyperglycaemia — a different patient with a different treatment. Read the two readouts together; either one alone will mislead you.',
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
];

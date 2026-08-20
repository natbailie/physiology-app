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

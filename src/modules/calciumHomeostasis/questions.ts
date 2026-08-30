import type { PredictQuestion } from '@/shared/assessment/types';
import type { CalciumDerived, CalciumInputs, CalciumState } from './engine/types';
import type { CalciumPresetName } from './engine/presets';

type Snapshot = { state: CalciumState; derived: CalciumDerived };
export type CalciumQuestion = PredictQuestion<CalciumInputs, CalciumPresetName, Snapshot>;

export const CALCIUM_QUESTIONS: readonly CalciumQuestion[] = [
  {
    id: 'autonomous-pth-phosphate',
    stem: 'A parathyroid adenoma begins secreting PTH autonomously, ignoring the calcium level entirely. The kidneys and gut are normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Autonomous PTH secretion begins.', inputs: { autonomousPTHSecretion: 55 } },
    prompt: 'What happens to serum phosphate?',
    watch: 'serum phosphate',
    correctDirection: 'falls',
    settleSeconds: 1800,
    observeSeconds: 2400,
    explanation:
      'Phosphate falls while calcium rises, and that divergence is the fastest way to read these labs. Bone resorption releases both ions together and calcitriol raises gut absorption of both — but PTH separately blocks proximal-tubule phosphate reabsorption, dumping phosphate into the urine. Being phosphaturic is what lets PTH raise one ion while lowering the other. High calcium with low phosphate is primary hyperparathyroidism; hypoparathyroidism is the exact mirror image.',
    metric: (s) => s.derived.serumPhosphateMgDl,
  },
  {
    id: 'ckd-phosphate',
    stem: 'A patient reaches advanced chronic kidney disease. Their parathyroid glands are intact and their diet has not changed.',
    setup: { preset: 'normal' },
    intervention: { label: 'Renal function falls to 15%.', inputs: { renalFunction: 0.15 } },
    prompt: 'What happens to serum phosphate?',
    watch: 'serum phosphate',
    correctDirection: 'rises',
    settleSeconds: 1800,
    observeSeconds: 3000,
    explanation:
      'Phosphate rises, which is the opposite of what PTH excess does, and comparing the two is the whole point. A failing kidney cannot excrete the daily phosphate load, and it simultaneously cannot perform the final hydroxylation that activates vitamin D — so calcitriol falls, calcium falls, and PTH climbs in response. Watch the calcium-phosphate product: past roughly 55 it begins precipitating into soft tissue, which is why phosphate control rather than calcium supplementation is central to managing CKD-MBD.',
    metric: (s) => s.derived.serumPhosphateMgDl,
  },
  {
    id: 'hypomagnesaemia-pth',
    stem: 'A patient with chronic alcohol use and poor intake becomes profoundly hypomagnesaemic. Their parathyroid glands are structurally normal, and their calcium is low.',
    setup: { preset: 'normal' },
    intervention: { label: 'Serum magnesium falls severely.', inputs: { serumMagnesium: 0.35 } },
    prompt: 'What happens to PTH?',
    watch: 'PTH',
    correctDirection: 'falls',
    settleSeconds: 1800,
    observeSeconds: 2400,
    explanation:
      'PTH falls, which is the wrong direction for a low calcium and is exactly what makes this presentation so confusing. Magnesium is permissive both for PTH secretion and for PTH action at bone and kidney, so severe depletion produces hypocalcaemia with an inappropriately low PTH — the only hypocalcaemia that does. It also explains why the calcium stays stubbornly refractory to replacement: until the magnesium is corrected, neither the gland nor its target tissue can respond.',
    metric: (s) => s.derived.pthLevel,
  },

  {
    id: 'vitamin-d-deficiency-pth',
    stem: 'A patient has had very little sun exposure and a poor diet for a long time. Their kidneys and parathyroid glands are entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Vitamin D intake collapses.', inputs: { vitaminDIntake: 5 } },
    prompt: 'What happens to PTH?',
    watch: 'PTH',
    correctDirection: 'rises',
    observeSeconds: 1200,
    explanation:
      'PTH rises, because without calcitriol the gut cannot absorb calcium and the parathyroid responds to the falling serum level exactly as it should. This is secondary hyperparathyroidism — a normal gland reacting normally to an abnormal stimulus — and it is why the calcium can look almost normal while the PTH is grossly raised. Distinguishing it from a primary adenoma matters because the treatment is vitamin D rather than surgery, and the discriminator is the calcium: high in the primary form, low or low-normal here.',
    metric: (s) => s.derived.pthLevel,
  },
  {
    id: 'hypoparathyroidism-phosphate',
    stem: 'A patient has their parathyroid glands damaged during thyroid surgery. Their kidneys are normal and their diet has not changed.',
    setup: { preset: 'normal' },
    intervention: { label: 'Parathyroid function collapses.', inputs: { parathyroidGlandFunction: 0.05 } },
    prompt: 'What happens to serum phosphate?',
    watch: 'serum phosphate',
    correctDirection: 'rises',
    observeSeconds: 1200,
    explanation:
      'Phosphate rises while calcium falls, and the opposite directions are the whole diagnosis. PTH does two things at the kidney — it retains calcium and it dumps phosphate — so losing it costs calcium and retains phosphate at the same time. That pairing separates hypoparathyroidism from vitamin D deficiency, where both fall together because the problem is absorption of both from the gut rather than renal handling.',
    metric: (s) => s.derived.serumPhosphateMgDl,
  },
  {
    id: 'ckd-suppresses-calcitriol',
    stem: 'A patient develops advanced chronic kidney disease. Their parathyroid glands and diet are unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Renal function falls to a fifth of normal.', inputs: { renalFunction: 0.2 } },
    prompt: 'What happens to calcitriol?',
    watch: 'calcitriol',
    correctDirection: 'falls',
    observeSeconds: 1200,
    explanation:
      'It falls, because the final hydroxylation that activates vitamin D happens in the kidney. So renal failure causes a vitamin D deficiency the patient cannot eat their way out of — supplementing the precursor achieves nothing once the enzyme is gone, which is why the active form is what gets prescribed. It also explains the shape of renal bone disease: low calcitriol and retained phosphate both drive PTH up, and the gland eventually becomes autonomous.',
    metric: (s) => s.derived.calcitriolLevel,
  }
];

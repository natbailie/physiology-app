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
      'Phosphate falls while calcium rises, and that divergence is the fastest way to read these labs. Bone resorption releases both ions together and calcitriol raises gut absorption of both — but PTH separately blocks proximal-tubule phosphate reabsorption, dumping phosphate into the urine. Being phosphaturic is what lets PTH raise one ion while lowering the other. High calcium with LOW phosphate is primary hyperparathyroidism; hypoparathyroidism is the exact mirror image.',
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
      'PTH falls, which is the wrong direction for a low calcium and is exactly what makes this presentation so confusing. Magnesium is permissive both for PTH secretion and for PTH action at bone and kidney, so severe depletion produces hypocalcaemia with an inappropriately LOW PTH — the only hypocalcaemia that does. It also explains why the calcium stays stubbornly refractory to replacement: until the magnesium is corrected, neither the gland nor its target tissue can respond.',
    metric: (s) => s.derived.pthLevel,
  },
];

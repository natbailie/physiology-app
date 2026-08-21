import type { PredictQuestion } from '@/shared/assessment/types';
import type { HpaDerived, HpaInputs, HpaState } from './engine/types';
import type { HpaPresetName } from './engine/presets';

type Snapshot = { state: HpaState; derived: HpaDerived };
export type HpaQuestion = PredictQuestion<HpaInputs, HpaPresetName, Snapshot>;

export const HPA_QUESTIONS: readonly HpaQuestion[] = [
  {
    id: 'primary-failure-acth',
    stem: 'A patient develops autoimmune destruction of the adrenal cortex. The hypothalamus and pituitary are entirely healthy and the feedback loop is intact.',
    setup: { preset: 'normal' },
    intervention: { label: 'Adrenal cortex function falls to 5%.', inputs: { adrenalCortexFunction: 0.05 } },
    prompt: 'What happens to ACTH?',
    watch: 'ACTH',
    correctDirection: 'rises',
    settleSeconds: 2400,
    observeSeconds: 2400,
    explanation:
      'Cortisol falls, and because negative feedback is working perfectly the pituitary responds by driving ACTH up — it is shouting at a gland that cannot answer. This is the reading rule for every hormone axis: when the hormone and its trophic signal move in OPPOSITE directions the lesion is in the gland itself. High ACTH with low cortisol is primary adrenal insufficiency, and the same excess ACTH is what pigments the skin in Addison\'s disease.',
    metric: (s) => s.derived.acthLevel,
  },
  {
    id: 'stress-in-addisons',
    stem: 'A patient with established Addison\'s disease develops a severe intercurrent illness. In a healthy person this would provoke a large rise in cortisol.',
    setup: { preset: 'addisons' },
    intervention: { label: 'A major stressor is applied.', inputs: { acuteStressLevel: 1 } },
    prompt: 'What happens to cortisol?',
    watch: 'cortisol',
    correctDirection: 'unchanged',
    settleSeconds: 1800,
    observeSeconds: 1800,
    explanation:
      'Almost nothing happens, and that is the emergency. Stress raises CRH and ACTH normally, but the signal arrives at a cortex that cannot produce cortisol however hard it is driven. The patient has no stress response at all, which is why an Addisonian crisis is precipitated by infection or surgery and why these patients carry steroids to take when unwell. Watch ACTH climb while cortisol stays flat — the axis is trying, and failing.',
    metric: (s) => s.derived.cortisolLevel,
  },
  {
    id: 'steroid-withdrawal',
    stem: 'A patient has been on high-dose glucocorticoid for months. Their own axis has been suppressed throughout, and the adrenal cortex has slowly atrophied from disuse.',
    setup: { preset: 'steroidTherapy' },
    intervention: { label: 'The steroid is stopped abruptly.', inputs: { exogenousGlucocorticoid: 0 } },
    prompt: 'What happens to the total cortisol signal?',
    watch: 'cortisol',
    correctDirection: 'falls',
    settleSeconds: 9000,
    observeSeconds: 3000,
    explanation:
      'It collapses, because the exogenous supply stops immediately while the gland that should replace it has wasted. Recovery needs ACTH stimulation, which was exactly what the steroid was suppressing, and regrowth runs far slower than the atrophy did. That asymmetry is the whole danger: the patient is left with neither source of cortisol for a period measured in weeks. It is why steroids are tapered rather than stopped, and why a patient mid-taper can still fail to mount a response to acute stress.',
    metric: (s) => s.derived.cortisolLevel,
  },
];

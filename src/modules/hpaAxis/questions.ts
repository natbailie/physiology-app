import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { HpaDerived, HpaInputs, HpaState } from './engine/types';
import type { HpaPresetName } from './engine/presets';

type Snapshot = { state: HpaState; derived: HpaDerived };
export type HpaQuestion = ModuleQuestion<HpaInputs, HpaPresetName, Snapshot>;

/**
 * The adrenal panel.
 *
 * As with the thyroid, the diagnosis is in the DIRECTION OF ACTH RELATIVE TO CORTISOL rather
 * than in either alone: they move opposite ways when the adrenal is the problem and the same
 * way when the pituitary is. Adrenal reserve is carried because it is the one row that
 * separates a suppressed axis that will recover from one that has been replaced.
 */
const ADRENAL_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'ACTH', value: (s) => s.derived.acthLevel, decimals: 2 },
  { label: 'Cortisol', value: (s) => s.derived.cortisolLevel, decimals: 1 },
  { label: 'Adrenal reserve', value: (s) => s.derived.adrenalReserve, decimals: 2 },
];

const SETTLE = 4000;

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

  // --- Reading an adrenal panel: which level of the axis has failed ---

  {
    id: 'pattern-addisons',
    stem: 'A patient has months of fatigue, weight loss and dizziness on standing. Their skin and buccal mucosa look unusually pigmented.',
    answer: 'addisons',
    options: ['addisons', 'secondaryInsufficiency', 'steroidTherapy', 'adrenalAdenoma'],
    panel: ADRENAL_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A HIGH ACTH with a LOW cortisol puts the fault in the adrenal itself. The pituitary is working perfectly and shouting for cortisol that never arrives, which is exactly what a raised ACTH means. The pigmentation in the stem is that shouting made visible: ACTH is cleaved from the same precursor as melanocyte-stimulating hormone, so an axis driven this hard darkens the skin. Note it does not occur in the secondary form, where ACTH is low — the pigmentation is a clue to the LEVEL of the lesion, not to its severity.',
  },
  {
    id: 'pattern-secondary-adrenal',
    stem: 'A patient is fatigued and hypotensive with a low cortisol. They are not pigmented, and their serum potassium is normal.',
    answer: 'secondaryInsufficiency',
    options: ['secondaryInsufficiency', 'addisons', 'adrenalAdenoma', 'steroidTherapy'],
    panel: ADRENAL_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A low cortisol with an ACTH that is also low — impossible if the pituitary were working, since it should be responding to the deficiency. The two moving in the SAME direction places the lesion above the adrenal. Both details in the stem follow from that: no pigmentation because ACTH is not raised, and a normal potassium because aldosterone is driven mainly by renin and angiotensin rather than by ACTH, so it survives a pituitary lesion and fails in Addison\'s.',
  },
  {
    id: 'pattern-adrenal-adenoma',
    stem: 'A patient has central obesity, thin skin, proximal weakness and new hypertension. They take no medication of any kind.',
    answer: 'adrenalAdenoma',
    options: ['adrenalAdenoma', 'steroidTherapy', 'addisons', 'secondaryInsufficiency'],
    panel: ADRENAL_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A high cortisol with a suppressed ACTH. The suppression is what localises it: the pituitary is intact and doing exactly what it should in the face of excess cortisol, which means the excess is coming from somewhere feedback cannot switch off. An ACTH-driven cause would show the opposite — cortisol high and ACTH high with it, because the drive is the pituitary. "Takes no medication" in the stem is doing real work, since exogenous steroid produces the same clinical picture and the same suppressed ACTH.',
  },
  {
    id: 'pattern-steroid-therapy',
    stem: 'A patient on long-term prednisolone for rheumatoid arthritis is being assessed before surgery. The team wants to know whether they can simply stop the steroid.',
    answer: 'steroidTherapy',
    options: ['steroidTherapy', 'adrenalAdenoma', 'secondaryInsufficiency', 'normal'],
    panel: ADRENAL_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The ACTH is suppressed, and the row that matters is the adrenal reserve, which has begun to fall. Exogenous steroid silences the pituitary, and an adrenal that is never asked for cortisol atrophies — so this patient cannot mount a stress response even though their measured cortisol looks adequate today. Stopping abruptly, or facing surgery without extra cover, precipitates a crisis. The reserve recovers far more slowly than it was lost, which is why steroid is tapered over months rather than stopped.',
  },
];

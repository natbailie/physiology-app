import type { PredictQuestion } from '@/shared/assessment/types';
import type { HptDerived, HptInputs, HptState } from './engine/types';
import type { HptPresetName } from './engine/presets';

type Snapshot = { state: HptState; derived: HptDerived };
export type HptQuestion = PredictQuestion<HptInputs, HptPresetName, Snapshot>;

export const HPT_QUESTIONS: readonly HptQuestion[] = [
  {
    id: 'primary-hypo-tsh',
    stem: 'A patient develops autoimmune thyroiditis. The gland is progressively destroyed while the pituitary remains entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Thyroid gland function falls to 10%.', inputs: { thyroidGlandFunction: 0.1 } },
    prompt: 'What happens to TSH?',
    watch: 'TSH',
    correctDirection: 'rises',
    settleSeconds: 3000,
    observeSeconds: 3000,
    explanation:
      'Falling thyroid hormone releases the brake on the pituitary, so TSH climbs — high TSH with low T4 is primary hypothyroidism. TSH is the sensitive test here because the pituitary response to thyroid hormone is steep: a small drift in T4 produces a large, easily measured move in TSH. That is why TSH is the screening test even though it is not the hormone doing the work, and why an abnormal TSH with borderline-normal T4 is a real finding rather than a contradiction.',
    metric: (s) => s.derived.tshLevel,
  },
  {
    id: 'sick-euthyroid-t3',
    stem: 'A patient is admitted critically unwell with sepsis. Their thyroid gland is healthy, their pituitary is healthy, and nobody has given them any thyroid medication.',
    setup: { preset: 'normal' },
    intervention: { label: 'Severe systemic illness develops.', inputs: { illnessSeverity: 70 } },
    prompt: 'What happens to T3?',
    watch: 'T3',
    correctDirection: 'falls',
    settleSeconds: 3000,
    observeSeconds: 1800,
    explanation:
      'Most circulating T3 is not made by the thyroid at all — it is converted from T4 in peripheral tissue, and serious illness suppresses that conversion. So T3 falls while T4 and TSH stay near normal, because nothing is wrong with the gland or the axis. This is sick euthyroid syndrome, and the practical lesson is that thyroid function tests taken during acute illness are difficult to interpret and usually should not be acted on until the patient has recovered.',
    metric: (s) => s.derived.t3Level,
  },
  {
    id: 'levothyroxine-tsh',
    stem: 'A patient with established primary hypothyroidism is started on levothyroxine at a full replacement dose. Their own gland remains non-functional.',
    setup: { preset: 'primaryHypothyroidism' },
    intervention: { label: 'Levothyroxine replacement is started.', inputs: { exogenousLevothyroxine: 100 } },
    prompt: 'What happens to TSH?',
    watch: 'TSH',
    correctDirection: 'falls',
    settleSeconds: 4200,
    observeSeconds: 6000,
    explanation:
      'The pituitary cannot tell exogenous thyroxine from the endogenous kind, so replacement restores the feedback signal and TSH falls back toward normal. That is precisely why TSH — not T4 — is used to titrate the dose: it is the readout of whether the tissue that matters is adequately supplied. Note how slowly it moves. T4 turns over across about a week, so nothing meaningful can be judged for several weeks, which is why thyroid function is rechecked at around six weeks rather than at one.',
    metric: (s) => s.derived.tshLevel,
  },
];

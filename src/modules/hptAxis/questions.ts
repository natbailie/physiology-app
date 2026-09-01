import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { HptDerived, HptInputs, HptState } from './engine/types';
import type { HptPresetName } from './engine/presets';

type Snapshot = { state: HptState; derived: HptDerived };
export type HptQuestion = ModuleQuestion<HptInputs, HptPresetName, Snapshot>;

/**
 * The thyroid function panel, as it is actually reported.
 *
 * Three rows, and the DIRECTION OF TSH RELATIVE TO T4 does most of the work: the two move
 * opposite ways when the gland is the problem and the same way when the pituitary is. No single
 * row separates them, which is the whole reason a TSH is never interpreted alone.
 */
const THYROID_PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'TSH', value: (s) => s.derived.tshMilliUnitsPerL, decimals: 2 },
  { label: 'Free T4', value: (s) => s.derived.t4Level, decimals: 1 },
  { label: 'T3', value: (s) => s.derived.t3Level, decimals: 0 },
];

/** Long enough for the slow thyroid pool to have settled — T4 has a week-long half-life. */
const SETTLE = 4000;

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
    metric: (s) => s.derived.tshMilliUnitsPerL,
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
    metric: (s) => s.derived.tshMilliUnitsPerL,
  },

  // --- Reading a thyroid panel: which level of the axis has failed ---

  {
    id: 'pattern-primary-hypothyroidism',
    stem: 'A woman is tired, cold and constipated, and has gained weight over six months. Her thyroid function tests are below.',
    answer: 'primaryHypothyroidism',
    options: ['primaryHypothyroidism', 'secondaryHypothyroidism', 'graves', 'sickEuthyroid'],
    panel: THYROID_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A HIGH TSH with a LOW T4 places the fault in the gland. The pituitary is working perfectly — it has sensed the low thyroid hormone and is shouting for more — and the gland cannot answer, which is exactly what a raised TSH means. The direction of TSH relative to T4 is the whole diagnosis: here they move opposite ways, which can only happen when the feedback loop is intact and its target is not responding. Compare the secondary option, where they move together.',
  },
  {
    id: 'pattern-secondary-hypothyroidism',
    stem: 'A patient is tired and cold with the same clinical picture as hypothyroidism, but they also have a bitemporal visual field defect.',
    answer: 'secondaryHypothyroidism',
    options: ['secondaryHypothyroidism', 'primaryHypothyroidism', 'sickEuthyroid', 'graves'],
    panel: THYROID_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A LOW T4 with a TSH that is also low — and that pairing is impossible if the pituitary is working, because a healthy pituitary responds to a low T4 by raising TSH. The two moving in the SAME direction localises the lesion above the gland. This is why a TSH alone is not a screening test for thyroid disease: it would come back low here and be read as normal or even overactive, in a patient with a pituitary lesion. The visual field defect in the stem is the chiasm being compressed by whatever is causing it.',
  },
  {
    id: 'pattern-graves',
    stem: 'A young woman has lost weight despite a good appetite, and is anxious, tremulous and heat-intolerant.',
    answer: 'graves',
    options: ['graves', 'primaryHypothyroidism', 'sickEuthyroid', 'secondaryHypothyroidism'],
    panel: THYROID_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A high T4 and T3 with a completely suppressed TSH. The suppression is the point: the pituitary is working normally and is doing what it should in the face of excess thyroid hormone, which tells you the drive is coming from somewhere the feedback loop cannot reach. In Graves an antibody stimulates the TSH receptor directly, so no amount of pituitary silence turns it off. A high T4 with a HIGH TSH would be a completely different problem — a hormone-secreting pituitary tumour.',
  },
  {
    id: 'pattern-sick-euthyroid',
    stem: 'A patient in intensive care with severe sepsis has thyroid function tested as part of a broad screen. They have no history of thyroid disease.',
    answer: 'sickEuthyroid',
    options: ['sickEuthyroid', 'primaryHypothyroidism', 'secondaryHypothyroidism', 'graves'],
    panel: THYROID_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The giveaway is a low T3 with a TSH that has not risen to meet it. In real thyroid failure the pituitary would have responded; here it has not, because the axis is intact and the problem is peripheral — severe illness suppresses the enzyme that converts T4 to the active T3. This is an adaptation rather than a disease, and treating it with thyroxine does not help. The practical lesson is in the stem: thyroid function tests taken during acute illness are difficult to interpret, and are usually best repeated once the patient has recovered.',
  },
];

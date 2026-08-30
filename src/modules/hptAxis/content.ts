import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { HptPresetName } from './engine/presets';

export const hptAxisContent: ExplainerContent<HptPresetName> = {
  title: 'How the thyroid axis is regulated — and where "sick euthyroid" actually happens',
  sections: [
    {
      heading: 'The same cascade shape as the HPA axis, on a slower clock',
      paragraphs: [
        'The hypothalamus releases TRH, driving the pituitary to release TSH, which drives the thyroid to release T4 (and a little T3). Circulating T4/T3 then feeds back to suppress TRH and TSH — the same three-stage cascade shape as the HPA axis, just running on a much slower clock (T4 has a roughly week-long half-life, versus cortisol’s ~90 minutes).',
      ],
      demos: [
        { preset: 'normal', watch: 'TSH' },
      ],
    },
    {
      heading: 'Where the lesion sits changes the TSH signature',
      paragraphs: [
        'Where the lesion sits again changes the TSH pattern predictably: a failing gland (Hashimoto’s) can’t respond to TSH, so TSH rises unchecked while T4 stays low. A failing pituitary can’t raise TSH at all, so both stay low — same low T4, opposite TSH signature.',
      ],
      demos: [
        { preset: 'primaryHypothyroidism', watch: 'TSH' },
        { preset: 'secondaryHypothyroidism', watch: 'TSH' },
      ],
    },
    {
      heading: 'Most T3 is made outside the thyroid, and illness stops that',
      paragraphs: [
        'Most circulating T3 isn’t made by the thyroid directly — it’s converted from T4 in peripheral tissue by deiodinase enzymes. Acute illness or starvation suppresses that peripheral conversion without touching the thyroid or pituitary at all, which is why sick euthyroid syndrome shows a low T3 without the marked TSH rise you’d see if the gland itself were failing — the problem is downstream of the axis, not in it.',
      ],
      demos: [
        { preset: 'sickEuthyroid', watch: 'free T3' },
      ],
    },
    {
      heading: 'T4 turns over in a week, and that governs how it is managed',
      paragraphs: [
        'T4 turns over over about a week, and that one number governs how the axis is managed. It is by far the slowest actuator here, so nothing about a dose change is visible quickly: after altering levothyroxine, several weeks must pass before the level — and the TSH responding to it — mean anything. This is why thyroid function is rechecked at around six weeks rather than at one, and why a patient who feels no different after a few days has not yet been given the chance to.',
      ],
    },
    {
      heading: 'TSH is sensitive because it sits downstream of an amplifier',
      paragraphs: [
        'TSH is the most sensitive test because it sits downstream of an amplifier. The hypothalamus and pituitary respond to a combined signal of T4 plus T3, with T3 weighted for its considerably greater receptor potency, and the pituitary response to that signal is steep — a small drift in thyroid hormone produces a large, easily measurable move in TSH. That is why an abnormal TSH with normal-looking hormone levels is a real finding rather than a contradiction, and why TSH is the screening test even though it is not the hormone doing the work.',
      ],
    },
    {
      heading: 'Autonomous stimulation is the mirror image of a failing gland',
      paragraphs: [
        'Autonomous, TSH-independent stimulation — Graves\' disease, where an antibody activates the TSH receptor directly — produces the mirror image of primary hypothyroidism. T4 and T3 are high, and since the feedback loop itself is intact, it suppresses TSH toward zero. The same reading rule applies here as in the adrenal axis: hormone and trophic signal moving in opposite directions places the lesion in the gland, while both moving together places it in the pituitary or hypothalamus above the feedback point. That one comparison sorts almost every thyroid function test you will see.',
      ],
      demos: [
        { preset: 'graves', watch: 'TSH' },
      ],
    },
  ],
};

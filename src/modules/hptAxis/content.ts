import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const hptAxisContent: ExplainerContent = {
  title: 'How the thyroid axis is regulated — and where "sick euthyroid" actually happens',
  paragraphs: [
    'The hypothalamus releases TRH, driving the pituitary to release TSH, which drives the thyroid to release T4 (and a little T3). Circulating T4/T3 then feeds back to suppress TRH and TSH — the same three-stage cascade shape as the HPA axis, just running on a much slower clock (T4 has a roughly week-long half-life, versus cortisol’s ~90 minutes).',
    'Where the lesion sits again changes the TSH pattern predictably: a failing gland (Hashimoto’s) can’t respond to TSH, so TSH rises unchecked while T4 stays low. A failing pituitary can’t raise TSH at all, so both stay low — same low T4, opposite TSH signature.',
    'Most circulating T3 isn’t made by the thyroid directly — it’s converted from T4 in peripheral tissue by deiodinase enzymes. Acute illness or starvation suppresses that peripheral conversion without touching the thyroid or pituitary at all, which is why sick euthyroid syndrome shows a low T3 without the marked TSH rise you’d see if the gland itself were failing — the problem is downstream of the axis, not in it.',
    'Autonomous (TSH-independent) thyroid stimulation, as in Graves’ disease, produces the opposite pattern to primary hypothyroidism: T4/T3 are high, and the axis’s own negative feedback suppresses TSH toward zero.',
  ],
};

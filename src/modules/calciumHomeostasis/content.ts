import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { CalciumPresetName } from './engine/presets';

export const calciumHomeostasisContent: ExplainerContent<CalciumPresetName> = {
  title: 'Why calcium and phosphate move in opposite directions',
  sections: [
    {
      heading: 'PTH defends calcium through three organs at once',
      paragraphs: [
        'PTH defends serum calcium through three organs at once: it drives bone resorption, raises distal-tubule calcium reabsorption, and stimulates renal 1-alpha-hydroxylase to make calcitriol, which in turn raises gut calcium absorption. The calcium it liberates then feeds back to suppress further PTH release — a classic negative-feedback loop with the ion itself as the sensed variable.',
      ],
      demos: [
        { preset: 'normal', watch: 'serum calcium' },
      ],
    },
    {
      heading: 'Calcium and phosphate diverge because PTH is phosphaturic',
      paragraphs: [
        'The reason calcium and phosphate diverge is that PTH is phosphaturic. Bone resorption releases both ions together, and calcitriol raises gut absorption of both — but PTH separately blocks proximal-tubule phosphate reabsorption, dumping phosphate into the urine. Net result: PTH raises calcium while lowering phosphate. That divergence is the fastest way to read the labs — primary hyperparathyroidism shows high calcium with low phosphate, while hypoparathyroidism shows the exact mirror image.',
      ],
      demos: [
        { preset: 'primaryHyperparathyroidism', watch: 'phosphate' },
      ],
    },
    {
      heading: 'Vitamin D is only active after the kidney finishes it',
      paragraphs: [
        'Vitamin D only becomes active after a final hydroxylation step in the kidney, which is why renal failure breaks the pathway no matter how much vitamin D was ingested — CKD patients need calcitriol analogues, not plain supplementation. Gut absorption never falls to zero, though: a passive route continues without any calcitriol at all, which is why calcium supplementation still helps in vitamin D deficiency, just far less efficiently than fixing the vitamin D would. CKD also blocks the phosphaturic escape route, so phosphate accumulates while calcitriol falls, driving a severe secondary hyperparathyroidism. Watch the Ca × phosphate product: once it climbs past about 55, calcium-phosphate begins precipitating into soft tissue, which is what makes phosphate control central to managing CKD-MBD.',
      ],
      demos: [
        { preset: 'vitaminDDeficiency', watch: 'serum calcium' },
        { preset: 'ckdMineralBoneDisease', watch: 'phosphate' },
      ],
    },
    {
      heading: 'The defended range is set by how far PTH can pull',
      paragraphs: [
        'The range the system defends is set by how far PTH can pull. With PTH fully switched off, the calcium-independent inflows alone hold serum calcium near 7.0 mg/dL — the hypoparathyroid floor. With PTH maximal and autonomous, as in an adenoma that has stopped listening to calcium altogether, it reaches about 11.1 mg/dL. Everything clinical happens between those two numbers, and knowing they are the endpoints of a single hormone axis explains why the abnormal calcium values you actually see cluster so tightly.',
      ],
      demos: [
        { preset: 'hypoparathyroidism', watch: 'serum calcium' },
      ],
    },
    {
      heading: 'Calcitonin is in the loop and barely matters',
      paragraphs: [
        'Calcitonin is in the loop but barely matters. C cells do respond to hypercalcaemia and do oppose bone resorption, but with a small gain relative to PTH and calcitriol. The clinical proof is that removing every C cell in the body during a total thyroidectomy does not cause hypercalcaemia — the counter-regulatory arm can be deleted entirely and the setpoint holds. Calcium is defended by raising PTH when it falls, far more than by lowering anything when it rises.',
      ],
    },
    {
      heading: 'Magnesium is the quiet prerequisite for the whole system',
      paragraphs: [
        'Magnesium is the quiet prerequisite for the whole system. It is permissive both for PTH secretion and for PTH\'s action at bone and kidney, so severe hypomagnesemia produces the one hypocalcemia that comes with an inappropriately low PTH instead of a high one — and calcium that stays stubbornly refractory to replacement until the magnesium itself is corrected first.',
      ],
      demos: [
        { preset: 'hypomagnesemia', watch: 'PTH' },
      ],
    },
  ],
};

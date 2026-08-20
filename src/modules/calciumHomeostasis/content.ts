import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const calciumHomeostasisContent: ExplainerContent = {
  title: 'Why calcium and phosphate move in opposite directions',
  paragraphs: [
    'PTH defends serum calcium through three organs at once: it drives bone resorption, raises distal-tubule calcium reabsorption, and stimulates renal 1-alpha-hydroxylase to make calcitriol, which in turn raises gut calcium absorption. The calcium it liberates then feeds back to suppress further PTH release — a classic negative-feedback loop with the ion itself as the sensed variable.',
    'The reason calcium and phosphate diverge is that PTH is phosphaturic. Bone resorption releases both ions together, and calcitriol raises gut absorption of both — but PTH separately blocks proximal-tubule phosphate reabsorption, dumping phosphate into the urine. Net result: PTH raises calcium while lowering phosphate. That divergence is the fastest way to read the labs — primary hyperparathyroidism shows high calcium with LOW phosphate, while hypoparathyroidism shows the exact mirror image.',
    'Vitamin D only becomes active after a final hydroxylation step in the kidney, which is why renal failure breaks the pathway no matter how much vitamin D was ingested — CKD patients need calcitriol analogues, not plain supplementation. CKD also blocks the phosphaturic escape route, so phosphate accumulates while calcitriol falls, driving a severe secondary hyperparathyroidism. Watch the Ca × phosphate product: once it climbs past about 55, calcium-phosphate begins precipitating into soft tissue, which is what makes phosphate control central to managing CKD-MBD.',
    'Magnesium is the quiet prerequisite for the whole system. It is permissive both for PTH secretion and for PTH\'s action at bone and kidney, so severe hypomagnesemia produces the one hypocalcemia that comes with an inappropriately LOW PTH instead of a high one — and calcium that stays stubbornly refractory to replacement until the magnesium itself is corrected first.',
  ],
};

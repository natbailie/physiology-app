import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { GlucosePresetName } from './engine/presets';

export const glucoseRegulationContent: ExplainerContent<GlucosePresetName> = {
  title: 'How two opposing islet hormones hold blood glucose in a narrow band',
  sections: [
    {
      heading: 'Two cells read one signal and answer in opposite directions',
      paragraphs: [
        'Beta cells and alpha cells read the same signal and respond in opposite directions: rising glucose drives insulin (promoting uptake into tissue), falling glucose drives glucagon (promoting hepatic glycogenolysis). Because both are glucose-dependent and reciprocal, glucose stays within a remarkably narrow range across feeding and fasting without any conscious input.',
      ],
      demos: [
        { preset: 'normal', watch: 'glucose' },
      ],
    },
    {
      heading: 'The two diabetes reach the same number by different routes',
      paragraphs: [
        'Type 1 and type 2 diabetes both produce post-meal hyperglycemia by entirely different routes. In T1DM the beta cells are gone, so no insulin is secreted at all and glucose climbs unchecked until exogenous insulin is given — which still works, because the tissue response is intact. In T2DM secretion is preserved (often with compensatory hyperinsulinemia), but peripheral tissue no longer responds to it properly; the same insulin level simply does less work.',
      ],
      demos: [
        { preset: 'type1Diabetes', watch: 'insulin' },
        { preset: 'type2Diabetes', watch: 'insulin' },
      ],
    },
    {
      heading: 'Defence against hypoglycaemia is hierarchical, not all at once',
      paragraphs: [
        'Defense against hypoglycemia is hierarchical rather than all-at-once. Insulin secretion falls off first, glucagon rises next, and only if glucose keeps dropping do the counter-regulatory hormones — epinephrine, cortisol, and growth hormone — engage. Epinephrine is also what produces the adrenergic warning symptoms (tremor, sweating, palpitations), which is why beta-blockade or longstanding T1DM with a blunted response can lead to hypoglycemia unawareness.',
      ],
      demos: [
        { preset: 'fasting', watch: 'glucagon' },
      ],
    },
    {
      heading: 'The pancreas is warned before the glucose arrives',
      paragraphs: [
        'The pancreas is warned before the glucose arrives. Carbohydrate and fat reaching the duodenum trigger GIP and GLP-1 from the gut, and these incretins prime the beta cell ahead of absorption — which is why oral glucose provokes considerably more insulin than the same load given intravenously. It means the insulin response is not a simple reaction to a blood level but a partly feed-forward one, and it is the mechanism GLP-1 agonists exploit. The GI Physiology module is where that limb is simulated.',
      ],
    },
    {
      heading: 'Injected insulin bypasses every control in the loop',
      paragraphs: [
        'Exogenous insulin bypasses every control in the loop, which is both why it works and why it is dangerous. Injected insulin is ungated by secretion capacity, so it lowers glucose in someone whose beta cells produce nothing at all — the whole basis of treating type 1 diabetes. But it is equally ungated by the feedback that would normally switch secretion off as glucose falls. The defences that follow are hierarchical: insulin secretion falls first, glucagon rises next, and the cortisol, growth hormone and adrenaline arm engages only at genuinely low levels — and none of them can withdraw a dose already given.',
      ],
      demos: [
        { preset: 'insulinOverdose', watch: 'glucose' },
      ],
    },
    {
      heading: 'Hepatic glycogen is finite, and running it out has a sequel',
      paragraphs: [
        'Hepatic glycogen is finite: sustained glycogenolysis depletes the reserve, and it only refills once glucose intake is adequate again. In unmanaged T1DM, absent insulin also removes the brake on lipolysis and ketogenesis — the route from unchecked hyperglycemia to diabetic ketoacidosis. You can see the other half of that picture in the Respiratory & Acid-Base module\'s DKA preset, where Kussmaul breathing appears as the lungs compensate for the resulting metabolic acid load.',
      ],
    },
  ],
};

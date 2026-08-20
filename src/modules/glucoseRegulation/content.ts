import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';

export const glucoseRegulationContent: ExplainerContent = {
  title: 'How two opposing islet hormones hold blood glucose in a narrow band',
  paragraphs: [
    'Beta cells and alpha cells read the same signal and respond in opposite directions: rising glucose drives insulin (promoting uptake into tissue), falling glucose drives glucagon (promoting hepatic glycogenolysis). Because both are glucose-dependent and reciprocal, glucose stays within a remarkably narrow range across feeding and fasting without any conscious input.',
    'Type 1 and type 2 diabetes both produce post-meal hyperglycemia by entirely different routes. In T1DM the beta cells are gone, so no insulin is secreted at all and glucose climbs unchecked until exogenous insulin is given — which still works, because the tissue response is intact. In T2DM secretion is preserved (often with compensatory hyperinsulinemia), but peripheral tissue no longer responds to it properly; the same insulin level simply does less work.',
    'Defense against hypoglycemia is hierarchical rather than all-at-once. Insulin secretion falls off first, glucagon rises next, and only if glucose keeps dropping do the counter-regulatory hormones — epinephrine, cortisol, and growth hormone — engage. Epinephrine is also what produces the adrenergic warning symptoms (tremor, sweating, palpitations), which is why beta-blockade or longstanding T1DM with a blunted response can lead to hypoglycemia unawareness.',
    'Hepatic glycogen is finite: sustained glycogenolysis depletes the reserve, and it only refills once glucose intake is adequate again. In unmanaged T1DM, absent insulin also removes the brake on lipolysis and ketogenesis — the route from unchecked hyperglycemia to diabetic ketoacidosis. You can see the other half of that picture in the Respiratory & Acid-Base module\'s DKA preset, where Kussmaul breathing appears as the lungs compensate for the resulting metabolic acid load.',
  ],
};

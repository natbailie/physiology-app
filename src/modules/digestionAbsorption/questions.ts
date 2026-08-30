import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { DigestionDerived, DigestionInputs, DigestionInternalState } from './engine/types';
import type { DigestionPresetName } from './engine/presets';
import { perturbEatMeal } from './engine/engine';

type Snapshot = { state: DigestionInternalState; derived: DigestionDerived };
export type DigestionQuestion = ModuleQuestion<DigestionInputs, DigestionPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  {
    label: 'Stool water',
    unit: 'ml/day',
    value: (s) => s.derived.stoolWaterMlPerDay,
    decimals: 0,
    tolerance: 0.12,
  },
  {
    label: 'Faecal fat',
    unit: 'g/day',
    value: (s) => s.derived.faecalFatGPerDay,
    decimals: 1,
    tolerance: 0.15,
  },
  {
    label: 'Bile salt pool',
    unit: 'g',
    value: (s) => s.derived.bileSaltPoolG,
    decimals: 1,
    tolerance: 0.12,
  },
  {
    label: 'B12 store',
    unit: '%',
    value: (s) => s.derived.b12StoreFraction * 100,
    decimals: 0,
    tolerance: 0.12,
  },
  {
    label: 'Iron store',
    unit: '%',
    value: (s) => s.derived.ironStoreFraction * 100,
    decimals: 0,
    tolerance: 0.12,
  },
];

const LONG_SETTLE = 400000;

export const DIGESTION_QUESTIONS: readonly DigestionQuestion[] = [
  {
    id: 'greasy-stool-names-the-organ',
    stem: 'A man with chronic pancreatitis passes bulky, pale stools that are hard to flush and leave an oily film. They smell foul.',
    answer: 'pancreaticInsufficiency',
    options: ['pancreaticInsufficiency', 'coeliacDisease', 'terminalIlealResection', 'vipoma'],
    panel: PANEL,
    settleSeconds: LONG_SETTLE,
    explanation:
      'The emulsion forms but nothing hydrolyses it: pancreatic lipase is gone, so the triglyceride sails through to the colon as hydroxylated fatty acids — lost calories that also water the stool directly. The panel separates him from the other steatorrhoeas: his bile salt pool is full and his stores are fine, because the failure is in the enzyme, not the detergent or the wall. Enzyme replacement returns the stool to normal within days.',
  },
  {
    id: 'watery-whether-or-not-they-eat',
    stem: 'A woman has six litres of watery diarrhoea a day. It persisted through a five-day fast on clear fluids. Her potassium keeps falling despite supplements.',
    answer: 'vipoma',
    options: ['vipoma', 'partialIlealLoss', 'lactaseDeficiency', 'normal'],
    panel: PANEL,
    settleSeconds: 200000,
    explanation:
      'Fasting changed nothing — that single fact divides the diarrhoeas. Osmotic stool stops when food stops; secretory stool is driven by a mediator telling the gut to pour out water regardless of the lumen. A VIPoma does exactly that, dragging potassium out with it. The panel confirms quiet osmotic alternatives: her fat, pool and stores are untouched because the problem is a signal, not a broken surface.',
  },
  {
    id: 'tired-pale-and-coeliac',
    stem: 'A woman in her thirties has iron deficiency that returned despite oral supplementation, with mild bloating after bread. Her B12 and her fat absorption are essentially normal.',
    answer: 'coeliacDisease',
    options: ['coeliacDisease', 'pancreaticInsufficiency', 'terminalIlealResection', 'normal'],
    panel: PANEL,
    settleSeconds: LONG_SETTLE,
    explanation:
      'Iron is taken up proximally, and the coeliac lesion is proximal — villous atrophy strips the duodenal and jejunal surface first, so iron falls while the distal jobs (bile salt recycling, B12) are untouched. That geography is the diagnosis hiding in the panel: an ileal disease would show the reverse pattern. Anti-TTG and a duodenal biopsy confirm what the pattern already says.',
  },
  {
    id: 'the-ileum-takes-three-things',
    stem: 'Two years after resection of chronically diseased terminal ileum, a patient has loose stool, low B12 requiring injections, and greasy malodorous motions.',
    answer: 'terminalIlealResection',
    options: ['terminalIlealResection', 'coeliacDisease', 'pancreaticInsufficiency', 'normal'],
    panel: PANEL,
    settleSeconds: LONG_SETTLE,
    explanation:
      'One operation, three failures: bile salts no longer recycle so the pool collapses and fat goes unemulsified; the B12-intrinsic factor receptor site is gone so stores drain on a scale of years; and the spilled salts water the colon on their way past. No other single lesion produces this trio, which is why the terminal ileum earns its outsized place in every examination of chronic diarrhoea.',
  },
  {
    id: 'milk-challenge-osmotic',
    stem: 'A young adult with lifelong milk avoidance is given two glasses of milk to drink during a lactose challenge.',
    setup: { preset: 'lactaseDeficiency' },
    intervention: { label: 'The meal lands in the lumen.', perturb: (state) => perturbEatMeal(state) },
    prompt: 'What happens to stool water output?',
    watch: 'stool water',
    correctDirection: 'rises',
    settleSeconds: 1000,
    observeSeconds: 40000,
    explanation:
      'It rises into diarrhoea, driven purely by osmosis: without brush-border lactase, the disaccharide stays whole in the lumen and holds water all the way to the rectum. Bacteria then ferment it into gas for the bloating. Nothing is inflamed or secreting — which is why fasting relieves it completely and why the stool osmotic gap runs high. Stop the milk, stop the problem.',
    metric: (s) => s.derived.stoolWaterMlPerDay,
  },
  {
    id: 'steatorrhoea-needs-a-meal-too',
    stem: 'A man with silent chronic pancreatitis has never noticed anything wrong. Today he eats a fried breakfast.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'Pancreatic lipase is revealed to be at 4% — and the meal lands in the lumen.',
      inputs: { pancreaticEnzymeCapacityPct: 4 },
      perturb: (state) => perturbEatMeal(state),
    },
    prompt: 'What happens to stool water output?',
    watch: 'stool water',
    correctDirection: 'rises',
    settleSeconds: 1000,
    observeSeconds: 60000,
    explanation:
      'It rises into diarrhoea, because unabsorbed fat is not inert payload: bacterial hydroxylation converts it into secretagogues that pour water into the colon and cripple its ability to reclaim it. Malabsorbed nutrient is not merely lost — it becomes an active irritant downstream. This is why steatorrhoea and watery stool travel together even though the primary failure was hydrolysis, not secretion.',
    metric: (s) => s.derived.stoolWaterMlPerDay,
  },
  {
    id: 'secretory-ignores-the-meal',
    stem: 'A patient with a neuroendocrine tumour driving secretory diarrhoea is kept nil by mouth as part of their work-up.',
    setup: { preset: 'vipoma' },
    intervention: { label: 'A meal is nevertheless placed in the lumen.', perturb: (state) => perturbEatMeal(state) },
    prompt: 'What happens to stool water output?',
    watch: 'stool water',
    correctDirection: 'unchanged',
    settleSeconds: 1000,
    observeSeconds: 40000,
    tolerance: 0.03,
    explanation:
      'Barely changes, because the meal was never the point. The mediator drives salt and water into the gut lumen directly, and the colon cannot reclaim all of it whether or not anything arrives by mouth. This is the question that separates secretory from osmotic at the bedside: fast the patient. One diarrhoea waits for dinner; the other does not.',
    metric: (s) => s.derived.stoolWaterMlPerDay,
  },
  {
    id: 'losing-the-recycling',
    stem: 'Extensive ileal Crohn\'s disease finally forces removal of the diseased segment. Bile salt recycling falls to almost nothing.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'Ileal recycling drops to 5% and ileal uptake fails with it.',
      inputs: { ilealReabsorptionFraction: 0.05, terminalIlealFunctionPct: 5 },
    },
    prompt: 'What happens to the bile salt pool over the following days?',
    watch: 'bile salt pool',
    correctDirection: 'falls',
    settleSeconds: 10000,
    observeSeconds: 500000,
    tolerance: 0.02,
    explanation:
      'It drains toward whatever the liver can synthesise — a fraction of its old size — and no amount of hepatic drive can chase seven cycles a day spilling nearly everything. The consequences stack: less detergent means steatorrhoea, the spilled salts mean watery cholerrhoea, and B12 stores begin their slow slide. Ileal loss is never one disease; it is three wearing one gown.',
    metric: (s) => s.derived.bileSaltPoolG,
  },
  {
    id: 'enzyme-reserve-absorbs-anyway',
    stem: 'A man with moderately reduced pancreatic output (about 15% of normal lipase) worries he must be malabsorbing his meals.',
    setup: { preset: 'normal' },
    intervention: { label: 'Pancreatic enzyme capacity falls to 15%.', inputs: { pancreaticEnzymeCapacityPct: 15 } },
    prompt: 'What happens to his fat absorption?',
    watch: 'fat uptake',
    correctDirection: 'unchanged',
    settleSeconds: 1000,
    observeSeconds: 30000,
    tolerance: 0.03,
    explanation:
      'Unchanged, because the pancreas secretes roughly ten times what a meal requires. Health carries enormous reserve precisely so that ordinary variation — a big fatty meal, a marginal day — never threatens uptake. It follows that steatorrhoea is a late sign of pancreatic disease: by the time fat appears in the stool, the gland has lost almost everything, which is why faecal elastase detects failure long before the stool does.',
    metric: (s) => s.derived.currentMealFatAbsorptionPct,
  },
  {
    id: 'iron-falls-before-b12',
    stem: 'A patient with untreated coeliac disease asks which deficiencies will appear first if she keeps eating gluten.',
    setup: { preset: 'normal' },
    intervention: { label: 'Mucosal surface area falls to 22%.', inputs: { mucosalSurfaceAreaPct: 22 } },
    prompt: 'What happens to her iron stores?',
    watch: 'iron store',
    correctDirection: 'falls',
    settleSeconds: 20000,
    observeSeconds: 900000,
    tolerance: 0.01,
    explanation:
      'They drain — iron is absorbed proximally where the coeliac damage lives, and turnover outruns the shrunken surface within weeks. Meanwhile her B12 store sits untouched, because its receptor site is in the spared ileum. The order of micronutrient loss localises the lesion: proximal disease takes iron and folate first, ileal disease takes B12, and pan-mucosal loss takes everything including the fat.',
    metric: (s) => s.state.ironStoreFraction,
  },
];

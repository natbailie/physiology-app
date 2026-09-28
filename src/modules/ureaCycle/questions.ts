import type { ModuleQuestion } from '@/shared/assessment/types';
import type { UreaCycleDerived, UreaCycleInputs, UreaCycleInternalState } from './engine/types';
import type { UreaCyclePresetName } from './engine/presets';

type Snapshot = { state: UreaCycleInternalState; derived: UreaCycleDerived };
export type UreaCycleQuestion = ModuleQuestion<UreaCycleInputs, UreaCyclePresetName, Snapshot>;

export const UREA_CYCLE_QUESTIONS: readonly UreaCycleQuestion[] = [
  {
    id: 'protein-load-raises-urea',
    stem: 'A healthy adult doubles his protein intake for a month while training for a marathon. His liver is normal and he drinks his usual two litres a day.',
    setup: { preset: 'normal' },
    intervention: { label: 'He raises protein to 180 g a day.', inputs: { proteinIntakeGPerDay: 180 } },
    prompt: 'What happens to his plasma urea?',
    watch: 'urea',
    correctDirection: 'rises',
    explanation:
      'Urea more than doubles, because a healthy cycle answers extra nitrogen with extra product: CPS1 through arginase simply run faster and the kidneys excrete what the liver makes. The ammonia that a learner fears stays flat, which is the entire point of having a cycle rather than a passive filter. A raised urea in a well person with a normal ammonia is therefore usually a catering observation rather than a liver observation, and the correct response is dietary history rather than a hepatic workup.',
    metric: (s) => s.derived.ureaMmolL,
  },
  {
    id: 'dehydration-leaves-ammonia-flat',
    stem: 'The same man spends a hot week drinking very little water. His protein intake and his liver have not changed.',
    setup: { preset: 'normal' },
    intervention: { label: 'His water intake falls to half a litre a day.', inputs: { hydrationLPerDay: 0.5 } },
    prompt: 'What happens to his plasma ammonia?',
    watch: 'ammonia',
    correctDirection: 'unchanged',
    explanation:
      'It barely moves, because concentration is not production: dehydration narrows the renal exit without touching the cycle that clears ammonia, so urea and BUN climb while the nitrogen balance itself is unchanged. This dissociation is the prerenal pattern wards act on daily, and it is the reason urea must never be read without asking about fluid balance. The teaching trap answers "rises" by treating every raised nitrogen number as the same physiology, when the module draws them as two different arrows for exactly this reason.',
    metric: (s) => s.derived.ammoniaUmolL,
    tolerance: 0.05,
  },
  {
    id: 'liver-failure-raises-ammonia',
    stem: 'A 58-year-old man with cirrhosis eats an ordinary dinner containing about 70 g of protein. His functioning hepatocyte mass is roughly a quarter of normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Hepatocyte mass falls to a quarter.', inputs: { liverFunctionPct: 25 } },
    prompt: 'What happens to his plasma ammonia?',
    watch: 'ammonia',
    correctDirection: 'rises',
    explanation:
      'Ammonia climbs past the encephalopathic threshold, because the same dinner that a healthy cycle clears without noticing now exceeds what a quarter-liver can process. The curve is steep rather than gradual: capacity either covers the load or it does not, which is why hepatic encephalopathy arrives as a threshold event after a protein load, a bleed or an infection rather than as a slow drift. The grade tile stepping upward is the clinical payoff, and it is the reason protein restriction and lactulose are emergency measures rather than dietary preferences.',
    metric: (s) => s.derived.ammoniaUmolL,
  },
  {
    id: 'liver-failure-lowers-urea',
    stem: 'The same cirrhotic patient has his bloods taken the morning after the dinner. His urea comes back surprisingly low.',
    setup: { preset: 'normal' },
    intervention: { label: 'Hepatocyte mass falls to a quarter.', inputs: { liverFunctionPct: 25 } },
    prompt: 'What happens to his plasma urea?',
    watch: 'urea',
    correctDirection: 'falls',
    explanation:
      'Urea falls to a fraction of baseline, which is the paradox the whole module is built around: the product disappears precisely because the failing step is the one that manufactures it. A learner who reads a low urea as reassuring has the physiology exactly backwards, and in a cirrhotic patient a falling urea beside a rising ammonia is the cycle confessing. This is also why BUN loses its usual meaning in liver failure — the number most wards trust as a volume signal becomes a synthetic-function signal wearing a volume disguise.',
    metric: (s) => s.derived.ureaMmolL,
  },
  {
    id: 'otc-defect-raises-orotate',
    stem: 'A newborn screens positive for ornithine transcarbamylase deficiency. His residual cycle activity is about a quarter of normal, though his liver mass is intact.',
    setup: { preset: 'normal' },
    intervention: { label: 'Residual enzyme activity falls to a quarter.', inputs: { enzymeCapacity: 0.25 } },
    prompt: 'What happens to his orotic-acid shunt index?',
    watch: 'orotic acid',
    correctDirection: 'rises',
    explanation:
      'Orotate climbs more than tenfold, because CPS1 still runs while the distal block at OTC leaves carbamoyl-phosphate with nowhere downstream to go, so it spills sideways into pyrimidine synthesis. The shunt is the relief valve drawn above the blocked station, and it is the one reading that separates this baby from a cirrhotic adult with the same ammonia: shared hyperammonaemia, opposite orotate. That separation is why metabolic wards measure orotic aciduria in every hyperammonaemic neonate, and why the module draws the valve opening only against a distal block.',
    metric: (s) => s.derived.oroticAcidIndex,
  },
  {
    id: 'bleed-becomes-a-protein-meal',
    stem: 'A 64-year-old man vomits blood from a variceal bleed and swallows a large volume of it. He has eaten nothing since admission.',
    setup: { preset: 'normal' },
    intervention: { label: 'A major upper bleed is digested from inside.', inputs: { catabolicStress: 1 } },
    prompt: 'What happens to the nitrogen load his liver must clear?',
    watch: 'nitrogen load',
    correctDirection: 'rises',
    explanation:
      'The load roughly doubles without a single bite eaten, because blood is protein and the gut digests it wherever it arrives from. This is the quieter half of the nitrogen balance that the sliders keep separate from food on purpose: a bleed is a steak eaten backwards, and in a cirrhotic patient it is the commonest precipitant of encephalopathy. The clinical lesson is procedural as much as physiological — clear the blood, and the ammonia follows — which is why variceal protocols treat the gut as part of the nitrogen prescription.',
    metric: (s) => s.derived.nitrogenLoadGPerDay,
  },
  {
    id: 'valproate-blocks-the-entry',
    stem: 'A young woman stabilised on sodium valproate develops confusion. Valproate is known to switch off NAGS and CPS1, the entry step of the cycle.',
    setup: { preset: 'normal' },
    intervention: { label: 'Valproate blocks the entry step.', inputs: { liverFunctionPct: 80, enzymeCapacity: 0.5 } },
    prompt: 'What happens to her plasma ammonia?',
    watch: 'ammonia',
    correctDirection: 'rises',
    explanation:
      'Ammonia rises severalfold into the symptomatic range, because a pharmacological block at the entry step injures the same balance an inherited defect does, only milder. The case is deliberately placed between health and a true OTC defect: the orotate climbs but not to defect levels, which mirrors how drug histories sit between genes and organs in a real clerking. The actionable teaching is that hyperammonaemia with a normal liver panel and a valproate chart is the drug until proven otherwise, and stopping it reverses what no amount of lactulose would fix.',
    metric: (s) => s.derived.ammoniaUmolL,
  },
  {
    id: 'drying-raises-bun',
    stem: 'An elderly man on diuretics drinks very little for several days. His protein intake is unchanged and his liver is healthy.',
    setup: { preset: 'normal' },
    intervention: { label: 'His water intake falls to half a litre a day.', inputs: { hydrationLPerDay: 0.5 } },
    prompt: 'What happens to his BUN?',
    watch: 'BUN',
    correctDirection: 'rises',
    explanation:
      'BUN rises by nearly half while the nitrogen balance itself never moves, because the kidneys concentrate whatever urea the liver made. This is the prerenal pattern in its purest form: production steady, exit narrowed, plasma level up. Paired with the companion question showing ammonia untouched by the same manoeuvre, it teaches the single most useful habit in nitrogen interpretation — production and concentration are different arrows, and only the cycle arrow carries information about the liver.',
    metric: (s) => s.derived.bunMgDl,
  },
  {
    id: 'the-neonate-with-orotate',
    stem: 'A neonate is drowsy with a very high ammonia. His urea is low, and his urine orotate is markedly raised.',
    answer: 'otcDeficiency',
    options: ['normal', 'highProtein', 'liverFailure', 'otcDeficiency'],
    panel: [
      { label: 'Ammonia', value: (s) => s.derived.ammoniaUmolL, unit: 'umol/L', decimals: 0 },
      { label: 'Urea', value: (s) => s.derived.ureaMmolL, unit: 'mmol/L', decimals: 1 },
      { label: 'Orotic acid', value: (s) => s.derived.oroticAcidIndex, decimals: 1 },
    ],
    explanation:
      'Hyperammonaemia with a collapsed urea and a brisk orotate is the distal-block signature: CPS1 running against an OTC obstruction, the relief valve open. The cirrhotic adult shares the ammonia and the low urea but carries no orotate, because a dying entry step makes nothing to shunt. The high-protein distractor is the catering trap — raised urea with a flat ammonia and a silent shunt — which is exactly the opposite pattern in two of the three rows.',
  },
  {
    id: 'the-cirrhotic-after-dinner',
    stem: 'A cirrhotic patient is confused the morning after an ordinary dinner. His ammonia is very high, his urea is low, and his orotate is quiet.',
    answer: 'liverFailure',
    options: ['normal', 'giBleed', 'liverFailure', 'valproateBlock'],
    panel: [
      { label: 'Ammonia', value: (s) => s.derived.ammoniaUmolL, unit: 'umol/L', decimals: 0 },
      { label: 'Urea', value: (s) => s.derived.ureaMmolL, unit: 'mmol/L', decimals: 1 },
      { label: 'Orotic acid', value: (s) => s.derived.oroticAcidIndex, decimals: 1 },
    ],
    explanation:
      'Very high ammonia with low urea and a quiet shunt is whole-organ failure: nothing enters, so nothing spills sideways. The valproate case is the near neighbour and the genuinely hard distinction — a drug-blocked entry with a milder shunt and a less extreme ammonia — while the bleed shares the confusion mechanism but runs a high urea rather than a collapsed one. Reading the orotate alongside the ammonia is what separates a dying organ from a blocked enzyme, and that pair is the whole diagnostic payload of the module.',
  },
];

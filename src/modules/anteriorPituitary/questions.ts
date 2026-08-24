import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { PituitaryDerived, PituitaryInputs, PituitaryInternalState } from './engine/types';
import type { PituitaryPresetName } from './engine/presets';
import { perturbBromocriptineDose, perturbGlucoseLoad } from './engine/engine';

type Snapshot = { state: PituitaryInternalState; derived: PituitaryDerived };
export type PituitaryQuestion = ModuleQuestion<PituitaryInputs, PituitaryPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'GH', unit: 'ng/mL', value: (s) => s.derived.ghNgMl, decimals: 1 },
  { label: 'IGF-1', unit: 'ng/mL', value: (s) => s.derived.igf1NgMl, decimals: 0 },
  {
    label: 'Prolactin',
    unit: 'ng/mL',
    value: (s) => s.derived.prolactinNgMl,
    decimals: 0,
    tolerance: 0.2,
  },
  {
    label: 'Glucose test',
    value: (s) =>
      s.derived.glucoseSuppressionTest === 'fails to suppress'
        ? 2
        : s.derived.glucoseSuppressionTest === 'suppressed (normal)'
          ? 1
          : 0,
    decimals: 0,
    tolerance: 0.5,
  },
  {
    label: 'Visual fields',
    unit: '% lost',
    value: (s) => s.derived.visualFieldDefectPct,
    decimals: 0,
    tolerance: 0.3,
  },
];

const SETTLE = 200000;

export const PITUITARY_QUESTIONS: readonly PituitaryQuestion[] = [
  {
    id: 'big-hands-fails-suppression',
    stem: 'A man in his forties notes his ring no longer fits, he snores newly, and his shoe size has gone up twice in three years. Fasting GH is high.',
    answer: 'acromegaly',
    options: ['acromegaly', 'macroprolactinoma', 'antipsychoticHyperprl', 'nonFunctioningMass'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Acral growth plus new snoring is the acromegaly story, and the numbers confirm an autonomous somatotroph adenoma: GH massively elevated WITH IGF-1 high. The glucose suppression result is the diagnostic clincher — a normal axis shuts GH down under a glucose load, while the adenoma ignores hypothalamic control entirely. IGF-1 is the better screening value because it integrates days of pulsatile secretion.',
  },
  {
    id: 'amenorrhoea-galactorrhoea',
    stem: 'A young woman has amenorrhoea with bilateral milky discharge. Her prolactin is markedly raised and MRI shows a sellar mass.',
    answer: 'macroprolactinoma',
    options: ['macroprolactinoma', 'antipsychoticHyperprl', 'hypothyroidHyperprl', 'nonFunctioningMass'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Prolactin above roughly 250 in the presence of a mass means the MASS is the secretor — a macroprolactinoma. Prolactin suppresses GnRH, which is why periods stop before anything else happens. Contrast the stalk-effect pattern: a non-functioning mass lifts prolactin only moderately, never into these ranges. The treatment follows the mechanism: dopamine agonists restore the brake AND shrink the tumour.',
  },
  {
    id: 'drug-before-scan',
    stem: 'A patient on long-term antipsychotics has a prolactin of 90 ng/mL. Imaging shows a completely normal pituitary fossa.',
    answer: 'antipsychoticHyperprl',
    options: ['antipsychoticHyperprl', 'microprolactinoma', 'nonFunctioningMass', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Moderate hyperprolactinaemia with an EMPTY fossa is the signature of D2 receptor blockade — the brake is removed at the receptor, so no structural cause needs to exist. This is why the medication list is read before the MRI in hyperprolactinaemia. Stalk effect would need a mass; a microprolactinoma usually pushes higher; and the moderate band here matches drugs or TRH drive rather than autonomous secretion.',
  },
  {
    id: 'glucose-normal-axis',
    stem: 'A healthy volunteer drinks 75 g of glucose as part of a research protocol.',
    setup: { preset: 'normal' },
    intervention: { label: 'Oral glucose load given.', perturb: (state) => perturbGlucoseLoad(state) },
    prompt: 'What happens to GH?',
    watch: 'GH',
    correctDirection: 'falls',
    settleSeconds: 20000,
    observeSeconds: 4000,
    explanation:
      'It suppresses below 1 ng/mL — the normal hypothalamic-pituitary response, mediated through somatostatin release and GHRH withdrawal. The same manoeuvre is the standard screening test for acromegaly precisely BECAUSE the regulated component obeys while the adenoma does not. One test, two possible results, and the difference between them localises autonomy.',
    metric: (s) => s.derived.ghNgMl,
  },
  {
    id: 'bromocriptine-restores-brake',
    stem: 'The patient with the macroprolactinoma starts a dopamine agonist.',
    setup: { preset: 'macroprolactinoma' },
    intervention: { label: 'Bromocriptine dose given.', perturb: (state) => perturbBromocriptineDose(state) },
    prompt: 'What happens to prolactin?',
    watch: 'prolactin',
    correctDirection: 'falls',
    settleSeconds: 100000,
    observeSeconds: 300000,
    tolerance: 0.02,
    explanation:
      'It falls steeply — the agonist replaces the missing dopamine signal, closing the brake that prolactinoma secretion had overridden, and over subsequent weeks the drug actually SHRINKS adenoma tissue. A tumour treated medically into remission is rare elsewhere in oncology and routine here, which is why dopamine agonists are first-line even for large prolactinomas threatening the chiasm.',
    metric: (s) => s.state.prolactinNgMl,
  },
  {
    id: 'trh-drives-prolactin',
    stem: 'A woman with heavy postpartum bleeding never lactated, feels cold and sluggish, and her periods have not returned. TSH is undetectably low with low free T4.',
    setup: { preset: 'normal' },
    intervention: { label: 'TRH drive rises (primary hypothyroidism).', inputs: { trhStimulusUnits: 80 } },
    prompt: 'What happens to prolactin?',
    watch: 'prolactin',
    correctDirection: 'rises',
    settleSeconds: 20000,
    observeSeconds: 20000,
    explanation:
      'It rises moderately — TRH is a prolactin secretagogue, so a failing thyroid floods the lactotroph with driving signal on top of the intact dopamine brake. The elevation lands in the same band as drugs and stalk effect, never prolactinoma territory. Treat the thyroid and the prolactin follows down without any pituitary-directed therapy at all.',
    metric: (s) => s.state.prolactinNgMl,
  },
];

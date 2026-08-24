import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { PregnancyDerived, PregnancyInputs, PregnancyInternalState } from './engine/types';
import type { PregnancyPresetName } from './engine/presets';
import { perturbFeedNow, perturbStartLabour } from './engine/engine';

type Snapshot = { state: PregnancyInternalState; derived: PregnancyDerived };
export type PregnancyQuestion = ModuleQuestion<PregnancyInputs, PregnancyPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Haemoglobin', unit: 'g/dL', value: (s) => s.derived.haemoglobinGPerDl, decimals: 1 },
  {
    label: 'Cardiac output',
    unit: '% above baseline',
    value: (s) => s.derived.cardiacOutputIncreasePct,
    decimals: 0,
    tolerance: 0.15,
  },
  { label: 'PaCO2', unit: 'mmHg', value: (s) => s.derived.paCO2MmHg, decimals: 0 },
  { label: 'Creatinine', unit: 'mg/dL', value: (s) => s.derived.creatinineMgDl, decimals: 2 },
  {
    label: 'Fetal weight',
    unit: 'g',
    value: (s) => s.derived.fetalWeightG,
    decimals: 0,
    tolerance: 0.15,
  },
  { label: 'Prolactin', unit: 'ng/mL', value: (s) => s.derived.prolactinNgMl, decimals: 0, tolerance: 0.3 },
];

const SETTLE = 60000;

export const PREGNANCY_QUESTIONS: readonly PregnancyQuestion[] = [
  {
    id: 'dilution-not-deficiency',
    stem: 'A woman at 30 weeks has a haemoglobin of 11 g/dL. Her iron studies and red cell indices are entirely normal.',
    answer: 'lateSecondTrimester',
    options: ['lateSecondTrimester', 'firstTrimester', 'postpartumNoFeed', 'normalTerm'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Plasma volume expands faster than red cell mass — up to forty-five per cent versus twenty-five — so the CONCENTRATION of haemoglobin falls even as total red cells increase by a quarter. The trough near 30 weeks is physiological, and normal indices here confirm dilution rather than deficiency. Treating it reflexively risks the opposite error: missing true anaemia hiding behind a number that looks acceptable only against non-pregnant ranges.',
  },
  {
    id: 'term-gas-looks-abnormal',
    stem: 'A woman at term has a blood gas taken during a panic episode in casualty. PaCO2 is 30 mmHg with bicarbonate 20.',
    answer: 'normalTerm',
    options: ['normalTerm', 'firstTrimester', 'preEclampsiaIugr', 'twins'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'That is the normal term picture: progesterone drives ventilation up from the first trimester, dropping PaCO2 toward 30, and the kidney excretes bicarbonate to match — pH stays barely alkalaemic near 7.44. A low CO2 with the bicarbonate falling ALONGSIDE it is compensation; a low CO2 with normal bicarbonate would be the pathological pattern. Pregnancy quietly rewrites every reference range she will ever be judged against.',
  },
  {
    id: 'placental-failure-syndrome',
    stem: 'A woman at 34 weeks has rising blood pressure and the fundal height measures small. The fetus weighs well below the 10th centile.',
    answer: 'preEclampsiaIugr',
    options: ['preEclampsiaIugr', 'normalTerm', 'twins', 'postpartumFeeding'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A failing placenta produces BOTH findings from one cause: poor perfusion restricts growth along the fetal weight curve, while the malplacentated uterus drives maternal vasoconstriction that reverses the normal pregnancy fall in SVR. Hypertension emerging after mid-pregnancy with a small-for-dates fetus is pre-eclampsia with IUGR until proven otherwise — one organ failing on both sides of the circulation at once.',
  },
  {
    id: 'ferguson-acceleration',
    stem: 'Labour begins spontaneously at term with irregular tightenings.',
    setup: { preset: 'normalTerm' },
    intervention: { label: 'Labour onset.', perturb: (state) => perturbStartLabour(state) },
    prompt: 'What happens to oxytocin?',
    watch: 'oxytocin',
    correctDirection: 'rises',
    settleSeconds: 2000,
    observeSeconds: 4000,
    explanation:
      'It climbs progressively — cervical stretch releases oxytocin, oxytocin strengthens contractions, stronger contractions stretch the cervix further. That positive feedback is why dilation accelerates rather than progressing linearly, and why the signal keeps growing instead of settling. It also gives labour its two clinical handles: exogenous oxytocin augments exactly this loop, and delivery removes the stretch stimulus that sustains it.',
    metric: (s) => s.derived.oxytocinRelative,
  },
  {
    id: 'milk-comes-in-day-three',
    stem: 'A mother delivers her baby and asks why she has no milk yet, although her breasts felt full during pregnancy.',
    setup: { preset: 'normalTerm' },
    intervention: { label: 'Delivery completed; progesterone withdraws.', inputs: { deliveredMode: 1 } },
    prompt: 'What happens to milk supply over the following days?',
    watch: 'milk supply',
    correctDirection: 'rises',
    settleSeconds: 60000,
    observeSeconds: 520000,
    tolerance: 0.03,
    explanation:
      'It rises after a delay — prolactin has been priming the breast for months, but progesterone BLOCKED secretory activation until the placenta departed. Once progesterone collapses, the primed gland switches on: lactogenesis II, clinically milk coming in on day two or three. The fullness she felt antenatally was preparation under hormonal brake, not supply waiting to be released.',
    metric: (s) => s.state.milkSupplyMlPerDay,
  },
  {
    id: 'supply-follows-demand',
    stem: 'The same mother supplements heavily with formula and stops putting the baby to the breast.',
    setup: { preset: 'postpartumFeeding' },
    intervention: { label: 'Suckling stops.', inputs: { sucklingDrivePct: 5 } },
    prompt: 'What happens to milk supply?',
    watch: 'milk supply',
    correctDirection: 'falls',
    settleSeconds: 700000,
    observeSeconds: 250000,
    tolerance: 0.02,
    explanation:
      'It falls away over days — supply is not stored, it is MAINTAINED by suckling-driven prolactin. Remove the nipple stimulus and prolactin decays back toward baseline while the gland involutes. Demand matching supply is the whole logic of breastfeeding management: frequency and effective attachment ARE the intervention, because nothing given to the mother raises production once the signal is gone.',
    metric: (s) => s.state.milkSupplyMlPerDay,
  },
  {
    id: 'let-down-oxytocin',
    stem: 'A breastfeeding mother hears her baby cry and feels milk eject before the feed properly begins.',
    setup: { preset: 'postpartumFeeding' },
    intervention: { label: 'Let-down reflex triggered.', perturb: (state) => perturbFeedNow(state) },
    prompt: 'What happens to oxytocin?',
    watch: 'oxytocin',
    correctDirection: 'rises',
    settleSeconds: 3000,
    observeSeconds: 400,
    tolerance: 0.02,
    explanation:
      'It spikes — let-down is an OXYTOCIN event, contracting myoepithelial cells to eject milk that has already been made, quite distinct from the slower prolactin pathway that produces it. The conditioned trigger (the cry, not just the suckle) shows how far upstream the reflex runs. This division of labour is why some drugs suppress ejection while production continues, and why stress inhibits let-down long before it touches supply.',
    metric: (s) => s.derived.oxytocinRelative,
  },
];

import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { AdrenalCortexDerived, AdrenalCortexInputs, AdrenalCortexInternalState } from './engine/types';
import type { AdrenalCortexPresetName } from './engine/presets';

type Snapshot = { state: AdrenalCortexInternalState; derived: AdrenalCortexDerived };
export type AdrenalCortexQuestion = ModuleQuestion<AdrenalCortexInputs, AdrenalCortexPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Cortisol', unit: '% of normal', value: (s) => s.derived.effectiveCortisol, decimals: 0 },
  {
    label: 'Mineralocorticoid',
    unit: '% of normal',
    value: (s) => s.derived.mineralocorticoidActivity,
    decimals: 0,
    tolerance: 0.2,
  },
  { label: 'Androgens', unit: '% of normal', value: (s) => s.derived.androgens, decimals: 0, tolerance: 0.25 },
  { label: '17-OHP marker', value: (s) => s.derived.marker17ohp, decimals: 0, tolerance: 0.3 },
  {
    label: 'Blood pressure tendency',
    value: (s) => (s.derived.hypertensionFromDoc ? 1 : s.derived.saltWasting ? -1 : 0),
    decimals: 0,
    tolerance: 0.5,
  },
];

const SETTLE = 40000;

export const ADRENAL_QUESTIONS: readonly AdrenalCortexQuestion[] = [
  {
    id: 'classic-salt-waster',
    stem: 'A week-old infant is vomiting, dehydrated with hyponatraemia and hyperkalaemia, and has ambiguous genitalia.',
    answer: 'cah21SaltWasting',
    options: ['cah21SaltWasting', 'cah11', 'cah3b', 'cah17'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Salt-losing crisis PLUS virilisation is the classic 21-hydroxylase presentation: the block hits cortisol and aldosterone together while diverted flux floods androgens. The 17-OHP marker is enormous because the substrate piles up immediately before the blocked step. Contrast 3β-HSD, which also wastes salt but UNDER-virilises with a LOW 17-OHP — same crisis, opposite genital finding, different enzyme.',
  },
  {
    id: 'hypertensive-cah',
    stem: 'An adolescent with ambiguous genitalia at birth is found to have hypertension and low renin. Her potassium is normal.',
    answer: 'cah11',
    options: ['cah11', 'cah21SaltWasting', 'cah17', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Virilisation WITH hypertension means DOC — trapped when 11β-hydroxylase fails — provides mineralocorticoid activity that prevents salt-wasing while driving pressure up. Androgens rise exactly as in 21-OH because flux diverts around the block. The pair "high androgens + hypertensive" has only one enzymatic answer; 21-OH gives high androgens with a crashing pressure instead.',
  },
  {
    id: 'undervirilised-hypertensive',
    stem: 'A teenager raised as female has never menstruated, lacks secondary sexual development entirely, and is hypertensive with low renin. Chromosomes are XY.',
    answer: 'cah17',
    options: ['cah17', 'cah11', 'cah3b', 'cah21SimpleVirilising'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      '17α-hydroxylase failure removes BOTH cortisol and the whole androgen pathway: an XY child cannot virilise at all, while substrate floods the mineralocorticoid arm and causes DOC-driven hypertension. Every other CAH block either virilises or wastes salt — this is the one that does neither, which is why the combination of sexual infantilism WITH hypertension points here.',
  },
  {
    id: 'acth-flogs-the-blocked-gland',
    stem: 'A child with untreated classic CAH becomes ill from a chest infection and the family notices darkening of the skin and worsening fast growth of the clitoris.',
    setup: { preset: 'cah21SaltWasting' },
    intervention: { label: 'ACTH drive rises with illness stress.', inputs: { acthDrivePct: 180 } },
    prompt: 'What happens to adrenal androgen production?',
    watch: 'androgens',
    correctDirection: 'rises',
    settleSeconds: 20000,
    observeSeconds: 30000,
    explanation:
      'It climbs further — the blocked gland cannot make cortisol, so ACTH rises unchecked and drives MORE substrate into the diverted androgen pathway. Illness therefore worsens both the crisis and the virilisation simultaneously. This feedback loop is also why treatment works twice over: replacing cortisol suppresses ACTH, collapsing the drive behind the androgen excess as well as fixing the deficiency.',
    metric: (s) => s.derived.androgens,
  },
  {
    id: 'replacement-covers-deficit',
    stem: 'The same child is started on hydrocortisone and fludrocortisone at correct doses.',
    setup: { preset: 'cah21SaltWasting' },
    intervention: { label: 'Replacement therapy optimised.', inputs: { replacementTherapyPct: 85 } },
    prompt: 'What happens to addisonian crisis risk?',
    watch: 'crisis risk',
    correctDirection: 'falls',
    settleSeconds: 20000,
    observeSeconds: 20000,
    explanation:
      'It falls sharply — replacement supplies what the block destroys and, just as importantly, suppresses the ACTH drive that had been amplifying precursor pile-up. Note what does NOT change: the endogenous enzymatic block remains, which is why lifelong therapy and stress-dosing during illness are non-negotiable rather than a cure.',
    metric: (s) => s.derived.addisonianCrisisRiskPct,
  },
];

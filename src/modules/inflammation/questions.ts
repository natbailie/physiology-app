import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { InflammationDerived, InflammationInputs, InflammationInternalState } from './engine/types';
import type { InflammationPresetName } from './engine/presets';
import { perturbNewInsult } from './engine/engine';

type Snapshot = { state: InflammationInternalState; derived: InflammationDerived };
export type InflammationQuestion = ModuleQuestion<InflammationInputs, InflammationPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  {
    label: 'Load',
    value: (s) => s.derived.insultLoad,
    decimals: 2,
    tolerance: 0.08,
  },
  {
    label: 'CRP',
    unit: 'mg/L',
    value: (s) => s.derived.crpMgL,
    decimals: 0,
    tolerance: 0.15,
  },
  {
    label: 'Neutrophils',
    unit: '×10⁹/L',
    value: (s) => s.derived.neutrophilCount10e9PerL,
    decimals: 1,
  },
  {
    label: 'Pus',
    value: (s) => s.derived.pusBurden,
    decimals: 2,
    tolerance: 0.12,
  },
  {
    label: 'Temp',
    unit: '°C',
    value: (s) => s.derived.coreTemperatureC,
    decimals: 1,
  },
];

const SETTLE = 10800;

export const INFLAMMATION_QUESTIONS: readonly InflammationQuestion[] = [
  {
    id: 'antibiotics-clear-the-infection',
    stem: 'A man presents with a hot, swollen calf — classic cellulitis. He is otherwise well and afebrile. Bloods show a raised CRP but a normal white cell count.',
    setup: { perturb: (s) => perturbNewInsult(s, 45) },
    answer: 'acuteCellulitis',
    options: ['acuteCellulitis', 'goutFlare', 'abscessFormation', 'immunosuppressedSmoulder'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The preset lands on a moderate bacterial load with intact immunity: mediators and neutrophils rise in sequence, CRP climbs into the tens, and the cardinal signs are prominent. A gout flare would be crystal-driven and antibiotics would make no difference; an abscess would show pus accumulating behind a failing immune response; immunosuppressed smoulder would show a blunted reaction with the load growing quietly.',
  },
  {
    id: 'the-patient-who-does-not-improve',
    stem: 'A woman with poorly controlled diabetes develops a thigh abscess. She has been on oral flucloxacillin for three days but the swelling is worsening and she now has swinging pyrexia.',
    setup: { preset: 'abscessFormation', perturb: (s) => perturbNewInsult(s, 78) },
    answer: 'abscessFormation',
    options: ['abscessFormation', 'acuteCellulitis', 'immunosuppressedSmoulder', 'severeBacterialLoad'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Abscess formation is the giveaway: pus has collected faster than the immune response can drain it. The pus readout is well above the threshold and the classification confirms it. Cellulitis would show high load without a significant pus collection; immunosuppressed smoulder requires blunted immunity on both the neutrophil and steroid axes; severe load would push sirs without the localised collection.',
  },
  {
    id: 'gout-mimics-infection',
    stem: 'A man wakes at 3 am with a fiery red, exquisitely tender great toe. He is febrile and his CRP is raised. Empirical antibiotics are started.',
    setup: { preset: 'goutFlare', perturb: (s) => perturbNewInsult(s, 60) },
    answer: 'goutFlare',
    options: ['goutFlare', 'acuteCellulitis', 'abscessFormation', 'severeBacterialLoad'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The load is driven by sterile crystals, not bacteria — and that distinction is everything. Adding antibiotics does nothing to a crystal burden; the trajectory is identical with or without them. In cellulitis the load would fall faster with antibiotics; an abscess would show pus; severe bacterial load would show sirs with a much higher CRP. The crystal type is the teaching point: fever and a raised CRP do not always mean infection.',
  },
  {
    id: 'the-masked-infection',
    stem: 'A transplant recipient on high-dose prednisolone develops a quiet-looking cellulitis. His temperature is only 37.8 °C and his CRP is disproportionately low for the degree of swelling.',
    setup: { preset: 'immunosuppressedSmoulder', perturb: (s) => perturbNewInsult(s, 55) },
    answer: 'immunosuppressedSmoulder',
    options: ['immunosuppressedSmoulder', 'acuteCellulitis', 'abscessFormation', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Steroids mask the outward signs while letting the infection run. The vasodilation index is blunted — the redness and heat the clinician expects are suppressed — but the load is not. It sits at a level that would produce obvious inflammation in an immunocompetent host. This is the double-edged sword of corticosteroids: they make the patient look better while the microbiology gets worse.',
  },
  {
    id: 'antibiotics-faster-than-immunity',
    stem: 'A man with cellulitis is offered IV flucloxacillin. His immune function is normal.',
    setup: { preset: 'acuteCellulitis', perturb: (s) => perturbNewInsult(s, 45) },
    intervention: { label: 'High-dose IV antibiotics are started.', inputs: { antibioticEfficacyPct: 85 } },
    prompt: 'What happens to the bacterial load?',
    watch: 'load',
    correctDirection: 'falls',
    settleSeconds: 86400,
    observeSeconds: 43200,
    explanation:
      'It drops sharply. Antibiotics at full efficacy remove bacteria far faster than neutrophils and macrophages can alone — the entire course of the infection is compressed from a week into a day or two. CRP follows the load down. This is why early antibiotics in sepsis matter: every hour of delay lets the bacterial population grow while the immune system ramps up at its own biological pace.',
    metric: (s) => s.derived.insultLoad,
  },
  {
    id: 'steroids-let-it-run',
    stem: 'A woman with severe asthma is commenced on high-dose prednisolone. She coincidentally develops a small skin infection on her forearm.',
    setup: { preset: 'acuteCellulitis', perturb: (s) => perturbNewInsult(s, 45) },
    intervention: { label: 'Prednisolone is started at high dose.', inputs: { steroidDosePct: 75 } },
    prompt: 'What happens to the infection?',
    watch: 'load',
    correctDirection: 'rises',
    settleSeconds: 86400,
    observeSeconds: 43200,
    explanation:
      'The load rises — and the cardinal signs fall. Steroids blunt vasodilation and mediator release, so the redness and heat fade even as the bacteria multiply unchecked. CRP drops because the hepatic acute-phase response is cytokine-driven and steroids suppress the cytokines. This is the clinical danger of steroids over infection: the patient feels better, looks better, and is worse.',
    metric: (s) => s.derived.insultLoad,
  },
  {
    id: 'drain-the-abscess',
    stem: 'A patient has a walled-off abscess that has failed to respond to antibiotics alone. The surgical team performs incision and drainage.',
    setup: { preset: 'abscessFormation', perturb: (s) => perturbNewInsult(s, 78) },
    intervention: { label: 'The abscess is drained.', inputs: { sourceControlPct: 85 } },
    prompt: 'What happens to the pus burden?',
    watch: 'pus',
    correctDirection: 'falls',
    settleSeconds: 86400,
    observeSeconds: 43200,
    explanation:
      'Pus falls dramatically because drainage does what no antibiotic can: it physically removes the collection that drugs cannot penetrate. The wall of an abscess is avascular — antibiotics circulating in the blood cannot reach the bacteria thriving inside. Source control is the principle: when a collection exists, no amount of drug will compensate for not draining it.',
    metric: (s) => s.derived.pusBurden,
  },
  {
    id: 'foreign-body-never-clears',
    stem: 'A woman has a retained suture from an operation six weeks ago. The site is chronically inflamed and a small sinus has formed.',
    setup: { preset: 'foreignBodySuture', perturb: (s) => perturbNewInsult(s, 55) },
    answer: 'foreignBodySuture',
    options: ['foreignBodySuture', 'abscessFormation', 'acuteCellulitis', 'immunosuppressedSmoulder'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A foreign body cannot be degraded by neutrophils or macrophages — the immune system has no enzymatic answer to a suture. The load stays constant, the acute wave gives way to chronic inflammation, and over weeks a granuloma may organise around the material. This is why retained foreign bodies cause persistent sinuses: the immune system mounts a response it can never finish.',
  },
];

import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { SomaticDerived, SomaticInputs, SomaticInternalState } from './engine/types';
import type { SomaticPresetName } from './engine/presets';
import { perturbOpioidBolus } from './engine/engine';

type Snapshot = { state: SomaticInternalState; derived: SomaticDerived };
export type SomaticQuestion = ModuleQuestion<SomaticInputs, SomaticPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Pain score', unit: '/10', value: (s) => s.derived.perceivedPainScore, decimals: 1 },
  { label: 'Touch below (left)', unit: '%', value: (s) => s.derived.touchLeftPct, decimals: 0, tolerance: 0.15 },
  { label: 'Touch below (right)', unit: '%', value: (s) => s.derived.touchRightPct, decimals: 0, tolerance: 0.15 },
  {
    label: 'Pain/temp below (left)',
    unit: '%',
    value: (s) => s.derived.painTempLeftPct,
    decimals: 0,
    tolerance: 0.15,
  },
  {
    label: 'Pain/temp below (right)',
    unit: '%',
    value: (s) => s.derived.painTempRightPct,
    decimals: 0,
    tolerance: 0.15,
  },
  {
    label: 'Segmental pain/temp',
    unit: '%',
    value: (s) => s.derived.segmentalPainTempPct,
    decimals: 0,
    tolerance: 0.15,
  },
];

const SETTLE = 5000;

export const SOMATIC_QUESTIONS: readonly SomaticQuestion[] = [
  {
    id: 'hemicord-dissociation',
    stem: 'After a stab wound to the back, a patient cannot feel light touch or tell the position of his left leg below the injury, yet has lost pinprick sensation on the right.',
    answer: 'brownSequardLeft',
    options: ['brownSequardLeft', 'anteriorCord', 'completeTransection', 'syringomyelia'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The dissociation IS the localisation. Dorsal columns ascend ipsilaterally to the medulla, so left-sided touch and joint-position loss means the lesion is on the left; spinothalamic fibres crossed within a segment of entry, so right-sided pinprick loss is also the left hemi-cord. One side injured, two modalities lost on opposite sides — Brown-Séquard. A complete transection would lose everything bilaterally; anterior cord syndrome would spare the touch.',
  },
  {
    id: 'anterior-cord-spared-columns',
    stem: 'Following a period of low blood pressure during surgery, a patient wakes unable to feel pinprick in either leg with weak legs, but can still feel the bed sheets and knows where her toes are.',
    answer: 'anteriorCord',
    options: ['anteriorCord', 'brownSequardLeft', 'syringomyelia', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Bilateral pain and temperature loss with dorsal columns intact is the signature of damage to both anterior quadrants — the territory of the anterior spinal artery, vulnerable to hypoperfusion. The corticospinal tracts travel there too, hence the weakness, while vibration and position survive on their posterior-column supply at the other side of the cord. Syringomyelia would take pain segmentally at a level, not bilaterally down the whole length.',
  },
  {
    id: 'syrinx-cape-loss',
    stem: 'A man with a Chiari malformation has stopped noticing hot water on his hands, though he feels the tap fine with his forearms. Power and brisk touch are intact everywhere.',
    answer: 'syringomyelia',
    options: ['syringomyelia', 'anteriorCord', 'brownSequardLeft', 'laBlock'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Spinothalamic fibres cross the cord IN front OF the central canal, so an expanding syrinx picks them off segmentally where they decussate — a cape-like loss of pain and temperature at those levels while everything ascending in columns passes untouched. Hands that burn unnoticed are the classic presentation. The dissociation here is by level rather than by side, which separates it from every tract-level pattern.',
  },
  {
    id: 'rubbing-closes-gate',
    stem: 'A child scalds a finger and immediately rubs the sore area hard against her jumper, which genuinely seems to help.',
    setup: { preset: 'acuteBurn' },
    intervention: { label: 'Rubbing/counterstimulus applied.', inputs: { rubbingGateDrive: 80 } },
    prompt: 'What happens to the pain score?',
    watch: 'pain score',
    correctDirection: 'falls',
    settleSeconds: 3000,
    observeSeconds: 2000,
    explanation:
      'It falls — Aβ traffic recruited by rubbing drives inhibitory interneurons in the dorsal horn and closes the gate on C-fibre transmission, before anything reaches consciousness. The injury is untouched; only its reading changes. Transcutaneous electrical nerve stimulation, and the relief of shaking a banged elbow, run on exactly this circuit — modulation happens at the first synapse, not by willpower.',
    metric: (s) => s.state.painRating,
  },
  {
    id: 'opioid-descending-suppression',
    stem: 'A patient with a fractured radius in a temporary splint is in moderate pain. Opioid analgesia is given.',
    setup: { preset: 'normal', inputs: { nociceptiveStimulusDrive: 45 } },
    intervention: { label: 'Opioid bolus delivered.', perturb: (state) => perturbOpioidBolus(state) },
    prompt: 'What happens to the pain score?',
    watch: 'pain score',
    correctDirection: 'falls',
    settleSeconds: 2500,
    observeSeconds: 300,
    explanation:
      'It falls — opioids strengthen the descending PAG/RVM brake and act directly in the dorsal horn, biasing the gate closed on nociceptive transmission. Nothing about the fracture has changed; the system reading it has. This descending pathway is why stress and distraction can leave soldiers unaware of serious wounds, and why opioid side effects track the same machinery everywhere rather than just at the injury.',
    metric: (s) => s.state.painRating,
  },
  {
    id: 'allodynia-touch-hurts',
    stem: 'A patient recovering from shingles finds that the weight of a shirt against the affected skin produces burning pain. Nociceptor activity in that patch is minimal.',
    setup: { preset: 'neuropathicAllodynia' },
    intervention: { label: 'Light touch stimulus applied to sensitised skin.', inputs: { touchStimulusDrive: 60 } },
    prompt: 'What happens to the pain score?',
    watch: 'pain score',
    correctDirection: 'rises',
    settleSeconds: 6000,
    observeSeconds: 3000,
    explanation:
      'It rises from light touch — the defining paradox of allodynia. Inflammatory and neuropathic mediators have lowered peripheral thresholds so far that Aβ fibres now drive pain pathways directly, and central wind-up amplifies what arrives. The nociceptors are nearly silent; the machinery behind them answers instead. This is why neuropathic pain responds to gabapentinoids and tricyclics acting on the sensitised machinery rather than to analgesia aimed at the injury.',
    metric: (s) => s.state.painRating,
  },
  {
    id: 'differential-block-pain-first',
    stem: 'A patient receiving incremental epidural local anaesthetic reports the surgical site feels "gone" but she can still feel the sheet against her legs.',
    setup: { preset: 'normal', inputs: { nociceptiveStimulusDrive: 70 } },
    intervention: {
      label: 'Sodium-channel block rises to 75%.',
      inputs: { localAnaestheticBlock: 75 },
    },
    prompt: 'What happens to nociceptive (C-fibre) traffic?',
    watch: 'C-fibre traffic',
    correctDirection: 'falls',
    settleSeconds: 1000,
    observeSeconds: 800,
    explanation:
      'It falls steeply — local anaesthetics silence small nociceptive fibres at concentrations where thick Aβ touch fibres still conduct, because block vulnerability scales inversely with fibre size. The result is the exam-classic differential: pain and temperature abolished first, light touch last. Read the Aβ traffic alongside and you see why she still feels pressure — the two modalities do not disappear together.',
    metric: (s) => s.derived.cFibreTraffic,
  },
];

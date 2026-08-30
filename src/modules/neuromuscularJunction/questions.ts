import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { NmjDerived, NmjInputs, NmjState } from './engine/types';
import type { NmjPresetName } from './engine/presets';

type Snapshot = { state: NmjState; derived: NmjDerived };
export type NmjQuestion = ModuleQuestion<NmjInputs, NmjPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Safety factor', value: (s) => s.derived.safetyFactor, decimals: 2 },
  { label: 'Force', unit: '%', value: (s) => s.derived.muscleForcePercent, decimals: 0 },
  { label: 'Train-of-four ratio', value: (s) => s.derived.trainOfFourRatio, decimals: 2, tolerance: 0.04 },
  { label: 'High-rate response', value: (s) => s.derived.postTetanicRatio, decimals: 2, tolerance: 0.1 },
  { label: 'Quanta released', value: (s) => s.derived.quantalContent, decimals: 0 },
];

const SETTLE = 120;

export const NMJ_QUESTIONS: readonly NmjQuestion[] = [
  {
    id: 'worse-with-repetition',
    stem: 'A patient has drooping eyelids and double vision that are worse in the evening. On testing, their weakness increases the longer they hold a posture.',
    answer: 'myastheniaGravis',
    options: ['myastheniaGravis', 'lambertEaton', 'botulism', 'normal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The train-of-four decrements and the high-rate response barely improves — repetition makes this junction worse, which places the lesion at the end plate. Note the quanta released are entirely normal: the nerve is doing its job and the message is not being received. Note too how far the safety factor has already fallen before any weakness appeared, which is why this disease declares itself abruptly after months of silent receptor loss.',
  },
  {
    id: 'better-with-repetition',
    stem: 'A patient with a smoking history has proximal weakness and absent reflexes. Curiously, their grip strengthens after a few seconds of sustained effort.',
    answer: 'lambertEaton',
    options: ['lambertEaton', 'myastheniaGravis', 'nondepolarisingBlock', 'botulism'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The high-rate response increments several-fold, and that single finding places the lesion in the nerve terminal rather than the end plate. Antibodies against presynaptic calcium channels mean too little is released to begin with — but calcium accumulates during rapid firing and release goes as a steep power of calcium, so the junction recovers dramatically when driven. A patient who is stronger after exercising has a presynaptic problem, and in this context that history points at an underlying small-cell carcinoma.',
  },
  {
    id: 'fade-distinguishes-blockers',
    stem: 'An anaesthetist is monitoring neuromuscular blockade with a peripheral nerve stimulator. The four responses in the train are progressively smaller.',
    answer: 'nondepolarisingBlock',
    options: ['nondepolarisingBlock', 'depolarisingBlock', 'normal', 'lambertEaton'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Fade means a competitive antagonist. It occupies presynaptic autoreceptors as well as postsynaptic ones, and those autoreceptors are what normally mobilise extra vesicles during a train — so mobilisation fails and each response is smaller than the last. A depolarising agonist does not touch them, so its block does not fade this way. The distinction is not academic: an anticholinesterase reverses this block and would deepen the other.',
  },
  {
    id: 'release-fails-first-step',
    stem: 'An infant is floppy with a weak cry and poor feeding after several days of constipation. Their weakness does not improve with repeated stimulation at any rate.',
    answer: 'botulism',
    options: ['botulism', 'lambertEaton', 'myastheniaGravis', 'depolarisingBlock'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The quanta released have collapsed, and unlike Lambert-Eaton no amount of stimulation recruits more. The toxin cleaves the snare proteins that dock vesicles to the membrane, so release fails at the very first step and calcium accumulating in the terminal has nothing to act on. That is the distinction from a channel lesion, where the machinery is intact and simply under-triggered — and it is why recovery requires the terminal to grow new endings rather than merely to be driven harder.',
  },
  {
    id: 'anticholinesterase-treats-mg',
    stem: 'A patient with myasthenia gravis is started on pyridostigmine. Their receptor numbers are unchanged by the drug.',
    setup: { preset: 'myastheniaGravis' },
    intervention: { label: 'Acetylcholinesterase activity is reduced to 45%.', inputs: { acetylcholinesteraseActivity: 0.45 } },
    prompt: 'What happens to muscle force?',
    watch: 'muscle force',
    correctDirection: 'rises',
    settleSeconds: 60,
    observeSeconds: 60,
    explanation:
      'Force improves, without a single receptor being replaced. Blocking the enzyme that clears acetylcholine means each quantum acts for longer and on more receptors, so the ones that survive are driven harder and the end-plate potential climbs back over threshold. It treats the consequence rather than the cause, which is why it is symptomatic therapy and why immunosuppression is what addresses the disease itself.',
    metric: (s) => s.derived.muscleForcePercent,
  },
  {
    id: 'too-much-anticholinesterase',
    stem: 'A patient is exposed to an organophosphate pesticide. Acetylcholinesterase is almost completely inhibited, so transmitter accumulates at every junction.',
    setup: { preset: 'normal' },
    intervention: { label: 'Acetylcholinesterase falls to 8% of normal.', inputs: { acetylcholinesteraseActivity: 0.08 } },
    prompt: 'What happens to muscle force?',
    watch: 'muscle force',
    correctDirection: 'falls',
    settleSeconds: 60,
    observeSeconds: 120,
    explanation:
      'Force falls, which is the reverse of what a therapeutic dose does and is the point of the question. Transmitter accumulates until the end plate is persistently depolarised, and a persistently depolarised end plate cannot fire the fibre — the sodium channels around it sit inactivated. Too much agonist produces a block of exactly the same kind as a depolarising relaxant. Fasciculation comes first, then paralysis, and more anticholinesterase deepens it rather than reversing it.',
    metric: (s) => s.derived.muscleForcePercent,
  },
];

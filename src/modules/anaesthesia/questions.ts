import type { PredictQuestion, PatternQuestion } from '@/shared/assessment/types';
import type { AnaesthesiaPresetName } from './engine/presets';
import type { AnaesthesiaDerived, AnaesthesiaInputs } from './engine/types';

type Snapshot = { state: { simTimeSeconds: number; alveolarAgentPct: number; effectSiteAgentPct: number }; derived: AnaesthesiaDerived };

const alveolar = (s: Snapshot): number => s.derived.alveolarAgentPct;
const t90 = (s: Snapshot): number => s.derived.timeTo90PctMinutes;
const inspired = (s: Snapshot): number => s.derived.inspiredFractionPct;
const absorbed = (s: Snapshot): number => s.derived.absorptionIndex;
const progress = (s: Snapshot): number => s.derived.washInProgress;

export const ANAESTHESIA_QUESTIONS: (PredictQuestion<AnaesthesiaInputs, AnaesthesiaPresetName, Snapshot> | PatternQuestion<AnaesthesiaPresetName, Snapshot>)[] = [
  {
    id: 'dial-raises-the-ceiling',
    stem: 'A patient is being maintained on sevoflurane at 2%, settled and asleep.',
    setup: { preset: 'sevofluraneInduction', inputs: { dialPct: 2 } },
    intervention: { label: 'The vaporizer is turned up to 4%.', inputs: { dialPct: 4 } },
    prompt: 'What happens to the alveolar concentration?',
    watch: 'Alveolar concentration',
    correctDirection: 'rises',
    explanation:
      'The alveolar level relaxes toward the new ceiling: a higher dial delivers more agent at the Y-piece, more reaches the alveoli after the same wash-in, and the monitor climbs until it sits on a higher plateau. The wash-in time is unchanged, so the climb has the same shape as the earlier one, just pointed at a different ceiling — which is exactly why stepping the dial up feels "faster" than turning it on once, when the circuit starts empty.',
    metric: alveolar,
  },
  {
    id: 'waking-is-the-same-curve-falling',
    stem: 'At the end of a case the vaporizer holds the patient at a deep plane.',
    setup: { preset: 'sevofluraneInduction' },
    intervention: { label: 'The dial is dropped to zero at high fresh gas flow.',
      inputs: { dialPct: 0 } },
    prompt: 'What happens to the alveolar concentration?',
    watch: 'Alveolar concentration',
    correctDirection: 'falls',
    explanation:
      'Nothing is removed from the patient; the circuit is simply filled with fresh gas that carries no agent, and the alveolar level falls along the same exponential that once raised it. High fresh gas flow makes the slope steep and the wake quick — the flush valve IS the pharmacokinetics, applied with a knob. The learner watches the mirror image of induction, which is the whole secret of emergence.',
    metric: alveolar,
  },
  {
    id: 'solubility-is-the-timing',
    stem: 'A halothane induction is grinding: the alveolar level is creeping toward the dial.',
    setup: { preset: 'halothaneSlowWashin' },
    intervention: { label: 'The agent is switched to desflurane.',
      inputs: { bloodGasSolubility: 0.45 } },
    prompt: 'What happens to the minutes to reach 90% of the plateau?',
    watch: 'Minutes to 90%',
    correctDirection: 'falls',
    explanation:
      'The blood:gas partition coefficient literally sets the speed limit: halothane dissolves into the blood far more readily, so the sink is bigger and the wash-in crawls; desflurane barely dissolves, the sink stays small, and the same curve reaches 90% in a fraction of the time. This is the single most examined concept in volatile anaesthesia — one number on a bottle label, and it predicts every induction you will ever watch.',
    metric: t90,
  },
  {
    id: 'low-flow-dilutes-the-dial',
    stem: 'A learner turns a maintenance sevoflurane down to a "minimal flow" setting for economy.',
    setup: { preset: 'sevofluraneInduction', inputs: { dialPct: 2, freshGasFlowLMin: 2 } },
    intervention: { label: 'The fresh gas flow is reduced to 1 L/min.',
      inputs: { freshGasFlowLMin: 1 } },
    prompt: 'What happens to the inspired fraction?',
    watch: 'Inspired fraction',
    correctDirection: 'falls',
    explanation:
      'At a low fresh gas flow the patient re-breathes a larger share of the gas, and the re-breathed gas was half used already: the effective inspired concentration at the Y-piece falls even though the dial never moved. This is why "two percent on the dial" stops being true on low flow — the inspired fraction reading is the remedy for that particular lie, and it drops by a clear step here.',
    metric: inspired,
  },
  {
    id: 'high-output-absorbs-more',
    stem: 'Two patients are started on identical sevoflurane settings; one has a high cardiac output.',
    setup: { preset: 'sevofluraneInduction' },
    intervention: { label: 'A high-output patient is connected instead.',
      inputs: { cardiacOutputLMin: 8 } },
    prompt: 'What happens to the agent absorption?',
    watch: 'Agent absorption',
    correctDirection: 'rises',
    explanation:
      'Agent absorption is roughly solubility times cardiac output times what is already in the alveoli. The high-output patient presents more blood to the lung gas per minute, so more agent leaves the gas and enters the body with every pass — the same dial, a bigger extraction. It is the same arithmetic as a sponge in a running tap: the flow rate does the work, which is why output matters as much as the setting.',
    metric: absorbed,
  },
  {
    id: 'flush-cheats-the-wash-in',
    stem: 'On a low-flow circuit the wash-in is taking its time and surgery is waiting.',
    setup: { preset: 'lowFlowRebreathing' },
    intervention: { label: 'The flow is cranked to 10 L/min.',
      inputs: { freshGasFlowLMin: 10 } },
    prompt: 'What happens to the minutes to reach 90% of the plateau?',
    watch: 'Minutes to 90%',
    correctDirection: 'falls',
    explanation:
      'The minutes-to-90% is dominated by how fast fresh gas replaces the circuit: triple the flow and the circuit wash-in constant shrinks by the same factor. That is the whole trick of a smooth induction — a high fresh gas flow during the first minutes is what "charging the circuit" means, and the dial alone cannot do it. The learner sees the clock on the wash-in move, not the dial.',
    metric: t90,
  },
  {
    id: 'zero-dial-turns-progress-off',
    stem: 'A patient has just arrived in recovery with the vaporizer still open.',
    setup: { preset: 'emergenceWashout', inputs: { dialPct: 0 } },
    intervention: { label: 'The dial is opened to 2% again. ', inputs: { dialPct: 2 } },
    prompt: 'What happens to the wash-in progress?',
    watch: 'Wash-in progress',
    correctDirection: 'rises',
    explanation:
      'With the dial at zero the equilibrium ceiling is zero and wash-in progress reads zero — the patient is fully washed out. Open the dial again and the alveolar level is no longer chasing nothing: it climbs toward a real ceiling, and the progress fraction rises from nil toward one. Emergence and induction are the same curve, distinguished only by which way the ceiling moved.',
    metric: progress,
  },
  {
    id: 'pattern-fastest-ceiling',
    stem: 'Four anaesthetics are running in parallel tracks; which one reaches its own plateau fastest?',
    answer: 'desfluraneRapidWashin',
    options: ['desfluraneRapidWashin', 'halothaneSlowWashin', 'lowFlowRebreathing', 'sevofluraneInduction'],
    panel: [
      { label: 'Minutes to 90%', value: (s) => s.derived.timeTo90PctMinutes, unit: 'min', decimals: 1 },
      { label: 'Wash-in progress', value: (s) => s.derived.washInProgress * 100, unit: '%', decimals: 0 },
      { label: 'Inspired fraction', value: (s) => s.derived.inspiredFractionPct, unit: '%', decimals: 2 },
      { label: 'Alveolar concentration', value: (s) => s.derived.alveolarAgentPct, unit: '%', decimals: 2 },
    ],
    explanation:
      'Desflurane wins on timing for two stacked reasons: its blood:gas coefficient is the lowest of the four, so the blood keeps the smallest share and the lung loads fastest, and the preset pairs it with the highest fresh gas flow, so the circuit is replaced quickest as well. Halothane loses on the same two axes. The minutes-to-90% tile ranks all four instantly — the wash-in clock is the whole diagnosis of "why is this induction slow".',
  },
  {
    id: 'pattern-still-gathering',
    stem: 'After a full induction\'s worth of simulated time, which of these presets is still furthest from its own equilibrium ceiling?',
    answer: 'lowFlowRebreathing',
    options: ['lowFlowRebreathing', 'halothaneSlowWashin', 'sevofluraneInduction', 'highCardiacOutput'],
    panel: [
      { label: 'Wash-in progress', value: (s) => s.derived.washInProgress * 100, unit: '%', decimals: 0 },
      { label: 'Minutes to 90%', value: (s) => s.derived.timeTo90PctMinutes, unit: 'min', decimals: 1 },
      { label: 'Alveolar concentration', value: (s) => s.derived.alveolarAgentPct, unit: '%', decimals: 2 },
      { label: 'Agent dial', value: (s) => s.derived.dialPct, unit: '%', decimals: 1 },
    ],
    explanation:
      'Even long after a routine induction would have been left satisfied, the low-flow circuit has ' +
      'still replaced itself fewer times than any of the others, so its alveolar level sits the ' +
      'furthest from its own ceiling — the wash-in progress tile reads below halothane\'s, let alone ' +
      'the sevoflurane ones. Slow is not one thing: it can be a soluble agent or a stingy flow, and ' +
      'the two kill the wash-in curve in the same place from different ends.',
  },
];
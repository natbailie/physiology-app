import type { PredictQuestion } from '@/shared/assessment/types';
import type { ImmuneDerived, ImmuneInputs, ImmuneState } from './engine/types';
import type { ImmunePresetName } from './engine/presets';
import { perturbInfect, perturbVaccinate } from './engine/engine';

// Only two predict questions here, deliberately. Comparing a normal host against a deficient
// one is a two-run comparison, and this format is a single-run before/after — the engine's
// asymmetric time constants mean a response is already committed by the time a mid-course
// intervention lands. That comparison belongs to the frozen-baseline overlay instead.

type Snapshot = { state: ImmuneState; derived: ImmuneDerived };
export type ImmuneQuestion = PredictQuestion<ImmuneInputs, ImmunePresetName, Snapshot>;

export const IMMUNE_QUESTIONS: readonly ImmuneQuestion[] = [
  {
    id: 'primary-infection-load',
    stem: 'A previously unexposed host encounters a virulent organism for the first time. Their innate and adaptive immunity are both entirely normal.',
    setup: { preset: 'healthyHost' },
    intervention: { label: 'They are infected.', perturb: (state) => perturbInfect(state) },
    prompt: 'What happens to the pathogen load over the first few days?',
    watch: 'the pathogen load',
    correctDirection: 'rises',
    observeSeconds: 6,
    explanation:
      'It climbs steeply before anything stops it, and the delay is structural rather than a failure. Dendritic cells must sample antigen, traffic to a draining lymph node, and find the rare naive clone that recognises it; that clone must then expand. All of this takes days, and the organism is replicating exponentially throughout. The innate arm holds the line meanwhile — that holding action is what buys the time, and it is why innate deficiency is so dangerous even with a normal adaptive system.',
    metric: (s) => s.derived.pathogenLoad,
  },
  {
    id: 'vaccination-builds-memory',
    stem: 'A previously unexposed host is given a vaccine. It contains antigen only — nothing in it can replicate, and the host never becomes unwell.',
    setup: { preset: 'healthyHost' },
    intervention: { label: 'They are vaccinated.', perturb: (state) => perturbVaccinate(state) },
    prompt: 'What happens to immunological memory?',
    watch: 'memory',
    correctDirection: 'rises',
    observeSeconds: 20,
    explanation:
      'Memory forms with no infection at all, and that is the whole trick. The adaptive arm responds to ANTIGEN, not to damage, so antigen delivered without a replicating organism drives the same presentation, the same helper T licensing, the same class switching and the same memory. The host pays the cost of a primary response at a moment of its choosing, when nothing is dividing exponentially in the background. Memory then ratchets — it is never erased here, which is why the protection persists.',
    metric: (s) => s.derived.memoryLevel,
  },
];

import type { PredictQuestion } from '@/shared/assessment/types';
import type { MuscleDerived, MuscleInputs, MuscleState } from './engine/types';
import type { MusclePresetName } from './engine/presets';

type Snapshot = { state: MuscleState; derived: MuscleDerived };
export type MuscleQuestion = PredictQuestion<MuscleInputs, MusclePresetName, Snapshot>;

export const MUSCLE_QUESTIONS: readonly MuscleQuestion[] = [
  {
    id: 'tetanus-summation',
    stem: 'A skeletal muscle is being stimulated at 15 Hz. Individual twitches are summing a little but the tension still ripples — the muscle is partially relaxing between stimuli.',
    setup: { preset: 'unfusedTetanus' },
    intervention: { label: 'Stimulation frequency rises from 15 Hz to 60 Hz.', inputs: { stimulationFrequencyHz: 60 } },
    prompt: 'What happens to the fusion of the twitches?',
    watch: 'twitch fusion',
    correctDirection: 'rises',
    // Short windows: at these rates a long settle simply exhausts the SR, and the interesting
    // behaviour is over within a second of simulated time.
    settleSeconds: 2,
    observeSeconds: 1,
    explanation:
      'Calcium accumulates, and that accumulation is what summation actually IS. Each stimulus releases calcium faster than SERCA can pump it back, so the cytosolic level never returns to baseline between stimuli; troponin occupancy stays high, and the individual twitches fuse into a smooth tetanic plateau. The key point is what makes this possible: skeletal muscle has a refractory period much shorter than its contraction, so stimuli can arrive before relaxation is complete. Cardiac muscle cannot do this — its refractory period lasts almost the whole contraction, which is precisely what stops the heart tetanising.',
    // Fusion is the frequency-dependent quantity here. Calcium and tension oscillate with each
    // stimulus, so a value sampled at one instant says nothing about rate; whether the twitches
    // have merged does.
    metric: (s) => (s.derived.isFused ? 1 : 0),
  },
  {
    id: 'atp-depletion-rigor',
    stem: 'A muscle is contracting normally when its ATP supply is abolished. Calcium handling and the filaments themselves are structurally intact.',
    setup: { preset: 'singleTwitch' },
    intervention: { label: 'ATP availability falls to almost nothing.', inputs: { atpAvailability: 0.02 } },
    prompt: 'What happens to the fraction of attached cross-bridges?',
    watch: 'attached cross-bridges',
    correctDirection: 'rises',
    explanation:
      'Cross-bridges accumulate in the attached state, and the muscle stiffens rather than relaxing. ATP is required to DETACH myosin from actin, not to attach it — so removing ATP leaves bridges locked where they are. Relaxation is an active process in two separate ways: SERCA needs ATP to clear calcium, and myosin needs ATP to let go. Rigor mortis is the same mechanism running to completion, and it is why rigor emerges from this model rather than being scripted into it.',
    metric: (s) => s.derived.activeCrossBridgeFraction,
  },
  {
    id: 'overstretch-length-tension',
    stem: 'A muscle is stretched well beyond its optimal resting length before being stimulated. Its calcium handling and ATP supply are entirely normal.',
    setup: { preset: 'singleTwitch' },
    intervention: { label: 'Resting sarcomere length is stretched to 3.6 microns.', inputs: { restingSarcomereLengthUm: 3.6 } },
    prompt: 'What happens to the length-tension factor?',
    watch: 'the length-tension factor',
    correctDirection: 'falls',
    explanation:
      'Active tension falls away on the descending limb of the length-tension curve, because overlap between thick and thin filaments is what determines how many cross-bridges can form at all. Stretch too far and there is simply less overlap to work with. Note this is a statement about geometry rather than about activation: calcium release and troponin occupancy are unchanged, and the muscle is trying just as hard. The same relationship, applied to the ventricle, is the Frank-Starling mechanism and its decompensation limb.',
    metric: (s) => s.derived.lengthTensionFactor,
  },
];

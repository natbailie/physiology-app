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

  {
    id: 'recruitment-raises-tension',
    stem: 'A person lifts a heavier object. The stimulation frequency to each active motor unit is unchanged.',
    setup: { preset: 'fusedTetanus', inputs: { motorUnitRecruitment: 0.2 } },
    intervention: { label: 'More motor units are recruited.', inputs: { motorUnitRecruitment: 0.95 } },
    prompt: 'What happens to total tension?',
    watch: 'the total tension',
    correctDirection: 'rises',
    explanation:
      'Tension rises through recruitment rather than through anything happening inside the fibres already working — each motor unit is all-or-none, so graded force at the whole-muscle level comes from how many are switched on. Recruitment follows the size principle, smallest and most fatigue-resistant first, which is why fine control is available at low force and why a maximal effort is both powerful and brief. Frequency summation is the second, independent lever, and the two together cover the whole working range.',
    metric: (s) => s.derived.totalTension,
  },
  {
    id: 'serca-failure-impairs-relaxation',
    stem: 'A muscle fibre has impaired SERCA function. Calcium release from the sarcoplasmic reticulum is unaffected.',
    setup: { preset: 'fusedTetanus' },
    intervention: { label: 'SERCA activity collapses.', inputs: { sercaActivity: 0.15 } },
    prompt: 'What happens to cytosolic calcium?',
    watch: 'the cytosolic calcium',
    correctDirection: 'rises',
    explanation:
      'Cytosolic calcium rises, because SERCA is the pump that clears it back into the store and RELAXATION is an active, ATP-consuming process rather than something that happens when contraction stops. That asymmetry is worth holding on to: releasing calcium is passive and down a gradient, removing it costs energy. It is why relaxation fails before contraction does when ATP runs short, why rigor is a state of sustained binding, and why impaired relaxation is the earliest abnormality in several muscle diseases.',
    metric: (s) => s.derived.cytosolicCalciumUM,
  },
];

/*
 * Five rather than six, deliberately.
 *
 * Every remaining observable in this module is cycle-dependent — shortening velocity, active
 * tension, power and even the isotonic/isometric mode all read differently depending where in
 * the contraction they are sampled, so a before-and-after comparison measures the phase rather
 * than the intervention. Three separate attempts at a sixth question were rejected by the
 * harness for exactly that reason.
 *
 * `isFused` works because it is a property of the STIMULUS TRAIN rather than of the current
 * beat, which is the shape any further question here would have to take. The force-velocity
 * relationship deserves to be taught and belongs on the frozen-baseline overlay or a chart,
 * not in a format that samples a single instant.
 */

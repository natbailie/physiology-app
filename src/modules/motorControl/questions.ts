import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { MotorDerived, MotorInputs, MotorInternalState } from './engine/types';
import type { MotorPresetName } from './engine/presets';
import { perturbLevodopaDose } from './engine/engine';

type Snapshot = { state: MotorInternalState; derived: MotorDerived };
export type MotorQuestion = ModuleQuestion<MotorInputs, MotorPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Initiation latency', unit: 'ms', value: (s) => s.derived.initiationLatencyMs, decimals: 0 },
  { label: 'Resting tremor', value: (s) => s.derived.restingTremorAmp, decimals: 1 },
  { label: 'Intention tremor', value: (s) => s.derived.intentionTremorAmp, decimals: 1 },
  { label: 'Postural tremor', value: (s) => s.derived.posturalTremorAmp, decimals: 1 },
  {
    label: 'Involuntary movement',
    value: (s) => s.derived.involuntaryMovementIndex,
    decimals: 1,
    tolerance: 0.2,
  },
  { label: 'Rigidity vs spasticity', value: (s) => s.derived.rigidityScore - s.derived.spasticityScore, decimals: 1, tolerance: 0.3 },
  { label: 'Co-contraction', value: (s) => s.derived.cocontractionIndex, decimals: 2 },
];

const SETTLE = 2000;

export const MOTOR_QUESTIONS: readonly MotorQuestion[] = [
  {
    id: 'slowed-start-small-writing',
    stem: 'A man in his sixties has noticed his handwriting shrinking and difficulty getting out of chairs. His right hand shakes when sitting quietly but the shake settles when he reaches for a cup.',
    answer: 'advancedParkinson',
    options: ['advancedParkinson', 'cerebellarAtaxia', 'essentialTremor', 'huntingtonChorea'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Slowed initiation with shrunken amplitude and a tremor that appears AT rest and quiets on action is parkinsonism — dopamine-depleted gating of movement. Cerebellar tremor is the opposite timing (worse as the target approaches), essential tremor is postural with normal initiation, and chorea invades a normally-initiating system. Micrographia is this module\'s amplitude arithmetic in everyday form.',
  },
  {
    id: 'worse-as-target-nears',
    stem: 'On finger-to-nose testing, a woman\'s tremor worsens as her finger approaches her nose and she overshoots past it. Her movements start promptly.',
    answer: 'cerebellarAtaxia',
    options: ['cerebellarAtaxia', 'advancedParkinson', 'essentialTremor', 'strokeUmnHemiparesis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Tremor that grows during the reach with overshoot is the cerebellum\'s failed calibration — intention tremor with dysmetria. Initiation latency stays normal because starting a movement is the basal ganglia\'s job; executing it accurately is hers. Rigidity is absent — cerebellar lesions cause hypotonia if they change tone at all — which separates her from any extrapyramidal syndrome.',
  },
  {
    id: 'random-jerks-normal-power',
    stem: 'A man in his fifties develops continuous random jerks of face, trunk and limbs. Power, initiation speed and tone are all entirely normal.',
    answer: 'huntingtonChorea',
    options: ['huntingtonChorea', 'hemiballismus', 'advancedParkinson', 'essentialTremor'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Random involuntary movement invading an otherwise normal motor system means release, not failure: degeneration of indirect-pathway striatal neurons lifts the thalamic brake. The normal initiation latency and tone exclude parkinsonism; the random, multi-focal quality excludes the single violent pattern of hemiballismus, whose lesion sits in the subthalamic nucleus these neurons normally drive.',
  },
  {
    id: 'levodopa-wears-off',
    stem: 'An advanced Parkinson patient takes her levodopa dose.',
    setup: { preset: 'advancedParkinson' },
    intervention: { label: 'Levodopa dose absorbed.', perturb: (state) => perturbLevodopaDose(state) },
    prompt: 'What happens to initiation latency?',
    watch: 'initiation latency',
    correctDirection: 'falls',
    settleSeconds: 500,
    observeSeconds: 400,
    explanation:
      'It falls steeply — levodopa transiently replaces the missing transmitter and the gate reopens toward normal, which is why the response can be dramatic even in advanced disease. The decay that follows over hours is the wearing-off every patient describes, and it is why dosing schedules dominate Parkinson management. Nothing structural has changed; only the chemistry holding the circuit open.',
    metric: (s) => s.derived.initiationLatencyMs,
  },
  {
    id: 'dopamine-loss-unmasks-rest-tremor',
    stem: 'The same patient sits quietly after skipping several doses.',
    setup: { preset: 'normal', inputs: { movementCommandAmplitude: 40 } },
    intervention: { label: 'Striatal dopamine falls to 12%.', inputs: { dopamineFraction: 12 } },
    prompt: 'What happens to resting tremor?',
    watch: 'resting tremor',
    correctDirection: 'rises',
    settleSeconds: 800,
    observeSeconds: 600,
    explanation:
      'It emerges — the parkinsonian oscillator runs in the depleted circuits whether or not anything is moving, and with no voluntary command suppressing it, the rest tremor shows itself. This is why patients are examined first at rest and then during posture and action: the three tremors occupy mutually exclusive windows of the same examination, and dopamine loss opens only one of them.',
    metric: (s) => s.derived.restingTremorAmp,
  },
  {
    id: 'stn-lesion-releases-ballism',
    stem: 'A patient suffers a small infarct affecting the subthalamic nucleus.',
    setup: { preset: 'normal' },
    intervention: { label: 'Subthalamic nucleus lesion reaches 85%.', inputs: { subthalamicLesion: 85 } },
    prompt: 'What happens to involuntary movement?',
    watch: 'involuntary movement',
    correctDirection: 'rises',
    settleSeconds: 800,
    observeSeconds: 600,
    explanation:
      'It explodes upward into hemiballismus — violent proximal flinging of the opposite arm and leg. The STN is the indirect pathway\'s powerful brake on the thalamus, and losing it releases contralateral movement generation entirely unopposed. The lesion is tiny and the deficit is dramatic: the clearest demonstration in neurology that movement is actively suppressed as much as produced.',
    metric: (s) => s.derived.ballismAmp,
  },
  {
    id: 'et-suppressant-response',
    stem: 'A student notices his outstretched hands shake before presentations. A relative reports the same tremor improved dramatically after a glass of wine.',
    setup: { preset: 'essentialTremor' },
    intervention: { label: 'Beta-blockade/alcohol effect applied.', inputs: { tremorSuppressantEffect: 70 } },
    prompt: 'What happens to postural tremor?',
    watch: 'postural tremor',
    correctDirection: 'falls',
    settleSeconds: 800,
    observeSeconds: 600,
    explanation:
      'It falls without anything else changing — the diagnostic signature of essential tremor, whose postural oscillator responds to beta-blockade (and famously to alcohol) while every other readout stays normal. Resting and intention tremors do not behave this way, which makes the response almost pathognomonic when the history fits. Propranolol remains first-line precisely because of this selectivity.',
    metric: (s) => s.derived.posturalTremorAmp,
  },
  {
    id: 'dystonia-cocontraction-rise',
    stem: 'A musician develops an involuntary head pull to one side when playing, worsening with effort.',
    setup: { preset: 'normal' },
    intervention: { label: 'Dystonic co-contraction develops.', inputs: { dystoniaSeverityPct: 65 } },
    prompt: 'What happens to co-contraction?',
    watch: 'co-contraction',
    correctDirection: 'rises',
    settleSeconds: 800,
    observeSeconds: 600,
    explanation:
      'It rises steeply — the hallmark of dystonia is that the effort to activate one muscle simultaneously recruits its antagonist, producing a sustained postural pull rather than a tremor. Initiation speed stays normal because the basal ganglia gate is intact; the problem is in the pattern of execution, not the decision to move. This is task-specific focal dystonia in its classic form.',
    metric: (s) => s.derived.cocontractionIndex,
  },
  {
    id: 'sustained-posture-with-normal-start',
    stem: 'A woman presents with a fixed head tilt to the left that worsens under stress. Her handwriting is normal, she walks heel-to-toe, and a wine glass held outstretched does not tremor.',
    answer: 'focalDystonia',
    options: ['focalDystonia', 'cerebellarAtaxia', 'earlyParkinson', 'strokeUmnHemiparesis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Sustained abnormal posture with normal initiation, normal gait, no tremor and no spasticity is focal dystonia — the co-contraction readout is elevated while every other channel stays quiet. Cerebellar ataxia would produce dysmetria and intention tremor; early parkinsonism would slow initiation; a UMN lesion would add spasticity. Dystonia is a disorder of pattern, not power or speed.',
  },
];

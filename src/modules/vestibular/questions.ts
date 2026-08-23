import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { VestibularDerived, VestibularInputs, VestibularInternalState } from './engine/types';
import type { VestibularPresetName } from './engine/presets';
import { perturbPerformHallpike } from './engine/engine';

type Snapshot = { state: VestibularInternalState; derived: VestibularDerived };
export type VestibularQuestion = ModuleQuestion<VestibularInputs, VestibularPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Spontaneous nystagmus', unit: '°/s', value: (s) => s.derived.slowPhaseVelocityDegPerSec, decimals: 1 },
  { label: 'Vertigo', unit: '%', value: (s) => s.derived.vertigoIntensityPct, decimals: 0, tolerance: 0.15 },
  {
    label: 'VOR gain',
    value: (s) => s.derived.vorGain,
    decimals: 2,
    tolerance: 0.12,
  },
  {
    label: 'Positional nystagmus',
    unit: '%',
    value: (s) => s.derived.positionalNystagmusPct,
    decimals: 0,
    tolerance: 0.25,
  },
  { label: 'Romberg unsteadiness', unit: '%', value: (s) => s.derived.rombergUnsteadinessPct, decimals: 0, tolerance: 0.2 },
];

const SETTLE = 40;

export const VESTIBULAR_QUESTIONS: readonly VestibularQuestion[] = [
  {
    id: 'acute-neuritis-pattern',
    stem: 'A young man wakes with severe rotatory vertigo, vomiting and continuous nystagmus beating toward his left. There is no hearing loss and no headache. He cannot stand without support.',
    answer: 'acuteNeuritis',
    options: ['acuteNeuritis', 'bilateralLoss', 'bppvPosterior', 'compensatedNeuritis'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Continuous spontaneous nystagmus with severe vertigo means an uncompensated FIRING imbalance — one nerve has gone quiet and the other\'s resting tone is being read as acceleration. Nystagmus beating left says the RIGHT nerve is the silent one. No hearing loss separates neuritis from labyrinthitis; the duration (days, not seconds) separates it from BPPV; the single episode with recovery ahead separates it from Ménière disease.',
  },
  {
    id: 'compensated-quiet-but-deficient',
    stem: 'The same patient returns six weeks later. The vertigo has gone entirely, but he notices words smear when he turns his head quickly in conversation.',
    answer: 'compensatedNeuritis',
    options: ['compensatedNeuritis', 'acuteNeuritis', 'normal', 'meniereIrritative'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Central compensation has suppressed the firing mismatch — no vertigo, no visible nystagmus — but it cannot rebuild the dead nerve: the VOR gain remains low, so quick head turns outrun the eye movement and the world smears. This dissociation between how the patient FEELS and what the MECHANICS do is why a head impulse belongs in every follow-up, and why vestibular rehabilitation rather than reassurance is the treatment.',
  },
  {
    id: 'bilateral-silent-disability',
    stem: 'A patient on long-term gentamicin walks into clinic gripping the walls. He denies any spinning. His vision bobs as he walks, and he is far worse walking in the dark.',
    answer: 'bilateralLoss',
    options: ['bilateralLoss', 'bppvPosterior', 'acuteNeuritis', 'meniereIrritative'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Bilateral vestibular loss destroys the comparison itself — no imbalance, therefore no vertigo and no nystagmus, however disabled the patient. Oscillopsia with head motion and darkness-dependent ataxia are the signatures: vision was substituting for the missing otolith input. Aminoglycoside toxicity is the classic cause because the drug concentrates in vestibular hair cells; the most disabled patient in the module has the quietest examination.',
  },
  {
    id: 'spin-fades-cupula-centres',
    stem: 'A figure skater has been holding a constant-velocity spin for several seconds and still feels she is turning.',
    setup: { preset: 'normal', inputs: { headTurnVelocityDegPerSec: 140 } },
    intervention: { label: 'The spin continues unchanged.', inputs: { headTurnVelocityDegPerSec: 140 } },
    prompt: 'What happens to cupula deflection over the next half minute?',
    watch: 'cupula deflection',
    correctDirection: 'falls',
    settleSeconds: 8,
    observeSeconds: 25,
    explanation:
      'It decays toward centre — the endolymph catches up with the canal wall through inertia, and the deflection that signalled the ACCELERATION disappears even though velocity continues. The canals report change, not steady state, which is why skaters spot their turns in stages rather than feeling them continuously. It also predicts the opposite effect on stopping: post-rotatory nystagmus from a deflection now reversed.',
    metric: (s) => Math.abs(s.derived.cupulaDeflection),
  },
  {
    id: 'post-rotatory-reversal',
    stem: 'The same skater stops her spin abruptly after twenty seconds of rotation.',
    setup: { preset: 'normal', inputs: { headTurnVelocityDegPerSec: 140 } },
    intervention: { label: 'The spin stops suddenly.', inputs: { headTurnVelocityDegPerSec: 0 } },
    prompt: 'What happens to nystagmus slow-phase velocity?',
    watch: 'slow-phase velocity',
    correctDirection: 'rises',
    settleSeconds: 30,
    observeSeconds: 3,
    explanation:
      'It appears — post-rotatory nystagmus, driven by endolymph still moving while the canal has stopped, deflecting the cupula the other way. The direction reverses relative to during the spin, and it fades over the following seconds as the endolymph settles. Drunk drivers fail the finger-nose test for the same reason: alcohol changes endolymph density, making the cupula respond to gravity as if the head were always turning.',
    metric: (s) => Math.abs(s.derived.slowPhaseVelocityDegPerSec),
  },
  {
    id: 'compensation-kills-vertigo-not-deficit',
    stem: 'A patient three days into acute vestibular neuritis is started on a supervised vestibular rehabilitation programme driving central compensation.',
    setup: { preset: 'acuteNeuritis' },
    intervention: { label: 'Central compensation reaches its plateau.', inputs: { centralCompensation: 0.95 } },
    prompt: 'What happens to vertigo intensity?',
    watch: 'vertigo',
    correctDirection: 'falls',
    settleSeconds: 10,
    observeSeconds: 8,
    explanation:
      'It falls steeply — compensation rebalances the tonic mismatch the brain had been misreading as acceleration, which is the whole of the symptom. What it does NOT do is restore the VOR gain, which stays low until (if ever) the nerve recovers; that residual shows up as oscillopsia on quick turns and a positive head impulse. Rehabilitation works by accelerating exactly this process, not by healing the nerve.',
    metric: (s) => s.derived.vertigoIntensityPct,
  },
  {
    id: 'hallpike-latency-fatigue',
    stem: 'A woman in her sixties gets brief severe vertigo every time she rolls over in bed to one particular side. Her GP performs a Dix-Hallpike manoeuvre toward that side.',
    setup: { preset: 'bppvPosterior' },
    intervention: { label: 'Dix-Hallpike position held.', perturb: (state) => perturbPerformHallpike(state) },
    prompt: 'What happens to positional nystagmus?',
    watch: 'positional nystagmus',
    correctDirection: 'rises',
    settleSeconds: 5,
    observeSeconds: 20,
    explanation:
      'It builds — but only after a latency of several seconds, while the debris sinks onto the cupula, and it fatigues as the debris disperses within the hold. Latency plus fatigability are the peripheral fingerprints; a central positional nystagmus starts immediately and does not tire. The brevity patients describe when rolling over in bed is the same physics compressed into everyday movements.',
    metric: (s) => s.derived.positionalNystagmusPct,
  },
];

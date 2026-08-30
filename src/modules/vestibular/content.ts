import type { ExplainerContent } from '@/shared/components/ExplainerPanel/ExplainerPanel';
import type { VestibularPresetName } from './engine/presets';

export const vestibularContent: ExplainerContent<VestibularPresetName> = {
  title: 'Vertigo is a firing mismatch between two nerves, and time changes what it means',
  sections: [
    {
      heading: 'The brain reads the difference between two tonic nerves',
      paragraphs: [
        'Each vestibular nerve fires tonically at about 90 spikes per second, and the brain reads the difference between the two ears. That architecture explains almost everything in this module. A destructive lesion silences one nerve, so the intact side\'s resting tone is misread as head acceleration toward that side: the eyes drift and are snapped back by fast phases — nystagmus beating away from the lesion — while the conscious reading of the mismatch is vertigo. Load the acute neuritis preset and watch both appear together from a single cause. An irritative lesion does the opposite: firing above rest beats nystagmus toward the affected ear, which is why an early Ménière attack can push the fast phases the "wrong" way.',
      ],
      demos: [
        { preset: 'normal', watch: 'firing difference' },
        { preset: 'acuteNeuritis', watch: 'nystagmus' },
      ],
    },
    {
      heading: 'The canals measure changes in velocity, not velocity',
      paragraphs: [
        'The canals do not measure velocity; they measure changes in velocity. The endolymph lags the head by inertia, and the cupula is deflected only by their relative motion — so during a sustained constant-velocity spin the deflection decays over five to seven seconds and the spinning sensation fades with it. Set the head turn running and watch the cupula readout fall while velocity stays high. Stop suddenly and the physics runs in reverse: endolymph still moving forward deflects the cupula backwards, producing post-rotatory nystagmus in the opposite direction. The same mechanism underlies why turning your head in the dark makes words smear — the VOR must cancel head motion using exactly this signal.',
      ],
    },
    {
      heading: 'Central compensation is the most misunderstood process here',
      paragraphs: [
        'Central compensation is the most clinically misunderstood process in the vestibular system. Over days to weeks the brain rebalances the tonic mismatch: spontaneous nystagmus fades, vertigo fades, the patient feels fine. Compare the acute and compensated neuritis presets — identical dead nerve, utterly different patients. But compensation suppresses the signal, not the deficit: the VOR gain readout stays low, and a head impulse still produces a visible corrective saccade. This is why chronic unilateral loss causes no vertigo yet leaves gaze unstable on quick turns, and why vestibular rehabilitation — deliberately driving the compensation — is the treatment rather than a placebo.',
      ],
      demos: [
        { preset: 'compensatedNeuritis', watch: 'nystagmus' },
      ],
    },
    {
      heading: 'Bilateral loss breaks the architecture itself',
      paragraphs: [
        'Bilateral loss breaks the architecture itself: when both nerves are silent there is no difference to misread, so there is no vertigo and no nystagmus at all. What remains is oscillopsia — the world bobbing with each step because the VOR cannot stabilise gaze — plus unsteadiness worse in the dark, where vision cannot substitute for the missing otolith input. The bilateral preset shows the paradox boards love: the most disabled patient in the module has the quietest examination.',
      ],
      demos: [
        { preset: 'bilateralLoss', watch: 'oscillopsia' },
      ],
    },
    {
      heading: 'BPPV is mechanical, and its timing gives it away',
      paragraphs: [
        'BPPV is mechanical, not metabolic, and its timing gives it away. Free-floating debris in the posterior canal sits inert until the Dix-Hallpike manoeuvre lets it sink onto the cupula; nystagmus begins after a latency of seconds, builds, then fatigues as the debris disperses. Run the Hallpike action on the BPPV preset and watch the positional trace rise late and decay within the hold. Central positional nystagmus has neither latency nor fatigability — so for once the stopwatch, not the direction, localises the lesion. Between the presets the module covers the four patterns every vertigo question is built from: acute, compensated, bilateral, and mechanical.',
      ],
      demos: [
        { preset: 'bppvPosterior', watch: 'latency' },
        { preset: 'meniereIrritative', watch: 'nystagmus' },
      ],
    },
  ],
};

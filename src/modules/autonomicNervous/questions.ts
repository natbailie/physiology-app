import type { PredictQuestion } from '@/shared/assessment/types';
import type { AnsDerived, AnsInputs, AnsState } from './engine/types';
import type { AnsPresetName } from './engine/presets';

type Snapshot = { state: AnsState; derived: AnsDerived };
export type AnsQuestion = PredictQuestion<AnsInputs, AnsPresetName, Snapshot>;

export const ANS_QUESTIONS: readonly AnsQuestion[] = [
  {
    id: 'atropine-unmasks-intrinsic-rate',
    stem: 'A resting patient has a heart rate of about 70. Their sinus node is healthy and their sympathetic tone is low.',
    setup: { preset: 'restAndDigest' },
    intervention: { label: 'Atropine blocks muscarinic receptors.', inputs: { muscarinicBlockade: 90 } },
    prompt: 'What happens to heart rate?',
    watch: 'heart rate',
    correctDirection: 'rises',
    explanation:
      'The rate climbs toward about 100, which is the sinus node\'s own intrinsic rhythm. A resting rate of 70 is that intrinsic rate held DOWN by continuous vagal tone, so blocking muscarinic receptors does not produce "no effect" — it releases a brake that was always applied. This is the general lesson about any tissue under continuous tone: blocking a pathway produces a dramatic change precisely because something was being actively restrained.',
    metric: (s) => s.derived.heartRateBpm,
  },
  {
    id: 'gi-sign-reversal',
    stem: 'A patient is given the same muscarinic blocker. Their gut was previously under normal resting parasympathetic drive.',
    setup: { preset: 'restAndDigest' },
    intervention: { label: 'Atropine blocks muscarinic receptors.', inputs: { muscarinicBlockade: 90 } },
    prompt: 'What happens to gut motility?',
    watch: 'gut motility',
    correctDirection: 'falls',
    explanation:
      'Motility falls, which is the OPPOSITE direction to what the same drug did to the heart. Muscarinic activity slows the heart but stimulates the gut, so blocking it speeds one and slows the other. The sign of an autonomic effect is a property of the organ, not of the transmitter — which is why these effects have to be learned per organ rather than as a single rule, and why an anticholinergic causes tachycardia and constipation at the same time.',
    metric: (s) => s.derived.giMotilityIndex,
  },
  {
    id: 'organophosphate-amplifies',
    stem: 'A farm worker is exposed to an organophosphate pesticide. This inhibits acetylcholinesterase rather than acting on receptors directly.',
    setup: { preset: 'restAndDigest' },
    intervention: { label: 'Cholinesterase is strongly inhibited.', inputs: { cholinesteraseInhibition: 90 } },
    prompt: 'What happens to muscarinic receptor activation?',
    watch: 'muscarinic activation',
    correctDirection: 'rises',
    explanation:
      'Activation rises sharply even though nothing has stimulated a receptor. Cholinesterase inhibitors work by AMPLIFYING whatever cholinergic tone already exists — acetylcholine that would normally be broken down instead accumulates in the synapse. That is why the toxidrome is an exaggerated rest-and-digest picture across every cholinergic target at once, and why atropine, which blocks the receptor, is the antidote to a drug that never touched the receptor itself.',
    metric: (s) => s.derived.muscarinicActivation,
  },

  {
    id: 'beta-blocker-blunts-adrenaline',
    stem: 'A patient on a non-selective beta blocker has a large surge of circulating adrenaline.',
    setup: { preset: 'betaBlocker' },
    intervention: { label: 'Circulating adrenaline surges.', inputs: { circulatingEpinephrine: 90 } },
    prompt: 'What happens to heart rate?',
    watch: 'the heart rate',
    correctDirection: 'rises',
    explanation:
      'It rises, but far less than the same surge would produce in an unblocked patient — the blockade raises the dose needed rather than abolishing the response. That partial quality matters twice over. It is why a beta-blocked patient in anaphylaxis can be refractory to adrenaline and may need glucagon, which raises cAMP without going through the receptor at all. And it is why a beta-blocked diabetic loses the tachycardia that would otherwise have warned them they were hypoglycaemic.',
    metric: (s) => s.derived.heartRateBpm,
  },
  {
    id: 'atropine-dries-secretions',
    stem: 'A patient is given atropine before a procedure to reduce airway secretions.',
    setup: { preset: 'restAndDigest' },
    intervention: { label: 'Muscarinic receptors are blocked.', inputs: { muscarinicBlockade: 90 } },
    prompt: 'What happens to the secretion index?',
    watch: 'the secretions',
    correctDirection: 'falls',
    explanation:
      'Secretions dry up, because glandular secretion is almost purely muscarinic — there is no sympathetic drive to it worth speaking of, so blocking the parasympathetic side removes essentially all of it. That is why the antimuscarinic side effects are so predictable and so uniform: dry mouth, blurred near vision, urinary retention, constipation and tachycardia are one mechanism seen in six organs, and knowing which organ the parasympathetic was doing the work in tells you what the drug will do there.',
    metric: (s) => s.derived.secretionIndex,
  },
  {
    id: 'vagal-tone-and-pupil',
    stem: 'A patient is given atropine before a procedure. Their sympathetic tone is unchanged throughout.',
    setup: { preset: 'restAndDigest' },
    intervention: { label: 'Muscarinic receptors are blocked.', inputs: { muscarinicBlockade: 90 } },
    prompt: 'What happens to pupil diameter?',
    watch: 'the pupil diameter',
    correctDirection: 'rises',
    explanation:
      'The pupil dilates, and note that no sympathetic drive was added to do it. Pupil size is a balance between circular muscle under muscarinic control and radial muscle under alpha control, so removing one side lets the other act unopposed — the dilatation is the ABSENCE of constriction rather than the presence of anything new. That is the general shape of every antimuscarinic effect, and it is why the side effects are so predictable once you know which organ the parasympathetic was doing the work in.',
    metric: (s) => s.derived.pupilDiameterMm,
  }
];

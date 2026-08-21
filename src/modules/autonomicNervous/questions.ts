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
];

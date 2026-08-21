import type { PredictQuestion } from '@/shared/assessment/types';
import type { GlucoseDerived, GlucoseInputs, GlucoseState } from './engine/types';
import type { GlucosePresetName } from './engine/presets';
import { perturbEatMeal, perturbGiveInsulin } from './engine/engine';

type Snapshot = { state: GlucoseState; derived: GlucoseDerived };
export type GlucoseQuestion = PredictQuestion<GlucoseInputs, GlucosePresetName, Snapshot>;

export const GLUCOSE_QUESTIONS: readonly GlucoseQuestion[] = [
  {
    id: 't1dm-meal',
    stem: 'A patient with type 1 diabetes has no endogenous insulin secretion at all. Their liver, muscle and alpha cells are otherwise normal, and they have not taken any insulin.',
    setup: { preset: 'type1Diabetes' },
    intervention: { label: 'They eat a 75 g carbohydrate meal.', perturb: (state) => perturbEatMeal(state, 75) },
    prompt: 'What happens to blood glucose?',
    watch: 'blood glucose',
    correctDirection: 'rises',
    explanation:
      'Glucose climbs and keeps climbing, because the signal that would drive it into tissue is entirely absent. Note how little happens in the fasting state by comparison — a model with no insulin at all still holds a nearly normal fasting glucose, because hepatic output and basal uptake balance. It is the MEAL that separates a working pancreas from a failed one, which is why post-prandial glucose is the sensitive test and why insulin is dosed to carbohydrate rather than to a fasting number.',
    metric: (s) => s.derived.bloodGlucoseMgDl,
  },
  {
    id: 'insulin-bolus-hypo',
    stem: 'A patient with normal physiology is given a substantial insulin bolus by mistake. No meal has been queued and they are not eating.',
    setup: { preset: 'normal' },
    intervention: { label: 'A large insulin bolus is given.', perturb: (state) => perturbGiveInsulin(state, 12) },
    prompt: 'What happens to blood glucose?',
    watch: 'blood glucose',
    correctDirection: 'falls',
    explanation:
      'Exogenous insulin bypasses every control in the loop. It is ungated by secretion capacity, which is exactly why it works in type 1 diabetes — but it is equally ungated by the feedback that would normally switch secretion off as glucose falls. Watch the defences engage in order: endogenous insulin stops, glucagon rises, and the cortisol, growth hormone and adrenaline arm follows only once glucose is genuinely low. None of them can withdraw a dose already given, which is why insulin errors are dangerous in a way that most drug errors are not.',
    metric: (s) => s.derived.bloodGlucoseMgDl,
  },
  {
    id: 'glucagon-loss-fasting',
    stem: 'A fasting patient loses their glucagon response — the alpha cells cannot secrete. Insulin secretion, liver glycogen and the counter-regulatory hormones are all intact.',
    setup: { preset: 'fasting' },
    intervention: { label: 'Glucagon secretion capacity falls to zero.', inputs: { glucagonSecretionCapacity: 0 } },
    prompt: 'What happens to blood glucose?',
    watch: 'blood glucose',
    correctDirection: 'falls',
    explanation:
      'Glucose falls, because glucagon is what drives the hepatic glucose output that holds a fasting person up. The defence against hypoglycaemia is hierarchical: insulin secretion switches off first, glucagon rises second, and the slower cortisol, growth hormone and adrenaline arm engages only at genuinely low levels. Remove the second line and the patient leans on a weaker third one — which is the situation in long-standing diabetes, where the glucagon response is lost and hypoglycaemia unawareness follows.',
    metric: (s) => s.derived.bloodGlucoseMgDl,
  },
];

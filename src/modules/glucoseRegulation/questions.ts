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
      'Glucose climbs and keeps climbing, because the signal that would drive it into tissue is entirely absent. Note how little happens in the fasting state by comparison — a model with no insulin at all still holds a nearly normal fasting glucose, because hepatic output and basal uptake balance. It is the meal that separates a working pancreas from a failed one, which is why post-prandial glucose is the sensitive test and why insulin is dosed to carbohydrate rather than to a fasting number.',
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

  {
    id: 'meal-in-type-2',
    stem: 'A patient with type 2 diabetes eats a large meal. Their beta cells still work, but their tissues respond poorly to insulin.',
    setup: { preset: 'normal', inputs: { insulinResistance: 3.2 } },
    intervention: { label: 'They eat a 90 g carbohydrate meal.', perturb: (state) => perturbEatMeal(state, 90) },
    prompt: 'What happens to blood glucose?',
    watch: 'blood glucose',
    correctDirection: 'rises',
    observeSeconds: 200,
    explanation:
      'It climbs higher and stays up longer than it would in a normal host, even though insulin is being secreted — often more of it. That is the defining feature of type 2 diabetes: the signal is present and the tissue does not answer it. Watch the insulin level while this happens, because it explains why the early disease is treated with drugs that improve sensitivity rather than with insulin itself, and why the fasting glucose can look almost normal while the post-meal excursion is grossly abnormal.',
    metric: (s) => s.derived.bloodGlucoseMgDl,
  },
  {
    id: 'meal-raises-insulin',
    stem: 'A person with entirely normal beta cell function and normal insulin sensitivity eats a substantial meal.',
    setup: { preset: 'normal' },
    intervention: { label: 'They eat a 75 g carbohydrate meal.', perturb: (state) => perturbEatMeal(state, 75) },
    prompt: 'What happens to the insulin level?',
    watch: 'the insulin level',
    correctDirection: 'rises',
    observeSeconds: 200,
    explanation:
      'Insulin rises, and the speed of it is the point: the beta cell responds to the glucose itself rather than to anything anticipatory, so the signal follows the substrate within minutes. Watch what it then does to hepatic glucose output, which is switched off at the same time — insulin does not merely push glucose into tissue, it simultaneously stops the liver adding more. Losing one arm of that is why a fasting glucose and a post-meal glucose can fail independently.',
    metric: (s) => s.derived.insulinLevel,
  },
  {
    id: 'insulin-drives-counter-regulation',
    stem: 'A patient injects their usual insulin dose and then misses the meal it was intended for.',
    setup: { preset: 'normal' },
    intervention: { label: 'A large insulin dose is given with no meal.', perturb: (state) => perturbGiveInsulin(state, 14) },
    prompt: 'What happens to counter-regulatory drive?',
    watch: 'counter-regulatory drive',
    correctDirection: 'rises',
    observeSeconds: 300,
    explanation:
      'It rises hard, because falling glucose is one of the most strongly defended signals in the body — glucagon first, then adrenaline, cortisol and growth hormone behind it. The brain cannot store or make glucose, so a defence with this much redundancy is proportionate. Two clinical consequences follow: the adrenergic symptoms a patient learns to recognise are the counter-regulation rather than the hypoglycaemia, and in someone whose response has been blunted by repeated episodes those warnings disappear while the danger does not.',
    metric: (s) => s.derived.counterRegulatoryDrive,
  },];

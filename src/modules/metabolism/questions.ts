import type { ModuleQuestion } from '@/shared/assessment/types';
import type { MetabolismDerived, MetabolismInputs, MetabolismInternalState } from './engine/types';
import type { MetabolismPresetName } from './engine/presets';

type Snapshot = { state: MetabolismInternalState; derived: MetabolismDerived };
export type MetabolismQuestion = ModuleQuestion<MetabolismInputs, MetabolismPresetName, Snapshot>;

export const METABOLISM_QUESTIONS: readonly MetabolismQuestion[] = [
  {
    id: 'starvation-rises-ketones',
    stem: 'A 38-year-old man on day three of a religious fast has now gone sixty hours without food. His blood glucose remains near the lower edge of the normal range.',
    setup: { preset: 'normal' },
    intervention: { label: 'The fast deepens to sixty hours.', inputs: { hoursPostAbsorptive: 60 } },
    prompt: 'What happens to his blood ketone level?',
    watch: 'ketones',
    correctDirection: 'rises',
    explanation:
      'Ketones rise from trace to several mmol/L, because sixty hours of fasting has spent the glycogen that was damping gluconeogenesis and the liver is now making fat-derived ketones as the brain\'s alternative fuel. The glucose that stays near-normal is the point: the body defends its blood sugar while switching the rest of the economy to fat, and the rising ketones are the visible end of that handover. This is the physiology fasting clinics and the keto fad are talking about, and the reason a starved patient is not a hypoglycaemic patient until gluconeogenesis itself fails.',
    metric: (s) => s.derived.ketonesMmolPerL,
  },
  {
    id: 'refeeding-rapidly-clear-ketones',
    stem: 'The same man ends his fast with a mixed meal of bread, rice and some meat after sixty hours without food.',
    setup: { preset: 'starvation' },
    intervention: { label: 'He eats the meal.', inputs: { hoursPostAbsorptive: 2, carbohydrateIntake: 300 } },
    prompt: 'What happens to his blood ketones over the next few hours?',
    watch: 'ketones',
    correctDirection: 'falls',
    explanation:
      'Ketones fall essentially to nothing, and quickly: the moment carbohydrate arrives, insulin rises, glucagon falls, and ketogenesis is switched off because the brain no longer needs a fat-derived substitute. What is often called "the quickest metabolic reversal in medicine" is real — refeeding switches the fuel economy from catabolic to anabolic within hours, which is also why very rapid refeeding after prolonged starvation can precipitate dangerous shifts in potassium and phosphate. The ketone curve is the safest way to watch the refeeding process land.',
    metric: (s) => s.derived.ketonesMmolPerL,
  },
  {
    id: 'fasting-collapses-carbohydrate-burn',
    stem: 'A healthy fasted volunteer skips meals for sixty hours as part of a metabolic study. Total energy expenditure is unchanged across the experiment.',
    setup: { preset: 'normal' },
    intervention: { label: 'Sixty hours without food elapse.', inputs: { hoursPostAbsorptive: 60 } },
    prompt: 'What happens to the fraction of energy coming from carbohydrate oxidation?',
    watch: 'carbohydrate oxidation',
    correctDirection: 'falls',
    explanation:
      'The carbohydrate share collapses from roughly half of the mix to a small gluconeogenic remnant, because once glycogen is spent there is no stored carbohydrate left to burn. The body does not stop spending energy — it simply switches suppliers, and fat becomes the dominant fuel. That is the single most useful thing a learner can take from this module: fasting is not an energy deficit so much as a fuel-switch, and the "metabolic switch" you may have heard about is exactly the hours-to-fat tipping point this slider walks across.',
    metric: (s) => s.derived.carbOxidationPct,
  },
  {
    id: 'insulin-resistance-raises-glucose',
    stem: 'A man with untreated type 2 diabetes skips breakfast. His insulin resistance is high because his tissues respond to insulin only weakly.',
    setup: { preset: 'normal' },
    intervention: { label: 'His insulin resistance is marked on the dial.', inputs: { insulinResistance: 2.5 } },
    prompt: 'What happens to his blood glucose at the same point in the fast?',
    watch: 'blood glucose',
    correctDirection: 'rises',
    explanation:
      'Glucose rises well above the normal range, because resistance blunts the one mechanism that clears it — insulin-mediated uptake into muscle and liver. The same fasting clock now produces a much higher glucose, which is why skipping meals does not "fix" diabetes: the glucose is not high because of what was eaten but because of what insulin can no longer do. The model also shows the second signature: the resistant liver keeps enough insulin tone to suppress ketosis, so the same starvation that produces brisk ketones in a healthy person produces hyperglycaemia without them here.',
    metric: (s) => s.derived.bgmmolPerL,
  },
  {
    id: 'trauma-raises-the-energy-bill',
    stem: 'A 46-year-old polytrauma patient arrives in ITU with sepsis on day two. The catecholamine-cortisol stress response is running flat out.',
    setup: { preset: 'normal' },
    intervention: { label: 'The catabolic stress response is switched on.', inputs: { injuryStress: 1 } },
    prompt: 'What happens to his total daily energy expenditure?',
    watch: 'energy expenditure',
    correctDirection: 'rises',
    explanation:
      'The energy bill roughly doubles, because the stress response multiplies the resting metabolic rate on top of what activity already adds. This is why critical illness causes rapid wasting despite aggressive feeding: the calorie requirement is not ordinary maintenance plus a little — it is a whole extra patient\'s worth of turnover. It also reframes the clinical complaint "he\'s starving despite what we feed him": in catabolic stress the demand is genuinely structural, and that is exactly the difference the fasting slider cannot capture on its own.',
    metric: (s) => s.derived.energyKcalPerDay,
  },
  {
    id: 'stress-shifts-the-mix-to-protein',
    stem: 'The same ITU patient is receiving full enteral feeding. His muscle wasting is nonetheless visible from the bedside.',
    setup: { preset: 'normal' },
    intervention: { label: 'The catabolic stress response is switched on.', inputs: { injuryStress: 1 } },
    prompt: 'What happens to the protein share of oxidative metabolism?',
    watch: 'protein oxidation',
    correctDirection: 'rises',
    explanation:
      'The protein share roughly doubles, because gluconeogenesis is feeding a much larger glucose demand and is harvesting amino acids to do it — cortisol and glucagon are both pushing protein breakdown faster than the gut can replace it. The teaching point is that muscle is being consumed as a fuel in a catabolic state even when feeding is adequate. Refeeding or "giving more protein" has real limits because the demand scales with the stress, which is why nutrition support is protocol-driven and why the catabolic slider is the one that makes the muscle burn visible.',
    metric: (s) => s.derived.proteinOxidationPct,
  },
  {
    id: 'exercise-multiplies-the-bill',
    stem: 'A cyclist rides at a hard aerobic pace for two hours. His heart rate is high but his glucose stays comfortably in range throughout.',
    setup: { preset: 'normal' },
    intervention: { label: 'He starts the ride.', inputs: { activityMet: 4 } },
    prompt: 'What happens to his total energy expenditure?',
    watch: 'energy expenditure',
    correctDirection: 'rises',
    explanation:
      'Energy expenditure rises with activity because the multiply-by-MET term is the exercise half of the energy equation: four METs is four times the resting bill. The glucose that stays in range is the reason the model shows the whole system working together — activity raises demand while insulin can still move carbohydrate in, so the fuel mix shifts but the fasting physiology is unchanged. It is the contrast to the trauma case, where the same kind of elevated demand comes with a hormone profile that prevents the fuel switch from being clean.',
    metric: (s) => s.derived.energyKcalPerDay,
  },
  {
    id: 'starved-glucose-is-defended',
    stem: 'A healthy volunteer has already been fasting for twenty-four hours. Her blood glucose sits at about the fasting floor and she feels fine.',
    setup: { preset: 'fasted24' },
    intervention: { label: 'The fast lengthens to seventy-two hours.', inputs: { hoursPostAbsorptive: 72 } },
    prompt: 'What happens to her blood glucose?',
    watch: 'blood glucose',
    correctDirection: 'unchanged',
    explanation:
      'It barely moves, because by twenty-four hours glycogen is gone and gluconeogenesis has already taken over — and once the floor is gluconeogenic, the next two days change the supplier\'s speed, not the target. This is the defensive physiology the whole axis is built around: a starved adult holds glucose near 4 mmol/L for a very long time before the mechanisms themselves start to fail. The learner\'s instinct that "no food means falling sugar" is wrong; the shortage arrives long before the glucose does.',
    metric: (s) => s.derived.bgmmolPerL,
    tolerance: 0.05,
  },
  {
    id: 'interpret-the-fasting-labs',
    stem: 'A ward patient has been under observation for three days. Her glucose is around 4.1, her ketones are over 5 mmol/L, and the carbohydrate share of her oxidation is a few percent.',
    answer: 'starvation',
    options: ['fed', 'fasted24', 'starvation', 'type2Diabetes'],
    panel: [
      { label: 'Glucose', value: (s) => s.derived.bgmmolPerL, unit: 'mmol/L', decimals: 1 },
      { label: 'Ketones', value: (s) => s.derived.ketonesMmolPerL, unit: 'mmol/L', decimals: 1 },
      { label: 'Carbohydrate oxidation', value: (s) => s.derived.carbOxidationPct, unit: '%', decimals: 0 },
      { label: 'Fat oxidation', value: (s) => s.derived.fatOxidationPct, unit: '%', decimals: 0 },
    ],
    explanation:
      'Defended glucose inside a normal range with frank ketosis is the starvation signature: the body is keeping the brain\'s sugar on a gluconeogenic floor while running the rest of the economy on fat-derived ketones. The harmless-looking alternative reads are what the pattern is meant to sharpen — the fed state has no ketones and a high carbohydrate burn, twenty-four hours of fasting has ketones still at trace, and type 2 diabetes carries a HIGH glucose alongside a suppressed ketosis, which is exactly the opposite pair of numbers.',
  },
  {
    id: 'the-diabetic-who-skips-meals',
    stem: 'A man with poorly controlled type 2 diabetes has not eaten in twelve hours. His blood glucose is above the normal range rather than below it.',
    answer: 'type2Diabetes',
    options: ['normal', 'fasted24', 'starvation', 'type2Diabetes'],
    panel: [
      { label: 'Glucose', value: (s) => s.derived.bgmmolPerL, unit: 'mmol/L', decimals: 1 },
      { label: 'Ketones', value: (s) => s.derived.ketonesMmolPerL, unit: 'mmol/L', decimals: 1 },
      { label: 'Carbohydrate oxidation', value: (s) => s.derived.carbOxidationPct, unit: '%', decimals: 0 },
      { label: 'Insulin signal', value: (s) => s.derived.insulinSignal, decimals: 2 },
    ],
    explanation:
      'Hyperglycaemia with suppressed ketosis is the type 2 pattern, and the two numbers have to be read together: the glucose is high because resistance keeps insulin from clearing it, and the ketones are low because the liver\'s chronic insulin tone also keeps ketogenesis off. A learner who reads only the glucose leaps to "uncontrolled sugar"; the ketone row is what rules out the starvation diagnosis next door. This is the concrete payoff of keeping the resistance and fasting dials separate rather than collapsing them into one "how sick" slider.',
  },
];
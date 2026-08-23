import type { PredictQuestion } from '@/shared/assessment/types';
import type { GiDerived, GiInputs, GiState } from './engine/types';
import type { GiPresetName } from './engine/presets';
import { perturbEatMeal } from './engine/engine';

type Snapshot = { state: GiState; derived: GiDerived };
export type GiQuestion = PredictQuestion<GiInputs, GiPresetName, Snapshot>;

export const GI_QUESTIONS: readonly GiQuestion[] = [
  {
    id: 'ppi-final-pathway',
    stem: 'A patient with reflux is started on a proton pump inhibitor. Their vagal tone and gastrin secretion are normal.',
    setup: { preset: 'normalMeal' },
    intervention: { label: 'A full-dose PPI is started.', inputs: { ppiDose: 120 } },
    prompt: 'What happens to gastric pH?',
    watch: 'gastric pH',
    correctDirection: 'rises',
    explanation:
      'Acid output collapses and pH rises, because a PPI blocks the H+/K+-ATPase itself — the shared final step, whichever stimulus drove it. Contrast an H2 blocker, which removes only the histamine limb and leaves vagal acetylcholine and direct gastrin still able to keep some acid flowing. Three stimuli converge on one pump: block the pump and you block all three; block one input and the others compensate. That is the whole difference in potency between the two drug classes.',
    metric: (s) => s.derived.gastricPH,
  },
  {
    id: 'ppi-raises-gastrin',
    stem: 'The same patient stays on the PPI long term. Their G cells and D cells are entirely normal.',
    setup: { preset: 'normalMeal' },
    intervention: { label: 'A full-dose PPI is started.', inputs: { ppiDose: 120 } },
    prompt: 'What happens to gastrin?',
    watch: 'gastrin',
    correctDirection: 'rises',
    explanation:
      'Gastrin rises, which surprises people until the loop is drawn. Acid secretion normally self-limits: once the stomach becomes sufficiently acidic, D cells release somatostatin which brakes further gastrin release. Suppress the acid and you remove the very signal that would have reined gastrin back in, so gastrin climbs. This is why a raised gastrin in someone on a PPI is expected rather than alarming — and why the drug must be stopped before gastrin is measured to investigate a suspected gastrinoma.',
    metric: (s) => s.derived.gastrinDrive,
  },
  {
    id: 'gastrinoma-bypasses-brake',
    stem: 'A patient has a gastrin-secreting tumour. It secretes autonomously, entirely independent of the normal feedback from gastric pH.',
    setup: { preset: 'normalMeal' },
    intervention: { label: 'Autonomous gastrin secretion begins.', inputs: { autonomousGastrinSecretion: 70 } },
    prompt: 'What happens to gastric pH?',
    watch: 'gastric pH',
    correctDirection: 'falls',
    explanation:
      'The stomach becomes profoundly acidic, because the tumour bypasses the somatostatin brake completely. Normal G cells would be shut down long before this point; an autonomous source never hears the signal. That unopposed acid is what produces the severe, multiple and distally-sited ulcers of Zollinger-Ellison syndrome, and why the acid also overwhelms duodenal bicarbonate and causes diarrhoea by inactivating pancreatic enzymes downstream.',
    metric: (s) => s.derived.gastricPH,
  },

  {
    id: 'fat-slows-emptying',
    stem: 'A patient eats a meal with a very high fat content. The volume of the meal is unchanged.',
    setup: { preset: 'normalMeal', perturb: (state) => perturbEatMeal(state) },
    intervention: { label: 'The meal is loaded with fat.', inputs: { mealFatGrams: 60 } },
    prompt: 'What happens to the gastric emptying rate?',
    watch: 'the gastric emptying rate',
    correctDirection: 'falls',
    // Short, because a stomach left to settle for ten minutes has already emptied and there is
    // nothing left for the fat to slow down.
    settleSeconds: 60,
    observeSeconds: 60,
    explanation:
      'Emptying slows markedly, and it is fat in the DUODENUM rather than in the stomach that does it — CCK is released when fat reaches the small bowel and feeds back to slow the stomach behind it. The logic is that the duodenum can only digest and absorb fat at a certain rate, so the stomach is held back to match. That single loop explains the fullness after a fatty meal, why fat is the strongest of the three macronutrients at delaying a drug given by mouth, and why CCK is also what empties the gallbladder at the same moment.',
    metric: (s) => s.derived.gastricEmptyingRate,
  },
  {
    id: 'vagotomy-drops-acid',
    stem: 'A patient has had a vagotomy. Their parietal cell mass and gastrin-producing cells are intact.',
    setup: { preset: 'normalMeal', perturb: (state) => perturbEatMeal(state) },
    intervention: { label: 'Vagal tone is lost.', inputs: { vagalTone: 10 } },
    prompt: 'What happens to gastric acid output?',
    watch: 'the acid output',
    correctDirection: 'falls',
    observeSeconds: 400,
    explanation:
      'Acid output falls, because the vagus drives the parietal cell both directly and through gastrin release — it is the cephalic phase, the acid secreted in anticipation of food before any has arrived. Note that this was once a surgical treatment for ulcer disease and is now essentially obsolete, replaced by drugs that block the final common pathway instead. The comparison is worth holding on to: cutting one input to a system with several is a far blunter instrument than blocking the pump they all converge on.',
    metric: (s) => s.derived.gastricAcidOutput,
  },
  {
    id: 'meal-drives-gastrin',
    stem: 'A person who has been fasting overnight eats a substantial meal containing protein.',
    setup: { preset: 'fasting' },
    intervention: { label: 'They eat the meal.', perturb: (state) => perturbEatMeal(state) },
    prompt: 'What happens to gastrin drive?',
    watch: 'the gastrin drive',
    correctDirection: 'rises',
    settleSeconds: 120,
    observeSeconds: 120,
    explanation:
      'Gastrin rises, driven by three things at once: the vagus anticipating the meal, distension of the stomach wall, and amino acids from the protein itself detecting that there is something to digest. That redundancy is the point — acid secretion is important enough to have several independent triggers, which is also why removing one of them surgically was never a very effective treatment. Watch what stops it: as the acid accumulates the falling pH drives somatostatin, and the brake is applied by the product of the process itself.',
    metric: (s) => s.derived.gastrinDrive,
  },
];

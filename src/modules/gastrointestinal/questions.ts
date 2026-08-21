import type { PredictQuestion } from '@/shared/assessment/types';
import type { GiDerived, GiInputs, GiState } from './engine/types';
import type { GiPresetName } from './engine/presets';

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
];

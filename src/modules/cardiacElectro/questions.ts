import type { PredictQuestion } from '@/shared/assessment/types';
import type { CardiacDerived, CardiacInputs, CardiacState } from './engine/types';
import type { CardiacPresetName } from './engine/presets';

type Snapshot = { state: CardiacState; derived: CardiacDerived };
export type CardiacQuestion = PredictQuestion<CardiacInputs, CardiacPresetName, Snapshot>;

export const CARDIAC_QUESTIONS: readonly CardiacQuestion[] = [
  {
    id: 'afterload-shortens-ejection',
    stem: 'A patient becomes acutely hypertensive. Their preload, contractility and heart rate are unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Afterload rises to 150 mmHg.', inputs: { afterloadPressure: 150 } },
    prompt: 'What happens to stroke volume?',
    watch: 'stroke volume',
    correctDirection: 'falls',
    explanation:
      'Stroke volume falls, and the mechanism is worth watching on the loop rather than memorising. The aortic valve opens only when ventricular pressure exceeds aortic pressure, so raising afterload delays valve opening and cuts the ejection phase short — leaving a larger end-systolic volume behind. Note nothing about the muscle changed: the phases here are set by pressure comparisons, not by a clock, which is why afterload shortens ejection all by itself.',
    metric: (s) => s.derived.strokeVolumeML,
  },
  {
    id: 'dilated-ventricle-ef',
    stem: 'A patient with a failing, dilated ventricle has a large end-diastolic volume. Their contractility is poor but their stroke volume is being maintained by the extra filling.',
    setup: { preset: 'normal' },
    intervention: { label: 'The ventricle dilates and contractility falls.', inputs: { preloadEDV: 200, contractility: 0.45 } },
    prompt: 'What happens to ejection fraction?',
    watch: 'ejection fraction',
    correctDirection: 'falls',
    explanation:
      'Ejection fraction falls even while stroke volume holds up, and confusing the two is a common and consequential error. Stroke volume is what actually left the ventricle; ejection fraction is that amount as a FRACTION of what was in there to begin with. A dilated chamber can hold so much that it maintains a respectable output while ejecting a small proportion of its contents — normal output, poor fraction. Watch the two readouts diverge and the distinction stops being a definition.',
    metric: (s) => s.derived.ejectionFractionPercent,
  },
  {
    id: 'contractility-empties-further',
    stem: 'A patient is given an inotrope. Their preload, afterload and heart rate are all held constant.',
    setup: { preset: 'normal' },
    intervention: { label: 'Contractility rises substantially.', inputs: { contractility: 1.8 } },
    prompt: 'What happens to end-systolic volume?',
    watch: 'end-systolic volume',
    correctDirection: 'falls',
    explanation:
      'The ventricle empties further, leaving less behind. Contractility in this model is the peak end-systolic elastance — how stiff the chamber becomes at the height of systole — so raising it steepens the end-systolic pressure-volume relationship and shifts it up and to the left. That is the formal definition of an inotrope, and it is why contractility is assessed from the ESPVR rather than from ejection fraction, which is contaminated by preload and afterload.',
    metric: (s) => s.derived.endSystolicVolumeML,
  },
];

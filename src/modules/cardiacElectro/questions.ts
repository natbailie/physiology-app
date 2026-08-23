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

  {
    id: 'preload-raises-stroke-volume',
    stem: 'A patient is given a fluid bolus. Their contractility and afterload are unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'End-diastolic volume rises.', inputs: { preloadEDV: 175 } },
    prompt: 'What happens to stroke volume?',
    watch: 'the stroke volume',
    correctDirection: 'rises',
    explanation:
      'Stroke volume rises — the Frank-Starling relationship, and the reason is at the sarcomere: stretching the ventricle moves the myofilaments toward their optimal overlap, so the same activation produces more force. The important qualification is that the curve flattens. A failing ventricle is already operating on the flat part, which is why the identical bolus that rescues a hypovolaemic patient does nothing for a cardiogenic one except raise their filling pressure.',
    metric: (s) => s.derived.strokeVolumeML,
  },
  {
    id: 'vagal-slowing-drops-output',
    stem: 'A patient has a strong vagal response during a procedure. Their contractility and filling are unaffected.',
    setup: { preset: 'normal' },
    intervention: { label: 'Parasympathetic drive rises sharply.', inputs: { parasympatheticDrive: 90 } },
    prompt: 'What happens to cardiac output?',
    watch: 'the cardiac output',
    correctDirection: 'falls',
    explanation:
      'Output falls because rate is one of its two terms and nothing has compensated on the other. Vagal slowing acts on the SA node by hyperpolarising it and flattening its pacemaker ramp, so the node simply takes longer to reach threshold. Note where the vagus does and does not reach: it densely innervates the nodes and barely touches the ventricular myocardium, which is why it changes rate profoundly and contractility hardly at all.',
    metric: (s) => s.derived.cardiacOutputLPerMin,
  },
  {
    id: 'failing-contractility-raises-esv',
    stem: 'A patient develops a cardiomyopathy. Their filling and their afterload are unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Contractility falls sharply.', inputs: { contractility: 0.35 } },
    prompt: 'What happens to the end-systolic volume?',
    watch: 'the end-systolic volume',
    correctDirection: 'rises',
    explanation:
      'The ventricle cannot empty as far, so more blood is left behind at the end of systole. On the pressure-volume loop this is the end-systolic pressure-volume relationship — the line the loop closes against — rotating clockwise, and it is the cleanest load-independent measure of contractility there is. Note what happens on the NEXT beat: the residual volume adds to the incoming filling, so end-diastolic volume rises too, which is how a failing ventricle ends up dilated as well as weak.',
    metric: (s) => s.derived.endSystolicVolumeML,
  },
];

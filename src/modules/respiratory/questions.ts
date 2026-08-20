import type { PredictQuestion } from '@/shared/assessment/types';
import type { RespDerived, RespInputs, RespState } from './engine/types';
import type { RespPresetName } from './engine/presets';

type Snapshot = { state: RespState; derived: RespDerived };
export type RespQuestion = PredictQuestion<RespInputs, RespPresetName, Snapshot>;

/** Each question keys a DIRECTION, and `questions.test.ts` runs the engine to confirm the
 * model really moves that way. Change a constant that flips one of these and the test fails. */
export const RESPIRATORY_QUESTIONS: readonly RespQuestion[] = [
  {
    id: 'dka-kussmaul',
    stem: 'A patient in diabetic ketoacidosis is producing ketoacids at a high rate. Nobody has touched their breathing, and their lungs are healthy.',
    setup: { preset: 'normal' },
    intervention: { label: 'Ketoacid production rises sharply.', inputs: { metabolicAcidLoad: 70 } },
    prompt: 'What happens to PaCO2?',
    watch: 'PaCO2',
    correctDirection: 'falls',
    explanation:
      'The acidaemia is sensed by the chemoreceptors, which drive ventilation up, and the increased alveolar ventilation blows off CO2. That is Kussmaul respiration, and note what produced it: nothing set the breathing rate. The deep sighing pattern is the reflex answering the pH, which is why respiratory compensation appears within minutes while renal compensation takes days. A "normal" PaCO2 in this patient would be an ominous sign of exhaustion, not reassurance.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'altitude-paco2',
    stem: 'A healthy trekker arrives at 4,000 m. The inspired oxygen fraction is effectively far below sea level, but nothing is wrong with their lungs or their kidneys.',
    setup: { preset: 'normal' },
    intervention: { label: 'They ascend to altitude (FiO2 equivalent 0.12).', inputs: { fiO2: 0.12 } },
    prompt: 'What happens to PaCO2?',
    watch: 'PaCO2',
    correctDirection: 'falls',
    explanation:
      'Below roughly 60 mmHg the peripheral chemoreceptors recruit strongly, and the hypoxic ventilatory response drives minute ventilation up. Increased alveolar ventilation blows off CO2, so PaCO2 falls and a respiratory alkalosis appears — before any renal compensation has had time to answer it. The alkalosis is the price of defending oxygenation, and it is what acetazolamide is given to pre-empt.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'panic-hyperventilation-ph',
    stem: 'A young patient is brought in mid-panic attack, breathing hard and fast. Their lungs, kidneys and metabolism are all normal; nothing is producing acid.',
    setup: { preset: 'normal' },
    intervention: { label: 'Minute ventilation more than doubles.', inputs: { minuteVentilation: 220 } },
    prompt: 'What happens to pH?',
    watch: 'pH',
    correctDirection: 'rises',
    tolerance: 0.004,
    explanation:
      'Ventilation far in excess of CO2 production drives PaCO2 down, and by Henderson-Hasselbalch a lower PaCO2 against an unchanged bicarbonate raises pH — an acute respiratory alkalosis. The important word is acute: renal compensation takes days, so there is nothing yet to blunt it. That is also why the alkalosis is what produces the perioral tingling and carpopedal spasm, by lowering ionised calcium.',
    metric: (s) => s.derived.pH,
  },
];

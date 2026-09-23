import type { ModuleQuestion } from '@/shared/assessment/types';
import type { RespInputs } from './engine/types';
import type { RespPresetName } from './engine/presets';
import { ABG_PANEL, type RespSnapshot as Snapshot } from './panel';

export type RespQuestion = ModuleQuestion<RespInputs, RespPresetName, Snapshot>;

// Long enough for the slow renal arm to have finished: a settled run in this module is by
// definition a chronic picture, which is exactly what these questions are asking about.
const SETTLE = 3200;

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
    id: 'copd-oxygen-hypercapnia',
    stem: 'A patient with severe COPD has been retaining CO2 for years. Their kidneys have long since compensated, so their pH is nearly normal, but on room air they are hypoxaemic — saturations sit around 88%. Someone puts them on a high-flow mask.',
    setup: { preset: 'copdChronicAcidosis' },
    intervention: { label: 'High-flow oxygen (FiO2 0.6) is applied.', inputs: { fiO2: 0.6 } },
    prompt: 'What happens to PaCO2?',
    watch: 'PaCO2',
    correctDirection: 'rises',
    observeSeconds: 300,
    explanation:
      'This patient has been hypercapnic so long that the CO2 component of their ventilatory drive is maximal and stuck there — it has nothing left to give. What was still holding their ventilation up was the hypoxaemia, sensed by the peripheral chemoreceptors below about 60 mmHg. Flood them with oxygen and that component is withdrawn, ventilation falls, and PaCO2 climbs. Watch SaO2 at the same time: it improves, and genuinely so. That is the whole difficulty — oxygen is doing exactly what it was given to do while making the ventilation worse, which is why it is titrated to a target saturation (88-92% in a known retainer) rather than turned up until the number looks reassuring. Note this simulation shows only the loss of hypoxic drive; in a real patient, released hypoxic pulmonary vasoconstriction worsening V/Q matching contributes at least as much.',
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

  // --- Reading a blood gas: the pattern-discrimination half of the module ---

  {
    id: 'abg-gap-vs-non-gap',
    stem: 'A patient has been vomiting and passing profuse watery stool for three days. They are not diabetic and their lactate is normal. Their gas is below.',
    answer: 'diarrhoeaNonGap',
    options: ['diarrhoeaNonGap', 'dkaMetabolicAcidosis', 'salicylatePoisoning', 'pyloricStenosis'],
    panel: ABG_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'A metabolic acidosis with a NORMAL anion gap. Bicarbonate has been lost straight out of the gut and chloride has taken its place, so nothing unmeasured has accumulated and the gap never moves. Compare it with the ketoacidosis option: the pH and the bicarbonate would look much the same, and the gap is the only row that separates them. That is precisely why the gap is calculated rather than eyeballed — two acidoses with identical pH, identical bicarbonate, and completely different causes and treatments.',
  },
  {
    id: 'abg-salicylate-two-disorders',
    stem: 'A teenager is brought in confused, hyperventilating and complaining that their ears are ringing. Nobody knows what they have taken.',
    answer: 'salicylatePoisoning',
    options: ['salicylatePoisoning', 'dkaMetabolicAcidosis', 'panicHyperventilation', 'diarrhoeaNonGap'],
    panel: ABG_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'There are two primary disorders here, not one compensating the other. The wide anion gap and low bicarbonate are a metabolic acidosis; the PaCO2 is lower than even full respiratory compensation for that bicarbonate would justify, so the hyperventilation cannot be a response to the acidosis — it is a second disorder. Salicylate does both: it stimulates the respiratory centre directly and it uncouples oxidative phosphorylation. Note the pH, which is close to normal because the two are pulling opposite ways. Reading only the pH here would miss a poisoning.',
  },
  {
    id: 'abg-compensated-retainer',
    stem: 'A breathless smoker is admitted. Someone looks at the bicarbonate of 32 and asks whether they should be given bicarbonate-lowering treatment.',
    answer: 'copdChronicAcidosis',
    options: ['copdChronicAcidosis', 'pyloricStenosis', 'vomitingOnCopd', 'panicHyperventilation'],
    panel: ABG_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The raised bicarbonate is not a disorder, it is the answer to one. A PaCO2 this high entitles the patient to a bicarbonate anywhere up to the mid thirties once the kidney has had days to respond, so 32 is exactly where it should be and nothing needs correcting. Note that the pH is still on the acid side: compensation restores the ratio far enough to survive and then runs out of capacity. A chronic retainer whose pH had reached 7.40 would have been cured, not compensated.',
  },
  {
    id: 'abg-alkalosis-hiding-in-a-retainer',
    stem: 'A patient with long-standing COPD has been vomiting for two days. Their pH is very close to normal and the team is reassured.',
    answer: 'vomitingOnCopd',
    options: ['vomitingOnCopd', 'copdChronicAcidosis', 'pyloricStenosis', 'cardiacArrest'],
    panel: ABG_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Both derangements push the bicarbonate the same way, so they hide each other and the pH looks almost respectable while both components are grossly abnormal. The giveaway is that the bicarbonate is higher than even complete chronic renal compensation for this PaCO2 could produce, and compensation never overshoots — so something else is adding bicarbonate. That something is the vomiting. Compare the plain COPD option: same PaCO2, and a bicarbonate that stops where compensation alone would stop it.',
  },
  {
    id: 'abg-arrest-both-arms',
    stem: 'A patient is found unresponsive and pulseless. A gas is taken during resuscitation.',
    answer: 'cardiacArrest',
    options: ['cardiacArrest', 'copdChronicAcidosis', 'dkaMetabolicAcidosis', 'salicylatePoisoning'],
    panel: ABG_PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Both arms have failed at once and neither is compensating anything. Ventilation has stopped so CO2 accumulates, and perfusion has stopped so the tissues pour out lactate — a respiratory acidosis and a wide-gap metabolic acidosis together, which is why the pH is so much worse than either alone would explain. The distinction from the COPD option matters: there the high PaCO2 comes with a high bicarbonate because the kidney had days to answer it. Here there is no compensation in either direction, and the treatment is circulation and ventilation, not bicarbonate.',
  },
];

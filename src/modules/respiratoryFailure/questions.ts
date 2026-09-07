import type { PredictQuestion } from '@/shared/assessment/types';
import type { RfDerived, RfInputs, RfState } from './engine/types';
import type { RfPresetName } from './engine/presets';

type Snapshot = { state: RfState; derived: RfDerived };
export type RfQuestion = PredictQuestion<RfInputs, RfPresetName, Snapshot>;

export const RF_QUESTIONS: readonly RfQuestion[] = [
  {
    id: 'oxygen-rescues-mild-shunt',
    stem: 'A patient with lobar pneumonia has a right-to-left shunt of about a quarter of cardiac output and a PaO2 of 56 mmHg on room air.',
    setup: { preset: 'type1Pneumonia' },
    intervention: { label: 'Inspired oxygen is raised from 21% to 100%.', inputs: { fiO2: 1 } },
    prompt: 'What happens to PaO2?',
    watch: 'the PaO2',
    correctDirection: 'rises',
    explanation:
      'The oxygen under 100% is pushed hard into the well-ventilated, well-perfused lung — the roughly three-quarters of cardiac output that does reach an alveolus — so the reading climbs. But notice how far it does not go: a 28% shunt still drags mixed venous blood past gas exchange, so instead of leaving PaO2 near 650 mmHg the 100% oxygen only buys about 127. The oxygen fixed the units that were reachable and left the shunt untouched. That is the whole lesson in one number: FiO2 is a rescue, and the size of the rescue tells you the size of the shunt.',
    metric: (s) => s.derived.paO2,
  },
  {
    id: 'ventilation-packs-out-co2',
    stem: 'A young man with diaphragmatic weakness is tiring; his PaCO2 has climbed to 69 mmHg because the muscles cannot move enough air.',
    setup: { preset: 'type2Neuromuscular' },
    intervention: { label: 'Manual ventilation is set to move 8 L/min for him.', inputs: { minuteVentilation: 8 } },
    prompt: 'What happens to PaCO2?',
    watch: 'the PaCO2',
    correctDirection: 'falls',
    explanation:
      'PaCO2 is the arithmetic of how much CO2 the tissues make versus how much alveolar ventilation clears it. Lend the exhausted muscles 8 L/min of it and the ventilation-to-metabolism ratio climbs back above the dead-space-adjusted normal, and the CO2 that was stacking falls toward 30 mmHg. The clue to the whole axis is that this patient was never short of oxygen — the failure was work, not oxygen supply. Treating the number that is actually failing, the ventilation, is what fixed the patient rather than just the blood.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'sepsis-raises-the-co2-load',
    stem: 'A patient with chronic COPD has been running a compensated PaCO2 near 63 mmHg. He develops sepsis; his metabolic rate climbs.',
    setup: { preset: 'type2ChronicCopd' },
    intervention: { label: 'CO2 production rises to 1.6× resting.', inputs: { co2ProductionMultiplier: 1.6 } },
    prompt: 'What happens to PaCO2?',
    watch: 'the PaCO2',
    correctDirection: 'rises',
    explanation:
      'CO2 production is the other numerator in the clearance equation, and sepsis is the test that every marginal ventilator fails. The muscles were already near the limit of what the lungs could clear, so an extra 60% of production simply accumulates — the PaCO2 climbs toward 91 mmHg. Note the oxygen side too: the extra CO2 crowds the alveolar gas, so even the PaO2 falls. A febrile, septic CO2 retainer is a patient whose needs outrun the machine unless ventilation is stepped up with the metabolism.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'acute-on-chronic-is-the-pH-story',
    stem: 'A patient with COPD and chronic CO2 retention carries a compensated bicarbonate of 34 mEq/L. Another patient develops the same PaCO2 of 66 mmHg out of the blue, before the kidney has had days to respond.',
    setup: { preset: 'type2CopdExacerbation' },
    intervention: { label: 'The same hypercapnia is imposed with no renal compensation.', inputs: { course: 'acute' } },
    prompt: 'What happens to plasma bicarbonate?',
    watch: 'the bicarbonate',
    correctDirection: 'falls',
    explanation:
      'The chronic kidney met the high PaCO2 by holding on to bicarbonate, so the compensated patient sits on a raised HCO3 and a mild pH — the measured 7.34 is inconvenient but not dangerous. Take those days of compensation away and the bicarbonate collapses toward 24, and the pH with it, toward 7.23: the same arterial CO2 is now an acute, severe, exhausting acidosis. This is why the pH, not the CO2, tells you which patient you are treating, and why an acutely hypercapnic patient receives ventilation far faster than a chronically compensated one.',
    metric: (s) => s.derived.plasmaHCO3,
  },
  {
    id: 'oxygen-cannot-wash-out-co2',
    stem: 'A hypoventilating COPD patient is admitted with a PaCO2 of 66 mmHg and a near-normal oxygen saturation.',
    setup: { preset: 'type2CopdExacerbation' },
    intervention: { label: 'Inspired oxygen is raised to 100% to "treat" the CO2.', inputs: { fiO2: 1 } },
    prompt: 'What happens to PaCO2?',
    watch: 'the PaCO2',
    correctDirection: 'unchanged',
    explanation:
      'Oxygen changes the inspired gas, not the ventilation. PaCO2 is set by the CO2 produced and the alveolar ventilation clearing it; raising FiO2 moves no air, so the hypercapnia sits exactly where it was, at 66 mmHg. What the oxygen does instead is shoot the PaO2 up past 450 — and by removing the hypoxic drive that was keeping the muscles going, it can quietly remove the only reason this patient was breathing at all. Controlled low-flow oxygen keeps a retainer alive while the real problem, the ventilation, is fixed.',
    metric: (s) => s.derived.paCO2,
  },
  {
    id: 'ventilation-clears-mixed-co2-not-the-shunt',
    stem: 'A patient in severe mixed failure has both a large shunt (PaO2 45 mmHg) and a high PaCO2 of 82 mmHg, and is ventilated to 8 L/min.',
    setup: { preset: 'mixedSevere' },
    intervention: { label: 'Minute ventilation is raised from 3.5 to 8 L/min.', inputs: { minuteVentilation: 8 } },
    prompt: 'What happens to PaO2?',
    watch: 'the PaO2',
    correctDirection: 'unchanged',
    explanation:
      'The new ventilation clears the CO2 limb completely — the PaCO2 falls from 82 toward 36 and the pH jumps back near normal. But the oxygen limb is a perfusion problem, not a ventilation one: blood is still flowing through lung that is perfused but not ventilated, and moving more air down the other tubes does not reconnect it. PaO2 stays pinned near 45 regardless of how hard the patient is ventilated. Mixed failure is two separate machines, and this is the cleanest demonstration in the module: ventilation fixes the CO2 axis and the shunt answers only to recruitment and oxygen.',
    metric: (s) => s.derived.paO2,
  },
  {
    id: 'shunt-widens-the-a-a-gradient',
    stem: 'A previously healthy man with a pneumonia-like injury now has a third of his cardiac output passing through unventilated lung.',
    setup: { preset: 'normal' },
    intervention: { label: 'The V/Q shunt rises from 2% to 30% of cardiac output.', inputs: { shuntFraction: 0.3 } },
    prompt: 'What happens to PaO2?',
    watch: 'the PaO2',
    correctDirection: 'falls',
    explanation:
      'The shunt is blood that skips gas exchange entirely, and the more of it there is, the more mixed venous blood the artery collects. PaO2 falls from 94 towards 54 and the arterial-venous content gap does the real work — a widening A-a gradient is precisely the footprint of this and only this kind of hypoxaemia. Alveolar hypoventilation narrows the gradient; diffusion problems and shunts widen it. So when the map shows a low PaO2 with a normal PaCO2 and a big A-a gap, the model is telling you the shunt is the culprit before you touch a slider.',
    metric: (s) => s.derived.paO2,
  },
];
import type { PredictQuestion } from '@/shared/assessment/types';
import type { DerivedValues, SimInputs, SimState } from './engine/types';
import type { PresetName } from './engine/presets';

type Snapshot = { state: SimState; derived: DerivedValues };
export type CardiorenalQuestion = PredictQuestion<SimInputs, PresetName, Snapshot>;

export const CARDIORENAL_QUESTIONS: readonly CardiorenalQuestion[] = [
  {
    id: 'failing-ventricle-volume',
    stem: 'A previously well patient suffers a large anterior myocardial infarction. Contractility drops sharply; the kidneys, vessels and blood volume all start out entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Contractility falls to 45% of normal.', inputs: { contractility: 0.45 } },
    prompt: 'What happens to blood volume over the following days?',
    watch: 'blood volume',
    correctDirection: 'rises',
    explanation:
      'The fall in cardiac output is read by the baroreceptors and the kidney as underfilling, so RAAS activates and retains salt and water. Blood volume climbs. The tragedy of the mechanism is that it is calibrated for haemorrhage, where more volume genuinely helps — but a weak ventricle cannot use the extra preload, so the volume accumulates as congestion while the pressure never fully normalises. This is the cardiorenal syndrome, and it is why diuretics rather than fluids are the treatment.',
    metric: (s) => s.state.bloodVolume,
  },
  {
    id: 'kidney-failure-pressure',
    stem: 'A patient develops advanced chronic kidney disease. Their heart is normal, their vessels are normal, and their salt intake is unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Kidney function falls to 25%.', inputs: { kidneyFunction: 0.25 } },
    prompt: 'What happens to mean arterial pressure?',
    watch: 'MAP',
    correctDirection: 'rises',
    explanation:
      'A kidney that cannot excrete the daily sodium and water load lets blood volume expand, and the expanded volume raises cardiac output and therefore pressure. RAAS compounds it: the failing kidney reads its own low filtration as underperfusion and keeps signalling for more retention even as the pressure climbs. This is why hypertension is near-universal in CKD, and why it is treated with salt restriction and RAAS blockade rather than with agents that simply dilate.',
    metric: (s) => s.derived.meanArterialPressure,
  },

  {
    id: 'raas-defends-pressure-not-flow',
    stem: 'A patient loses a litre of blood. Their heart and kidneys are normal, and nobody has given them anything.',
    setup: { preset: 'normal' },
    intervention: { label: 'Vascular tone rises sharply as the reflex engages.', inputs: { vascularTone: 165 } },
    prompt: 'What happens to renal blood flow?',
    watch: 'renal blood flow',
    correctDirection: 'falls',
    explanation:
      'It falls, and it falls precisely BECAUSE the reflex is working. Vasoconstriction defends the mean arterial pressure by raising resistance, and the kidney is one of the beds being constricted to do it — perfusion pressure is preserved at the cost of perfusion. This is the mechanism behind pre-renal acute kidney injury, and it is why a normal blood pressure in a bleeding patient is not reassurance about their kidneys. The compensation is buying time for the brain and heart, and the kidney is paying for it.',
    metric: (s) => s.derived.renalBloodFlow,
  },
  {
    id: 'salt-load-raises-volume',
    stem: 'A patient with entirely normal heart and kidneys changes to a very high salt diet and stays on it.',
    setup: { preset: 'normal' },
    intervention: { label: 'Sodium intake triples.', inputs: { sodiumIntake: 300 } },
    prompt: 'What happens to blood volume?',
    watch: 'blood volume',
    correctDirection: 'rises',
    observeSeconds: 1200,
    explanation:
      'Volume rises, because sodium is what water follows. The kidney will eventually excrete the extra load and reach a new steady state, but it does so at a higher volume and a higher pressure — pressure natriuresis is the mechanism, and raising the pressure is how it works rather than a side effect of it. That is the whole of the salt-and-hypertension argument in one loop: the kidney does not fail to handle the salt, it handles it at a cost.',
    metric: (s) => s.state.bloodVolume,
  },
  {
    id: 'failing-kidney-raises-raas',
    stem: 'A patient develops chronic kidney disease. Their heart is normal and their salt intake has not changed.',
    setup: { preset: 'normal' },
    intervention: { label: 'Kidney function falls to a quarter of normal.', inputs: { kidneyFunction: 0.25 } },
    prompt: 'What happens to RAAS activation?',
    watch: 'RAAS activation',
    correctDirection: 'rises',
    observeSeconds: 1200,
    explanation:
      'It rises, because the failing kidney senses poor delivery and cannot distinguish it from hypovolaemia. So it activates the very system designed to correct a low volume — retaining salt and water and constricting vessels in a patient who is already overloaded. The loop is closed the wrong way round, which is why renal disease causes hypertension rather than merely accompanying it, and why blocking this axis is the mainstay of treating it.',
    metric: (s) => s.derived.raasActivation,
  },
  {
    id: 'contractility-and-gfr',
    stem: 'A patient has an anterior myocardial infarction. Their kidneys are structurally entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Contractility falls to 40% of normal.', inputs: { contractility: 0.4 } },
    prompt: 'What happens to GFR?',
    watch: 'GFR',
    correctDirection: 'falls',
    observeSeconds: 1200,
    explanation:
      'The GFR falls even though nothing is wrong with the kidney, because renal blood flow is gated on forward flow from the heart. This is cardiorenal syndrome, and the important part is that it is a mechanism rather than a correlation: the kidney is not injured, it is underperfused, and it will recover if the output does. It is also why treating the rising creatinine as a renal problem — by giving fluid, say — makes a congested patient worse.',
    metric: (s) => s.derived.gfr,
  }
];

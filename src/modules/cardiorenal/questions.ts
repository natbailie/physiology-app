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
];

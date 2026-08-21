import type { PredictQuestion } from '@/shared/assessment/types';
import type { CapillaryDerived, CapillaryInputs, CapillaryState } from './engine/types';
import type { CapillaryPresetName } from './engine/presets';

type Snapshot = { state: CapillaryState; derived: CapillaryDerived };
export type CapillaryQuestion = PredictQuestion<CapillaryInputs, CapillaryPresetName, Snapshot>;

export const CAPILLARY_QUESTIONS: readonly CapillaryQuestion[] = [
  {
    id: 'venous-pressure-transmits',
    stem: 'A patient in right heart failure has a raised venous pressure. Their arterial pressure, albumin and lymphatics are all normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Venous outflow pressure rises to 28 mmHg.', inputs: { venousOutflowPressure: 28 } },
    prompt: 'What happens to capillary hydrostatic pressure?',
    watch: 'capillary pressure',
    correctDirection: 'rises',
    explanation:
      'It rises almost as much as the venous pressure did, and the reason is the resistance ratio. Capillary pressure is a weighted average of the arterial and venous ends, but pre-capillary resistance is roughly fifteen times post-capillary resistance — so venous pressure transmits back to the capillary almost fully while arterial pressure barely transmits at all. That asymmetry is why heart failure causes oedema and why hypertension does not, and it is worth contrasting the two directly by raising the arterial inflow instead.',
    metric: (s) => s.derived.capillaryPressureMmHg,
  },
  {
    id: 'albumin-oncotic-nonlinear',
    stem: 'A patient with nephrotic syndrome is losing albumin in the urine. Their capillary pressures and lymphatics are normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Plasma albumin falls from 4.2 to 1.8 g/dL.', inputs: { plasmaAlbuminGDl: 1.8 } },
    prompt: 'What happens to plasma oncotic pressure?',
    watch: 'plasma oncotic pressure',
    correctDirection: 'falls',
    explanation:
      'It falls, but note that it falls by MORE than half even though albumin fell by slightly less than half. Oncotic pressure follows the Landis-Pappenheimer relation, which is markedly non-linear — protein contributes disproportionately at higher concentrations. That non-linearity is why modest hypoalbuminaemia is tolerated and why severe hypoalbuminaemia produces oedema so abruptly. It also explains why albumin infusion helps more than the arithmetic suggests it should.',
    metric: (s) => s.derived.plasmaOncoticMmHg,
  },
  {
    id: 'lymphatic-reserve',
    stem: 'A patient has had axillary lymph nodes cleared and irradiated. Their capillary pressures and plasma albumin are entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Lymphatic drainage capacity is largely lost.', inputs: { lymphaticFlowCapacity: 0.08 } },
    prompt: 'What happens to the excess interstitial fluid?',
    watch: 'interstitial excess',
    correctDirection: 'rises',
    observeSeconds: 2400,
    explanation:
      'Fluid accumulates even though every Starling force is normal, because filtration slightly exceeds reabsorption at all times and the lymphatics are what return the difference. They normally run with roughly twenty-fold reserve, which is why lymphatic failure has to be near-total before oedema appears — and why, once it does, the swelling is non-pitting and protein-rich rather than the soft pitting oedema of heart failure. Same symptom, entirely different mechanism.',
    metric: (s) => s.derived.interstitialExcess,
  },
];

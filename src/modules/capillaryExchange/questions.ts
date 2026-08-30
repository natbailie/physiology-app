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
      'It falls, but note that it falls by more than half even though albumin fell by slightly less than half. Oncotic pressure follows the Landis-Pappenheimer relation, which is markedly non-linear — protein contributes disproportionately at higher concentrations. That non-linearity is why modest hypoalbuminaemia is tolerated and why severe hypoalbuminaemia produces oedema so abruptly. It also explains why albumin infusion helps more than the arithmetic suggests it should.',
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

  {
    id: 'sepsis-blunts-albumin',
    stem: 'A septic patient is oedematous. Someone suggests albumin, reasoning that raising the plasma oncotic pressure will pull the fluid back in.',
    setup: { preset: 'sepsis' },
    intervention: { label: 'Plasma albumin is raised substantially.', inputs: { plasmaAlbuminGDl: 5 } },
    prompt: 'What happens to the net filtration pressure?',
    watch: 'the net filtration pressure',
    correctDirection: 'falls',
    settleSeconds: 2400,
    observeSeconds: 900,
    explanation:
      'It falls — but by roughly half what the same infusion would achieve through an intact capillary wall, and not nearly enough to stop the oedema. The reason is the reflection coefficient: it multiplies the entire oncotic term, so when sepsis makes the wall leaky to protein, every milligram of albumin given buys only a fraction of the pull it should. Compare the nephrotic preset, where the wall is intact and the patient is simply short of protein — there the identical infusion reverses filtration outright. Same drug, same dose, opposite verdicts, and the difference is a coefficient rather than a pressure.',
    metric: (s) => s.derived.netFiltrationPressure,
  },
  {
    id: 'precapillary-tone-protects',
    stem: 'A patient stands up. Arterial pressure at the level of the ankle rises considerably, but the tissue does not immediately swell.',
    setup: { preset: 'normal' },
    intervention: { label: 'Precapillary arteriolar tone rises.', inputs: { precapillaryTone: 175 } },
    prompt: 'What happens to the capillary hydrostatic pressure?',
    watch: 'the capillary pressure',
    correctDirection: 'falls',
    explanation:
      'It falls, because the arteriole is upstream of the capillary and constricting it drops more of the pressure before the exchange vessels are reached. This is why capillary pressure is far closer to venous pressure than arterial: the precapillary sphincter is a pressure-reducing valve, and it is what protects the interstitium when arterial pressure swings. It is also why a venous pressure rise causes oedema so much more readily than an arterial one — there is nothing downstream to absorb it.',
    metric: (s) => s.derived.capillaryPressureMmHg,
  },
  {
    id: 'lymphatic-failure-alone',
    stem: 'A patient has had axillary lymph nodes cleared during breast cancer surgery. Their heart, kidneys and plasma protein are all entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Lymphatic drainage capacity collapses.', inputs: { lymphaticFlowCapacity: 0.1 } },
    prompt: 'What happens to the interstitial excess?',
    watch: 'the interstitial excess',
    correctDirection: 'rises',
    observeSeconds: 900,
    explanation:
      'Fluid accumulates even though every Starling force is normal, because filtration slightly exceeds reabsorption in health and the lymphatics carry the difference away. Remove them and a small daily surplus has nowhere to go. Two things follow that make lymphoedema distinctive: it is high in protein, since the lymphatics were also the route protein returned by, and it is non-pitting once established, because the retained protein organises the tissue rather than sitting in it as free water.',
    metric: (s) => s.derived.interstitialExcess,
  }
];

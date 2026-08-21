import type { PredictQuestion } from '@/shared/assessment/types';
import type { RespMechDerived, RespMechInputs, RespMechState } from './engine/types';
import type { RespMechPresetName } from './engine/presets';

type Snapshot = { state: RespMechState; derived: RespMechDerived };
export type RespMechQuestion = PredictQuestion<RespMechInputs, RespMechPresetName, Snapshot>;

export const RESP_MECH_QUESTIONS: readonly RespMechQuestion[] = [
  {
    id: 'restriction-preserves-ratio',
    stem: 'A patient with pulmonary fibrosis has stiff lungs. Their airways are entirely normal — nothing is obstructing flow.',
    setup: { preset: 'normal' },
    intervention: { label: 'Lung compliance falls to 25 mL/cmH2O.', inputs: { lungCompliance: 25 } },
    prompt: 'What happens to the FEV1/FVC ratio?',
    watch: 'the FEV1/FVC ratio',
    correctDirection: 'unchanged',
    explanation:
      'The ratio is preserved, and sometimes even rises — which is exactly why it is the useful number. Restriction reduces the volume available but leaves the airways alone, so a smaller vital capacity empties at a normal proportional rate. A low FVC therefore means nothing on its own; it is the RATIO that says whether the problem is getting air out or getting it in. Obstruction drops the ratio, restriction preserves it, and that single comparison sorts most spirometry.',
    metric: (s) => s.derived.fev1RatioPercent,
  },
  {
    id: 'obstruction-time-constant',
    stem: 'A patient with COPD has markedly increased airway resistance. Their lung compliance is, if anything, higher than normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Airway resistance rises to 14 cmH2O/L/s.', inputs: { airwayResistance: 14 } },
    prompt: 'What happens to the expiratory time constant?',
    watch: 'the time constant',
    correctDirection: 'rises',
    explanation:
      'The time constant is resistance multiplied by compliance, so raising resistance lengthens it directly. Expiration is passive and exponential, needing roughly three time constants to empty — so a lengthened constant means the lung may not finish emptying before the next breath begins. That is air trapping, and it carries a nasty corollary: breathing FASTER shortens expiration further and traps more air each breath, so the patient who is working harder is making it worse.',
    metric: (s) => s.derived.timeConstantSeconds,
  },
  {
    id: 'hpv-shunt-vs-deadspace',
    stem: 'A patient develops a large right-to-left shunt from consolidated lung — perfused alveoli that are not being ventilated at all. Hypoxic pulmonary vasoconstriction is intact.',
    setup: { preset: 'normal' },
    intervention: { label: 'Hypoxic pulmonary vasoconstriction is abolished.', inputs: { shuntFraction: 35, hpvStrength: 0 } },
    prompt: 'What happens to the V/Q ratio of the shunted unit?',
    watch: 'the shunted unit',
    correctDirection: 'falls',
    explanation:
      'Without hypoxic vasoconstriction, blood keeps flowing through the unventilated unit and its V/Q falls further toward zero. HPV exists to divert perfusion away from lung that is not being ventilated, partially correcting a shunt — and note the asymmetry: it does nothing whatever for dead space, where the problem is ventilation reaching unperfused alveoli. Shunt has a defence; dead space does not. That is why shunt responds poorly to supplemental oxygen while dead space responds poorly to nothing at all.',
    metric: (s) => s.derived.vqRatioB,
  },
];

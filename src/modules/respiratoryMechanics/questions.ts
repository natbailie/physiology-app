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

  {
    id: 'surfactant-loss-stiffens',
    stem: 'A premature neonate has not yet made adequate surfactant. Their airways are structurally normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'Surfactant function collapses.', inputs: { surfactantFunction: 0.15 } },
    prompt: 'What happens to effective compliance?',
    watch: 'the effective compliance',
    correctDirection: 'falls',
    explanation:
      'The lung becomes far stiffer, because surfactant is what lowers alveolar surface tension. Two consequences follow from Laplace. The pressure needed to keep an alveolus open goes up, so the work of breathing rises steeply. And because that pressure varies inversely with radius, small alveoli would empty into large ones without surfactant to stabilise them — which is why the disease is one of collapse rather than merely of stiffness, and why the treatment is to replace the missing molecule.',
    metric: (s) => s.derived.effectiveCompliance,
  },
  {
    id: 'dead-space-wastes-ventilation',
    stem: 'A patient has a large pulmonary embolism. Ventilation is unchanged and their airways are clear.',
    setup: { preset: 'normal' },
    intervention: { label: 'Dead space fraction rises sharply.', inputs: { deadSpaceFraction: 60 } },
    prompt: 'What happens to alveolar ventilation?',
    watch: 'the alveolar ventilation',
    correctDirection: 'falls',
    explanation:
      'Alveolar ventilation falls even though minute ventilation has not changed at all, because a larger share of every breath is now going to lung that is ventilated but not perfused. This is why an embolism raises CO2 despite the patient breathing hard, and why the arterial CO2 can be normal while the END-TIDAL value is low — the gap between the two is dead space made measurable, and it is the basis for capnography in suspected embolism.',
    metric: (s) => s.derived.alveolarVentilationMLPerMin,
  },
  {
    id: 'fibrosis-shrinks-volumes',
    stem: 'A patient develops pulmonary fibrosis. Their airways are not obstructed and their respiratory muscles are strong.',
    setup: { preset: 'normal' },
    intervention: { label: 'Lung compliance falls sharply.', inputs: { lungCompliance: 0.03 } },
    prompt: 'What happens to total lung capacity?',
    watch: 'the total lung capacity',
    correctDirection: 'falls',
    explanation:
      'Every volume shrinks, because total lung capacity is where the inward elastic recoil of the lung balances the outward pull of the chest wall — and a stiffer lung pulls harder, so the balance is struck at a smaller volume. This is the defining feature of a restrictive defect. What does NOT change is the FEV1/FVC ratio, because both numerator and denominator shrink together, which is precisely how spirometry separates restriction from obstruction.',
    metric: (s) => s.derived.totalLungCapacityML,
  }
];

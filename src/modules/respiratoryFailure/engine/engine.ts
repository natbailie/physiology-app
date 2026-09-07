import type { RfDerived, RfInputs, RfSnapshot, RfState } from './types';
import { FAILURE_THRESHOLDS, RF_GAS, RF_PHYSIOLOGY } from './constants';
import { alveolarPAO2, paO2FromShunt, severinghausSaO2 } from './gas';

/**
 * The model is deliberately static: gas exchange is a snapshot, not a trajectory. Lever changes
 * rescore the blood gas instantly, which is exactly how the classification map should feel.
 */

export function computeDerived(state: RfState, inputs: RfInputs): RfDerived {
  void state;
  const alveolarVentilationMLPerMin =
    inputs.minuteVentilation * 1000 * (1 - RF_PHYSIOLOGY.DEAD_SPACE_FRACTION);

  const paCO2 = paCo2MmHg(inputs.co2ProductionMultiplier, alveolarVentilationMLPerMin);

  const alveolarPAO2mmHg = alveolarPAO2(inputs.fiO2, paCO2);
  // Extreme CO2 loads make the alveolar gas equation go negative; physiological gas exchange can
  // only reproduce so much, so the O2 leg is floored at the solver's minimum.
  const flooredAlveolarPao2 = Math.max(alveolarPAO2mmHg, RF_GAS.MIN_PAO2);
  const paO2 = inputs.shuntFraction > 0
    ? paO2FromShunt(flooredAlveolarPao2, inputs.shuntFraction)
    : flooredAlveolarPao2;
  const saO2 = severinghausSaO2(paO2) * 100;

  const respiratoryAcidosis = paCO2 > FAILURE_THRESHOLDS.HYPERCAPNIA_PACO2;
  const baseDeficitAbove40 = Math.max(paCO2 - 40, 0);
  const acuteDelta = baseDeficitAbove40 * 0.1;
  const chronicDelta = baseDeficitAbove40 * 0.4;
  const chronic = inputs.course === 'chronic';
  const delta = chronic ? chronicDelta : acuteDelta;
  const plasmaHCO3 = 24 + delta;
  const pH = 6.1 + Math.log10(plasmaHCO3 / (0.03 * paCO2));

  const hypoxaemia =
    paO2 >= FAILURE_THRESHOLDS.BORDERLINE_HYPOXAEMIA_PAO2
      ? 'none'
      : paO2 >= FAILURE_THRESHOLDS.HYPOXAEMIA_PAO2
        ? 'borderline'
        : 'severe';

  const hypoxic = paO2 < FAILURE_THRESHOLDS.HYPOXAEMIA_PAO2;
  const hypercapnic = paCO2 > FAILURE_THRESHOLDS.HYPERCAPNIA_PACO2;
  const failureType =
    hypoxic && hypercapnic ? 'mixed' : hypoxic ? 'type 1' : hypercapnic ? 'type 2' : 'none';

  return {
    alveolarVentilationMLPerMin,
    effectiveShuntFraction: inputs.shuntFraction,
    paO2,
    paCO2,
    saO2,
    pH,
    plasmaHCO3,
    alveolarPAO2: alveolarPAO2mmHg,
    aaGradient: alveolarPAO2mmHg - paO2,
    paO2FiO2Ratio: paO2 / inputs.fiO2,
    hypoxaemia,
    failureType,
    respiratoryAcidosis,
  };
}

export function paCo2MmHg(co2ProductionMultiplier: number, alveolarVentilationMLPerMin: number): number {
  return (40 * co2ProductionMultiplier) /
    (alveolarVentilationMLPerMin / RF_PHYSIOLOGY.NORMAL_ALVEOLAR_VENTILATION_ML_PER_MIN);
}

export function plasmaPH(hco3: number, paCO2: number): number {
  return 6.1 + Math.log10(hco3 / (0.03 * paCO2));
}

export function step(state: RfState, inputs: RfInputs, dt: number): RfSnapshot {
  return {
    state: { simTimeSeconds: state.simTimeSeconds + dt },
    derived: computeDerived(state, inputs),
  };
}

export function createInitialState(): RfState {
  return { simTimeSeconds: 0 };
}
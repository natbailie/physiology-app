import { makeInitialState, MV_PHYSIOLOGY } from './constants';
import {
  airwayPressureAtPhase,
  drivingPressureCmH2O,
  inspiratoryPressureCmH2O,
  meanAirwayPressureCmH2O,
  meanInspiratoryFlowLPerSec,
  resistivePressureDropCmH2O,
  supportPressureCmH2O,
} from './pressures';
import {
  airTrapping,
  alveolarVentilationMLPerMin,
  effectiveDeadSpaceFraction,
  effectiveRatePerMin,
  intrinsicAutoPeepCmH2O,
  tidalVolumeML,
  wobEffortPct,
} from './ventilation';
import {
  aaGradientMmHg,
  alveolarPAO2,
  arterialPaO2MmHg,
  effectiveShuntFraction,
  paCo2MmHg,
  plasmaHco3MmEqPerL,
  plasmaPH,
  recruitmentLevel,
  saO2FromPaO2,
} from './gasExchange';
import { failureType as classifyFailure, hypoxaemiaGrade as gradeHypoxaemia, viliRisk } from './interpretation';
import type { MvDerived, MvInputs, MvSnapshot, MvState } from './types';

/** Build the full derived picture from the ventilator dial plus the patient it is attached to.
 *
 * The model is steady-state in gas exchange while the airway-pressure waveform rides on the
 * state's breath clock; everything the readouts show is re-derived from `state` + `inputs` so
 * the two stay in lockstep. */
export function computeDerived(state: MvState, inputs: MvInputs): MvDerived {
  const peep = inputs.epapPeepCmH2O;
  const rate = effectiveRatePerMin(inputs);
  const vt = tidalVolumeML(inputs, peep);
  const trapping = airTrapping(inputs, rate);
  const effDeadSpace = effectiveDeadSpaceFraction(inputs, trapping);
  const va = alveolarVentilationMLPerMin(vt, effDeadSpace, rate);
  const inspiratory = inspiratoryPressureCmH2O(inputs.mode, inputs.ipapPipCmH2O, peep);
  const support = supportPressureCmH2O(inputs.mode, inputs.ipapPipCmH2O, peep);
  const driving = drivingPressureCmH2O(inputs.mode, inspiratory, peep);
  const autoPeep = intrinsicAutoPeepCmH2O(inputs, trapping);
  const totalPeep = peep + autoPeep;
  const meanAirway = meanAirwayPressureCmH2O(totalPeep, inspiratory);
  const inspiratoryFlow = meanInspiratoryFlowLPerSec(Math.max(vt, 1), rate);
  // CPAP produces no machine flow — there is no resistive drop to speak of, and the airway line
  // stays flat at EPAP. Support modes add whatever the resistance eats off the set peak.
  const resistiveDrop =
    inputs.mode === 'cpap'
      ? 0
      : resistivePressureDropCmH2O(inspiratoryFlow, inputs.airwayResistanceCmH2OPerLPerSec);
  const airwayPressure = airwayPressureAtPhase(state.breathPhaseFraction, totalPeep, inspiratory + resistiveDrop);

  const paCO2 = paCo2MmHg(inputs.co2ProductionMultiplier, va);
  const paO2 = arterialPaO2MmHg(
    alveolarPAO2(inputs.fiO2, paCO2),
    effectiveShuntFraction(inputs.shuntFraction, inputs.recruitability, totalPeep),
    MV_PHYSIOLOGY.HEMOGLOBIN_G_PER_DL,
    MV_PHYSIOLOGY.MIXED_VENOUS_SVO2,
  );
  const hco3 = plasmaHco3MmEqPerL(paCO2, inputs.chronicKidneyCompensation);
  const ph = plasmaPH(hco3, paCO2);

  return {
    mode: inputs.mode,
    inspiratoryPressureCmH2O: round1(inspiratory),
    peakPressureCmH2O: round1(inspiratory + resistiveDrop),
    supportPressureCmH2O: round1(support),
    drivingPressureCmH2O: round1(driving),
    meanAirwayPressureCmH2O: round1(meanAirway),
    intrinsicPeepCmH2O: round1(autoPeep),
    totalPeepCmH2O: round1(totalPeep),
    airwayPressureCmH2O: round1(airwayPressure),
    breathPhaseFraction: state.breathPhaseFraction,
    tidalVolumeML: Math.round(vt),
    effectiveRatePerMin: round1(rate),
    minuteVentilationMLPerMin: Math.round(vt * rate),
    alveolarVentilationMLPerMin: Math.round(va),
    recruitmentLevel: round1(recruitmentLevel(inputs.recruitability, totalPeep)),
    effectiveShuntFraction: round1(effectiveShuntFraction(inputs.shuntFraction, inputs.recruitability, totalPeep)),
    effectiveDeadSpaceFraction: round1(effDeadSpace),
    airTrapping: round1(trapping),
    wobEffortPct: wobEffortPct(inputs, peep),
    paO2: round1(paO2),
    paCO2: round1(paCO2),
    saO2: round1(saO2FromPaO2(paO2)),
    pH: round2(ph),
    plasmaHCO3: round1(hco3),
    aaGradient: round1(aaGradientMmHg(alveolarPAO2(inputs.fiO2, paCO2), paO2)),
    paO2FiO2Ratio: Math.round(paO2 / inputs.fiO2),
    failureType: classifyFailure(paO2, paCO2),
    hypoxaemia: gradeHypoxaemia(paO2),
    viliRisk: viliRisk(driving, inspiratory),
    respiratoryAcidosis: paCO2 > 45,
  };
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function createInitialState(): MvState {
  return makeInitialState();
}

/** Advance the breath clock. No state accumulation beyond time and phase: ventilation and gas
 * exchange settle instantly, and the deterministic phase keeps the drift test steady. */
export function step(state: MvState, inputs: MvInputs, dtSeconds: number): MvSnapshot {
  const rate = Math.max(effectiveRatePerMin(inputs), 1);
  const cycleSeconds = 60 / rate;
  const next: MvState = {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    breathPhaseFraction: (state.breathPhaseFraction + dtSeconds / cycleSeconds) % 1,
  };
  return { state: next, derived: computeDerived(next, inputs) };
}
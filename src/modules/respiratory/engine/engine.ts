import { BICARBONATE, ACUTE_BUFFER, RENAL_COMPENSATION, METABOLIC_LOAD, CHEMORECEPTOR, BRONCHOSPASM } from './constants';
import { effectiveMinuteVentilation, alveolarVentilationFraction, paCO2, aaGradient, paO2, saO2 } from './gasExchange';
import { pH } from './acidBase';
import { anionGapMEqL, deltaRatio } from './anionGap';
import { expectedHCO3Range, expectedPaCO2Range, interpret } from './interpretation';
import { chemoreceptorDriveTarget } from './chemoreceptor';
import { acuteBufferDriveTarget } from './acuteBuffer';
import { renalCompensationDriveTarget } from './renalCompensation';
import { approach, clamp } from '@/shared/lib/math';
import type { RespDerived, RespInputs, RespSnapshot, RespState } from './types';

export function createInitialState(): RespState {
  return {
    plasmaHCO3: BICARBONATE.BASELINE_MEQ_L,
    simTimeSeconds: 0,
    chemoreceptorDrive: 0,
    acuteBufferDrive: 0,
    bufferOffsetMEqL: 0,
    renalCompensationDrive: 0,
    renalOffsetMEqL: 0,
    airwayObstruction: 0,
    metabolicAcidBurdenMEqL: 0,
  };
}

/**
 * Computes every derived gas-exchange/acid-base value for the current tick from the
 * current plasma HCO3- and inputs, using the *smoothed* chemoreceptor/buffer/renal
 * actuator levels carried on state (each relaxes toward its target on its own time
 * constant — see `tick`). Mirrors the cardiorenal engine's computeDerived/tick split.
 */
export function computeDerived(state: RespState, inputs: RespInputs): RespDerived {
  const effVent = effectiveMinuteVentilation(inputs.minuteVentilation, state.chemoreceptorDrive);
  const vaFraction = alveolarVentilationFraction(effVent, state.airwayObstruction, inputs.vqMismatch);
  const co2 = paCO2(inputs.co2Production, vaFraction);
  const aaGrad = aaGradient(state.airwayObstruction, inputs.vqMismatch);
  const o2 = paO2(inputs.fiO2, co2, aaGrad);
  const sat = saO2(o2);
  const currentPH = pH(state.plasmaHCO3, co2);

  const gap = anionGapMEqL(state.metabolicAcidBurdenMEqL, inputs.acidType);
  const ratio = deltaRatio(gap, state.plasmaHCO3);
  const verdict = interpret(currentPH, co2, state.plasmaHCO3, gap, ratio);
  const metabolicPrimary = verdict.primary === 'metabolic acidosis' || verdict.primary === 'metabolic alkalosis';
  const respiratoryPrimary = verdict.primary === 'respiratory acidosis' || verdict.primary === 'respiratory alkalosis';

  return {
    effectiveMinuteVentilation: effVent,
    alveolarVentilationFraction: vaFraction,
    paCO2: co2,
    paO2: o2,
    aaGradient: aaGrad,
    saO2: sat,
    plasmaHCO3: state.plasmaHCO3,
    pH: currentPH,
    anionGapMEqL: gap,
    deltaRatio: ratio,
    expectedPaCO2Range: metabolicPrimary ? expectedPaCO2Range(state.plasmaHCO3) : null,
    expectedHCO3Range: respiratoryPrimary ? expectedHCO3Range(co2) : null,
    interpretation: verdict,
    chemoreceptorDrive: state.chemoreceptorDrive,
    acuteBufferDrive: state.acuteBufferDrive,
    renalCompensationDrive: state.renalCompensationDrive,
    airwayObstruction: state.airwayObstruction,
    vqMismatch: inputs.vqMismatch,
    metabolicAcidLoad: inputs.metabolicAcidLoad,
    acidType: inputs.acidType,
    renalCompensationCapacity: inputs.renalCompensationCapacity,
  };
}

export function tick(state: RespState, derived: RespDerived, dtSeconds: number): RespState {
  // The exogenous load consumes bicarbonate, and the accumulated burden is simultaneously
  // cleared — acid is metabolised and excreted as well as produced. The two terms balance at
  // a deficit proportional to the load, which is why a mild acidosis stays mild here instead
  // of eventually reaching the same floored bicarbonate as a catastrophic one.
  const consumption = derived.metabolicAcidLoad * METABOLIC_LOAD.HCO3_GAIN_PER_SECOND;
  const clearance = state.metabolicAcidBurdenMEqL / METABOLIC_LOAD.CLEARANCE_TAU_SECONDS;
  const metabolicAcidBurdenMEqL = state.metabolicAcidBurdenMEqL + (consumption - clearance) * dtSeconds;

  // Each defence contributes a BOUNDED bicarbonate offset that it relaxes toward on its own
  // time constant — chemical buffering in minutes, the kidney over days. Bicarbonate is then
  // the sum rather than an open integral, so each arm settles somewhere specific and the
  // acute and chronic values are genuinely different numbers.
  const bufferCeiling =
    derived.acuteBufferDrive >= 0 ? ACUTE_BUFFER.MAX_OFFSET_RISE_MEQ_L : ACUTE_BUFFER.MAX_OFFSET_FALL_MEQ_L;
  const bufferOffsetMEqL = approach(
    state.bufferOffsetMEqL,
    derived.acuteBufferDrive * bufferCeiling,
    dtSeconds,
    ACUTE_BUFFER.TAU_SECONDS,
  );
  const renalOffsetMEqL = approach(
    state.renalOffsetMEqL,
    derived.renalCompensationDrive * RENAL_COMPENSATION.MAX_OFFSET_MEQ_L,
    dtSeconds,
    RENAL_COMPENSATION.TAU_SECONDS,
  );

  const targetChemo = chemoreceptorDriveTarget(derived.paCO2, derived.paO2, derived.pH);
  const targetAcuteBuffer = acuteBufferDriveTarget(derived.paCO2);
  const targetRenal = renalCompensationDriveTarget(derived.pH, derived.renalCompensationCapacity);

  return {
    plasmaHCO3: clamp(
      BICARBONATE.BASELINE_MEQ_L + bufferOffsetMEqL + renalOffsetMEqL - metabolicAcidBurdenMEqL,
      BICARBONATE.MIN_MEQ_L,
      BICARBONATE.MAX_MEQ_L,
    ),
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    chemoreceptorDrive: approach(state.chemoreceptorDrive, targetChemo, dtSeconds, CHEMORECEPTOR.TAU_SECONDS),
    acuteBufferDrive: approach(state.acuteBufferDrive, targetAcuteBuffer, dtSeconds, ACUTE_BUFFER.TAU_SECONDS),
    bufferOffsetMEqL,
    renalCompensationDrive: approach(
      state.renalCompensationDrive,
      targetRenal,
      dtSeconds,
      RENAL_COMPENSATION.TAU_SECONDS,
    ),
    renalOffsetMEqL,
    airwayObstruction: approach(state.airwayObstruction, 0, dtSeconds, BRONCHOSPASM.RECOVERY_TAU_SECONDS),
    metabolicAcidBurdenMEqL,
  };
}

export function step(state: RespState, inputs: RespInputs, dtSeconds: number): RespSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute airway obstruction (e.g. bronchospasm) perturbation — an instant jump on the
 * transient obstruction state field, which then relaxes back to 0 via tick()'s own
 * approach() call, mirroring perturbBloodVolume's pattern in the cardiorenal module. */
export function perturbAirwayObstruction(state: RespState, magnitude: number = BRONCHOSPASM.DEFAULT_MAGNITUDE): RespState {
  return { ...state, airwayObstruction: clamp(state.airwayObstruction + magnitude, 0, 1) };
}

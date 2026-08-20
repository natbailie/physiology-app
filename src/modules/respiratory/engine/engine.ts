import { BICARBONATE, ACUTE_BUFFER, RENAL_COMPENSATION, METABOLIC_LOAD, CHEMORECEPTOR, BRONCHOSPASM } from './constants';
import { effectiveMinuteVentilation, alveolarVentilationFraction, paCO2, aaGradient, paO2, saO2 } from './gasExchange';
import { pH } from './acidBase';
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
    renalCompensationDrive: 0,
    airwayObstruction: 0,
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
  const vaFraction = alveolarVentilationFraction(effVent, state.airwayObstruction);
  const co2 = paCO2(inputs.co2Production, vaFraction);
  const aaGrad = aaGradient(state.airwayObstruction);
  const o2 = paO2(inputs.fiO2, co2, aaGrad);
  const sat = saO2(o2);
  const currentPH = pH(state.plasmaHCO3, co2);

  return {
    effectiveMinuteVentilation: effVent,
    alveolarVentilationFraction: vaFraction,
    paCO2: co2,
    paO2: o2,
    aaGradient: aaGrad,
    saO2: sat,
    plasmaHCO3: state.plasmaHCO3,
    pH: currentPH,
    chemoreceptorDrive: state.chemoreceptorDrive,
    acuteBufferDrive: state.acuteBufferDrive,
    renalCompensationDrive: state.renalCompensationDrive,
    airwayObstruction: state.airwayObstruction,
    metabolicAcidLoad: inputs.metabolicAcidLoad,
    renalCompensationCapacity: inputs.renalCompensationCapacity,
  };
}

export function tick(state: RespState, derived: RespDerived, dtSeconds: number): RespState {
  const dHCO3 =
    (derived.acuteBufferDrive * ACUTE_BUFFER.HCO3_GAIN_PER_SECOND +
      derived.renalCompensationDrive * RENAL_COMPENSATION.HCO3_GAIN_PER_SECOND -
      derived.metabolicAcidLoad * METABOLIC_LOAD.HCO3_GAIN_PER_SECOND) *
    dtSeconds;

  const targetChemo = chemoreceptorDriveTarget(derived.paCO2, derived.paO2, derived.pH);
  const targetAcuteBuffer = acuteBufferDriveTarget(derived.paCO2);
  const targetRenal = renalCompensationDriveTarget(derived.pH, derived.renalCompensationCapacity);

  return {
    plasmaHCO3: clamp(state.plasmaHCO3 + dHCO3, BICARBONATE.MIN_MEQ_L, BICARBONATE.MAX_MEQ_L),
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    chemoreceptorDrive: approach(state.chemoreceptorDrive, targetChemo, dtSeconds, CHEMORECEPTOR.TAU_SECONDS),
    acuteBufferDrive: approach(state.acuteBufferDrive, targetAcuteBuffer, dtSeconds, ACUTE_BUFFER.TAU_SECONDS),
    renalCompensationDrive: approach(
      state.renalCompensationDrive,
      targetRenal,
      dtSeconds,
      RENAL_COMPENSATION.TAU_SECONDS,
    ),
    airwayObstruction: approach(state.airwayObstruction, 0, dtSeconds, BRONCHOSPASM.RECOVERY_TAU_SECONDS),
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

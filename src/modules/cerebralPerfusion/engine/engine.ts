import { CRANIUM, CSF, VESSEL } from './constants';
import {
  cerebralBloodFlow,
  cerebralBloodVolume,
  cerebralPerfusionPressure,
  classify,
  csfNetAccumulation,
  cushingResponse,
  elastance,
  intracranialPressure,
  patternSummary,
  vesselCalibreTarget,
} from './cerebralMechanics';
import { approach, clamp } from '@/shared/lib/math';
import type { CerebralDerived, CerebralInputs, CerebralInternalState, CerebralSnapshot } from './types';

export function createInitialState(): CerebralInternalState {
  return {
    simTimeSeconds: 0,
    intracranialPressureMmHg: CRANIUM.BASELINE_ICP_MMHG,
    csfExcessMl: 0,
    drainedVolumeMl: 0,
    vesselCalibre: 1,
  };
}

export function computeDerived(state: CerebralInternalState, inputs: CerebralInputs): CerebralDerived {
  const bloodVolume = cerebralBloodVolume(state.vesselCalibre);
  // Everything competing for room in a box that cannot expand.
  const totalExcessVolumeMl =
    inputs.massVolumeMl + (bloodVolume - VESSEL.BASELINE_BLOOD_VOLUME_ML) + state.csfExcessMl - state.drainedVolumeMl;

  const icp = state.intracranialPressureMmHg;
  const cpp = cerebralPerfusionPressure(inputs.meanArterialPressureMmHg, icp, inputs.venousOutflowPressureMmHg);
  const cbf = cerebralBloodFlow(cpp, state.vesselCalibre, inputs.autoregulationIntegrity);
  const reserve = Math.max(0, CRANIUM.COMPENSATORY_RESERVE_ML - totalExcessVolumeMl);
  const cushing = cushingResponse(cpp);

  return {
    intracranialPressureMmHg: icp,
    cerebralPerfusionPressureMmHg: cpp,
    cerebralBloodFlow: cbf,
    cerebralBloodVolumeMl: bloodVolume,
    csfExcessMl: state.csfExcessMl,
    totalExcessVolumeMl,
    compensatoryReserveMl: reserve,
    vesselCalibre: state.vesselCalibre,
    elastanceMmHgPerMl: elastance(totalExcessVolumeMl),
    autoregulating: inputs.autoregulationIntegrity > 0.5,
    cushingResponseActive: cushing.active,
    reflexHeartRateBpm: cushing.heartRateBpm,
    herniationRisk: clamp((icp - 25) / 35, 0, 1),
    classification: classify(icp, cpp, cbf, reserve),
    patternSummary: patternSummary(icp, cpp, reserve, inputs.autoregulationIntegrity > 0.5),
    meanArterialPressureMmHg: inputs.meanArterialPressureMmHg,
    massVolumeMl: inputs.massVolumeMl,
    paCO2MmHg: inputs.paCO2MmHg,
    paO2MmHg: inputs.paO2MmHg,
    csfProductionRate: inputs.csfProductionRate,
    csfAbsorptionCapacity: inputs.csfAbsorptionCapacity,
    autoregulationIntegrity: inputs.autoregulationIntegrity,
    venousOutflowPressureMmHg: inputs.venousOutflowPressureMmHg,
  };
}

export function tick(
  state: CerebralInternalState,
  derived: CerebralDerived,
  inputs: CerebralInputs,
  dtSeconds: number,
): CerebralInternalState {
  const calibreTarget = vesselCalibreTarget(
    inputs.paCO2MmHg,
    inputs.paO2MmHg,
    derived.cerebralPerfusionPressureMmHg,
    inputs.autoregulationIntegrity,
  );

  const netCsfPerMinute = csfNetAccumulation(
    inputs.csfProductionRate,
    inputs.csfAbsorptionCapacity,
    derived.intracranialPressureMmHg,
    inputs.venousOutflowPressureMmHg,
  );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    // Pressure follows the contents rather than being assigned: the volume is the cause and the
    // pressure is the consequence, which is the whole of the Monro-Kellie idea.
    intracranialPressureMmHg: approach(
      state.intracranialPressureMmHg,
      intracranialPressure(derived.totalExcessVolumeMl),
      dtSeconds,
      CRANIUM.ICP_TAU_SECONDS,
    ),
    csfExcessMl: clamp(state.csfExcessMl + (netCsfPerMinute * dtSeconds) / 60, -20, CSF.MAX_EXCESS_ML),
    // Drained volume slowly refills as CSF is made again, which is why a drain is a holding
    // measure rather than a cure.
    drainedVolumeMl: Math.max(0, state.drainedVolumeMl - (CSF.PRODUCTION_ML_PER_MIN * dtSeconds) / 60),
    vesselCalibre: approach(state.vesselCalibre, calibreTarget, dtSeconds, VESSEL.TAU_SECONDS),
  };
}

export function step(state: CerebralInternalState, inputs: CerebralInputs, dtSeconds: number): CerebralSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Drain CSF, as an external ventricular drain does. Removing a few millilitres from a skull
 * with no reserve left drops the pressure dramatically — the steep part of the curve working
 * in the patient's favour for once. */
export function perturbDrainCsf(state: CerebralInternalState, millilitres = 12): CerebralInternalState {
  return { ...state, drainedVolumeMl: clamp(state.drainedVolumeMl + millilitres, 0, 60) };
}

/** An acute bleed: volume added to a box that is already full. */
export function perturbAcuteBleed(state: CerebralInternalState, millilitres = 20): CerebralInternalState {
  return { ...state, csfExcessMl: Math.min(CSF.MAX_EXCESS_ML, state.csfExcessMl + millilitres) };
}

export { CRANIUM };

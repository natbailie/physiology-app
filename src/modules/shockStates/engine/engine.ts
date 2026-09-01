import { BAROREFLEX, CIRCULATION, HEART, LACTATE, OXYGEN } from './constants';
import {
  cardiacOutputFromFilling,
  effectivePulmonaryResistance,
  heartRate,
  meanArterialPressure,
  meanSystemicFillingPressure,
  transpulmonaryFlow,
  venousReturn,
  wedgePressure,
} from './haemodynamics';
import {
  extractionRatio,
  lactateTarget,
  mixedVenousSaturation,
  oxygenConsumption,
  oxygenDelivery,
} from './oxygenTransport';
import { classifyShock, patternSummary } from './classification';
import { approach, clamp } from '@/shared/lib/math';
import type { ShockDerived, ShockInputs, ShockSnapshot, ShockState } from './types';

export function createInitialState(): ShockState {
  return {
    simTimeSeconds: 0,
    transmuralRapMmHg: 3,
    sympatheticDrive: 0,
    lactateMmolL: LACTATE.BASELINE_MMOL_L,
    volumeOffsetMl: 0,
  };
}

/**
 * Sympathetic outflow the baroreceptors are calling for, 0..1 — driven by how far pressure has
 * fallen BELOW its setpoint, not by pressure itself.
 *
 * Zero at the setpoint by construction, so a resting patient carries no standing sympathetic tone
 * and the module's calibrated baseline is the unstimulated circulation. It then climbs steeply,
 * saturating around 20 mmHg of error, which is what produces the shape the module is named for:
 * pressure held almost still while the reflex has headroom, then a cliff once it runs out.
 */
function sympatheticTarget(meanArterialPressureMmHg: number, baroreflexGain: number): number {
  const error = BAROREFLEX.SETPOINT_MMHG - meanArterialPressureMmHg;
  if (error <= 0) return 0;
  const raw = error / (error + BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG);
  return clamp(raw * clamp(baroreflexGain, 0, 1.5), 0, 1);
}

export function computeDerived(state: ShockState, inputs: ShockInputs): ShockDerived {
  const bloodVolumeMl = Math.max(500, inputs.bloodVolumeMl + state.volumeOffsetMl);
  const pmsf = meanSystemicFillingPressure(bloodVolumeMl, state.sympatheticDrive);

  // Compensation acts on resistance and on the pump, and both are gated by reflex gain — which
  // is how the same insult produces a compensated or an uncompensated patient.
  const drive = state.sympatheticDrive;
  const effectiveSvr = clamp(inputs.systemicVascularResistance * (1 + BAROREFLEX.SVR_GAIN * drive), 0.1, 3.5);
  const effectiveContractility = clamp(inputs.contractility * (1 + BAROREFLEX.INOTROPIC_GAIN * drive), 0, 2.5);

  const transmural = state.transmuralRapMmHg;
  const rightOutput = cardiacOutputFromFilling(transmural, effectiveContractility);
  // The left ventricle can only eject what crosses the lungs to reach it. Congestion behind a
  // failing left ventricle raises that resistance in turn, so one pass is taken to find the
  // wedge and a second to apply the load it creates on the right heart.
  const provisionalFlow = transpulmonaryFlow(rightOutput, inputs.pulmonaryVascularResistance);
  const provisionalTransit = rightOutput > 0 ? provisionalFlow / rightOutput : 1;
  const provisionalWedge = wedgePressure(provisionalFlow, effectiveContractility, pmsf, provisionalTransit);
  const pulmonaryResistance = effectivePulmonaryResistance(inputs.pulmonaryVascularResistance, provisionalWedge);
  const cardiacOutputLPerMin = transpulmonaryFlow(rightOutput, pulmonaryResistance);
  const transitFraction = rightOutput > 0 ? cardiacOutputLPerMin / rightOutput : 1;
  const wedge = wedgePressure(cardiacOutputLPerMin, effectiveContractility, pmsf, transitFraction);

  const centralVenousPressureMmHg = transmural + inputs.pericardialPressureMmHg;
  const meanArterialPressureMmHg = meanArterialPressure(cardiacOutputLPerMin, effectiveSvr);

  const deliveryMlPerMin = oxygenDelivery(inputs.haemoglobinGDl, cardiacOutputLPerMin);
  const consumptionMlPerMin = oxygenConsumption(
    inputs.oxygenDemandMlPerMin,
    deliveryMlPerMin,
    inputs.tissueExtractionCapacity,
  );

  const cardiacIndex = cardiacOutputLPerMin / CIRCULATION.BODY_SURFACE_AREA_M2;
  const pattern = {
    cardiacIndex,
    centralVenousPressureMmHg,
    wedgePressureMmHg: wedge,
    effectiveSvr,
    meanArterialPressureMmHg,
    lactateMmolL: state.lactateMmolL,
  };

  const bpm = heartRate(drive);

  return {
    centralVenousPressureMmHg,
    transmuralRapMmHg: transmural,
    meanSystemicFillingPressureMmHg: pmsf,
    wedgePressureMmHg: wedge,
    cardiacOutputLPerMin,
    cardiacIndex,
    strokeVolumeMl: (cardiacOutputLPerMin * 1000) / Math.max(bpm, 1),
    heartRateBpm: bpm,
    effectiveSvr,
    meanArterialPressureMmHg,
    sympatheticDrive: drive,
    oxygenDeliveryMlPerMin: deliveryMlPerMin,
    oxygenConsumptionMlPerMin: consumptionMlPerMin,
    oxygenExtractionRatio: extractionRatio(consumptionMlPerMin, deliveryMlPerMin),
    mixedVenousSaturationPercent: mixedVenousSaturation(
      consumptionMlPerMin,
      inputs.haemoglobinGDl,
      cardiacOutputLPerMin,
    ),
    lactateMmolL: state.lactateMmolL,
    isOxygenDebt: consumptionMlPerMin < inputs.oxygenDemandMlPerMin - 1,
    classification: classifyShock(pattern),
    patternSummary: patternSummary(pattern),
    bloodVolumeMl: inputs.bloodVolumeMl,
    contractility: inputs.contractility,
    systemicVascularResistance: inputs.systemicVascularResistance,
    pericardialPressureMmHg: inputs.pericardialPressureMmHg,
    pulmonaryVascularResistance: inputs.pulmonaryVascularResistance,
    tissueExtractionCapacity: inputs.tissueExtractionCapacity,
    oxygenDemandMlPerMin: inputs.oxygenDemandMlPerMin,
    haemoglobinGDl: inputs.haemoglobinGDl,
    baroreflexGain: inputs.baroreflexGain,
  };
}

export function tick(state: ShockState, derived: ShockDerived, inputs: ShockInputs, dtSeconds: number): ShockState {
  // Right atrial pressure is never assigned. Blood arriving faster than it can be moved onward
  // accumulates centrally and raises the pressure — which is why an obstruction downstream of
  // the atrium (a large embolus) raises the CVP without anyone adding any fluid.
  const vr = venousReturn(derived.meanSystemicFillingPressureMmHg, derived.centralVenousPressureMmHg, derived.effectiveSvr);
  const netFlowMlPerSecond = ((vr - derived.cardiacOutputLPerMin) * 1000) / 60;
  const dRap = netFlowMlPerSecond / HEART.ATRIAL_COMPLIANCE_ML_PER_MMHG;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    transmuralRapMmHg: clamp(
      state.transmuralRapMmHg + dRap * dtSeconds,
      HEART.MIN_TRANSMURAL_RAP_MMHG,
      HEART.MAX_TRANSMURAL_RAP_MMHG,
    ),
    sympatheticDrive: approach(
      state.sympatheticDrive,
      sympatheticTarget(derived.meanArterialPressureMmHg, inputs.baroreflexGain),
      dtSeconds,
      BAROREFLEX.TAU_SECONDS,
    ),
    lactateMmolL: approach(
      state.lactateMmolL,
      lactateTarget(
        inputs.oxygenDemandMlPerMin,
        derived.oxygenConsumptionMlPerMin,
        state.sympatheticDrive,
        derived.cardiacOutputLPerMin / CIRCULATION.BASELINE_CARDIAC_OUTPUT,
      ),
      dtSeconds,
      LACTATE.CLEARANCE_TAU_SECONDS,
    ),
    volumeOffsetMl: state.volumeOffsetMl,
  };
}

export function step(state: ShockState, inputs: ShockInputs, dtSeconds: number): ShockSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** Acute blood loss removes volume and, with it, filling pressure. */
export function perturbHaemorrhage(state: ShockState, millilitres = 1000): ShockState {
  return { ...state, volumeOffsetMl: Math.max(-3200, state.volumeOffsetMl - millilitres) };
}

/** A crystalloid bolus. Note it raises filling pressure in every shock state — but only helps
 * where filling was the problem, which is the point of classifying before treating. */
export function perturbFluidBolus(state: ShockState, millilitres = 1000): ShockState {
  return { ...state, volumeOffsetMl: Math.min(4000, state.volumeOffsetMl + millilitres) };
}

export { OXYGEN };

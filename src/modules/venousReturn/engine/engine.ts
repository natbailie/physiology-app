import { ATRIUM, CIRCULATION, THORACIC } from './constants';
import { meanSystemicFillingPressure, stressedVolume, totalCompliance } from './meanSystemicFillingPressure';
import { resistanceToVenousReturn, sampleVenousCurve, venousReturn } from './venousReturnCurve';
import { cardiacOutput, cardiacPlateau, sampleCardiacCurve } from './cardiacFunctionCurve';
import { findOperatingPoint, limitingFactor } from './operatingPoint';
import { effectiveIntrathoracicPressure } from './thoracicPressure';
import { approach, clamp } from '@/shared/lib/math';
import type { VenousReturnDerived, VenousReturnInputs, VenousReturnSnapshot, VenousReturnState } from './types';

/** Mean arterial pressure at a normal cardiac output and resistance, mmHg. */
const BASELINE_MAP = 93;
const BASELINE_CARDIAC_OUTPUT = 5;

export function createInitialState(): VenousReturnState {
  return {
    simTimeSeconds: 0,
    rightAtrialPressureMmHg: 0,
    volumeOffsetMl: 0,
    intrathoracicSurgeMmHg: 0,
  };
}

export function computeDerived(state: VenousReturnState, inputs: VenousReturnInputs): VenousReturnDerived {
  const totalBloodVolumeMl = Math.max(500, inputs.bloodVolumeMl + state.volumeOffsetMl);
  const stressed = stressedVolume(totalBloodVolumeMl, inputs.unstressedVolumeFraction);
  const compliance = totalCompliance(inputs.venousCompliance);
  const resistance = resistanceToVenousReturn(inputs.venousResistance, inputs.systemicVascularResistance, inputs.arteriovenousShunt);
  const itp = effectiveIntrathoracicPressure(inputs.intrathoracicPressure, state.intrathoracicSurgeMmHg);
  const pmsf = meanSystemicFillingPressure(stressed, compliance, itp);
  const plateau = cardiacPlateau(inputs.contractility, inputs.heartRate, inputs.systemicVascularResistance);

  // Both curves evaluated at the CURRENT right atrial pressure. Where they differ, the atrium is
  // filling or emptying, and the pressure is still on its way to the crossing point.
  const vr = venousReturn(state.rightAtrialPressureMmHg, pmsf, resistance);
  const co = cardiacOutput(state.rightAtrialPressureMmHg, itp, plateau);
  const operating = findOperatingPoint(pmsf, resistance, itp, plateau);

  return {
    rightAtrialPressureMmHg: state.rightAtrialPressureMmHg,
    meanSystemicFillingPressureMmHg: pmsf,
    totalBloodVolumeMl,
    stressedVolumeMl: stressed,
    unstressedVolumeMl: totalBloodVolumeMl - stressed,
    totalComplianceMlPerMmHg: compliance,
    resistanceToVenousReturn: resistance,
    effectiveIntrathoracicPressure: itp,
    venousReturnLPerMin: vr,
    cardiacOutputLPerMin: co,
    operatingPointPra: operating.pra,
    operatingPointFlow: operating.flow,
    cardiacCurvePlateau: plateau,
    limitingFactor: limitingFactor(operating.pra, itp, plateau, inputs.systemicVascularResistance),
    meanArterialPressureMmHg:
      BASELINE_MAP * (co / BASELINE_CARDIAC_OUTPUT) * Math.max(inputs.systemicVascularResistance, 0.05),
    cardiacCurve: sampleCardiacCurve(itp, plateau),
    venousCurve: sampleVenousCurve(pmsf, resistance),
    bloodVolumeMl: inputs.bloodVolumeMl,
    venousCompliance: inputs.venousCompliance,
    unstressedVolumeFraction: inputs.unstressedVolumeFraction,
    contractility: inputs.contractility,
    heartRate: inputs.heartRate,
    systemicVascularResistance: inputs.systemicVascularResistance,
    venousResistance: inputs.venousResistance,
    intrathoracicPressure: inputs.intrathoracicPressure,
    arteriovenousShunt: inputs.arteriovenousShunt,
  };
}

export function tick(state: VenousReturnState, derived: VenousReturnDerived, dtSeconds: number): VenousReturnState {
  // The operating point is never solved for and then assigned. Right atrial pressure simply
  // obeys mass balance: blood arriving faster than it leaves accumulates in the central veins
  // and raises the pressure, which reduces venous return and increases cardiac output until the
  // two match. The crossing of the curves is where that process stops — an emergent result, not
  // an assumption.
  const netFlowMlPerSecond = ((derived.venousReturnLPerMin - derived.cardiacOutputLPerMin) * 1000) / 60;
  const dPra = netFlowMlPerSecond / ATRIUM.COMPLIANCE_ML_PER_MMHG;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    rightAtrialPressureMmHg: clamp(
      state.rightAtrialPressureMmHg + dPra * dtSeconds,
      ATRIUM.MIN_PRESSURE_MMHG,
      ATRIUM.MAX_PRESSURE_MMHG,
    ),
    volumeOffsetMl: state.volumeOffsetMl,
    intrathoracicSurgeMmHg: approach(state.intrathoracicSurgeMmHg, 0, dtSeconds, THORACIC.VALSALVA_TAU_SECONDS),
  };
}

export function step(state: VenousReturnState, inputs: VenousReturnInputs, dtSeconds: number): VenousReturnSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Haemorrhage removes stressed and unstressed volume alike, so the filling pressure falls and
 * the whole venous return curve shifts left — cardiac output falls without the heart changing. */
export function perturbHemorrhage(state: VenousReturnState, millilitres = 1000): VenousReturnState {
  return { ...state, volumeOffsetMl: Math.max(-CIRCULATION.BLOOD_VOLUME_ML * 0.6, state.volumeOffsetMl - millilitres) };
}

export function perturbTransfusion(state: VenousReturnState, millilitres = 1000): VenousReturnState {
  return { ...state, volumeOffsetMl: Math.min(CIRCULATION.BLOOD_VOLUME_ML * 0.6, state.volumeOffsetMl + millilitres) };
}

/** A Valsalva manoeuvre: a brief, large rise in the pressure surrounding the heart. */
export function perturbValsalva(state: VenousReturnState, surgeMmHg = THORACIC.VALSALVA_SURGE_MMHG): VenousReturnState {
  return { ...state, intrathoracicSurgeMmHg: state.intrathoracicSurgeMmHg + surgeMmHg };
}

import { FVC_MANEUVER, MECHANICS, VOLUMES, VQ } from './constants';
import { effectiveCompliance } from './surfactant';
import { functionalResidualCapacityML, residualVolumeML, totalLungCapacityML, vitalCapacityML } from './staticVolumes';
import { expiratoryTimeSeconds, targetVolumeAtPhase, timeConstantSeconds, workOfBreathingJPerMin } from './lungMechanics';
import { classifyPattern, expiratoryFlowAtVolume, fev1Fraction, peakExpiratoryFlow } from './fvcManeuver';
import { hpvDiversionTarget, vqCompartments } from './vqMatching';
import { approach, clamp } from '@/shared/lib/math';
import type { RespMechDerived, RespMechInputs, RespMechSnapshot, RespMechState } from './types';

export function createInitialState(): RespMechState {
  return {
    simTimeSeconds: 0,
    breathPhaseFraction: 0,
    lungVolumeML: VOLUMES.BASELINE_FRC_ML,
    fvcManeuverProgress: 0,
    fvcManeuverActive: false,
    hpvDiversionLevel: 0,
  };
}

export function computeDerived(state: RespMechState, inputs: RespMechInputs): RespMechDerived {
  const compliance = effectiveCompliance(inputs.lungCompliance, inputs.surfactantFunction);
  const rv = residualVolumeML(inputs.airwayResistance);
  const vc = vitalCapacityML(compliance);
  const frc = functionalResidualCapacityML(rv);
  const tlc = totalLungCapacityML(rv, vc);
  const tau = timeConstantSeconds(inputs.airwayResistance, compliance);

  const peakFlow = peakExpiratoryFlow(inputs.airwayResistance, vc);
  const fev1Frac = fev1Fraction(tau);
  const fvc = vc;
  const fev1 = fvc * fev1Frac;
  const ratio = fev1Frac * 100;

  // During a forced maneuver, flow follows the effort-independent expiratory curve; otherwise
  // it is the derivative of quiet tidal breathing.
  let airflowMLPerSec: number;
  if (state.fvcManeuverActive) {
    airflowMLPerSec = expiratoryFlowAtVolume(state.fvcManeuverProgress, peakFlow, tau);
  } else {
    const inInspiration = state.breathPhaseFraction <= MECHANICS.INSPIRATION_FRACTION;
    const breathDuration = 60 / clamp(inputs.respiratoryRate, 1, 60);
    airflowMLPerSec = inInspiration
      ? -(inputs.tidalVolumeML / (breathDuration * MECHANICS.INSPIRATION_FRACTION)) * 0.9
      : ((state.lungVolumeML - frc) / Math.max(tau, 0.05)) * 0.6;
  }

  const hpv = state.hpvDiversionLevel;
  const compartments = vqCompartments(inputs.deadSpaceFraction, inputs.shuntFraction, hpv);

  const minuteVentilation = inputs.tidalVolumeML * inputs.respiratoryRate;
  const alveolarVentilation = minuteVentilation * clamp(1 - inputs.deadSpaceFraction / 100, 0, 1);

  return {
    lungVolumeML: state.lungVolumeML,
    airflowMLPerSec,
    breathPhaseFraction: state.breathPhaseFraction,
    effectiveCompliance: compliance,
    timeConstantSeconds: tau,
    residualVolumeML: rv,
    functionalResidualCapacityML: frc,
    vitalCapacityML: vc,
    totalLungCapacityML: tlc,
    fvcML: fvc,
    fev1ML: fev1,
    fev1RatioPercent: ratio,
    peakExpiratoryFlowMLPerSec: peakFlow,
    spirometryPattern: classifyPattern(ratio, fvc, VOLUMES.BASELINE_VITAL_CAPACITY_ML),
    fvcManeuverActive: state.fvcManeuverActive,
    fvcManeuverProgress: state.fvcManeuverProgress,
    ventilationUnitA: compartments.ventilationUnitA,
    ventilationUnitB: compartments.ventilationUnitB,
    perfusionUnitA: compartments.perfusionUnitA,
    perfusionUnitB: compartments.perfusionUnitB,
    vqRatioA: compartments.vqRatioA,
    vqRatioB: compartments.vqRatioB,
    hpvDiversionLevel: hpv,
    alveolarVentilationMLPerMin: alveolarVentilation,
    workOfBreathingJPerMin: workOfBreathingJPerMin(
      inputs.tidalVolumeML,
      inputs.respiratoryRate,
      compliance,
      inputs.airwayResistance,
    ),
    minuteVentilationMLPerMin: minuteVentilation,
    respiratoryRate: inputs.respiratoryRate,
    tidalVolumeML: inputs.tidalVolumeML,
    lungCompliance: inputs.lungCompliance,
    airwayResistance: inputs.airwayResistance,
    surfactantFunction: inputs.surfactantFunction,
    deadSpaceFraction: inputs.deadSpaceFraction,
    shuntFraction: inputs.shuntFraction,
    hpvStrength: inputs.hpvStrength,
  };
}

export function tick(state: RespMechState, derived: RespMechDerived, dtSeconds: number): RespMechState {
  const targetHpv = hpvDiversionTarget(derived.shuntFraction, derived.hpvStrength);
  const hpvDiversionLevel = approach(state.hpvDiversionLevel, targetHpv, dtSeconds, VQ.TAU_SECONDS);

  // A forced vital capacity maneuver takes over the lung entirely while it runs.
  if (state.fvcManeuverActive) {
    const progress = state.fvcManeuverProgress + dtSeconds / FVC_MANEUVER.DURATION_SECONDS;
    const finished = progress >= 1;
    return {
      simTimeSeconds: state.simTimeSeconds + dtSeconds,
      breathPhaseFraction: 0,
      // Sweeps from total lung capacity down to residual volume.
      lungVolumeML: derived.totalLungCapacityML - clamp(progress, 0, 1) * derived.vitalCapacityML,
      fvcManeuverProgress: finished ? 0 : progress,
      fvcManeuverActive: !finished,
      hpvDiversionLevel,
    };
  }

  const breathDuration = 60 / clamp(derived.respiratoryRate, 1, 60);
  const breathPhaseFraction = (state.breathPhaseFraction + dtSeconds / breathDuration) % 1;

  const targetVolume = targetVolumeAtPhase(breathPhaseFraction, derived.tidalVolumeML, derived.functionalResidualCapacityML);
  const inInspiration = breathPhaseFraction <= MECHANICS.INSPIRATION_FRACTION;

  // Inspiration is active and reaches its target briskly; expiration is passive and decays on
  // the R×C time constant — so a long time constant leaves gas behind when the next breath
  // starts, which is exactly the mechanism of dynamic air trapping.
  const volumeTau = inInspiration ? 0.12 : derived.timeConstantSeconds;
  const lungVolumeML = clamp(
    approach(state.lungVolumeML, targetVolume, dtSeconds, volumeTau),
    derived.residualVolumeML,
    derived.totalLungCapacityML,
  );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    breathPhaseFraction,
    lungVolumeML,
    fvcManeuverProgress: 0,
    fvcManeuverActive: false,
    hpvDiversionLevel,
  };
}

export function step(state: RespMechState, inputs: RespMechInputs, dtSeconds: number): RespMechSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** "FVC maneuver" perturbation: a forced vital capacity effort from total lung capacity down
 * to residual volume, which is what produces the flow-volume loop. */
export function perturbFvcManeuver(state: RespMechState): RespMechState {
  return { ...state, fvcManeuverActive: true, fvcManeuverProgress: 0 };
}

/** Whether the current settings leave the lung unable to empty fully between breaths — the
 * dynamic hyperinflation that makes obstructed patients worse when they breathe faster. */
export function hasAirTrapping(respiratoryRate: number, tau: number): boolean {
  // Passive emptying needs roughly three time constants to complete.
  return expiratoryTimeSeconds(respiratoryRate) < tau * 3;
}

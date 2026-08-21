import { CLASSIFICATION, DUCTUS, FORAMEN, PULMONARY, VENOSUS } from './constants';
import {
  atrialPressures,
  classifyPhase,
  ductalPatencyTarget,
  oxygenatedSourceSaturation,
  pulmonaryFlowFraction,
  pulmonaryResistanceTarget,
  shuntSummary,
  shuntedVenousSaturation,
  systemicResistance,
} from './shunts';
import { approach, clamp } from '@/shared/lib/math';
import type { FetalDerived, FetalInputs, FetalSnapshot, FetalState } from './types';

export function createInitialState(): FetalState {
  return {
    simTimeSeconds: 0,
    pulmonaryVascularResistance: PULMONARY.FETAL_PVR,
    ductusArteriosusPatency: 1,
    foramenOvalePatency: 1,
    ductusVenosusPatency: 1,
  };
}

export function computeDerived(state: FetalState, inputs: FetalInputs): FetalDerived {
  const pvr = state.pulmonaryVascularResistance;
  const svr = systemicResistance(inputs.placentalCirculation, inputs.systemicToneScale);
  const flowToLungs = pulmonaryFlowFraction(pvr, state.ductusArteriosusPatency, svr);

  // Positive is right-to-left: right ventricular output that bypassed the lungs entirely.
  // Once pulmonary resistance falls below systemic, the pressure gradient reverses and a
  // still-open duct carries flow the other way — the same channel, the opposite problem.
  const bypassed = 1 - flowToLungs;
  const gradientFavoursRightToLeft = pvr > svr;
  const ductalShuntFraction = gradientFavoursRightToLeft
    ? bypassed
    : -clamp(state.ductusArteriosusPatency, 0, 1) * clamp((svr - pvr) / Math.max(svr, 0.1), 0, 1) * 0.55;

  const { right, left } = atrialPressures(
    inputs.placentalCirculation,
    state.ductusVenosusPatency,
    flowToLungs,
  );
  // The foramen is a flap: it carries flow only while right atrial pressure exceeds left.
  const atrialShuntFraction =
    clamp(state.foramenOvalePatency, 0, 1) * clamp((right - left) / 6, 0, 1) * 0.45;

  const sourceSaturation = oxygenatedSourceSaturation(
    inputs.placentalCirculation,
    inputs.lungInflation,
    inputs.inspiredOxygen,
  );

  // Blood reaching the left atrium is pulmonary venous return diluted by whatever crosses the
  // foramen from the right — which is systemic venous blood.
  const venousSaturation = shuntedVenousSaturation(inputs.placentalCirculation);
  const preDuctal = clamp(
    sourceSaturation * (1 - atrialShuntFraction) + venousSaturation * atrialShuntFraction,
    0,
    100,
  );

  // The lower body additionally receives whatever the duct delivers. A right-to-left ductal
  // shunt is deoxygenated blood entering the aorta BELOW the head and right arm, which is
  // precisely why the gap appears where it does.
  const rightToLeftDuctal = Math.max(0, ductalShuntFraction);
  const postDuctal = clamp(
    preDuctal * (1 - rightToLeftDuctal) + venousSaturation * rightToLeftDuctal,
    0,
    100,
  );

  const gap = preDuctal - postDuctal;

  return {
    pulmonaryVascularResistance: pvr,
    systemicVascularResistance: svr,
    ductusArteriosusPatency: state.ductusArteriosusPatency,
    foramenOvalePatency: state.foramenOvalePatency,
    ductusVenosusPatency: state.ductusVenosusPatency,
    pulmonaryFlowFraction: flowToLungs,
    ductalShuntFraction,
    atrialShuntFraction,
    rightAtrialPressureMmHg: right,
    leftAtrialPressureMmHg: left,
    oxygenatedSourceSaturation: sourceSaturation,
    preDuctalSaturationPercent: preDuctal,
    postDuctalSaturationPercent: postDuctal,
    saturationGradientPercent: gap,
    phase: classifyPhase(pvr, ductalShuntFraction, inputs.placentalCirculation, gap),
    shuntSummary: shuntSummary(ductalShuntFraction, atrialShuntFraction, gap),
    placentalCirculation: inputs.placentalCirculation,
    lungInflation: inputs.lungInflation,
    inspiredOxygen: inputs.inspiredOxygen,
    pulmonaryVasoreactivity: inputs.pulmonaryVasoreactivity,
    prostaglandinLevel: inputs.prostaglandinLevel,
    systemicToneScale: inputs.systemicToneScale,
  };
}

export function tick(state: FetalState, derived: FetalDerived, inputs: FetalInputs, dtSeconds: number): FetalState {
  const pvrTarget = pulmonaryResistanceTarget(
    inputs.lungInflation,
    inputs.inspiredOxygen,
    inputs.pulmonaryVasoreactivity,
  );

  // The duct is bathed in post-ductal blood, so that is the oxygen tension it responds to.
  const ductTarget = ductalPatencyTarget(derived.postDuctalSaturationPercent, inputs.prostaglandinLevel);
  const ductClosing = ductTarget < state.ductusArteriosusPatency;

  // Functional closure of the foramen is a pressure event, not a healing one: the flap is held
  // shut the instant left atrial pressure exceeds right, and springs open again if it reverses.
  const foramenTarget = derived.leftAtrialPressureMmHg > derived.rightAtrialPressureMmHg ? 0 : 1;
  const foramenClosing = foramenTarget < state.foramenOvalePatency;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    pulmonaryVascularResistance: approach(
      state.pulmonaryVascularResistance,
      pvrTarget,
      dtSeconds,
      PULMONARY.TAU_SECONDS,
    ),
    ductusArteriosusPatency: approach(
      state.ductusArteriosusPatency,
      ductTarget,
      dtSeconds,
      ductClosing ? DUCTUS.CLOSURE_TAU_SECONDS : DUCTUS.REOPENING_TAU_SECONDS,
    ),
    foramenOvalePatency: approach(
      state.foramenOvalePatency,
      foramenTarget,
      dtSeconds,
      foramenClosing ? FORAMEN.CLOSURE_TAU_SECONDS : FORAMEN.REOPENING_TAU_SECONDS,
    ),
    ductusVenosusPatency: approach(
      state.ductusVenosusPatency,
      inputs.placentalCirculation > 0.1 ? 1 : 0,
      dtSeconds,
      VENOSUS.CLOSURE_TAU_SECONDS,
    ),
  };
}

export function step(state: FetalState, inputs: FetalInputs, dtSeconds: number): FetalSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** The first breath: aeration is instantaneous compared with everything that follows it. */
export function perturbFirstBreath(state: FetalState): FetalState {
  return { ...state, pulmonaryVascularResistance: Math.min(state.pulmonaryVascularResistance, PULMONARY.FETAL_PVR) };
}

/** Reopening the duct — what a prostaglandin infusion achieves in a duct-dependent lesion. */
export function perturbReopenDuct(state: FetalState): FetalState {
  return { ...state, ductusArteriosusPatency: clamp(state.ductusArteriosusPatency + 0.6, 0, 1) };
}

export { CLASSIFICATION };

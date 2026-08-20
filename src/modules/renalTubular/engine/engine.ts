import { ADH, MEDULLA, PLASMA, TGF, TUBULE, URINE } from './constants';
import { proximalTubule } from './proximalTubule';
import { ascendingLimb, ascendingPumpActivity, descendingLimb } from './loopOfHenle';
import { collectingDuct, distalTubule, effectiveADHAction } from './distalTubuleAndCD';
import { adhLevelTarget } from './adhRegulation';
import { afferentToneTarget, gfrAfterTGF } from './tubuloglomerularFeedback';
import { approach, clamp } from '@/shared/lib/math';
import type { NephronSegment, RenalTubularDerived, RenalTubularInputs, RenalTubularSnapshot, RenalTubularState } from './types';

export function createInitialState(): RenalTubularState {
  return {
    simTimeSeconds: 0,
    plasmaOsmolality: PLASMA.BASELINE_MOSM,
    medullaryGradientStrength: 1,
    adhLevel: 0.4,
    afferentToneFromTGF: 0,
  };
}

/**
 * Walks the filtrate segment by segment down the nephron, carrying osmolality and remaining
 * volume forward. Each segment is a pure function of what entered it plus the current
 * medullary gradient and drug/hormone state, so the whole profile is recomputed fresh each
 * tick — the tubule itself holds no state, only the plasma, medulla and actuators do.
 */
export function computeDerived(state: RenalTubularState, inputs: RenalTubularInputs): RenalTubularDerived {
  const bowmans: NephronSegment = { label: "Bowman's capsule", osmolality: TUBULE.FILTRATE_OSMOLALITY, flowFraction: 1 };
  const proximal = proximalTubule();
  const descending = descendingLimb(proximal, state.medullaryGradientStrength);
  const ascending = ascendingLimb(descending, inputs.loopDiureticDose);
  const distal = distalTubule(ascending, inputs.thiazideDose);

  const adhAction = effectiveADHAction(state.adhLevel, inputs.exogenousADH, inputs.collectingDuctADHSensitivity);
  const collecting = collectingDuct(distal, adhAction, state.medullaryGradientStrength);

  const segments = [bowmans, proximal, descending, ascending, distal, collecting];

  const gfr = gfrAfterTGF(inputs.gfrMLPerMin, state.afferentToneFromTGF);
  const urineFlowRateMLPerMin = clamp(gfr * collecting.flowFraction, URINE.MIN_FLOW_ML_PER_MIN, URINE.MAX_FLOW_ML_PER_MIN);

  // Osmolar clearance is the volume of plasma cleared of solute per minute; free water
  // clearance is whatever urine volume remains beyond that. Positive means the kidney is
  // shedding pure water (dilute urine); negative means it is retaining it (concentrated urine).
  const osmolarClearance = (collecting.osmolality * urineFlowRateMLPerMin) / Math.max(state.plasmaOsmolality, 1);
  const freeWaterClearance = urineFlowRateMLPerMin - osmolarClearance;

  // NaCl arriving at the macula densa, as a fraction of the filtered load — the TGF signal.
  const distalNaClDelivery = ascending.flowFraction * (ascending.osmolality / TUBULE.FILTRATE_OSMOLALITY);

  return {
    plasmaOsmolality: state.plasmaOsmolality,
    medullaryGradientStrength: state.medullaryGradientStrength,
    adhLevel: state.adhLevel,
    effectiveADHAction: adhAction,
    afferentToneFromTGF: state.afferentToneFromTGF,
    gfrAfterTGF: gfr,
    segments,
    finalUrineOsmolality: collecting.osmolality,
    urineFlowRateMLPerMin,
    freeWaterClearance,
    distalNaClDelivery,
    waterIntakeRate: inputs.waterIntakeRate,
    adhSecretionCapacity: inputs.adhSecretionCapacity,
    collectingDuctADHSensitivity: inputs.collectingDuctADHSensitivity,
    exogenousADH: inputs.exogenousADH,
    loopDiureticDose: inputs.loopDiureticDose,
    thiazideDose: inputs.thiazideDose,
    maculaDensaFeedbackStrength: inputs.maculaDensaFeedbackStrength,
  };
}

export function tick(state: RenalTubularState, derived: RenalTubularDerived, dtSeconds: number): RenalTubularState {
  // Plasma osmolality rises when the kidney sheds more free water than is taken in, and falls
  // when water is retained or drunk in excess. This is what closes the ADH loop: the variable
  // the osmoreceptors sense is itself a consequence of what the collecting duct just did.
  const waterIn = (derived.waterIntakeRate / 100) * PLASMA.INTAKE_SCALE;
  const netFreeWaterLoss = derived.freeWaterClearance - waterIn;
  const dOsmolality = netFreeWaterLoss * PLASMA.FLUX_GAIN * dtSeconds;

  // The medullary gradient is actively maintained by thick ascending limb pumping and eroded
  // by high tubular flow — so a loop diuretic washes it out, and it rebuilds once stopped.
  const pumpActivity = ascendingPumpActivity(derived.loopDiureticDose);
  const washout = clamp(derived.urineFlowRateMLPerMin / URINE.MAX_FLOW_ML_PER_MIN, 0, 1) * MEDULLA.FLOW_WASHOUT_GAIN;
  const targetGradient = clamp(pumpActivity - washout, MEDULLA.MIN_STRENGTH, 1);

  const targetAdh = adhLevelTarget(state.plasmaOsmolality, derived.adhSecretionCapacity);
  const targetAfferentTone = afferentToneTarget(derived.distalNaClDelivery, derived.maculaDensaFeedbackStrength, derived.loopDiureticDose);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    plasmaOsmolality: clamp(state.plasmaOsmolality + dOsmolality, PLASMA.MIN_MOSM, PLASMA.MAX_MOSM),
    medullaryGradientStrength: approach(state.medullaryGradientStrength, targetGradient, dtSeconds, MEDULLA.BUILD_TAU_SECONDS),
    adhLevel: approach(state.adhLevel, targetAdh, dtSeconds, ADH.TAU_SECONDS),
    afferentToneFromTGF: approach(state.afferentToneFromTGF, targetAfferentTone, dtSeconds, TGF.TAU_SECONDS),
  };
}

export function step(state: RenalTubularState, inputs: RenalTubularInputs, dtSeconds: number): RenalTubularSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

/** Acute water deprivation perturbation — an instant rise in plasma osmolality, as at the
 * start of a water deprivation test. The ADH response that follows is what distinguishes a
 * normal kidney from either type of diabetes insipidus. */
export function perturbWaterDeprivation(state: RenalTubularState, magnitudeMosm = 12): RenalTubularState {
  return { ...state, plasmaOsmolality: clamp(state.plasmaOsmolality + magnitudeMosm, PLASMA.MIN_MOSM, PLASMA.MAX_MOSM) };
}

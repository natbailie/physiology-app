import { UREA_CYCLE } from './constants';
import { approach, clamp } from '@/shared/lib/math';
import type {
  UreaCycleDerived,
  UreaCycleInputs,
  UreaCycleInternalState,
  UreaCycleSnapshot,
} from './types';

/** Total nitrogen presented to the liver, g/day: dinner plus the patient digesting themselves. */
export function nitrogenLoadOf(inputs: UreaCycleInputs): number {
  return (
    inputs.proteinIntakeGPerDay * UREA_CYCLE.NITROGEN_PER_PROTEIN +
    inputs.catabolicStress * UREA_CYCLE.STRESS_PROTEIN_G_PER_DAY * UREA_CYCLE.NITROGEN_PER_PROTEIN
  );
}

/** Effective cycle capacity, 0-1: functioning mass times residual enzyme activity. */
export function clearanceOf(inputs: UreaCycleInputs): number {
  return clamp((inputs.liverFunctionPct / 100) * inputs.enzymeCapacity, 0, 1);
}

/**
 * Plasma ammonia, umol/L. Flat while capacity covers the load, quadratic once it does not —
 * the defended-then-collapsing shape that makes hyperammonaemia a threshold event rather
 * than a linear one.
 */
export function ammoniaOf(inputs: UreaCycleInputs): number {
  const load = nitrogenLoadOf(inputs);
  const overload = load / 12;
  const deficit = Math.max(0, 1 - clearanceOf(inputs));
  return clamp(
    UREA_CYCLE.AMMONIA_BASE_UMOL_L +
      UREA_CYCLE.AMMONIA_PER_LOAD_UMOL_L * overload +
      UREA_CYCLE.AMMONIA_PER_DEFICIT_UMOL_L * deficit * deficit * (0.5 + overload),
    5,
    400,
  );
}

/**
 * Plasma urea, mmol/L. Rises with load when the cycle can cope, and FALLS when it cannot —
 * the paradox at the heart of the module: the product disappears precisely because the
 * failing step is the one that makes it.
 */
export function ureaOf(inputs: UreaCycleInputs): number {
  const cleared = nitrogenLoadOf(inputs) * clearanceOf(inputs);
  const dilution = UREA_CYCLE.UREA_HYDRATION_BASE + inputs.hydrationLPerDay * UREA_CYCLE.UREA_HYDRATION_GAIN;
  return clamp((cleared * UREA_CYCLE.UREA_PER_CLEARED_N) / dilution, 0.3, 30);
}

/** Blood urea nitrogen, mg/dL, from urea by molecular weight (two nitrogens per urea). */
export function bunOf(ureaMmolL: number): number {
  return ureaMmolL * UREA_CYCLE.BUN_PER_UREA;
}

/** Urinary nitrogen, g/day: near intake at balance, leaking away as ammonia when it is not. */
export function urineNitrogenOf(inputs: UreaCycleInputs): number {
  const load = nitrogenLoadOf(inputs);
  const clearance = clearanceOf(inputs);
  const fraction =
    UREA_CYCLE.URINE_N_FAILED_FRACTION +
    (UREA_CYCLE.URINE_N_INTACT_FRACTION - UREA_CYCLE.URINE_N_FAILED_FRACTION) * clearance;
  return Math.max(0.5, load * fraction);
}

/**
 * Orotic-acid shunt index, 0-10. High only when CPS1 still runs (liver present) against a
 * distal block (enzyme capacity lost): carbamoyl-phosphate with nowhere to go spills to
 * orotate. Liver failure shares the ammonia but not the orotate — the separation the
 * pattern questions are marked against.
 */
export function oroticAcidOf(inputs: UreaCycleInputs): number {
  const liverPresent = inputs.liverFunctionPct / 100;
  const distalBlock = Math.max(0, 1 - inputs.enzymeCapacity);
  const overload = nitrogenLoadOf(inputs) / 12;
  if (inputs.enzymeCapacity >= 0.6) return UREA_CYCLE.OROTIC_BASELINE;
  return clamp(
    UREA_CYCLE.OROTIC_BASELINE + UREA_CYCLE.OROTIC_GAIN * distalBlock * liverPresent * (0.4 + overload),
    0,
    10,
  );
}

/** Encephalopathy grade implied by the ammonia. Coarse, as the clinical mapping is. */
export function encephalopathyGradeOf(ammoniaUmolL: number): number {
  if (ammoniaUmolL >= UREA_CYCLE.GRADE_IV_UMOL_L) return 4;
  if (ammoniaUmolL >= UREA_CYCLE.GRADE_III_UMOL_L) return 3;
  if (ammoniaUmolL >= UREA_CYCLE.GRADE_II_UMOL_L) return 2;
  if (ammoniaUmolL >= UREA_CYCLE.GRADE_I_UMOL_L) return 1;
  return 0;
}

/** The classification shown under the cycle diagram. */
export function ureaCycleStateOf(inputs: UreaCycleInputs, ammonia: number, orotic: number): string {
  const clearance = clearanceOf(inputs);
  if (inputs.enzymeCapacity < 0.6 && orotic > 3) return 'Enzyme block';
  if (clearance < 0.45 && ammonia >= UREA_CYCLE.GRADE_I_UMOL_L) return 'Liver failure';
  if (nitrogenLoadOf(inputs) / 12 > 1.5) return 'High nitrogen load';
  if (inputs.hydrationLPerDay < 1) return 'Concentrated';
  return 'Balanced';
}

export function createInitialState(): UreaCycleInternalState {
  return {
    simTimeSeconds: 0,
    ammoniaUmolL: 26,
    ureaMmolL: 5,
    oroticAcidIndex: 0.5,
  };
}

export function computeDerived(state: UreaCycleInternalState, inputs: UreaCycleInputs): UreaCycleDerived {
  const ammonia = state.ammoniaUmolL;
  const urea = state.ureaMmolL;
  const orotic = state.oroticAcidIndex;
  return {
    ammoniaUmolL: ammonia,
    ureaMmolL: urea,
    bunMgDl: bunOf(urea),
    urineNitrogenGPerDay: urineNitrogenOf(inputs),
    nitrogenLoadGPerDay: nitrogenLoadOf(inputs),
    oroticAcidIndex: orotic,
    encephalopathyGrade: encephalopathyGradeOf(ammonia),
    ureaCycleState: ureaCycleStateOf(inputs, ammonia, orotic),
  };
}

/** Smooth the readouts toward their targets — the nitrogen pools move over hours, and the
 * inertia is all in the pools a learner watches. */
export function tick(
  state: UreaCycleInternalState,
  inputs: UreaCycleInputs,
  dtSeconds: number,
): UreaCycleInternalState {
  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    ammoniaUmolL: approach(state.ammoniaUmolL, ammoniaOf(inputs), dtSeconds, UREA_CYCLE.TAU_SECONDS),
    ureaMmolL: approach(state.ureaMmolL, ureaOf(inputs), dtSeconds, UREA_CYCLE.TAU_SECONDS),
    oroticAcidIndex: approach(state.oroticAcidIndex, oroticAcidOf(inputs), dtSeconds, UREA_CYCLE.TAU_SECONDS),
  };
}

export function step(
  state: UreaCycleInternalState,
  inputs: UreaCycleInputs,
  dtSeconds: number,
): UreaCycleSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

/** `UreaCycleSnapshot` re-exported so engine consumers can name it without re-importing types. */
export type { UreaCycleSnapshot };

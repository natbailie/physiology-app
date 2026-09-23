import { METABOLISM } from './constants';
import { approach, clamp, scaleClamped } from '@/shared/lib/math';
import type {
  MetabolismDerived,
  MetabolismInputs,
  MetabolismInternalState,
  MetabolismSnapshot,
} from './types';

/**
 * The insulin-to-glucagon balance, read from the fast. Insulin dominates while glucose is high;
 * glucagon takes over as glucose falls and the fast deepens.
 */
function insulinRatio(hours: number): number {
  if (hours <= 6) return 0.9 - (hours / 6) * 0.4; // fed -> 6h: 0.9 -> 0.5
  return Math.max(0.12, 0.5 - (hours - 6) * 0.016); // decays toward the fasting floor
}

/**
 * Blood glucose, in mmol/L. High in the fed state, defended by glycogenolysis then
 * gluconeogenesis onto a floor near 3.9; insulin resistance raises the whole curve and a
 * catabolic stress adds a cortisol-driven gluconeogenic push on top.
 */
function glucoseOf(hours: number, resistance: number, stress: number): number {
  const fed = 6.4;
  const floor = 3.9;
  const drained = clamp(hours, 0, 24) / 24;
  const defended = floor + (fed - floor) * Math.exp(-2.2 * drained);
  const resistanceBoost = (resistance - 1) * 2.2;
  const stressBoost = stress * 2.4;
  return clamp(defended + resistanceBoost + stressBoost, 2.5, 11);
}

/** Absolute energy shares, then normalised to % of the mix; diet sets the fed-state ceiling and
 * the fast its slope. This is what turns diet composition into a visible lever on the gauge. */
interface FuelMix {
  carbPct: number;
  fatPct: number;
  proteinPct: number;
}

function fuelMix(inputs: MetabolismInputs): FuelMix {
  const { hoursPostAbsorptive: h, insulinResistance: res, injuryStress: stress } = inputs;

  const fedCarb = (0.5 + (inputs.carbohydrateIntake - 250) * 0.00045) * (1 - clamp(res - 1, 0, 1) * 0.25);
  const carb = Math.max(0.05, fedCarb * Math.exp(-Math.max(0, h - 6) * 0.05));

  const fedFat = 0.24 + (inputs.fatIntake - 70) * 0.0005;
  const fat = Math.min(0.85, fedFat + Math.max(0, h - 6) * 0.0065);

  const fedProtein = 0.09 + (inputs.proteinIntake - 60) * 0.00035;
  const protein = Math.min(0.35, fedProtein + stress * 0.12 + Math.max(0, h - 24) * 0.0018);

  const total = carb + fat + protein;
  return {
    carbPct: (carb / total) * 100,
    fatPct: (fat / total) * 100,
    proteinPct: (protein / total) * 100,
  };
}

/**
 * Ketone production. Trace in the fed and post-absorptive state, ramping once glycogen is spent
 * (after ~12-24h), saturating in starvation. Insulin resistance blunts it — a type-2 liver keeps
 * enough insulin tone to suppress ketogenesis.
 */
function ketonesOf(hours: number, resistance: number): number {
  const ramp = scaleClamped(hours, METABOLISM.KETONE_HALF_MAX_HOURS, METABOLISM.KETONE_SATURATION_HOURS, 0, 1);
  const resistanceSuppression = clamp((resistance - 1) * 0.5, 0, 0.55);
  return clamp(METABOLISM.MAX_KETONES_MMOL_PER_L * ramp * (1 - resistanceSuppression), 0, METABOLISM.MAX_KETONES_MMOL_PER_L);
}

/** Glycogen remaining, % of capacity: full fed, draining through the fast. */
function glycogenOf(hours: number): number {
  return clamp(100 * Math.exp(-hours / 36), 0, 100);
}

/** Whole-body energy bill: resting rate times activity, times the catabolic stress multiplier. */
function energyOf(bmr: number, activityMet: number, stress: number): number {
  return bmr * activityMet * (1 + stress * 1.6);
}

/** Net protein breakdown, g/day: the resting leak plus stress plus the gluconeogenic demand of a
 * collapsing carbohydrate burn. */
function proteinOxGOf(inputs: MetabolismInputs, carbPct: number): number {
  const rest = METABOLISM.BASELINE_PROTEIN_OXIDATION_G_PER_DAY;
  const stressAdd = inputs.injuryStress * 90;
  const starvationAdd = clamp((0.25 - carbPct / 100) * 350, 0, 350);
  return rest + stressAdd + starvationAdd;
}

/** Respiratory quotient of the mixture (0.7 pure fat, 1.0 pure carbohydrate, 0.8 protein). */
function rqOf(carb: number, fat: number, protein: number): number {
  return clamp(1.0 * carb + 0.7 * fat + 0.8 * protein, 0.7, 1.0);
}

/** The classification shown under the fuel gauge. */
function metabolicStateOf(hours: number, stress: number): string {
  if (stress > 0.3) return 'Catabolic stress';
  if (hours < 4) return 'Fed';
  if (hours < 12) return 'Post-absorptive';
  if (hours < 36) return 'Fasting';
  return 'Starvation';
}

export function createInitialState(): MetabolismInternalState {
  return {
    simTimeSeconds: 0,
    bgmmolPerL: 5.1,
    energyKcalPerDay: 2000,
    ketonesMmolPerL: 0,
    glycogenPct: 80,
    proteinOxidationGPerDay: 60,
  };
}

export function computeDerived(state: MetabolismInternalState, inputs: MetabolismInputs): MetabolismDerived {
  const { hoursPostAbsorptive: hours, insulinResistance: resistance, injuryStress: stress } = inputs;
  const mix = fuelMix(inputs);

  return {
    bgmmolPerL: state.bgmmolPerL,
    insulinSignal: insulinRatio(hours),
    glucagonSignal: clamp(1 - insulinRatio(hours) * 1.8 - stress * 0.15, 0, 1),
    carbOxidationPct: mix.carbPct,
    fatOxidationPct: mix.fatPct,
    proteinOxidationPct: mix.proteinPct,
    energyKcalPerDay: state.energyKcalPerDay,
    ketonesMmolPerL: state.ketonesMmolPerL,
    glycogenPct: state.glycogenPct,
    proteinOxidationGPerDay: state.proteinOxidationGPerDay,
    respiratoryQuotient: rqOf(mix.carbPct / 100, mix.fatPct / 100, mix.proteinPct / 100),
    metabolicState: metabolicStateOf(hours, stress),
    hoursPostAbsorptive: hours,
    insulinResistance: resistance,
    injuryStress: stress,
    basalMetabolicRate: inputs.basalMetabolicRate,
    activityMet: inputs.activityMet,
  };
}

/** Smooth the readouts toward their targets — the fast itself is instantaneous, and the inertia
 * is all in the instruments a learner watches. */
export function tick(state: MetabolismInternalState, inputs: MetabolismInputs, dtSeconds: number): MetabolismInternalState {
  const { hoursPostAbsorptive: h, insulinResistance: res, injuryStress: stress } = inputs;
  const mix = fuelMix(inputs);

  const nextBg = approach(state.bgmmolPerL, glucoseOf(h, res, stress), dtSeconds, METABOLISM.TAU_SECONDS);
  const nextEnergy = approach(state.energyKcalPerDay, energyOf(inputs.basalMetabolicRate, inputs.activityMet, stress), dtSeconds, METABOLISM.TAU_SECONDS);
  const nextKetones = approach(state.ketonesMmolPerL, ketonesOf(h, res), dtSeconds, METABOLISM.TAU_SECONDS);
  const nextGlycogen = approach(state.glycogenPct, glycogenOf(h), dtSeconds, METABOLISM.TAU_SECONDS);
  const nextProtein = approach(state.proteinOxidationGPerDay, proteinOxGOf(inputs, mix.carbPct), dtSeconds, METABOLISM.TAU_SECONDS);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    bgmmolPerL: nextBg,
    energyKcalPerDay: nextEnergy,
    ketonesMmolPerL: nextKetones,
    glycogenPct: nextGlycogen,
    proteinOxidationGPerDay: nextProtein,
  };
}

export function step(state: MetabolismInternalState, inputs: MetabolismInputs, dtSeconds: number): MetabolismSnapshot {
  const nextState = tick(state, inputs, dtSeconds);
  return { state: nextState, derived: computeDerived(nextState, inputs) };
}

/** `MetabolismSnapshot` re-exported so engine consumers can name it without re-importing types. */
export type { MetabolismSnapshot };
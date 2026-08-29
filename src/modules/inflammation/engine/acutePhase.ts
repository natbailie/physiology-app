import { ACUTE } from './constants';
import { clamp } from '@/shared/lib/math';

/** The local chemical wave: driven straight off the insult, capped, blunted by steroids. */
export function mediatorTarget(insultLoad: number, steroidDosePct: number): number {
  const steroidBlunt = 1 - 0.7 * clamp(steroidDosePct / 100, 0, 1);
  return clamp(Math.pow(clamp(insultLoad, 0, 2), 0.75), 0, 1.6) * steroidBlunt;
}

/** Neutrophils chase the mediators, gated by marrow supply and pulled back by steroids. */
export function neutrophilTarget(params: {
  mediatorLevel: number;
  systemicCytokineLevel: number;
  innateImmuneFunctionPct: number;
  steroidDosePct: number;
}): number {
  const signal = clamp(params.mediatorLevel + params.systemicCytokineLevel * 0.8, 0, 2);
  const supply = clamp(params.innateImmuneFunctionPct / 100, 0, 1);
  const steroidBrake = 1 - 0.72 * clamp(params.steroidDosePct / 100, 0, 1);
  return clamp(signal * supply * steroidBrake, 0, 1.9);
}

/** Monocytes follow the wave later and stay: they arrive on mediators but persist while
 * anything remains to be tidied or fought. */
export function monocyteTarget(params: {
  mediatorLevel: number;
  insultLoad: number;
  chronicInflammationIndex: number;
  innateImmuneFunctionPct: number;
}): number {
  const signal = clamp(params.mediatorLevel * 0.7 + clamp(params.insultLoad, 0, 1.5) + params.chronicInflammationIndex, 0, 2);
  const supply = clamp(params.innateImmuneFunctionPct / 100, 0, 1);
  return clamp(signal * supply, 0, 1.6);
}

/** Pus is dead neutrophils plus debris, accumulating only while the insult is actively
 * being fought — once the load is gone, no new pus forms. */
export function pusPerDay(neutrophilPopulation: number, insultLoad: number): number {
  const fight = clamp(neutrophilPopulation * clamp(insultLoad, 0, 1.5), 0, 2);
  return ACUTE.PUS_ACCUMULATION_PER_DAY * fight;
}

export function pusDrainPerDay(pusBurden: number, sourceControlPct: number): number {
  return (
    ACUTE.PUS_LYMPH_DRAIN_PER_DAY * clamp(pusBurden, 0, 2) +
    2.5 * clamp(sourceControlPct / 100, 0, 1) * clamp(pusBurden, 0, 2)
  );
}

/** Chronicity: once an insult outlasts roughly three days of acute effort, the mononuclear
 * arm organises. Steroids slow this too — they blunt the signal that drives recruitment. */
export function chronicTarget(
  persistenceSeconds: number,
  insultLoad: number,
  monocyteMacrophageActivity: number,
): number {
  if (persistenceSeconds < ACUTE.CHRONIC_SWITCH_SECONDS || insultLoad < 0.08) return 0;
  return clamp(clamp(insultLoad, 0, 1.5) * clamp(monocyteMacrophageActivity * 1.4, 0, 1.8), 0, 1);
}

/** Granulomas organise around insults nothing can degrade — weeks in the making. */
export function granulomaTarget(chronicInflammationIndex: number, insultLoad: number): number {
  return clamp(chronicInflammationIndex * clamp(insultLoad * 1.8, 0, 1), 0, 1);
}

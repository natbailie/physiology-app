import { POTASSIUM, REPOLARIZATION, TIMING } from './constants';
import { ATRIAL_MYOCARDIUM, REGIONS, VENTRICULAR_MYOCARDIUM, type RegionDefinition } from './regions';
import { clamp } from '@/shared/lib/math';
import type { EcgInputs, RegionId } from './types';

export interface ScheduledRegion {
  definition: RegionDefinition;
  /** Depolarisation window, ms from this region's chamber onset. */
  startMs: number;
  endMs: number;
  /** Repolarisation window. Conduction tissue has no meaningful repolarisation contribution,
   * signalled by repolStartMs === repolEndMs. */
  repolStartMs: number;
  repolEndMs: number;
  /** Mass after any input-driven suppression (e.g. hyperkalemic loss of the P wave). */
  effectiveMass: number;
  /** Amplitude of this region's repolarisation relative to its depolarisation. Carries the
   * hyperkalemic T-wave peaking, so every input-dependent scaling lives in the schedule. */
  repolMagnitudeScale: number;
}

export type ActivationSchedule = Map<RegionId, ScheduledRegion>;

/** How much hyperkalemia slows conduction through the myocardium (1 = normal). */
export function conductionSlowingFactor(serumPotassium: number): number {
  const excess = Math.max(0, serumPotassium - POTASSIUM.NORMAL_MEQ_L);
  return 1 + excess * POTASSIUM.CONDUCTION_SLOWING_PER_MEQ;
}

/** Hyperkalemia depresses atrial excitability, flattening and eventually abolishing the P wave. */
export function atrialMassFactor(serumPotassium: number): number {
  const excess = Math.max(0, serumPotassium - POTASSIUM.NORMAL_MEQ_L);
  return clamp(1 - excess * POTASSIUM.ATRIAL_SUPPRESSION_PER_MEQ, 0, 1);
}

/**
 * Effective action potential duration, ms. Shortens as rate rises (which is exactly what
 * Bazett's correction exists to undo) and as potassium climbs.
 */
export function effectiveApdMs(ventricularAPD: number, rrIntervalMs: number, serumPotassium: number): number {
  const rateFactor = Math.pow(clamp(rrIntervalMs, 200, 3000) / 1000, REPOLARIZATION.RATE_ADAPTATION_EXPONENT);
  const excess = Math.max(0, serumPotassium - POTASSIUM.NORMAL_MEQ_L);
  const potassiumFactor = clamp(1 - excess * POTASSIUM.APD_SHORTENING_PER_MEQ, 0.4, 1);
  return ventricularAPD * rateFactor * potassiumFactor;
}

/** Delay and slowing applied to a bundle branch's territory when its conduction fails. */
function blockPenalty(conduction: number): { delayMs: number; stretch: number } {
  const severity = clamp(1 - conduction, 0, 1);
  return {
    delayMs: severity * TIMING.BUNDLE_BLOCK_MAX_DELAY_MS,
    stretch: 1 + severity * (TIMING.BUNDLE_BLOCK_MAX_STRETCH - 1),
  };
}

/** Which bundle branch supplies each ventricular region. */
function bundleFor(id: RegionId): 'left' | 'right' | null {
  if (id === 'lvFreeWall' || id === 'lvBase' || id === 'septum') return 'left';
  if (id === 'rvFreeWall') return 'right';
  return null;
}

/**
 * Builds the full activation schedule for one beat from the current inputs.
 *
 * Every downstream behaviour — QRS width, axis shift, T-wave shape, ST deviation — is read
 * off this schedule rather than being drawn, which is what makes the resulting trace a
 * consequence of the conduction sequence instead of a picture of one.
 */
export function buildSchedule(inputs: EcgInputs, rrIntervalMs: number): ActivationSchedule {
  const slowing = conductionSlowingFactor(inputs.serumPotassium);
  const atrialFactor = atrialMassFactor(inputs.serumPotassium);
  const apd = effectiveApdMs(inputs.ventricularAPD, rrIntervalMs, inputs.serumPotassium);

  const leftPenalty = blockPenalty(inputs.leftBundleConduction);
  const rightPenalty = blockPenalty(inputs.rightBundleConduction);

  const schedule: ActivationSchedule = new Map();

  for (const definition of REGIONS) {
    const bundle = bundleFor(definition.id);
    // The septum is supplied by the left bundle, but it is activated first and from several
    // directions, so a left-sided block slows it without meaningfully delaying its ONSET.
    // Keeping its start time fixed matters: QRS onset anchors the PR measurement, and a real
    // bundle branch block widens the QRS without prolonging PR.
    const delayShare = definition.id === 'septum' ? 0 : 1;
    const stretchShare = definition.id === 'septum' ? 0.4 : 1;
    const penalty =
      bundle === 'left' ? { delayMs: leftPenalty.delayMs * delayShare, stretch: 1 + (leftPenalty.stretch - 1) * stretchShare }
      : bundle === 'right' ? rightPenalty
      : { delayMs: 0, stretch: 1 };

    const isMyocardium = VENTRICULAR_MYOCARDIUM.includes(definition.id) || ATRIAL_MYOCARDIUM.includes(definition.id);
    const localSlowing = isMyocardium ? slowing : 1;

    const startMs = definition.offsetMs + penalty.delayMs;
    const durationMs = definition.durationMs * penalty.stretch * localSlowing;
    const endMs = startMs + durationMs;

    // Conduction tissue (apdScale 0) contributes nothing to repolarisation.
    const hasRepolarization = definition.apdScale > 0;
    const regionApd = apd * definition.apdScale;
    const repolEndMs = hasRepolarization ? startMs + regionApd : startMs;
    const repolStartMs = hasRepolarization ? Math.max(endMs, repolEndMs - REPOLARIZATION.DURATION_MS) : startMs;

    const isAtrial = ATRIAL_MYOCARDIUM.includes(definition.id);
    const massScale = isAtrial ? atrialFactor : 1;

    // Hyperkalemia both shortens repolarisation and concentrates it into a taller deflection —
    // together, the tall narrow peaked T wave that is the earliest ECG sign of a rising K+.
    const potassiumExcess = Math.max(0, inputs.serumPotassium - POTASSIUM.NORMAL_MEQ_L);
    const repolMagnitudeScale = isAtrial
      ? REPOLARIZATION.ATRIAL_MAGNITUDE_SCALE
      : REPOLARIZATION.MAGNITUDE_SCALE * (1 + potassiumExcess * POTASSIUM.T_PEAKING_PER_MEQ);

    schedule.set(definition.id, {
      definition,
      startMs,
      endMs,
      repolStartMs,
      repolEndMs,
      effectiveMass: definition.mass * massScale,
      repolMagnitudeScale,
    });
  }

  return schedule;
}

/** QRS onset, offset and duration measured from the schedule, ms. */
export function qrsWindow(schedule: ActivationSchedule): { onsetMs: number; offsetMs: number; durationMs: number } {
  let onsetMs = Infinity;
  let offsetMs = -Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (!scheduled) continue;
    onsetMs = Math.min(onsetMs, scheduled.startMs);
    offsetMs = Math.max(offsetMs, scheduled.endMs);
  }
  return { onsetMs, offsetMs, durationMs: offsetMs - onsetMs };
}

/** End of the T wave — the last ventricular repolarisation to finish. */
export function tWaveEndMs(schedule: ActivationSchedule): number {
  let end = -Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (scheduled) end = Math.max(end, scheduled.repolEndMs);
  }
  return end;
}

/** P wave onset and offset, ms from the atrial onset. */
export function pWaveWindow(schedule: ActivationSchedule): { onsetMs: number; offsetMs: number } {
  let onsetMs = Infinity;
  let offsetMs = -Infinity;
  for (const id of ATRIAL_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (!scheduled) continue;
    onsetMs = Math.min(onsetMs, scheduled.startMs);
    offsetMs = Math.max(offsetMs, scheduled.endMs);
  }
  return { onsetMs, offsetMs };
}

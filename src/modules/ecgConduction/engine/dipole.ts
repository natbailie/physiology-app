import { ATRIAL_MYOCARDIUM } from './regions';
import type { ActivationSchedule, ScheduledRegion } from './activation';
import type { RegionState } from './types';

export interface Vector2 {
  x: number;
  y: number;
}

const DEGREES_TO_RADIANS = Math.PI / 180;

/** Smooth bell over a phase, peaking at the midpoint — a wavefront builds and fades as it
 * crosses a region rather than switching on and off. */
function waveShape(progress: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  return Math.sin(Math.PI * progress);
}

/** Where a region is in its cycle at time `tMs` (measured on its own chamber's clock). */
export function regionStateAt(scheduled: ScheduledRegion, tMs: number): { state: RegionState; progress: number } {
  if (tMs >= scheduled.startMs && tMs < scheduled.endMs) {
    const span = scheduled.endMs - scheduled.startMs || 1;
    return { state: 'depolarizing', progress: (tMs - scheduled.startMs) / span };
  }
  const hasRepolarization = scheduled.repolEndMs > scheduled.repolStartMs;
  if (hasRepolarization && tMs >= scheduled.repolStartMs && tMs < scheduled.repolEndMs) {
    const span = scheduled.repolEndMs - scheduled.repolStartMs || 1;
    return { state: 'repolarizing', progress: (tMs - scheduled.repolStartMs) / span };
  }
  if (tMs >= scheduled.endMs && tMs < scheduled.repolEndMs) {
    const span = scheduled.repolEndMs - scheduled.endMs || 1;
    return { state: 'depolarized', progress: (tMs - scheduled.endMs) / span };
  }
  return { state: 'resting', progress: 0 };
}

/**
 * The direction a region's REPOLARISATION dipole points.
 *
 * This is the subtlest point in the whole model, and it is what makes the T wave upright.
 * Repolarisation is the opposite process to depolarisation, so its current reverses — one
 * sign flip. But in the ventricle the epicardium has a shorter action potential than the
 * endocardium, so it repolarises FIRST and the wavefront travels epicardium→endocardium,
 * opposite to the way depolarisation travelled — a second sign flip. Two flips cancel, so the
 * ventricular T wave points the SAME way as the QRS. That is why a normal T wave is
 * concordant with the QRS in almost every lead.
 *
 * The atria have no such repolarisation gradient, so their Ta wave genuinely does reverse —
 * it is simply small and buried inside the QRS.
 */
function repolarizationAngleDegrees(scheduled: ScheduledRegion): number {
  const isAtrial = ATRIAL_MYOCARDIUM.includes(scheduled.definition.id);
  return isAtrial ? scheduled.definition.depolarizationAngleDegrees + 180 : scheduled.definition.depolarizationAngleDegrees;
}

/** One region's instantaneous contribution to the heart's net dipole. */
export function dipoleContribution(scheduled: ScheduledRegion, tMs: number): Vector2 {
  const { state, progress } = regionStateAt(scheduled, tMs);
  if (state === 'resting' || state === 'depolarized') return { x: 0, y: 0 };

  const isRepolarizing = state === 'repolarizing';
  const scale = isRepolarizing ? scheduled.repolMagnitudeScale : 1;

  const magnitude = scheduled.effectiveMass * waveShape(progress) * scale;
  const angle = (isRepolarizing ? repolarizationAngleDegrees(scheduled) : scheduled.definition.depolarizationAngleDegrees) * DEGREES_TO_RADIANS;

  return { x: magnitude * Math.cos(angle), y: magnitude * Math.sin(angle) };
}

/**
 * Vector sum of every active region's dipole. Regions are read on their own chamber's clock,
 * so when the atria and ventricles are dissociated each still contributes at its own rhythm.
 */
export function netDipole(schedule: ActivationSchedule, atrialTimeMs: number, ventricularTimeMs: number): Vector2 {
  let x = 0;
  let y = 0;
  for (const scheduled of schedule.values()) {
    const tMs = scheduled.definition.chamber === 'atrial' ? atrialTimeMs : ventricularTimeMs;
    const contribution = dipoleContribution(scheduled, tMs);
    x += contribution.x;
    y += contribution.y;
  }
  return { x, y };
}

export function vectorMagnitude(vector: Vector2): number {
  return Math.hypot(vector.x, vector.y);
}

export function vectorAngleDegrees(vector: Vector2): number {
  if (vector.x === 0 && vector.y === 0) return 0;
  return Math.atan2(vector.y, vector.x) / DEGREES_TO_RADIANS;
}

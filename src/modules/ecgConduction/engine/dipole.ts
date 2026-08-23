import { ATRIAL_MYOCARDIUM } from './regions';
import type { ActivationSchedule, ScheduledRegion } from './activation';
import type { RegionState } from './types';

/**
 * The heart's dipole in three dimensions.
 *
 *   x = toward the patient's LEFT
 *   y = INFERIOR (down)
 *   z = ANTERIOR (out through the front of the chest)
 *
 * The limb leads see only x and y — the frontal plane — which is precisely why they cannot
 * distinguish an anterior infarct from a posterior one, and why six more electrodes exist.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
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

/**
 * How far a region's REPOLARISATION dipole points anteriorly.
 *
 * The same two sign flips that keep the ventricular T wave concordant with the QRS in the
 * frontal plane apply here, so the anterior component is unchanged for the ventricle and
 * reversed for the atria — which is what keeps the T wave upright in V5 and V6 rather than
 * inverting it across the precordium.
 */
function repolarizationAnteriorComponent(scheduled: ScheduledRegion): number {
  const isAtrial = ATRIAL_MYOCARDIUM.includes(scheduled.definition.id);
  return isAtrial ? -scheduled.definition.anteriorComponent : scheduled.definition.anteriorComponent;
}

/** One region's instantaneous contribution to the heart's net dipole. */
export function dipoleContribution(scheduled: ScheduledRegion, tMs: number): Vector3 {
  const { state, progress } = regionStateAt(scheduled, tMs);
  if (state === 'resting' || state === 'depolarized') return { x: 0, y: 0, z: 0 };

  const isRepolarizing = state === 'repolarizing';
  const scale = isRepolarizing ? scheduled.repolMagnitudeScale : 1;

  const magnitude = scheduled.effectiveMass * waveShape(progress) * scale;
  const angle = (isRepolarizing ? repolarizationAngleDegrees(scheduled) : scheduled.definition.depolarizationAngleDegrees) * DEGREES_TO_RADIANS;
  const anterior = isRepolarizing ? repolarizationAnteriorComponent(scheduled) : scheduled.definition.anteriorComponent;

  return {
    x: magnitude * Math.cos(angle),
    y: magnitude * Math.sin(angle),
    // Scaled by the same magnitude, so the anterior component keeps its ratio to the frontal
    // one throughout the wavefront's passage across the region.
    z: magnitude * anterior,
  };
}

/**
 * Vector sum of every active region's dipole. Regions are read on their own chamber's clock,
 * so when the atria and ventricles are dissociated each still contributes at its own rhythm.
 */
export function netDipole(schedule: ActivationSchedule, atrialTimeMs: number, ventricularTimeMs: number): Vector3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const scheduled of schedule.values()) {
    const tMs = scheduled.definition.chamber === 'atrial' ? atrialTimeMs : ventricularTimeMs;
    const contribution = dipoleContribution(scheduled, tMs);
    x += contribution.x;
    y += contribution.y;
    z += contribution.z;
  }
  return { x, y, z };
}

/** Length of the dipole's FRONTAL-plane shadow — what the hexaxial reference displays. */
export function vectorMagnitude(vector: Vector3): number {
  return Math.hypot(vector.x, vector.y);
}

/** Direction in the FRONTAL plane, hexaxial degrees. 0 = left, +90 = down. */
export function vectorAngleDegrees(vector: Vector3): number {
  if (vector.x === 0 && vector.y === 0) return 0;
  return Math.atan2(vector.y, vector.x) / DEGREES_TO_RADIANS;
}

/**
 * Direction in the HORIZONTAL plane, degrees, measured from straight-left (V6, 0°) rotating
 * toward anterior. This is the axis the limb leads are blind to, and the one the chest leads
 * exist to measure.
 */
export function horizontalAngleDegrees(vector: Vector3): number {
  if (vector.x === 0 && vector.z === 0) return 0;
  return Math.atan2(vector.z, vector.x) / DEGREES_TO_RADIANS;
}

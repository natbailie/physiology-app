import { AXIS, LEAD_AXES } from './constants';
import { VENTRICULAR_MYOCARDIUM } from './regions';
import { vectorAngleDegrees, type Vector2 } from './dipole';
import type { ActivationSchedule } from './activation';
import type { LeadName } from './types';

const DEGREES_TO_RADIANS = Math.PI / 180;

/**
 * Projects the heart's dipole onto one lead axis — the single operation that turns a
 * three-dimensional electrical event into the squiggle on the paper.
 *
 *   deflection = |dipole| · cos(dipoleAngle − leadAngle)
 *
 * A wavefront heading straight at the lead's positive electrode gives a full upward
 * deflection; one heading away gives a full downward one; one perpendicular gives nothing.
 * Recording the SAME cardiac event from six different angles is all a limb-lead ECG does, and
 * it is why aVR — sitting at −150°, nearly opposite the normal mean axis of about +60° — shows
 * an inverted complex in a perfectly healthy heart.
 */
export function projectOntoLead(dipole: Vector2, lead: LeadName): number {
  const leadAngle = LEAD_AXES[lead] * DEGREES_TO_RADIANS;
  return dipole.x * Math.cos(leadAngle) + dipole.y * Math.sin(leadAngle);
}

/**
 * Mass-weighted mean QRS axis: the direction of the summed ventricular depolarisation
 * vectors. Dominated by the LV free wall, which is why the normal axis sits inferolaterally
 * and why losing or overloading a ventricle swings it.
 */
export function meanQrsAxisDegrees(schedule: ActivationSchedule): number {
  let x = 0;
  let y = 0;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (!scheduled) continue;
    const angle = scheduled.definition.depolarizationAngleDegrees * DEGREES_TO_RADIANS;
    // Weight by the total charge moved: mass times how long the wavefront takes to cross.
    const weight = scheduled.effectiveMass * Math.max(scheduled.endMs - scheduled.startMs, 1);
    x += weight * Math.cos(angle);
    y += weight * Math.sin(angle);
  }
  return vectorAngleDegrees({ x, y });
}

export function classifyAxis(axisDegrees: number): 'normal' | 'left deviation' | 'right deviation' | 'extreme' {
  if (axisDegrees >= AXIS.NORMAL_MIN_DEGREES && axisDegrees <= AXIS.NORMAL_MAX_DEGREES) return 'normal';
  if (axisDegrees < AXIS.NORMAL_MIN_DEGREES && axisDegrees >= AXIS.EXTREME_MIN_DEGREES) return 'left deviation';
  if (axisDegrees > AXIS.NORMAL_MAX_DEGREES && axisDegrees <= 180) return 'right deviation';
  return 'extreme';
}

import { AXIS, LEAD_AXES, PRECORDIAL_AXES, PRECORDIAL_PROXIMITY_GAIN } from './constants';
import { VENTRICULAR_MYOCARDIUM } from './regions';
import { vectorAngleDegrees, type Vector3 } from './dipole';
import type { ActivationSchedule } from './activation';
import type { LeadName, PrecordialLeadName } from './types';

const DEGREES_TO_RADIANS = Math.PI / 180;

/** The chest leads, in the order they are placed across the precordium. */
export const PRECORDIAL_ORDER: PrecordialLeadName[] = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

export function isPrecordialLead(lead: LeadName): lead is PrecordialLeadName {
  return lead in PRECORDIAL_AXES;
}

/**
 * Projects the heart's dipole onto one lead axis — the single operation that turns a
 * three-dimensional electrical event into the squiggle on the paper.
 *
 *   deflection = dipole · leadDirection
 *
 * A wavefront heading straight at the lead's positive electrode gives a full upward
 * deflection; one heading away gives a full downward one; one perpendicular gives nothing.
 * Recording the SAME cardiac event from twelve different angles is all an ECG does, and it is
 * why aVR — sitting at −150°, nearly opposite the normal mean axis of about +60° — shows an
 * inverted complex in a perfectly healthy heart.
 *
 * The only difference between a limb lead and a chest lead here is which plane its direction
 * lies in: the limb leads sample x and y, the chest leads x and z. Nothing else about the
 * calculation changes, which is the point — twelve leads are one dipole seen twelve ways.
 */
export function projectOntoLead(dipole: Vector3, lead: LeadName): number {
  if (isPrecordialLead(lead)) {
    const angle = PRECORDIAL_AXES[lead] * DEGREES_TO_RADIANS;
    return (dipole.x * Math.cos(angle) + dipole.z * Math.sin(angle)) * PRECORDIAL_PROXIMITY_GAIN;
  }
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
  return vectorAngleDegrees({ x, y, z: 0 });
}

/**
 * Net area under the QRS in one lead — how far the whole of ventricular depolarisation
 * points at that electrode, mass and duration weighted.
 *
 * Cheap enough to compute every tick, and it is what the R/S transition is actually asking
 * about: whether the summed forces of the beat are heading toward this electrode or away.
 */
export function qrsNetArea(schedule: ActivationSchedule, lead: LeadName): number {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (!scheduled) continue;
    const angle = scheduled.definition.depolarizationAngleDegrees * DEGREES_TO_RADIANS;
    const weight = scheduled.effectiveMass * Math.max(scheduled.endMs - scheduled.startMs, 1);
    x += weight * Math.cos(angle);
    y += weight * Math.sin(angle);
    z += weight * scheduled.definition.anteriorComponent;
  }
  return projectOntoLead({ x, y, z }, lead);
}

/**
 * The R/S transition: the first chest lead across which the QRS becomes net positive.
 *
 * It moves from V1 toward V6 because the vector swings from the anterior septum and right
 * ventricle round to the posterior-left mass of the left ventricle, so the transition is a
 * direct readout of where that crossover happens. Normally V3 or V4. Returns null when no
 * lead is net positive at all — poor R-wave progression, which is a finding rather than an
 * absence of one.
 */
export function rWaveTransition(schedule: ActivationSchedule): PrecordialLeadName | null {
  for (const lead of PRECORDIAL_ORDER) {
    if (qrsNetArea(schedule, lead) > 0) return lead;
  }
  return null;
}

export function classifyAxis(axisDegrees: number): 'normal' | 'left deviation' | 'right deviation' | 'extreme' {
  if (axisDegrees >= AXIS.NORMAL_MIN_DEGREES && axisDegrees <= AXIS.NORMAL_MAX_DEGREES) return 'normal';
  if (axisDegrees < AXIS.NORMAL_MIN_DEGREES && axisDegrees >= AXIS.EXTREME_MIN_DEGREES) return 'left deviation';
  if (axisDegrees > AXIS.NORMAL_MAX_DEGREES && axisDegrees <= 180) return 'right deviation';
  return 'extreme';
}

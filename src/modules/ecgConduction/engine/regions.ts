import type { RegionId } from './types';

/** Which clock a region runs on. In complete heart block the atria and ventricles beat
 * independently, so every region has to know which one it follows. */
export type Chamber = 'atrial' | 'ventricular';

export interface RegionDefinition {
  id: RegionId;
  label: string;
  chamber: Chamber;
  /**
   * Electrical mass — how much this region contributes to the surface ECG. The specialised
   * conduction tissue (SA node, AV node, His, bundles) is given a near-zero mass on purpose:
   * it IS conducting, and vigorously, but there is far too little tissue to produce a
   * detectable surface deflection. That is the entire reason the PR segment is flat.
   */
  mass: number;
  /**
   * Direction the depolarisation wavefront travels in the FRONTAL plane, in hexaxial degrees
   * (0° = toward the patient's left, +90° = downward).
   */
  depolarizationAngleDegrees: number;
  /**
   * How far the same wavefront points toward the front of the chest (+) or the back (-),
   * relative to its frontal magnitude. The third dimension the limb leads cannot see.
   *
   * Deliberately a SEPARATE component rather than a second angle, so the frontal x and y stay
   * exactly what they were before the chest leads existed: adding a horizontal plane to the
   * model must not silently move a limb-lead trace.
   *
   * Two of these values carry nearly all of the teaching. The septum is anterior and
   * depolarises rightward, so it points at V1 and away from V6. The left ventricular free
   * wall is posterior and vastly more massive, so it points away from V1 and at V6. Between
   * them they produce rS in V1 and qR in V6 — and therefore R-wave progression — without any
   * of it being drawn.
   */
  anteriorComponent: number;
  /** Offset from the chamber's onset, ms. */
  offsetMs: number;
  /** How long the wavefront takes to cross this region, ms. */
  durationMs: number;
  /** Scales this region's action potential duration, creating the repolarisation dispersion
   * that shapes the T wave. */
  apdScale: number;
}

/**
 * The activation sequence, in order. Angles and masses are chosen so the emergent QRS has a
 * mean axis near +70° and the familiar small-q / tall-R / small-s morphology in lead II.
 *
 * Two choices carry most of the teaching weight:
 *
 * 1. The septum depolarises LEFT TO RIGHT (angle ~160°, i.e. rightward), which is why a small
 *    negative q appears first in the leftward-facing leads.
 * 2. The LV free wall has by far the largest mass, so it dominates the complex and sets the
 *    mean axis — which is why lead II (aligned at +60°) shows the tallest R, and aVR (at
 *    −150°, nearly opposite) is normally inverted.
 */
export const REGIONS: RegionDefinition[] = [
  {
    id: 'saNode',
    label: 'SA node',
    chamber: 'atrial',
    mass: 0.004,
    depolarizationAngleDegrees: 60,
    anteriorComponent: 0.2,
    offsetMs: -4,
    durationMs: 6,
    apdScale: 0,
  },
  {
    id: 'rightAtrium',
    label: 'Right atrium',
    chamber: 'atrial',
    mass: 0.062,
    depolarizationAngleDegrees: 62,
    // The right atrium sits anteriorly, the left posteriorly, which is why the P wave in V1 is
    // normally biphasic: an upward deflection followed by a downward one.
    anteriorComponent: 0.35,
    offsetMs: 0,
    durationMs: 46,
    apdScale: 0.5,
  },
  {
    id: 'leftAtrium',
    label: 'Left atrium',
    chamber: 'atrial',
    mass: 0.052,
    depolarizationAngleDegrees: 48,
    anteriorComponent: -0.35,
    offsetMs: 22,
    durationMs: 48,
    apdScale: 0.5,
  },
  {
    id: 'avNode',
    label: 'AV node',
    chamber: 'ventricular',
    // Negligible mass: conducting hard, invisible on the surface — the flat PR segment.
    mass: 0.003,
    depolarizationAngleDegrees: 75,
    anteriorComponent: 0.1,
    offsetMs: -40,
    durationMs: 34,
    apdScale: 0,
  },
  {
    id: 'hisBundle',
    label: 'His bundle',
    chamber: 'ventricular',
    mass: 0.003,
    depolarizationAngleDegrees: 80,
    anteriorComponent: 0.1,
    offsetMs: -12,
    durationMs: 8,
    apdScale: 0,
  },
  {
    id: 'rightBundle',
    label: 'Right bundle',
    chamber: 'ventricular',
    mass: 0.004,
    depolarizationAngleDegrees: 95,
    anteriorComponent: 0.5,
    offsetMs: -6,
    durationMs: 8,
    apdScale: 0,
  },
  {
    id: 'leftBundle',
    label: 'Left bundle',
    chamber: 'ventricular',
    mass: 0.004,
    depolarizationAngleDegrees: 70,
    anteriorComponent: -0.2,
    offsetMs: -6,
    durationMs: 8,
    apdScale: 0,
  },
  {
    id: 'septum',
    label: 'Septum',
    chamber: 'ventricular',
    mass: 0.1,
    // Left-to-right, i.e. rightward — the source of the small septal q wave.
    depolarizationAngleDegrees: 160,
    // Anterior as well as rightward: this is what puts a small positive r at the start of the
    // V1 complex and a small negative q at the start of V6.
    anteriorComponent: 0.5,
    offsetMs: 0,
    durationMs: 20,
    apdScale: 0.95,
  },
  {
    id: 'rvFreeWall',
    label: 'RV free wall',
    chamber: 'ventricular',
    mass: 0.17,
    depolarizationAngleDegrees: 110,
    // The most anterior chamber of the heart, which is why V1 and V2 sit closest to it.
    anteriorComponent: 0.8,
    offsetMs: 15,
    durationMs: 34,
    apdScale: 0.92,
  },
  {
    id: 'lvFreeWall',
    label: 'LV free wall',
    chamber: 'ventricular',
    // Dominant mass — this is what makes the R wave tall and sets the mean QRS axis.
    mass: 0.55,
    depolarizationAngleDegrees: 55,
    // Posterior and dominant. Its vector heads away from V1 and straight at V6, so it writes the
    // deep S of V1 and the tall R of V6 — and the crossover between them is the transition.
    // Only mildly posterior, because the bulk of the truly posterior force belongs to the base
    // below: loading it here instead pushed the transition out past V5.
    anteriorComponent: -0.25,
    offsetMs: 12,
    durationMs: 44,
    apdScale: 1,
  },
  {
    id: 'lvBase',
    label: 'LV base',
    chamber: 'ventricular',
    mass: 0.12,
    // Last to activate, directed up and to the right — the terminal s wave. The posterobasal
    // segment is also the most POSTERIOR part of the ventricle, so the terminal forces head
    // away from the chest wall. That is what deepens the S in V1 and V2 without flattening the
    // R the anterior leads are building through the middle of the complex.
    depolarizationAngleDegrees: -70,
    anteriorComponent: -0.95,
    offsetMs: 46,
    durationMs: 28,
    apdScale: 1.06,
  },
];

export const VENTRICULAR_MYOCARDIUM: RegionId[] = ['septum', 'rvFreeWall', 'lvFreeWall', 'lvBase'];
export const ATRIAL_MYOCARDIUM: RegionId[] = ['rightAtrium', 'leftAtrium'];

export function regionById(id: RegionId): RegionDefinition {
  const found = REGIONS.find((region) => region.id === id);
  if (!found) throw new Error(`Unknown region: ${id}`);
  return found;
}

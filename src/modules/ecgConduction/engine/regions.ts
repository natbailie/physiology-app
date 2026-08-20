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
   * Direction the depolarisation wavefront travels, in hexaxial degrees (0° = toward the
   * patient's left, +90° = downward).
   */
  depolarizationAngleDegrees: number;
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
    offsetMs: 12,
    durationMs: 44,
    apdScale: 1,
  },
  {
    id: 'lvBase',
    label: 'LV base',
    chamber: 'ventricular',
    mass: 0.12,
    // Last to activate, directed up and to the right — the terminal s wave.
    depolarizationAngleDegrees: -70,
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

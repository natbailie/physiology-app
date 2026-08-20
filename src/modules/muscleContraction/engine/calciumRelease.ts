import { CALCIUM, MUSCLE_TYPES } from './constants';
import type { MuscleType } from './types';

/**
 * How strongly the excitation signal is coupled to SR calcium release.
 *
 * Skeletal muscle couples the DHPR to the ryanodine receptor MECHANICALLY — the voltage
 * sensor physically pulls the release channel open — so extracellular calcium is almost
 * irrelevant and a skeletal muscle contracts normally in a calcium-free bath. Cardiac muscle
 * instead uses calcium-induced calcium release: a trigger influx through L-type channels opens
 * the RyR, so cardiac force depends directly on extracellular calcium. Smooth muscle relies
 * even more heavily on entry.
 */
export function excitationCouplingGain(muscleType: MuscleType, extracellularCalcium: number): number {
  const { extracellularDependence, releaseGain } = MUSCLE_TYPES[muscleType];
  const calciumTerm = 1 - extracellularDependence + extracellularDependence * extracellularCalcium;
  return releaseGain * Math.max(0, calciumTerm);
}

/**
 * Total calcium flux out of the SR, µM/s: the stimulated release, plus a standing passive leak,
 * plus any pharmacological or pathological RyR leak. All three scale with how much calcium the
 * store still holds, which is why a depleted SR produces progressively weaker contractions.
 */
export function releaseFlux(
  excitationPulse: number,
  cytosolicCalciumUM: number,
  srCalciumLoad: number,
  muscleType: MuscleType,
  extracellularCalcium: number,
  ryrLeak: number,
): number {
  const triggered = CALCIUM.RELEASE_FLUX_GAIN * excitationPulse * excitationCouplingGain(muscleType, extracellularCalcium);
  // The standing leak tracks SERCA density, so every muscle type rests at the same ~0.1 µM.
  // A pathological RyR leak does not — it is imposed on top of whatever the cell can clear.
  const leak = CALCIUM.PASSIVE_LEAK_FLUX * MUSCLE_TYPES[muscleType].sercaScale + CALCIUM.RYR_LEAK_FLUX_GAIN * ryrLeak;
  return (triggered + leak) * Math.max(0, srCalciumLoad) * releaseInactivation(cytosolicCalciumUM);
}

/**
 * Release shuts down as cytosolic calcium climbs — the RyR is inactivated by the very calcium it
 * releases, and the gradient driving release falls as the cytosol fills. This is the brake that
 * makes a sustained tetanus plateau at a couple of micromolar instead of running away.
 */
export function releaseInactivation(cytosolicCalciumUM: number): number {
  return Math.max(0, 1 - cytosolicCalciumUM / CALCIUM.RELEASE_INACTIVATION_UM);
}

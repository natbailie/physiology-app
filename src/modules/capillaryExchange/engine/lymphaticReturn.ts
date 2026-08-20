import { LYMPHATIC, PROTEIN, TISSUE_BEDS } from './constants';
import { clamp } from '@/shared/lib/math';
import type { TissueBed } from './types';

/**
 * Lymph flow, driven by interstitial pressure itself: as the tissue fills, its pressure rises,
 * and the lymphatic pump takes more away. It is a proportional controller built into the tissue.
 *
 * The RESERVE — capacity divided by baseline flow — is what makes the system forgiving.
 * Systemically it is about twentyfold, so filtration can rise several times over with nothing
 * visible happening; only once the reserve is exhausted does fluid start to accumulate. It is
 * also why blocking the lymphatics on their own (filariasis, axillary node clearance) causes
 * oedema despite every Starling force being entirely normal.
 */
export function lymphFlow(interstitialPressureMmHg: number, lymphaticFlowCapacity: number, tissueBed: TissueBed): number {
  const bed = TISSUE_BEDS[tissueBed];
  const capacity = lymphaticCapacity(lymphaticFlowCapacity, tissueBed);
  const base = bed.lymphBaseFlowMlPerMin * Math.min(Math.max(lymphaticFlowCapacity, 0), 1);
  // Gain is set so every bed reaches capacity over the same rise in interstitial pressure.
  const gain = (bed.lymphCapacityMlPerMin - bed.lymphBaseFlowMlPerMin) / LYMPHATIC.SATURATION_PRESSURE_MMHG;
  const driven = base + gain * (interstitialPressureMmHg - bed.baselineInterstitialPressureMmHg) * Math.max(lymphaticFlowCapacity, 0);
  return clamp(driven, 0, capacity);
}

export function lymphaticCapacity(lymphaticFlowCapacity: number, tissueBed: TissueBed): number {
  return TISSUE_BEDS[tissueBed].lymphCapacityMlPerMin * Math.max(lymphaticFlowCapacity, 0);
}

/** How much of the reserve is still unused. Accumulation cannot begin until this reaches zero. */
export function lymphaticReserveFraction(currentFlow: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return clamp(1 - currentFlow / capacity, 0, 1);
}

/**
 * Protein returned to the circulation by the lymph, g/min. This is the lymphatics' other job,
 * and the one nothing else can do: protein that has crossed into the interstitium cannot diffuse
 * back against its own gradient. Without lymphatic return it accumulates, interstitial oncotic
 * pressure climbs, and the oedema becomes self-sustaining — which is why lymphoedema is
 * protein-rich and eventually fibrotic rather than simply wet.
 */
export function proteinReturnGPerMin(lymphFlowMlPerMin: number, interstitialProteinGDl: number): number {
  return (lymphFlowMlPerMin * interstitialProteinGDl) / 100;
}

/**
 * Protein crossing INTO the interstitium, g/min, by two routes.
 *
 * Convective: carried along with filtered water, but only the fraction the wall fails to
 * reflect, (1 − sigma). This is the term that explodes in sepsis and burns.
 *
 * Diffusive: a small, steady leak down the concentration gradient by transcytosis and through
 * the large-pore pathway. It happens even where sigma is 1, which is why the interstitium always
 * contains protein and why the lymphatics have something to return. Its coefficient is
 * calibrated per bed so that the resting protein flux exactly balances lymphatic removal.
 */
export function proteinInfluxGPerMin(
  filtrationRateMlPerMin: number,
  reflectionCoefficient: number,
  plasmaProteinGDl: number,
  interstitialProteinGDl: number,
  tissueBed: TissueBed,
): number {
  const convective =
    filtrationRateMlPerMin > 0 ? (filtrationRateMlPerMin * (1 - reflectionCoefficient) * plasmaProteinGDl) / 100 : 0;
  // Bidirectional: if the interstitium ever becomes the more concentrated compartment, protein
  // diffuses back the other way. Nothing here is allowed to move up its own gradient.
  const diffusive = proteinDiffusionCoefficient(tissueBed) * (plasmaProteinGDl - interstitialProteinGDl);
  return convective + diffusive;
}

/** Chosen so that at rest, diffusive influx exactly equals the protein the lymph carries away. */
export function proteinDiffusionCoefficient(tissueBed: TissueBed): number {
  const bed = TISSUE_BEDS[tissueBed];
  const restingRemoval = (bed.lymphBaseFlowMlPerMin * bed.baselineInterstitialProteinGDl) / 100;
  const gradient = Math.max(PROTEIN.BASELINE_PLASMA_G_DL - bed.baselineInterstitialProteinGDl, 0.05);
  return restingRemoval / gradient;
}

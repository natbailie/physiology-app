import { SUBSTRATE } from './constants';
import { clamp, scaleClamped } from '@/shared/lib/math';

/** Iron adequacy for haem synthesis, 0..1. */
export function ironAdequacy(ironAvailability: number, ironStores: number): number {
  // Dietary supply and stored iron both contribute; stores buffer a poor intake for a while,
  // which is why iron deficiency takes months of bleeding to appear.
  const supply = clamp(ironAvailability / SUBSTRATE.IRON_SATURATION_PCT, 0, 1.5);
  return clamp(supply * 0.6 + clamp(ironStores, 0, 1) * 0.4, 0, 1.2);
}

/** B12/folate adequacy for DNA synthesis, 0..1. */
export function b12FolateAdequacy(b12FolateStatus: number): number {
  return clamp(b12FolateStatus / SUBSTRATE.B12_FOLATE_SATURATION_PCT, 0, 1.5);
}

/**
 * Mean corpuscular volume of newly produced cells, fL — the classifier.
 *
 * The two deficiencies push cell size in OPPOSITE directions, and the reason is a race between
 * nucleus and cytoplasm:
 *
 * - Without IRON, haemoglobin accumulates too slowly. The precursor keeps dividing while it
 *   waits to reach its haemoglobin threshold, so it ends up small — MICROCYTIC.
 * - Without B12 or FOLATE, DNA synthesis stalls while the cytoplasm matures on schedule. The
 *   cell cannot divide on time and is released oversized — MACROCYTIC.
 *
 * That single opposition is what makes MCV the first branch point in classifying an anemia.
 */
export function producedMcvTarget(ironAvailability: number, ironStores: number, b12FolateStatus: number): number {
  const iron = ironAdequacy(ironAvailability, ironStores);
  const b12 = b12FolateAdequacy(b12FolateStatus);

  const microcyticShift = scaleClamped(iron, 0, 1, SUBSTRATE.IRON_MCV_SHIFT_FL, 0);
  const macrocyticShift = scaleClamped(b12, 0, 1, SUBSTRATE.B12_MCV_SHIFT_FL, 0);

  return clamp(SUBSTRATE.NORMAL_MCV_FL - microcyticShift + macrocyticShift, SUBSTRATE.MIN_MCV_FL, SUBSTRATE.MAX_MCV_FL);
}

/**
 * How much a substrate shortage limits the RATE of production, 0..1.
 *
 * This is separate from cell size: a marrow short of iron or B12 makes not only abnormal cells
 * but fewer of them, which is why these anemias are hypoproliferative — a low reticulocyte
 * count despite a high EPO.
 */
export function substrateProductionLimit(ironAvailability: number, ironStores: number, b12FolateStatus: number): number {
  const iron = clamp(ironAdequacy(ironAvailability, ironStores), 0, 1);
  const b12 = clamp(b12FolateAdequacy(b12FolateStatus), 0, 1);
  // Whichever is scarcer limits the whole process.
  return Math.min(iron, b12);
}

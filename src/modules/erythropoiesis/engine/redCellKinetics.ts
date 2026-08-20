import { HEMOGLOBIN, MARROW, RED_CELL_KINETICS, RETICULOCYTE } from './constants';
import { clamp } from '@/shared/lib/math';

/**
 * Target marrow erythroid output, 0..1+.
 *
 * EPO drives it, but the marrow can only build what it has the capacity and the raw materials
 * for. All three must hold — which is why a high EPO alone tells you nothing about whether
 * red cells are actually being made.
 */
export function marrowOutputTarget(epoLevel: number, marrowFunction: number, substrateLimit: number): number {
  const drive = MARROW.BASAL_OUTPUT + epoLevel * MARROW.EPO_GAIN;
  // Softened rather than proportional: a substrate shortage cripples production but does not
  // abolish it, so a deficiency settles at a survivable haemoglobin instead of collapsing to
  // the floor. A linear limit made every deficiency look instantly fatal.
  const substrate = Math.pow(clamp(substrateLimit, 0, 1.5), 0.6);
  return clamp(drive * clamp(marrowFunction, 0, 1.5) * substrate, 0, MARROW.MAX_OUTPUT);
}

/**
 * Total red cell loss rate: normal senescence plus any haemolysis or bleeding.
 *
 * Senescent loss is PROPORTIONAL to the circulating red cell mass — roughly one-hundred-and-
 * twentieth of it per day — so a smaller mass loses fewer cells. That proportionality is what
 * lets a failing marrow settle at a new, lower steady state rather than spiralling to zero.
 */
export function redCellLossRate(hemolysisRate: number, bloodLossRate: number, hemoglobinGDl: number): number {
  const massFraction = clamp(hemoglobinGDl / HEMOGLOBIN.NORMAL_G_DL, 0, 2);
  return (
    RED_CELL_KINETICS.BASAL_LOSS * massFraction +
    (hemolysisRate / 100) * RED_CELL_KINETICS.HEMOLYSIS_GAIN * massFraction +
    (bloodLossRate / 100) * RED_CELL_KINETICS.BLOOD_LOSS_GAIN
  );
}

/**
 * Reticulocyte production index — the module's most useful number.
 *
 * A raw reticulocyte count is misleading in anemia because the same absolute number of new
 * cells represents a much bigger effort when the total red cell mass is small. Correcting for
 * that gives an index that answers one question: is the marrow responding as hard as it should?
 *
 * Below about 2, it is not — a HYPOPROLIFERATIVE anemia, where the marrow cannot respond
 * because it lacks EPO (renal failure), raw materials (iron, B12) or capacity (aplasia). Above
 * it, the marrow is working hard and the problem lies downstream in destruction or loss
 * (haemolysis, bleeding). Crucially the haemoglobin can be identical in both cases — it is the
 * retic index, not the Hb, that splits them.
 */
export function reticulocyteIndex(marrowOutput: number): number {
  // `marrowOutput` is already an ABSOLUTE production rate, so it needs no haematocrit
  // correction. The clinical index corrects a reticulocyte PERCENTAGE precisely because its
  // denominator shrinks in anemia; applying that correction here as well would double-count
  // it and wrongly drag a vigorously responding haemolytic marrow below the threshold.
  return clamp((marrowOutput / RED_CELL_KINETICS.BASAL_LOSS) * RETICULOCYTE.SCALE, 0, RETICULOCYTE.MAX);
}

/** Whether the marrow is failing to mount an adequate response for the degree of anemia. */
export function isHypoproliferative(reticIndex: number, hemoglobinGDl: number): boolean {
  const anemic = hemoglobinGDl < HEMOGLOBIN.ANEMIA_THRESHOLD_G_DL;
  return anemic && reticIndex < RETICULOCYTE.ADEQUATE_RESPONSE_THRESHOLD;
}

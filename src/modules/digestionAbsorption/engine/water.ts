import { WATER } from './constants';
import { clamp } from '@/shared/lib/math';

export interface WaterBalance {
  stoolWaterMlPerDay: number;
  osmoticMlPerDay: number;
  secretoryMlPerDay: number;
  presentedMlPerDay: number;
  effectiveSalvageMlPerDay: number;
}

/**
 * Stool water is what the colon could not reclaim.
 *
 * Osmotic particles (unabsorbed lactose) hold water all the way out by osmosis — no salvage
 * reclaims them, which is exactly why that diarrhoea stops when the food stops. The
 * secretagogues work differently: hydroxylated fatty acids from fat maldigestion, spilt bile
 * salts and an active VIP-like drive both ADD volume AND poison the colon's ability to
 * absorb, so the litres escape even in a fasting patient.
 */
export function waterBalance(params: {
  unabsorbedLactoseGPerDay: number;
  faecalFatGPerDay: number;
  spiltBileSaltsGPerDay: number;
  secretoryDrivePct: number;
  colonicFunctionPct: number;
}): WaterBalance {
  const osmotic = WATER.OSMOTIC_ML_PER_G_LACTOSE * Math.max(params.unabsorbedLactoseGPerDay, 0);
  const fatVolume = WATER.FAECAL_FAT_ML_PER_G * Math.max(params.faecalFatGPerDay, 0);
  const cholerVolume = WATER.CHOLERHOEIC_ML_PER_G_BILE * Math.max(params.spiltBileSaltsGPerDay, 0);
  const driveFrac = clamp(params.secretoryDrivePct / 100, 0, 1);
  const activeVolume = WATER.SECRETORY_MAX_ML_PER_DAY * driveFrac;

  // Secretagogues do not merely pour water in; they stop the colon taking it back out.
  const impairment = clamp(
    WATER.BILE_IMPAIRMENT_PER_G * params.spiltBileSaltsGPerDay +
      WATER.FAT_IMPAIRMENT_PER_G * params.faecalFatGPerDay +
      WATER.DRIVE_IMPAIRMENT_AT_FULL * driveFrac,
    0,
    0.85,
  );
  const salvage =
    WATER.COLON_SALVAGE_MAX_ML_PER_DAY * clamp(params.colonicFunctionPct / 100, 0, 1) * (1 - impairment);

  const presented = WATER.PRESENTED_BASE_ML_PER_DAY + fatVolume + cholerVolume + activeVolume;
  const absorbed = Math.min(presented, salvage);
  const unsalvageableStool = Math.max(presented - absorbed, 0);

  return {
    osmoticMlPerDay: osmotic,
    secretoryMlPerDay: fatVolume + cholerVolume + activeVolume,
    presentedMlPerDay: presented,
    effectiveSalvageMlPerDay: salvage,
    stoolWaterMlPerDay: WATER.STOOL_BASELINE_ML_PER_DAY + unsalvageableStool + osmotic,
  };
}

/** The stool osmotic gap story in one flag: unabsorbed SOLUTE leaves a big gap, because the
 * water is held by particles no electrolyte accounts for. True secretion is electrolyte-rich
 * and the gap stays low — the bedside test that separates "stop the milk" from "find the tumour". */
export function stoolOsmoticGapHigh(osmoticMlPerDay: number, secretoryMlPerDay: number): boolean {
  return osmoticMlPerDay > secretoryMlPerDay && osmoticMlPerDay > 60;
}

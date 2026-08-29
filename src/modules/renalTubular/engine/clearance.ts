import { clamp } from '@/shared/lib/math';
import { CLEARANCE } from './constants';
import type { RenalTubularInputs } from './types';

export interface ClearanceReadouts {
  /** Creatinine clearance, mL/min — GFR plus the small proximal secretion that makes CrCl
   * slightly OVERestimate the true rate */
  creatinineClearanceMLMin: number;
  /** Effective renal plasma flow from PAH clearance, mL/min */
  renalPlasmaFlowMLMin: number;
  /** Filtration fraction, % */
  filtrationFractionPct: number;
  /** Urine sodium concentration, mEq/L */
  urineSodiumMeqL: number;
  /** Fractional excretion of sodium, % — under 1 in pre-renal states, over 2 once tubules die */
  fractionalExcretionNaPct: number;
}

/**
 * Fraction of filtered sodium each nephron segment manages to reclaim, given drug state and
 * injury. The proximal tubule takes the bulk, the loop most of the rest; both are what dies
 * in acute tubular necrosis, which is why a necrotic kidney SODIUM-WASTES.
 *
 * Returns the fraction of the filtered load still in the lumen at the end of the collecting
 * duct. Calibrated so an intact nephron excretes well under 1% and a fully injured one sheds
 * several times that.
 */
function unreclaimedNaFraction(inputs: RenalTubularInputs): number {
  const injury = clamp(inputs.tubularInjury, 0, 1);
  // Each stage reclaims its share of what remains. Injury degrades every active-transport
  // stage together — dead tubules do not respect segment boundaries.
  let remaining = 1;
  remaining *= 1 - CLEARANCE.PROXIMAL_NA_RECLAIM * (1 - CLEARANCE.INJURY_PROXIMAL_DAMAGE * injury);
  remaining *=
    1 - CLEARANCE.LOOP_NA_RECLAIM * (1 - CLEARANCE.INJURY_LOOP_DAMAGE * injury) * clamp(1 - inputs.loopDiureticDose / 100, 0, 1);
  remaining *=
    1 -
    CLEARANCE.DISTAL_NA_RECLAIM * (1 - CLEARANCE.INJURY_DISTAL_DAMAGE * injury) * clamp(1 - inputs.thiazideDose / 100, 0, 1);

  // Final fine-tuning is aldosterone's ENaC: blocked by amiloride, absent in type 4 RTA.
  const enacAvailable = 1 - clamp(inputs.enacBlockade, 0, 100) / 100;
  const aldoDrive = clamp(inputs.aldosteroneTone * enacAvailable, 0, 1.5) / 1;
  remaining *= 1 - CLEARANCE.CD_NA_RECLAIM * clamp(aldoDrive, 0, 1);

  return remaining;
}

/**
 * Clearance panel: what a lab actually reports.
 *
 * Creatinine is filtered plus a little secreted, PAH is filtered plus almost completely
 * cleared from the plasma per pass, and everything downstream of those two numbers — RPF,
 * filtration fraction, FENa — follows arithmetically. Nothing here is drawn; all of it is
 * read off the same GFR and sodium cascade the rest of the module runs on.
 */
export function clearancePanel(
  gfrMLPerMin: number,
  urineFlowMLPerMin: number,
  inputs: RenalTubularInputs,
): ClearanceReadouts {
  // Creatinine adds ~10% via proximal secretion; renal plasma flow follows from the
  // filtration fraction the healthy kidney maintains.
  const creatinineClearanceMLMin = gfrMLPerMin * (1 + CLEARANCE.CREATININE_SECRETION_FRACTION);
  const renalPlasmaFlowMLMin = Math.max(gfrMLPerMin, 1) / CLEARANCE.BASELINE_FILTRATION_FRACTION;
  const filtrationFractionPct = (gfrMLPerMin / Math.max(renalPlasmaFlowMLMin, 1)) * 100;

  // Urine [Na]: the unreclaimed fraction of the filtered load, dissolved in whatever water
  // survived. Pre-renal kidneys reclaim hard under aldosterone AND concentrate vigorously,
  // so urine Na falls below 20 while FENa sits under 1%.
  const filteredNaMeqPerMin = (gfrMLPerMin / 1000) * CLEARANCE.FILTRATE_NA_MEQ_L;
  const excretedNaMeqPerMin = filteredNaMeqPerMin * unreclaimedNaFraction(inputs);
  const urineSodiumMeqL = (excretedNaMeqPerMin / Math.max(urineFlowMLPerMin, 0.01)) * 1000;
  const fractionalExcretionNaPct = (excretedNaMeqPerMin / Math.max(filteredNaMeqPerMin, 1e-9)) * 100;

  return {
    creatinineClearanceMLMin,
    renalPlasmaFlowMLMin,
    filtrationFractionPct,
    urineSodiumMeqL: clamp(urineSodiumMeqL, 1, 400),
    fractionalExcretionNaPct,
  };
}

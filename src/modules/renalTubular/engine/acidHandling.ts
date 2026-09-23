import { clamp } from '@/shared/lib/math';
import { ACID } from './constants';
import type { RenalTubularInputs } from './types';

export interface AcidReadouts {
  /** Plasma bicarbonate at steady state for the current capacities, mEq/L */
  serumBicarbonateMeqL: number;
  /** Urine pH the distal nephron is actually achieving right now */
  urinePH: number;
  /** Net acid excreted per day, mEq/day — the quantity acidosis pushes up to its ceiling */
  netAcidExcretionMeqPerDay: number;
  /** Urine anion gap, mEq/L: positive means ammonium excretion is failing, which localises
   * a metabolic acidosis to the kidney rather than the gut */
  urineAnionGapMeqL: number;
}

/**
 * Effective distal Na-channel drive. Aldosterone opens ENaC; amiloride closes the channel
 * itself. Both converge on the same thing — the lumen-negative potential that secretes K+
 * and lets H+ work against the gradient.
 */
export function effectiveDistalDrive(inputs: RenalTubularInputs): number {
  const enacAvailable = 1 - clamp(inputs.enacBlockade, 0, 100) / 100;
  return clamp(inputs.aldosteroneTone * enacAvailable, 0, 1.5);
}

/** Proximal HCO3 reclaim effectiveness after structural failure and carbonic-anhydrase block. */
export function effectiveProximalReclaim(inputs: RenalTubularInputs): number {
  const caBlock = clamp(inputs.acetazolamideDose, 0, 100) / 100;
  return clamp(inputs.proximalAcidReclaim, 0, 1) * (1 - ACID.ACETAZOLAMIDE_MAX_BLOCK * caBlock);
}

/**
 * The plasma bicarbonate concentration BELOW which the impaired proximal tubule can reclaim
 * everything presented to it. A healthy tubule's threshold sits at or above the defended
 * level, so nothing spills; a type 2 tubule's threshold falls until serum meets it — which
 * is precisely why proximal RTA self-limits rather than running to the floor.
 */
function reclaimThresholdMeqL(inputs: RenalTubularInputs): number {
  return ACID.MIN_BICARBONATE + (ACID.NORMAL_BICARBONATE - ACID.MIN_BICARBONATE) * effectiveProximalReclaim(inputs);
}

/**
 * The distal nephron's capacity to excrete the daily acid load, mEq/day.
 *
 * Two things cap it: the H+-ATPase of the alpha-intercalated cells (destroyed in distal RTA)
 * and the aldosterone-driven ammoniagenesis that buffers what the pump secretes (gone in
 * type 4 RTA, which is why type 4 carries a POSITIVE urine anion gap while still managing
 * an acidic urine — H+ secreted into an unbuffered lumen drops the pH fast while carrying
 * almost no total acid).
 */
export function distalAcidCapacityMeqPerDay(inputs: RenalTubularInputs): number {
  const pumpFactor = clamp(inputs.distalAcidSecretion, 0, 1);
  const bufferFactor = clamp(effectiveDistalDrive(inputs) / ACID.BUFFER_HALF_ALDOSTERONE, 0, 1.4);
  return ACID.MAX_NET_ACID_EXCRETION * Math.min(pumpFactor * Math.min(bufferFactor, 1.4), 1.4);
}

/** Absolute ammonium/buffer supply available for urinary buffering, independent of the pump. */
function ammoniumBufferSupplyMeqPerDay(inputs: RenalTubularInputs): number {
  const supplyFraction = clamp(effectiveDistalDrive(inputs) / ACID.BUFFER_HALF_ALDOSTERONE, 0, 1) * 0.8;
  return ACID.MAX_NET_ACID_EXCRETION * supplyFraction;
}

/**
 * Steady state of the acid arm, anchored on four textbook facts:
 *
 * - a normal kidney holds serum bicarbonate near 24 while excreting the basal acid load;
 * - distal (type 1) RTA retains acid up to a moderate deficit and CANNOT acidify the urine
 *   below ~5.5 however acidemic the patient becomes;
 * - proximal (type 2) RTA spills bicarbonate only until serum falls to its reclaim threshold,
 *   and CAN still acidify urine;
 * - type 4 (hypoaldosteronism) gives a mild acidosis with a positive urine anion gap, an
 *   acid urine, and a raised potassium — one hormone failure, four consequences.
 */
export function acidSteadyState(inputs: RenalTubularInputs): AcidReadouts {
  const capacity = distalAcidCapacityMeqPerDay(inputs);

  // Retained acid: whatever the distal nephron cannot excrete comes off the buffer pool,
  // which spans ECF, ICF and bone — hence the large effective buffering per mEq/L.
  const retainedMeqPerDay = Math.max(0, ACID.DAILY_ACID_LOAD - capacity);
  const afterRetention = ACID.NORMAL_BICARBONATE - retainedMeqPerDay / ACID.BUFFER_POOL_MEQ_PER_MEQ_L;

  // The proximal reclaim threshold: below it the tubule reclaims everything presented to it.
  const threshold = reclaimThresholdMeqL(inputs);
  // Steady state, solved rather than integrated: serum sits at whichever constraint binds.
  // Retention drags it down by the retained daily load spread across the buffer pool; active
  // bicarbonaturia drags it to the proximal reclaim threshold and no further, because below
  // the threshold the tubule reclaims everything presented to it. Whichever floor is HIGHER
  // is the one the serum actually rests on.
  const retentionFloor = afterRetention;
  const spillageFloor = threshold;
  const serumBicarbonateMeqL = clamp(
    Math.min(retentionFloor, spillageFloor),
    ACID.MIN_BICARBONATE + 6,
    ACID.NORMAL_BICARBONATE + 4,
  );

  // Net acid excretion settles at the lesser of capacity and the acidaemically stimulated
  // demand — the same feedback that makes an acidotic patient excrete more acid than they eat.
  const deficitDrivenDemand = ACID.DAILY_ACID_LOAD + ACID.EXCRETION_STIMULATION_PER_DEFICIT * Math.max(0, ACID.NORMAL_BICARBONATE - serumBicarbonateMeqL);
  const netAcidExcretionMeqPerDay = Math.min(capacity, deficitDrivenDemand);

  /**
   * Urine pH, calibrated to four anchors:
   * - normal kidney at basal demand: ~6.3;
   * - distal RTA: the pump cannot lower luminal pH, so it stays ABOVE 7 however acidemic
   *   the patient — the defining, counterintuitive sign;
   * - proximal RTA: pump intact, so the urine CAN be acidified to ~5.5;
   * - type 4: the pump works but ammonium buffering is starved, so secreted H+ faces an
   *   unbuffered lumen and the pH crashes below 5.5 even though almost no net acid moves.
   */
  const supplyFraction = clamp(ammoniumBufferSupplyMeqPerDay(inputs) / ACID.MAX_NET_ACID_EXCRETION, 0, 1);
  const demandTotal =
    ACID.BASE_URINE_ACIDIFICATION + clamp((ACID.NORMAL_BICARBONATE - serumBicarbonateMeqL) / 14, 0, 1);
  const unbufferedAmplifier = 1 + ACID.UNBUFFERED_PH_AMPLIFIER * (1 - supplyFraction) ** 2;
  // Secreted H+ also needs the lumen-negative potential aldosterone provides; amiloride
  // blunts acidification by the same route it blunts potassium secretion.
  const hFactor =
    clamp(inputs.distalAcidSecretion, 0, 1) *
    (0.35 + 0.65 * clamp(effectiveDistalDrive(inputs) / ACID.BUFFER_HALF_ALDOSTERONE, 0, 1));
  // Carbonic-anhydrase inhibition floods the lumen with unreclaimed bicarbonate — the
  // classical ALKALINE urine of acetazolamide, opposite in sign to everything else here.
  const caAlkalinisation = (clamp(inputs.acetazolamideDose, 0, 100) / 100) * ACID.ACETAZOLAMIDE_PH_OFFSET;
  const effectiveWork = demandTotal * hFactor * unbufferedAmplifier;
  const urinePH = clamp(
    ACID.URINE_PH_ANCHOR - ACID.URINE_PH_SLOPE * effectiveWork + caAlkalinisation,
    ACID.URINE_PH_MIN,
    ACID.URINE_PH_MAX,
  );

  // Urine anion gap tracks the ammonium supply: abundant NH4+ (an unmeasured cation) makes
  // the gap clearly negative; a starved supply lets measured chloride dominate and the gap
  // turns positive — the lab signature that says the ACIDOSIS is the kidney's own fault.
  //
  // Ammonium excretion needs TWO things and is limited by whichever is scarcer: ammoniagenesis,
  // which aldosterone and potassium drive, and distal H+ secretion, which traps the diffused NH3
  // as NH4+ in the lumen. Keying the gap to aldosterone alone left it pinned at its floor of -25
  // in every state this module can reach — including distal (type 1) RTA, where impaired H+
  // secretion IS the lesion and a POSITIVE gap is the finding that identifies it. The readout was
  // inert in exactly the scenario it exists to report.
  const ammoniumSupply = Math.min(
    clamp(effectiveDistalDrive(inputs) / ACID.BUFFER_HALF_ALDOSTERONE, 0, 1),
    clamp(inputs.distalAcidSecretion, 0, 1),
  );
  const deficiency = 1 - ammoniumSupply;
  const urineAnionGapMeqL = clamp(
    -ACID.UAG_NEGATIVE_BASELINE + deficiency * ACID.UAG_DEFICIENCY_SWING,
    -ACID.UAG_NEGATIVE_BASELINE,
    ACID.UAG_POSITIVE_CEILING,
  );

  return {
    serumBicarbonateMeqL,
    urinePH,
    netAcidExcretionMeqPerDay,
    urineAnionGapMeqL,
  };
}

/**
 * Arterial pH expected for a given bicarbonate, assuming the respiratory compensation
 * Winter's formula describes (PaCO2 = 1.5 × HCO3- + 8) plugged into Henderson-Hasselbalch.
 * Appropriate compensation is part of the diagnosis of a metabolic acidosis, not an optional
 * extra — a patient whose CO2 does not follow this line has a second disorder.
 */
export function estimatedArterialPH(hco3MeqL: number): number {
  const expectedPaco2 = 1.5 * hco3MeqL + 8;
  return 6.1 + Math.log10(hco3MeqL / (0.03 * expectedPaco2));
}

/**
 * Serum potassium as read off the same drives the tubule runs on. Three terms:
 * - low distal drive (aldosterone or ENaC failure) retains K+ — type 4's signature;
 * - acidaemia shifts K+ out of cells, roughly the established rule that each 0.1 fall in
 *   pH raises serum K+ by ~0.3 mEq/L;
 * - the massive distal solute delivery of proximal RTA washes K+ out despite normal tone.
 *
 * A documented simplification: full potassium balance lives in the Potassium & Sodium-Water
 * module. This readout exists so the RTA presets show their characteristic K patterns.
 */
export function estimateSerumPotassium(inputs: RenalTubularInputs, hco3MeqL: number): number {
  const distalDrive = effectiveDistalDrive(inputs);
  const threshold = reclaimThresholdMeqL(inputs);
  const spillageFraction = clamp((ACID.NORMAL_BICARBONATE - threshold) / ACID.NORMAL_BICARBONATE, 0, 1);

  return clamp(
    ACID.K_BASELINE +
      ACID.K_RISE_PER_DRIVE_LOSS * clamp(1 - distalDrive, 0, 1) ** 1.15 +
      ACID.K_RISE_PER_PH_UNIT * (ACID.NORMAL_PH - estimatedArterialPH(hco3MeqL)) -
      ACID.K_FALL_WITH_DISTAL_DELIVERY * spillageFraction,
    1.5,
    7.5,
  );
}

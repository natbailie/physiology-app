/**
 * Periportal hepatocyte nitrogen disposal: dietary and endogenous protein nitrogen enters as
 * ammonia, and the five-enzyme urea cycle (CPS1 -> OTC -> ASS -> ASL -> arginase, split across
 * the mitochondrion and the cytosol) turns it into urea for renal excretion.
 *
 * The whole module is one balance: nitrogen load in (protein eaten plus protein broken down
 * under catabolic stress) against cycle capacity (liver function times residual enzyme
 * activity). When capacity covers the load, urea rises with protein and ammonia stays flat;
 * when it does not, ammonia climbs and urea paradoxically falls, because the failing step is
 * the one that makes urea. Hydration sets the plasma concentration the kidneys read.
 */
export interface UreaCycleInputs {
  /** Dietary protein supply, g/day. The nitrogen in it (~16% by mass) is the cycle's load. */
  proteinIntakeGPerDay: number;
  /** Functioning hepatocyte mass, %: 100 is a healthy liver, low values cirrhosis or failure. */
  liverFunctionPct: number;
  /** Daily water intake, L/day. Sets how concentrated the urea the kidneys must excrete reads. */
  hydrationLPerDay: number;
  /** Residual urea-cycle enzyme activity, 0-1: 1 is intact, low values an inherited defect
   * (OTC, ASS, ASL, arginase) or an acquired block such as valproate on NAGS/CPS1. */
  enzymeCapacity: number;
  /** Endogenous protein catabolism, 0-1: GI bleed, trauma, sepsis — protein arriving from
   * inside the patient rather than from a plate. */
  catabolicStress: number;
}

export interface UreaCycleInternalState {
  simTimeSeconds: number;
  /** Smoothed values so the readouts move like instruments, not teleports. */
  ammoniaUmolL: number;
  ureaMmolL: number;
  oroticAcidIndex: number;
}

export interface UreaCycleDerived {
  /** Plasma ammonia, umol/L — the toxic substrate the cycle exists to clear. */
  ammoniaUmolL: number;
  /** Plasma urea, mmol/L — the product. Falls in failure, which is the diagnostic trap. */
  ureaMmolL: number;
  /** Blood urea nitrogen, mg/dL — the units most wards report. */
  bunMgDl: number;
  /** Urinary nitrogen excretion, g/day — what the kidneys actually got rid of. */
  urineNitrogenGPerDay: number;
  /** Total nitrogen load presented to the liver, g/day — diet plus catabolism. */
  nitrogenLoadGPerDay: number;
  /** Carbamoyl-phosphate shunt to orotate, index 0-10: high only when CPS1 runs against a
   * distal block (OTC deficiency), the hyperammonaemia-with-orotic-aciduria signature. */
  oroticAcidIndex: number;
  /** Hepatic encephalopathy grade implied by the ammonia, 0-4. Coarse, as the mapping is. */
  encephalopathyGrade: number;
  /** Classification drawn under the cycle diagram. */
  ureaCycleState: string;
}

export interface UreaCycleSnapshot {
  state: UreaCycleInternalState;
  derived: UreaCycleDerived;
}

export interface UreaCycleHistoryPoint {
  t: number;
  ammonia: number;
  urea: number;
}

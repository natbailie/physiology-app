import { AQUEOUS } from './constants';
import { clamp } from '@/shared/lib/math';

/** The pressure the outflow paths relax toward: episcleral venous pressure plus production
 * divided by whatever conductance the angle still offers. A total closure does not make
 * pressure infinite — the uveoscleral leak, though small, is pressure-sensitive. */
export function iopTargetMmHg(params: {
  productionUlPerMin: number;
  effectiveFacilityUlPerMinPerMmhg: number;
}): number {
  const conductance = params.effectiveFacilityUlPerMinPerMmhg + AQUEOUS.UVEOSCLERAL_FACILITY_UL_PER_MIN_PER_MMHG;
  return AQUEOUS.EPISCLERAL_VENOUS_MMHG + Math.max(params.productionUlPerMin, 0) / Math.max(conductance, 1e-4);
}

/** Conventional outflow facility after disease and drugs: the meshwork resists when diseased,
 * closes appositionally when the iris piles into it, and is pulled open by ciliary muscle
 * contraction under pilocarpine. */
export function effectiveFacility(params: {
  trabecularOutflowFacility: number;
  angleClosureFraction: number;
  pilocarpineDosePct: number;
}): number {
  const base = AQUEOUS.FACILITY_REF_UL_PER_MIN_PER_MMHG * clamp(params.trabecularOutflowFacility, 0, 1.5);
  const openFraction = Math.pow(1 - clamp(params.angleClosureFraction, 0, 1), AQUEOUS.FACILITY_CLOSURE_EXPONENT);
  const pilocarpineGain = 1 + AQUEOUS.PILOCARPINE_FACILITY_GAIN * (clamp(params.pilocarpineDosePct, 0, 100) / 100);
  return base * openFraction * pilocarpineGain;
}

/** Production after acetazolamide: carbonic anhydrase drives the ciliary epithelium's pump. */
export function productionRate(aqueousProductionRate: number, acetazolamideDosePct: number): number {
  const block = AQUEOUS.ACETAZOLAMIDE_PRODUCTION_BLOCK * (clamp(acetazolamideDosePct, 0, 100) / 100);
  return AQUEOUS.PRODUCTION_UL_PER_MIN * clamp(aqueousProductionRate, 0, 2) * (1 - block);
}

/** Appositional closure the angle relaxes toward. Only a narrow angle has iris to pile into
 * it — a wide-angle eye can be dilated to mydriasis with barely a murmur from the pressure. */
export function closureTarget(angleWidthPct: number, mydriaticDosePct: number): number {
  const riskBase = clamp((AQUEOUS.ANGLE_WIDE_THRESHOLD_PCT - angleWidthPct) / AQUEOUS.ANGLE_WIDE_THRESHOLD_PCT, 0, 1);
  const provocation =
    AQUEOUS.MYDRIATIC_BASELINE_RISK + AQUEOUS.MYDRIATIC_PROVOCATION * (clamp(mydriaticDosePct, 0, 100) / 100);
  return clamp(riskBase * provocation * AQUEOUS.CLOSURE_TARGET_GAIN, 0, 1);
}

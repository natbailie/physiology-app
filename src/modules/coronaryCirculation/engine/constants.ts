/**
 * Calibrated constants. Baseline inputs must land on textbook values — the engine test asserts
 * them, so a constant that drifts fails loudly rather than quietly redefining "normal".
 *
 * Reference resting state: HR 72, systolic 122, diastolic 80, EDV 120 mL. That is a
 * rate-pressure product near 8 800, a diastolic fraction near three quarters, and a coronary
 * flow reserve of four to five — the numbers every textbook prints.
 */

/** The demand side: what the myocardium consumes. */
export const DEMAND = {
  /** Reference rate-pressure product, bpm × mmHg (72 × 122). */
  RPP_REF: 8800,
  /** Demand rises sub-linearly with the product — contractility and wall stress carry part of it. */
  RPP_EXP: 0.8,
  /** Laplace wall-stress exponent within the demand index. */
  STRESS_EXP: 0.3,
  /** Contractility exponent within the demand index. */
  CONTRACTILITY_EXP: 0.4,
  /** Reference end-diastolic volume, mL. */
  EDV_REF: 120,
  /** Reference systolic pressure, mmHg. */
  SBP_REF: 122,
  /** Sympathetic demand multiplier per unit of exertion drive. */
  EXERTION_GAIN: 0.6,
  /** Sympathetic rate rise per unit of exertion drive — the heart beats faster before any slider moves. */
  EXERTION_RATE_GAIN: 0.55,
  /** How much demand self-relieves when the myocardium is starved (stunning/hibernation). */
  ISCHAEMIA_RELIEF: 0.3,
} as const;

/** Cycle timing: the left ventricle is perfused almost entirely in diastole. */
export const TIMING = {
  SYSTOLE_BASE_S: 0.09,
  SYSTOLE_SQRT_RR_COEFF: 0.11,
  MIN_SYSTOLE_S: 0.12,
  MAX_SYSTOLE_S: 0.45,
  /** Fraction of a normal systole during which some coronary flow persists (right-heart share
   * and early-systolic inertia). The LV subendocardium sees none of it, which the closing
   * pressure term already charges against. */
  SYSTOLE_PATENCY_SHARE: 0.25,
} as const;

/** The supply side: what the coronaries can deliver. */
export const SUPPLY = {
  LVEDP_EDV_MIN_ML: 40,
  LVEDP_EDV_MAX_ML: 280,
  LVEDP_MIN_MMHG: 3,
  LVEDP_MAX_MMHG: 32,
  /** Zero-flow pressure at an empty ventricle, mmHg. Coronary flow ceases well above venous
   * pressure because the muscle itself squeezes the intramyocardial vessels shut. */
  PZF_BASE_MMHG: 18,
  /** How much of LV end-diastolic pressure adds to that closing pressure. */
  PZF_LVEDP_FRACTION: 0.5,
  /** Maximal vasodilatory conductance, flow units per mmHg of effective driving pressure.
   * Chosen with EFFECTIVE_DRIVING_REF so the healthy reserve lands at 4-5× rest. */
  MAX_CONDUCTANCE: 0.0976,
  /** Effective driving pressure (diastolic head weighted by cycle timing) at the calibrated
   * resting state, mmHg. */
  EFFECTIVE_DRIVING_REF_MMHG: 46.13,
  /** Healthy maximal flow as a multiple of resting need — the classic flow reserve. */
  MAX_RESERVE_FACTOR: 4.5,
  HAEMOGLOBIN_REF_G_PER_DL: 15,
  SAO2_REF_PCT: 98,
} as const;

/** The epicardial lesion: stenosis, tone, spasm, collaterals. */
export const STENOSIS = {
  /** Severity rises steeply as the residual lumen closes: (d/(1−d))^EXP on diameter narrowing. */
  SEVERITY_EXP: 2.2,
  /** Viscous coefficient scaling severity into the quadratic pressure-loss term. */
  B_COEF: 0.568,
  /** Small laminar coefficient in the lesion's pressure-loss curve, mmHg per flow unit. */
  A_COEF: 0.03,
  /** Severity can approach but never reach total occlusion from sliders alone. */
  SEVERITY_CAP: 0.985,
  /** Beyond this effective narrowing a lesion behaves as a territory-threatening occlusion. */
  TRANSMURAL_SEVERITY: 0.93,
  /** Transmural injury is declared when maximal delivery falls below this fraction of demand. */
  TRANSMURAL_FLOW_FRACTION: 0.5,
} as const;

/** Collaterals: a parallel path around the lesion, grown over weeks to months. */
export const COLLATERAL = {
  /** Flow fraction delivered at reference driving pressure, per unit collateral fraction. */
  CAPACITY: 1.2,
  /** Default resting collateralisation — minimal in hearts never challenged. */
  BASELINE_FRACTION: 0.05,
} as const;

/** Ischaemia: the gap between supply and demand and its consequences. */
export const ISCHAEMIA = {
  /** Fractional shortfall at which the balance stops counting as quiet. */
  GAP_ONSET: 0.04,
  /** Metabolic signalling lag — ischaemia deepens and recovers over seconds, not instantly. */
  SMOOTH_TAU_SECONDS: 4,
  /** Functional contractility lost per unit of ischaemia. */
  CONTRACTILITY_GAIN: 0.5,
  /** Necrosis accumulated per second of sustained transmural injury (fraction of territory). */
  NECROSIS_ACCUM_PER_SECOND: 0.0015,
  /** Glacial healing of established necrosis per second. */
  NECROSIS_HEAL_PER_SECOND: 0.00002,
  /** Necrosis above which the classification reads as completed infarction even if flow returns. */
  CLASSIFY_MIN_LOAD: 0.08,
} as const;

/** Drug effects at FULL dose (dose inputs are fractions of that range). */
export const DRUGS = {
  /** Preload (EDV) reduction at maximal nitrate effect. */
  NITRATE_PRELOAD_GAIN: 0.2,
  /** Constrictor tone relieved at maximal nitrate effect. */
  NITRATE_TONE_RELIEF: 0.8,
  /** Spasm burst relieved at maximal nitrate effect. */
  NITRATE_SPASM_RELIEF: 0.9,
  /** Diastolic pressure given up to venodilation at maximal nitrate effect. */
  NITRATE_HYPOTENSION: 0.15,
  /** Heart-rate reduction at maximal beta-blockade. */
  BETA_CHRONOTROPY: 0.35,
  /** Contractility reduction at maximal beta-blockade. */
  BETA_INOTROPY: 0.25,
} as const;

/** Event decay time constants, simulated seconds. Episodes last minutes: a stair climb does not
 * end while you are still on the stairs, and a spasm episode outlives its onset by several. */
export const EVENTS = {
  EXERTION_TAU_SECONDS: 300,
  SPASM_TAU_SECONDS: 600,
  /** An occlusive spasm: superimposed on plaque and tone it closes the vessel outright. */
  SPASM_BURST_SEVERITY: 0.75,
} as const;

export const SIMULATION = {
  TIME_SCALE: 4,
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 60,
  HISTORY_CAPACITY: 600,
} as const;

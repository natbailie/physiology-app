import type { Diuretic, ExtrarenalLoss, Infusion } from './types';

export const SECONDS_PER_DAY = 86400;

export const BASELINE = {
  /** A 70 kg adult: 42 L total body water, split ~1/3 ECF and ~2/3 ICF. That split is not
   * assumed here — it FALLS OUT of the sodium and potassium contents below. */
  TOTAL_BODY_WATER_L: 42,
  EXCHANGEABLE_SODIUM_MEQ: 1920,
  EXCHANGEABLE_POTASSIUM_MEQ: 3960,
  /** Only ~55 mEq of that potassium is in the ECF — about 1.4% of the total. Everything
   * confusing about potassium follows from this number being so small. */
  ECF_POTASSIUM_MEQ: 55,
  ECF_VOLUME_L: 13.71,
  SERUM_SODIUM_MEQ_L: 140,
  SERUM_POTASSIUM_MEQ_L: 4,
  SERUM_GLUCOSE_MG_DL: 90,
};

export const INTAKE = {
  SODIUM_MEQ_PER_DAY: 150,
  POTASSIUM_MEQ_PER_DAY: 70,
  WATER_L_PER_DAY: 2,
  /** Water produced by oxidative metabolism, L/day. */
  METABOLIC_WATER_L_PER_DAY: 0.3,
  /** Obligatory insensible loss through skin and breath, L/day — free water, no solute. */
  INSENSIBLE_LOSS_L_PER_DAY: 0.8,
  /** Potassium lost in stool, mEq/day — small, until diarrhoea makes it enormous. */
  STOOL_POTASSIUM_MEQ_PER_DAY: 10,
  /** As renal excretion fails, the colon takes over: in advanced CKD it can handle several
   * times its normal share. This adaptation is why potassium stays normal until the GFR is
   * severely reduced, and why it then rises steeply once the colon is also maxed out. */
  MAX_COLONIC_ADAPTATION: 4,
};

export const TRANSCELLULAR = {
  /** The ECF's normal share of total body potassium. */
  BASE_ECF_FRACTION: 55 / 3960,
  /** Minutes, not hours: the shift is by far the fastest thing in this module, which is why
   * it dominates acute potassium emergencies and why treating it does not fix the deficit. */
  TAU_SECONDS: 900,
  /** How strongly each driver moves the ECF fraction away from baseline. */
  INSULIN_GAIN: 0.35,
  BETA2_GAIN: 0.18,
  /** Per 0.1 unit of pH below 7.40, the ECF fraction rises by this proportion. */
  PH_GAIN_PER_UNIT: 2.4,
  /** Hypertonicity drags water — and potassium with it — out of cells. A modest effect per
   * mOsm, but it is why hyperglycaemia alone can raise serum potassium. */
  TONICITY_GAIN: 0.004,
  MIN_FRACTION_MULTIPLIER: 0.35,
  MAX_FRACTION_MULTIPLIER: 2.6,
};

export const ADH = {
  TAU_SECONDS: 1200,
  /** Osmotic threshold and saturation, mOsm/kg. Below ~280 ADH should be fully off. */
  OSMOTIC_THRESHOLD: 280,
  OSMOTIC_SATURATION: 296,
  /** Non-osmotic (baroreceptor) drive. Below ~10% volume depletion this is silent; beyond it,
   * it overrides osmolality entirely — which is why a hypovolaemic patient keeps retaining
   * water even as their sodium falls. Defending volume beats defending tonicity. */
  VOLUME_THRESHOLD_RATIO: 1,
  VOLUME_SATURATION_RATIO: 0.85,
  VOLUME_MAX_DRIVE: 1,
  /** SIADH: secretion fixed at a high level regardless of osmolality. */
  INAPPROPRIATE_FLOOR: 0.75,
  /** Achievable urine concentration range, mOsm/kg. */
  MIN_URINE_OSMOLALITY: 60,
  MAX_URINE_OSMOLALITY: 1200,
  /** Non-electrolyte solute (mostly urea) that must be excreted daily, mOsm. */
  UREA_LOAD_MOSM_PER_DAY: 300,
};

export const THIRST = {
  TAU_SECONDS: 3600,
  THRESHOLD_OSMOLALITY: 292,
  SATURATION_OSMOLALITY: 310,
  /** Thirst can drive an enormous intake — 10-15 L/day in untreated diabetes insipidus. It is
   * the only defence against a water DEFICIT, which is why DI is survivable with free access to
   * water and rapidly lethal without it. */
  MAX_L_PER_DAY: 12,
};

export const ALDOSTERONE = {
  /** Hours. The slowest actuator here, which is why it governs chronic balance rather than
   * acute emergencies. */
  TAU_SECONDS: 14400,
  VOLUME_HIGH_RATIO: 1.1,
  VOLUME_LOW_RATIO: 0.85,
  VOLUME_MIN_DRIVE: 0.35,
  VOLUME_MAX_DRIVE: 1.5,
  /** Potassium is the other direct stimulus — the adrenal senses it without any renin. */
  POTASSIUM_THRESHOLD: 3.5,
  POTASSIUM_SATURATION: 6,
  POTASSIUM_MAX_DRIVE: 0.8,
  MAX_LEVEL: 3,
};

export const RENAL = {
  /** Baseline renal sodium excretion, mEq/day — equal to intake at steady state. */
  SODIUM_BASE_MEQ_PER_DAY: 150,
  /** Pressure/volume natriuresis is steep: a small rise in ECF volume produces a large rise
   * in sodium excretion. Modelled as a power law on the ECF volume ratio. */
  VOLUME_NATRIURESIS_EXPONENT: 8,
  ALDOSTERONE_REABSORPTION_MIN: 0.5,
  ALDOSTERONE_REABSORPTION_MAX: 1.4,

  /** Baseline renal potassium excretion, mEq/day. */
  POTASSIUM_BASE_MEQ_PER_DAY: 60,
  /** Distal secretion is driven by three things multiplied together: aldosterone, distal flow
   * and the serum level itself. Knock out any one and excretion collapses. */
  POTASSIUM_SERUM_EXPONENT: 2,
  POTASSIUM_ALDOSTERONE_MIN: 0.2,
  POTASSIUM_ALDOSTERONE_MAX: 1.8,
  /** Distal flow scales secretion around the normal urine output, with diminishing returns:
   * washing more fluid past the secretory site helps, but the pump itself sets a ceiling. */
  BASELINE_URINE_L_PER_DAY: 1.8,
  POTASSIUM_FLOW_EXPONENT: 0.45,
  POTASSIUM_FLOW_MIN_FACTOR: 0.4,
  POTASSIUM_FLOW_MAX_FACTOR: 1.6,
  POTASSIUM_GFR_MIN_FACTOR: 0.15,
  /** Alkalosis promotes potassium secretion, acidosis suppresses it. */
  POTASSIUM_PH_LOW: 7.3,
  POTASSIUM_PH_HIGH: 7.5,
  POTASSIUM_PH_MIN_FACTOR: 0.7,
  POTASSIUM_PH_MAX_FACTOR: 1.35,
};

interface DiureticProfile {
  natriuresis: number;
  potassiumWasting: number;
  /** Loop diuretics wash out the medullary gradient, so urine cannot be concentrated. */
  maxUrineOsmolality: number;
  /** Thiazides block the cortical diluting segment, so urine cannot be maximally dilute —
   * the mechanism behind thiazide-induced hyponatraemia. */
  minUrineOsmolality: number;
}

export const DIURETICS: Record<Diuretic, DiureticProfile> = {
  none: { natriuresis: 1, potassiumWasting: 1, maxUrineOsmolality: 1200, minUrineOsmolality: 60 },
  loop: { natriuresis: 3, potassiumWasting: 2.2, maxUrineOsmolality: 320, minUrineOsmolality: 60 },
  thiazide: { natriuresis: 1.8, potassiumWasting: 1.7, maxUrineOsmolality: 1200, minUrineOsmolality: 180 },
  // Blocks the aldosterone-driven secretory step, so potassium is retained rather than wasted.
  potassiumSparing: { natriuresis: 1.2, potassiumWasting: 0.35, maxUrineOsmolality: 1200, minUrineOsmolality: 60 },
};

interface LossProfile {
  volumeLPerDay: number;
  sodiumMeqPerL: number;
  potassiumMeqPerL: number;
}

export const EXTRARENAL_LOSSES: Record<ExtrarenalLoss, LossProfile> = {
  none: { volumeLPerDay: 0, sodiumMeqPerL: 0, potassiumMeqPerL: 0 },
  // Gastric fluid: sodium- and chloride-rich, modestly potassium-containing. The alkalosis it
  // causes then drives further RENAL potassium loss — usually the larger of the two.
  vomiting: { volumeLPerDay: 1.5, sodiumMeqPerL: 60, potassiumMeqPerL: 10 },
  // Stool is far richer in potassium than gastric fluid, and loses bicarbonate rather than acid.
  diarrhoea: { volumeLPerDay: 2, sodiumMeqPerL: 60, potassiumMeqPerL: 35 },
  // Sweat is HYPOTONIC, so heavy sweating loses proportionally more water than sodium and
  // pushes serum sodium up, not down.
  sweating: { volumeLPerDay: 1.5, sodiumMeqPerL: 30, potassiumMeqPerL: 5 },
};

interface InfusionProfile {
  volumeLPerDay: number;
  sodiumMeqPerL: number;
  potassiumMeqPerL: number;
}

export const INFUSIONS: Record<Infusion, InfusionProfile> = {
  none: { volumeLPerDay: 0, sodiumMeqPerL: 0, potassiumMeqPerL: 0 },
  // Isotonic: expands the ECF and stays there. Does almost nothing to serum sodium.
  normalSaline: { volumeLPerDay: 2, sodiumMeqPerL: 154, potassiumMeqPerL: 0 },
  // Hypertonic: raises serum sodium fast, which is the point and also the danger.
  hypertonic3: { volumeLPerDay: 1, sodiumMeqPerL: 513, potassiumMeqPerL: 0 },
  // Once the dextrose is metabolised this is pure water, distributed across TOTAL body water.
  dextrose5: { volumeLPerDay: 2, sodiumMeqPerL: 0, potassiumMeqPerL: 0 },
  potassiumReplacement: { volumeLPerDay: 1, sodiumMeqPerL: 0, potassiumMeqPerL: 60 },
};

export const CORRECTION = {
  /** Safe rate of rise for serum sodium, mEq/L/day. Exceeding it in a chronically
   * hyponatraemic patient risks osmotic demyelination — the treatment causing the injury. */
  SAFE_SODIUM_RATE_MEQ_L_PER_DAY: 8,
  DANGEROUS_SODIUM_RATE_MEQ_L_PER_DAY: 16,
  /** Below this sodium, the brain has had time to adapt and is vulnerable to fast correction. */
  CHRONIC_HYPONATREMIA_THRESHOLD: 125,
  RATE_TAU_SECONDS: 21600,
  /** How fast the brain re-accumulates or sheds organic osmolytes — a day and a half. This lag
   * is the whole problem: it is what makes chronic hyponatraemia tolerable and its correction
   * dangerous, and it is why the risk depends on how long the sodium has been low rather than
   * on what it reads right now. */
  BRAIN_ADAPTATION_TAU_SECONDS: 129600,
};

export const CLASSIFICATION = {
  HYPOTONIC_OSMOLALITY: 275,
  HYPERTONIC_OSMOLALITY: 295,
  HYPOVOLEMIC_RATIO: 0.92,
  HYPERVOLEMIC_RATIO: 1.08,
  /** Hyperglycaemia correction: serum sodium falls ~1.6 mEq/L per 100 mg/dL of glucose. */
  GLUCOSE_CORRECTION_PER_100: 1.6,
  /** The glucose level below which no water is displaced between compartments, mg/dL.
   *
   * The Edelman relation is an empirical fit to normoglycaemic people, so it already contains
   * whatever normal glucose does to the compartments. Only glucose ABOVE this reference counts
   * as an extra effective osmole. The correction above uses the same reference, which is what
   * keeps the two from double-counting: the shift moves the sodium down, the correction moves
   * the same displacement back up, and neither is applied twice. */
  GLUCOSE_OSMOTIC_REFERENCE_MG_DL: 100,
};

export const LIMITS = {
  MIN_SODIUM_MEQ: 400,
  MAX_SODIUM_MEQ: 5000,
  MIN_POTASSIUM_MEQ: 800,
  MAX_POTASSIUM_MEQ: 7000,
  MIN_ECF_POTASSIUM_MEQ: 8,
  MIN_TOTAL_BODY_WATER_L: 18,
  MAX_TOTAL_BODY_WATER_L: 85,
};

export const ELECTROLYTE_SIMULATION = {
  MAX_DT_SECONDS: 0.05,
  RENDER_INTERVAL_MS: 33,
  HISTORY_CAPACITY: 260,
  /** One real second is one simulated hour. Renal correction of a sodium disorder takes days,
   * so at this scale a full correction plays out over roughly a minute. */
  TIME_SCALE: 3600,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 10000,
};

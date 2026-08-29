/**
 * Calibrated so a healthy adult absorbing a mixed meal lands on textbook numbers: a bile salt
 * pool near 4 g cycling several times a day with under a gram lost, stool water below 200 mL/day,
 * and micronutrient stores replete. The engine test asserts the baselines — a constant that
 * drifts fails loudly.
 */

export const BILE = {
  /** Total body bile salt pool at rest, g (textbook 3-5). */
  POOL_REF_G: 4,
  /** Enterohepatic cycles per day: roughly two per meal across three meals. */
  CYCLES_PER_DAY: 7,
  /** Maximal hepatic synthesis, g/day — several-fold above basal demand, reached when an
   * ileum spills salts. The settling point of supply chasing loss IS short-bowel physiology. */
  SYNTHESIS_MAX_G_PER_DAY: 4.5,
  /** Extra synthetic drive per unit of pool depletion. */
  SYNTHESIS_CHASE_GAIN: 0.35,
  /** Pool size at which emulsification of a reference meal starts to suffer. */
  EMULSIFY_ADEQUACY_BASE_G: 1,
  /** Grams of pool needed per gram of meal fat on top of the base. */
  EMULSIFY_ADEQUACY_PER_G_FAT: 0.045,
} as const;

export const MEAL = {
  /** Pancreatic lipase has a huge reserve: steatorrhoea appears only below ~10% capacity. */
  ENZYME_STEATORRHOEA_RESERVE: 10,
  /** Luminal transit time constant for a mixed meal through small bowel plus colon, hours. */
  TRANSIT_TAU_HOURS: 7,
  /** Exponential sensitivity of absorption to hurried transit. */
  TRANSIT_EXPONENT: 0.45,
  /** Proximal surface-area exponent for brush-border dependent uptake. */
  SURFACE_EXPONENT: 0.6,
} as const;

export const WATER = {
  STOOL_BASELINE_ML_PER_DAY: 120,
  DIARRHOEA_THRESHOLD_ML_PER_DAY: 200,
  SEVERE_THRESHOLD_ML_PER_DAY: 800,
  /** Volume already handled day-to-day before anything pathological is added. */
  PRESENTED_BASE_ML_PER_DAY: 1500,
  /** Water held by unabsorbed lactose — non-salvageable by osmosis. */
  OSMOTIC_ML_PER_G_LACTOSE: 11,
  /** Hydroxylated fatty acids are secretagogues: ml of water per gram of unabsorbed fat. */
  FAECAL_FAT_ML_PER_G: 5,
  /** Spilt bile salts irritate the colon into secreting — cholerrhoea. */
  CHOLERHOEIC_ML_PER_G_BILE: 22,
  /** Active secretion at full drive, ml/day — a VIPoma-lite rather than full cholera. */
  SECRETORY_MAX_ML_PER_DAY: 2200,
  /** Maximal colonic salvage in health — the gut's last reserve before liquid stool. */
  COLON_SALVAGE_MAX_ML_PER_DAY: 2800,
  /** How strongly each secretagogue cripples colonic reclamation, per gram or at full drive. */
  BILE_IMPAIRMENT_PER_G: 0.25,
  FAT_IMPAIRMENT_PER_G: 0.02,
  DRIVE_IMPAIRMENT_AT_FULL: 0.6,
  GAP_OSMOTIC_THRESHOLD_MMOL_KG: 100,
} as const;

export const MICRONUTRIENT = {
  /** Body stores shown as a fraction of the replete value. */
  DEFICIENT_FRACTION: 0.35,
  /** B12 reserves last years; compressed here so deficiency develops over simulated weeks. */
  B12_DRAIN_RATE_PER_DAY: 1 / 12,
  IRON_TURNOVER_PER_DAY: 0.08,
  /** Maximal daily iron uptake through intact proximal mucosa, store-fraction units. */
  IRON_MAX_UPTAKE_PER_DAY: 0.13,
} as const;

/** Nutrition drifts toward what the diet actually delivers after malabsorption. */
export const NUTRITION = {
  TAU_DAYS: 25,
} as const;

export const SIMULATION = {
  TIME_SCALE: 3000,
  MAX_DT_SECONDS: 30,
  RENDER_INTERVAL_MS: 80,
  HISTORY_CAPACITY: 600,
} as const;

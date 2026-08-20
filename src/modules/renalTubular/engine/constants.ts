export const PLASMA = {
  // Osmoreceptors defend plasma osmolality within a remarkably tight band around this value.
  SETPOINT_MOSM: 287,
  MIN_MOSM: 240,
  MAX_MOSM: 360,
  BASELINE_MOSM: 290,
  // mOsm/kg change per (net free-water imbalance unit × second).
  FLUX_GAIN: 0.02,
  // Water intake at 100% delivers this much free water per unit time. Calibrated so the
  // baseline steady state sits at a mid-range ADH level with moderately concentrated urine,
  // rather than at the near-zero ADH of someone drinking to excess.
  INTAKE_SCALE: 0.35,
};

export const ADH = {
  // Osmoreceptors are essentially silent below this and drive ADH maximally above it — a
  // very steep relationship, which is what keeps plasma osmolality so tightly controlled.
  THRESHOLD_MOSM: 275,
  SATURATION_MOSM: 300,
  TAU_SECONDS: 45,
  EXOGENOUS_SCALE: 100,
};

export const TUBULE = {
  FILTRATE_OSMOLALITY: 290,
  // The proximal tubule reabsorbs ~65% of filtered volume ISO-OSMOTICALLY: solute and water
  // leave together, so a lot of volume disappears while osmolality barely changes.
  PROXIMAL_REABSORPTION_FRACTION: 0.65,
  // Descending limb: water-permeable, solute-impermeable. Water is drawn out into the
  // hypertonic medulla, so tubular fluid CONCENTRATES toward the interstitial osmolality.
  DESCENDING_MAX_OSMOLALITY: 1200,
  DESCENDING_WATER_REMOVAL_FRACTION: 0.5,
  // Thick ascending limb: the "diluting segment" — NaCl is pumped out via NKCC2 with NO water
  // able to follow, so fluid leaving it is HYPOTONIC regardless of how concentrated it was.
  ASCENDING_MIN_OSMOLALITY: 100,
  ASCENDING_DILUTION_STRENGTH: 0.85,
  // Distal convoluted tubule: further dilution via the thiazide-sensitive NaCl cotransporter.
  DISTAL_DILUTION_OSMOLALITY: 100,
  DISTAL_DILUTION_STRENGTH: 0.35,
  DISTAL_REABSORPTION_FRACTION: 0.1,
  // Collecting duct: the ADH-controlled final step. With no ADH the duct stays water-tight
  // and dilute urine pours out; with maximal ADH water equilibrates with the medulla.
  CD_MIN_URINE_OSMOLALITY: 60,
  CD_MAX_WATER_REABSORPTION: 0.92,
};

export const MEDULLA = {
  // The gradient is built by thick ascending limb pumping — countercurrent multiplication —
  // so anything that blocks that pumping washes it out over time.
  BUILD_TAU_SECONDS: 120,
  MIN_STRENGTH: 0.08,
  // High tubular flow also degrades the gradient (washout), which is part of why loop
  // diuretics are so effective at preventing urinary concentration.
  FLOW_WASHOUT_GAIN: 0.35,
};

export const TGF = {
  // Distal NaCl delivery above this fraction signals the macula densa to constrict the
  // afferent arteriole, protecting the nephron from over-filtration.
  SETPOINT_DELIVERY: 0.08,
  SENSITIVITY: 0.12,
  MAX_GFR_REDUCTION: 0.4,
  TAU_SECONDS: 30,
};

export const URINE = {
  MIN_FLOW_ML_PER_MIN: 0.2,
  MAX_FLOW_ML_PER_MIN: 25,
};

export const RENAL_TUBULAR_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
};

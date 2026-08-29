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
  MIN_FLOW_FRACTION: 0.02,
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
  // Osmotic diuresis: non-reabsorbable solute obligates water. Full-dose mannitol keeps
  // roughly a third again as much filtrate in the lumen; glucosuria from SGLT2 blockade is
  // milder because the filtered glucose load is smaller.
  OSMOTIC_WATER_HOLD: 0.35,
  SGLT2_WATER_HOLD: 0.12,
  // Acute tubular necrosis: reclamation fails everywhere at once — water spills through and
  // the urine drifts to isosthenuria (~plasma osmolality) however much ADH circulates.
  ATN_WATER_SPILL: 0.9,
  ATN_ISOSTHENURIA: 0.85,
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

/**
 * The acid arm: daily net acid excretion, bicarbonate reclaim and the urine pH they leave
 * behind. Calibrated to textbook baselines — a normal kidney holds serum bicarbonate near
 * 24 mEq/L while excreting ~70 mEq of acid a day at a urine pH around 6.
 */
export const ACID = {
  // Typical Western diet net acid load the kidney must excrete every day.
  DAILY_ACID_LOAD: 70,
  // Filtered bicarbonate concentration, mEq/L — the load the proximal tubule must reclaim.
  FILTRATE_HCO3_MEQ_L: 24,
  // Fraction of the filtered bicarbonate load a healthy proximal tubule reclaims (~85% of
  // the filtered load; the rest is titrated away distally).
  PROXIMAL_RECLAIM_FRACTION: 0.85,
  // Maximum fraction of proximal HCO3 reclaim that full-dose acetazolamide removes —
  // substantial, since the drug abolishes catalysed CO2 hydration, but not everything.
  ACETAZOLAMIDE_MAX_BLOCK: 0.45,
  // Aldosterone tone at which ammoniagenesis/buffer supply is half-maximal.
  BUFFER_HALF_ALDOSTERONE: 0.9,
  // Ceiling on net acid excretion with everything working — several times the basal load,
  // which is the headroom an acidotic patient needs.
  MAX_NET_ACID_EXCRETION: 240,
  // Extra acid excreted per mEq/L of bicarbonate deficit below normal (the acidaemic drive).
  EXCRETION_STIMULATION_PER_DEFICIT: 4,
  // Fraction of bicarbonate spilling past the proximal threshold that reaches the final
  // urine — the rest is reclaimed further downstream.
  SPILLAGE_URINARY_FRACTION: 0.65,
  // mEq of retained/spilled acid per mEq/L fall in serum bicarbonate — ECF, ICF and bone
  // buffers all participate once retention persists beyond hours.
  BUFFER_POOL_MEQ_PER_MEQ_L: 5,
  // Basal acidification work even at normal serum bicarbonate — the kidney always excretes
  // SOMETHING, because the diet always supplies an acid load.
  BASE_URINE_ACIDIFICATION: 1.48,
  // Secreted H+ facing little ammonium buffer drops the luminal pH steeply while carrying
  // almost no acid — the type 4 paradox of acidic urine with a positive anion gap.
  UNBUFFERED_PH_AMPLIFIER: 3.0,
  ACETAZOLAMIDE_PH_OFFSET: 1.5,
  // Urine pH = ANCHOR − SLOPE × effective acidification work, clamped to the physical range.
  URINE_PH_ANCHOR: 7.74,
  URINE_PH_SLOPE: 0.87,
  URINE_PH_MAX: 7.8,
  URINE_PH_MIN: 4.9,
  NORMAL_BICARBONATE: 24,
  MIN_BICARBONATE: 4,
  // A healthy kidney's urine anion gap is clearly negative (unmeasured NH4+ dominates);
  // a starved ammonium supply swings it positive — the lab fingerprint of type 4 RTA.
  UAG_NEGATIVE_BASELINE: 25,
  UAG_DEFICIENCY_SWING: 55,
  UAG_POSITIVE_CEILING: 50,
  // Serum potassium response, mEq/L per unit of distal-drive loss and per pH unit of
  // acidaemia. Documented simplification: read off the same drives rather than a full
  // balance model, which the Potassium & Sodium-Water module already owns.
  K_BASELINE: 4.0,
  NORMAL_PH: 7.4,
  K_RISE_PER_DRIVE_LOSS: 2.0,
  K_RISE_PER_PH_UNIT: 3.2,
  K_FALL_WITH_DISTAL_DELIVERY: 1.6,
  // Time constant for serum bicarbonate drifting toward its new steady state — hours, not
  // seconds: buffer pools have to be emptied first.
  HCO3_TAU_SECONDS: 3600,
};

/**
 * Clearance panel constants: creatinine and PAH behaviour, and how much filtered sodium each
 * segment reclaims when intact versus injured.
 */
export const CLEARANCE = {
  FILTRATE_NA_MEQ_L: 140,
  // Creatinine adds ~10% via proximal secretion — why CrCl slightly overestimates GFR.
  CREATININE_SECRETION_FRACTION: 0.1,
  // The filtration fraction a healthy kidney maintains; renal plasma flow is read back off
  // it (PAH clearance measured this relationship experimentally).
  BASELINE_FILTRATION_FRACTION: 0.19,
  // Sodium reclaimed per segment when intact (fractions of what remains arriving).
  PROXIMAL_NA_RECLAIM: 0.65,
  LOOP_NA_RECLAIM: 0.75,
  DISTAL_NA_RECLAIM: 0.72,
  CD_NA_RECLAIM: 0.94,
  // How much of each segment's reclaiming dies with full tubular injury (ATN). The proximal
  // tubule is the most metabolically vulnerable, hence the deepest damage there.
  INJURY_PROXIMAL_DAMAGE: 0.85,
  INJURY_LOOP_DAMAGE: 0.7,
  INJURY_DISTAL_DAMAGE: 0.55,
  // Creatinine production calibrated so a normal creatinine clearance (~110 mL/min with
  // secretion) holds serum creatinine at 1.0 mg/dL.
  CREATININE_PRODUCTION_MG_MIN: 1.1,
  MIN_CREATININE_MG_DL: 0.2,
  MAX_CREATININE_MG_DL: 20,
  // Creatinine equilibrates over many hours — the reason today's creatinine reflects
  // YESTERDAY's kidney.
  CREATININE_TAU_SECONDS: 10800,
};

export const RENAL_TUBULAR_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 6,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 3600,
};

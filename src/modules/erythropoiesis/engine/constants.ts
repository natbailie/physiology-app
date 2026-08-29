export const HEMOGLOBIN = {
  NORMAL_G_DL: 15,
  MIN_G_DL: 3,
  MAX_G_DL: 22,
  // Anemia thresholds used for classification.
  ANEMIA_THRESHOLD_G_DL: 12,
  POLYCYTHEMIA_THRESHOLD_G_DL: 18,
  // Hct ≈ 3 × Hb, the familiar bedside rule of thumb.
  HEMATOCRIT_RATIO: 3,
  // g/dL change per (net flux unit × second) — slow, because a red cell lives ~120 days and
  // the whole loop turns over on a timescale of weeks.
  FLUX_GAIN: 0.0012,
};

export const EPO = {
  // Renal interstitial cells sense oxygen through HIF. The response is steep: EPO rises
  // exponentially as haemoglobin falls, which is why even mild anemia produces a large signal.
  // Set ABOVE the normal haemoglobin on purpose: a healthy person still makes some EPO, and
  // most of their baseline erythropoiesis depends on it. If the threshold sat at or below
  // normal, EPO would be zero at the setpoint and the loop would have no gain there — a
  // failing kidney would then produce no anemia at all, which is plainly wrong.
  HYPOXIA_THRESHOLD_G_DL: 18.5,
  HYPOXIA_SATURATION_G_DL: 6,
  // Slower than a reflex, faster than the marrow it drives.
  TAU_SECONDS: 40,
};

export const MARROW = {
  // Only a small floor of erythropoiesis is EPO-INDEPENDENT; the great majority of even
  // baseline production is EPO-driven, which is what makes renal failure anemic.
  BASAL_OUTPUT: 0.08,
  EPO_GAIN: 0.85,
  // The marrow takes days to ramp up, which is why the reticulocyte response to acute blood
  // loss lags by roughly three to five days rather than appearing immediately.
  TAU_SECONDS: 120,
  MAX_OUTPUT: 1.4,
};

export const SUBSTRATE = {
  // Iron gates HAEM synthesis. Starved of it, precursors undergo extra divisions before
  // reaching their haemoglobin threshold, ending up SMALL — hence microcytic.
  IRON_SATURATION_PCT: 100,
  // B12 and folate gate DNA synthesis. Starved of them, the nucleus cannot keep pace with a
  // cytoplasm that matures normally, so the cell is released LARGE — hence macrocytic.
  B12_FOLATE_SATURATION_PCT: 100,
  NORMAL_MCV_FL: 90,
  MIN_MCV_FL: 62,
  MAX_MCV_FL: 122,
  // How far each deficiency shifts the size of newly produced cells.
  IRON_MCV_SHIFT_FL: 26,
  B12_MCV_SHIFT_FL: 30,
  // Circulating MCV lags production as the old population is replaced.
  CIRCULATING_MCV_TAU_SECONDS: 200,
};

export const IRON_STORES = {
  NORMAL_FERRITIN_NG_ML: 120,
  MAX_FERRITIN_NG_ML: 400,
  // Chronic bleeding drains stores; this is why iron deficiency is the expected consequence
  // of a slow gastrointestinal bleed rather than an incidental finding.
  DEPLETION_PER_SECOND: 0.00035,
  REPLETION_PER_SECOND: 0.00018,
};

/** Hepcidin — the hepatic hormone that degrades ferroportin, the only iron exporter in the
 * body. Everything about the iron studies panel falls out of this one number: stores raise
 * it, IL-6 raises it hard (the anaemia of chronic disease), erythropoietic drive and HFE-type
 * sensing failure suppress it (the overload syndromes). */
export const HEPCIDIN = {
  /** Baseline production at replete stores and no inflammation. */
  NORMAL_FRACTION: 1,
  TAU_SECONDS: 3600,
  /** Store drive: from ~0.25 when empty to ~1.75 when overloaded. */
  STORE_DRIVE_MIN: 0.25,
  STORE_DRIVE_MAX: 1.75,
  /** IL-6 can multiply hepcidin several-fold at maximal inflammation. */
  INFLAMMATION_MAX_MULTIPLIER: 4,
  /** Erythroferrone-like suppression by a marrow driving beyond its supply — strong enough
   * that thalassaemia-style drive keeps hepcidin near-undetectable despite overload. */
  DRIVE_SUPPRESSION_EXPONENT: 1.3,
  /** A sensing defect (HFE) caps how high stores can push hepcidin. */
  SENSING_MIN_MULTIPLIER: 0.08,
  /** Ferroportin gate: 1 at normal hepcidin; rises slightly when hepcidin is low, collapses
   * when it is high. This gate sits between BOTH iron sources — gut uptake and macrophage
   * release — and the marrow downstream of it, which is why ACD starves a replete patient. */
  GATE_LOW_HEPCIDIN_GAIN: 0.42,
  GATE_MAX: 1.45,
  GATE_MIN: 0.05,
} as const;

/** The serum iron studies panel, all derived rather than authored: every row moves because
 * hepcidin moved, which is why the four classic patterns separate without being labelled. */
export const IRON_PANEL = {
  SERUM_IRON_BASE_UG_DL: 95,
  TIBC_BASE_UG_DL: 340,
  SATURATION_DEFICIENT_PCT: 16,
  SATURATION_NORMAL_LOW_PCT: 22,
  SATURATION_OVERLOAD_PCT: 45,
  /** Transferrin up-regulation as stores empty (IDA), capped near this multiple. */
  TIBC_DEFICIENCY_MAX_MULTIPLE: 1.35,
  /** Transferrin falls as a negative acute-phase reactant at full inflammation. */
  TIBC_INFLAMMATION_MIN_MULTIPLE: 0.72,
  /** Ferritin is ALSO an acute-phase reactant — the trap that makes a normal ferritin lie. */
  FERRITIN_INFLAMMATION_MAX_MULTIPLE: 3.2,
} as const;

export const RED_CELL_KINETICS = {
  // Normal senescent loss — a red cell lives about 120 days.
  BASAL_LOSS: 0.32,
  HEMOLYSIS_GAIN: 1.3,
  BLOOD_LOSS_GAIN: 0.75,
  // Production capacity, scaled so basal output exactly replaces basal loss at a normal Hb.
  PRODUCTION_GAIN: 1,
};

export const RETICULOCYTE = {
  // The index is production relative to normal, corrected for the degree of anemia. Below
  // about 2 the marrow is not keeping up (hypoproliferative); above it, the marrow is
  // responding appropriately and the problem is destruction or loss.
  ADEQUATE_RESPONSE_THRESHOLD: 2,
  // Normalised so a healthy marrow at a normal haemoglobin reads exactly 1.0, matching the
  // clinical production index where >2 is an adequate response and <2 is hypoproliferative.
  SCALE: 1,
  MAX: 12,
};

export const OXYGEN_DELIVERY = {
  // DO2 = Hb × 1.34 mL O2/g × SaO2 × cardiac output.
  O2_CARRYING_CAPACITY_ML_PER_G: 1.34,
  CARDIAC_OUTPUT_DL_PER_MIN: 50,
  NORMAL_SAO2: 0.98,
};

export const ERYTHRO_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  // Erythropoiesis runs over weeks, so time is heavily compressed.
  TIME_SCALE: 8,
  /** Simulated seconds of settling applied before the first frame, so the module opens on
   * normal physiology instead of relaxing into it while the learner watches. Measured as
   * the time this module's opening transient takes to decay. */
  SETTLE_SECONDS: 900,
};

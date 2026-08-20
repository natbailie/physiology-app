export interface GiInputs {
  /** Fat content of the queued meal, grams (0-100) — dominant CCK/secretin stimulus and the
   * strongest brake on gastric emptying */
  mealFatGrams: number;
  /** Protein content of the queued meal, grams (0-100) — a direct gastrin secretagogue */
  mealProteinGrams: number;
  /** Carbohydrate content of the queued meal, grams (0-150) — dominant GIP/GLP-1 stimulus */
  mealCarbGrams: number;
  /** Total meal volume, mL (0-1000) — gastric distension drives gastrin independent of content */
  mealVolumeML: number;
  /** Proton pump inhibitor dose, % of a standard therapeutic dose (0-150) — blocks the
   * H+/K+-ATPase itself, the shared final pathway downstream of every secretagogue */
  ppiDose: number;
  /** H2-receptor blocker dose, % of a standard dose (0-150) — blocks only the
   * histamine-mediated contribution to acid secretion, leaving ACh/gastrin partially intact */
  h2BlockerDose: number;
  /** Vagal (parasympathetic) tone driving ACh release to the stomach, % of baseline (0-200) */
  vagalTone: number;
  /** Autonomous, feedback-independent gastrin secretion — models a gastrin-secreting tumor
   * (Zollinger-Ellison syndrome) (0-100) */
  autonomousGastrinSecretion: number;
}

export interface GiState {
  simTimeSeconds: number;
  /** Gastric pH (plant variable), 1-7 */
  gastricPH: number;
  /** Fraction of the queued meal still in the stomach, 0..1 (1 = just eaten, 0 = empty) —
   * drained by gastric emptying, refilled by the "Eat meal" perturbation */
  gastricVolumeFraction: number;
  /** Duodenal pH (plant variable), 2-8 — falls as acidic chyme empties in, rises as
   * secretin-driven pancreatic bicarbonate neutralizes it */
  duodenalPH: number;
  /** Smoothed G-cell gastrin drive, 0..1 */
  gastrinDrive: number;
  /** Smoothed I-cell CCK drive, 0..1 */
  cckDrive: number;
  /** Smoothed S-cell secretin drive, 0..1 */
  secretinDrive: number;
  /** Smoothed combined K/L-cell GIP+GLP-1 (incretin) drive, 0..1 */
  gipGlp1Drive: number;
  /** Smoothed D-cell somatostatin drive, 0..1 — rises as gastric pH falls, braking gastrin
   * (and therefore acid secretion) once the stomach is sufficiently acidified */
  somatostatinDrive: number;
  /** Migrating motor complex phase, 0..1, cycling only while the stomach is essentially
   * empty — the interdigestive "housekeeper" sweep */
  motilinPhase: number;
}

export interface GiDerived {
  gastricPH: number;
  duodenalPH: number;
  gastricVolumeFraction: number;
  /** Parietal cell acid output, normalized % where 100 = a strongly stimulated peak */
  gastricAcidOutput: number;
  /** Current gastric emptying rate, normalized % of the unstimulated baseline rate */
  gastricEmptyingRate: number;
  gastrinDrive: number;
  cckDrive: number;
  secretinDrive: number;
  gipGlp1Drive: number;
  somatostatinDrive: number;
  motilinPhase: number;
  isFasting: boolean;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  mealFatGrams: number;
  mealProteinGrams: number;
  mealCarbGrams: number;
  mealVolumeML: number;
  ppiDose: number;
  h2BlockerDose: number;
  vagalTone: number;
  autonomousGastrinSecretion: number;
}

export interface GiSnapshot {
  state: GiState;
  derived: GiDerived;
}

export interface GiHistoryPoint {
  t: number;
  gastricPH: number;
  duodenalPH: number;
  gastrinDrive: number;
}

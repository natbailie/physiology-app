export type StoolClassification =
  | 'no diarrhoea'
  | 'osmotic diarrhoea'
  | 'secretory diarrhoea'
  | 'cholerrhoeic diarrhoea'
  | 'steatorrhoea'
  | 'mixed malabsorption';

export type DigestionState_Classification =
  | 'balanced absorption'
  | 'osmotic diarrhoea'
  | 'secretory diarrhoea'
  | 'bile salt diarrhoea'
  | 'steatorrhoea (pancreatic)'
  | 'steatorrhoea (biliary)'
  | 'steatorrhoea (mucosal)'
  | 'short bowel pattern'
  | 'micronutrient depletion';

export interface DigestionInputs {
  /** Fat content of the habitual meal, g (0-80). Sets how much pool emulsification demands. */
  mealFatGrams: number;
  /** Lactose content of the habitual meal, g (0-50). A glass of milk is about 12. */
  mealLactoseGrams: number;
  /** Pancreatic enzyme capacity, percent of normal (0-100). Lipase is the scarce one. */
  pancreaticEnzymeCapacityPct: number;
  /** Hepatic bile salt synthesis capacity, percent of normal ceiling (0-100). */
  hepaticSynthesisCapacityPct: number;
  /** Fraction of cycling bile salts reabsorbed by the terminal ileum (0-1). */
  ilealReabsorptionFraction: number;
  /** Working mucosal surface area, percent of normal (0-100) — villous atrophy, resection. */
  mucosalSurfaceAreaPct: number;
  /** Terminal ileal uptake function, percent of normal (0-100): B12 receptor sites and
   * bile salt transport are both here. Low models Crohn or resection. */
  terminalIlealFunctionPct: number;
  /** Brush-border lactase activity, percent of the paediatric reference (0-100).
   * Most adults worldwide sit near 15. */
  lactaseActivityPct: number;
  /** Colonic salvage capacity, percent of normal (0-100). */
  colonicFunctionPct: number;
  /** Active secretory drive — VIPoma, cholera-toxin-like (0-100). Secretes regardless of eating. */
  secretoryDrivePct: number;
  /** Transit speed multiplier (0.5-3). Hurry costs contact time. */
  transitMultiplier: number;
}

/** Luminal nutrient load from a recent meal, normalised to one standard mixed meal. */
export interface DigestionInternalState {
  simTimeSeconds: number;
  /** Total body bile salt pool, g. */
  bileSaltPoolG: number;
  /** B12 body stores as fraction of replete (0-1). Drains over simulated weeks without uptake. */
  b12StoreFraction: number;
  /** Iron stores as fraction of replete (0-1). Regulated by mucosal uptake against turnover. */
  ironStoreFraction: number;
  /** Overall nutritional state (0-1); drifts toward what absorption actually delivers. */
  nutritionIndex: number;
  /** Luminal meal load present right now (0 = fasting, 1 = a standard meal just eaten). */
  luminalMealLoad: number;
}

export interface DigestionDerived {
  // The fat chain.
  bileEmulsificationFactor: number;
  enzymeFactor: number;
  currentMealFatAbsorptionPct: number;
  faecalFatGPerDay: number;
  spiltBileSaltsGPerDay: number;

  // Pool economy.
  bileSaltPoolG: number;
  hepaticSynthesisGPerDay: number;
  enterohepaticLossGPerDay: number;

  // Carbohydrate.
  lactoseAbsorbedPct: number;
  unabsorbedLactoseGPerDay: number;

  // Water and stool.
  stoolWaterMlPerDay: number;
  osmoticContributionMlPerDay: number;
  secretoryContributionMlPerDay: number;
  stoolOsmoticGapHigh: boolean;
  stoolClassification: StoolClassification;

  // Micronutrients and long game.
  b12StoreFraction: number;
  ironStoreFraction: number;
  b12Deficient: boolean;
  ironDeficient: boolean;
  nutritionIndex: number;
  nutritionDriftTarget: number;

  classification: DigestionState_Classification;
  patternSummary: string;

  // Passthroughs so tick() stays pure.
  mealFatGrams: number;
  mealLactoseGrams: number;
  luminalMealLoad: number;
}

export interface DigestionSnapshot {
  state: DigestionInternalState;
  derived: DigestionDerived;
}

export interface DigestionHistoryPoint {
  t: number;
  stoolWaterMlPerDay: number;
  bileSaltPoolG: number;
  nutritionIndex: number;
  fatAbsorptionPct: number;
}

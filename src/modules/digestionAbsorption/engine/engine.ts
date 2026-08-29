import { BILE, NUTRITION, SIMULATION, WATER } from './constants';
import { hepaticSynthesisGPerDay, enterohepaticLossGPerDay, updatePool } from './bile';
import {
  bileEmulsificationFactor,
  enzymeFactor,
  fatAbsorptionEfficiency,
  generalNutrientEfficiency,
  lactoseAbsorbedFraction,
  transitedFraction,
} from './meal';
import { isDeficient, updateB12Store, updateIronStore, b12UptakeFraction } from './micronutrients';
import { stoolOsmoticGapHigh, waterBalance } from './water';
import { approach, clamp } from '@/shared/lib/math';
import type {
  DigestionDerived,
  DigestionHistoryPoint,
  DigestionInputs,
  DigestionInternalState,
  DigestionSnapshot,
  DigestionState_Classification,
  StoolClassification,
} from './types';

export function createInitialState(): DigestionInternalState {
  return {
    simTimeSeconds: 0,
    bileSaltPoolG: BILE.POOL_REF_G,
    b12StoreFraction: 1,
    ironStoreFraction: 1,
    nutritionIndex: 1,
    luminalMealLoad: 0,
  };
}

export function computeDerived(state: DigestionInternalState, inputs: DigestionInputs): DigestionDerived {
  // The fat chain: emulsion (bile) and hydrolysis (lipase) in series, brush border beyond.
  const bileFactor = bileEmulsificationFactor(state.bileSaltPoolG, inputs.mealFatGrams);
  const enzymF = enzymeFactor(inputs.pancreaticEnzymeCapacityPct);
  const fatEff = fatAbsorptionEfficiency({
    bileFactor,
    enzymeFactor: enzymF,
    mucosalSurfaceAreaPct: inputs.mucosalSurfaceAreaPct,
    transitMultiplier: inputs.transitMultiplier,
  });
  const faecalFatGPerDay = inputs.mealFatGrams * (1 - fatEff);

  // The pool economy.
  const loss = enterohepaticLossGPerDay(state.bileSaltPoolG, inputs.ilealReabsorptionFraction);
  const synthesis = hepaticSynthesisGPerDay({
    hepaticSynthesisCapacityPct: inputs.hepaticSynthesisCapacityPct,
    ilealReabsorptionFraction: inputs.ilealReabsorptionFraction,
    bileSaltPoolG: state.bileSaltPoolG,
  });

  // Carbohydrate at the brush border.
  const lactoseFrac = lactoseAbsorbedFraction(inputs.lactaseActivityPct);
  const unabsorbedLactoseGPerDay = inputs.mealLactoseGrams * (1 - lactoseFrac) * clamp(state.luminalMealLoad, 0, 1);
  const lactoseAbsorbedPct = lactoseFrac * 100;

  // Water: osmotic volume is non-salvageable; secretagogues both add volume and impair the
  // colon. Fat maldigestion and salt spillage run chronically while the diet continues —
  // only the lactose load is tied to the meal in the lumen.
  const balance = waterBalance({
    unabsorbedLactoseGPerDay,
    faecalFatGPerDay,
    spiltBileSaltsGPerDay: loss,
    secretoryDrivePct: inputs.secretoryDrivePct,
    colonicFunctionPct: inputs.colonicFunctionPct,
  });
  const stool = stoolWaterWithOsmotic(balance.stoolWaterMlPerDay, balance.osmoticMlPerDay);
  const gapHigh = stoolOsmoticGapHigh(balance.osmoticMlPerDay, balance.secretoryMlPerDay);
  const stoolClass = classifyStool({
    stoolWaterMlPerDay: stool,
    osmoticMlPerDay: balance.osmoticMlPerDay,
    secretoryDrivePct: inputs.secretoryDrivePct,
    faecalFatGPerDay,
    spiltBileSaltsGPerDay: loss,
  });

  // Long game.
  const generalEff = generalNutrientEfficiency(inputs.mucosalSurfaceAreaPct, inputs.transitMultiplier);
  const nutritionTarget = clamp(0.35 + 0.35 * fatEff + 0.3 * generalEff, 0, 1);

  const classification = classify({
    stoolClass,
    secretoryDrivePct: inputs.secretoryDrivePct,
    mucosalSurfaceAreaPct: inputs.mucosalSurfaceAreaPct,
    terminalIlealFunctionPct: inputs.terminalIlealFunctionPct,
    faecalFatGPerDay,
    bileFactor,
    enzymF,
    b12Deficient: isDeficient(state.b12StoreFraction),
    ironDeficient: isDeficient(state.ironStoreFraction),
  });

  return {
    bileEmulsificationFactor: bileFactor,
    enzymeFactor: enzymF,
    currentMealFatAbsorptionPct: fatEff * 100,
    faecalFatGPerDay,
    spiltBileSaltsGPerDay: loss,

    bileSaltPoolG: state.bileSaltPoolG,
    hepaticSynthesisGPerDay: synthesis,
    enterohepaticLossGPerDay: loss,

    lactoseAbsorbedPct,
    unabsorbedLactoseGPerDay,

    stoolWaterMlPerDay: stool,
    osmoticContributionMlPerDay: balance.osmoticMlPerDay,
    secretoryContributionMlPerDay: balance.secretoryMlPerDay,
    stoolOsmoticGapHigh: gapHigh,
    stoolClassification: stoolClass,

    b12StoreFraction: state.b12StoreFraction,
    ironStoreFraction: state.ironStoreFraction,
    b12Deficient: isDeficient(state.b12StoreFraction),
    ironDeficient: isDeficient(state.ironStoreFraction),
    nutritionIndex: state.nutritionIndex,
    nutritionDriftTarget: nutritionTarget,

    classification,
    patternSummary: patternSummary(classification, state),

    mealFatGrams: inputs.mealFatGrams,
    mealLactoseGrams: inputs.mealLactoseGrams,
    luminalMealLoad: state.luminalMealLoad,
  };
}

/** Osmotic particles hold water all the way out: no colon reclaims what osmosis keeps. */
function stoolWaterWithOsmotic(salvageableStoolMlPerDay: number, osmoticMlPerDay: number): number {
  return salvageableStoolMlPerDay + Math.max(osmoticMlPerDay, 0);
}

function classifyStool(params: {
  stoolWaterMlPerDay: number;
  osmoticMlPerDay: number;
  secretoryDrivePct: number;
  faecalFatGPerDay: number;
  spiltBileSaltsGPerDay: number;
}): StoolClassification {
  // Greasy stool is diagnosed by its FAT, not its water: steatorrhoea outranks the volume gate.
  if (params.faecalFatGPerDay >= 14) return 'steatorrhoea';
  if (params.stoolWaterMlPerDay < WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY) return 'no diarrhoea';
  if (params.secretoryDrivePct >= 30) return 'secretory diarrhoea';
  if (params.osmoticMlPerDay > 60 && params.osmoticMlPerDay > params.faecalFatGPerDay * WATER.FAECAL_FAT_ML_PER_G) {
    return 'osmotic diarrhoea';
  }
  if (params.spiltBileSaltsGPerDay > 1.5) return 'cholerrhoeic diarrhoea';
  return 'mixed malabsorption';
}

function classify(params: {
  stoolClass: StoolClassification;
  secretoryDrivePct: number;
  mucosalSurfaceAreaPct: number;
  terminalIlealFunctionPct: number;
  faecalFatGPerDay: number;
  bileFactor: number;
  enzymF: number;
  b12Deficient: boolean;
  ironDeficient: boolean;
}): DigestionState_Classification {
  if (params.stoolClass === 'secretory diarrhoea') return 'secretory diarrhoea';
  if (params.mucosalSurfaceAreaPct < 45 && params.terminalIlealFunctionPct < 45) return 'short bowel pattern';
  if (params.stoolClass === 'osmotic diarrhoea') return 'osmotic diarrhoea';
  if (params.stoolClass === 'cholerrhoeic diarrhoea') return 'bile salt diarrhoea';
  if (params.faecalFatGPerDay >= 14) {
    if (params.enzymF < params.bileFactor) return 'steatorrhoea (pancreatic)';
    if (params.bileFactor < params.enzymF) return 'steatorrhoea (biliary)';
    return 'steatorrhoea (mucosal)';
  }
  if (params.b12Deficient || params.ironDeficient) return 'micronutrient depletion';
  return 'balanced absorption';
}

function patternSummary(classification: DigestionState_Classification, state: DigestionInternalState): string {
  switch (classification) {
    case 'balanced absorption':
      return 'the meal is being taken apart and taken up; stores are holding';
    case 'osmotic diarrhoea':
      return 'unabsorbed solute holds water all the way to the rectum — it stops when the food stops';
    case 'secretory diarrhoea':
      return 'the gut is being told to secrete; fasting changes nothing';
    case 'bile salt diarrhoea':
      return `salts the ileum should have reclaimed reach the colon and water it — pool down to ${state.bileSaltPoolG.toFixed(1)} g`;
    case 'steatorrhoea (pancreatic)':
      return 'the emulsion arrives but nothing hydrolyses it — bulky, pale, greasy stool';
    case 'steatorrhoea (biliary)':
      return 'no detergent, no uptake: enzymes without emulsion cannot touch the fat';
    case 'steatorrhoea (mucosal)':
      return 'detergent and enzymes delivered, but no working surface left to absorb through';
    case 'short bowel pattern':
      return 'surface area and ileum gone together — every arm of absorption fails at once';
    case 'micronutrient depletion':
      return 'macro absorption limps along while the years-long reserves quietly empty';
  }
}

export function tick(
  state: DigestionInternalState,
  derived: DigestionDerived,
  inputs: DigestionInputs,
  dtSeconds: number,
): DigestionInternalState {
  const dtDays = dtSeconds / 86400;
  const transitDecay = transitedFraction(dtSeconds);

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    bileSaltPoolG: updatePool(state.bileSaltPoolG, derived.hepaticSynthesisGPerDay, derived.enterohepaticLossGPerDay, dtDays),
    b12StoreFraction: updateB12Store(state.b12StoreFraction, b12UptakeFraction(inputs.terminalIlealFunctionPct), dtDays),
    ironStoreFraction: updateIronStore(state.ironStoreFraction, inputs.mucosalSurfaceAreaPct, dtDays),
    nutritionIndex: approach(state.nutritionIndex, derived.nutritionDriftTarget, dtDays, NUTRITION.TAU_DAYS),
    luminalMealLoad: Math.max(0, state.luminalMealLoad - state.luminalMealLoad * transitDecay),
  };
}

export function step(state: DigestionInternalState, inputs: DigestionInputs, dtSeconds: number): DigestionSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, inputs, dtSeconds), derived };
}

/** A meal lands in the lumen; from here on its fate belongs to the capacities above. */
export function perturbEatMeal(state: DigestionInternalState): DigestionInternalState {
  return { ...state, luminalMealLoad: clamp(state.luminalMealLoad + 1, 0, 2) };
}

export function toHistoryPoint(snapshot: DigestionSnapshot): DigestionHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    stoolWaterMlPerDay: snapshot.derived.stoolWaterMlPerDay,
    bileSaltPoolG: snapshot.state.bileSaltPoolG,
    nutritionIndex: snapshot.state.nutritionIndex,
    fatAbsorptionPct: snapshot.derived.currentMealFatAbsorptionPct,
  };
}

export { SIMULATION };

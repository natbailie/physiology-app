import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbEatMeal, step } from './engine';
import { DEFAULT_DIGESTION_INPUTS } from './presets';
import { BILE, MICRONUTRIENT, WATER } from './constants';
import type { DigestionInputs } from './types';

type Snapshot = ReturnType<typeof step>;

function run(inputs: Partial<DigestionInputs>, days = 6): Snapshot {
  const full = { ...DEFAULT_DIGESTION_INPUTS, ...inputs };
  let snapshot = step(createInitialState(), full, 600);
  for (let d = 0; d < days * 24 * 120; d += 1) {
    snapshot = step(snapshot.state, full, 30);
  }
  return snapshot;
}

/** A run that starts with a meal in the lumen and lets it transit. */
function runWithMeal(inputs: Partial<DigestionInputs>, hours = 8): Snapshot {
  const started = perturbEatMeal(createInitialState());
  const full = { ...DEFAULT_DIGESTION_INPUTS, ...inputs };
  let snapshot: Snapshot = { state: started, derived: computeDerived(started, full) };
  for (let t = 0; t < (hours * 3600) / 30; t += 1) {
    snapshot = step(snapshot.state, full, 30);
  }
  return snapshot;
}

describe('baseline calibration', () => {
  const baseline = run({});

  it('holds the bile salt pool near its textbook size', () => {
    expect(baseline.state.bileSaltPoolG).toBeGreaterThan(BILE.POOL_REF_G - 0.5);
    expect(baseline.state.bileSaltPoolG).toBeLessThanOrEqual(BILE.POOL_REF_G);
    // The liver replaces exactly what escapes, well inside its synthetic capacity.
    expect(baseline.derived.hepaticSynthesisGPerDay).toBeGreaterThan(0.2);
    expect(baseline.derived.hepaticSynthesisGPerDay).toBeLessThan(2);
  });

  it('absorbs a meal almost completely with quiet stool', () => {
    const fed = runWithMeal({});
    expect(fed.derived.currentMealFatAbsorptionPct).toBeGreaterThan(90);
    expect(fed.derived.stoolWaterMlPerDay).toBeLessThan(WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY);
  });

  it('keeps micronutrient stores replete and nutrition stable', () => {
    expect(baseline.state.b12StoreFraction).toBeGreaterThan(0.95);
    expect(baseline.state.ironStoreFraction).toBeGreaterThan(0.95);
    expect(baseline.state.nutritionIndex).toBeGreaterThan(0.95);
    expect(baseline.derived.classification).toBe('balanced absorption');
  });
});

describe('fat needs bile AND lipase — either alone fails', () => {
  it('loses fat in stool when pancreatic enzymes fail, even with a full pool', () => {
    const low = runWithMeal({ pancreaticEnzymeCapacityPct: 4 });
    expect(low.derived.faecalFatGPerDay).toBeGreaterThan(15);
    expect(low.derived.stoolClassification).toContain('steatorrhoea');
  });

  it('keeps absorbing when enzyme capacity is only slightly reduced — the huge reserve', () => {
    const reserved = runWithMeal({ pancreaticEnzymeCapacityPct: 18 });
    expect(reserved.derived.currentMealFatAbsorptionPct).toBeGreaterThan(90);
  });

  it('fails to emulsify when the liver cannot synthesise, despite healthy enzymes', () => {
    // Synthesis gone with recycling intact: the pool bleeds away into the stool over days
    // and takes emulsification with it — pure biliary steatorrhoea.
    const drained = run({ hepaticSynthesisCapacityPct: 0, ilealReabsorptionFraction: 0.98 }, 10);
    expect(drained.state.bileSaltPoolG).toBeLessThan(1);
    expect(drained.derived.currentMealFatAbsorptionPct).toBeLessThan(60);
    expect(drained.derived.stoolClassification).toContain('steatorrhoea');
  });

  it('keeps fat absorption whole when only the pool is mildly taxed', () => {
    const mild = run({ ilealReabsorptionFraction: 0.9 }, 10);
    // The liver up-regulates to cover the extra loss; the pool holds.
    expect(mild.state.bileSaltPoolG).toBeGreaterThan(3.5);
    // Synthesis runs well above the idling rate to pay for the spillage.
    expect(mild.derived.hepaticSynthesisGPerDay).toBeGreaterThan(2);
    expect(mild.derived.faecalFatGPerDay).toBeLessThan(5);
  });
});

describe('the terminal ileum takes three things with it', () => {
  it('resection empties the pool, starves B12, and waters out the stool together', () => {
    const resected = run({ terminalIlealFunctionPct: 5, ilealReabsorptionFraction: 0.05 }, 14);
    expect(resected.state.bileSaltPoolG).toBeLessThan(1.5);
    expect(resected.state.b12StoreFraction).toBeLessThan(0.7);
    expect(resected.derived.stoolWaterMlPerDay).toBeGreaterThan(WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY);
    expect(resected.derived.faecalFatGPerDay).toBeGreaterThan(10);
  });

  it('with partial loss the pool survives but spilled salts water the colon instead', () => {
    const partial = run({ terminalIlealFunctionPct: 55, ilealReabsorptionFraction: 0.55 }, 14);
    // Synthesis keeps pace; the pool is held.
    expect(partial.state.bileSaltPoolG).toBeGreaterThanOrEqual(1.2);
    // But grams of salt per day now reach the colon, which secretes in response.
    expect(partial.derived.spiltBileSaltsGPerDay).toBeGreaterThan(1);
    expect(partial.derived.stoolWaterMlPerDay).toBeGreaterThan(WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY + 150);
    // Fat absorption is reduced but nowhere near abolished.
    expect(partial.derived.faecalFatGPerDay).toBeLessThan(26);
  });

  it('concentrates B12 loss at the ileum: proximal disease spares it', () => {
    const coeliac = run({ mucosalSurfaceAreaPct: 22 }, 40);
    expect(coeliac.state.ironStoreFraction).toBeLessThan(MICRONUTRIENT.DEFICIENT_FRACTION);
    expect(coeliac.state.b12StoreFraction).toBeGreaterThan(0.8);
  });
});

describe('osmotic versus secretory diarrhoea', () => {
  it('unabsorbed lactose makes osmotic stool that needs the milk present', () => {
    const drinking = runWithMeal({ lactaseActivityPct: 6, mealLactoseGrams: 24 }, 6);
    expect(drinking.derived.stoolWaterMlPerDay).toBeGreaterThan(WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY);
    expect(drinking.derived.stoolClassification).toBe('osmotic diarrhoea');

    // Between meals the osmotic load is gone.
    const fasting = run({ lactaseActivityPct: 6 });
    expect(fasting.derived.stoolWaterMlPerDay).toBeLessThan(WATER.DIARRHOEA_THRESHOLD_ML_PER_DAY);
  });

  it('a secretory drive waters the patient whether or not they eat', () => {
    const fasting = run({ secretoryDrivePct: 80 });
    expect(fasting.derived.stoolWaterMlPerDay).toBeGreaterThan(900);
    expect(fasting.derived.stoolClassification).toBe('secretory diarrhoea');
  });

  it('the colon buys back litres before stool becomes liquid', () => {
    // A moderate secretory load: the healthy colon absorbs most of it; a crippled one cannot.
    const driven = run({ secretoryDrivePct: 40, colonicFunctionPct: 100 });
    const noColon = run({ secretoryDrivePct: 40, colonicFunctionPct: 25 });
    expect(driven.derived.stoolWaterMlPerDay).toBeLessThan(WATER.SEVERE_THRESHOLD_ML_PER_DAY);
    expect(noColon.derived.stoolWaterMlPerDay).toBeGreaterThan(WATER.SEVERE_THRESHOLD_ML_PER_DAY);
  });
});

describe('surface area and hurry', () => {
  it('coeliac disease erodes nutrition while sparing the ileal jobs early', () => {
    const coeliac = run({ mucosalSurfaceAreaPct: 22 }, 40);
    expect(coeliac.state.nutritionIndex).toBeLessThan(0.75);
    expect(coeliac.state.bileSaltPoolG).toBeGreaterThan(3);
  });

  it('hurry through the gut costs absorption efficiency', () => {
    const calm = runWithMeal({ transitMultiplier: 1 }, 6);
    const rushed = runWithMeal({ transitMultiplier: 2.6 }, 6);
    expect(rushed.derived.currentMealFatAbsorptionPct).toBeLessThan(calm.derived.currentMealFatAbsorptionPct - 5);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<DigestionInputs>[] = [
      { pancreaticEnzymeCapacityPct: 0, hepaticSynthesisCapacityPct: 0 },
      { mucosalSurfaceAreaPct: 0, terminalIlealFunctionPct: 0 },
      { lactaseActivityPct: 0, secretoryDrivePct: 100, colonicFunctionPct: 0 },
      { mealFatGrams: 0, mealLactoseGrams: 0, transitMultiplier: 3 },
      { ilealReabsorptionFraction: 0, transitMultiplier: 0.5 },
    ];
    for (const patch of extremes) {
      const d = run(patch, 3).derived;
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { classifyAnemia, computeDerived, createInitialState, perturbAcuteBloodLoss, step } from './engine';
import { DEFAULT_ERYTHRO_INPUTS, ERYTHRO_PRESETS } from './presets';
import { HEMOGLOBIN, RETICULOCYTE } from './constants';
import type { ErythroInputs } from './types';

const DT = 1;

function settle(inputs: ErythroInputs, seconds = 30000) {
  let state = createInitialState();
  for (let i = 0; i < seconds / DT; i++) state = step(state, inputs, DT).state;
  return { derived: computeDerived(state, inputs), state };
}

function preset(name: keyof typeof ERYTHRO_PRESETS, overrides: Partial<ErythroInputs> = {}): ErythroInputs {
  return { ...DEFAULT_ERYTHRO_INPUTS, ...ERYTHRO_PRESETS[name], ...overrides };
}

describe('erythropoiesis — the normal feedback loop', () => {
  it('holds haemoglobin at its setpoint with a reticulocyte index of about 1', () => {
    const { derived } = settle(DEFAULT_ERYTHRO_INPUTS);
    expect(derived.hemoglobinGDl).toBeGreaterThan(13);
    expect(derived.hemoglobinGDl).toBeLessThan(17);
    expect(derived.reticulocyteIndex).toBeCloseTo(1, 1);
    expect(derived.anemiaClassification).toBe('normal');
  });

  it('raises EPO as haemoglobin falls — the loop has gain at its setpoint', () => {
    const normal = settle(DEFAULT_ERYTHRO_INPUTS).derived;
    // Drop the haemoglobin acutely and sample before the marrow has corrected it.
    let state = perturbAcuteBloodLoss(settle(DEFAULT_ERYTHRO_INPUTS).state, 5);
    for (let i = 0; i < 200; i++) state = step(state, DEFAULT_ERYTHRO_INPUTS, DT).state;
    const anemic = computeDerived(state, DEFAULT_ERYTHRO_INPUTS);

    expect(anemic.epoLevel).toBeGreaterThan(normal.epoLevel);
    expect(anemic.tissueHypoxia).toBeGreaterThan(normal.tissueHypoxia);
  });

  it('recovers from an acute bleed back toward the setpoint', () => {
    const baseline = settle(DEFAULT_ERYTHRO_INPUTS);
    let state = perturbAcuteBloodLoss(baseline.state, 5);
    const immediate = computeDerived(state, DEFAULT_ERYTHRO_INPUTS).hemoglobinGDl;

    for (let i = 0; i < 20000; i++) state = step(state, DEFAULT_ERYTHRO_INPUTS, DT).state;
    const recovered = computeDerived(state, DEFAULT_ERYTHRO_INPUTS).hemoglobinGDl;

    expect(recovered).toBeGreaterThan(immediate);
    expect(recovered).toBeGreaterThan(13);
  });

  it('never produces NaN across extreme inputs', () => {
    const extremes: ErythroInputs[] = [];
    for (const renalFunction of [0, 1.5]) {
      for (const ironAvailability of [0, 150]) {
        for (const marrowFunction of [0, 1.5]) {
          for (const hemolysisRate of [0, 100]) {
            extremes.push({ ...DEFAULT_ERYTHRO_INPUTS, renalFunction, ironAvailability, marrowFunction, hemolysisRate });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived } = settle(inputs, 10000);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(derived.hemoglobinGDl).toBeGreaterThanOrEqual(HEMOGLOBIN.MIN_G_DL - 1e-6);
      expect(derived.hemoglobinGDl).toBeLessThanOrEqual(HEMOGLOBIN.MAX_G_DL + 1e-6);
      expect(derived.reticulocyteIndex).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('erythropoiesis — MCV splits the differential three ways', () => {
  it('iron deficiency makes cells small, B12/folate deficiency makes them large', () => {
    const iron = settle(preset('ironDeficiency')).derived;
    const b12 = settle(preset('b12FolateDeficiency')).derived;

    // Haem synthesis stalls, so precursors divide again while waiting — microcytic.
    expect(iron.mcv).toBeLessThan(80);
    expect(iron.anemiaClassification).toBe('microcytic anemia');

    // DNA synthesis stalls while cytoplasm matures on schedule — macrocytic.
    expect(b12.mcv).toBeGreaterThan(100);
    expect(b12.anemiaClassification).toBe('macrocytic anemia');
  });

  it('classifies by size only once the haemoglobin is actually low', () => {
    expect(classifyAnemia(15, 70)).toBe('normal');
    expect(classifyAnemia(9, 70)).toBe('microcytic anemia');
    expect(classifyAnemia(9, 90)).toBe('normocytic anemia');
    expect(classifyAnemia(9, 110)).toBe('macrocytic anemia');
    expect(classifyAnemia(19, 90)).toBe('polycythemia');
  });

  it('empties iron stores in iron deficiency but not in B12 deficiency', () => {
    const iron = settle(preset('ironDeficiency')).derived;
    const b12 = settle(preset('b12FolateDeficiency')).derived;

    expect(iron.ferritinNgMl).toBeLessThan(30);
    expect(b12.ferritinNgMl).toBeGreaterThan(80);
  });
});

describe('erythropoiesis — the reticulocyte index separates the causes', () => {
  it('is HIGH in haemolysis: the marrow is responding, the cells are being destroyed', () => {
    const hemolytic = settle(preset('hemolyticAnemia')).derived;

    expect(hemolytic.hemoglobinGDl).toBeLessThan(HEMOGLOBIN.ANEMIA_THRESHOLD_G_DL);
    expect(hemolytic.reticulocyteIndex).toBeGreaterThan(RETICULOCYTE.ADEQUATE_RESPONSE_THRESHOLD);
    expect(hemolytic.isHypoproliferative).toBe(false);
  });

  it('is LOW in every hypoproliferative anemia, despite a raised EPO', () => {
    for (const name of ['ironDeficiency', 'b12FolateDeficiency', 'aplasticAnemia'] as const) {
      const result = settle(preset(name)).derived;
      expect(result.hemoglobinGDl, name).toBeLessThan(HEMOGLOBIN.ANEMIA_THRESHOLD_G_DL);
      // The signal is loud — it is the response that is missing.
      expect(result.epoLevel, name).toBeGreaterThan(0.5);
      expect(result.reticulocyteIndex, name).toBeLessThan(RETICULOCYTE.ADEQUATE_RESPONSE_THRESHOLD);
      expect(result.isHypoproliferative, name).toBe(true);
    }
  });

  it('separates haemolysis from aplasia even though both can reach a similar haemoglobin', () => {
    // Tuned so the two sit at comparable haemoglobins; only the retic index tells them apart.
    const hemolytic = settle(preset('hemolyticAnemia')).derived;
    const aplastic = settle(preset('aplasticAnemia')).derived;

    expect(hemolytic.reticulocyteIndex).toBeGreaterThan(aplastic.reticulocyteIndex * 5);
    expect(hemolytic.isHypoproliferative).toBe(false);
    expect(aplastic.isHypoproliferative).toBe(true);
  });
});

describe('erythropoiesis — anemia of chronic kidney disease', () => {
  it('is the one anemia with a LOW EPO — a hormone deficiency, not a marrow failure', () => {
    const ckd = settle(preset('anemiaOfCkd')).derived;
    const aplastic = settle(preset('aplasticAnemia')).derived;

    expect(ckd.hemoglobinGDl).toBeLessThan(HEMOGLOBIN.ANEMIA_THRESHOLD_G_DL);
    // The kidney cannot signal...
    expect(ckd.epoLevel).toBeLessThan(0.25);
    // ...whereas in aplasia the signal is maximal and there is simply nothing to answer it.
    expect(aplastic.epoLevel).toBeGreaterThan(0.8);
    expect(ckd.epoLevel).toBeLessThan(aplastic.epoLevel);
  });

  it('produces normal-sized cells, since neither substrate is lacking', () => {
    const ckd = settle(preset('anemiaOfCkd')).derived;
    expect(ckd.anemiaClassification).toBe('normocytic anemia');
    expect(ckd.mcv).toBeGreaterThan(80);
    expect(ckd.mcv).toBeLessThan(100);
  });

  it('responds to restoring the renal signal — the rationale for recombinant EPO', () => {
    const untreated = settle(preset('anemiaOfCkd')).derived;
    const treated = settle(preset('anemiaOfCkd', { renalFunction: 1 })).derived;
    expect(treated.hemoglobinGDl).toBeGreaterThan(untreated.hemoglobinGDl + 3);
  });
});

describe('erythropoiesis — chronic blood loss and altitude', () => {
  it('chronic bleeding eventually turns microcytic as iron stores drain', () => {
    const result = settle(preset('chronicBloodLoss')).derived;
    expect(result.ferritinNgMl).toBeLessThan(30);
    expect(result.mcv).toBeLessThan(85);
  });

  it('altitude drives erythropoiesis at a normal haemoglobin — hypoxia, not anemia', () => {
    const normal = settle(DEFAULT_ERYTHRO_INPUTS).derived;
    const altitude = settle(preset('highAltitude')).derived;

    expect(altitude.epoLevel).toBeGreaterThan(normal.epoLevel);
    expect(altitude.hemoglobinGDl).toBeGreaterThan(normal.hemoglobinGDl);
    expect(altitude.anemiaClassification).toBe('polycythemia');
  });

  it('oxygen delivery, not haemoglobin alone, is what the loop defends', () => {
    const normal = settle(DEFAULT_ERYTHRO_INPUTS).derived;
    const anemic = settle(preset('aplasticAnemia')).derived;
    expect(anemic.oxygenDeliveryMlPerMin).toBeLessThan(normal.oxygenDeliveryMlPerMin * 0.5);
  });
});

import { describe, expect, it } from 'vitest';
import { expectedHCO3Range, expectedPaCO2Range, primaryDisorder } from './interpretation';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_RESP_INPUTS, RESP_PRESETS } from './presets';
import type { RespInputs } from './types';

function settle(inputs: RespInputs, seconds = 3000, dt = 0.5) {
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  for (let t = 0; t < seconds; t += dt) {
    const result = step(state, inputs, dt);
    state = result.state;
    derived = result.derived;
  }
  return derived;
}

const preset = (name: keyof typeof RESP_PRESETS) => settle({ ...DEFAULT_RESP_INPUTS, ...RESP_PRESETS[name] });

describe('naming the primary disorder', () => {
  it('calls a high PaCO2 with acidaemia a respiratory acidosis whatever the bicarbonate is doing', () => {
    // Hypoventilation cannot be a RESPONSE to acidaemia — the chemoreceptors would be driving
    // ventilation the other way — so the high CO2 has to be the primary problem.
    expect(primaryDisorder(7.2, 70, 27)).toBe('respiratory acidosis');
  });

  it('calls a low bicarbonate with acidaemia a metabolic acidosis even though PaCO2 is low too', () => {
    expect(primaryDisorder(7.2, 26, 10)).toBe('metabolic acidosis');
  });

  it('does not call a patient normal just because their pH is', () => {
    // Both components grossly abnormal, pH in range. This is the reading that gets missed.
    expect(primaryDisorder(7.38, 70, 40)).not.toBe('normal');
  });

  it('does call a genuinely normal gas normal', () => {
    expect(primaryDisorder(7.4, 40, 24)).toBe('normal');
  });
});

describe('expected compensation', () => {
  it("follows Winter's formula for a metabolic acidosis", () => {
    // HCO3 12 -> 1.5 x 12 + 8 = 26 mmHg.
    const [low, high] = expectedPaCO2Range(12);
    expect(low).toBeLessThan(26);
    expect(high).toBeGreaterThan(26);
    expect(high - low).toBeCloseTo(4, 5);
  });

  it('allows a wider band for a metabolic alkalosis, because hypoventilation is a poor tool', () => {
    // You can always breathe harder; you cannot stop breathing to hold on to CO2.
    const metabolicAcidosisBand = expectedPaCO2Range(12);
    const metabolicAlkalosisBand = expectedPaCO2Range(36);
    expect(metabolicAlkalosisBand[1] - metabolicAlkalosisBand[0]).toBeGreaterThan(
      metabolicAcidosisBand[1] - metabolicAcidosisBand[0],
    );
  });

  it('reports a RANGE for a respiratory disorder, spanning acute to chronic', () => {
    // A PaCO2 of 70 justifies a bicarbonate of about 27 on the first day and about 34 after a
    // fortnight. One gas cannot tell you which, and pretending otherwise invents disorders.
    const [low, high] = expectedHCO3Range(70);
    expect(low).toBeLessThan(27);
    expect(high).toBeGreaterThan(34);
  });

  it('expects a larger bicarbonate fall per 10 mmHg in an alkalosis than a rise in an acidosis', () => {
    const acidosis = expectedHCO3Range(60)[1] - 24;
    const alkalosis = 24 - expectedHCO3Range(20)[0];
    expect(alkalosis).toBeGreaterThan(acidosis);
  });
});

describe('mixed disorders', () => {
  it('reads salicylate poisoning as two primary disorders, not one compensating the other', () => {
    // The respiratory alkalosis is a direct drug effect on the respiratory centre; it is not a
    // response to the acidosis, and no compensation rule will fit the pair.
    const derived = preset('salicylatePoisoning');
    expect(derived.interpretation.isMixed).toBe(true);
    expect(derived.interpretation.primary).toBe('metabolic acidosis');
    expect(derived.interpretation.secondary).toBe('respiratory alkalosis');
  });

  it('reads a cardiac arrest as respiratory AND metabolic acidosis together', () => {
    const derived = preset('cardiacArrest');
    expect(derived.interpretation.isMixed).toBe(true);
    expect(derived.pH).toBeLessThan(7.1);
  });

  it('finds the metabolic alkalosis hiding inside a chronic retainer who starts vomiting', () => {
    // Both derangements push bicarbonate up, so the pH looks almost reasonable. Only the
    // bicarbonate being ABOVE what even full chronic compensation would produce gives it away.
    const derived = preset('vomitingOnCopd');
    expect(derived.interpretation.isMixed).toBe(true);
    expect(derived.interpretation.secondary).toBe('metabolic alkalosis');
  });

  it('does NOT call a plain compensated COPD mixed', () => {
    // The commonest false positive: a bicarbonate of 32 looks alarming until you notice the
    // PaCO2 entitles the patient to it.
    const derived = preset('copdChronicAcidosis');
    expect(derived.interpretation.primary).toBe('respiratory acidosis');
    expect(derived.interpretation.isMixed).toBe(false);
    // Compensated, but never fully — the pH is still on the acid side.
    expect(derived.pH).toBeLessThan(7.35);
  });

  it('does not call an appropriately compensated ketoacidosis mixed either', () => {
    const derived = preset('dkaMetabolicAcidosis');
    expect(derived.interpretation.primary).toBe('metabolic acidosis');
    expect(derived.interpretation.isMixed).toBe(false);
  });
});

describe('the engine and the clinical rules agree', () => {
  it('settles a chronic retainer on a bicarbonate the compensation rules would predict', () => {
    // The point of the whole exercise: the model's chronic bicarbonate is not merely wherever
    // an integration drifted to, it is a value the textbook rule also arrives at.
    const derived = preset('copdChronicAcidosis');
    const [low, high] = expectedHCO3Range(derived.paCO2);
    expect(derived.plasmaHCO3).toBeGreaterThan(low);
    expect(derived.plasmaHCO3).toBeLessThan(high);
  });

  it("settles a ketoacidosis on a PaCO2 Winter's formula would predict", () => {
    const derived = preset('dkaMetabolicAcidosis');
    const [low, high] = expectedPaCO2Range(derived.plasmaHCO3);
    expect(derived.paCO2).toBeGreaterThan(low);
    expect(derived.paCO2).toBeLessThan(high);
  });

  it('leaves a patient who cannot compensate sitting at the ACUTE edge of the band', () => {
    // Renal capacity zero: dialysis-dependent, so the chronic bicarbonate never arrives and
    // chemical buffering is all there is. Note where that puts them — at the bottom of the
    // band, not outside it. A single gas cannot separate "acute" from "chronic but unable to
    // compensate", which is why the history matters as much as the numbers.
    const cannotCompensate = settle({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 30, renalCompensationCapacity: 0 });
    const [low, high] = expectedHCO3Range(cannotCompensate.paCO2);
    const acuteEdge = low + (high - low) * 0.25;
    expect(cannotCompensate.plasmaHCO3).toBeGreaterThan(low);
    expect(cannotCompensate.plasmaHCO3).toBeLessThan(acuteEdge);
    expect(cannotCompensate.interpretation.isMixed).toBe(false);
  });

  it('and that patient is far more acidaemic than the one whose kidneys work', () => {
    // Identical ventilation, identical PaCO2, and the pH that separates them is entirely the
    // bicarbonate the kidney was or was not able to generate. This is the whole value of the
    // renal arm, and it is why the same blood gas means different things in different patients.
    const cannotCompensate = settle({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 30, renalCompensationCapacity: 0 });
    const canCompensate = settle({ ...DEFAULT_RESP_INPUTS, minuteVentilation: 30, renalCompensationCapacity: 1 });
    expect(canCompensate.paCO2).toBeCloseTo(cannotCompensate.paCO2, 0);
    expect(canCompensate.plasmaHCO3).toBeGreaterThan(cannotCompensate.plasmaHCO3 + 4);
    expect(canCompensate.pH).toBeGreaterThan(cannotCompensate.pH + 0.06);
  });
});

describe('the anion gap separates two identical-looking acidoses', () => {
  it('gives diarrhoea and ketoacidosis the same kind of disorder but different gaps', () => {
    const dka = preset('dkaMetabolicAcidosis');
    const diarrhoea = preset('diarrhoeaNonGap');
    expect(dka.interpretation.primary).toBe('metabolic acidosis');
    expect(diarrhoea.interpretation.primary).toBe('metabolic acidosis');
    expect(dka.anionGapMEqL).toBeGreaterThan(20);
    expect(diarrhoea.anionGapMEqL).toBeLessThan(14);
  });
});

import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbFeedNow, perturbStartLabour, step } from './engine';
import { DEFAULT_PREGNANCY_INPUTS, PREGNANCY_PRESETS } from './presets';
import type { PregnancyDerived, PregnancyInputs } from './types';

function settle(patch: Partial<PregnancyInputs>, seconds = 400000): PregnancyDerived {
  const inputs = { ...DEFAULT_PREGNANCY_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('maternal adaptation', () => {
  it('sits a term singleton on textbook values', () => {
    const d = settle(PREGNANCY_PRESETS.normalTerm);
    expect(d.haemoglobinGPerDl).toBeGreaterThan(10.5);
    expect(d.haemoglobinGPerDl).toBeLessThan(12.3);
    expect(d.cardiacOutputIncreasePct).toBeGreaterThan(30);
    expect(d.paCO2MmHg).toBeGreaterThan(28);
    expect(d.paCO2MmHg).toBeLessThan(32);
    expect(d.creatinineMgDl).toBeLessThan(0.55);
    expect(d.serumSodiumMmolL).toBeGreaterThan(134);
    expect(d.classification).toBe('term singleton pregnancy');
  });

  it('keeps early pregnancy near baseline', () => {
    const d = settle(PREGNANCY_PRESETS.firstTrimester);
    expect(d.haemoglobinGPerDl).toBeGreaterThan(12.8);
    expect(d.paCO2MmHg).toBeGreaterThan(34);
    expect(d.fetalWeightG).toBeLessThan(60);
  });

  it('dilutes haemoglobin as gestation advances despite MORE red cells', () => {
    // These readouts derive from inputs directly, so a short settle suffices.
    const early = settle({ gestationalWeeks: 12 }, 40000).haemoglobinGPerDl;
    const late = settle({ gestationalWeeks: 32 }, 40000).haemoglobinGPerDl;
    expect(late).toBeLessThan(early);
    // The red cell MASS has actually risen — the fall is dilution.
    expect(settle({ gestationalWeeks: 32 }, 40000).redCellMassIncreasePct).toBeGreaterThan(
      settle({ gestationalWeeks: 12 }, 40000).redCellMassIncreasePct,
    );
  }, 20000);

  it('deepens the dilution and raises output further with twins', () => {
    const singleton = settle({ gestationalWeeks: 33 });
    const twin = settle(PREGNANCY_PRESETS.twins);
    expect(twin.haemoglobinGPerDl).toBeLessThan(singleton.haemoglobinGPerDl);
    expect(twin.cardiacOutputIncreasePct).toBeGreaterThan(singleton.cardiacOutputIncreasePct);
    expect(twin.classification).toBe('twin gestation');
  }, 20000);

  it('holds a compensated alkalosis at term (pH barely moved)', () => {
    const d = settle(PREGNANCY_PRESETS.normalTerm);
    expect(d.phArterial).toBeGreaterThan(7.4);
    expect(d.phArterial).toBeLessThan(7.47);
    expect(d.bicarbonateMmolL).toBeGreaterThan(19);
    expect(d.bicarbonateMmolL).toBeLessThan(22);
  });
});

describe('placental insufficiency', () => {
  it('raises pressure and SVR while restricting fetal growth', () => {
    const normalTerm = settle(PREGNANCY_PRESETS.normalTerm);
    const diseased = settle(PREGNANCY_PRESETS.preEclampsiaIugr);
    expect(diseased.meanArterialPressureMmHg).toBeGreaterThan(normalTerm.meanArterialPressureMmHg + 10);
    expect(diseased.svrChangePct).toBeGreaterThan(normalTerm.svrChangePct);
    expect(diseased.fetalWeightG).toBeLessThan(settle({ gestationalWeeks: 34 }, 40000).fetalWeightG * 0.8);
    expect(diseased.classification).toContain('IUGR');
  }, 20000);
});

describe('labour', () => {
  it('accelerates dilation through the Ferguson reflex and completes delivery', () => {
    const inputs = { ...DEFAULT_PREGNANCY_INPUTS, gestationalWeeks: 39 };
    let state = createInitialState();
    for (let t = 0; t < 1000; t += 0.2) state = step(state, inputs, 0.2).state;
    state = perturbStartLabour(state);

    let earlyRate = 0;
    for (let t = 0; t < 36000; t += 0.2) {
      state = step(state, inputs, 0.2).state;
      if (t === 7200) earlyRate = state.cervicalDilationCm;
    }
    const lateProgress = state.cervicalDilationCm;
    // Later dilation outpaces the first two hours: positive feedback.
    expect(lateProgress).toBeGreaterThan(earlyRate * 1.5);

    // Run to completion.
    for (let t = 0; t < 200000; t += 0.2) {
      if (!state.labourActive) break;
      state = step(state, inputs, 0.2).state;
    }
    expect(state.deliveredOverride).toBe(true);
  });
});

describe('the puerperium and lactation', () => {
  it('sustains milk supply only WITH suckling-driven prolactin', () => {
    const feeding = settle(PREGNANCY_PRESETS.postpartumFeeding, 700000);
    expect(feeding.progesteroneNgMl).toBeLessThan(15);
    expect(feeding.prolactinNgMl).toBeGreaterThan(60);
    expect(feeding.milkSupplyMlPerDay).toBeGreaterThan(400);
    expect(feeding.classification).toBe('postpartum: breastfeeding established');

    const notFeeding = settle(PREGNANCY_PRESETS.postpartumNoFeed);
    expect(notFeeding.prolactinNgMl).toBeLessThan(feeding.prolactinNgMl / 3);
    expect(notFeeding.milkSupplyMlPerDay).toBeLessThan(50);
  }, 30000);

  it('blocks lactogenesis until progesterone falls after delivery', () => {
    // Antenatal prolactin is primed but progesterone is high: no milk.
    const antenatal = settle(PREGNANCY_PRESETS.normalTerm);
    expect(antenatal.prolactinNgMl).toBeGreaterThan(100);
    expect(antenatal.milkSupplyMlPerDay).toBeLessThan(50);
  });

  it('fires an oxytocin let-down pulse with a feed', () => {
    const inputs = { ...DEFAULT_PREGNANCY_INPUTS, ...PREGNANCY_PRESETS.postpartumFeeding };
    let state = createInitialState();
    for (let t = 0; t < 5000; t += 0.2) state = step(state, inputs, 0.2).state;
    const before = computeDerived(state, inputs);
    const during = computeDerived(perturbFeedNow(state), inputs);
    expect(during.oxytocinRelative).toBeGreaterThan(before.oxytocinRelative + 10);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<PregnancyInputs>[] = [
      { gestationalWeeks: 4, placentalFunctionPct: 0 },
      { gestationalWeeks: 42, twinGestation: 1, placentalFunctionPct: 0 },
      { deliveredMode: 1, sucklingDrivePct: 100 },
      { baselineHaemoglobinGPerDl: 9, gestationalWeeks: 40, twinGestation: 1 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 60000);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
      expect(d.phArterial).toBeGreaterThan(7.3);
      expect(d.phArterial).toBeLessThan(7.55);
    }
  });
});

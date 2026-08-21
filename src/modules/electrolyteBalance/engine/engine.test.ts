import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbGiveInsulin, perturbSalineBolus, step } from './engine';
import { DEFAULT_ELECTROLYTE_INPUTS, ELECTROLYTE_PRESETS } from './presets';
import { BASELINE } from './constants';
import { correctedSodium, ecfVolume, serumSodium } from './fluidCompartments';
import type { ElectrolyteInputs, ElectrolyteState } from './types';

/** One simulated minute per step — fine enough for the fastest actuator (the 15-minute shift). */
const DT = 60;
const HOUR = 60;
const DAY = 1440;

function presetInputs(name: keyof typeof ELECTROLYTE_PRESETS): ElectrolyteInputs {
  return { ...DEFAULT_ELECTROLYTE_INPUTS, ...ELECTROLYTE_PRESETS[name] };
}

function run(inputs: ElectrolyteInputs, steps: number, from = createInitialState()): ElectrolyteState {
  let state = from;
  for (let i = 0; i < steps; i++) state = step(state, inputs, DT).state;
  return state;
}

function settle(inputs: ElectrolyteInputs, days = 5) {
  const state = run(inputs, DAY * days);
  return { state, derived: computeDerived(state, inputs) };
}

describe('fluidCompartments — the Edelman relation', () => {
  const naE = BASELINE.EXCHANGEABLE_SODIUM_MEQ;
  const kE = BASELINE.EXCHANGEABLE_POTASSIUM_MEQ;
  const tbw = BASELINE.TOTAL_BODY_WATER_L;
  const NORMAL_GLUCOSE = BASELINE.SERUM_GLUCOSE_MG_DL;

  it('gives a normal serum sodium and the familiar one-third / two-thirds split', () => {
    expect(serumSodium(naE, kE, tbw, NORMAL_GLUCOSE)).toBeCloseTo(140, 0);
    const ecf = ecfVolume(naE, kE, tbw, NORMAL_GLUCOSE);
    expect(ecf).toBeCloseTo(13.7, 1);
    expect(ecf / tbw).toBeCloseTo(1 / 3, 1);
  });

  it('collapses to (Na + K) / TBW whenever glucose is not an extra osmole', () => {
    // The compartment solve must not quietly perturb the relation the whole module is built on.
    for (const glucose of [0, 40, NORMAL_GLUCOSE, 100]) {
      expect(serumSodium(naE, kE, tbw, glucose)).toBeCloseTo((naE + kE) / tbw, 9);
    }
  });

  it('makes serum sodium fall when potassium is lost, with sodium untouched', () => {
    const depleted = serumSodium(naE, kE - 400, tbw, NORMAL_GLUCOSE);
    expect(depleted).toBeLessThan(serumSodium(naE, kE, tbw, NORMAL_GLUCOSE) - 8);
  });

  it('pulls water out of cells when glucose rises, diluting sodium without losing any', () => {
    const normal = ecfVolume(naE, kE, tbw, NORMAL_GLUCOSE);
    const hyperglycaemic = ecfVolume(naE, kE, tbw, 550);

    // Water crosses the membrane; it does not leave the body. The ECF gains exactly what the
    // ICF loses, and the sodium content is untouched — only the water holding it has changed.
    expect(hyperglycaemic).toBeGreaterThan(normal + 0.5);
    expect(tbw - hyperglycaemic).toBeLessThan(tbw - normal - 0.5);
    expect(serumSodium(naE, kE, tbw, 550)).toBeLessThan(133);
  });

  it('dilutes sodium at roughly the 1.6-2.4 mEq/L per 100 mg/dL seen clinically', () => {
    const normal = serumSodium(naE, kE, tbw, 100);
    for (const glucose of [300, 550, 800]) {
      const perHundred = ((normal - serumSodium(naE, kE, tbw, glucose)) / (glucose - 100)) * 100;
      expect(perHundred, `at glucose ${glucose}`).toBeGreaterThan(1.6);
      expect(perHundred, `at glucose ${glucose}`).toBeLessThan(2.4);
    }
  });

  it('corrects sodium for hyperglycaemia', () => {
    expect(correctedSodium(128, 100)).toBeCloseTo(128, 5);
    expect(correctedSodium(128, 600)).toBeCloseTo(136, 0);
  });

  it('brings the corrected sodium back to normal without double-counting the shift', () => {
    // The pair has to compose: the shift takes the sodium down, the bedside rule reads the same
    // displacement back up, and the learner sees a normal sodium underneath the hyperglycaemia.
    // Applying either half on top of an unshifted value would land this near 147 instead.
    //
    // The residual gap is the bedside rule's own approximation error — a flat 1.6 per 100 mg/dL
    // against a true displacement nearer 1.8-2.0 — so the correction mildly UNDERSHOOTS, and
    // does so more the higher the glucose. That is a property of the rule, not of the engine.
    let previousGap = 0;
    for (const glucose of [200, 300, 550, 800]) {
      const measured = serumSodium(naE, kE, tbw, glucose);
      const corrected = correctedSodium(measured, glucose);

      expect(measured, `measured at glucose ${glucose}`).toBeLessThan(140);
      expect(corrected, `corrected at glucose ${glucose}`).toBeGreaterThan(138);
      expect(corrected, `corrected at glucose ${glucose}`).toBeLessThan(140.5);
      // Whatever the residual, correcting must land far closer to normal than the raw value.
      expect(140 - corrected, `at glucose ${glucose}`).toBeLessThan((140 - measured) / 4);

      const gap = 140 - corrected;
      expect(gap, `undershoot should grow with glucose, at ${glucose}`).toBeGreaterThan(previousGap);
      previousGap = gap;
    }
  });
});

describe('engine — baseline steady state', () => {
  it('holds sodium, potassium and ECF volume within normal limits for a week', () => {
    const { derived } = settle(presetInputs('normal'), 7);

    expect(derived.serumSodiumMeqL).toBeGreaterThan(137);
    expect(derived.serumSodiumMeqL).toBeLessThan(143);
    expect(derived.serumPotassiumMeqL).toBeGreaterThan(3.5);
    expect(derived.serumPotassiumMeqL).toBeLessThan(4.5);
    expect(derived.ecfVolumeL).toBeGreaterThan(12.8);
    expect(derived.ecfVolumeL).toBeLessThan(14.6);
    expect(derived.ecfVolumeStatus).toBe('euvolemic');
    expect(derived.disorderClassification).toContain('normal limits');
  });

  it('keeps ~98% of body potassium inside cells', () => {
    const { derived } = settle(presetInputs('normal'));
    expect(derived.ecfPotassiumFraction).toBeGreaterThan(0.01);
    expect(derived.ecfPotassiumFraction).toBeLessThan(0.02);
  });
});

describe('engine — serum potassium is not total body potassium', () => {
  it('lets insulin lower the serum level without removing any potassium from the body', () => {
    const inputs = presetInputs('normal');
    const before = settle(inputs);

    const withInsulin: ElectrolyteInputs = { ...inputs, insulinLevel: 4 };
    const after = computeDerived(run(withInsulin, HOUR * 2, before.state), withInsulin);

    expect(after.serumPotassiumMeqL).toBeLessThan(before.derived.serumPotassiumMeqL - 0.4);
    // Not one milliequivalent has left the body.
    expect(after.totalBodyPotassiumMeq).toBeCloseTo(before.derived.totalBodyPotassiumMeq, -1);
    expect(after.transcellularShiftMeqPerDay).toBeGreaterThan(0);
  });

  it('drives potassium out of cells in acidaemia and back in with alkalosis', () => {
    const inputs = presetInputs('normal');
    const baseline = settle(inputs);
    const acidotic = computeDerived(run({ ...inputs, arterialPH: 7.1 }, HOUR * 3, baseline.state), { ...inputs, arterialPH: 7.1 });
    const alkalotic = computeDerived(run({ ...inputs, arterialPH: 7.55 }, HOUR * 3, baseline.state), { ...inputs, arterialPH: 7.55 });

    expect(acidotic.serumPotassiumMeqL).toBeGreaterThan(baseline.derived.serumPotassiumMeqL);
    expect(alkalotic.serumPotassiumMeqL).toBeLessThan(baseline.derived.serumPotassiumMeqL);
  });
});

describe('engine — hyperglycaemia moves water, not sodium', () => {
  const HYPERGLYCAEMIC = 550;

  it('drops the measured sodium the moment glucose rises, with no sodium and no water lost', () => {
    const inputs = presetInputs('normal');
    const baseline = settle(inputs);

    // Glucose is the ONLY thing that changes, and the reading is taken an hour later — far too
    // soon for the kidney or thirst to have moved any water into or out of the patient.
    const hyperglycaemic: ElectrolyteInputs = { ...inputs, serumGlucoseMgDl: HYPERGLYCAEMIC };
    const after = computeDerived(run(hyperglycaemic, HOUR, baseline.state), hyperglycaemic);

    expect(after.serumSodiumMeqL).toBeLessThan(baseline.derived.serumSodiumMeqL - 6);
    expect(after.serumSodiumMeqL).toBeLessThan(135);

    // Nothing left the body. Total body water is where it was, and so is the sodium content.
    expect(after.totalBodyWaterL).toBeCloseTo(baseline.derived.totalBodyWaterL, 1);
    expect(after.ecfVolumeL + after.icfVolumeL).toBeCloseTo(after.totalBodyWaterL, 6);

    // The water simply crossed the membrane: the ECF gained what the ICF lost.
    const ecfGain = after.ecfVolumeL - baseline.derived.ecfVolumeL;
    const icfLoss = baseline.derived.icfVolumeL - after.icfVolumeL;
    expect(ecfGain).toBeGreaterThan(0.5);
    expect(icfLoss).toBeCloseTo(ecfGain, 1);
  });

  it('recovers a normal sodium once the reading is corrected for the glucose', () => {
    const inputs = presetInputs('normal');
    const baseline = settle(inputs);
    const hyperglycaemic: ElectrolyteInputs = { ...inputs, serumGlucoseMgDl: HYPERGLYCAEMIC };
    const after = computeDerived(run(hyperglycaemic, HOUR, baseline.state), hyperglycaemic);

    // The readouts the learner compares side by side. Before the compartment model carried the
    // glucose term these moved in OPPOSITE directions — the measured sodium sat at 140 while the
    // correction pushed the corrected value to 147 — and taught precisely the wrong lesson.
    expect(after.correctedSodiumMeqL).toBeGreaterThan(after.serumSodiumMeqL + 6);
    expect(after.correctedSodiumMeqL).toBeGreaterThan(137);
    expect(after.correctedSodiumMeqL).toBeLessThan(baseline.derived.correctedSodiumMeqL + 0.5);
    expect(after.disorderClassification).toContain('dilution by glucose');
  });

  it('leaves both readouts alone at a normal glucose', () => {
    const inputs = presetInputs('normal');
    const { derived } = settle(inputs);
    expect(derived.correctedSodiumMeqL).toBeCloseTo(derived.serumSodiumMeqL, 6);
    expect(derived.serumSodiumMeqL).toBeGreaterThan(138);
  });
});

describe('engine — DKA: the trap', () => {
  it('shows a high serum potassium sitting on a depleted total body store', () => {
    const { derived } = settle(presetInputs('dka'));

    expect(derived.serumPotassiumMeqL).toBeGreaterThan(5);
    // Meanwhile the body has lost potassium, not gained it.
    expect(derived.totalBodyPotassiumMeq).toBeLessThan(BASELINE.EXCHANGEABLE_POTASSIUM_MEQ * 0.95);
    // And the sodium looks low until it is corrected for the glucose.
    expect(derived.serumSodiumMeqL).toBeLessThan(133);
    expect(derived.correctedSodiumMeqL).toBeGreaterThan(derived.serumSodiumMeqL + 5);
    expect(derived.disorderClassification).toContain('Non-hypotonic');
  });

  it('drops the sodium the instant the preset is applied, before any water has been lost', () => {
    // Selecting a preset in the app changes the inputs without resetting the patient, so this
    // is what a learner actually sees when they click DKA: the sodium falls at once, purely
    // because water left the cells, and the corrected value says so.
    const baseline = settle(presetInputs('normal'));
    const dka = presetInputs('dka');
    const after = computeDerived(run(dka, HOUR, baseline.state), dka);

    expect(after.serumSodiumMeqL).toBeLessThan(135);
    expect(after.correctedSodiumMeqL).toBeGreaterThan(137);
    expect(after.totalBodyWaterL).toBeCloseTo(baseline.derived.totalBodyWaterL, 1);
    expect(after.icfVolumeL).toBeLessThan(baseline.derived.icfVolumeL - 0.5);
    // The other half of the trap is already showing: no insulin and a pH of 7.1 have pushed
    // potassium out of cells within the hour.
    expect(after.serumPotassiumMeqL).toBeGreaterThan(6);
  });

  it('crashes the serum potassium once insulin is given, exposing the real deficit', () => {
    const dka = settle(presetInputs('dka'));
    const treated: ElectrolyteInputs = { ...presetInputs('dka'), insulinLevel: 3, serumGlucoseMgDl: 140, arterialPH: 7.34 };
    const after = computeDerived(run(treated, HOUR * 4, perturbGiveInsulin(dka.state)), treated);

    expect(after.serumPotassiumMeqL).toBeLessThan(3.5);
    expect(after.serumPotassiumMeqL).toBeLessThan(dka.derived.serumPotassiumMeqL - 2);
    expect(after.ecgRisk).toContain('U waves');
  });
});

describe('engine — sodium is a water measurement', () => {
  it('lowers serum sodium when pure water is added, while both compartments expand', () => {
    const inputs = presetInputs('normal');
    const baseline = settle(inputs);
    const flooded: ElectrolyteInputs = { ...inputs, waterIntake: 9 };
    const after = computeDerived(run(flooded, DAY * 2, baseline.state), flooded);

    expect(after.serumSodiumMeqL).toBeLessThan(baseline.derived.serumSodiumMeqL - 1);
    expect(after.totalBodyWaterL).toBeGreaterThan(baseline.derived.totalBodyWaterL);
    expect(after.icfVolumeL).toBeGreaterThan(baseline.derived.icfVolumeL);
    expect(after.ecfVolumeL).toBeGreaterThan(baseline.derived.ecfVolumeL);
  });

  it('raises serum sodium when the fluid lost is hypotonic, as in sweating', () => {
    const inputs: ElectrolyteInputs = { ...presetInputs('normal'), extrarenalLoss: 'sweating', waterIntake: 1 };
    const { derived } = settle(inputs, 3);
    expect(derived.serumSodiumMeqL).toBeGreaterThan(142);
  });

  it('does not move serum sodium much when isotonic saline is given', () => {
    const inputs = presetInputs('normal');
    const baseline = settle(inputs);
    const after = computeDerived(perturbSalineBolus(baseline.state, 2), inputs);

    expect(Math.abs(after.serumSodiumMeqL - baseline.derived.serumSodiumMeqL)).toBeLessThan(1.5);
    // It all stays in the ECF, which is exactly why it is the resuscitation fluid.
    expect(after.ecfVolumeL).toBeGreaterThan(baseline.derived.ecfVolumeL + 1);
  });
});

describe('engine — SIADH versus hypovolaemic hyponatraemia', () => {
  it('makes SIADH euvolaemic with inappropriately concentrated urine and negative free water clearance', () => {
    const { derived } = settle(presetInputs('siadh'), 6);

    expect(derived.serumSodiumMeqL).toBeLessThan(128);
    expect(derived.tonicity).toBe('hypotonic');
    expect(derived.ecfVolumeStatus).toBe('euvolemic');
    expect(derived.urineOsmolality).toBeGreaterThan(300);
    expect(derived.freeWaterClearanceLPerDay).toBeLessThan(0);
    expect(derived.disorderClassification).toContain('SIADH');
  });

  it('reaches the same low sodium by the opposite route when the patient is volume-depleted', () => {
    const siadh = settle(presetInputs('siadh'), 6);
    const hypovolemic = settle(presetInputs('hypovolemicHyponatremia'), 6);

    expect(hypovolemic.derived.serumSodiumMeqL).toBeLessThan(130);
    expect(hypovolemic.derived.ecfVolumeStatus).toBe('hypovolemic');
    // The distinguishing feature: aldosterone and ADH are both high because volume, not
    // tonicity, is driving them — so the ADH here is entirely appropriate.
    expect(hypovolemic.derived.aldosteroneLevel).toBeGreaterThan(siadh.derived.aldosteroneLevel + 0.5);
    expect(hypovolemic.derived.adhLevel).toBeGreaterThan(0.8);
    expect(hypovolemic.derived.disorderClassification).toContain('hypovolaemic');
  });

  it('lets water restriction correct SIADH, since the kidney can still excrete some free water', () => {
    const siadh = settle(presetInputs('siadh'), 6);
    const restricted: ElectrolyteInputs = { ...presetInputs('siadh'), waterIntake: 0.6 };
    const after = computeDerived(run(restricted, DAY * 3, siadh.state), restricted);

    expect(after.serumSodiumMeqL).toBeGreaterThan(siadh.derived.serumSodiumMeqL + 3);
  });
});

describe('engine — correcting too fast', () => {
  it('flags demyelination risk when hypertonic saline drives sodium up faster than 8 mEq/L/day', () => {
    const siadh = settle(presetInputs('siadh'), 6);
    expect(computeDerived(siadh.state, presetInputs('siadh')).demyelinationRisk).toBe(0);

    // The classic overcorrection: hypertonic saline given at the same moment the underlying
    // stimulus resolves. ADH switches off, the kidney dumps free water, and the two effects add.
    const aggressive: ElectrolyteInputs = {
      ...presetInputs('siadh'),
      adhMode: 'regulated',
      infusion: 'hypertonic3',
      waterIntake: 0.5,
    };
    const after = computeDerived(run(aggressive, DAY, siadh.state), aggressive);

    expect(after.sodiumChangeRateMeqLPerDay).toBeGreaterThan(8);
    expect(after.demyelinationRisk).toBeGreaterThan(0.1);
  });

  it('does not flag risk when the same disorder is corrected slowly', () => {
    const siadh = settle(presetInputs('siadh'), 6);
    const gentle: ElectrolyteInputs = { ...presetInputs('siadh'), waterIntake: 1.2 };
    const after = computeDerived(run(gentle, DAY * 2, siadh.state), gentle);

    expect(after.serumSodiumMeqL).toBeGreaterThan(siadh.derived.serumSodiumMeqL);
    expect(after.demyelinationRisk).toBeLessThan(0.1);
  });
});

describe('engine — renal potassium handling', () => {
  it('raises serum potassium and drops the TTKG as GFR fails', () => {
    const normal = settle(presetInputs('normal'));
    const ckd = settle(presetInputs('ckdHyperkalemia'), 10);

    expect(ckd.derived.serumPotassiumMeqL).toBeGreaterThan(normal.derived.serumPotassiumMeqL + 0.8);
    // A low TTKG in the face of hyperkalaemia says the kidney is the problem.
    expect(ckd.derived.transtubularKGradient).toBeLessThan(normal.derived.transtubularKGradient);
  });

  it('wastes potassium on a loop diuretic and retains it on a potassium-sparing one', () => {
    const loop = settle(presetInputs('loopDiuretic'), 7);
    const sparing = settle({ ...presetInputs('normal'), diuretic: 'potassiumSparing' }, 7);

    expect(loop.derived.serumPotassiumMeqL).toBeLessThan(3.8);
    expect(loop.derived.totalBodyPotassiumMeq).toBeLessThan(BASELINE.EXCHANGEABLE_POTASSIUM_MEQ * 0.9);
    // Renal wasting, not poor intake — the TTKG is inappropriately high for the low serum level.
    expect(loop.derived.transtubularKGradient).toBeGreaterThan(7);

    expect(sparing.derived.serumPotassiumMeqL).toBeGreaterThan(4.2);
  });

  it("wastes potassium through the KIDNEY in vomiting, not through the vomitus", () => {
    const { derived } = settle(presetInputs('vomiting'), 7);
    const lostInVomitus = 1.5 * 10 * 7;

    expect(derived.serumPotassiumMeqL).toBeLessThan(3.6);
    const totalLost = BASELINE.EXCHANGEABLE_POTASSIUM_MEQ - derived.totalBodyPotassiumMeq;
    expect(totalLost).toBeGreaterThan(lostInVomitus);
  });

  it('retains sodium and wastes potassium in hyperaldosteronism, but escapes before oedema', () => {
    const { derived } = settle(presetInputs('hyperaldosteronism'), 10);

    expect(derived.serumPotassiumMeqL).toBeLessThan(3.5);
    // Aldosterone escape: pressure natriuresis caps the volume expansion, which is why Conn's
    // syndrome causes hypertension and hypokalaemia but not oedema.
    expect(derived.ecfVolumeL).toBeLessThan(BASELINE.ECF_VOLUME_L * 1.15);
  });
});

describe('engine — ADH extremes', () => {
  it('produces enormous dilute urine in diabetes insipidus, held in check only by thirst', () => {
    const { derived } = settle(presetInputs('diabetesInsipidus'), 4);

    expect(derived.urineVolumeLPerDay).toBeGreaterThan(6);
    expect(derived.urineOsmolality).toBeLessThan(150);
    expect(derived.freeWaterClearanceLPerDay).toBeGreaterThan(0);
    expect(derived.thirstDrive).toBeGreaterThan(0.2);
    expect(derived.disorderClassification).toContain('diabetes insipidus');
  });

  it('becomes rapidly and dangerously hypernatraemic when thirst cannot keep up', () => {
    const noWater: ElectrolyteInputs = { ...presetInputs('diabetesInsipidus'), waterIntake: 0 };
    const withThirst = settle(presetInputs('diabetesInsipidus'), 3);

    // The same kidney defect, with and without access to water.
    let state = createInitialState();
    for (let i = 0; i < DAY * 3; i++) {
      state = step(state, { ...noWater, waterIntake: 0 }, DT).state;
      state = { ...state, thirstDrive: 0 };
    }
    const parched = computeDerived(state, noWater);

    expect(parched.serumSodiumMeqL).toBeGreaterThan(withThirst.derived.serumSodiumMeqL + 10);
    expect(parched.serumSodiumMeqL).toBeGreaterThan(160);
  });

  it('lets a normal kidney handle a large water intake until dilution capacity is exhausted', () => {
    const moderate = settle({ ...presetInputs('normal'), waterIntake: 6 }, 4);
    const extreme = settle(presetInputs('polydipsia'), 4);

    expect(moderate.derived.serumSodiumMeqL).toBeGreaterThan(136);
    expect(extreme.derived.serumSodiumMeqL).toBeLessThan(moderate.derived.serumSodiumMeqL);
    expect(extreme.derived.urineOsmolality).toBeLessThan(120);
  });
});

describe('engine — numerical robustness', () => {
  it('stays finite and within physiological bounds across extreme input combinations', () => {
    const extremes: ElectrolyteInputs[] = [];
    for (const adhMode of ['regulated', 'inappropriate', 'deficient'] as const) {
      for (const diuretic of ['none', 'loop', 'thiazide', 'potassiumSparing'] as const) {
        for (const extrarenalLoss of ['none', 'diarrhoea'] as const) {
          for (const gfrFraction of [0.05, 1.2]) {
            for (const arterialPH of [6.9, 7.6]) {
              extremes.push({
                ...DEFAULT_ELECTROLYTE_INPUTS,
                adhMode,
                diuretic,
                extrarenalLoss,
                gfrFraction,
                arterialPH,
                waterIntake: 12,
                sodiumIntake: 400,
                potassiumIntake: 200,
                aldosteroneDrive: 3,
                serumGlucoseMgDl: 800,
                insulinLevel: 5,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const state = run(inputs, DAY * 3);
      const derived = computeDerived(state, inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      // Wide bounds: these input combinations are deliberately absurd (12 L/day of water with
      // SIADH, for instance), so the point is that the model stays coherent, not clinical.
      expect(derived.serumSodiumMeqL).toBeGreaterThan(60);
      expect(derived.serumSodiumMeqL).toBeLessThan(230);
      expect(derived.serumPotassiumMeqL).toBeGreaterThan(0);
      expect(derived.ecfVolumeL).toBeGreaterThan(0);
      expect(derived.icfVolumeL).toBeGreaterThan(0);
      expect(state.ecfPotassiumMeq).toBeLessThanOrEqual(state.exchangeablePotassiumMeq);
    }
  });
});

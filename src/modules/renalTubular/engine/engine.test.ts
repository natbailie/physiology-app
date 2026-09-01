import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbWaterDeprivation, step } from './engine';
import { DEFAULT_RENAL_TUBULAR_INPUTS, RENAL_TUBULAR_PRESETS } from './presets';
import { PLASMA, TUBULE } from './constants';
import type { RenalTubularInputs, RenalTubularState } from './types';

function settle(inputs: RenalTubularInputs, seconds = 20000, dt = 1): RenalTubularState {
  let state = createInitialState();
  for (let t = 0; t < seconds; t += dt) state = step(state, inputs, dt).state;
  return state;
}

function settled(name: keyof typeof RENAL_TUBULAR_PRESETS, overrides: Partial<RenalTubularInputs> = {}) {
  const inputs: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, ...RENAL_TUBULAR_PRESETS[name], ...overrides };
  return computeDerived(settle(inputs), inputs);
}

describe('engine — the nephron osmolality profile', () => {
  it('walks the textbook sequence: iso-osmotic proximal, concentrating descending limb, diluting ascending limb', () => {
    const derived = settled('normal');
    const [bowmans, proximal, descending, ascending, distal] = derived.segments;

    // Proximal tubule reabsorbs most of the volume WITHOUT changing osmolality.
    expect(proximal!.osmolality).toBeCloseTo(bowmans!.osmolality, 0);
    expect(proximal!.flowFraction).toBeLessThan(0.4);

    // Descending limb concentrates toward the medullary interstitium.
    expect(descending!.osmolality).toBeGreaterThan(proximal!.osmolality * 2);

    // Thick ascending limb is the diluting segment — fluid leaves HYPOTONIC to plasma...
    expect(ascending!.osmolality).toBeLessThan(TUBULE.FILTRATE_OSMOLALITY);
    // ...and, being water-impermeable, without losing any volume.
    expect(ascending!.flowFraction).toBeCloseTo(descending!.flowFraction, 5);

    // Distal tubule dilutes further still.
    expect(distal!.osmolality).toBeLessThan(ascending!.osmolality);
  });

  it('never produces NaN/Infinity and keeps plasma osmolality within its clamps', () => {
    const extremes: RenalTubularInputs[] = [];
    for (const adhSecretionCapacity of [0, 1.5]) {
      for (const collectingDuctADHSensitivity of [0, 1.5]) {
        for (const loopDiureticDose of [0, 100]) {
          for (const thiazideDose of [0, 100]) {
            for (const waterIntakeRate of [0, 300]) {
              extremes.push({
                ...DEFAULT_RENAL_TUBULAR_INPUTS,
                adhSecretionCapacity,
                collectingDuctADHSensitivity,
                loopDiureticDose,
                thiazideDose,
                waterIntakeRate,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const derived = computeDerived(settle(inputs, 8000, 2), inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      for (const segment of derived.segments) {
        expect(Number.isFinite(segment.osmolality)).toBe(true);
        expect(segment.flowFraction).toBeGreaterThanOrEqual(0);
        expect(segment.flowFraction).toBeLessThanOrEqual(1);
      }
      expect(derived.plasmaOsmolality).toBeGreaterThanOrEqual(PLASMA.MIN_MOSM - 1e-6);
      expect(derived.plasmaOsmolality).toBeLessThanOrEqual(PLASMA.MAX_MOSM + 1e-6);
    }
  });
});

describe('engine — ADH and the osmoreceptor loop', () => {
  it('raises ADH and concentrates the urine in response to water deprivation', () => {
    const inputs: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS };
    const baseline = settle(inputs);
    const baselineDerived = computeDerived(baseline, inputs);

    // Sampled while the response is still active — the loop is fast enough that by several
    // hundred seconds it has already corrected the osmolality and ADH has fallen back.
    let state = perturbWaterDeprivation(baseline);
    for (let t = 0; t < 90; t++) state = step(state, inputs, 1).state;
    const responded = computeDerived(state, inputs);

    expect(responded.adhLevel).toBeGreaterThan(baselineDerived.adhLevel);
    expect(responded.finalUrineOsmolality).toBeGreaterThan(baselineDerived.finalUrineOsmolality);

    // And the loop then restores plasma osmolality back toward its setpoint.
    for (let t = 0; t < 4000; t++) state = step(state, inputs, 1).state;
    expect(computeDerived(state, inputs).plasmaOsmolality).toBeLessThan(responded.plasmaOsmolality);
  });

  it('excretes dilute urine with positive free water clearance when water intake is high', () => {
    const highIntake: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, waterIntakeRate: 300 };
    const derived = computeDerived(settle(highIntake), highIntake);

    expect(derived.freeWaterClearance).toBeGreaterThan(0);
    expect(derived.finalUrineOsmolality).toBeLessThan(derived.plasmaOsmolality);
  });
});

describe('engine — diabetes insipidus: central vs nephrogenic', () => {
  it('both present identically — dilute urine despite rising plasma osmolality', () => {
    const central = settled('centralDI');
    const nephrogenic = settled('nephrogenicDI');
    const normal = settled('normal');

    for (const di of [central, nephrogenic]) {
      expect(di.finalUrineOsmolality).toBeLessThan(normal.finalUrineOsmolality);
      expect(di.plasmaOsmolality).toBeGreaterThan(normal.plasmaOsmolality);
    }
  });

  it('distinguishes them by ADH level: absent in central, maximal but useless in nephrogenic', () => {
    const central = settled('centralDI');
    const nephrogenic = settled('nephrogenicDI');

    expect(central.adhLevel).toBeLessThan(0.1);
    // The nephrogenic kidney senses the hypertonicity perfectly and pours out ADH — the duct
    // simply cannot act on it.
    expect(nephrogenic.adhLevel).toBeGreaterThan(0.9);
  });

  it('desmopressin concentrates the urine in central DI but not in nephrogenic DI — the diagnostic step', () => {
    const centralBefore = settled('centralDI');
    const centralAfter = settled('centralDI', { exogenousADH: 120 });
    const nephrogenicBefore = settled('nephrogenicDI');
    const nephrogenicAfter = settled('nephrogenicDI', { exogenousADH: 120 });

    expect(centralAfter.finalUrineOsmolality).toBeGreaterThan(centralBefore.finalUrineOsmolality * 4);
    expect(nephrogenicAfter.finalUrineOsmolality).toBeLessThan(nephrogenicBefore.finalUrineOsmolality * 1.3);
  });
});

describe('engine — SIADH', () => {
  it('produces inappropriately concentrated urine and dilutional hypo-osmolality', () => {
    const normal = settled('normal');
    const siadh = settled('siadh');

    expect(siadh.finalUrineOsmolality).toBeGreaterThan(normal.finalUrineOsmolality * 3);
    expect(siadh.plasmaOsmolality).toBeLessThan(normal.plasmaOsmolality);
    expect(siadh.freeWaterClearance).toBeLessThan(0);
  });
});

describe('engine — diuretics by nephron site', () => {
  it('a loop diuretic washes out the medullary gradient; a thiazide preserves it', () => {
    const normal = settled('normal');
    const loop = settled('loopDiuretic');
    const thiazide = settled('thiazide');

    expect(loop.medullaryGradientStrength).toBeLessThan(0.25);
    // A thiazide acts distal to the concentrating machinery, so the gradient survives intact.
    expect(thiazide.medullaryGradientStrength).toBeGreaterThan(normal.medullaryGradientStrength * 0.85);
    expect(thiazide.medullaryGradientStrength).toBeGreaterThan(loop.medullaryGradientStrength * 3);
  });

  it('a loop diuretic produces a much larger diuresis than a thiazide', () => {
    const loop = settled('loopDiuretic');
    const thiazide = settled('thiazide');

    expect(loop.urineFlowRateMLPerMin).toBeGreaterThan(thiazide.urineFlowRateMLPerMin * 2);
  });

  it('a washed-out medulla blunts concentrating ability even when ADH is given', () => {
    const loopWithADH = settled('loopDiuretic', { exogenousADH: 120 });
    const normalWithADH = settled('normal', { exogenousADH: 120 });

    expect(loopWithADH.finalUrineOsmolality).toBeLessThan(normalWithADH.finalUrineOsmolality * 0.5);
  });
});

describe('engine — tubuloglomerular feedback', () => {
  it('reduces GFR when distal NaCl delivery is high, and does so less when feedback is weakened', () => {
    const strong: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, gfrMLPerMin: 180, maculaDensaFeedbackStrength: 1.5 };
    const weak: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, gfrMLPerMin: 180, maculaDensaFeedbackStrength: 0 };

    const strongDerived = computeDerived(settle(strong), strong);
    const weakDerived = computeDerived(settle(weak), weak);

    expect(strongDerived.gfrAfterTGF).toBeLessThan(weakDerived.gfrAfterTGF);
    expect(weakDerived.gfrAfterTGF).toBeCloseTo(180, 0);
  });
});

// --- The acid arm: baselines and the three RTAs ---

function settledLong(name: keyof typeof RENAL_TUBULAR_PRESETS, overrides: Partial<RenalTubularInputs> = {}) {
  // Bicarbonate and creatinine move on a timescale of hours; give them simulated days.
  const inputs: RenalTubularInputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, ...RENAL_TUBULAR_PRESETS[name], ...overrides };
  return computeDerived(settle(inputs, 90000), inputs);
}

describe('engine — acid-base baseline', () => {
  it('holds serum bicarbonate near 24 while excreting roughly the daily acid load', () => {
    const derived = settledLong('normal');

    expect(derived.serumBicarbonateMeqL).toBeGreaterThan(22);
    expect(derived.serumBicarbonateMeqL).toBeLessThan(26);
    expect(derived.netAcidExcretionMeqPerDay).toBeGreaterThan(60);
    expect(derived.netAcidExcretionMeqPerDay).toBeLessThan(85);
  });

  it('keeps urine mildly acidic and the urine anion gap negative in health', () => {
    const derived = settledLong('normal');

    expect(derived.urinePH).toBeGreaterThan(5.8);
    expect(derived.urinePH).toBeLessThan(6.8);
    expect(derived.urineAnionGapMeqL).toBeLessThan(-10);
    expect(derived.serumPotassiumEstimateMeqL).toBeGreaterThan(3.8);
    expect(derived.serumPotassiumEstimateMeqL).toBeLessThan(4.4);
  });
});

describe('engine — the three renal tubular acidoses separate on three facts', () => {
  it('distal RTA cannot acidify the urine however low its bicarbonate falls', () => {
    const derived = settledLong('distalRTA');

    expect(derived.serumBicarbonateMeqL).toBeLessThan(16);
    // THE diagnostic fact: systemic acidaemia with an inappropriately ALKALINE urine.
    expect(derived.urinePH).toBeGreaterThan(7.0);
    // And a POSITIVE urine anion gap, which is the finding that names the lesion.
    //
    // This assertion used to read `toBeLessThan(-10)`, with a comment reasoning that
    // ammoniagenesis still works under normal aldosterone tone. Production is not excretion:
    // ammonium reaches the urine only if distal H+ secretion traps the diffused NH3 as NH4+, and
    // that trapping is precisely what fails here. So urinary ammonium falls, the unmeasured cation
    // disappears, chloride dominates, and the gap turns positive — which is the whole reason the
    // gap is measured in a hyperchloraemic acidosis.
    expect(derived.urineAnionGapMeqL).toBeGreaterThan(0);
    // Potassium is wasted by the same distal failure — but not catastrophically.
    expect(derived.serumPotassiumEstimateMeqL).toBeLessThan(4.6);
  });

  it('proximal RTA self-limits at its reclaim threshold and CAN still acidify urine', () => {
    const derived = settledLong('proximalRTA');

    expect(derived.serumBicarbonateMeqL).toBeGreaterThan(10);
    expect(derived.serumBicarbonateMeqL).toBeLessThan(16);
    // The pump works: given the lower serum bicarbonate the urine can still be made acidic.
    expect(derived.urinePH).toBeLessThan(6.0);
    // Massive distal solute delivery wastes potassium despite normal aldosterone.
    expect(derived.serumPotassiumEstimateMeqL).toBeLessThan(3.8);
    expect(derived.urineAnionGapMeqL).toBeLessThan(-10);
  });

  it('type 4 RTA retains potassium with a positive anion gap yet an ACID urine', () => {
    const derived = settledLong('type4RTA');

    expect(derived.serumPotassiumEstimateMeqL).toBeGreaterThan(5.5);
    expect(derived.serumBicarbonateMeqL).toBeGreaterThan(14);
    expect(derived.serumBicarbonateMeqL).toBeLessThan(19);
    // Starved ammonium supply: the lab fingerprint that the acidosis is the kidney's own.
    expect(derived.urineAnionGapMeqL).toBeGreaterThan(0);
    // The paradox: H+ secreted into an unbuffered lumen drops the pH below 5.5 anyway.
    expect(derived.urinePH).toBeLessThan(5.5);
  });

  it('acetazolamide produces its classical alkaline urine alongside a falling bicarbonate', () => {
    const derived = settledLong('acetazolamide');

    expect(derived.serumBicarbonateMeqL).toBeLessThan(19);
    expect(derived.urinePH).toBeGreaterThan(6.8);
  });
});

// --- Clearance and the AKI differentiation ---

describe('engine — clearance panel', () => {
  it('reads creatinine clearance slightly above GFR, RPF near 600, FF near one fifth', () => {
    const derived = settled('normal');

    expect(derived.creatinineClearanceMLMin).toBeGreaterThan(derived.gfrAfterTGF);
    expect(derived.creatinineClearanceMLMin).toBeLessThan(derived.gfrAfterTGF * 1.2);
    expect(derived.renalPlasmaFlowMLMin).toBeGreaterThan(500);
    expect(derived.renalPlasmaFlowMLMin).toBeLessThan(700);
    expect(derived.filtrationFractionPct).toBeGreaterThan(15);
    expect(derived.filtrationFractionPct).toBeLessThan(22);
  });

  it('a rising creatinine tracks a falling clearance across simulated hours, not instantly', () => {
    const inputs = { ...DEFAULT_RENAL_TUBULAR_INPUTS, ...RENAL_TUBULAR_PRESETS.preRenalAzotaemia };
    let state = createInitialState();
    let early = computeDerived(state, inputs).serumCreatinineMgDl;
    for (let t = 0; t < 40000; t += 1) state = step(state, inputs, 1).state;
    const late = computeDerived(state, inputs).serumCreatinineMgDl;

    // The lag is the clinical point: today's creatinine reflects yesterday's kidney.
    expect(early).toBeCloseTo(1, 1);
    expect(late).toBeGreaterThan(2);
  });

  it('prerenal azotaemia spares sodium (FENa < 1%) while creatinine climbs', () => {
    const derived = settledLong('preRenalAzotaemia');

    expect(derived.fractionalExcretionNaPct).toBeLessThan(1);
    expect(derived.urineSodiumMeqL).toBeLessThan(20);
    expect(derived.serumCreatinineMgDl).toBeGreaterThan(2);
    // Intact tubules + high aldosterone = vigorously concentrated urine.
    expect(derived.finalUrineOsmolality).toBeGreaterThan(450);
  });

  it('acute tubular necrosis wastes sodium and settles into isosthenuria', () => {
    const prerenal = settledLong('preRenalAzotaemia');
    const atn = settledLong('atn');

    expect(atn.fractionalExcretionNaPct).toBeGreaterThan(2);
    expect(atn.urineSodiumMeqL).toBeGreaterThan(prerenal.urineSodiumMeqL * 3);
    // Dead concentrating machinery: the urine drifts toward plasma osmolality...
    expect(atn.finalUrineOsmolality).toBeLessThan(330);
    // ...while the creatinine rises just as it does prerenally — which is WHY the urine,
    // not the creatinine, tells the two apart.
    expect(atn.serumCreatinineMgDl).toBeGreaterThan(1.8);
  });
});

// --- The rest of the diuretic map ---

describe('engine — diuretic sites beyond the loop and the distal tubule', () => {
  it('amiloride spares potassium-losing by blocking ENaC directly, without touching the medulla', () => {
    const normal = settledLong('normal');
    const amiloride = settledLong('amiloride');
    const loop = settledLong('loopDiuretic');

    // K+-sparing: serum potassium rises rather than falls...
    expect(amiloride.serumPotassiumEstimateMeqL).toBeGreaterThan(normal.serumPotassiumEstimateMeqL + 1);
    // ...the medullary gradient survives (uOsm can still concentrate)...
    expect(amiloride.medullaryGradientStrength).toBeGreaterThan(loop.medullaryGradientStrength * 2);
    // ...and a mild acidosis follows, because the same potential was secreting H+.
    expect(amiloride.serumBicarbonateMeqL).toBeLessThan(normal.serumBicarbonateMeqL);
  });

  it('an SGLT2 inhibitor and mannitol both diurese osmotically without transporter blockade', () => {
    const normal = settled('normal');
    const sglt2 = settled('sglt2Inhibitor');
    const mannitol = settled('mannitol');

    expect(sglt2.urineFlowRateMLPerMin).toBeGreaterThan(normal.urineFlowRateMLPerMin * 1.05);
    expect(mannitol.urineFlowRateMLPerMin).toBeGreaterThan(normal.urineFlowRateMLPerMin * 1.2);
    // Neither washes out the medulla the way a loop diuretic's massive flow does.
    const loop = settled('loopDiuretic');
    expect(mannitol.medullaryGradientStrength).toBeGreaterThan(loop.medullaryGradientStrength * 1.5);
  });

  it('tolvaptan causes water diuresis that extra desmopressin cannot overcome', () => {
    const blocked = settledLong('tolvaptan');
    const blockedHarder = settledLong('tolvaptan', { exogenousADH: 150 });

    // The V2 receptor is the bottleneck, so MORE hormone changes nothing — this is what
    // distinguishes pharmacological receptor blockade from either type of DI.
    expect(blocked.finalUrineOsmolality).toBeLessThan(250);
    expect(blockedHarder.finalUrineOsmolality).toBeLessThan(blocked.finalUrineOsmolality * 1.1);
    // And it is pure water loss: no natriuresis, unlike every diuretic above.
    expect(blocked.fractionalExcretionNaPct).toBeLessThan(1);
  });
});

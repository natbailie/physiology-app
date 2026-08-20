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

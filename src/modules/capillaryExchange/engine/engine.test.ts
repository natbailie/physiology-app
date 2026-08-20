import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbAlbuminInfusion, step } from './engine';
import { CAPILLARY_PRESETS, DEFAULT_CAPILLARY_INPUTS, bedDefaults } from './presets';
import { BASELINE, TISSUE_BEDS } from './constants';
import { capillaryPressure } from './starlingForces';
import { landisPappenheimer } from './oncoticPressure';
import type { CapillaryInputs, CapillaryState } from './types';

/** Thirty simulated seconds per step. */
const DT = 30;
const HOUR = 120;

function presetInputs(name: keyof typeof CAPILLARY_PRESETS): CapillaryInputs {
  return { ...DEFAULT_CAPILLARY_INPUTS, ...CAPILLARY_PRESETS[name] };
}

function run(inputs: CapillaryInputs, steps: number, from = createInitialState()): CapillaryState {
  let state = from;
  for (let i = 0; i < steps; i++) state = step(state, inputs, DT).state;
  return state;
}

function settle(inputs: CapillaryInputs, hours = 168) {
  const state = run(inputs, HOUR * hours);
  return { state, derived: computeDerived(state, inputs) };
}

describe('oncoticPressure — Landis-Pappenheimer', () => {
  it('is markedly non-linear, so halving the protein more than halves the pressure', () => {
    const full = landisPappenheimer(7.5);
    const half = landisPappenheimer(3.75);

    expect(full).toBeGreaterThan(26);
    expect(full).toBeLessThan(31);
    expect(half).toBeLessThan(full / 2);
  });
});

describe('starlingForces — where capillary pressure comes from', () => {
  it('transmits venous pressure to the capillary far more completely than arterial pressure', () => {
    const pv = BASELINE.PLASMA_VOLUME_ML;
    const base = capillaryPressure(95, 12, 1, 'systemic', pv, pv);
    const raisedArterial = capillaryPressure(115, 12, 1, 'systemic', pv, pv);
    const raisedVenous = capillaryPressure(95, 32, 1, 'systemic', pv, pv);

    expect(base).toBeCloseTo(BASELINE.CAPILLARY_PRESSURE_MMHG, 0);
    // A 20 mmHg rise on each side: the venous one lands on the capillary, the arterial one
    // is absorbed by the arteriole. This asymmetry is why heart failure causes oedema and
    // hypertension does not.
    expect(raisedArterial - base).toBeLessThan(2);
    expect(raisedVenous - base).toBeGreaterThan(15);
  });

  it('shields the capillary when the precapillary sphincter constricts', () => {
    const pv = BASELINE.PLASMA_VOLUME_ML;
    expect(capillaryPressure(95, 12, 2, 'systemic', pv, pv)).toBeLessThan(capillaryPressure(95, 12, 0.5, 'systemic', pv, pv));
  });
});

describe('engine — the normal capillary', () => {
  it('reproduces the textbook Starling balance and sits in steady state', () => {
    const { derived } = settle(presetInputs('normal'));

    expect(derived.capillaryPressureMmHg).toBeCloseTo(17.3, 0);
    expect(derived.interstitialPressureMmHg).toBeCloseTo(-3, 0);
    expect(derived.plasmaOncoticMmHg).toBeGreaterThan(26);
    expect(derived.plasmaOncoticMmHg).toBeLessThan(31);
    expect(derived.interstitialOncoticMmHg).toBeGreaterThan(7);
    expect(derived.interstitialOncoticMmHg).toBeLessThan(10);
    // A net filtration pressure of a fraction of a mmHg, giving ~2 mL/min — and the lymph
    // carries away exactly that much, which is why nothing accumulates.
    expect(derived.netFiltrationPressure).toBeGreaterThan(0);
    expect(derived.netFiltrationPressure).toBeLessThan(1);
    expect(derived.filtrationRateMlPerMin).toBeCloseTo(derived.lymphFlowMlPerMin, 1);
    expect(Math.abs(derived.interstitialExcess)).toBeLessThan(0.02);
    expect(derived.dominantMechanism).toBe('none');
  });

  it('filters at the arteriolar end and reabsorbs at the venular end', () => {
    const { derived } = settle(presetInputs('normal'));

    expect(derived.arteriolarEndPressure).toBeGreaterThan(derived.venularEndPressure);
    expect(derived.arteriolarNetPressure).toBeGreaterThan(0);
    expect(derived.venularNetPressure).toBeLessThan(0);
  });

  it('holds a large safety factor in reserve', () => {
    const { derived } = settle(presetInputs('normal'));
    expect(derived.safetyFactorMmHg).toBeGreaterThan(12);
    expect(derived.lymphaticReserveFraction).toBeGreaterThan(0.9);
  });
});

describe('engine — the four mechanisms of oedema', () => {
  it('attributes each preset to the right term of one equation', () => {
    expect(settle(presetInputs('heartFailure')).derived.dominantMechanism).toBe('raisedCapillaryPressure');
    expect(settle(presetInputs('nephrotic')).derived.dominantMechanism).toBe('lowPlasmaOncotic');
    expect(settle(presetInputs('sepsis')).derived.dominantMechanism).toBe('increasedPermeability');
    expect(settle(presetInputs('lymphoedema')).derived.dominantMechanism).toBe('lymphaticFailure');
  });

  it('turns net reabsorption into net filtration when albumin is halved', () => {
    const normal = presetInputs('normal');
    const baseline = settle(normal);

    // Halve the protein in the plasma directly, so the Starling consequence is isolated from
    // the safety factors that will start opposing it within the hour.
    const halved = computeDerived({ ...baseline.state, plasmaProteinG: baseline.state.plasmaProteinG / 2 }, normal);

    // Landis-Pappenheimer non-linearity: halving the protein more than halves the pressure.
    expect(halved.plasmaOncoticMmHg).toBeLessThan(baseline.derived.plasmaOncoticMmHg / 2);
    // The venular end no longer reabsorbs — the whole capillary is now filtering.
    expect(baseline.derived.venularNetPressure).toBeLessThan(0);
    expect(halved.venularNetPressure).toBeGreaterThan(0);
    expect(halved.filtrationRateMlPerMin).toBeGreaterThan(baseline.derived.filtrationRateMlPerMin * 5);

    // And left alone at that albumin, the tissue swells until the safety factors catch up.
    const hypoalbuminaemic: CapillaryInputs = { ...normal, plasmaAlbuminGDl: normal.plasmaAlbuminGDl / 2 };
    expect(settle(hypoalbuminaemic, 72).derived.interstitialExcess).toBeGreaterThan(0.1);
  });

  it('absorbs a raised filtration coefficient until the lymphatic reserve runs out', () => {
    const normal = presetInputs('normal');
    const leaky = settle({ ...normal, capillaryPermeability: 3 }, 72);
    const veryLeaky = settle({ ...normal, capillaryPermeability: 3, lymphaticFlowCapacity: 0.1 }, 72);

    // With drainage intact, a threefold rise in Kf produces almost nothing.
    expect(leaky.derived.interstitialExcess).toBeLessThan(0.06);
    expect(leaky.derived.lymphaticReserveFraction).toBeGreaterThan(0);
    // Take the reserve away and the same leak becomes oedema.
    expect(veryLeaky.derived.interstitialExcess).toBeGreaterThan(leaky.derived.interstitialExcess * 3);
  });

  it('accumulates protein in the interstitium when the lymphatics fail', () => {
    const normal = settle(presetInputs('normal'));
    const blocked = settle(presetInputs('lymphoedema'));

    // Only the lymph can return protein, so blocking it lets protein build up — which is what
    // makes lymphoedema protein-rich and eventually fibrotic rather than simply wet.
    expect(blocked.derived.interstitialOncoticMmHg).toBeGreaterThan(normal.derived.interstitialOncoticMmHg);
    expect(blocked.derived.interstitialExcess).toBeGreaterThan(0.1);
    // And it happens with every Starling force still normal.
    expect(blocked.derived.capillaryPressureMmHg).toBeCloseTo(normal.derived.capillaryPressureMmHg, 1);
  });
});

describe('engine — albumin helps only where the wall still reflects protein', () => {
  it('pulls fluid back in nephrotic syndrome but not in sepsis', () => {
    const nephrotic = settle(presetInputs('nephrotic'));
    const sepsis = settle(presetInputs('sepsis'));

    const nephroticAfter = computeDerived(
      run(presetInputs('nephrotic'), HOUR, perturbAlbuminInfusion(nephrotic.state)),
      presetInputs('nephrotic'),
    );
    const sepsisAfter = computeDerived(
      run(presetInputs('sepsis'), HOUR * 12, perturbAlbuminInfusion(sepsis.state)),
      presetInputs('sepsis'),
    );

    // Where sigma is intact, the infused albumin stays in the circulation and pulls fluid back.
    expect(nephroticAfter.interstitialExcess).toBeLessThan(nephrotic.derived.interstitialExcess - 0.02);
    // Where the wall no longer reflects protein, it follows the fluid into the tissues instead:
    // the oedema does not improve, and the leaked albumin makes the interstitium more oncotic.
    expect(sepsisAfter.interstitialExcess).toBeGreaterThanOrEqual(sepsis.derived.interstitialExcess);
    expect(sepsis.derived.interstitialOncoticMmHg).toBeGreaterThan(nephrotic.derived.interstitialOncoticMmHg);
  });
});

describe('engine — the beds differ because their numbers differ', () => {
  it('lets the lung flood at a capillary pressure the systemic bed shrugs off', () => {
    const pulmonary: CapillaryInputs = { ...DEFAULT_CAPILLARY_INPUTS, ...bedDefaults('pulmonary'), venousOutflowPressure: 32 };
    const systemic: CapillaryInputs = { ...DEFAULT_CAPILLARY_INPUTS, venousOutflowPressure: 12 };

    const floodedLung = settle(pulmonary);
    const normalTissue = settle(systemic);

    // A capillary pressure in the mid-twenties is unremarkable systemically and catastrophic
    // in the lung, because pulmonary tolerance and lymphatic reserve are both far smaller.
    expect(floodedLung.derived.capillaryPressureMmHg).toBeLessThan(normalTissue.derived.capillaryPressureMmHg + 10);
    expect(floodedLung.derived.oedemaSeverity).toBeGreaterThan(0.5);
    expect(floodedLung.derived.oxygenationImpairment).toBeGreaterThan(0.2);
    expect(normalTissue.derived.oedemaSeverity).toBe(0);
  });

  it('makes hepatic filtration almost purely hydrostatic, and its ascites protein-rich', () => {
    const { derived } = settle(presetInputs('liverFailure'));

    // Sigma near zero means the oncotic gradient exerts almost nothing, whatever the albumin.
    const oncoticContribution = derived.reflectionCoefficient * (derived.plasmaOncoticMmHg - derived.interstitialOncoticMmHg);
    expect(Math.abs(oncoticContribution)).toBeLessThan(1);
    expect(derived.netFiltrationPressure).toBeGreaterThan(derived.capillaryPressureMmHg - derived.interstitialPressureMmHg - 1);
    // Fenestrated sinusoids let protein through, so the fluid that collects is protein-rich.
    expect(derived.interstitialOncoticMmHg).toBeGreaterThan(8);
    expect(derived.interstitialExcess).toBeGreaterThan(0.12);
  });

  it('produces a normal GFR from the same equation, with filtration that never reverses', () => {
    const { derived } = settle(presetInputs('glomerularFiltration'));

    expect(derived.filtrationRateMlPerMin).toBeGreaterThan(100);
    expect(derived.filtrationRateMlPerMin).toBeLessThan(145);
    // Sigma is 1 and Bowman's space is protein-free, so there is no oncotic force pulling
    // anything back and no reabsorbing venular end.
    expect(derived.interstitialOncoticMmHg).toBeLessThan(0.2);
    expect(derived.venularNetPressure).toBeGreaterThan(0);
  });

  it('gives every bed the same resting balance despite completely different constants', () => {
    for (const bed of ['systemic', 'pulmonary', 'hepatic', 'glomerulus'] as const) {
      const inputs: CapillaryInputs = { ...DEFAULT_CAPILLARY_INPUTS, ...bedDefaults(bed) };
      const { derived } = settle(inputs, 72);
      expect(Math.abs(derived.interstitialExcess), `${bed} should rest at its normal volume`).toBeLessThan(0.05);
      const restingFlow = TISSUE_BEDS[bed].lymphBaseFlowMlPerMin;
      expect(derived.filtrationRateMlPerMin, `${bed} should filter at its resting lymph flow`).toBeGreaterThan(restingFlow * 0.8);
      expect(derived.filtrationRateMlPerMin).toBeLessThan(restingFlow * 1.2);
    }
  });
});

describe('engine — numerical robustness', () => {
  it('stays finite and bounded across extreme inputs in every bed', () => {
    const extremes: CapillaryInputs[] = [];
    for (const tissueBed of ['systemic', 'pulmonary', 'hepatic', 'glomerulus'] as const) {
      for (const venousOutflowPressure of [0, 40]) {
        for (const plasmaAlbuminGDl of [1, 5.5]) {
          for (const reflectionCoefficient of [0.05, 1]) {
            for (const lymphaticFlowCapacity of [0, 3]) {
              extremes.push({
                ...DEFAULT_CAPILLARY_INPUTS,
                tissueBed,
                venousOutflowPressure,
                plasmaAlbuminGDl,
                reflectionCoefficient,
                lymphaticFlowCapacity,
                arterialInflowPressure: 180,
                capillaryPermeability: 5,
                precapillaryTone: 0.2,
                interstitialCompliance: 3,
              });
            }
          }
        }
      }
    }

    for (const inputs of extremes) {
      const state = run(inputs, HOUR * 48);
      const derived = computeDerived(state, inputs);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      expect(state.interstitialVolumeFraction).toBeGreaterThan(0);
      expect(state.plasmaVolumeMl).toBeGreaterThan(0);
      expect(state.plasmaProteinG).toBeGreaterThan(0);
      expect(state.interstitialProteinFraction).toBeGreaterThan(0);
      expect(derived.lymphaticReserveFraction).toBeGreaterThanOrEqual(0);
      expect(derived.lymphaticReserveFraction).toBeLessThanOrEqual(1);
    }
  });
});

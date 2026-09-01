import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbInjury, step } from './engine';
import { COAG_PRESETS, DEFAULT_COAG_INPUTS } from './presets';
import { COAGULATION_REFERENCE_RANGES } from './references';
import { LAB_BASELINE } from './constants';
import { thrombinAmplification } from './commonPathway';
import type { CoagInputs } from './types';

const DT = 0.25;

function runInjury(inputs: CoagInputs, seconds = 120) {
  let state = perturbInjury(createInitialState());
  let peakThrombin = 0;
  for (let i = 0; i < seconds / DT; i++) {
    const derived = computeDerived(state, inputs);
    peakThrombin = Math.max(peakThrombin, derived.thrombin);
    state = step(state, inputs, DT).state;
  }
  return { derived: computeDerived(state, inputs), peakThrombin, state };
}

function preset(name: keyof typeof COAG_PRESETS, overrides: Partial<CoagInputs> = {}): CoagInputs {
  return { ...DEFAULT_COAG_INPUTS, ...COAG_PRESETS[name], ...overrides };
}

/** Reads the screening panel without needing to run an injury — these are properties of the
 * blood, not of any particular clot. */
function panel(inputs: CoagInputs) {
  return computeDerived(createInitialState(), inputs);
}

const PT_UPPER = LAB_BASELINE.PT_SECONDS * 1.2;
const APTT_UPPER = LAB_BASELINE.APTT_SECONDS * 1.2;

describe('coagulation — normal haemostasis', () => {
  it('reports a normal screening panel', () => {
    const normal = panel(DEFAULT_COAG_INPUTS);
    // Against the PUBLISHED interval, not against LAB_BASELINE.PT_SECONDS. Comparing the engine to
    // its own constant passes by construction and cannot catch a wrong constant; see
    // `references.ts`, where the band and its source live.
    expect(normal.ptSeconds).toBeGreaterThanOrEqual(COAGULATION_REFERENCE_RANGES.ptSeconds!.low);
    expect(normal.ptSeconds).toBeLessThanOrEqual(COAGULATION_REFERENCE_RANGES.ptSeconds!.high);
    expect(normal.apttSeconds).toBeGreaterThanOrEqual(COAGULATION_REFERENCE_RANGES.apttSeconds!.low);
    expect(normal.apttSeconds).toBeLessThanOrEqual(COAGULATION_REFERENCE_RANGES.apttSeconds!.high);
    expect(normal.inr).toBeCloseTo(1, 1);
    expect(normal.apttSeconds).toBeCloseTo(LAB_BASELINE.APTT_SECONDS, 1);
    expect(normal.bleedingTimeMinutes).toBeCloseTo(LAB_BASELINE.BLEEDING_TIME_MINUTES, 1);
  });

  it('seals an injury quickly, forming both a platelet plug and a fibrin mesh', () => {
    const { derived, state } = runInjury(DEFAULT_COAG_INPUTS);
    expect(state.timeToClotSeconds).toBeGreaterThan(0);
    expect(state.timeToClotSeconds).toBeLessThan(20);
    expect(derived.isBleeding).toBe(false);
    expect(derived.clotStrength).toBeGreaterThan(0.4);
  });

  it('never produces NaN across extreme inputs', () => {
    const extremes: CoagInputs[] = [];
    for (const factorVIIIActivity of [0, 150]) {
      for (const vitaminKDependentFactors of [0, 150]) {
        for (const plateletCount of [0, 400]) {
          for (const fibrinolyticActivity of [0, 300]) {
            extremes.push({ ...DEFAULT_COAG_INPUTS, factorVIIIActivity, vitaminKDependentFactors, plateletCount, fibrinolyticActivity });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived } = runInjury(inputs, 60);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      for (const level of [derived.thrombin, derived.fibrin, derived.plateletPlug, derived.clotStrength]) {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('coagulation — thrombin amplification', () => {
  it('is a positive-feedback loop with a threshold below which the burst never ignites', () => {
    // Below the threshold there is no amplification at all...
    expect(thrombinAmplification(0)).toBe(1);
    expect(thrombinAmplification(0.01)).toBe(1);
    // ...and above it, thrombin recruits more of its own production.
    expect(thrombinAmplification(0.5)).toBeGreaterThan(1);
    expect(thrombinAmplification(1)).toBeGreaterThan(thrombinAmplification(0.5));
  });
});

describe('coagulation — the PT/APTT discrimination', () => {
  it('hemophilia A prolongs the APTT while leaving the PT completely normal', () => {
    const hemophilia = panel(preset('hemophiliaA'));
    expect(hemophilia.ptSeconds).toBeCloseTo(LAB_BASELINE.PT_SECONDS, 1);
    expect(hemophilia.apttSeconds).toBeGreaterThan(60);
  });

  it('hemophilia B produces the same pattern as hemophilia A — clinically indistinguishable on the screen', () => {
    const a = panel(preset('hemophiliaA'));
    const b = panel({ ...DEFAULT_COAG_INPUTS, factorIXActivity: 2 });

    expect(b.ptSeconds).toBeCloseTo(a.ptSeconds, 1);
    expect(b.apttSeconds).toBeGreaterThan(60);
  });

  it('a normal PT does NOT mean normal haemostasis — hemophilia still fails to clot', () => {
    // The extrinsic limb is intact, so the PT is normal and the initial spark fires. But TFPI
    // quenches that limb within seconds, and without the intrinsic amplification loop thrombin
    // generation cannot be sustained.
    const normal = runInjury(DEFAULT_COAG_INPUTS);
    const hemophilia = runInjury(preset('hemophiliaA'));

    expect(hemophilia.peakThrombin).toBeLessThan(normal.peakThrombin * 0.75);
    expect(hemophilia.derived.clotStrength).toBeLessThan(0.2);
    expect(hemophilia.derived.isBleeding).toBe(true);
  });

  it('warfarin raises the PT and INR far more than the APTT', () => {
    const warfarin = panel(preset('warfarin'));
    expect(warfarin.inr).toBeGreaterThan(2);
    expect(warfarin.ptSeconds).toBeGreaterThan(PT_UPPER);
    // Factor VII has the shortest half-life, so the PT moves proportionally further.
    const ptRatio = warfarin.ptSeconds / LAB_BASELINE.PT_SECONDS;
    const apttRatio = warfarin.apttSeconds / LAB_BASELINE.APTT_SECONDS;
    expect(ptRatio).toBeGreaterThan(apttRatio);
  });

  it('heparin raises the APTT far more than the PT — the mirror image of warfarin', () => {
    const heparin = panel(preset('heparin'));
    expect(heparin.apttSeconds).toBeGreaterThan(60);
    expect(heparin.ptSeconds).toBeLessThan(PT_UPPER * 1.3);

    const ptRatio = heparin.ptSeconds / LAB_BASELINE.PT_SECONDS;
    const apttRatio = heparin.apttSeconds / LAB_BASELINE.APTT_SECONDS;
    expect(apttRatio).toBeGreaterThan(ptRatio);
  });

  it('thrombocytopenia prolongs only the bleeding time, the exact mirror of hemophilia', () => {
    const low = panel(preset('thrombocytopenia'));
    expect(low.ptSeconds).toBeCloseTo(LAB_BASELINE.PT_SECONDS, 1);
    expect(low.apttSeconds).toBeCloseTo(LAB_BASELINE.APTT_SECONDS, 1);
    expect(low.bleedingTimeMinutes).toBeGreaterThan(10);
  });

  it('aspirin prolongs the bleeding time without touching the count or the cascade', () => {
    const aspirin = panel({ ...DEFAULT_COAG_INPUTS, aspirinDose: 100 });
    expect(aspirin.ptSeconds).toBeCloseTo(LAB_BASELINE.PT_SECONDS, 1);
    expect(aspirin.apttSeconds).toBeCloseTo(LAB_BASELINE.APTT_SECONDS, 1);
    expect(aspirin.plateletCountValue).toBeCloseTo(DEFAULT_COAG_INPUTS.plateletCount, 1);
    expect(aspirin.bleedingTimeMinutes).toBeGreaterThan(LAB_BASELINE.BLEEDING_TIME_MINUTES * 1.4);
  });

  it('von Willebrand disease shows a platelet-type defect PLUS a mildly long APTT', () => {
    const vwd = panel(preset('vonWillebrand'));
    // Platelet adhesion fails...
    expect(vwd.bleedingTimeMinutes).toBeGreaterThan(LAB_BASELINE.BLEEDING_TIME_MINUTES * 1.4);
    // ...and because vWF carries factor VIII, the intrinsic limb suffers too.
    expect(vwd.apttSeconds).toBeGreaterThan(APTT_UPPER);
    // But the extrinsic limb is untouched.
    expect(vwd.ptSeconds).toBeCloseTo(LAB_BASELINE.PT_SECONDS, 1);
  });

  it('a common-pathway defect prolongs BOTH times together', () => {
    const lowFibrinogen = panel({ ...DEFAULT_COAG_INPUTS, fibrinogenLevel: 20 });
    expect(lowFibrinogen.ptSeconds).toBeGreaterThan(PT_UPPER);
    expect(lowFibrinogen.apttSeconds).toBeGreaterThan(APTT_UPPER);
  });
});

describe('coagulation — DIC versus liver disease', () => {
  it('both prolong PT and APTT and drop fibrinogen', () => {
    const dic = panel(preset('dic'));
    const liver = panel(preset('liverDisease'));

    for (const result of [dic, liver]) {
      expect(result.ptSeconds).toBeGreaterThan(PT_UPPER);
      expect(result.apttSeconds).toBeGreaterThan(APTT_UPPER);
      expect(result.fibrinogenMgDl).toBeLessThan(LAB_BASELINE.FIBRINOGEN_MG_DL * 0.6);
    }
  });

  it('the D-dimer is what separates them', () => {
    const dic = runInjury(preset('dic')).derived;
    const liver = runInjury(preset('liverDisease')).derived;

    // Widespread microvascular thrombosis and lysis sends DIC's D-dimer through the roof...
    expect(dic.dDimerNgMl).toBeGreaterThan(4000);
    // ...whereas liver disease simply fails to make factors, with no runaway lysis.
    expect(liver.dDimerNgMl).toBeLessThan(1000);
    expect(dic.dDimerNgMl).toBeGreaterThan(liver.dDimerNgMl * 4);
  });

  it('DIC also consumes platelets, which liver disease does not', () => {
    const dic = panel(preset('dic'));
    const liver = panel(preset('liverDisease'));

    expect(dic.plateletCountValue).toBeLessThan(100);
    expect(liver.plateletCountValue).toBeCloseTo(DEFAULT_COAG_INPUTS.plateletCount, 1);
    expect(dic.bleedingTimeMinutes).toBeGreaterThan(liver.bleedingTimeMinutes);
  });
});

describe('coagulation — failure to seal', () => {
  it('leaves the patient bleeding whenever the cascade or the platelets fail badly enough', () => {
    for (const name of ['hemophiliaA', 'warfarin', 'dic'] as const) {
      const { derived } = runInjury(preset(name));
      expect(derived.isBleeding, `${name} should fail to seal`).toBe(true);
      expect(derived.clotStrength).toBeLessThan(0.45);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbExertion, perturbVasospasm, step } from './engine';
import { DEFAULT_CORONARY_INPUTS } from './presets';
import { ISCHAEMIA, SUPPLY, TIMING } from './constants';
import type { CoronaryInputs } from './types';

type Snapshot = ReturnType<typeof step>;

function run(inputs: Partial<CoronaryInputs>, seconds = 30): Snapshot {
  let snapshot = step(createInitialState(), { ...DEFAULT_CORONARY_INPUTS, ...inputs }, 1);
  for (let t = 0; t < seconds; t += 1) {
    snapshot = step(snapshot.state, { ...DEFAULT_CORONARY_INPUTS, ...inputs }, 1);
  }
  return snapshot;
}

/** A settled run after an event, so decaying bursts have acted before the readout. */
function runWithEvent(
  inputs: Partial<CoronaryInputs>,
  event: (s: ReturnType<typeof createInitialState>) => ReturnType<typeof createInitialState>,
  settleSeconds = 20,
): Snapshot {
  const started = event(createInitialState());
  let snapshot: Snapshot = {
    state: started,
    derived: computeDerived(started, { ...DEFAULT_CORONARY_INPUTS, ...inputs }),
  };
  for (let t = 0; t < settleSeconds; t += 1) {
    snapshot = step(snapshot.state, { ...DEFAULT_CORONARY_INPUTS, ...inputs }, 1);
  }
  return snapshot;
}

describe('coronary baseline calibration', () => {
  const baseline = run({});

  it('lands on textbook resting values', () => {
    // Resting coronary flow reserve in the healthy heart is classically 4-5.
    expect(baseline.derived.flowReserveRatio).toBeGreaterThan(4);
    expect(baseline.derived.flowReserveRatio).toBeLessThan(5);
    // Roughly three quarters of the cardiac cycle is diastole at rest — the window
    // in which the left ventricle is actually perfused.
    expect(baseline.derived.diastolicTimeFraction).toBeGreaterThan(0.74);
    expect(baseline.derived.diastolicTimeFraction).toBeLessThan(0.8);
    // Rate-pressure product of a resting adult: ~72 bpm against ~122 mmHg systolic.
    expect(baseline.derived.ratePressureProduct).toBeGreaterThan(8500);
    expect(baseline.derived.ratePressureProduct).toBeLessThan(9100);
  });

  it('is balanced with no angina and full functional contractility at rest', () => {
    expect(baseline.derived.ischaemiaLevel).toBeLessThan(0.01);
    expect(baseline.derived.classification).toBe('balanced');
    expect(baseline.derived.functionalContractility).toBeCloseTo(DEFAULT_CORONARY_INPUTS.contractilityFraction, 5);
    expect(baseline.state.necrosisLoad).toBe(0);
  });

  it('meets demand from the diastolic pressure head alone', () => {
    // The driving column must survive subtracting the intramyocardial closing pressure.
    expect(baseline.derived.drivingPressureMmHg).toBeGreaterThan(SUPPLY.PZF_BASE_MMHG);
    expect(baseline.derived.maximalFlowCapacity).toBeGreaterThan(baseline.derived.requiredFlow);
  });
});

describe('the stenosis paradox: silent at rest, decompensated under load', () => {
  it('keeps a severe stenosis asymptomatic at rest while the reserve collapses', () => {
    // 85% diameter narrowing: rest flow is still met by vasodilating downstream,
    // but almost all of the vasodilatory reserve has been spent doing it.
    const stenosed = run({ stenosisPercentDiameter: 85 });
    expect(stenosed.derived.ischaemiaLevel).toBeLessThan(ISCHAEMIA.GAP_ONSET);
    expect(stenosed.derived.flowReserveRatio).toBeLessThan(1.5);
    // The same heart without the lesion holds its full reserve.
    const clean = run({});
    expect(clean.derived.flowReserveRatio / stenosed.derived.flowReserveRatio).toBeGreaterThan(3);
  });

  it('decompensates only once flow becomes limiting beyond critical severity', () => {
    const critical = run({ stenosisPercentDiameter: 95 });
    expect(critical.derived.ischaemiaLevel).toBeGreaterThan(0.2);
    expect(critical.derived.classification).not.toBe('balanced');
  });
});

describe('tachycardia hurts twice', () => {
  it('is absorbed by the healthy heart but tips a stenosed one into ischaemia', () => {
    const normalFast = run({ heartRateBpm: 165 });
    expect(normalFast.derived.ischaemiaLevel).toBeLessThan(0.01);

    const stenosedFast = run({ heartRateBpm: 160, stenosisPercentDiameter: 80 });
    expect(stenosedFast.derived.ischaemiaLevel).toBeGreaterThan(ISCHAEMIA.GAP_ONSET * 2);
    expect(stenosedFast.derived.anginaActive).toBe(true);

    // And the same stenosis at a modest rate stays quiet — the rate is what breaks it.
    const stenosedSlow = run({ heartRateBpm: 100, stenosisPercentDiameter: 80 });
    expect(stenosedSlow.derived.ischaemiaLevel).toBeLessThan(0.01);
  });

  it('shortens the diastolic window that the supply depends on', () => {
    const slow = run({ heartRateBpm: 60 });
    const fast = run({ heartRateBpm: 165 });
    expect(fast.derived.diastolicTimeFraction).toBeLessThan(slow.derived.diastolicTimeFraction - 0.15);
    // Systole cannot compress to nothing and cannot exceed the cycle.
    expect(TIMING.SYSTOLE_PATENCY_SHARE).toBeGreaterThan(0);
    expect(fast.derived.systolicDurationSeconds).toBeGreaterThanOrEqual(TIMING.MIN_SYSTOLE_S - 1e-9);
  });
});

describe('drugs act where their receptors are', () => {
  it('beta-blockade relieves exertional angina by cutting demand and lengthening diastole', () => {
    const angina = runWithEvent({ stenosisPercentDiameter: 75 }, (s) => perturbExertion(s));
    expect(angina.derived.anginaActive).toBe(true);

    const treated = runWithEvent(
      { stenosisPercentDiameter: 75, betaBlockerDosePercent: 65 },
      (s) => perturbExertion(s),
    );
    expect(treated.derived.ischaemiaLevel).toBeLessThan(angina.derived.ischaemiaLevel * 0.25);
    expect(treated.derived.anginaActive).toBe(false);
    // The rate fell and the perfusion window opened — the mechanism, not just the score.
    expect(treated.derived.effectiveHeartRateBpm).toBeLessThan(angina.derived.effectiveHeartRateBpm);
    expect(treated.derived.diastolicTimeFraction).toBeGreaterThan(angina.derived.diastolicTimeFraction);
  });

  it('nitrates relieve spasm and unload the ventricle, accepting a lower diastolic head', () => {
    const spasming = runWithEvent({ stenosisPercentDiameter: 15, coronaryTonePercent: 20 }, (s) =>
      perturbVasospasm(s),
    );
    expect(spasming.derived.transmuralInjuryActive).toBe(true);

    const relieved = runWithEvent(
      {
        stenosisPercentDiameter: 15,
        coronaryTonePercent: 20,
        nitrateDosePercent: 80,
      },
      (s) => perturbVasospasm(s),
    );
    expect(relieved.derived.transmuralInjuryActive).toBe(false);
    expect(relieved.derived.ischaemiaLevel).toBeLessThan(0.02);
    // The trade-off: venodilation drops preload AND the diastolic pressure head.
    expect(relieved.derived.effectiveEndDiastolicVolumeMl).toBeLessThan(
      spasming.derived.effectiveEndDiastolicVolumeMl,
    );
    expect(relieved.derived.effectiveDiastolicPressureMmHg).toBeLessThan(
      spasming.derived.effectiveDiastolicPressureMmHg,
    );
  });
});

describe('the supply side can fail without any plaque', () => {
  it('anaemia halves oxygen carriage and converts compensated stenosis into angina on effort', () => {
    const normalBlood = runWithEvent({ stenosisPercentDiameter: 65 }, (s) => perturbExertion(s));
    expect(normalBlood.derived.anginaActive).toBe(false);

    const anaemic = runWithEvent(
      { stenosisPercentDiameter: 65, haemoglobinGPerDl: 7.5 },
      (s) => perturbExertion(s),
    );
    expect(anaemic.derived.oxygenCarriageRatio).toBeLessThan(0.6);
    expect(anaemic.derived.anginaActive).toBe(true);
  });

  it('hypotension starves the myocardium even though demand has not changed', () => {
    const normotensive = run({ stenosisPercentDiameter: 85 });
    const hypotensive = run({ stenosisPercentDiameter: 85, aorticDiastolicPressureMmHg: 50 });
    // Identical input-side demand: same rate-pressure product in both patients.
    expect(normotensive.derived.ratePressureProduct).toBeCloseTo(hypotensive.derived.ratePressureProduct, 3);
    expect(hypotensive.derived.maximalFlowCapacity).toBeLessThan(normotensive.derived.maximalFlowCapacity);
    expect(hypotensive.derived.ischaemiaLevel).toBeGreaterThan(ISCHAEMIA.GAP_ONSET * 4);
  });

  it('the healthy heart autoregulates down to low pressures before failing', () => {
    const lowButDefended = run({ aorticDiastolicPressureMmHg: 45 });
    expect(lowButDefended.derived.ischaemiaLevel).toBeLessThan(0.01);
    const tooLow = run({ aorticDiastolicPressureMmHg: 35 });
    expect(tooLow.derived.ischaemiaLevel).toBeGreaterThan(0.05);
  });
});

describe('collaterals decide whether an occlusion is survivable', () => {
  it('a chronically occluded vessel with collaterals rests quietly and fails on effort', () => {
    const collateralised = run({ stenosisPercentDiameter: 97, collateralFraction: 0.9 });
    expect(collateralised.derived.ischaemiaLevel).toBeLessThan(ISCHAEMIA.GAP_ONSET);
    expect(collateralised.derived.flowReserveRatio).toBeLessThan(2);

    const onEffort = runWithEvent(
      { stenosisPercentDiameter: 97, collateralFraction: 0.9 },
      (s) => perturbExertion(s),
    );
    expect(onEffort.derived.anginaActive).toBe(true);
  });

  it('losing the collaterals turns the same occlusion into an acute infarct', () => {
    const bare = run({ stenosisPercentDiameter: 97, collateralFraction: 0 });
    expect(bare.derived.transmuralInjuryActive).toBe(true);
  });
});

describe('ischaemia and infarction feedback', () => {
  it('depresses functional contractility when demand outruns supply', () => {
    const ischaemic = run({ stenosisPercentDiameter: 90, heartRateBpm: 130 }, 60);
    expect(ischaemic.derived.ischaemiaLevel).toBeGreaterThan(0.1);
    expect(ischaemic.derived.functionalContractility).toBeLessThan(
      DEFAULT_CORONARY_INPUTS.contractilityFraction *
        (1 - ISCHAEMIA.CONTRACTILITY_GAIN * ischaemic.derived.ischaemiaLevel + 0.05),
    );
  });

  it('accumulates necrosis during sustained transmural injury and heals slowly otherwise', () => {
    const infarcting = run({ stenosisPercentDiameter: 97, collateralFraction: 0 }, 120);
    expect(infarcting.state.necrosisLoad).toBeGreaterThan(0.05);
    expect(infarcting.derived.classification).toBe('established infarct');

    const recovering = step(
      { simTimeSeconds: 0, ischaemiaLevel: 0, exertionDrive: 0, spasmBurst: 0, necrosisLoad: 0.1 },
      DEFAULT_CORONARY_INPUTS,
      1000,
    );
    expect(recovering.state.necrosisLoad).toBeLessThan(0.1);
  });

  it('keeps subendocardial ischaemia distinct from transmural injury', () => {
    // Demand ischaemia through a partial lesion never flags a territory occlusion.
    const demand = runWithEvent({ stenosisPercentDiameter: 80 }, (s) => perturbExertion(s));
    expect(demand.derived.classification).toBe('subendocardial ischaemia');
    expect(demand.derived.transmuralInjuryActive).toBe(false);

    // Total occlusion with no collateral does flag it.
    const occluded = run({ stenosisPercentDiameter: 97, collateralFraction: 0 });
    expect(occluded.derived.transmuralInjuryActive).toBe(true);
  });
});

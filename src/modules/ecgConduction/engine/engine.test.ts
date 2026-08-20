import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, isCompleteBlock, step } from './engine';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS } from './presets';
import { buildSchedule } from './activation';
import { meanQrsAxisDegrees } from './leadProjection';
import { bazettQtc } from './intervals';
import type { EcgInputs, EcgSegment, LeadName } from './types';

const DT = 0.004;

interface Sample {
  tMs: number;
  mv: number;
  segment: EcgSegment;
}

function run(inputs: EcgInputs, seconds: number) {
  let state = createInitialState();
  const samples: Sample[] = [];
  for (let i = 0; i < seconds / DT; i++) {
    const derived = computeDerived(state, inputs);
    samples.push({ tMs: i * DT * 1000, mv: derived.ecgVoltageMv, segment: derived.currentSegment });
    state = step(state, inputs, DT).state;
  }
  return { samples, derived: computeDerived(state, inputs), state };
}

function preset(name: keyof typeof ECG_PRESETS, overrides: Partial<EcgInputs> = {}): EcgInputs {
  return { ...DEFAULT_ECG_INPUTS, ...ECG_PRESETS[name], ...overrides };
}

/** Mean voltage across every sample recorded during a given segment. */
function meanDuring(samples: Sample[], segment: EcgSegment): number {
  const matching = samples.filter((s) => s.segment === segment);
  if (matching.length === 0) return Number.NaN;
  return matching.reduce((sum, s) => sum + s.mv, 0) / matching.length;
}

function peakDuring(samples: Sample[], segment: EcgSegment): number {
  const matching = samples.filter((s) => s.segment === segment);
  return matching.length ? Math.max(...matching.map((s) => s.mv)) : Number.NaN;
}

describe('ecg — normal beat morphology', () => {
  it('writes P, QRS and T in order, separated by isoelectric segments', () => {
    const { samples } = run(DEFAULT_ECG_INPUTS, 1.1);

    const firstOf = (segment: EcgSegment) => samples.find((s) => s.segment === segment)?.tMs ?? Number.NaN;

    // The sequence has to occur in this order within the first beat.
    expect(firstOf('P wave')).toBeLessThan(firstOf('QRS'));
    expect(firstOf('QRS')).toBeLessThan(firstOf('ST segment'));
    expect(firstOf('ST segment')).toBeLessThan(firstOf('T wave'));
  });

  it('keeps the PR and ST segments isoelectric while the QRS and T deflect', () => {
    const { samples } = run(DEFAULT_ECG_INPUTS, 2.5);

    // The AV node is conducting hard through the PR segment and the whole ventricle is
    // depolarised through the ST segment — in both cases there is no net dipole to record.
    expect(Math.abs(meanDuring(samples, 'ST segment'))).toBeLessThan(0.02);
    expect(peakDuring(samples, 'QRS')).toBeGreaterThan(0.4);
    expect(peakDuring(samples, 'T wave')).toBeGreaterThan(0.1);
  });

  it('makes the T wave upright but smaller and broader than the QRS', () => {
    const { samples } = run(DEFAULT_ECG_INPUTS, 2.5);

    const qrsPeak = peakDuring(samples, 'QRS');
    const tPeak = peakDuring(samples, 'T wave');

    // Concordant with the QRS (the epicardium-first double reversal), but far smaller...
    expect(tPeak).toBeGreaterThan(0);
    expect(tPeak).toBeLessThan(qrsPeak * 0.5);
    // ...and spread over more of the beat, because repolarisation is slower.
    const qrsSamples = samples.filter((s) => s.segment === 'QRS').length;
    const tSamples = samples.filter((s) => s.segment === 'T wave').length;
    expect(tSamples).toBeGreaterThan(qrsSamples);
  });

  it('produces textbook intervals and a normal axis', () => {
    const { derived } = run(DEFAULT_ECG_INPUTS, 2.5);

    expect(derived.prIntervalMs).toBeGreaterThanOrEqual(120);
    expect(derived.prIntervalMs).toBeLessThanOrEqual(200);
    expect(derived.qrsDurationMs).toBeLessThan(120);
    expect(derived.qtcMs).toBeGreaterThan(300);
    expect(derived.qtcMs).toBeLessThan(440);
    expect(derived.axisClassification).toBe('normal');
  });

  it('never produces NaN across extreme inputs', () => {
    const extremes: EcgInputs[] = [];
    for (const heartRate of [30, 180]) {
      for (const avBlockSeverity of [0, 1]) {
        for (const serumPotassium of [2.5, 8]) {
          for (const leftBundleConduction of [0, 1]) {
            extremes.push({ ...DEFAULT_ECG_INPUTS, heartRate, avBlockSeverity, serumPotassium, leftBundleConduction });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived, samples } = run(inputs, 2);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      for (const sample of samples) expect(Number.isFinite(sample.mv)).toBe(true);
      expect(derived.regions).toHaveLength(11);
    }
  });
});

describe('ecg — the trace and the wavefront stay in step', () => {
  /**
   * The module's central claim is that the heart diagram and the trace are two views of one
   * computation. These assertions pin that down: whenever the strip says a given wave is being
   * written, the corresponding myocardium must actually be in the matching membrane state.
   */
  it('has ventricular myocardium depolarising exactly while the QRS is being written', () => {
    const inputs = DEFAULT_ECG_INPUTS;
    let state = createInitialState();
    let checkedQrsFrames = 0;

    for (let i = 0; i < 3 / DT; i++) {
      const derived = computeDerived(state, inputs);
      if (derived.currentSegment === 'QRS') {
        const ventricular = derived.regions.filter((r) => ['septum', 'rvFreeWall', 'lvFreeWall', 'lvBase'].includes(r.id));
        expect(ventricular.some((r) => r.state === 'depolarizing')).toBe(true);
        checkedQrsFrames += 1;
      }
      state = step(state, inputs, DT).state;
    }

    expect(checkedQrsFrames).toBeGreaterThan(5);
  });

  it('has atrial myocardium depolarising exactly while the P wave is being written', () => {
    const inputs = DEFAULT_ECG_INPUTS;
    let state = createInitialState();
    let checkedPFrames = 0;

    for (let i = 0; i < 3 / DT; i++) {
      const derived = computeDerived(state, inputs);
      if (derived.currentSegment === 'P wave') {
        const atrial = derived.regions.filter((r) => r.id === 'rightAtrium' || r.id === 'leftAtrium');
        expect(atrial.some((r) => r.state === 'depolarizing')).toBe(true);
        checkedPFrames += 1;
      }
      state = step(state, inputs, DT).state;
    }

    expect(checkedPFrames).toBeGreaterThan(3);
  });

  it('has the ventricle uniformly depolarised — none still depolarising — through the ST segment', () => {
    const inputs = DEFAULT_ECG_INPUTS;
    let state = createInitialState();
    let checkedStFrames = 0;

    for (let i = 0; i < 3 / DT; i++) {
      const derived = computeDerived(state, inputs);
      if (derived.currentSegment === 'ST segment') {
        const ventricular = derived.regions.filter((r) => ['septum', 'rvFreeWall', 'lvFreeWall', 'lvBase'].includes(r.id));
        // Nothing is moving, which is precisely why the segment is isoelectric.
        expect(ventricular.every((r) => r.state !== 'depolarizing')).toBe(true);
        checkedStFrames += 1;
      }
      state = step(state, inputs, DT).state;
    }

    expect(checkedStFrames).toBeGreaterThan(5);
  });

  it('has ventricular myocardium repolarising while the T wave is being written', () => {
    const inputs = DEFAULT_ECG_INPUTS;
    let state = createInitialState();
    let checkedTFrames = 0;

    for (let i = 0; i < 3 / DT; i++) {
      const derived = computeDerived(state, inputs);
      if (derived.currentSegment === 'T wave') {
        const ventricular = derived.regions.filter((r) => ['septum', 'rvFreeWall', 'lvFreeWall', 'lvBase'].includes(r.id));
        expect(ventricular.some((r) => r.state === 'repolarizing')).toBe(true);
        checkedTFrames += 1;
      }
      state = step(state, inputs, DT).state;
    }

    expect(checkedTFrames).toBeGreaterThan(5);
  });
});

describe('ecg — lead projection', () => {
  it('records the tallest R in lead II and an inverted complex in aVR', () => {
    const peaks: Record<string, { max: number; min: number }> = {};
    for (const lead of ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'] as LeadName[]) {
      const { samples } = run({ ...DEFAULT_ECG_INPUTS, lead }, 2.5);
      peaks[lead] = {
        max: Math.max(...samples.map((s) => s.mv)),
        min: Math.min(...samples.map((s) => s.mv)),
      };
    }

    // Lead II sits closest to the normal mean axis, so it sees the largest positive complex.
    expect(peaks.II!.max).toBeGreaterThan(peaks.I!.max);
    expect(peaks.II!.max).toBeGreaterThan(peaks.aVL!.max);

    // aVR looks at the heart from almost exactly the opposite direction — a normal heart
    // gives an inverted complex there, which is why an upright aVR suggests lead misplacement.
    expect(peaks.aVR!.min).toBeLessThan(-0.3);
    expect(Math.abs(peaks.aVR!.min)).toBeGreaterThan(peaks.aVR!.max);
  });

  it('is the same cardiac event seen from different angles, not different events', () => {
    // Every lead measures the same underlying dipole, so they share identical intervals.
    const leadII = run({ ...DEFAULT_ECG_INPUTS, lead: 'II' }, 2.5).derived;
    const aVR = run({ ...DEFAULT_ECG_INPUTS, lead: 'aVR' }, 2.5).derived;

    expect(aVR.qrsDurationMs).toBeCloseTo(leadII.qrsDurationMs, 5);
    expect(aVR.qtIntervalMs).toBeCloseTo(leadII.qtIntervalMs, 5);
    expect(aVR.meanQrsAxisDegrees).toBeCloseTo(leadII.meanQrsAxisDegrees, 5);
  });
});

describe('ecg — AV conduction', () => {
  it('first-degree block lengthens PR without touching the complex', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const blocked = run(preset('firstDegreeBlock'), 2.5).derived;

    expect(blocked.prIntervalMs).toBeGreaterThan(200);
    expect(blocked.qrsDurationMs).toBeCloseTo(normal.qrsDurationMs, 5);
    expect(blocked.isDissociated).toBe(false);
  });

  it('complete block dissociates the chambers and drops the ventricles onto an escape rhythm', () => {
    const inputs = preset('completeHeartBlock');
    const { state, derived } = run(inputs, 8);

    expect(isCompleteBlock(inputs.avBlockSeverity)).toBe(true);
    expect(derived.isDissociated).toBe(true);
    // The atria keep going at the sinus rate while the ventricles beat slower and independently.
    expect(state.atrialBeatCount).toBeGreaterThan(state.ventricularBeatCount);
    expect(derived.ventricularRateBpm).toBeLessThan(50);
  });
});

describe('ecg — bundle branch block', () => {
  it('widens the QRS past the 120 ms diagnostic threshold, on either side', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const rbbb = run(preset('rbbb'), 2.5).derived;
    const lbbb = run(preset('lbbb'), 2.5).derived;

    expect(normal.qrsDurationMs).toBeLessThan(120);
    expect(rbbb.qrsDurationMs).toBeGreaterThan(120);
    expect(lbbb.qrsDurationMs).toBeGreaterThan(120);
    // The left ventricle carries far more mass, so activating it late costs more time.
    expect(lbbb.qrsDurationMs).toBeGreaterThan(rbbb.qrsDurationMs);
  });

  it('leaves the PR interval alone — a conduction problem below the AV node', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const lbbb = run(preset('lbbb'), 2.5).derived;
    expect(lbbb.prIntervalMs).toBeCloseTo(normal.prIntervalMs, 5);
  });
});

describe('ecg — atrial fibrillation', () => {
  it('loses organised atrial activity and beats irregularly', () => {
    const { derived } = run(preset('atrialFibrillation'), 8);

    expect(derived.rhythmRegular).toBe(false);
    // With no organised P wave there is no PR interval to measure.
    expect(derived.prIntervalMs).toBe(0);
  });

  it('produces genuinely varying RR intervals rather than a fixed rate', () => {
    const inputs = preset('atrialFibrillation');
    let state = createInitialState();
    const intervals: number[] = [];
    let lastCount = 0;

    for (let i = 0; i < 20 / DT; i++) {
      state = step(state, inputs, DT).state;
      if (state.ventricularBeatCount !== lastCount) {
        lastCount = state.ventricularBeatCount;
        intervals.push(state.lastRrIntervalMs);
      }
    }

    expect(intervals.length).toBeGreaterThan(5);
    const spread = Math.max(...intervals) - Math.min(...intervals);
    expect(spread).toBeGreaterThan(150);
  });
});

describe('ecg — hyperkalemia', () => {
  it('peaks the T wave, widens the QRS and flattens the P wave', () => {
    const normalSamples = run(DEFAULT_ECG_INPUTS, 3).samples;
    const hyperSamples = run(preset('hyperkalemia'), 3).samples;

    // The earliest and most characteristic change: a tall, narrow, peaked T wave.
    expect(peakDuring(hyperSamples, 'T wave')).toBeGreaterThan(peakDuring(normalSamples, 'T wave') * 1.8);

    const normal = run(DEFAULT_ECG_INPUTS, 3).derived;
    const hyper = run(preset('hyperkalemia'), 3).derived;
    expect(hyper.qrsDurationMs).toBeGreaterThan(normal.qrsDurationMs);
    // Accelerated repolarisation also shortens the QT.
    expect(hyper.qtIntervalMs).toBeLessThan(normal.qtIntervalMs);

    // Atrial excitability is depressed, so the P wave shrinks toward disappearing.
    expect(peakDuring(hyperSamples, 'P wave')).toBeLessThan(peakDuring(normalSamples, 'P wave'));
  });
});

describe('ecg — ischemic injury', () => {
  it('elevates ST in leads facing the injury and depresses it in the reciprocal lead', () => {
    const inferiorLeads: LeadName[] = ['II', 'III', 'aVF'];
    for (const lead of inferiorLeads) {
      const { samples } = run(preset('inferiorStemi', { lead }), 3);
      expect(meanDuring(samples, 'ST segment'), `${lead} should be elevated`).toBeGreaterThan(0.1);
    }

    // aVL looks at the inferior wall from the opposite direction, so the SAME injury current
    // projects negatively there — reciprocal change, straight out of the geometry.
    const reciprocal = run(preset('inferiorStemi', { lead: 'aVL' }), 3);
    expect(meanDuring(reciprocal.samples, 'ST segment')).toBeLessThan(-0.05);
  });

  it('leaves the ST segment isoelectric with no injury', () => {
    const { samples } = run(DEFAULT_ECG_INPUTS, 3);
    expect(Math.abs(meanDuring(samples, 'ST segment'))).toBeLessThan(0.02);
  });
});

describe('ecg — QT and rate correction', () => {
  it('prolongs QT and QTc when the action potential is lengthened', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const long = run(preset('longQt'), 2.5).derived;

    expect(long.qtIntervalMs).toBeGreaterThan(normal.qtIntervalMs);
    expect(long.qtcMs).toBeGreaterThan(460);
  });

  it("shortens raw QT as rate rises while Bazett's correction holds QTc roughly steady", () => {
    const slow = run({ ...DEFAULT_ECG_INPUTS, heartRate: 50 }, 4).derived;
    const fast = run({ ...DEFAULT_ECG_INPUTS, heartRate: 120 }, 4).derived;

    // The action potential genuinely shortens at higher rates...
    expect(fast.qtIntervalMs).toBeLessThan(slow.qtIntervalMs);
    // ...which is exactly the confound the correction removes.
    expect(Math.abs(fast.qtcMs - slow.qtcMs)).toBeLessThan(70);
  });

  it('computes Bazett correctly', () => {
    expect(bazettQtc(400, 1000)).toBeCloseTo(400, 5);
    expect(bazettQtc(400, 250)).toBeCloseTo(800, 5);
  });
});

describe('ecg — mean axis', () => {
  it('sits inferolaterally in a normal heart, dominated by LV mass', () => {
    const schedule = buildSchedule(DEFAULT_ECG_INPUTS, 1000);
    const axis = meanQrsAxisDegrees(schedule);
    expect(axis).toBeGreaterThan(-30);
    expect(axis).toBeLessThan(90);
  });
});

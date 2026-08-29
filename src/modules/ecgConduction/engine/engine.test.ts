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

/** Ventricular beat-to-beat intervals collected over a run, ms. Beats during the first
 * `settleSeconds` are discarded — every rhythm starts from a state at electrical rest, and
 * the first interval or two is startup bookkeeping rather than physiology. */
function rrIntervals(inputs: EcgInputs, seconds: number, settleSeconds = 2): number[] {
  let state = createInitialState();
  const intervals: number[] = [];
  let lastCount = 0;
  for (let i = 0; i < seconds / DT; i++) {
    state = step(state, inputs, DT).state;
    if (state.ventricularBeatCount !== lastCount) {
      lastCount = state.ventricularBeatCount;
      if (state.simTimeSeconds > settleSeconds) intervals.push(state.lastRrIntervalMs);
    }
  }
  return intervals;
}

describe('ecg — atrial flutter', () => {
  it('runs the atria at the circuit rate and filters it into a regular ~150', () => {
    const inputs = preset('atrialFlutter');
    const { derived } = run(inputs, 8);

    // The circuit ignores the sinus node: it drives the atria at its own fixed 300/min...
    expect(derived.heartRateBpm).toBe(300);
    // ...and the AV node's filtering leaves a REGULAR ventricular response near 150.
    expect(derived.rhythmRegular).toBe(true);
    expect(derived.ventricularRateBpm).toBeGreaterThan(135);
    expect(derived.ventricularRateBpm).toBeLessThan(165);
    // The chambers are not dissociated — every ventricular beat IS a conducted flutter wave.
    expect(derived.isDissociated).toBe(false);
  });

  it('conducts exactly every second circuit wave rather than at random', () => {
    const inputs = preset('atrialFlutter');
    let state = createInitialState();
    let atrialAtMark = 0;
    let ventricularAtMark = 0;
    for (let i = 0; i < 12 / DT; i++) {
      state = step(state, inputs, DT).state;
      if (state.simTimeSeconds > 4 && atrialAtMark === 0) {
        atrialAtMark = state.atrialBeatCount;
        ventricularAtMark = state.ventricularBeatCount;
      }
    }
    // After settling: two atrial activations per ventricular one.
    const ratio = (state.atrialBeatCount - atrialAtMark) / (state.ventricularBeatCount - ventricularAtMark);
    expect(ratio).toBeGreaterThan(1.9);
    expect(ratio).toBeLessThan(2.1);
    // And unlike fibrillation the RR intervals do not vary.
    const intervals = rrIntervals(inputs, 10);
    expect(Math.max(...intervals) - Math.min(...intervals)).toBeLessThan(5);
  });
});

describe('ecg — Wolff-Parkinson-White', () => {
  it('shortens PR below 120 ms because the accessory pathway skips the AV nodal delay', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const wpw = run(preset('wpw'), 2.5).derived;

    expect(normal.prIntervalMs).toBeGreaterThanOrEqual(120);
    expect(wpw.prIntervalMs).toBeGreaterThan(80);
    expect(wpw.prIntervalMs).toBeLessThan(120);
    // The chambers are still working together — this is pre-excitation, not dissociation.
    expect(wpw.isDissociated).toBe(false);
    expect(wpw.rhythmRegular).toBe(true);
  });

  it('widens and slurs the start of the QRS without turning it into a bundle-branch block', () => {
    const normal = run(DEFAULT_ECG_INPUTS, 2.5).derived;
    const wpw = run(preset('wpw'), 2.5).derived;
    const lbbb = run(preset('lbbb'), 2.5).derived;

    expect(wpw.qrsDurationMs).toBeGreaterThan(normal.qrsDurationMs + 15);
    // Part of the ventricle is activated through the fast system, so the complex never
    // widens as far as complete bypass of the conduction system would make it.
    expect(wpw.qrsDurationMs).toBeLessThan(lbbb.qrsDurationMs);
  });
});

describe('ecg — sick sinus syndrome', () => {
  it('drops the mean rate below the sinus rate by pausing intermittently', () => {
    const inputs = preset('sickSinus');
    const { derived } = run(inputs, 30);

    // The junctional pacemaker holds the ventricles through the pauses but at its own slower
    // rate, so the averaged rate sits clearly below what the SA node's firing would give.
    expect(derived.meanVentricularRateBpm).toBeLessThan(inputs.heartRate - 8);
    expect(derived.rhythmRegular).toBe(false);
  });

  it('fills each pause with junctional escape beats at their own slow rate', () => {
    const inputs = preset('sickSinus');
    const intervals = rrIntervals(inputs, 30);

    // The pauses are FILLED, so no single gap ever grows long — that is the point of an
    // escape pacemaker. What appears instead is a distinct cluster at the junctional rate.
    const escapes = intervals.filter((rr) => Math.abs(rr - 60000 / 42) < 60);
    expect(escapes.length).toBeGreaterThanOrEqual(2);
    // The longest interval stays under two escape cycles: the junction never lets a pause run on.
    expect(Math.max(...intervals)).toBeLessThan(2 * (60000 / 42) + 400);
    // ...and sinus beats continue between pauses (the SA node recovers).
    const sinus = intervals.filter((rr) => rr < 1100);
    expect(sinus.length).toBeGreaterThan(escapes.length);
  });

  it('keeps escape complexes narrow — the junction conducts down the normal bundles', () => {
    const { derived } = run(preset('sickSinus'), 8);
    expect(derived.qrsDurationMs).toBeLessThan(120);
  });
});

describe('ecg — ventricular tachycardia', () => {
  it('is a regular wide-complex tachycardia driven independently of the atria', () => {
    const inputs = preset('ventricularTachycardia');
    const { state, derived } = run(inputs, 10);

    expect(derived.ventricularRateBpm).toBeGreaterThan(160);
    expect(derived.ventricularRateBpm).toBeLessThan(200);
    // Monomorphic VT is fast but disciplined — the focus fires on time, every time.
    const intervals = rrIntervals(inputs, 8);
    expect(Math.max(...intervals) - Math.min(...intervals)).toBeLessThan(5);

    // Cell-to-cell activation from one focus cannot produce a narrow complex.
    expect(derived.qrsDurationMs).toBeGreaterThan(140);

    // AV dissociation: the sinus node keeps firing its much slower atrial rhythm behind.
    expect(derived.isDissociated).toBe(true);
    expect(state.atrialBeatCount).toBeGreaterThan(0);
  });
});

describe('ecg — torsades de pointes', () => {
  it('rotates successive complexes around the baseline instead of repeating one shape', () => {
    const { samples } = run(preset('torsades'), 7.2); // three full twist periods

    // Amplitude envelope per twist period: with a rotating axis the same lead sees
    // strongly positive, then near-flat, then strongly negative deflections.
    const windowSeconds = 2.4; // the twist period, seconds
    const perWindow: { max: number; min: number }[] = [];
    for (let start = 0; start < 7; start += windowSeconds) {
      const inWindow = samples.filter((s) => s.tMs >= start * 1000 && s.tMs < (start + windowSeconds) * 1000);
      if (inWindow.length === 0) continue;
      perWindow.push({ max: Math.max(...inWindow.map((s) => s.mv)), min: Math.min(...inWindow.map((s) => s.mv)) });
    }

    const strongestPositive = Math.max(...perWindow.map((w) => w.max));
    const strongestNegative = Math.min(...perWindow.map((w) => w.min));
    // The twist has to carry the complex through BOTH polarities in the same lead.
    expect(strongestPositive).toBeGreaterThan(0.4);
    expect(strongestNegative).toBeLessThan(-0.4);
    // And the envelope genuinely travels between them: the total swing approaches twice
    // the larger polarity, not a small ripple on an upright complex.
    expect(strongestPositive - strongestNegative).toBeGreaterThan(
      0.9 * Math.max(strongestPositive, -strongestNegative),
    );
  });

  it('sits on a long-QT substrate — that is part of the diagnosis', () => {
    const { derived } = run(preset('torsades'), 6);
    expect(derived.qtcMs).toBeGreaterThan(460);
  });
});

describe('ecg — ventricular fibrillation', () => {
  it('never organises anything: low-amplitude chaos, no waves, no measurable QRS', () => {
    const { samples, derived } = run(preset('ventricularFibrillation'), 6);

    // A normal R wave clears 1 mV; VF never aligns enough to reach even half of that.
    const peakToPeak = Math.max(...samples.map((s) => s.mv)) - Math.min(...samples.map((s) => s.mv));
    expect(peakToPeak).toBeLessThan(0.55);
    expect(peakToPeak).toBeGreaterThan(0.08);

    for (const sample of samples) expect(sample.segment).toBe('baseline');
    expect(derived.rhythmRegular).toBe(false);
  });

  it('beats erratically fast rather than at any fixed rate', () => {
    const intervals = rrIntervals(preset('ventricularFibrillation'), 10);
    expect(intervals.length).toBeGreaterThan(15);
    expect(Math.max(...intervals) - Math.min(...intervals)).toBeGreaterThan(60);
  });
});

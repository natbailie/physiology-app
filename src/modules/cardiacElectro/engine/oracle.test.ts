/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { CARDIAC_PRESETS, DEFAULT_CARDIAC_INPUTS } from './presets';
import type { CardiacInputs } from './types';

/**
 * Left-heart pressure and volume from Pulse, sampled at the full 50 Hz over two windows of
 * Kitware's baroreflex scenario — a healthy baseline, and the reduced-preload state after a
 * Class I bleed. Two independent pressure-volume loops. See `tools/pulse-oracle/`.
 *
 * The comparison has to be made at MATCHED PRELOAD. Our `preloadEDV` is an input the learner
 * sets; Pulse's end-diastolic volume is emergent, and its healthy ventricle fills to 142 mL where
 * our default is 120. Comparing the two defaults would measure that modelling choice and nothing
 * else. Filling our ventricle to Pulse's volume and then asking where it ends up in systole is
 * the question that actually tests our elastance and contractility.
 */

interface PvSample {
  t: number;
  lvPressureMmHg: number;
  lvVolumeMl: number;
  heartRateBpm: number;
  strokeVolumeMl: number;
  ejectionFraction: number;
}

interface PvTrace {
  denseWindows: [number, number][];
  samples: PvSample[];
}

const trace = JSON.parse(
  readFileSync(fileURLToPath(new URL('./__oracle__/pv-loop.json', import.meta.url)), 'utf8'),
) as PvTrace;

function window(index: number) {
  const span = trace.denseWindows[index];
  if (!span) throw new Error(`no dense window ${index}`);
  const [from, to] = span;
  const samples = trace.samples.filter((s) => s.t >= from && s.t <= to);
  const volumes = samples.map((s) => s.lvVolumeMl);
  const pressures = samples.map((s) => s.lvPressureMmHg);
  const edv = Math.max(...volumes);
  const esv = Math.min(...volumes);
  return {
    samples,
    edv,
    esv,
    strokeVolume: edv - esv,
    ejectionFractionPercent: ((edv - esv) / edv) * 100,
    peakPressure: Math.max(...pressures),
    reportedStrokeVolume: samples[0]!.strokeVolumeMl,
    reportedEjectionFraction: samples[0]!.ejectionFraction,
    heartRate: samples[0]!.heartRateBpm,
  };
}

const pulseHealthy = window(0);
const pulseReducedPreload = window(1);

/** Run to a steady rhythm and read the loop off the last five seconds. */
function ourLoop(patch: Partial<CardiacInputs>, seconds = 20) {
  const inputs = { ...DEFAULT_CARDIAC_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  const volumes: number[] = [];
  const pressures: number[] = [];
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.002);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
    if (t > seconds - 5) {
      volumes.push(derived.lvVolumeML);
      pressures.push(derived.lvPressureMmHg);
    }
  }
  const edv = Math.max(...volumes);
  const esv = Math.min(...volumes);
  return { derived, edv, esv, strokeVolume: edv - esv, peakPressure: Math.max(...pressures) };
}

const ourDefault = ourLoop(CARDIAC_PRESETS.normal);
// Our ventricle filled to the volume Pulse's reached after its bleed.
const ourMatched = ourLoop({ preloadEDV: Math.round(pulseReducedPreload.edv) });

describe('oracle: the trace contains real loops', () => {
  it('captures several complete beats in each window', () => {
    for (const loop of [pulseHealthy, pulseReducedPreload]) {
      expect(loop.samples.length).toBeGreaterThan(200);
      // A loop, not a drift: the ventricle both fills and empties substantially.
      expect(loop.strokeVolume).toBeGreaterThan(30);
    }
  });

  it('agrees with Pulse’s own reported stroke volume and ejection fraction', () => {
    // Reading EDV and ESV off the raw pressure-volume samples must reproduce the summary values
    // Pulse computes internally, or the extraction above is wrong.
    expect(pulseHealthy.strokeVolume).toBeCloseTo(pulseHealthy.reportedStrokeVolume, 0);
    expect(pulseHealthy.ejectionFractionPercent / 100).toBeCloseTo(pulseHealthy.reportedEjectionFraction, 1);
    expect(pulseReducedPreload.strokeVolume).toBeCloseTo(pulseReducedPreload.reportedStrokeVolume, 0);
  });

  it('shows the bleed having reduced preload', () => {
    expect(pulseReducedPreload.edv).toBeLessThan(pulseHealthy.edv);
  });
});

describe('oracle: at matched preload our ventricle behaves like Pulse’s', () => {
  it('fills to the same end-diastolic volume, by construction', () => {
    expect(Math.abs(ourMatched.edv - pulseReducedPreload.edv)).toBeLessThan(5);
  });

  it('empties to the same end-systolic volume — the test of contractility and afterload', () => {
    expect(Math.abs(ourMatched.esv - pulseReducedPreload.esv)).toBeLessThan(8);
  });

  it('ejects the same stroke volume', () => {
    expect(Math.abs(ourMatched.strokeVolume - pulseReducedPreload.strokeVolume)).toBeLessThan(10);
  });

  it('reaches the same ejection fraction', () => {
    const ours = (ourMatched.strokeVolume / ourMatched.edv) * 100;
    expect(Math.abs(ours - pulseReducedPreload.ejectionFractionPercent)).toBeLessThan(8);
  });

  it('generates a comparable peak ventricular pressure', () => {
    expect(Math.abs(ourMatched.peakPressure - pulseReducedPreload.peakPressure) / pulseReducedPreload.peakPressure).toBeLessThan(0.2);
  });
});

describe('oracle: end-systolic volume is defended against preload, in both engines', () => {
  it('leaves ESV almost unchanged when preload falls, as Pulse does', () => {
    // Starling: dropping preload costs stroke volume, but end-systolic volume is set by
    // contractility and afterload and barely moves. This is what the PV loop is for.
    expect(Math.abs(pulseReducedPreload.esv - pulseHealthy.esv)).toBeLessThan(6);
    expect(Math.abs(ourMatched.esv - ourDefault.esv)).toBeLessThan(6);
  });

  it('costs stroke volume instead, as Pulse does', () => {
    expect(pulseReducedPreload.strokeVolume).toBeLessThan(pulseHealthy.strokeVolume);
    expect(ourLoop(CARDIAC_PRESETS.hypovolemia).strokeVolume).toBeLessThan(ourDefault.strokeVolume);
  });
});

describe('oracle: open questions', () => {
  it.todo(
    'decide whether end-diastolic volume should stay a direct input — Pulse’s healthy ventricle ' +
      'fills to 142 mL against our default 120, because for Pulse EDV is emergent from venous ' +
      'return while for us it is the preloadEDV slider. Matched at the same EDV the two ventricles ' +
      'agree closely (ESV 60.5 vs 60.0, SV 61.4 vs 62.4, EF 50.3% vs 51.0%), so this is a modelling ' +
      'choice rather than a calibration error — but it does mean the loop cannot respond to a bleed ' +
      'on its own',
  );
});

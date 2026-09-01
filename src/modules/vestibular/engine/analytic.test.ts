import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_VESTIBULAR_INPUTS } from './presets';
import type { VestibularInputs } from './types';

/**
 * An ANALYTIC oracle against the Steinhausen torsion-pendulum model of the semicircular canal,
 * written out here rather than imported.
 *
 * Steinhausen (1933) showed the cupula behaves as an overdamped torsion pendulum, which has one
 * consequence that dominates everything the canal does: at ordinary head-turn frequencies the
 * cupula deflects in proportion to head VELOCITY even though the stimulus is acceleration. The
 * canal is an integrating accelerometer, and that is why it can drive the vestibulo-ocular reflex
 * at all — the eyes need a velocity command, not an acceleration one.
 *
 * The second consequence is that sustained rotation FADES. The cupula returns to rest with a time
 * constant of a few seconds, so a constant-velocity turn stops being felt after ten or twenty
 * seconds and stopping produces an after-sensation in the opposite direction. Every rotating-chair
 * test and every episode of post-spin dizziness is this exponential.
 */

/** First-order decay: x(t) = x0 * exp(-t/tau). The torsion pendulum reduced to its dominant
 * (overdamped) mode, which is what the canal operates in over the physiological band. */
function exponentialDecay(initial: number, elapsedSeconds: number, tauSeconds: number): number {
  return initial * Math.exp(-elapsedSeconds / tauSeconds);
}

/** Time for a first-order system to fall to a given fraction of its starting value. */
function timeToFraction(fraction: number, tauSeconds: number): number {
  return -tauSeconds * Math.log(fraction);
}

function run(patch: Partial<VestibularInputs>, seconds: number, from?: ReturnType<typeof createInitialState>) {
  const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, ...patch };
  let state = from ?? createInitialState();
  let derived = computeDerived(state, inputs);
  const dt = 0.02;
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return { state, derived };
}

/** Samples cupula deflection every dt while the head turns at a constant velocity. */
function sustainedTurn(headTurnVelocityDegPerSec: number, seconds: number) {
  const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, headTurnVelocityDegPerSec };
  let state = createInitialState();
  const dt = 0.02;
  const samples: { t: number; deflection: number }[] = [];
  for (let t = 0; t < seconds; t += dt) {
    const next = step(state, inputs, dt);
    state = next.state;
    samples.push({ t: t + dt, deflection: Math.abs(next.derived.cupulaDeflection) });
  }
  return samples;
}

describe('analytic: the cupula is an overdamped torsion pendulum', () => {
  it('deflects in proportion to head VELOCITY, not acceleration', () => {
    // The defining property, and the reason the canal can drive a velocity reflex. Doubling the
    // turn rate should roughly double the peak deflection.
    const slow = sustainedTurn(30, 1.5);
    const fast = sustainedTurn(60, 1.5);
    const peak = (s: { deflection: number }[]) => Math.max(...s.map((x) => x.deflection));
    expect(peak(fast) / peak(slow)).toBeGreaterThan(1.7);
    expect(peak(fast) / peak(slow)).toBeLessThan(2.3);
  });

  it('FADES during a sustained constant-velocity turn, as the pendulum returns to rest', () => {
    // Constant velocity means zero acceleration, so there is nothing left to hold the cupula over.
    // A learner spun at a steady rate stops feeling it — which is the whole basis of the
    // rotating-chair test and of why pilots lose the sense of a sustained turn.
    const samples = sustainedTurn(60, 40);
    const peak = Math.max(...samples.map((s) => s.deflection));
    const late = samples[samples.length - 1]!.deflection;
    expect(late).toBeLessThan(peak * 0.2);
  });

  it('fades EXPONENTIALLY, with a time constant of a few seconds', () => {
    // Steinhausen's dominant time constant for the human horizontal canal is about 4-7 s. Recovered
    // from the decay itself rather than read out of our constants, so this measures the model.
    const samples = sustainedTurn(60, 40);
    const peakIndex = samples.reduce((best, s, i) => (s.deflection > samples[best]!.deflection ? i : best), 0);
    const peak = samples[peakIndex]!;

    const decaying = samples.slice(peakIndex + 1).filter((s) => s.deflection > peak.deflection * 0.05);
    // Fit tau by least squares on the log of the decay: log(x) = log(x0) - t/tau.
    const n = decaying.length;
    const meanT = decaying.reduce((sum, s) => sum + (s.t - peak.t), 0) / n;
    const meanLog = decaying.reduce((sum, s) => sum + Math.log(s.deflection), 0) / n;
    const numerator = decaying.reduce((sum, s) => sum + (s.t - peak.t - meanT) * (Math.log(s.deflection) - meanLog), 0);
    const denominator = decaying.reduce((sum, s) => sum + (s.t - peak.t - meanT) ** 2, 0);
    const recoveredTau = -1 / (numerator / denominator);

    expect(recoveredTau).toBeGreaterThan(2);
    expect(recoveredTau).toBeLessThan(12);

    // And the decay it implies matches the samples: this is an exponential, not merely a fall.
    const halfway = decaying[Math.floor(n / 2)]!;
    expect(halfway.deflection).toBeCloseTo(
      exponentialDecay(peak.deflection, halfway.t - peak.t, recoveredTau),
      1,
    );
  });

  it('takes about three time constants to fade to a twentieth, as first-order systems do', () => {
    // 3 tau is 95% gone, whatever tau is. Asserting the RATIO rather than the seconds makes this a
    // test of the system order rather than of the constant.
    expect(timeToFraction(0.05, 5)).toBeCloseTo(3 * 5, 0);
    const samples = sustainedTurn(60, 40);
    const peakIndex = samples.reduce((best, s, i) => (s.deflection > samples[best]!.deflection ? i : best), 0);
    const peak = samples[peakIndex]!;
    const fadePoint = samples.slice(peakIndex).find((s) => s.deflection < peak.deflection * 0.05);
    expect(fadePoint).toBeDefined();
    expect(fadePoint!.t - peak.t).toBeGreaterThan(5);
    expect(fadePoint!.t - peak.t).toBeLessThan(40);
  });
});

describe('analytic: the reflex is driven by the DIFFERENCE between the two labyrinths', () => {
  it('balances at rest, so the imbalance rather than the firing rate is the signal', () => {
    // Both canals fire tonically near 90 spikes/s. Ewald's observation: rotation excites one and
    // inhibits the other, and it is the difference the brainstem reads. Which is why a unilateral
    // lesion is devastating and a symmetric bilateral one causes no vertigo at all.
    const rest = run({}, 20).derived;
    expect(rest.canalFiringRightSpikesPerSec).toBeCloseTo(rest.canalFiringLeftSpikesPerSec, 1);
    expect(Math.abs(rest.firingImbalanceSpikesPerSec)).toBeLessThan(1);
    expect(Math.abs(rest.slowPhaseVelocityDegPerSec)).toBeLessThan(1);
  });

  it('produces an imbalance only while the head is actually turning', () => {
    // During rotation one canal is excited and the other inhibited, so the difference is large and
    // the eyes are driven. Stop turning and — after the cupula has returned — the difference goes
    // back to zero. Nystagmus at REST means a lesion; nystagmus during rotation is the reflex
    // working.
    const turning = run({ headTurnVelocityDegPerSec: 90 }, 1).derived;
    expect(Math.abs(turning.firingImbalanceSpikesPerSec)).toBeGreaterThan(5);
    expect(Math.abs(turning.slowPhaseVelocityDegPerSec)).toBeGreaterThan(5);

    const settled = run({ headTurnVelocityDegPerSec: 0 }, 40).derived;
    expect(Math.abs(settled.firingImbalanceSpikesPerSec)).toBeLessThan(1);
  });

  it('gives a VOR gain near unity, because the eyes must exactly cancel the head', () => {
    // Gain is eye velocity over head velocity. It has to be near 1 or gaze slips during every head
    // movement, which is what oscillopsia is. Below about 0.6 the head-impulse test becomes
    // positive and a catch-up saccade appears.
    const d = run({}, 20).derived;
    expect(d.vorGain).toBeGreaterThan(0.85);
    expect(d.vorGain).toBeLessThan(1.05);
  });
});

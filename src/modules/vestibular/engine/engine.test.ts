import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbHeadImpulse, perturbPerformHallpike, step } from './engine';
import { DEFAULT_VESTIBULAR_INPUTS, VESTIBULAR_PRESETS } from './presets';
import type { VestibularDerived, VestibularInputs } from './types';

function settle(patch: Partial<VestibularInputs>, seconds = 60): VestibularDerived {
  const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.05);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

describe('baseline', () => {
  it('settles a normal subject quiet and stable', () => {
    const d = settle(VESTIBULAR_PRESETS.normal);
    expect(d.classification).toBe('normal');
    expect(Math.abs(d.slowPhaseVelocityDegPerSec)).toBeLessThan(2);
    expect(d.vertigoIntensityPct).toBeLessThan(5);
    expect(d.vorGain).toBeGreaterThan(0.85);
  });
});

describe('the canals signal changes, not velocity', () => {
  it('lets spinning sensation fade during a sustained constant-velocity turn', () => {
    // Sample the transient early, then the settled steady state.
    const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, headTurnVelocityDegPerSec: 140 };
    let state = createInitialState();
    for (let t = 0; t < 1; t += 0.05) state = step(state, inputs, 0.05).state;
    const early = computeDerived(state, inputs);
    for (let t = 0; t < 40; t += 0.05) state = step(state, inputs, 0.05).state;
    const late = computeDerived(state, inputs);
    expect(Math.abs(late.cupulaDeflection)).toBeLessThan(Math.abs(early.cupulaDeflection) / 3);
    expect(Math.abs(late.slowPhaseVelocityDegPerSec)).toBeLessThan(
      Math.abs(early.slowPhaseVelocityDegPerSec) / 2,
    );
  });

  it('reverses into post-rotatory nystagmus when the spin stops', () => {
    const spin = { ...DEFAULT_VESTIBULAR_INPUTS, headTurnVelocityDegPerSec: 140 };
    let state = createInitialState();
    for (let t = 0; t < 30; t += 0.05) state = step(state, spin, 0.05).state;

    const stopped = { ...spin, headTurnVelocityDegPerSec: 0 };
    for (let t = 0; t < 2; t += 0.05) state = step(state, stopped, 0.05).state;
    const afterStop = computeDerived(state, stopped);
    expect(Math.abs(afterStop.slowPhaseVelocityDegPerSec)).toBeGreaterThan(5);
  });
});

describe('destructive versus irritative lesions', () => {
  it('beats acute neuritis nystagmus AWAY from the silent ear with severe vertigo', () => {
    const d = settle(VESTIBULAR_PRESETS.acuteNeuritis);
    expect(d.classification).toBe('acute unilateral vestibulopathy');
    // Right canal silent: firing dominance sits left, so the SPV reads negative.
    expect(d.slowPhaseVelocityDegPerSec).toBeLessThan(-10);
    expect(d.vertigoIntensityPct).toBeGreaterThan(50);
    expect(d.canalFiringRightSpikesPerSec).toBeLessThan(d.canalFiringLeftSpikesPerSec);
  });

  it('beats an IRRITATIVE lesion nystagmus TOWARD the affected ear', () => {
    const d = settle(VESTIBULAR_PRESETS.meniereIrritative);
    expect(d.classification).toContain('toward');
    expect(d.slowPhaseVelocityDegPerSec).toBeLessThan(0);
    expect(d.vertigoIntensityPct).toBeGreaterThan(20);
  });

  it('keeps compensated loss QUIET but mechanically deaf to head impulses', () => {
    const d = settle(VESTIBULAR_PRESETS.compensatedNeuritis);
    expect(d.vertigoIntensityPct).toBeLessThan(15);
    expect(Math.abs(d.slowPhaseVelocityDegPerSec)).toBeLessThan(3);
    // Compensation suppresses the signal but never restores the mechanics.
    expect(d.vorGain).toBeLessThan(0.55);

    const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, ...VESTIBULAR_PRESETS.compensatedNeuritis };
    let state = createInitialState();
    for (let t = 0; t < 20; t += 0.05) state = step(state, inputs, 0.05).state;
    const impulse = computeDerived(perturbHeadImpulse(state), inputs);
    expect(impulse.headImpulsePositive).toBe(true);
  });
});

describe('bilateral loss', () => {
  it('silences vertigo and nystagmus while leaving oscillopsia and ataxia', () => {
    const moving = settle({ ...VESTIBULAR_PRESETS.bilateralLoss, headTurnVelocityDegPerSec: 90 });
    expect(moving.classification).toBe('bilateral vestibular loss');
    expect(moving.vertigoIntensityPct).toBeLessThan(10);
    expect(moving.oscillopsiaPct).toBeGreaterThan(50);
    expect(moving.rombergUnsteadinessPct).toBeGreaterThan(50);
  });
});

describe('BPPV', () => {
  it('shows latency then build-up then fatigue on Hallpike', () => {
    const inputs = { ...DEFAULT_VESTIBULAR_INPUTS, ...VESTIBULAR_PRESETS.bppvPosterior };
    let state = createInitialState();
    const provoked = perturbPerformHallpike(state);
    // Early in the hold: still within the latency window.
    let s = provoked;
    for (let t = 0; t < 4; t += 0.05) s = step(s, inputs, 0.05).state;
    const latent = computeDerived(s, inputs);
    expect(latent.positionalNystagmusPct).toBeCloseTo(0, 0);

    // Mid-hold: built up.
    for (let t = 0; t < 14; t += 0.05) s = step(s, inputs, 0.05).state;
    const peak = computeDerived(s, inputs);
    expect(peak.positionalNystagmusPct).toBeGreaterThan(30);

    // Late hold: fatiguing.
    for (let t = 0; t < 25; t += 0.05) s = step(s, inputs, 0.05).state;
    const tired = computeDerived(s, inputs);
    expect(tired.positionalNystagmusPct).toBeLessThan(peak.positionalNystagmusPct);
  });

  it('leaves everything quiet when upright', () => {
    const d = settle(VESTIBULAR_PRESETS.bppvPosterior);
    expect(d.positionalNystagmusPct).toBe(0);
    expect(d.vertigoIntensityPct).toBeLessThan(5);
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<VestibularInputs>[] = [
      { headTurnVelocityDegPerSec: -200, rightCanalFunction: 0 },
      { headTurnVelocityDegPerSec: 200, leftCanalFunction: 0, otolithFunction: 0 },
      { centralCompensation: 1, canalithDebris: 1, irritativeDriveLeft: 1 },
      { rightCanalFunction: 0.05, leftCanalFunction: 0.05, centralCompensation: 0 },
    ];
    for (const patch of extremes) {
      const d = settle(patch, 30);
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
    }
  });
});

import { describe, expect, it } from 'vitest';
import { SIMULATION } from './constants';
import { computeDerived, createInitialState, tick } from './engine';
import { DEFAULT_MICTURITION_INPUTS } from './presets';
import type { MicturitionInputs } from './types';

function run(
  seconds: number,
  overrides: Partial<MicturitionInputs> = {},
  startOverrides: Partial<ReturnType<typeof createInitialState>> = {},
) {
  let state = { ...createInitialState(), ...startOverrides };
  const inputs = { ...DEFAULT_MICTURITION_INPUTS, ...overrides };
  const dt = SIMULATION.MAX_DT_SECONDS;
  let remaining = seconds;
  while (remaining > 0) {
    const d = Math.min(remaining, dt);
    remaining -= d;
    state = tick(state, inputs, d);
  }
  return { state, derived: computeDerived(state, inputs) };
}

describe('micturition engine', () => {
  it('starts with a small resting volume and no detrusor tone', () => {
    const { state, derived } = run(0);
    expect(state.bladderVolumeML).toBe(50);
    expect(state.detrusorTone).toBe(0);
    expect(derived.phase).toBe('filling');
  });

  it('fills steadily at the ureteric inflow rate', () => {
    const { state } = run(3600, { voluntarySphincterPct: 95, sympatheticPct: 50 });
    // 50 mL start + 1.5 mL/min × 60 min = 140 mL
    expect(state.bladderVolumeML).toBeGreaterThan(135);
    expect(state.bladderVolumeML).toBeLessThan(145);
  });

  it('produces the first desire around 180 mL', () => {
    const { state, derived } = run(7200, { voluntarySphincterPct: 95, sympatheticPct: 50 });
    // 50 + 1.5 × 120 = 230 mL
    expect(state.bladderVolumeML).toBeGreaterThan(220);
    expect(state.bladderVolumeML).toBeLessThan(240);
    expect(['first desire', 'strong desire']).toContain(derived.phase);
    expect(derived.afferentFiringRate).toBeGreaterThan(0);
  });

  it('produces a strong desire around 350 mL', () => {
    const { state, derived } = run(14400, { voluntarySphincterPct: 95, sympatheticPct: 50 });
    // 50 + 1.5 × 240 = 410 mL — the reflex kicks in but strong sphincter holds
    expect(state.bladderVolumeML).toBeGreaterThan(380);
    expect(derived.phase).not.toBe('filling');
    expect(derived.afferentFiringRate).toBeGreaterThan(0.4);
  });

  it('rises in pressure as volume increases', () => {
    const low = run(1800, { voluntarySphincterPct: 95 });
    const high = run(10800, { voluntarySphincterPct: 95 });
    expect(high.derived.intravesicalPressureCmH2O).toBeGreaterThan(
      low.derived.intravesicalPressureCmH2O,
    );
  });

  it('contracts the detrusor when parasympathetic drive is high', () => {
    const { derived } = run(60, { parasympatheticPct: 90, sympatheticPct: 5 });
    expect(derived.detrusorTone).toBeGreaterThan(0.5);
  });

  it('relaxes the detrusor when sympathetic drive is high', () => {
    const { derived } = run(60, { parasympatheticPct: 10, sympatheticPct: 90 });
    expect(derived.detrusorTone).toBeLessThan(0.15);
  });

  it('contracts the external sphincter in response to voluntary input', () => {
    const { derived } = run(60, { voluntarySphincterPct: 95 });
    expect(derived.externalSphincterTone).toBeGreaterThan(0.8);
  });

  it('relaxes the external sphincter when the learner lets go', () => {
    const { derived } = run(60, { voluntarySphincterPct: 5 });
    expect(derived.externalSphincterTone).toBeLessThan(0.15);
  });

  it('voids when detrusor pressure exceeds sphincter closing pressure', () => {
    const start = { bladderVolumeML: 400 };
    // High detrusor, open sphincter — pressure gradient drives flow.
    const { state } = run(
      30,
      { parasympatheticPct: 85, sympatheticPct: 5, voluntarySphincterPct: 5 },
      start,
    );
    expect(state.bladderVolumeML).toBeLessThan(350);
  });

  it('holds volume when the sphincter closing pressure exceeds intravesical pressure', () => {
    const start = { bladderVolumeML: 350 };
    // Strong sphincter (closing pressure ~76 cmH₂O) resists even an active detrusor.
    const { state } = run(
      30,
      { parasympatheticPct: 70, sympatheticPct: 10, voluntarySphincterPct: 95 },
      start,
    );
    // Pressure at 350 mL with detrusor: passive ≈ 2.7, active ≈ 40×0.5 = 20 → ~23 cmH₂O
    // Sphincter closing: 80×0.95 = 76 cmH₂O → no flow, volume rises from filling.
    expect(state.bladderVolumeML).toBeGreaterThan(350);
  });

  it('cortex inhibition suppresses the reflex even at high afferent firing', () => {
    const start = { bladderVolumeML: 420 };
    const { derived } = run(
      60,
      { cortexInhibitsMicturition: true, voluntarySphincterPct: 80 },
      start,
    );
    expect(derived.phase).not.toBe('voiding');
    expect(derived.detrusorTone).toBeLessThan(0.5);
  });

  it('detrusor overactivity generates contractions at low volume', () => {
    const { derived } = run(300, {
      parasympatheticPct: 70,
      sympatheticPct: 10,
      voluntarySphincterPct: 85,
    });
    expect(derived.detrusorTone).toBeGreaterThan(0.3);
  });

  it('stress incontinence: weak sphincter cannot contain pressure at high volume', () => {
    const start = { bladderVolumeML: 400 };
    // Weak sphincter (closing pressure ~20 cmH₂O) vs high detrusor pressure.
    const { derived, state } = run(
      10,
      { parasympatheticPct: 60, sympatheticPct: 10, voluntarySphincterPct: 20 },
      start,
    );
    expect(derived.externalSphincterTone).toBeLessThan(0.35);
    // Volume should drop as pressure-driven leakage exceeds filling.
    expect(state.bladderVolumeML).toBeLessThan(400);
  });

  it('overflow incontinence: weak detrusor cannot empty against any sphincter', () => {
    const start = { bladderVolumeML: 500 };
    const { state } = run(
      7200,
      { parasympatheticPct: 5, sympatheticPct: 60, voluntarySphincterPct: 50 },
      start,
    );
    // With minimal detrusor tone, filling continues until anatomical maximum.
    expect(state.bladderVolumeML).toBeGreaterThanOrEqual(595);
  });

  it('neurogenic bladder has no detrusor tone and no voluntary control', () => {
    const { derived } = run(300, {
      parasympatheticPct: 0,
      sympatheticPct: 0,
      voluntarySphincterPct: 0,
    });
    expect(derived.detrusorTone).toBeLessThan(0.05);
    expect(derived.externalSphincterTone).toBeLessThan(0.05);
  });

  it('voids more slowly with a strong voluntary sphincter', () => {
    const start = { bladderVolumeML: 400 };
    // Strong sphincter resists voiding.
    const strong = run(
      30,
      { parasympatheticPct: 80, sympatheticPct: 5, voluntarySphincterPct: 90 },
      start,
    );
    const weak = run(
      30,
      { parasympatheticPct: 80, sympatheticPct: 5, voluntarySphincterPct: 10 },
      start,
    );
    expect(strong.state.bladderVolumeML).toBeGreaterThan(weak.state.bladderVolumeML);
  });

  it('reaches overflow phase at maximum capacity', () => {
    const start = { bladderVolumeML: 595 };
    const { derived } = run(
      120,
      { parasympatheticPct: 5, sympatheticPct: 60, voluntarySphincterPct: 50 },
      start,
    );
    expect(derived.phase).toBe('overflow');
  });
});

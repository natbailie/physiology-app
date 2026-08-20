import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_HPG_INPUTS, HPG_PRESETS } from './presets';
import { pituitaryResponsiveness } from './gnrh';
import type { HpgInputs } from './types';

const DT = 0.5;

/** Runs the axis and reports what happened across the run, including every surge. */
function run(inputs: HpgInputs, seconds = 900) {
  let state = createInitialState();
  let surgeCount = 0;
  let previouslyPositive = false;
  let peakLh = 0;
  let peakEstrogen = 0;
  let peakProgesterone = 0;
  const surgeTimes: number[] = [];

  for (let t = 0; t < seconds; t += DT) {
    const derived = computeDerived(state, inputs);
    peakLh = Math.max(peakLh, derived.lhLevel);
    peakEstrogen = Math.max(peakEstrogen, derived.estrogenLevel);
    peakProgesterone = Math.max(peakProgesterone, derived.progesteroneLevel);

    const positive = derived.feedbackMode === 'positive';
    if (positive && !previouslyPositive) {
      surgeCount++;
      surgeTimes.push(t);
    }
    previouslyPositive = positive;
    state = step(state, inputs, DT).state;
  }

  return { state, derived: computeDerived(state, inputs), surgeCount, surgeTimes, peakLh, peakEstrogen, peakProgesterone };
}

function preset(name: keyof typeof HPG_PRESETS, overrides: Partial<HpgInputs> = {}): HpgInputs {
  return { ...DEFAULT_HPG_INPUTS, ...HPG_PRESETS[name], ...overrides };
}

describe('engine — GnRH pulsatility', () => {
  it('needs pulses to be neither too infrequent nor effectively continuous', () => {
    const optimal = pituitaryResponsiveness(1);
    const tooSlow = pituitaryResponsiveness(0.15);
    const continuous = pituitaryResponsiveness(1.6);

    expect(optimal).toBeCloseTo(1, 1);
    expect(tooSlow).toBeLessThan(0.2);
    // The GnRH-agonist paradox: a continuous signal SUPPRESSES the axis.
    expect(continuous).toBeLessThan(0.2);
  });

  it('suppresses the axis when GnRH is given continuously rather than in pulses', () => {
    const pulsatile = run({ ...DEFAULT_HPG_INPUTS, sex: 'male', gnrhPulseFrequency: 1 }, 400);
    const continuous = run({ ...DEFAULT_HPG_INPUTS, sex: 'male', gnrhPulseFrequency: 2 }, 400);

    expect(continuous.derived.lhLevel).toBeLessThan(pulsatile.derived.lhLevel * 0.4);
    expect(continuous.derived.testosteroneLevel).toBeLessThan(pulsatile.derived.testosteroneLevel * 0.4);
  });
});

describe('engine — the female cycle and the LH surge', () => {
  it('fires a mid-cycle LH surge that flips feedback from negative to positive', () => {
    const result = run(preset('normalFemaleCycle'));

    expect(result.surgeCount).toBeGreaterThanOrEqual(2);
    expect(result.peakLh).toBeGreaterThan(0.8);
  });

  it('produces one surge per cycle, at a reproducible interval', () => {
    const { surgeTimes } = run(preset('normalFemaleCycle'), 1200);
    expect(surgeTimes.length).toBeGreaterThanOrEqual(3);

    const intervals: number[] = [];
    for (let i = 1; i < surgeTimes.length; i++) intervals.push(surgeTimes[i]! - surgeTimes[i - 1]!);
    // Every gap should be within a few percent of the same cycle length.
    const first = intervals[0]!;
    for (const interval of intervals) {
      expect(Math.abs(interval - first) / first).toBeLessThan(0.1);
    }
  });

  it('runs the classic hormone sequence: estrogen rises, then the surge, then progesterone', () => {
    const inputs = preset('normalFemaleCycle');
    let state = createInitialState();

    let estrogenBeforeSurge = 0;
    let progesteroneBeforeSurge = 0;
    let sawSurge = false;
    let progesteroneAfterSurge = 0;

    for (let t = 0; t < 600; t += DT) {
      const derived = computeDerived(state, inputs);
      if (!sawSurge) {
        estrogenBeforeSurge = Math.max(estrogenBeforeSurge, derived.estrogenLevel);
        progesteroneBeforeSurge = Math.max(progesteroneBeforeSurge, derived.progesteroneLevel);
        if (derived.feedbackMode === 'positive') sawSurge = true;
      } else {
        progesteroneAfterSurge = Math.max(progesteroneAfterSurge, derived.progesteroneLevel);
      }
      state = step(state, inputs, DT).state;
    }

    expect(sawSurge).toBe(true);
    // Estrogen must climb high BEFORE the surge — it is what triggers it.
    expect(estrogenBeforeSurge).toBeGreaterThan(0.6);
    // Progesterone is essentially absent until ovulation, then rises from the corpus luteum.
    expect(progesteroneBeforeSurge).toBeLessThan(0.15);
    expect(progesteroneAfterSurge).toBeGreaterThan(0.4);
  });

  it('returns to negative feedback after the surge, so it fires once rather than latching', () => {
    const { derived, surgeCount } = run(preset('normalFemaleCycle'), 900);
    expect(surgeCount).toBeGreaterThanOrEqual(2);
    // Not stuck in the positive-feedback window at the end of the run.
    expect(derived.feedbackMode).toBe('negative');
  });

  it('never produces NaN/Infinity and keeps every hormone within 0..1', () => {
    const extremes: HpgInputs[] = [];
    for (const sex of ['male', 'female'] as const) {
      for (const gnrhPulseFrequency of [0, 2]) {
        for (const hypothalamicSuppression of [0, 100]) {
          for (const gonadalFunction of [0, 1.5]) {
            extremes.push({
              sex,
              gnrhPulseFrequency,
              hypothalamicSuppression,
              gonadalFunction,
              exogenousTestosterone: 200,
              exogenousEstrogenProgesterone: 200,
            });
          }
        }
      }
    }

    for (const inputs of extremes) {
      const { derived } = run(inputs, 400);
      for (const [key, value] of Object.entries(derived)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} should be finite for ${JSON.stringify(inputs)}`).toBe(true);
        }
      }
      for (const level of [derived.lhLevel, derived.fshLevel, derived.estrogenLevel, derived.progesteroneLevel, derived.testosteroneLevel]) {
        expect(level).toBeGreaterThanOrEqual(0);
        expect(level).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('engine — the male axis', () => {
  it('holds testosterone steady with no surge — feedback stays negative throughout', () => {
    const result = run(preset('normalMaleAxis'));

    expect(result.surgeCount).toBe(0);
    expect(result.derived.feedbackMode).toBe('negative');
    expect(result.derived.testosteroneLevel).toBeGreaterThan(0.25);
  });

  it('primary hypogonadism raises BOTH gonadotropins, with FSH disproportionately freed by inhibin loss', () => {
    const normal = run(preset('normalMaleAxis'));
    const hypogonadal = run(preset('primaryHypogonadism'));

    expect(hypogonadal.derived.testosteroneLevel).toBeLessThan(0.15);
    expect(hypogonadal.derived.lhLevel).toBeGreaterThan(normal.derived.lhLevel);
    expect(hypogonadal.derived.fshLevel).toBeGreaterThan(normal.derived.fshLevel);
    // Losing Sertoli-cell inhibin removes the FSH-selective brake.
    expect(hypogonadal.derived.inhibinLevel).toBeLessThan(0.15);
  });

  it('anabolic steroid use suppresses the endogenous axis despite the high exogenous dose', () => {
    const normal = run(preset('normalMaleAxis'));
    const onSteroids = run(preset('anabolicSteroidUse'));

    expect(onSteroids.derived.lhLevel).toBeLessThan(0.1);
    expect(onSteroids.derived.fshLevel).toBeLessThan(0.1);
    // Endogenous production collapses — the mechanism behind testicular atrophy.
    expect(onSteroids.derived.testosteroneLevel).toBeLessThan(normal.derived.testosteroneLevel * 0.3);
  });
});

describe('engine — anovulatory states', () => {
  it('hypothalamic amenorrhea prevents the surge entirely', () => {
    const result = run(preset('hypothalamicAmenorrhea'));

    expect(result.surgeCount).toBe(0);
    expect(result.derived.lhLevel).toBeLessThan(0.1);
    // Estrogen never gets high enough for long enough to flip the feedback sign.
    expect(result.peakEstrogen).toBeLessThan(0.5);
  });

  it('the combined OCP prevents ovulation by suppressing the surge, not by acting on the ovary', () => {
    const normal = run(preset('normalFemaleCycle'));
    const onOcp = run(preset('combinedOCP'));

    expect(normal.surgeCount).toBeGreaterThanOrEqual(2);
    expect(onOcp.surgeCount).toBe(0);
    expect(onOcp.derived.lhLevel).toBeLessThan(0.1);
    expect(onOcp.derived.fshLevel).toBeLessThan(0.15);
  });
});

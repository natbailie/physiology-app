import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, perturbDrainAbscess, perturbNewInsult, step } from './engine';
import { DEFAULT_INFLAMMATION_INPUTS } from './presets';
import { ACUTE, SYSTEMIC } from './constants';
import type { InflammationInputs } from './types';

type Snapshot = ReturnType<typeof step>;

const DT = 60; // one simulated minute per step

/** Every scenario starts the same way a patient does: quiet, then challenged. */
function flare(inputs: Partial<InflammationInputs>, hours: number, severityPct?: number): Snapshot {
  const full = { ...DEFAULT_INFLAMMATION_INPUTS, ...inputs };
  const started = perturbNewInsult(createInitialState(), severityPct ?? full.insultSeverityPct);
  let snapshot: Snapshot = { state: started, derived: computeDerived(started, full) };
  for (let t = 0; t < (hours * 3600) / DT; t += 1) {
    snapshot = step(snapshot.state, full, DT);
  }
  return snapshot;
}

describe('quiescent baseline', () => {
  it('rests at zero everywhere with no fever and a CRP under ten', () => {
    const d = flare({ insultSeverityPct: 0 }, 48, 0).derived;
    expect(d.insultLoad).toBeLessThan(0.01);
    expect(d.mediatorLevel).toBeLessThan(0.02);
    expect(d.neutrophilCount10e9PerL).toBeLessThan(9);
    expect(d.crpMgL).toBeLessThan(10);
    expect(d.coreTemperatureC).toBeLessThan(37.6);
    expect(d.classification).toBe('quiescent');
  });
});

describe('the cellular cascade arrives in the textbook order', () => {
  it('mediators lead within the hour, neutrophils need half a day', () => {
    const early = flare({}, 1, 50).derived;
    const late = flare({}, 14, 50).derived;
    expect(early.mediatorLevel).toBeGreaterThan(0.4);
    // At one hour the neutrophil response has barely begun; by fourteen hours it has peaked in.
    expect(early.neutrophilCount10e9PerL).toBeLessThan(late.neutrophilCount10e9PerL - 4);
    expect(late.neutrophilCount10e9PerL).toBeGreaterThan(ACUTE.NEUTROPHILIA_THRESHOLD_10E9);
  });

  it('monocytes follow neutrophils, not precede them', () => {
    const dayTwo = flare({}, 40, 50).derived;
    expect(dayTwo.monocyteMacrophageActivity).toBeGreaterThan(0.35);
    expect(dayTwo.monocyteMacrophageActivity).toBeGreaterThan(flare({}, 8, 50).derived.monocyteMacrophageActivity * 1.5);
  });

  it('CRP lags the onset by hours and keeps climbing into day two', () => {
    const sixHours = flare({}, 6, 50).derived;
    const twoDays = flare({}, 48, 55).derived;
    expect(sixHours.crpMgL).toBeGreaterThan(10);
    expect(twoDays.crpMgL).toBeGreaterThan(SYSTEMIC.CRP_SIGNIFICANT_MG_L);
    expect(twoDays.crpMgL).toBeGreaterThan(sixHours.crpMgL * 1.8);
  });

  it('fever rides the cytokine spillover', () => {
    const d = flare({}, 30, 60).derived;
    expect(d.coreTemperatureC).toBeGreaterThan(37.9);
  });
});

describe('an untreated bacterial insult resolves', () => {
  it('is essentially cleared within about ten days with CRP falling behind it', () => {
    const peak = flare({ insultSeverityPct: 45 }, 24 * 5).derived;
    const late = flare({ insultSeverityPct: 45 }, 24 * 12).derived;
    expect(late.insultLoad).toBeLessThan(0.08);
    expect(late.crpMgL).toBeLessThan(peak.crpMgL * 0.4);
    expect(late.crpMgL).toBeLessThan(150);
  });

  it('antibiotics get there much faster than immunity alone', () => {
    const without = flare({ insultSeverityPct: 55 }, 24 * 3, 55).derived;
    const withAbx = flare({ antibioticEfficacyPct: 80 }, 24 * 3, 55).derived;
    expect(without.insultLoad).toBeGreaterThan(0.1);
    expect(withAbx.insultLoad).toBeLessThan(without.insultLoad * 0.4);
    expect(withAbx.crpMgL).toBeLessThan(without.crpMgL);
  });
});

describe('steroids are double-edged', () => {
  it('blanch the redness while letting the infection run on', () => {
    const plain = flare({ insultSeverityPct: 50 }, 24 * 3, 50).derived;
    const steroid = flare({ steroidDosePct: 75 }, 24 * 3, 50).derived;
    expect(steroid.vasodilationIndex).toBeLessThan(plain.vasodilationIndex * 0.7);
    expect(steroid.insultLoad).toBeGreaterThan(plain.insultLoad);
    expect(steroid.crpMgL).toBeLessThan(plain.crpMgL * 0.6);
  });
});

describe('an abscess is pus that nothing reaches', () => {
  it('forms when the load overwhelms a struggling response', () => {
    const abscess = flare({ innateImmuneFunctionPct: 55 }, 24 * 6, 78).derived;
    expect(abscess.pusBurden).toBeGreaterThan(0.5);
    expect(abscess.classification).toBe('abscess formation');
  });

  it('source control does what no antibiotic can', () => {
    const before = flare({ innateImmuneFunctionPct: 55 }, 24 * 6, 78);
    const drainedState = perturbDrainAbscess(before.state, 0.8);
    const full = { ...DEFAULT_INFLAMMATION_INPUTS, innateImmuneFunctionPct: 55 };
    let snap: Snapshot = { state: drainedState, derived: computeDerived(drainedState, full) };
    for (let t = 0; t < (24 * 3600) / DT; t += 1) snap = step(snap.state, full, DT);
    expect(snap.derived.pusBurden).toBeLessThan(before.derived.pusBurden);
    expect(snap.derived.crpMgL).toBeLessThan(before.derived.crpMgL);
  });
});

describe('a crystal needs no bacteria and no antibiotic', () => {
  it('resolves spontaneously as the crystal burden dissolves', () => {
    const week = flare({ insultType: 'sterileCrystal' }, 24 * 8, 60).derived;
    expect(week.insultLoad).toBeLessThan(0.12);
    expect(week.classification).not.toBe('abscess formation');
  });

  it('antibiotics do nothing for a crystal — identical trajectory with or without them', () => {
    const without = flare({ insultType: 'sterileCrystal' }, 24 * 4, 60).derived;
    const withAbx = flare({ insultType: 'sterileCrystal', antibioticEfficacyPct: 95 }, 24 * 4, 60).derived;
    expect(withAbx.insultLoad).toBeCloseTo(without.insultLoad, 6);
    expect(withAbx.crpMgL).toBeCloseTo(without.crpMgL, 6);
  });
});

describe('a foreign body never clears and turns the response chronic', () => {
  it('drives granuloma formation over weeks while the insult persists', () => {
    const weeks = flare({ insultType: 'foreignBody' }, 24 * 28, 55).derived;
    expect(weeks.chronicInflammationIndex).toBeGreaterThan(0.5);
    expect(weeks.granulomaLoad).toBeGreaterThan(0.35);
    expect(weeks.insultLoad).toBeGreaterThan(0.25);
    expect(weeks.classification).toContain('granulomatous');
  });
});

describe('immunosuppression lets the insult win', () => {
  it('smoulders: the load persists at size behind a weak, blunted response', () => {
    const smoulder = flare(
      { steroidDosePct: 65, innateImmuneFunctionPct: 45 },
      24 * 6,
      65,
    ).derived;
    expect(smoulder.insultLoad).toBeGreaterThan(0.35);
    expect(smoulder.neutrophilCount10e9PerL).toBeLessThan(ACUTE.NEUTROPHILIA_THRESHOLD_10E9 + 2);
    expect(smoulder.classification).toBe('smouldering under immunosuppression');
  });
});

describe('numerical robustness', () => {
  it('never produces NaN or Infinity across extreme inputs', () => {
    const extremes: Partial<InflammationInputs>[] = [
      { antibioticEfficacyPct: 100, sourceControlPct: 100 },
      { steroidDosePct: 100, innateImmuneFunctionPct: 0 },
      { insultType: 'sterileCrystal', steroidDosePct: 100 },
      { insultType: 'foreignBody', innateImmuneFunctionPct: 0 },
    ];
    for (const patch of extremes) {
      const d = flare(patch, 24 * 10, 95).derived;
      for (const [key, value] of Object.entries(d)) {
        if (typeof value === 'number') {
          expect(Number.isFinite(value), `${key} for ${JSON.stringify(patch)}`).toBe(true);
        }
      }
    }
  });
});

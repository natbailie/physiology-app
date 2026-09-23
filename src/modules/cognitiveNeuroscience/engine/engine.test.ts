import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_COGNITION_INPUTS, COGNITION_PRESETS } from './presets';
import type { CognitionInputs } from './types';

function derived(inputs: CognitionInputs = DEFAULT_COGNITION_INPUTS) {
  return computeDerived(createInitialState(), inputs);
}

function withInputs(overrides: Partial<CognitionInputs>): CognitionInputs {
  return { ...DEFAULT_COGNITION_INPUTS, ...overrides };
}

describe('the arousal-performance curve', () => {
  it('peaks at a mid arousal and falls on both sides', () => {
    const mid = derived(withInputs({ baselineArousalPct: 45 })).performancePct;
    const low = derived(withInputs({ baselineArousalPct: 5 })).performancePct;
    const high = derived(withInputs({ baselineArousalPct: 95 })).performancePct;
    expect(mid).toBeGreaterThan(low);
    expect(mid).toBeGreaterThan(high);
  });

  it('reads the optimal-arousal region as near peak', () => {
    const d = derived(withInputs({ baselineArousalPct: 45, cognitiveDemandPct: 15 }));
    expect(d.arousalOptimality).toBeGreaterThan(0.9);
    expect(d.state).toBe('In the zone — near-peak performance');
    expect(d.performancePct).toBeGreaterThan(80);
  });
});

describe('the working-memory account', () => {
  it('degrades occupancy as load, distraction and fatigue climb', () => {
    const easy = derived(withInputs({ memoryLoad: 2, distractionLevelPct: 5, fatiguePct: 5 }));
    const loaded = derived(withInputs({ memoryLoad: 7, distractionLevelPct: 80, fatiguePct: 80 }));
    expect(easy.memoryOccupancyPct).toBeLessThan(loaded.memoryOccupancyPct);
  });

  it('never exceeds the ceiling or drops below a floor', () => {
    const overloaded = derived(withInputs({ memoryLoad: 7, distractionLevelPct: 100, fatiguePct: 100 }));
    expect(overloaded.memoryOccupancyPct).toBeLessThanOrEqual(100);
    expect(overloaded.memoryOccupancyPct).toBeGreaterThanOrEqual(5);
  });
});

describe('the overload cliff', () => {
  it('punishes demand that overshoots the deployable reserve', () => {
    const sized = derived(withInputs({ cognitiveDemandPct: 45, baselineArousalPct: 45, executiveReservePct: 18 }));
    const overshot = derived(withInputs({ cognitiveDemandPct: 92, baselineArousalPct: 45, executiveReservePct: 5 }));
    expect(overshot.demandOvershootPct).toBeGreaterThan(sized.demandOvershootPct + 25);
    expect(overshot.performancePct).toBeLessThan(sized.performancePct * 0.6);
    expect(overshot.state).toBe('Overwhelmed — slips & near-misses');
  });
});

describe('the presets', () => {
  it('ranks the calm-learning baseline above a panic attack on performance', () => {
    const calm = derived(COGNITION_PRESETS.relaxedLearning);
    const panicked = derived(COGNITION_PRESETS.panicAttack);
    expect(calm.performancePct).toBeGreaterThan(panicked.performancePct);
  });

  it('puts high-stakes and panic states into their own names', () => {
    expect(derived(COGNITION_PRESETS.examStress).state).not.toBe('In the zone — near-peak performance');
    expect(derived(COGNITION_PRESETS.inTheZone).state).toBe('In the zone — near-peak performance');
  });
});

describe('model hygiene', () => {
  it('never produces NaN on extreme inputs', () => {
    const d = derived(withInputs({ memoryLoad: 7, distractionLevelPct: 100, fatiguePct: 100, cognitiveDemandPct: 100, baselineArousalPct: 100, executiveReservePct: 0 }));
    expect(Number.isNaN(d.performancePct)).toBe(false);
    expect(Number.isNaN(d.memoryOccupancyPct)).toBe(false);
  });

  it('advances simulated time one tick at a time', () => {
    const { state } = step(createInitialState(), DEFAULT_COGNITION_INPUTS, 1);
    expect(state.simTimeSeconds).toBe(1);
  });
});
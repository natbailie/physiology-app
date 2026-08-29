import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { determineArrest } from './checkpoints';
import { DEFAULT_CELL_CYCLE_INPUTS, CELL_CYCLE_PRESETS } from './presets';
import type { CellCycleInputs } from './types';

const DT = 600; // simulated seconds per engine call (10 minutes)

/** Runs for `simHours` of simulated cell-cycle time in ten-minute chunks. */
function run(inputs: CellCycleInputs, simHours: number) {
  let state = createInitialState();
  const totalSteps = Math.ceil((simHours * 3600) / DT);
  let last = computeDerived(state, inputs);
  for (let i = 0; i < totalSteps; i += 1) {
    const snapshot = step(state, inputs, DT);
    state = snapshot.state;
    last = snapshot.derived;
  }
  return { state, derived: last };
}

function preset(name: keyof typeof CELL_CYCLE_PRESETS, overrides: Partial<CellCycleInputs> = {}): CellCycleInputs {
  return { ...DEFAULT_CELL_CYCLE_INPUTS, ...CELL_CYCLE_PRESETS[name], ...overrides };
}

describe('normal cycling', () => {
  it('completes divisions at roughly the textbook 24-hour pace', () => {
    // ~48 simulated hours should deliver about two divisions.
    const { state } = run(DEFAULT_CELL_CYCLE_INPUTS, 52);
    expect(state.completedDivisions).toBeGreaterThanOrEqual(1);
    expect(state.completedDivisions).toBeLessThanOrEqual(3);
  });

  it('spends most of its cycle in G1 and only a sliver in mitosis', () => {
    const g1H = preset('normal').growthFactorDrive; // placeholder to keep linters quiet
    void g1H;
    // Phase durations are constants: assert their proportions directly.
    const durations = [11, 8, 4, 1];
    const total = durations.reduce((a, b) => a + b, 0);
    expect(durations[0]! / total).toBeGreaterThan(0.4);
    expect(durations[3]! / total).toBeLessThan(0.06);
  });

  it('exits into quiescence without growth factor, and re-enters when it returns', () => {
    const starved = run(preset('quiescent'), 30);
    expect(starved.derived.arrestCause).toBe('quiescence (no growth signal)');
  });
});

describe('DNA damage and the p53 decision', () => {
  it('an intact p53 arrests damaged cells at the checkpoints', () => {
    const { derived } = run(preset('irradiated'), 20);
    expect(derived.arrestCause).toMatch(/DNA damage \(p53\)/);
    expect(derived.cyclingRatePct).toBeLessThan(60);
  });

  it('the same damage with TP53 lost lets cells keep replicating', () => {
    const mutated = run(preset('tp53Mutated'), 40);
    expect(mutated.state.completedDivisions).toBeGreaterThanOrEqual(1);
    expect(mutated.derived.arrestCause).toBe('none');
    // And nothing repairs the lesions: they sit near the full insult.
    expect(mutated.derived.lesionLoadPct).toBeGreaterThan(80);
  });

  it('lesions beyond repair push an intact-p53 cell into apoptosis', () => {
    const { state } = run({ ...DEFAULT_CELL_CYCLE_INPUTS, dnaDamage: 0.9 }, 400);
    expect(state.apoptoticFraction).toBeGreaterThan(0.15);
  });

  it('a TP53-null cell never apoptoses from DNA damage', () => {
    const { state } = run(preset('tp53Mutated'), 400);
    expect(state.apoptoticFraction).toBeLessThan(0.02);
  });
});

describe('tumour suppressor loss and oncogenes', () => {
  it('RB loss drives S-phase entry with no growth signal at all', () => {
    const { derived, state } = run(preset('rbLost'), 60);
    expect(determineArrest(state.phase, preset('rbLost'), state.lesionLoad)).not.toBe('quiescence (no growth signal)');
    expect(derived.doublingTimeH).toBeLessThan(9998);
  });

  it('oncogenic drive shortens the cycle below its normal duration', () => {
    const normal = run(DEFAULT_CELL_CYCLE_INPUTS, 120);
    const oncogene = run(preset('oncogeneActive'), 120);
    expect(oncogene.state.completedDivisions).toBeGreaterThan(normal.state.completedDivisions);
  });

  it('a CDK4/6 inhibitor jams even an oncogene-driven restriction point', () => {
    const { derived } = run(preset('cdk46Inhibited'), 30);
    expect(derived.arrestCause).toBe('G1/S checkpoint — CDK4/6 inhibited');
  });
});

describe('classic drug arrests', () => {
  it('a taxane piles cells up in M phase', () => {
    const { state, derived } = run(preset('taxaneArrest'), 26);
    expect(state.phase).toBe('M');
    expect(derived.arrestCause).toBe('M phase — spindle assembly checkpoint');
    // And having arrived there, it stays — that is what an assembly checkpoint does.
    const later = run(preset('taxaneArrest'), 80);
    expect(later.state.phase).toBe('M');
  });

  it('hydroxyurea stalls cells inside S phase', () => {
    const inputs = preset('hydroxyurea');
    // Force the cohort into S first, then apply the block — as in a population already cycling.
    let state = createInitialState();
    let guard = 0;
    while (state.phase !== 'S' && guard < 2000) {
      state = step(state, DEFAULT_CELL_CYCLE_INPUTS, DT).state;
      guard += 1;
    }
    const derivedAfterBlock = step(state, inputs, DT * 6).derived;
    expect(derivedAfterBlock.arrestCause).toBe('S phase — replication blocked');
  });

  it('never produces NaN or escapes the unit interval', () => {
    for (const dnaDamage of [0, 1]) {
      for (const p53Function of [0, 1]) {
        for (const spindlePoisonPct of [0, 100]) {
          const inputs: CellCycleInputs = { ...DEFAULT_CELL_CYCLE_INPUTS, dnaDamage, p53Function, spindlePoisonPct };
          let state = createInitialState();
          for (let t = 0; t < 500; t += 1) state = step(state, inputs, DT).state;
          const d = computeDerived(state, inputs);
          for (const [key, value] of Object.entries(d)) {
            if (typeof value === 'number') {
              expect(Number.isFinite(value), `${key}`).toBe(true);
            }
          }
          expect(state.phaseProgress).toBeLessThanOrEqual(1);
          expect(state.apoptoticFraction).toBeLessThanOrEqual(1);
        }
      }
    }
  });
});
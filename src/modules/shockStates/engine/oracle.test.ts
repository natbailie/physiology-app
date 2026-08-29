/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeDerived, createInitialState, step } from './engine';
import { DEFAULT_SHOCK_INPUTS, SHOCK_PRESETS } from './presets';
import type { ShockDerived, ShockInputs } from './types';

/**
 * Reference traces from Pulse's own haemorrhage class ladder — see `tools/pulse-oracle/`.
 *
 * Four scenarios, losing 15%, 25%, 35% and 42% of blood volume, give an independent
 * dose-response curve for the one claim this module exists to make: that arterial pressure is a
 * LATE sign, held up by the reflex until compensation fails.
 *
 * Comparisons are FRACTIONS of each engine's own baseline — Pulse models a 5.49 L reference
 * patient against our 5 L. Our ladder varies blood volume ONLY, holding haemoglobin at baseline,
 * so that it tests haemodynamics independently of the open haemoglobin question below.
 */

interface OracleSample {
  t: number;
  hemorrhagedMl: number;
  bloodVolumeL: number;
  heartRateBpm: number;
  strokeVolumeMl: number;
  meanArterialPressureMmHg: number;
  cardiacOutputLPerMin: number;
  haemoglobinContentG: number;
  centralVenousPressureMmHg: number;
  wedgePressureMmHg: number;
  systemicVascularResistance: number;
  oxygenSaturation: number;
  mixedVenousOxygenSaturation: number;
  lactateMmolL: number;
}

interface OracleTrace {
  landmarks: Record<string, number>;
  samples: OracleSample[];
}

function load(id: string): OracleTrace {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(`./__oracle__/${id}.json`, import.meta.url)), 'utf8'),
  ) as OracleTrace;
}

function at(trace: OracleTrace, landmark: string): OracleSample {
  const t = trace.landmarks[landmark];
  const sample = trace.samples.find((s) => s.t === t);
  if (!sample) throw new Error(`no sample at landmark "${landmark}" (t=${t})`);
  return sample;
}

/** The last landmark of each trace: where it settled, or where the patient collapsed. */
function endpoint(trace: OracleTrace): OracleSample {
  return at(trace, 'collapse' in trace.landmarks ? 'collapse' : 'settled');
}

function settle(patch: Partial<ShockInputs>, seconds = 3000): ShockDerived {
  const inputs = { ...DEFAULT_SHOCK_INPUTS, ...patch };
  let state = createInitialState();
  let derived = computeDerived(state, inputs);
  let t = 0;
  while (t < seconds) {
    const dt = Math.min(seconds - t, 0.2);
    t += dt;
    const next = step(state, inputs, dt);
    state = next.state;
    derived = next.derived;
  }
  return derived;
}

const LADDER = ['hemorrhage-class1', 'hemorrhage-class2', 'hemorrhage-class3', 'hemorrhage-class4'].map(
  (id) => {
    const trace = load(id);
    const baseline = at(trace, 'baseline');
    const end = endpoint(trace);
    return {
      id,
      baseline,
      end,
      fractionLost: end.hemorrhagedMl / (baseline.bloodVolumeL * 1000),
    };
  },
);

/** Our engine at the same fractional losses, varying blood volume alone. */
const ourLadder = LADDER.map((rung) => ({
  id: rung.id,
  fractionLost: rung.fractionLost,
  derived: settle({ bloodVolumeMl: DEFAULT_SHOCK_INPUTS.bloodVolumeMl * (1 - rung.fractionLost) }),
}));

const ourBaseline = settle(SHOCK_PRESETS.normal);
const pulseBaseline = LADDER[0]!.baseline;

const monotonic = (values: number[], direction: 'up' | 'down') =>
  values.every((v, i) => i === 0 || (direction === 'up' ? v > values[i - 1]! : v < values[i - 1]!));

describe('oracle: the ladder is the ladder it claims to be', () => {
  it('climbs through the ATLS classes — roughly 15, 25, 35 and 42 percent lost', () => {
    const fractions = LADDER.map((r) => r.fractionLost);
    expect(monotonic(fractions, 'up')).toBe(true);
    expect(fractions[0]).toBeGreaterThan(0.1);
    expect(fractions[0]).toBeLessThan(0.2);
    expect(fractions[3]).toBeGreaterThan(0.4);
  });

  it('ends the Class IV scenario in collapse, not in a settled state', () => {
    // Pulse reaches an irreversible state and aborts. That endpoint is the point of the trace.
    const classFour = load('hemorrhage-class4');
    expect('collapse' in classFour.landmarks).toBe(true);
    expect(endpoint(classFour).meanArterialPressureMmHg).toBeLessThan(40);
  });
});

describe('oracle: Pulse’s ladder shows pressure is a late sign', () => {
  // Asserted on the reference itself. If these ever fail, the traces have been regenerated from
  // a Pulse that no longer teaches what we are comparing ourselves against.
  it('barely moves arterial pressure through Class I and II', () => {
    for (const rung of LADDER.slice(0, 2)) {
      const drop = 1 - rung.end.meanArterialPressureMmHg / rung.baseline.meanArterialPressureMmHg;
      expect(drop).toBeLessThan(0.06);
    }
  });

  it('is already strongly tachycardic by Class II, while pressure still looks normal', () => {
    const classTwo = LADDER[1]!;
    expect(classTwo.end.heartRateBpm / classTwo.baseline.heartRateBpm).toBeGreaterThan(1.25);
  });

  it('then loses pressure abruptly once compensation fails', () => {
    const [, classTwo, classThree] = LADDER;
    const dropTwo = 1 - classTwo!.end.meanArterialPressureMmHg / classTwo!.baseline.meanArterialPressureMmHg;
    const dropThree = 1 - classThree!.end.meanArterialPressureMmHg / classThree!.baseline.meanArterialPressureMmHg;
    // The cliff: the step from Class II to Class III costs several times what Class II did.
    expect(dropThree).toBeGreaterThan(dropTwo * 4);
  });
});

describe('oracle: baseline agrees with an independently validated engine', () => {
  it('puts a normal adult at the same arterial pressure Pulse does', () => {
    expect(Math.abs(ourBaseline.meanArterialPressureMmHg - pulseBaseline.meanArterialPressureMmHg)).toBeLessThan(5);
  });

  it('puts a normal adult at the same heart rate Pulse does', () => {
    expect(Math.abs(ourBaseline.heartRateBpm - pulseBaseline.heartRateBpm)).toBeLessThan(5);
  });
});

describe('oracle: our dose-response runs the same way Pulse’s does', () => {
  const moves = [
    ['mean arterial pressure', 'meanArterialPressureMmHg', 'meanArterialPressureMmHg', 'down'],
    ['cardiac output', 'cardiacOutputLPerMin', 'cardiacOutputLPerMin', 'down'],
    ['stroke volume', 'strokeVolumeMl', 'strokeVolumeMl', 'down'],
    ['heart rate', 'heartRateBpm', 'heartRateBpm', 'up'],
  ] as const;

  for (const [label, theirs, ours, direction] of moves) {
    it(`moves ${label} ${direction} all the way up the ladder, as Pulse does`, () => {
      expect(monotonic(LADDER.map((r) => r.end[theirs]), direction)).toBe(true);
      expect(monotonic(ourLadder.map((r) => r.derived[ours]), direction)).toBe(true);
    });
  }

  it('empties the venous side at every rung, as Pulse does', () => {
    // Deliberately NOT a monotonic test. Pulse's CVP falls and then RISES again at Class IV
    // (3.80 -> 3.15 -> 3.28 -> 3.86) because once flow all but stops, pressures equalise back
    // toward the mean systemic filling pressure. Being below baseline is the claim that holds
    // across the whole ladder in both engines.
    for (const rung of LADDER) {
      expect(rung.end.centralVenousPressureMmHg).toBeLessThan(rung.baseline.centralVenousPressureMmHg);
    }
    for (const rung of ourLadder) {
      expect(rung.derived.centralVenousPressureMmHg).toBeLessThan(ourBaseline.centralVenousPressureMmHg);
    }
  });

  it('extracts progressively more oxygen as loss climbs, as Pulse does', () => {
    // Pulse runs 77 -> 69 -> 60 -> 40 -> 21% mixed venous saturation up the ladder. Falling SvO2
    // at falling output IS the compensation: the tissues take a bigger share of what still arrives.
    expect(monotonic(LADDER.map((r) => r.end.mixedVenousOxygenSaturation), 'down')).toBe(true);
    expect(monotonic(ourLadder.map((r) => r.derived.mixedVenousSaturationPercent), 'down')).toBe(true);
  });

  it('calls a Class III loss hypovolaemic', () => {
    expect(ourLadder[2]!.derived.classification).toBe('hypovolaemic');
    expect(ourLadder[3]!.derived.classification).toBe('hypovolaemic');
  });
});

/**
 * Open divergences. Each is a decision about what this module should teach — see the write-up in
 * `tools/pulse-oracle/README.md`. None is a tolerance to widen.
 */
describe('oracle: open questions', () => {
  it.todo(
    'decide whether the baroreflex should produce a PLATEAU THEN A CLIFF rather than a straight ' +
      'line — this is the ladder’s headline finding. Pulse holds MAP at 94, 91, then drops to 65 ' +
      'and 22; we fall smoothly through 87, 82, 77, 73. A learner reading our curve concludes ' +
      'pressure tracks blood loss proportionally, which is the opposite of the clinical lesson ' +
      'the module is named for, and the same weak reflex explains the tachycardia gap below',
  );
  it.todo(
    'decide whether the reflex should lean harder on rate — across the ladder Pulse runs ' +
      '72 -> 92 -> 110 -> 129 -> 155 while we run 72 -> 74 -> 76 -> 80 -> 83. The cardiorenal ' +
      'oracle finds the same under-response at a 9% loss, so it is one shared mechanism',
  );
  it.todo(
    'decide whether lactate should rise with an oxygen debt — ours holds at 1.00 mmol/L at every ' +
      'severity. NOTE that Pulse cannot settle this one: recording its lactate showed it is flat ' +
      'too (1.60 -> 1.66 even at collapse, with SvO2 down at 21%), so both engines are inert here ' +
      'and the case for changing ours rests on the clinical literature rather than on this oracle',
  );
  it.todo(
    'decide where the classification threshold belongs — we still report “no shock” at a 25% ' +
      'loss, where Pulse’s patient is at 110 bpm and textbook Class II',
  );
  it.todo(
    'decide whether acute haemorrhage should drop haemoglobin CONCENTRATION at all — Pulse holds ' +
      'it at 15.0 -> 14.8 g/dL across a 1.9 L whole-blood loss, while our haemorrhagic preset ' +
      'sets 7.5 g/dL',
  );
});

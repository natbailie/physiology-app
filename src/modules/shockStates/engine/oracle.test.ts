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
  /** Recorded only by the non-haemorrhage scenarios, which have no bleed to report. */
  oxygenConsumptionMlPerMin?: number;
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
 * The ladder's headline finding, and now the thing under test.
 *
 * Pulse holds arterial pressure almost still through Class I and II and then loses it off a cliff;
 * we used to fall in a straight line from the first millilitre, which teaches a learner that
 * pressure tracks blood loss proportionally — the opposite of the lesson this module is named for.
 *
 * TWO mechanisms were wrong, and the reflex was only one of them. Sympathetic drive was a sigmoid
 * of ABSOLUTE pressure half-activating at 55 mmHg, leaving a resting patient on the flat tail with
 * a drive of 0.02; and filling pressure fell in PROPORTION to blood volume, so even with the reflex
 * switched off entirely a 42% loss produced MAP 58 where Pulse collapses at 21.7. Correcting only
 * the reflex produced a circulation that defended pressure for ever and never reached a cliff at
 * all. See `BAROREFLEX.HALF_ACTIVATION_ERROR_MMHG` and `CIRCULATION.UNSTRESSED_RECOIL_EXPONENT`.
 *
 * Everything here is compared as a fraction of each engine's OWN baseline: Pulse models a 5.49 L
 * reference patient against our 5 L, and the claim being made is about shape.
 */
describe('oracle: pressure is a LATE sign in our ladder too', () => {
  const drop = (rung: (typeof ourLadder)[number]) =>
    1 - rung.derived.meanArterialPressureMmHg / ourBaseline.meanArterialPressureMmHg;

  it('barely moves arterial pressure through Class I and II', () => {
    expect(drop(ourLadder[0]!)).toBeLessThan(0.06);
    expect(drop(ourLadder[1]!)).toBeLessThan(0.12);
  });

  it('then loses pressure abruptly once compensation runs out', () => {
    // The cliff: the step into Class III costs several times what Class II did, as it does for
    // Pulse. This is the assertion the straight line could never have passed.
    expect(drop(ourLadder[2]!)).toBeGreaterThan(drop(ourLadder[1]!) * 2.5);
    expect(drop(ourLadder[3]!)).toBeGreaterThan(0.5);
  });

  it('is already strongly tachycardic by Class II, while pressure still looks normal', () => {
    const rise = (i: number) => ourLadder[i]!.derived.heartRateBpm / ourBaseline.heartRateBpm;
    expect(rise(0)).toBeGreaterThan(1.15);
    expect(rise(1)).toBeGreaterThan(1.25);
    // Bounded above as well, so a reflex that pins at maximum by Class II — which is what a
    // steeper form of this same curve did — fails rather than passing for the wrong reason.
    expect(rise(3)).toBeLessThan(2.5);
  });

  it('calls a Class II loss shock, where Pulse’s patient is at 110 bpm and textbook Class II', () => {
    // Was "no shock" at a 25% loss. The classification threshold never moved; the physiology
    // underneath it did.
    expect(ourLadder[1]!.derived.classification).toBe('hypovolaemic');
  });
});

/**
 * Haemoglobin CONCENTRATION in an unresuscitated bleed — settled, and settled across four
 * scenarios rather than one.
 *
 * You lose whole blood: cells and plasma leave together, so the concentration barely moves until
 * interstitial fluid shifts in or somebody hangs crystalloid. Our `haemorrhagic` preset used to set
 * 7.5 g/dL, which inverts the clinical teaching — a normal haemoglobin does not exclude massive
 * blood loss, and that is the commonest way an early bleed is missed. The diluted state now has its
 * own `resuscitated` preset, because it is a different patient a few hours later.
 */
describe('oracle: a bleed does not dilute itself', () => {
  const concentration = (sample: OracleSample) => sample.haemoglobinContentG / (sample.bloodVolumeL * 10);

  it('holds haemoglobin concentration across Pulse’s whole ladder, at every severity', () => {
    for (const rung of LADDER) {
      const before = concentration(rung.baseline);
      const after = concentration(rung.end);
      // Content falls steeply — 821 g to 474 g at Class IV — while the concentration does not.
      expect(rung.end.haemoglobinContentG).toBeLessThan(rung.baseline.haemoglobinContentG * 0.9);
      expect(Math.abs(after / before - 1)).toBeLessThan(0.05);
    }
  });

  it('keeps our bleeding patient’s haemoglobin near normal too', () => {
    const bleeding = { ...DEFAULT_SHOCK_INPUTS, ...SHOCK_PRESETS.haemorrhagic };
    const normal = concentration(LADDER[0]!.baseline);
    expect(Math.abs(bleeding.haemoglobinGDl / normal - 1)).toBeLessThan(0.1);
  });

  it('puts the diluted haemoglobin in the resuscitated preset, where the fluid explains it', () => {
    const resuscitated = { ...DEFAULT_SHOCK_INPUTS, ...SHOCK_PRESETS.resuscitated };
    const bleeding = { ...DEFAULT_SHOCK_INPUTS, ...SHOCK_PRESETS.haemorrhagic };
    // Clearly anaemic and below the 13 g/dL floor of the reference range, without claiming a
    // dilution the fluid could not produce — see `hemorrhage-class2-saline`.
    expect(resuscitated.haemoglobinGDl).toBeLessThan(13);
    expect(resuscitated.haemoglobinGDl).toBeLessThan(bleeding.haemoglobinGDl * 0.8);
    // Volume restored is what makes it dilution rather than more bleeding.
    expect(resuscitated.bloodVolumeMl).toBeGreaterThan(bleeding.bloodVolumeMl);
  });
});

/**
 * Lactate — the one claim in this file that is deliberately NOT taken from the oracle.
 *
 * Both engines used to be inert here, and Pulse still is: its lactate runs 1.60 -> 1.66 even at
 * cardiovascular collapse with a mixed venous saturation of 21%. So this is the one place where
 * agreeing with Pulse would have been agreeing with a gap, and the case rests on the clinical
 * literature instead — which is why the assertion below is keyed to the ATLS class bands and the
 * Pulse trace is asserted to be flat rather than used as a target.
 *
 * The mechanism that was missing is regional. Global oxygen debt is a threshold — tissue extracts
 * more until it cannot — so keying lactate to it alone made ours flat at 1.00 through Class III and
 * then a step change. Defending arterial pressure means shutting down splanchnic, muscle and skin,
 * and those beds go anaerobic while the global figures still balance. That is what makes a raised
 * lactate in a patient with acceptable vital signs mean something.
 */
describe('oracle: lactate rises early, and this one is on the literature', () => {
  it('records that Pulse itself is flat here, so it cannot be the reference', () => {
    for (const rung of LADDER) {
      expect(rung.end.lactateMmolL / rung.baseline.lactateMmolL).toBeLessThan(1.3);
    }
    // If this ever fails, Pulse has gained a mechanism and the trace becomes worth comparing to.
    expect(LADDER[3]!.end.mixedVenousOxygenSaturation).toBeLessThan(0.35);
  });

  it('leaves Class I normal and has clearly risen by Class II, while pressure still looks acceptable', () => {
    expect(ourLadder[0]!.derived.lactateMmolL).toBeLessThan(2);
    expect(ourLadder[1]!.derived.lactateMmolL).toBeGreaterThan(2);
    // Occult hypoperfusion: this is the whole reason the number is measured.
    expect(ourLadder[1]!.derived.meanArterialPressureMmHg).toBeGreaterThan(80);
  });

  it('climbs all the way up the ladder rather than stepping at the end', () => {
    const lactates = ourLadder.map((rung) => rung.derived.lactateMmolL);
    expect(monotonic(lactates, 'up')).toBe(true);
    expect(lactates[2]).toBeGreaterThan(4);
  });

  it('is raised in a patient whose reflex has been removed, not only in one whose reflex is working', () => {
    // Regional starvation is keyed to the WORSE of reflex diversion and absent flow. Keyed to
    // drive alone, the `decompensating` preset reported a normal lactate at MAP 38.
    const exhausted = settle(SHOCK_PRESETS.decompensating);
    expect(exhausted.sympatheticDrive).toBeLessThan(0.05);
    expect(exhausted.lactateMmolL).toBeGreaterThan(2.5);
  });
});

/**
 * The continuous bleed, which is a better instrument than the four-class ladder.
 *
 * `HemorrhageToShock` bleeds one patient steadily from health into collapse and then watches them
 * recover, so the plateau and the cliff are two parts of ONE curve rather than an inference drawn
 * across four separate runs. It is the strongest single piece of evidence in this suite for the
 * claim the module is named for.
 */
describe('oracle: one continuous bleed, from compensated to collapsed', () => {
  const trace = load('hemorrhage-to-shock');
  const baseline = at(trace, 'baseline');
  const lostFraction = (sample: OracleSample) => sample.hemorrhagedMl / (baseline.bloodVolumeL * 1000);
  const ourAt = (sample: OracleSample) =>
    settle({ bloodVolumeMl: DEFAULT_SHOCK_INPUTS.bloodVolumeMl * (1 - lostFraction(sample)) });

  it('holds pressure while ALREADY markedly tachycardic — the single best row in the suite', () => {
    // At a fifth of blood volume gone Pulse's mean arterial pressure is 93.0 against a baseline of
    // 95.3, a fall of 2.4%, while the heart rate has reached 105 from 72. A learner taking the
    // blood pressure at this moment is reassured, and a learner taking the pulse is not.
    const compensated = at(trace, 'compensated');
    expect(lostFraction(compensated)).toBeGreaterThan(0.15);
    expect(1 - compensated.meanArterialPressureMmHg / baseline.meanArterialPressureMmHg).toBeLessThan(0.05);
    expect(compensated.heartRateBpm / baseline.heartRateBpm).toBeGreaterThan(1.35);

    // Ours does the same thing at the same loss, which is what the A1 reflex rebuild was for.
    const ours = ourAt(compensated);
    const ourBase = settle(SHOCK_PRESETS.normal);
    expect(1 - ours.meanArterialPressureMmHg / ourBase.meanArterialPressureMmHg).toBeLessThan(0.12);
    expect(ours.heartRateBpm / ourBase.heartRateBpm).toBeGreaterThan(1.25);
  });

  it('then falls off a cliff, in both engines', () => {
    const compensated = at(trace, 'compensated');
    const collapse = at(trace, 'collapse');
    const ourBase = settle(SHOCK_PRESETS.normal);

    const theirEarly = 1 - compensated.meanArterialPressureMmHg / baseline.meanArterialPressureMmHg;
    const theirLate = 1 - collapse.meanArterialPressureMmHg / baseline.meanArterialPressureMmHg;
    expect(theirLate).toBeGreaterThan(theirEarly * 5);

    const ourEarly = 1 - ourAt(compensated).meanArterialPressureMmHg / ourBase.meanArterialPressureMmHg;
    const ourLate = 1 - ourAt(collapse).meanArterialPressureMmHg / ourBase.meanArterialPressureMmHg;
    expect(ourLate).toBeGreaterThan(ourEarly * 3);
  });

  it('recovers once the bleeding stops, with the reflex winding back down', () => {
    // Pressure climbs 44 -> 72 mmHg after haemostasis and the heart rate falls 154 -> 97 with no
    // fluid given at all. Compensation is not a one-way ratchet, and a falling heart rate is how
    // successful haemostasis announces itself.
    const collapse = at(trace, 'collapse');
    const recovered = at(trace, 'recovered');
    expect(recovered.meanArterialPressureMmHg).toBeGreaterThan(collapse.meanArterialPressureMmHg * 1.4);
    expect(recovered.heartRateBpm).toBeLessThan(collapse.heartRateBpm * 0.8);
  });
});

/**
 * The rate-versus-resistance split, measured rather than inferred.
 *
 * `HemorrhageVaryingSeverity` is the only trace that records systemic vascular resistance alongside
 * heart rate through a graded bleed, so it can answer the question the A1 divergence was actually
 * about: how much of the baroreflex runs through rate and how much through tone.
 */
describe('oracle: the reflex leans on RATE far harder than on RESISTANCE', () => {
  const trace = load('hemorrhage-varying-severity');
  const baseline = at(trace, 'baseline');

  it('raises heart rate about two and a half times as much as resistance', () => {
    const plateau = at(trace, 'plateau');
    const rateRise = plateau.heartRateBpm / baseline.heartRateBpm - 1;
    const resistanceRise = plateau.systemicVascularResistance / baseline.systemicVascularResistance - 1;
    expect(rateRise).toBeGreaterThan(0.35);
    expect(resistanceRise).toBeGreaterThan(0.15);
    expect(rateRise).toBeGreaterThan(resistanceRise * 1.7);

    // And the gap widens as the bleed deepens, because resistance is already near its ceiling
    // while the rate still has headroom: by collapse the rate is up over 100% against a
    // resistance still up only about a fifth.
    const collapse = at(trace, 'collapse');
    const lateRate = collapse.heartRateBpm / baseline.heartRateBpm - 1;
    const lateResistance = collapse.systemicVascularResistance / baseline.systemicVascularResistance - 1;
    expect(lateRate).toBeGreaterThan(lateResistance * 3);
  });

  it('saturates RESISTANCE first while rate keeps climbing', () => {
    // Vasoconstriction plateaus around a fifth of blood volume lost; the rate does not. So the last
    // of the compensation is bought almost entirely with heart rate, which is why the tachycardia
    // of late haemorrhage is so extreme.
    const plateau = at(trace, 'plateau');
    const collapse = at(trace, 'collapse');
    expect(collapse.systemicVascularResistance).toBeLessThanOrEqual(plateau.systemicVascularResistance * 1.02);
    expect(collapse.heartRateBpm).toBeGreaterThan(plateau.heartRateBpm * 1.3);
  });

  it('reproduces the same ordering in our engine', () => {
    const ourBase = settle(SHOCK_PRESETS.normal);
    const plateau = at(trace, 'plateau');
    const lost = plateau.hemorrhagedMl / (baseline.bloodVolumeL * 1000);
    const ours = settle({ bloodVolumeMl: DEFAULT_SHOCK_INPUTS.bloodVolumeMl * (1 - lost) });
    const rateRise = ours.heartRateBpm / ourBase.heartRateBpm - 1;
    const resistanceRise = ours.effectiveSvr / ourBase.effectiveSvr - 1;
    expect(rateRise).toBeGreaterThan(resistanceRise);
  });
});

/**
 * What resuscitation does to the haemoglobin — the measurement that settled a preset.
 *
 * Two traces, the same question from both sides. Packed cells replace what was lost, so the
 * concentration should not move; crystalloid replaces volume without cells, so it should.
 */
describe('oracle: only the FLUID dilutes, and it dilutes less than we assumed', () => {
  const concentration = (sample: OracleSample) => sample.haemoglobinContentG / (sample.bloodVolumeL * 10);

  it('holds the concentration through a bleed AND through packed-cell resuscitation', () => {
    const prbc = load('hemorrhage-class3-prbc');
    const start = concentration(at(prbc, 'baseline'));
    expect(concentration(at(prbc, 'bleeding')) / start).toBeGreaterThan(0.95);
    expect(concentration(at(prbc, 'resuscitated')) / start).toBeGreaterThan(0.9);
    // Content really did fall and really was replaced — this is not a trace where nothing happened.
    expect(at(prbc, 'bleeding').haemoglobinContentG).toBeLessThan(at(prbc, 'baseline').haemoglobinContentG * 0.8);
    expect(at(prbc, 'resuscitated').haemoglobinContentG).toBeGreaterThan(at(prbc, 'bleeding').haemoglobinContentG);
  });

  it('dilutes ONLY once crystalloid arrives, and only to about 13 g/dL', () => {
    const saline = load('hemorrhage-class2-saline');
    const start = concentration(at(saline, 'baseline'));
    // Flat through the bleed itself...
    expect(concentration(at(saline, 'bleeding')) / start).toBeGreaterThan(0.98);
    // ...then falls as fluid goes in, with the haemoglobin CONTENT unchanged.
    const diluted = at(saline, 'diluted');
    expect(concentration(diluted)).toBeLessThan(concentration(at(saline, 'bleeding')));
    expect(diluted.bloodVolumeL).toBeGreaterThan(at(saline, 'bleeding').bloodVolumeL);
    expect(concentration(diluted)).toBeGreaterThan(12);
    expect(concentration(diluted)).toBeLessThan(14);
  });

  it('rules out the 7.5 g/dL this module used to assume for a resuscitated bleed', () => {
    // The number that had to change. With the haemoglobin content Pulse is left holding, reaching
    // 7.5 g/dL by dilution alone would take a blood volume of around 8 litres, which is not a
    // patient. Our `resuscitated` preset now sits at 10.5.
    const saline = load('hemorrhage-class2-saline');
    const content = at(saline, 'diluted').haemoglobinContentG;
    const volumeNeededForSevenFive = content / (7.5 * 10);
    expect(volumeNeededForSevenFive).toBeGreaterThan(7);
    expect(SHOCK_PRESETS.resuscitated.haemoglobinGDl!).toBeGreaterThan(9);
    expect(SHOCK_PRESETS.resuscitated.haemoglobinGDl!).toBeLessThan(13);
  });
});

/**
 * Cardiogenic shock, corroborated externally for the first time.
 *
 * Until this trace the only shock state with any outside evidence was haemorrhage. Pulse's
 * ventricular systolic dysfunction produces the fingerprint the module teaches — output down, and
 * the LEFT-sided filling pressure up — which is what separates it from every other low-output state.
 *
 * Note the trace opens already deranged, because the condition is applied at stabilisation. The
 * healthy comparison therefore comes from a different trace's resting patient.
 */
describe('oracle: a failing ventricle raises the WEDGE, and that is the fingerprint', () => {
  const vsd = load('ventricular-systolic-dysfunction');
  const failing = at(vsd, 'settled');
  const healthy = at(load('hemorrhage-class3'), 'baseline');

  it('drops output and raises the wedge at the same time', () => {
    expect(failing.cardiacOutputLPerMin).toBeLessThan(healthy.cardiacOutputLPerMin);
    expect(failing.wedgePressureMmHg).toBeGreaterThan(healthy.wedgePressureMmHg * 1.7);
    expect(failing.meanArterialPressureMmHg).toBeLessThan(healthy.meanArterialPressureMmHg * 0.9);
  });

  it('does it with EXTRACTION, not with a tachycardia', () => {
    // Mixed venous saturation falls while the heart rate does not rise — a slow, full, failing
    // ventricle. It is the opposite of the haemorrhage picture at a similar cardiac output.
    expect(failing.mixedVenousOxygenSaturation).toBeLessThan(healthy.mixedVenousOxygenSaturation);
    expect(failing.heartRateBpm).toBeLessThan(healthy.heartRateBpm);
  });

  it('reproduces the same fingerprint in our engine', () => {
    const ourNormal = settle(SHOCK_PRESETS.normal);
    const ourCardiogenic = settle(SHOCK_PRESETS.cardiogenic);
    expect(ourCardiogenic.cardiacOutputLPerMin).toBeLessThan(ourNormal.cardiacOutputLPerMin);
    expect(ourCardiogenic.wedgePressureMmHg).toBeGreaterThan(ourNormal.wedgePressureMmHg * 1.7);
  });

  it.todo(
    'decide how LEFT-SIDED our cardiogenic preset should be — Pulse doubles the wedge (6.5 -> 12.9) ' +
      'while leaving the central venous pressure almost untouched (4.6 -> 4.8), so its wedge-to-CVP ' +
      'ratio nearly doubles. Ours raises both (wedge 10 -> 25.5, CVP 3.0 -> 12.1) so the RATIO falls ' +
      'instead. Both are defensible — Pulse models a mild isolated left ventricular lesion and ours a ' +
      'profound one where secondary right heart failure is real — but the ratio is the bedside ' +
      'discriminator and the two engines move it in opposite directions',
  );
});

/**
 * Sepsis — a NULL result, committed deliberately.
 *
 * `Sepsis.json` applies Kitware's sepsis condition at severity 0.5 and then advances its own two
 * minutes. That is not long enough for anything to happen: against the zero-severity control, not
 * one of the sixty-four recorded columns differs by more than 1%. So Pulse cannot corroborate our
 * distributive shock state as the scenario is shipped, and this pair of traces is committed to
 * record that rather than to assert anything about our engine.
 *
 * The test is written the same way as the ARDS-versus-pneumonia identity above: if a future Pulse
 * gains a sepsis model that does something in two minutes, this FAILS and the trace becomes worth
 * comparing against.
 */
describe('oracle: Pulse’s bundled sepsis scenario does nothing in the time it runs', () => {
  const septic = at(load('sepsis'), 'settled');
  const control = at(load('sepsis-zero'), 'settled');

  for (const key of [
    'meanArterialPressureMmHg',
    'heartRateBpm',
    'cardiacOutputLPerMin',
    'systemicVascularResistance',
    'lactateMmolL',
  ] as const) {
    it(`leaves ${key} indistinguishable from the zero-severity control`, () => {
      expect(Math.abs(septic[key] / control[key] - 1)).toBeLessThan(0.01);
    });
  }

  it('leaves a healthy resistance, which is what makes it useless as a distributive oracle', () => {
    // Distributive shock is defined by a LOW systemic vascular resistance. Pulse's septic patient
    // still has a normal one, so there is nothing here to compare our `septic` preset against.
    expect(septic.systemicVascularResistance).toBeGreaterThan(0.9);
  });
});

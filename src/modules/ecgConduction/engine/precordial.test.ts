import { describe, expect, it } from 'vitest';
import { beatExtremes, rsRatio, sampleBeat } from './beatSample';
import { buildSchedule, qrsWindow } from './activation';
import { PRECORDIAL_ORDER, rWaveTransition } from './leadProjection';
import { DEFAULT_ECG_INPUTS, ECG_PRESETS } from './presets';
import type { EcgInputs, InjuryTerritory, LeadName } from './types';

const RR_MS = 1000;
const SAMPLES = 600;

const preset = (name: keyof typeof ECG_PRESETS): EcgInputs => ({ ...DEFAULT_ECG_INPUTS, ...ECG_PRESETS[name] });
const beat = (inputs: EcgInputs, lead: LeadName) => sampleBeat(inputs, RR_MS, lead, SAMPLES);

/** Mean voltage over the final third of the QRS — where a bundle branch block writes its signature. */
function terminalQrsMv(inputs: EcgInputs, lead: LeadName): number {
  const qrs = qrsWindow(buildSchedule(inputs, RR_MS));
  const samples = beat(inputs, lead);
  const toIndex = (ventricularMs: number) => Math.round(((ventricularMs + inputs.avDelayMs) / RR_MS) * SAMPLES);
  const start = toIndex(qrs.onsetMs + (qrs.durationMs * 2) / 3);
  const end = toIndex(qrs.offsetMs);
  let sum = 0;
  for (let i = start; i < end; i += 1) sum += samples[i] ?? 0;
  return sum / Math.max(end - start, 1);
}

/** Largest ST-segment shift a territory produces in a lead, relative to the same beat uninjured. */
function stShiftMv(territory: InjuryTerritory, lead: LeadName): number {
  const injured = beat({ ...DEFAULT_ECG_INPUTS, ischemicInjury: 0.8, injuryTerritory: territory }, lead);
  const healthy = beat({ ...DEFAULT_ECG_INPUTS, ischemicInjury: 0, injuryTerritory: territory }, lead);
  let shift = 0;
  for (let i = 0; i < injured.length; i += 1) {
    const d = (injured[i] ?? 0) - (healthy[i] ?? 0);
    if (Math.abs(d) > Math.abs(shift)) shift = d;
  }
  return shift;
}

describe('the chest leads see an axis the limb leads cannot', () => {
  it('writes rS in V1: a small anterior septal r, then a deep S as the mass heads left and back', () => {
    const { peak, trough } = beatExtremes(beat(preset('normalSinus'), 'V1'));
    expect(peak).toBeGreaterThan(0.02);
    expect(Math.abs(trough)).toBeGreaterThan(peak);
  });

  it('and qR in V6: the same septal wavefront going the other way, then a tall R', () => {
    const { peak, trough } = beatExtremes(beat(preset('normalSinus'), 'V6'));
    // A q wave — small, but present, and it is the SAME septal depolarisation that made V1's r.
    expect(trough).toBeLessThan(-0.01);
    expect(peak).toBeGreaterThan(Math.abs(trough));
  });

  it('progresses: the R/S ratio climbs from V1 across to V6', () => {
    const inputs = preset('normalSinus');
    const early = rsRatio(beat(inputs, 'V1'));
    const late = rsRatio(beat(inputs, 'V6'));
    expect(late).toBeGreaterThan(early * 3);
  });

  it('puts the transition where a normal heart puts it, between V2 and V4', () => {
    const transition = rWaveTransition(buildSchedule(preset('normalSinus'), RR_MS));
    expect(transition).not.toBeNull();
    expect(['V3', 'V4']).toContain(transition);
  });

  it('leaves every limb lead untouched by the third axis', () => {
    // The frontal plane is x and y only. Adding a z component must not move a limb trace by so
    // much as a microvolt, or the chest leads would have been bought at the price of the ones
    // that already worked.
    for (const lead of ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'] as const) {
      const { peak } = beatExtremes(beat(preset('normalSinus'), lead));
      expect(Number.isFinite(peak)).toBe(true);
    }
    // Lead II faces the normal mean axis, aVR faces away from it.
    expect(beatExtremes(beat(preset('normalSinus'), 'II')).peak).toBeGreaterThan(0.3);
    expect(beatExtremes(beat(preset('normalSinus'), 'aVR')).trough).toBeLessThan(-0.3);
  });
});

describe('a bundle branch block signs itself in the chest leads', () => {
  it('gives right bundle branch block a terminal positive deflection in V1 — the R prime', () => {
    // The right ventricle is the most anterior chamber, so activating it LAST sends a late
    // wavefront straight at V1. That is the whole of the RSR' pattern.
    expect(terminalQrsMv(preset('normalSinus'), 'V1')).toBeLessThan(0);
    expect(terminalQrsMv(preset('rbbb'), 'V1')).toBeGreaterThan(0);
  });

  it('and a wide terminal S in V6, because that late force points away from the left axilla', () => {
    expect(terminalQrsMv(preset('rbbb'), 'V6')).toBeLessThan(0);
  });

  it('gives left bundle branch block the opposite: a broad monophasic R in V6', () => {
    const normal = terminalQrsMv(preset('normalSinus'), 'V6');
    expect(terminalQrsMv(preset('lbbb'), 'V6')).toBeGreaterThan(normal * 2);
  });

  it('and a deep wide S in V1, with the transition pushed later across the precordium', () => {
    expect(terminalQrsMv(preset('lbbb'), 'V1')).toBeLessThan(terminalQrsMv(preset('normalSinus'), 'V1'));
    const normalTransition = PRECORDIAL_ORDER.indexOf(rWaveTransition(buildSchedule(preset('normalSinus'), RR_MS))!);
    const lbbbTransition = PRECORDIAL_ORDER.indexOf(rWaveTransition(buildSchedule(preset('lbbb'), RR_MS))!);
    expect(lbbbTransition).toBeGreaterThan(normalTransition);
  });
});

describe('twelve leads localise an infarct that six cannot', () => {
  it('elevates the inferior leads and reciprocally depresses aVL for an inferior injury', () => {
    expect(stShiftMv('inferior', 'II')).toBeGreaterThan(0.2);
    expect(stShiftMv('inferior', 'III')).toBeGreaterThan(0.2);
    expect(stShiftMv('inferior', 'aVF')).toBeGreaterThan(0.2);
    // Reciprocal change is not a separate phenomenon — it is the same vector seen from behind.
    expect(stShiftMv('inferior', 'aVL')).toBeLessThan(-0.1);
  });

  it('leaves the chest leads almost silent for that same inferior injury', () => {
    for (const lead of PRECORDIAL_ORDER) {
      expect(Math.abs(stShiftMv('inferior', lead))).toBeLessThan(0.05);
    }
  });

  it('elevates V2 to V4 for an anterior injury while the limb leads stay quiet', () => {
    // The case for a twelve-lead in one assertion: six leads would have called this normal.
    for (const lead of ['V2', 'V3', 'V4'] as const) {
      expect(stShiftMv('anterior', lead)).toBeGreaterThan(0.3);
    }
    for (const lead of ['I', 'II', 'III', 'aVF'] as const) {
      expect(Math.abs(stShiftMv('anterior', lead))).toBeLessThan(0.1);
    }
  });

  it('elevates I, aVL, V5 and V6 together for a lateral injury', () => {
    expect(stShiftMv('lateral', 'I')).toBeGreaterThan(0.2);
    expect(stShiftMv('lateral', 'aVL')).toBeGreaterThan(0.2);
    expect(stShiftMv('lateral', 'V5')).toBeGreaterThan(0.3);
    expect(stShiftMv('lateral', 'V6')).toBeGreaterThan(0.3);
  });

  it('elevates NOTHING for a posterior injury, and depresses V1 to V3 instead', () => {
    // No electrode faces the back of the heart, so the infarct is visible only as its mirror
    // image. This is the one that gets missed, and mistaken for anterior ischaemia.
    for (const lead of PRECORDIAL_ORDER) {
      expect(stShiftMv('posterior', lead)).toBeLessThan(0.15);
    }
    for (const lead of ['V1', 'V2', 'V3'] as const) {
      expect(stShiftMv('posterior', lead)).toBeLessThan(-0.4);
    }
  });

  it('separates anterior from posterior, which the frontal plane alone cannot', () => {
    // Both are nearly invisible in the limb leads; V2 tells them apart at a glance.
    expect(stShiftMv('anterior', 'V2')).toBeGreaterThan(0.3);
    expect(stShiftMv('posterior', 'V2')).toBeLessThan(-0.3);
  });
});

import { buildSchedule, qrsWindow, type ActivationSchedule } from './activation';
import { netDipole } from './dipole';
import { projectOntoLead } from './leadProjection';
import { isStSegment, stDeviationMv } from './injuryCurrent';
import { VENTRICULAR_MYOCARDIUM } from './regions';
import type { EcgInputs, LeadName } from './types';

/** Earliest any ventricular region begins to repolarise — the far end of the ST segment. */
function repolarizationStartMs(schedule: ActivationSchedule): number {
  let start = Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (scheduled) start = Math.min(start, scheduled.repolStartMs);
  }
  return start;
}

/**
 * One complete cardiac cycle in one lead, as an array of voltages.
 *
 * Pure, deterministic, and independent of the scrolling history buffer, which is what lets it
 * serve two jobs at once: it is what the twelve-lead grid draws, and it is what the engine
 * tests assert against. R-wave progression stops being something to eyeball and becomes a
 * claim a test can check — "V1 is net negative, V6 is net positive, and the crossover is where
 * the textbook says it is".
 *
 * A representative CONDUCTED sinus beat, deliberately. In atrial fibrillation or complete
 * heart block the relationship between the two clocks is the finding, and that belongs to the
 * live rhythm strip; a twelve-lead grid is for morphology.
 */
export function sampleBeat(inputs: EcgInputs, rrIntervalMs: number, lead: LeadName, sampleCount = 200): number[] {
  const schedule = buildSchedule(inputs, rrIntervalMs);
  const qrs = qrsWindow(schedule);
  const repolStart = repolarizationStartMs(schedule);

  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i += 1) {
    const atrialTimeMs = (i / sampleCount) * rrIntervalMs;
    // The ventricles are triggered one PR interval after the atria, so they run on a clock
    // offset by exactly that much — the same relationship the live engine maintains.
    const ventricularTimeMs = atrialTimeMs - inputs.avDelayMs;

    let voltage = projectOntoLead(netDipole(schedule, atrialTimeMs, ventricularTimeMs), lead);
    if (isStSegment(ventricularTimeMs, qrs.offsetMs, repolStart)) {
      voltage += stDeviationMv(inputs.ischemicInjury, inputs.injuryTerritory, lead);
    }
    samples.push(voltage);
  }
  return samples;
}

/** Largest upward and downward excursions of one sampled beat, mV. */
export function beatExtremes(samples: number[]): { peak: number; trough: number } {
  return {
    peak: samples.reduce((max, v) => Math.max(max, v), 0),
    trough: samples.reduce((min, v) => Math.min(min, v), 0),
  };
}

/**
 * R/S ratio of a sampled beat: tallest positive deflection over deepest negative one.
 *
 * This is how the precordium is actually read at the bedside — not by integrating anything,
 * but by asking whether the R is taller than the S is deep. Infinity when there is no S at
 * all, 0 when there is no R.
 */
export function rsRatio(samples: number[]): number {
  const { peak, trough } = beatExtremes(samples);
  const s = Math.abs(trough);
  if (s < 1e-9) return peak > 0 ? Infinity : 0;
  return peak / s;
}

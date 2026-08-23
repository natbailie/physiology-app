import { ATRIAL_FIBRILLATION, TIMING } from './constants';
import { buildSchedule, pWaveWindow, qrsWindow, tWaveEndMs, type ActivationSchedule } from './activation';
import { horizontalAngleDegrees, netDipole, regionStateAt, vectorAngleDegrees, vectorMagnitude } from './dipole';
import { classifyAxis, meanQrsAxisDegrees, projectOntoLead, rWaveTransition } from './leadProjection';
import { isStSegment, stDeviationMv } from './injuryCurrent';
import { measureIntervals } from './intervals';
import { REGIONS, VENTRICULAR_MYOCARDIUM } from './regions';
import { clamp } from '@/shared/lib/math';
import type { EcgDerived, EcgInputs, EcgSegment, EcgSnapshot, EcgState, RegionActivation } from './types';

const DEFAULT_RR_MS = 1000;

/** Far past every scheduled event, so a chamber reads as fully at rest until something
 * actually triggers it. Starting the ventricular clock at 0 would inscribe a spurious QRS on
 * the very first frame, before any impulse had reached the ventricles. */
const CHAMBER_AT_REST_MS = 9999;

export function createInitialState(): EcgState {
  return {
    simTimeSeconds: 0,
    atrialCycleTimeMs: 0,
    ventricularCycleTimeMs: CHAMBER_AT_REST_MS,
    atrialBeatCount: 0,
    ventricularBeatCount: 0,
    lastRrIntervalMs: DEFAULT_RR_MS,
    currentAtrialIntervalMs: DEFAULT_RR_MS,
    currentVentricularIntervalMs: DEFAULT_RR_MS,
    currentBeatConducts: true,
    ventricularTriggeredThisBeat: false,
  };
}

/** Deterministic pseudo-random in [0,1) from an integer seed, so the irregular rhythm of
 * atrial fibrillation is erratic to look at but perfectly reproducible in tests. */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function sinusIntervalMs(heartRate: number): number {
  return 60000 / clamp(heartRate, 20, 220);
}

/** True when the AV node has stopped conducting altogether and the ventricles have fallen
 * back on their own escape pacemaker — third-degree (complete) heart block. */
export function isCompleteBlock(avBlockSeverity: number): boolean {
  return avBlockSeverity >= TIMING.COMPLETE_BLOCK_THRESHOLD;
}

/** Whether a given atrial beat conducts. Partial block drops every other beat (2:1), which is
 * second-degree block; below the threshold every beat gets through. */
function beatConducts(avBlockSeverity: number, atrialBeatCount: number): boolean {
  if (isCompleteBlock(avBlockSeverity)) return false;
  if (avBlockSeverity < TIMING.DROPPED_BEAT_THRESHOLD) return true;
  return atrialBeatCount % 2 === 0;
}

/** Which wave or segment is being written right now. */
function currentSegment(
  schedule: ActivationSchedule,
  atrialTimeMs: number,
  ventricularTimeMs: number,
  hasOrganizedAtria: boolean,
): EcgSegment {
  const qrs = qrsWindow(schedule);
  const tEnd = tWaveEndMs(schedule);

  if (ventricularTimeMs >= qrs.onsetMs && ventricularTimeMs < qrs.offsetMs) return 'QRS';

  // Repolarisation start is the earliest any ventricular region begins to repolarise.
  let repolStart = Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (scheduled) repolStart = Math.min(repolStart, scheduled.repolStartMs);
  }

  if (ventricularTimeMs >= qrs.offsetMs && ventricularTimeMs < repolStart) return 'ST segment';
  if (ventricularTimeMs >= repolStart && ventricularTimeMs < tEnd) return 'T wave';

  if (hasOrganizedAtria) {
    const p = pWaveWindow(schedule);
    if (atrialTimeMs >= p.onsetMs && atrialTimeMs < p.offsetMs) return 'P wave';
    // Between the end of the P wave and the start of the QRS the AV node is conducting, but
    // there is too little tissue to register — the flat PR segment.
    if (atrialTimeMs >= p.offsetMs && ventricularTimeMs < qrs.onsetMs) return 'PR segment';
  }

  return 'baseline';
}

/** Low-amplitude chaotic atrial activity that replaces the P wave in atrial fibrillation. */
function fibrillatoryVoltageMv(simTimeSeconds: number): number {
  const primary = Math.sin(simTimeSeconds * ATRIAL_FIBRILLATION.FIBRILLATORY_FREQUENCY_HZ * 2 * Math.PI);
  const secondary = Math.sin(simTimeSeconds * ATRIAL_FIBRILLATION.FIBRILLATORY_FREQUENCY_HZ * 3.7 * Math.PI + 1.3);
  return ((primary + secondary * 0.6) / 1.6) * ATRIAL_FIBRILLATION.FIBRILLATORY_AMPLITUDE_MV;
}

export function computeDerived(state: EcgState, inputs: EcgInputs): EcgDerived {
  const schedule = buildSchedule(inputs, state.lastRrIntervalMs);
  const inAf = inputs.rhythm === 'atrialFibrillation';
  const dissociated = isCompleteBlock(inputs.avBlockSeverity) || inAf;
  const hasOrganizedAtria = !inAf;

  // The atria only contribute an organised P wave in sinus rhythm; in AF their contribution
  // is replaced by fibrillatory noise below.
  const dipole = netDipole(schedule, hasOrganizedAtria ? state.atrialCycleTimeMs : Number.NEGATIVE_INFINITY, state.ventricularCycleTimeMs);

  let voltage = projectOntoLead(dipole, inputs.lead);

  // Ischemic injury shifts the baseline during the ST segment.
  const qrs = qrsWindow(schedule);
  let repolStart = Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (scheduled) repolStart = Math.min(repolStart, scheduled.repolStartMs);
  }
  if (isStSegment(state.ventricularCycleTimeMs, qrs.offsetMs, repolStart)) {
    voltage += stDeviationMv(inputs.ischemicInjury, inputs.injuryTerritory, inputs.lead);
  }

  if (inAf) voltage += fibrillatoryVoltageMv(state.simTimeSeconds);

  const regions: RegionActivation[] = REGIONS.map((definition) => {
    const scheduled = schedule.get(definition.id)!;
    const tMs = definition.chamber === 'atrial' ? state.atrialCycleTimeMs : state.ventricularCycleTimeMs;
    // In AF the atrial myocardium never sits in an organised depolarising state.
    if (definition.chamber === 'atrial' && inAf) {
      return { id: definition.id, label: definition.label, state: 'depolarizing', phaseProgress: pseudoRandom(state.atrialBeatCount + tMs) };
    }
    const { state: regionState, progress } = regionStateAt(scheduled, tMs);
    return { id: definition.id, label: definition.label, state: regionState, phaseProgress: progress };
  });

  const axis = meanQrsAxisDegrees(schedule);
  const intervals = measureIntervals(schedule, inputs.avDelayMs, state.lastRrIntervalMs);
  const ventricularRate = 60000 / Math.max(state.lastRrIntervalMs, 1);

  return {
    ecgVoltageMv: voltage,
    regions,
    currentSegment: currentSegment(schedule, state.atrialCycleTimeMs, state.ventricularCycleTimeMs, hasOrganizedAtria),
    dipoleMagnitude: vectorMagnitude(dipole),
    dipoleAngleDegrees: vectorAngleDegrees(dipole),
    horizontalAngleDegrees: horizontalAngleDegrees(dipole),
    rWaveTransitionLead: rWaveTransition(schedule),
    meanQrsAxisDegrees: axis,
    axisClassification: classifyAxis(axis),
    prIntervalMs: hasOrganizedAtria && !dissociated ? intervals.prIntervalMs : 0,
    qrsDurationMs: intervals.qrsDurationMs,
    qtIntervalMs: intervals.qtIntervalMs,
    qtcMs: intervals.qtcMs,
    heartRateBpm: inAf ? ventricularRate : clamp(inputs.heartRate, 20, 220),
    ventricularRateBpm: ventricularRate,
    isDissociated: dissociated,
    rhythmRegular: !inAf,
    avDelayMs: inputs.avDelayMs,
    avBlockSeverity: inputs.avBlockSeverity,
    rightBundleConduction: inputs.rightBundleConduction,
    leftBundleConduction: inputs.leftBundleConduction,
    ventricularAPD: inputs.ventricularAPD,
    serumPotassium: inputs.serumPotassium,
    ischemicInjury: inputs.ischemicInjury,
    injuryTerritory: inputs.injuryTerritory,
    lead: inputs.lead,
    rhythm: inputs.rhythm,
  };
}

export function tick(state: EcgState, derived: EcgDerived, dtSeconds: number, inputs: EcgInputs): EcgState {
  const dtMs = dtSeconds * 1000;
  // Conduction state is read off `derived` (which already carries it forward) while the raw
  // sinus rate comes from `inputs` — in atrial fibrillation the derived rate reports the
  // ventricular response, not the atrial drive.
  const inAf = derived.rhythm === 'atrialFibrillation';
  const completeBlock = isCompleteBlock(derived.avBlockSeverity);
  const avDelayMs = derived.avDelayMs;

  let atrialCycleTimeMs = state.atrialCycleTimeMs + dtMs;
  let ventricularCycleTimeMs = state.ventricularCycleTimeMs + dtMs;
  let atrialBeatCount = state.atrialBeatCount;
  let ventricularBeatCount = state.ventricularBeatCount;
  let lastRrIntervalMs = state.lastRrIntervalMs;
  let currentAtrialIntervalMs = state.currentAtrialIntervalMs;
  let currentVentricularIntervalMs = state.currentVentricularIntervalMs;
  let currentBeatConducts = state.currentBeatConducts;
  let ventricularTriggeredThisBeat = state.ventricularTriggeredThisBeat;

  // --- Atrial clock ---
  const sinusMs = sinusIntervalMs(inputs.heartRate);
  if (atrialCycleTimeMs >= currentAtrialIntervalMs) {
    atrialCycleTimeMs -= currentAtrialIntervalMs;
    atrialBeatCount += 1;
    currentAtrialIntervalMs = sinusMs;
    currentBeatConducts = beatConducts(derived.avBlockSeverity, atrialBeatCount);
    ventricularTriggeredThisBeat = false;
  }

  // --- Ventricular clock ---
  if (completeBlock || inAf) {
    // The ventricles are running on their own: an escape pacemaker in complete block, or an
    // irregular response to chaotic atrial impulses in AF.
    if (ventricularCycleTimeMs >= currentVentricularIntervalMs) {
      // A genuine overshoot can never exceed one tick, so clamp it. Without this the
      // deliberately large at-rest starting value would drain in a burst of spurious beats
      // before the escape rhythm settled.
      ventricularCycleTimeMs = Math.min(ventricularCycleTimeMs - currentVentricularIntervalMs, dtMs);
      ventricularBeatCount += 1;
      lastRrIntervalMs = currentVentricularIntervalMs;

      if (inAf) {
        const variation =
          ATRIAL_FIBRILLATION.RR_VARIATION_MIN +
          pseudoRandom(ventricularBeatCount) * (ATRIAL_FIBRILLATION.RR_VARIATION_MAX - ATRIAL_FIBRILLATION.RR_VARIATION_MIN);
        currentVentricularIntervalMs = sinusMs * variation;
      } else {
        currentVentricularIntervalMs = 60000 / TIMING.ESCAPE_RATE_BPM;
      }
    }
  } else if (currentBeatConducts && !ventricularTriggeredThisBeat && atrialCycleTimeMs >= avDelayMs) {
    // A conducted atrial beat reaches the ventricles one PR interval later.
    lastRrIntervalMs = ventricularCycleTimeMs;
    ventricularCycleTimeMs = atrialCycleTimeMs - avDelayMs;
    ventricularBeatCount += 1;
    ventricularTriggeredThisBeat = true;
    currentVentricularIntervalMs = currentAtrialIntervalMs;
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    atrialCycleTimeMs,
    ventricularCycleTimeMs,
    atrialBeatCount,
    ventricularBeatCount,
    lastRrIntervalMs: clamp(lastRrIntervalMs, 200, 4000),
    currentAtrialIntervalMs,
    currentVentricularIntervalMs,
    currentBeatConducts,
    ventricularTriggeredThisBeat,
  };
}

export function step(state: EcgState, inputs: EcgInputs, dtSeconds: number): EcgSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds, inputs), derived };
}

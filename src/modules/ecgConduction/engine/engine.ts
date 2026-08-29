import {
  ATRIAL_FLUTTER,
  ATRIAL_FIBRILLATION,
  RATE_AVERAGING,
  SICK_SINUS,
  TIMING,
  VENTRICULAR_FOCUS,
  WPW,
} from './constants';
import { buildSchedule, pWaveWindow, qrsWindow, tWaveEndMs, type ActivationSchedule } from './activation';
import { horizontalAngleDegrees, netDipole, regionStateAt, vectorAngleDegrees, vectorMagnitude, type Vector3 } from './dipole';
import { classifyAxis, meanQrsAxisDegrees, projectOntoLead, rWaveTransition } from './leadProjection';
import { isStSegment, stDeviationMv } from './injuryCurrent';
import { measureIntervals } from './intervals';
import { REGIONS, VENTRICULAR_MYOCARDIUM } from './regions';
import { clamp } from '@/shared/lib/math';
import type { EcgDerived, EcgInputs, EcgSegment, EcgSnapshot, EcgState, RegionActivation } from './types';

const DEFAULT_RR_MS = 1000;
const TWO_PI = Math.PI * 2;

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
    emaRrMs: DEFAULT_RR_MS,
    currentAtrialIntervalMs: DEFAULT_RR_MS,
    currentVentricularIntervalMs: DEFAULT_RR_MS,
    currentBeatConducts: true,
    saPaused: false,
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

/**
 * The delay an impulse effectively experiences between atrial onset and ventricular onset.
 * An accessory pathway skips most of the AV node's protective delay, and whichever route
 * reaches the ventricular muscle FIRST is the one that triggers the beat.
 */
export function effectiveAvDelayMs(avDelayMs: number, rhythm: EcgInputs['rhythm']): number {
  if (rhythm !== 'wpw') return avDelayMs;
  return Math.max(avDelayMs - WPW.AV_DELAY_SAVED_MS, WPW.MIN_AV_DELAY_MS);
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

/**
 * Ventricular fibrillation: several incommensurate frequencies drifting in and out of phase,
 * so the trace never repeats and never organises into anything a QRS could be read from.
 */
function fibrillatingVentricleVoltageMv(simTimeSeconds: number): number {
  const baseHz = VENTRICULAR_FOCUS.VF_BASE_HZ;
  const primary = Math.sin(simTimeSeconds * baseHz * TWO_PI);
  const second = Math.sin(simTimeSeconds * baseHz * 2.37 * TWO_PI + 1.7);
  const third = Math.sin(simTimeSeconds * baseHz * 0.53 * TWO_PI + 0.4);
  // A slow amplitude wander on top, because even the chaos of VF waxes and wanes.
  const wander = 0.75 + 0.25 * Math.sin(simTimeSeconds * 0.31 * TWO_PI);
  return ((primary + second * 0.8 + third * 0.55) / 2.35) * VENTRICULAR_FOCUS.VF_AMPLITUDE_MV * wander;
}

/**
 * Torsades de pointes: the mean axis itself rotates round the baseline over a few seconds, so
 * each successive complex is seen from a different angle — positive, then isoelectric, then
 * negative. Rotating the dipole BEFORE lead projection makes every lead witness the twist.
 */
function applyTorsadesTwist(dipole: Vector3, simTimeSeconds: number): Vector3 {
  const theta = VENTRICULAR_FOCUS.TWIST_AMPLITUDE_RADIANS * Math.sin((simTimeSeconds * TWO_PI) / VENTRICULAR_FOCUS.TWIST_PERIOD_S);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return { x: dipole.x * cos - dipole.y * sin, y: dipole.x * sin + dipole.y * cos, z: dipole.z };
}

export function computeDerived(state: EcgState, inputs: EcgInputs): EcgDerived {
  const rhythm = inputs.rhythm;
  const inAf = rhythm === 'atrialFibrillation';
  const inVf = rhythm === 'ventricularFibrillation';
  const inFlutter = rhythm === 'atrialFlutter';
  const vtLike = rhythm === 'ventricularTachycardia' || rhythm === 'torsades';
  const focusDriven = vtLike || inVf;

  // Organised P waves exist unless the atria themselves are fibrillating — VF is a ventricular
  // process and leaves the atrial clock running, but its surface contribution is unreadable.
  // A sick-sinus pause is the third silence: the SA node simply has not fired yet.
  const saSilent = rhythm === 'sickSinus' && state.saPaused;
  const hasOrganizedAtria = !inAf && !inVf && !saSilent;
  const dissociated = isCompleteBlock(inputs.avBlockSeverity) || inAf || focusDriven;

  const schedule = buildSchedule(inputs, state.lastRrIntervalMs);

  let dipole = netDipole(schedule, hasOrganizedAtria ? state.atrialCycleTimeMs : Number.NEGATIVE_INFINITY, state.ventricularCycleTimeMs);
  if (rhythm === 'torsades') dipole = applyTorsadesTwist(dipole, state.simTimeSeconds);

  // Ventricular fibrillation contributes NO organised deflection at all: the schedule's
  // regions never align long enough to write a QRS, so the trace is chaos alone.
  let voltage = inVf ? 0 : projectOntoLead(dipole, inputs.lead);

  // Ischemic injury shifts the baseline during the ST segment.
  const qrs = qrsWindow(schedule);
  let repolStart = Infinity;
  for (const id of VENTRICULAR_MYOCARDIUM) {
    const scheduled = schedule.get(id);
    if (scheduled) repolStart = Math.min(repolStart, scheduled.repolStartMs);
  }
  if (!inVf && isStSegment(state.ventricularCycleTimeMs, qrs.offsetMs, repolStart)) {
    voltage += stDeviationMv(inputs.ischemicInjury, inputs.injuryTerritory, inputs.lead);
  }

  if (inAf) voltage += fibrillatoryVoltageMv(state.simTimeSeconds);
  if (inVf) voltage += fibrillatingVentricleVoltageMv(state.simTimeSeconds);

  const regions: RegionActivation[] = REGIONS.map((definition) => {
    const scheduled = schedule.get(definition.id)!;
    const tMs = definition.chamber === 'atrial' ? state.atrialCycleTimeMs : state.ventricularCycleTimeMs;
    // Fibrillating tissue never sits in an organised state — atria in AF, ventricles in VF.
    const chaoticallyActive =
      (definition.chamber === 'atrial' && inAf) || (definition.chamber === 'ventricular' && inVf);
    if (chaoticallyActive) {
      return { id: definition.id, label: definition.label, state: 'depolarizing', phaseProgress: pseudoRandom(state.atrialBeatCount + state.ventricularBeatCount * 17 + tMs) };
    }
    const { state: regionState, progress } = regionStateAt(scheduled, tMs);
    return { id: definition.id, label: definition.label, state: regionState, phaseProgress: progress };
  });

  const axis = meanQrsAxisDegrees(schedule);
  const avDelayForMeasurement = effectiveAvDelayMs(inputs.avDelayMs, rhythm);
  const intervals = measureIntervals(schedule, avDelayForMeasurement, state.lastRrIntervalMs);
  const ventricularRate = 60000 / Math.max(state.lastRrIntervalMs, 1);
  const meanVentricularRate = 60000 / Math.max(state.emaRrMs, 1);

  return {
    ecgVoltageMv: voltage,
    regions,
    currentSegment: inVf ? 'baseline' : currentSegment(schedule, state.atrialCycleTimeMs, state.ventricularCycleTimeMs, hasOrganizedAtria),
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
    // The "atrial rate" row follows whoever is driving the atria: the sinus node normally,
    // the flutter circuit's fixed 300/min, and nothing readable in fibrillation.
    heartRateBpm: inAf ? ventricularRate : inFlutter ? ATRIAL_FLUTTER.CIRCUIT_RATE_BPM : inVf ? 0 : clamp(inputs.heartRate, 20, 220),
    ventricularRateBpm: ventricularRate,
    meanVentricularRateBpm: meanVentricularRate,
    isDissociated: dissociated,
    rhythmRegular: !(inAf || inVf || rhythm === 'sickSinus'),
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
  const rhythm = derived.rhythm;
  const inAf = rhythm === 'atrialFibrillation';
  const inFlutter = rhythm === 'atrialFlutter';
  const vtLike = rhythm === 'ventricularTachycardia' || rhythm === 'torsades';
  const inVf = rhythm === 'ventricularFibrillation';
  const sickSinus = rhythm === 'sickSinus';
  const completeBlock = isCompleteBlock(derived.avBlockSeverity);
  const avDelayMs = effectiveAvDelayMs(derived.avDelayMs, rhythm);

  let atrialCycleTimeMs = state.atrialCycleTimeMs + dtMs;
  let ventricularCycleTimeMs = state.ventricularCycleTimeMs + dtMs;
  let atrialBeatCount = state.atrialBeatCount;
  let ventricularBeatCount = state.ventricularBeatCount;
  let lastRrIntervalMs = state.lastRrIntervalMs;
  let emaRrMs = state.emaRrMs;
  let currentAtrialIntervalMs = state.currentAtrialIntervalMs;
  let currentVentricularIntervalMs = state.currentVentricularIntervalMs;
  let currentBeatConducts = state.currentBeatConducts;
  let saPaused = state.saPaused;
  let ventricularTriggeredThisBeat = state.ventricularTriggeredThisBeat;

  /** Records a completed ventricular beat against the running-rate average. */
  const recordBeat = (rrMs: number) => {
    lastRrIntervalMs = rrMs;
    emaRrMs = emaRrMs * (1 - RATE_AVERAGING.EMA_NEW_WEIGHT) + rrMs * RATE_AVERAGING.EMA_NEW_WEIGHT;
  };

  // --- Atrial clock ---
  const sinusMs = sinusIntervalMs(inputs.heartRate);
  if (atrialCycleTimeMs >= currentAtrialIntervalMs) {
    atrialCycleTimeMs -= currentAtrialIntervalMs;
    atrialBeatCount += 1;
    if (inFlutter) {
      // The circuit runs at its own fixed rate whatever the sinus node would like, and the
      // AV node filters it down to a regular fraction of that.
      currentAtrialIntervalMs = 60000 / ATRIAL_FLUTTER.CIRCUIT_RATE_BPM;
      currentBeatConducts = atrialBeatCount % ATRIAL_FLUTTER.CONDUCTION_RATIO === 0;
      saPaused = false;
    } else {
      const paused = sickSinus && pseudoRandom(atrialBeatCount * 13 + 5) < SICK_SINUS.PAUSE_PROBABILITY;
      if (paused) {
        // The SA node fails to fire: the next impulse only exists at the END of this stretched
        // cycle, so nothing may conduct from it meanwhile and the ventricles must escape.
        currentAtrialIntervalMs = sinusMs * SICK_SINUS.PAUSE_STRETCH;
        currentBeatConducts = false;
        saPaused = true;
      } else {
        currentAtrialIntervalMs = sinusMs;
        currentBeatConducts = beatConducts(derived.avBlockSeverity, atrialBeatCount);
        saPaused = false;
      }
    }
    ventricularTriggeredThisBeat = false;
  }

  // --- Ventricular clock ---
  if (completeBlock || inAf || vtLike || inVf) {
    // The ventricles are running on their own: an escape pacemaker in complete block, an
    // irregular response in AF, a ventricular focus in VT/torsades, or nothing organised at
    // all in VF (the clock still ticks so downstream rates stay finite).
    if (ventricularCycleTimeMs >= currentVentricularIntervalMs) {
      // A genuine overshoot can never exceed one tick, so clamp it. Without this the
      // deliberately large at-rest starting value would drain in a burst of spurious beats
      // before the escape rhythm settled.
      ventricularCycleTimeMs = Math.min(ventricularCycleTimeMs - currentVentricularIntervalMs, dtMs);
      ventricularBeatCount += 1;

      if (inAf) {
        recordBeat(currentVentricularIntervalMs);
        const variation =
          ATRIAL_FIBRILLATION.RR_VARIATION_MIN +
          pseudoRandom(ventricularBeatCount) * (ATRIAL_FIBRILLATION.RR_VARIATION_MAX - ATRIAL_FIBRILLATION.RR_VARIATION_MIN);
        currentVentricularIntervalMs = sinusMs * variation;
      } else if (vtLike) {
        recordBeat(currentVentricularIntervalMs);
        currentVentricularIntervalMs = 60000 / (rhythm === 'torsades'
          ? VENTRICULAR_FOCUS.TORSADES_RATE_BPM
          : VENTRICULAR_FOCUS.VT_RATE_BPM);
      } else if (inVf) {
        recordBeat(currentVentricularIntervalMs);
        const span = VENTRICULAR_FOCUS.VF_MAX_INTERVAL_MS - VENTRICULAR_FOCUS.VF_MIN_INTERVAL_MS;
        currentVentricularIntervalMs = VENTRICULAR_FOCUS.VF_MIN_INTERVAL_MS + pseudoRandom(ventricularBeatCount * 29 + 3) * span;
      } else {
        recordBeat(currentVentricularIntervalMs);
        currentVentricularIntervalMs = 60000 / TIMING.ESCAPE_RATE_BPM;
      }
    }
  } else if (currentBeatConducts && !ventricularTriggeredThisBeat && atrialCycleTimeMs >= avDelayMs) {
    // A conducted atrial beat reaches the ventricles one PR interval later.
    recordBeat(ventricularCycleTimeMs);
    ventricularCycleTimeMs = atrialCycleTimeMs - avDelayMs;
    ventricularBeatCount += 1;
    ventricularTriggeredThisBeat = true;
    currentVentricularIntervalMs = currentAtrialIntervalMs;
  } else if (sickSinus && ventricularCycleTimeMs >= 60000 / SICK_SINUS.JUNCTIONAL_RATE_BPM) {
    // The SA node has paused and no sinus impulse is coming: the AV junction escapes at its
    // own slow intrinsic rate until the sinus node recovers. Same overshoot clamp as the
    // autonomous branch above, so the at-rest starting clock cannot drain in a burst.
    const junctionalIntervalMs = 60000 / SICK_SINUS.JUNCTIONAL_RATE_BPM;
    ventricularCycleTimeMs = Math.min(ventricularCycleTimeMs - junctionalIntervalMs, dtMs);
    ventricularBeatCount += 1;
    recordBeat(junctionalIntervalMs);
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    atrialCycleTimeMs,
    ventricularCycleTimeMs,
    atrialBeatCount,
    ventricularBeatCount,
    lastRrIntervalMs: clamp(lastRrIntervalMs, 80, 4000),
    emaRrMs: clamp(emaRrMs, 80, 4000),
    currentAtrialIntervalMs,
    currentVentricularIntervalMs,
    currentBeatConducts,
    saPaused,
    ventricularTriggeredThisBeat,
  };
}

export function step(state: EcgState, inputs: EcgInputs, dtSeconds: number): EcgSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds, inputs), derived };
}

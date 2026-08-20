import { VENTRICLE } from './constants';
import { pacemakerRateBpm, saNodeRamp } from './pacemaker';
import { cardiacPhase, nextVolume, ventricularPressure } from './pvLoop';
import { ecgVoltage, isHeartBlock } from './avConduction';
import { cardiacOutputLPerMin, ejectionFractionPercent, strokeVolume } from './cardiacOutput';
import { clamp } from '@/shared/lib/math';
import type { CardiacDerived, CardiacInputs, CardiacSnapshot, CardiacState } from './types';

export function createInitialState(): CardiacState {
  return {
    simTimeSeconds: 0,
    cyclePhaseFraction: 0,
    saNodeRampVoltage: 0,
    lvVolumeML: 120,
    lvPressureMmHg: 8,
    strokeVolumeLastBeat: 70,
    endSystolicVolumeLastBeat: 50,
    minVolumeThisCycle: 120,
    maxVolumeThisCycle: 120,
  };
}

/**
 * Unlike the hormone modules, almost nothing here is smoothed with `approach` — the cardiac
 * cycle is a genuine state machine driven by valve openings, so pressure and volume are
 * integrated directly and the phase is re-derived from pressure comparisons every tick.
 */
export function computeDerived(state: CardiacState, inputs: CardiacInputs): CardiacDerived {
  const heartRateBpm = pacemakerRateBpm(inputs.intrinsicHeartRate, inputs.sympatheticDrive, inputs.parasympatheticDrive);
  const phase = cardiacPhase(state.cyclePhaseFraction, state.lvPressureMmHg, inputs.afterloadPressure, state.lvVolumeML, inputs.preloadEDV);

  const sv = state.strokeVolumeLastBeat;
  // SV = EDV − ESV by definition, so the end-diastolic volume actually achieved follows.
  const edv = state.endSystolicVolumeLastBeat + sv;

  return {
    heartRateBpm,
    cyclePhaseFraction: state.cyclePhaseFraction,
    phase,
    lvVolumeML: state.lvVolumeML,
    lvPressureMmHg: state.lvPressureMmHg,
    strokeVolumeML: sv,
    ejectionFractionPercent: ejectionFractionPercent(sv, edv),
    cardiacOutputLPerMin: cardiacOutputLPerMin(sv, heartRateBpm),
    endDiastolicVolumeML: edv,
    endSystolicVolumeML: state.endSystolicVolumeLastBeat,
    saNodeRampVoltage: saNodeRamp(state.cyclePhaseFraction),
    ecgVoltage: ecgVoltage(state.cyclePhaseFraction, inputs.avConductionDelay, heartRateBpm),
    isHeartBlock: isHeartBlock(inputs.avConductionDelay),
    intrinsicHeartRate: inputs.intrinsicHeartRate,
    sympatheticDrive: inputs.sympatheticDrive,
    parasympatheticDrive: inputs.parasympatheticDrive,
    preloadEDV: inputs.preloadEDV,
    afterloadPressure: inputs.afterloadPressure,
    contractility: inputs.contractility,
    avConductionDelay: inputs.avConductionDelay,
  };
}

export function tick(state: CardiacState, derived: CardiacDerived, dtSeconds: number): CardiacState {
  const cycleDurationSeconds = 60 / derived.heartRateBpm;
  const rawNextPhase = state.cyclePhaseFraction + dtSeconds / cycleDurationSeconds;
  const beatCompleted = rawNextPhase >= 1;
  const cyclePhaseFraction = rawNextPhase % 1;

  const volumeML = nextVolume(
    derived.phase,
    state.lvVolumeML,
    derived.preloadEDV,
    state.lvPressureMmHg,
    derived.afterloadPressure,
    dtSeconds,
  );
  const pressureMmHg = ventricularPressure(cyclePhaseFraction, volumeML, derived.contractility);

  const clampedVolume = clamp(volumeML, VENTRICLE.MIN_VOLUME_ML, VENTRICLE.MAX_VOLUME_ML);
  const minVolumeThisCycle = Math.min(state.minVolumeThisCycle, clampedVolume);
  const maxVolumeThisCycle = Math.max(state.maxVolumeThisCycle, clampedVolume);

  // Stroke volume is latched once per beat from the volume EXTREMES the cycle actually
  // reached, not from a fixed sampling phase — when ejection ends depends on afterload and
  // contractility, so the end-systolic volume has to be found as a minimum rather than
  // assumed to occur at some particular moment in the cycle.
  const endSystolicVolumeLastBeat = beatCompleted ? minVolumeThisCycle : state.endSystolicVolumeLastBeat;
  const strokeVolumeLastBeat = beatCompleted ? strokeVolume(maxVolumeThisCycle, minVolumeThisCycle) : state.strokeVolumeLastBeat;

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    cyclePhaseFraction,
    saNodeRampVoltage: saNodeRamp(cyclePhaseFraction),
    lvVolumeML: clampedVolume,
    lvPressureMmHg: pressureMmHg,
    strokeVolumeLastBeat,
    endSystolicVolumeLastBeat,
    // Reset the extremes at each beat boundary so the next cycle measures itself afresh.
    minVolumeThisCycle: beatCompleted ? clampedVolume : minVolumeThisCycle,
    maxVolumeThisCycle: beatCompleted ? clampedVolume : maxVolumeThisCycle,
  };
}

export function step(state: CardiacState, inputs: CardiacInputs, dtSeconds: number): CardiacSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, derived, dtSeconds), derived };
}

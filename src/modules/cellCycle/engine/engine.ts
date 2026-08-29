import { CHECKPOINT, PHASE } from './constants';
import { apoptosisPressurePct, cyclinDDrivePct, determineArrest, g1DurationH, p53ActivityPct, phaseDurationH } from './checkpoints';
import { approach, clamp } from '@/shared/lib/math';
import type { ArrestCause, CellCycleDerived, CellCycleInputs, CellCycleInternalState, CellCycleSnapshot } from './types';

export function createInitialState(): CellCycleInternalState {
  return {
    simTimeSeconds: 0,
    phase: 'G1',
    phaseProgress: 0,
    completedDivisions: 0,
    lesionLoad: 0.05,
    apoptoticFraction: 0,
  };
}

function currentPhaseDurationH(phase: CellCycleInternalState['phase'], inputs: CellCycleInputs): number {
  return phase === 'G1' ? g1DurationH(inputs) : phaseDurationH(phase);
}

function nextPhase(phase: CellCycleInternalState['phase']): CellCycleInternalState['phase'] {
  switch (phase) {
    case 'G1':
      return 'S';
    case 'S':
      return 'G2';
    case 'G2':
      return 'M';
    case 'M':
      return 'G1';
  }
}

export function computeDerived(state: CellCycleInternalState, inputs: CellCycleInputs): CellCycleDerived {
  const arrest = determineArrest(state.phase, inputs, state.lesionLoad);
  const duration = currentPhaseDurationH(state.phase, inputs);
  const cycling = arrest === 'none';
  // Doubling time from the cycle pace: an arrested population does not double at all.
  const fullCycleH = g1DurationH(inputs) + PHASE.S_H + PHASE.G2_H + PHASE.M_H;
  const doublingTimeH = cycling
    ? fullCycleH / clamp((inputs.growthFactorDrive + inputs.oncogeneDrive) * 0.55 + 0.45, 0.45, 1.5)
    : 9999;

  return {
    phase: state.phase,
    phaseProgress: state.phaseProgress,
    phaseProgressPct: state.phaseProgress * 100,
    phaseDurationH: duration,
    arrestCause: arrest,
    cyclingRatePct: cycling ? 100 : 0,
    doublingTimeH,
    cyclinDDrivePct: cyclinDDrivePct(inputs),
    lesionLoadPct: state.lesionLoad * 100,
    apoptoticFractionPct: state.apoptoticFraction * 100,
    p53ActivityPct: p53ActivityPct(state.lesionLoad, inputs.p53Function),
    growthFactorDrive: inputs.growthFactorDrive,
    dnaDamage: inputs.dnaDamage,
    p53Function: inputs.p53Function,
    oncogeneDrive: inputs.oncogeneDrive,
  };
}

export function tick(state: CellCycleInternalState, inputs: CellCycleInputs, dtSeconds: number): CellCycleInternalState {
  // Engines receive SIMULATED seconds (useEngineLoop applies timeScale before calling);
  // internally this model thinks in hours.
  const dtH = dtSeconds / 3600;
  const arrest: ArrestCause = determineArrest(state.phase, inputs, state.lesionLoad);

  // Lesion load chases the insult downward under intact p53 repair, and accumulates beyond
  // the insult itself when repair is absent — unrepaired damage breeds more of itself.
  const repairTarget = inputs.p53Function > 0.15 ? inputs.dnaDamage * 0.8 : Math.min(inputs.dnaDamage * 1.35, 1);
  const lesionLoad = approach(state.lesionLoad, repairTarget, dtH, CHECKPOINT.REPAIR_TAU_H);

  // Apoptosis commits when p53 is intact, lesions are beyond repair, and the cell is parked
  // at a checkpoint that exists to make exactly this decision.
  const apoptosisRate = (apoptosisPressurePct(arrest, lesionLoad, inputs.p53Function) / 100) * CHECKPOINT.APOPTOSIS_RATE_PER_HOUR;
  const apoptoticFraction = clamp(state.apoptoticFraction + apoptosisRate * dtH, 0, 1);

  let { phase, phaseProgress, completedDivisions } = state;
  if (arrest === 'none') {
    phaseProgress += dtH / currentPhaseDurationH(phase, inputs);
    while (phaseProgress >= 1) {
      phaseProgress -= 1;
      phase = nextPhase(phase);
      if (phase === 'G1') completedDivisions += 1;
    }
  }

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    phase,
    phaseProgress: clamp(phaseProgress, 0, 1),
    completedDivisions,
    lesionLoad,
    apoptoticFraction,
  };
}

export function step(state: CellCycleInternalState, inputs: CellCycleInputs, dtSeconds: number): CellCycleSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, inputs, dtSeconds), derived };
}

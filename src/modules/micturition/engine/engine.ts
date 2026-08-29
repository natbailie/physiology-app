import { clamp } from '@/shared/lib/math';
import { BLADDER, SIMULATION } from './constants';
import type {
  MicturitionDerived,
  MicturitionHistoryPoint,
  MicturitionInputs,
  MicturitionInternalState,
  MicturitionPhase,
  MicturitionSnapshot,
} from './types';

export function createInitialState(): MicturitionInternalState {
  return {
    simTimeSeconds: 0,
    bladderVolumeML: 50,
    detrusorTone: 0,
    externalSphincterTone: 0.8,
    afferentFiringRate: 0,
  };
}

function afferentFiringRate(volumeML: number): number {
  if (volumeML < BLADDER.FIRST_DESIRE_ML) return 0;
  const range = BLADDER.MICTURITION_THRESHOLD_ML - BLADDER.FIRST_DESIRE_ML;
  const normalised = (volumeML - BLADDER.FIRST_DESIRE_ML) / range;
  return clamp(normalised * BLADDER.AFFERENT_SENSITIVITY * range, 0, BLADDER.AFFERENT_MAX);
}

function intravesicalPressureCmH2O(volumeML: number, detrusorTone: number): number {
  const passive =
    BLADDER.PASSIVE_TENSION_CMH2O * (volumeML / BLADDER.MAX_CAPACITY_ML) ** 2;
  const active = BLADDER.DETRUSOR_PRESSURE_CMH2O * detrusorTone;
  return passive + active;
}

/** Sphincter closing pressure: cmH₂O the sphincter can contain at a given tone level. */
function sphincterClosingPressureCmH2O(sphincterTone: number): number {
  return BLADDER.SPHINCTER_MAX_CLOSING_PRESSURE * sphincterTone;
}

/**
 * Voiding flow rate: only occurs when intravesical pressure exceeds sphincter closing
 * pressure. Flow increases with the pressure gradient, modelling turbulent flow through
 * the urethra.
 */
function voidingFlowMLperMin(
  volumeML: number,
  detrusorTone: number,
  sphincterTone: number,
): number {
  const ivp = intravesicalPressureCmH2O(volumeML, detrusorTone);
  const closing = sphincterClosingPressureCmH2O(sphincterTone);
  const gradient = Math.max(0, ivp - closing);
  if (gradient <= 0) return 0;
  return BLADDER.FLOW_COEFFICIENT * gradient * Math.sqrt(gradient);
}

function classifyPhase(
  volumeML: number,
  detrusorTone: number,
  afferentFiring: number,
  netFlow: number,
): MicturitionPhase {
  if (volumeML >= BLADDER.MAX_CAPACITY_ML - 10) return 'overflow';
  if (netFlow < -10 && detrusorTone > 0.3) return 'voiding';
  if (afferentFiring > 0.7 && detrusorTone > 0.5) return 'micturition';
  if (volumeML >= BLADDER.STRONG_DESIRE_ML) return 'strong desire';
  if (volumeML >= BLADDER.FIRST_DESIRE_ML) return 'first desire';
  return 'filling';
}

function sensationText(phase: MicturitionPhase, volumeML: number): string {
  switch (phase) {
    case 'filling':
      return volumeML < 100
        ? 'bladder quiet — low-volume surveillance only'
        : 'early fullness as stretch receptors begin to whisper';
    case 'first desire':
      return 'first urge — a conscious awareness that the bladder is not empty';
    case 'strong desire':
      return 'strong desire to void — the reflex is primed, squeeze to hold';
    case 'micturition':
      return 'micturition reflex firing — detrusor contracting, sphincters must relax';
    case 'voiding':
      return 'voluntary voiding — detrusor contraction overwhelming the sphincters';
    case 'overflow':
      return 'overflow — the detrusor cannot generate enough pressure to empty';
  }
}

export function computeDerived(
  state: MicturitionInternalState,
  inputs: MicturitionInputs,
): MicturitionDerived {
  const sympathetic = clamp(inputs.sympatheticPct / 100, 0, 1);
  const parasympathetic = clamp(inputs.parasympatheticPct / 100, 0, 1);
  const externalSphincter = clamp(inputs.voluntarySphincterPct / 100, 0, 1);

  const volumeML = state.bladderVolumeML;
  const pressure = intravesicalPressureCmH2O(volumeML, state.detrusorTone);

  const fillingRate = inputs.urineProductionMLperMin;
  const emptyingRate = voidingFlowMLperMin(volumeML, state.detrusorTone, externalSphincter);
  const netFlow = fillingRate - emptyingRate;

  const phase = classifyPhase(volumeML, state.detrusorTone, state.afferentFiringRate, netFlow);
  const sensation = sensationText(phase, volumeML);

  return {
    intravesicalPressureCmH2O: pressure,
    afferentFiringRate: state.afferentFiringRate,
    parasympatheticActivity: parasympathetic,
    sympatheticActivity: sympathetic,
    externalSphincterTone: state.externalSphincterTone,
    detrusorTone: state.detrusorTone,
    bladderVolumeML: volumeML,
    phase,
    sensation,
    netFlowRateMLperMin: netFlow,
  };
}

export function tick(
  state: MicturitionInternalState,
  inputs: MicturitionInputs,
  dtSeconds: number,
): MicturitionInternalState {
  const dtMinutes = dtSeconds / 60;

  // 1. Afferent firing rate from current volume.
  const newAfferent = afferentFiringRate(state.bladderVolumeML);

  // 2. Parasympathetic target from afferent firing (the reflex arc).
  const parasympatheticDrive = clamp(inputs.parasympatheticPct / 100, 0, 1);
  const reflexParasympathetic = inputs.cortexInhibitsMicturition
    ? parasympatheticDrive * 0.3
    : clamp(newAfferent * 1.2, 0, 1);
  const effectiveParasympathetic = Math.max(parasympatheticDrive, reflexParasympathetic);

  // 3. Detrusor tone: parasympathetic contracts, sympathetic relaxes.
  const sympatheticDrive = clamp(inputs.sympatheticPct / 100, 0, 1);
  const detrusorTarget = clamp(effectiveParasympathetic - sympatheticDrive * 0.7, 0, 1);
  const newDetrusorTone =
    state.detrusorTone +
    (detrusorTarget - state.detrusorTone) *
      (1 - Math.exp(-dtSeconds / BLADDER.DETRUSOR_TAU_SECONDS));

  // 4. External sphincter tone follows voluntary input.
  const sphincterTarget = clamp(inputs.voluntarySphincterPct / 100, 0, 1);
  const newSphincterTone =
    state.externalSphincterTone +
    (sphincterTarget - state.externalSphincterTone) *
      (1 - Math.exp(-dtSeconds / BLADDER.SPHINCTER_TAU_SECONDS));

  // 5. Volume: ureteric inflow minus pressure-driven voiding.
  const fillingRate = inputs.urineProductionMLperMin;
  const emptyingRate = voidingFlowMLperMin(state.bladderVolumeML, newDetrusorTone, newSphincterTone);
  const netFlowMLPerMin = fillingRate - emptyingRate;
  const newVolume = clamp(
    state.bladderVolumeML + netFlowMLPerMin * dtMinutes,
    0,
    BLADDER.MAX_CAPACITY_ML,
  );

  return {
    simTimeSeconds: state.simTimeSeconds + dtSeconds,
    bladderVolumeML: newVolume,
    detrusorTone: newDetrusorTone,
    externalSphincterTone: newSphincterTone,
    afferentFiringRate: newAfferent,
  };
}

export function step(
  state: MicturitionInternalState,
  inputs: MicturitionInputs,
  dtSeconds: number,
): MicturitionSnapshot {
  const derived = computeDerived(state, inputs);
  return { state: tick(state, inputs, dtSeconds), derived };
}

export function toHistoryPoint(snapshot: MicturitionSnapshot): MicturitionHistoryPoint {
  return {
    t: snapshot.state.simTimeSeconds,
    bladderVolumeML: snapshot.derived.bladderVolumeML,
    intravesicalPressureCmH2O: snapshot.derived.intravesicalPressureCmH2O,
    detrusorTone: snapshot.derived.detrusorTone,
    afferentFiringRate: snapshot.derived.afferentFiringRate,
  };
}

export { SIMULATION };

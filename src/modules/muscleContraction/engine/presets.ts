import type { MuscleInputs } from './types';

export const DEFAULT_MUSCLE_INPUTS: MuscleInputs = {
  stimulationFrequencyHz: 0,
  motorUnitRecruitment: 1,
  restingSarcomereLengthUm: 2.1,
  // Above any tension the muscle can develop, so the default contraction is isometric — the
  // classic twitch recording, where length is held and only tension is measured.
  afterload: 1.5,
  atpAvailability: 1,
  extracellularCalcium: 1,
  ryrLeak: 0,
  sercaActivity: 1,
  muscleType: 'skeletal',
};

export type MusclePresetName =
  | 'singleTwitch'
  | 'unfusedTetanus'
  | 'fusedTetanus'
  | 'isotonicLift'
  | 'rigorMortis'
  | 'malignantHyperthermia'
  | 'cardiacMuscle'
  | 'smoothLatch'
  | 'overstretched';

export const MUSCLE_PRESETS: Record<MusclePresetName, Partial<MuscleInputs>> = {
  // Quiescent until stimulated — press "Stimulate" to fire one action potential and watch the
  // calcium transient rise and fall before the tension it causes has even peaked.
  singleTwitch: { ...DEFAULT_MUSCLE_INPUTS },
  // Stimuli arrive before the previous twitch has relaxed, so tension summates — but slowly
  // enough that the individual twitches are still visible as ripples on the plateau.
  unfusedTetanus: { ...DEFAULT_MUSCLE_INPUTS, stimulationFrequencyHz: 15 },
  // Fast enough that calcium never falls back to rest: a smooth plateau at roughly four times
  // twitch tension. Force is graded by frequency, even though each action potential is identical.
  fusedTetanus: { ...DEFAULT_MUSCLE_INPUTS, stimulationFrequencyHz: 50 },
  // A load light enough to lift: the muscle contracts isometrically until tension reaches the
  // load, then shortens at the velocity its force-velocity curve allows.
  isotonicLift: { ...DEFAULT_MUSCLE_INPUTS, stimulationFrequencyHz: 40, afterload: 0.35 },
  // No ATP. SERCA stops, so the standing SR leak wins and calcium climbs; the cross-bridges
  // attach and then cannot detach, because detachment is the step that needs ATP.
  rigorMortis: { ...DEFAULT_MUSCLE_INPUTS, atpAvailability: 0 },
  // A leaky ryanodine receptor. Calcium pours out faster than SERCA can return it, producing
  // sustained contracture and a futile ATP-burning cycle that raises core temperature.
  malignantHyperthermia: { ...DEFAULT_MUSCLE_INPUTS, ryrLeak: 0.85, stimulationFrequencyHz: 0 },
  // The same 50 Hz that fuses skeletal muscle does nothing here: the cardiac refractory period
  // outlasts the cardiac twitch, so a second contraction can never start before the first ends.
  cardiacMuscle: { ...DEFAULT_MUSCLE_INPUTS, muscleType: 'cardiac', stimulationFrequencyHz: 50 },
  // Slow activation, slow relaxation, and latch bridges that hold tension long after calcium
  // has fallen — how a sphincter or arteriole maintains tone for hours on almost no ATP.
  smoothLatch: { ...DEFAULT_MUSCLE_INPUTS, muscleType: 'smooth', stimulationFrequencyHz: 8 },
  // Pulled out onto the descending limb: filament overlap is falling, so active tension drops
  // even at full activation, while passive tension from titin climbs steeply.
  overstretched: { ...DEFAULT_MUSCLE_INPUTS, restingSarcomereLengthUm: 3.2, stimulationFrequencyHz: 50 },
};

export const MUSCLE_PRESET_LABELS: Record<MusclePresetName, string> = {
  singleTwitch: 'Single twitch',
  unfusedTetanus: 'Unfused tetanus',
  fusedTetanus: 'Fused tetanus',
  isotonicLift: 'Isotonic lift',
  rigorMortis: 'Rigor mortis',
  malignantHyperthermia: 'Malignant hyperthermia',
  cardiacMuscle: 'Cardiac muscle',
  smoothLatch: 'Smooth muscle latch',
  overstretched: 'Overstretched',
};

export const MUSCLE_PRESET_ORDER: MusclePresetName[] = [
  'singleTwitch',
  'unfusedTetanus',
  'fusedTetanus',
  'isotonicLift',
  'overstretched',
  'rigorMortis',
  'malignantHyperthermia',
  'cardiacMuscle',
  'smoothLatch',
];

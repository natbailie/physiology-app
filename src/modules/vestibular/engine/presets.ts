import type { VestibularInputs } from './types';

export const DEFAULT_VESTIBULAR_INPUTS: VestibularInputs = {
  headTurnVelocityDegPerSec: 0,
  rightCanalFunction: 1,
  leftCanalFunction: 1,
  centralCompensation: 0,
  otolithFunction: 1,
  canalithDebris: 0,
  irritativeDriveLeft: 0,
};

export type VestibularPresetName =
  | 'normal'
  | 'acuteNeuritis'
  | 'compensatedNeuritis'
  | 'bilateralLoss'
  | 'bppvPosterior'
  | 'meniereIrritative';

/**
 * The presets separate the questions boards actually ask: WHERE the lesion is (unilateral vs
 * bilateral), HOW OLD it is (compensated or not), and whether the problem is mechanical
 * (BPPV) or metabolic (firing imbalance). Vertigo, nystagmus direction, VOR gain, oscillopsia
 * and Romberg each pull a different way.
 */
export const VESTIBULAR_PRESETS: Record<VestibularPresetName, Partial<VestibularInputs>> = {
  normal: { ...DEFAULT_VESTIBULAR_INPUTS },
  // A fresh right vestibular neuritis: one nerve silent, nothing compensated yet.
  acuteNeuritis: { ...DEFAULT_VESTIBULAR_INPUTS, rightCanalFunction: 0.08 },
  // The same dead nerve weeks later: quiet at rest, but the mechanics never returned.
  compensatedNeuritis: { ...DEFAULT_VESTIBULAR_INPUTS, rightCanalFunction: 0.08, centralCompensation: 0.92 },
  // Aminoglycoside toxicity: both sides gone together — silence without vertigo.
  bilateralLoss: { ...DEFAULT_VESTIBULAR_INPUTS, rightCanalFunction: 0.12, leftCanalFunction: 0.12, otolithFunction: 0.15 },
  // Free-floating canalith debris in the posterior canal, mechanically normal elsewhere.
  bppvPosterior: { ...DEFAULT_VESTIBULAR_INPUTS, canalithDebris: 1 },
  // Early Ménière-type irritation: firing ABOVE rest beats nystagmus toward the ear.
  meniereIrritative: { ...DEFAULT_VESTIBULAR_INPUTS, irritativeDriveLeft: 0.7 },
};

export const VESTIBULAR_PRESET_LABELS: Record<VestibularPresetName, string> = {
  normal: 'Normal',
  acuteNeuritis: 'Acute vestibular neuritis',
  compensatedNeuritis: 'Compensated neuritis',
  bilateralLoss: 'Bilateral loss (aminoglycoside)',
  bppvPosterior: 'BPPV, posterior canal',
  meniereIrritative: "Irritative Ménière's",
};

export const VESTIBULAR_PRESET_ORDER: VestibularPresetName[] = [
  'normal',
  'acuteNeuritis',
  'compensatedNeuritis',
  'bilateralLoss',
  'bppvPosterior',
  'meniereIrritative',
];

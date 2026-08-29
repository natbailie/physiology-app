import type { MotorInputs } from './types';

export const DEFAULT_MOTOR_INPUTS: MotorInputs = {
  movementCommandAmplitude: 55,
  dopamineFraction: 100,
  striatalOutputLoss: 0,
  subthalamicLesion: 0,
  cerebellarCalibration: 100,
  corticospinalIntegrity: 100,
  essentialTremorDrive: 0,
  tremorSuppressantEffect: 0,
  dystoniaSeverityPct: 0,
};

export type MotorPresetName =
  | 'normal'
  | 'earlyParkinson'
  | 'advancedParkinson'
  | 'huntingtonChorea'
  | 'hemiballismus'
  | 'cerebellarAtaxia'
  | 'strokeUmnHemiparesis'
  | 'essentialTremor'
  | 'focalDystonia';

/**
 * Each preset isolates one element of the motor system's circuit diagram. The discriminating
 * readouts are the ones examiners test at the bedside: HOW SLOWLY movement starts (dopamine),
 * WHAT HAPPENS DURING it (cerebellum), what happens with no command at all (resting tremor),
 * and whether involuntary movement invades a system that can still start normally.
 */
export const MOTOR_PRESETS: Record<MotorPresetName, Partial<MotorInputs>> = {
  normal: { ...DEFAULT_MOTOR_INPUTS },
  // The patient sits still in clinic: low-amplitude command, so the resting tremor shows.
  earlyParkinson: { ...DEFAULT_MOTOR_INPUTS, dopamineFraction: 45, movementCommandAmplitude: 40 },
  advancedParkinson: { ...DEFAULT_MOTOR_INPUTS, dopamineFraction: 12, movementCommandAmplitude: 40 },
  huntingtonChorea: { ...DEFAULT_MOTOR_INPUTS, striatalOutputLoss: 80 },
  hemiballismus: { ...DEFAULT_MOTOR_INPUTS, subthalamicLesion: 85 },
  cerebellarAtaxia: { ...DEFAULT_MOTOR_INPUTS, cerebellarCalibration: 18 },
  strokeUmnHemiparesis: { ...DEFAULT_MOTOR_INPUTS, corticospinalIntegrity: 22 },
  essentialTremor: { ...DEFAULT_MOTOR_INPUTS, essentialTremorDrive: 70 },
  focalDystonia: { ...DEFAULT_MOTOR_INPUTS, dystoniaSeverityPct: 65 },
};

export const MOTOR_PRESET_LABELS: Record<MotorPresetName, string> = {
  normal: 'Normal',
  earlyParkinson: 'Early Parkinson',
  advancedParkinson: 'Advanced Parkinson',
  huntingtonChorea: 'Huntington-type chorea',
  hemiballismus: 'Hemiballismus (STN)',
  cerebellarAtaxia: 'Cerebellar ataxia',
  strokeUmnHemiparesis: 'UMN hemiparesis',
  essentialTremor: 'Essential tremor',
  focalDystonia: 'Focal dystonia',
};

export const MOTOR_PRESET_ORDER: MotorPresetName[] = [
  'normal',
  'earlyParkinson',
  'advancedParkinson',
  'huntingtonChorea',
  'hemiballismus',
  'cerebellarAtaxia',
  'strokeUmnHemiparesis',
  'essentialTremor',
  'focalDystonia',
];

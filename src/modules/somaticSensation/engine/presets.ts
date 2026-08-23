import type { SomaticInputs } from './types';

export const DEFAULT_SOMATIC_INPUTS: SomaticInputs = {
  touchStimulusDrive: 0,
  nociceptiveStimulusDrive: 0,
  rubbingGateDrive: 0,
  descendingModulation: 25,
  localAnaestheticBlock: 0,
  peripheralSensitisation: 0,
  windUpGain: 0,
  leftHemisectionSeverity: 0,
  rightHemisectionSeverity: 0,
  anteriorQuadrantSeverity: 0,
  centralCanalSeverity: 0,
};

export type SomaticPresetName =
  | 'normal'
  | 'acuteBurn'
  | 'neuropathicAllodynia'
  | 'brownSequardLeft'
  | 'anteriorCord'
  | 'syringomyelia'
  | 'completeTransection'
  | 'laBlock';

/**
 * The presets split into two families: the gate and its sensitisation (functional states of
 * an intact cord) and the tract lesions (structural dissociations). Each produces modality
 * losses in a pattern that is itself the diagnosis.
 */
export const SOMATIC_PRESETS: Record<SomaticPresetName, Partial<SomaticInputs>> = {
  normal: { ...DEFAULT_SOMATIC_INPUTS },
  // A fresh scald: nociceptors firing, inflammation sensitising the periphery.
  acuteBurn: { ...DEFAULT_SOMATIC_INPUTS, nociceptiveStimulusDrive: 75, peripheralSensitisation: 45 },
  // A sensitised system with little active injury: light touch hurts, wind-up amplifies.
  neuropathicAllodynia: {
    ...DEFAULT_SOMATIC_INPUTS,
    touchStimulusDrive: 20,
    nociceptiveStimulusDrive: 15,
    peripheralSensitisation: 75,
    windUpGain: 80,
  },
  brownSequardLeft: { ...DEFAULT_SOMATIC_INPUTS, leftHemisectionSeverity: 85 },
  anteriorCord: { ...DEFAULT_SOMATIC_INPUTS, anteriorQuadrantSeverity: 90 },
  syringomyelia: { ...DEFAULT_SOMATIC_INPUTS, centralCanalSeverity: 85 },
  completeTransection: {
    ...DEFAULT_SOMATIC_INPUTS,
    leftHemisectionSeverity: 95,
    rightHemisectionSeverity: 95,
  },
  laBlock: { ...DEFAULT_SOMATIC_INPUTS, localAnaestheticBlock: 80, nociceptiveStimulusDrive: 70, touchStimulusDrive: 55 },
};

export const SOMATIC_PRESET_LABELS: Record<SomaticPresetName, string> = {
  normal: 'Normal',
  acuteBurn: 'Acute burn (nociceptive)',
  neuropathicAllodynia: 'Neuropathic allodynia',
  brownSequardLeft: "Brown-Séquard (left)",
  anteriorCord: 'Anterior cord syndrome',
  syringomyelia: 'Syringomyelia',
  completeTransection: 'Complete transection',
  laBlock: 'Local anaesthetic block',
};

export const SOMATIC_PRESET_ORDER: SomaticPresetName[] = [
  'normal',
  'acuteBurn',
  'neuropathicAllodynia',
  'brownSequardLeft',
  'anteriorCord',
  'syringomyelia',
  'completeTransection',
  'laBlock',
];

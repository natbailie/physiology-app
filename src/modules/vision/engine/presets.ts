import type { VisionInputs } from './types';

export const DEFAULT_VISION_INPUTS: VisionInputs = {
  sceneLuminanceLogCd: 2,
  rodIntegrity: 1,
  coneIntegrity: 1,
  leftOpticNerveAfferent: 1,
  rightPupilEfferentGain: 1,
};

export type VisionPresetName =
  | 'normalDaylight'
  | 'dimRestaurant'
  | 'starlight'
  | 'retinitisPigmentosa'
  | 'macularDegeneration'
  | 'opticNeuritisLeft'
  | 'fixedDilatedRight';

/**
 * Each preset produces a distinct combination of acuity, pupil behaviour and lighting regime.
 * The two retinal degenerations deliberately share a dark scene so their readouts separate
 * cleanly: rods fail at night, cones fail in daylight, and neither touches the pupils.
 */
export const VISION_PRESETS: Record<VisionPresetName, Partial<VisionInputs>> = {
  normalDaylight: { ...DEFAULT_VISION_INPUTS },
  dimRestaurant: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: 0 },
  // Starlight with healthy rods: poor acuity (the fovea is blind down here) but usable vision.
  starlight: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: -4.5 },
  retinitisPigmentosa: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: -4.5, rodIntegrity: 0.12 },
  macularDegeneration: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: 2, coneIntegrity: 0.15 },
  opticNeuritisLeft: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: 2, leftOpticNerveAfferent: 0.22 },
  fixedDilatedRight: { ...DEFAULT_VISION_INPUTS, sceneLuminanceLogCd: 2, rightPupilEfferentGain: 0.04 },
};

export const VISION_PRESET_LABELS: Record<VisionPresetName, string> = {
  normalDaylight: 'Normal daylight',
  dimRestaurant: 'Dim restaurant',
  starlight: 'Starlight',
  retinitisPigmentosa: 'Retinitis pigmentosa',
  macularDegeneration: 'Macular degeneration',
  opticNeuritisLeft: 'Optic neuritis (left)',
  fixedDilatedRight: 'Fixed dilated right pupil',
};

export const VISION_PRESET_ORDER: VisionPresetName[] = [
  'normalDaylight',
  'dimRestaurant',
  'starlight',
  'retinitisPigmentosa',
  'macularDegeneration',
  'opticNeuritisLeft',
  'fixedDilatedRight',
];

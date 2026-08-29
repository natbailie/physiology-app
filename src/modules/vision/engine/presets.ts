import type { VisionInputs } from './types';

export const DEFAULT_VISION_INPUTS: VisionInputs = {
  sceneLuminanceLogCd: 2,
  rodIntegrity: 1,
  coneIntegrity: 1,
  leftOpticNerveAfferent: 1,
  rightPupilEfferentGain: 1,
  targetDistanceMetres: 6,
  maximumAccommodationD: 8,
  aqueousProductionRate: 1,
  trabecularOutflowFacility: 1,
  angleWidthPct: 80,
  pilocarpineDosePct: 0,
  acetazolamideDosePct: 0,
  mydriaticDosePct: 0,
  fieldLesionSite: 'none',
};

export type VisionPresetName =
  | 'normalDaylight'
  | 'dimRestaurant'
  | 'starlight'
  | 'retinitisPigmentosa'
  | 'macularDegeneration'
  | 'opticNeuritisLeft'
  | 'fixedDilatedRight'
  | 'presbyopia'
  | 'openAngleGlaucoma'
  | 'acuteAngleClosure'
  | 'treatedGlaucoma'
  | 'chiasmalCompression'
  | 'meyersLoopLeft'
  | 'occipitalInfarctRight';

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
  // A seventy-year-old lens holds barely a fifth of a young amplitude.
  presbyopia: { ...DEFAULT_VISION_INPUTS, targetDistanceMetres: 0.4, maximumAccommodationD: 1.5 },
  // The meshwork silently resists; production is unchanged and nothing hurts.
  openAngleGlaucoma: { ...DEFAULT_VISION_INPUTS, trabecularOutflowFacility: 0.32 },
  // A shallow angle plus a dilating drop: the iris piles into what recess remains.
  acuteAngleClosure: {
    ...DEFAULT_VISION_INPUTS,
    angleWidthPct: 12,
    mydriaticDosePct: 70,
    targetDistanceMetres: 6,
  },
  // Same eye, on treatment: the pump slowed and the meshwork held open by the drops.
  treatedGlaucoma: {
    ...DEFAULT_VISION_INPUTS,
    trabecularOutflowFacility: 0.32,
    pilocarpineDosePct: 60,
    acetazolamideDosePct: 55,
  },
  // A pituitary mass pressing on the crossing fibres of both nasal retinas.
  chiasmalCompression: { ...DEFAULT_VISION_INPUTS, fieldLesionSite: 'chiasmalCentre' },
  // A temporal-lobe lesion sweeping Meyer's loop aside.
  meyersLoopLeft: { ...DEFAULT_VISION_INPUTS, fieldLesionSite: 'leftTemporalRadiation' },
  // A posterior cerebral infarct: the field falls away but fixation survives.
  occipitalInfarctRight: { ...DEFAULT_VISION_INPUTS, fieldLesionSite: 'rightOccipitalLobe' },
};

export const VISION_PRESET_LABELS: Record<VisionPresetName, string> = {
  normalDaylight: 'Normal daylight',
  dimRestaurant: 'Dim restaurant',
  starlight: 'Starlight',
  retinitisPigmentosa: 'Retinitis pigmentosa',
  macularDegeneration: 'Macular degeneration',
  opticNeuritisLeft: 'Optic neuritis (left)',
  fixedDilatedRight: 'Fixed dilated right pupil',
  presbyopia: 'Presbyopia',
  openAngleGlaucoma: 'Open-angle glaucoma',
  acuteAngleClosure: 'Acute angle closure',
  treatedGlaucoma: 'Treated glaucoma',
  chiasmalCompression: 'Chiasmal compression',
  meyersLoopLeft: "Meyer's loop (left)",
  occipitalInfarctRight: 'Occipital infarct (right)',
};

export const VISION_PRESET_ORDER: VisionPresetName[] = [
  'normalDaylight',
  'dimRestaurant',
  'starlight',
  'retinitisPigmentosa',
  'macularDegeneration',
  'opticNeuritisLeft',
  'fixedDilatedRight',
  'presbyopia',
  'openAngleGlaucoma',
  'acuteAngleClosure',
  'treatedGlaucoma',
  'chiasmalCompression',
  'meyersLoopLeft',
  'occipitalInfarctRight',
];

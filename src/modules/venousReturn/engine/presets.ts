import type { VenousReturnInputs } from './types';

export const DEFAULT_VENOUS_RETURN_INPUTS: VenousReturnInputs = {
  bloodVolumeMl: 5000,
  venousCompliance: 1,
  unstressedVolumeFraction: 0.86,
  contractility: 1,
  heartRate: 70,
  systemicVascularResistance: 1,
  venousResistance: 1,
  intrathoracicPressure: -4,
  arteriovenousShunt: 0,
};

export type VenousReturnPresetName =
  | 'normal'
  | 'haemorrhage'
  | 'volumeOverload'
  | 'heartFailure'
  | 'venoconstriction'
  | 'exercise'
  | 'avFistula'
  | 'positivePressureVentilation'
  | 'venodilation';

export const VENOUS_RETURN_PRESETS: Record<VenousReturnPresetName, Partial<VenousReturnInputs>> = {
  normal: { ...DEFAULT_VENOUS_RETURN_INPUTS },
  // Less blood means less STRESSED volume, so the filling pressure falls and the venous return
  // curve shifts left. Cardiac output falls with a completely normal heart.
  haemorrhage: { ...DEFAULT_VENOUS_RETURN_INPUTS, bloodVolumeMl: 3600 },
  // The opposite shift. Note how little the output rises: the operating point is climbing onto
  // the flat part of the cardiac function curve, where more filling buys almost nothing.
  volumeOverload: { ...DEFAULT_VENOUS_RETURN_INPUTS, bloodVolumeMl: 6600 },
  // A flatter, lower cardiac function curve. The crossing moves to a HIGHER right atrial
  // pressure and a LOWER output — the raised venous pressure and the low output are two
  // readings of the same intersection, not two separate problems.
  heartFailure: { ...DEFAULT_VENOUS_RETURN_INPUTS, contractility: 0.35 },
  // The key insight of the module. Sympathetic venoconstriction converts unstressed volume into
  // stressed volume: blood volume is unchanged, yet the filling pressure rises, the venous
  // return curve shifts right, and cardiac output goes up. Nothing was added.
  venoconstriction: { ...DEFAULT_VENOUS_RETURN_INPUTS, unstressedVolumeFraction: 0.78, contractility: 1.4, heartRate: 110 },
  // Both curves move at once: venoconstriction and the muscle pump raise filling pressure while
  // sympathetic drive raises the cardiac curve, and dilated muscle beds drop resistance.
  exercise: {
    ...DEFAULT_VENOUS_RETURN_INPUTS,
    unstressedVolumeFraction: 0.76,
    contractility: 1.35,
    heartRate: 150,
    systemicVascularResistance: 0.55,
    venousResistance: 0.7,
    intrathoracicPressure: -6,
  },
  // A fistula bypasses the arterioles, collapsing the resistance to venous return. Output rises
  // steeply and the heart is doing nothing different — a high-output state with a normal heart.
  avFistula: { ...DEFAULT_VENOUS_RETURN_INPUTS, arteriovenousShunt: 0.55, systemicVascularResistance: 0.6 },
  // Positive pressure around the heart shifts the cardiac function curve to the right, so the
  // same right atrial pressure now distends the ventricle less. Output falls at constant volume.
  positivePressureVentilation: { ...DEFAULT_VENOUS_RETURN_INPUTS, intrathoracicPressure: 5 },
  // Venodilators — nitrates, anaesthetic induction, sepsis — increase venous compliance, so the
  // same blood volume generates a lower filling pressure. Preload falls without blood loss.
  venodilation: { ...DEFAULT_VENOUS_RETURN_INPUTS, venousCompliance: 1.45, systemicVascularResistance: 0.85 },
};

export const VENOUS_RETURN_PRESET_LABELS: Record<VenousReturnPresetName, string> = {
  normal: 'Normal',
  haemorrhage: 'Haemorrhage',
  volumeOverload: 'Volume overload',
  heartFailure: 'Heart failure',
  venoconstriction: 'Venoconstriction',
  exercise: 'Exercise',
  avFistula: 'AV fistula',
  positivePressureVentilation: 'Peep / IPPV',
  venodilation: 'Venodilation',
};

export const VENOUS_RETURN_PRESET_ORDER: VenousReturnPresetName[] = [
  'normal',
  'haemorrhage',
  'volumeOverload',
  'venoconstriction',
  'venodilation',
  'heartFailure',
  'exercise',
  'avFistula',
  'positivePressureVentilation',
];

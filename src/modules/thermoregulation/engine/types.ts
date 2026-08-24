export type ThermoState_Classification =
  | 'thermoneutral'
  | 'cold defence: shivering'
  | 'heat defence: sweating'
  | 'fever: set point elevated'
  | 'hyperthermia: heat load overwhelming'
  | 'heat stroke: sweating failing'
  | 'mild hypothermia'
  | 'moderate hypothermia: shivering fading';

export interface ThermoInputs {
  /** Ambient air temperature, C (-20 to 48). */
  ambientTemperatureC: number;
  /** Relative humidity, % (0-100) — the ceiling on evaporative cooling. */
  humidityPct: number;
  /** Metabolic heat production, multiple of basal rest (1 = resting, ~10 = hard exercise). */
  metabolicRateMultiplier: number;
  /** Pyrogen signal (infection, inflammation), 0-100. */
  pyrogenLevel: number;
  /** Wind and wet clothing, % (0-100) — multiplies dry heat loss. */
  windWetnessPct: number;
  /** Anticholinergic impairment of sweating, % (0-100). */
  sweatImpairmentPct: number;
}

export interface ThermoDerived {
  coreTempC: number;
  skinTempC: number;
  setPointC: number;
  /** Core minus set point: negative means the body is DEFENDING a higher temperature. */
  defenceErrorC: number;
  shiveringW: number;
  sweatW: number;
  skinFlowFactor: number;
  metabolicHeatW: number;
  dryLossW: number;
  netStorageW: number;
  feverRising: boolean;
  classification: ThermoState_Classification;
  patternSummary: string;
}

export interface ThermoInternalState {
  simTimeSeconds: number;
  coreTempC: number;
  skinTempC: number;
  setPointC: number;
  shiveringW: number;
  sweatW: number;
  skinFlowFactor: number;
  antipyreticEffectPct: number;
  coolingDeviceSecondsRemaining: number;
  rewarmingDeviceSecondsRemaining: number;
}

export interface ThermoSnapshot {
  state: ThermoInternalState;
  derived: ThermoDerived;
}

export interface ThermoHistoryPoint {
  t: number;
  core: number;
  setPoint: number;
  skin: number;
}

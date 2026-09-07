import { MV_INTERPRETATION } from './constants';
import type { FailureType, HypoxaemiaGrade, ViliRisk } from './types';

export function hypoxaemiaGrade(paO2MmHg: number): HypoxaemiaGrade {
  if (paO2MmHg < MV_INTERPRETATION.HYPOXAEMIA_SEVERE_MMHG) return 'severe';
  if (paO2MmHg < MV_INTERPRETATION.HYPOXAEMIA_BORDERLINE_MMHG) return 'borderline';
  return 'none';
}

export function failureType(
  paO2MmHg: number,
  paCO2MmHg: number,
): FailureType {
  const hypoxaemic = paO2MmHg < MV_INTERPRETATION.HYPOXAEMIA_SEVERE_MMHG;
  const hypercapnic = paCO2MmHg > MV_INTERPRETATION.HYPOCAPNIA_MMHG;
  if (hypoxaemic && hypercapnic) return 'mixed';
  if (hypoxaemic) return 'type 1';
  if (hypercapnic) return 'type 2';
  return 'none';
}

export function viliRisk(drivingCmH2O: number, plateauCmH2O: number): ViliRisk {
  if (drivingCmH2O > MV_INTERPRETATION.DRIVING_HIGH_CMH2O) return 'high';
  if (drivingCmH2O > MV_INTERPRETATION.DRIVING_ELEVATED_CMH2O) return 'elevated';
  if (plateauCmH2O > MV_INTERPRETATION.PLATEAU_ALARM_CMH2O) return 'elevated';
  return 'low';
}
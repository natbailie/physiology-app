import { defaultInputs } from './constants';
import type { MvInputs } from './types';

export const DEFAULT_MV_INPUTS: MvInputs = defaultInputs();

export type MvPresetName = 'normal' | 'ards' | 'copd' | 'osaHypoventilation' | 'neuromuscular';

/**
 * The scenario bar carries a PATIENT, not a ventilator setting: each preset plants the same
 * physiology every time — compliance, resistance, dead space, shunt, native effort, CO2 load,
 * renal compensation — plus the initial vent numbers a clinician would reach for. The learner
 * then tunes the rail against the patient, which is the point of the module. A patient preset
 * merged over the defaults like every other module, so the vent rail always starts at rest.
 */
export const MV_PRESETS: Record<MvPresetName, Partial<MvInputs>> = {
  normal: { ...DEFAULT_MV_INPUTS },
  // Stiff, heavily shunted lungs: a steep (19 cmH2O) driving pressure at the low-ish initial
  // PEEP, so P/F ~180 but hypoxia persists until this patient is recruited.
  ards: {
    mode: 'invasive',
    epapPeepCmH2O: 3,
    ipapPipCmH2O: 22,
    ventRatePerMin: 16,
    fiO2: 0.3,
    complianceMLPerCmH2O: 25,
    airwayResistanceCmH2OPerLPerSec: 2,
    deadSpaceFraction: 0.3,
    shuntFraction: 0.55,
    nativeDrive: 0.9,
    nativeRatePerMin: 0,
    nativeTidalVolumeML: 500,
    recruitability: 0.7,
    upperAirwayCollapse: 0,
    intrinsicPeepCmH2O: 0,
    co2ProductionMultiplier: 1.1,
    chronicKidneyCompensation: 0,
  },
  // Obstructed, trap. Long R×C time constant means the lung cannot empty and auto-PEEP stacks
  // on top of the dial — the NIV mask leaks ~15% of each supported breath and the controlled
  // oxygen sits at 0.28, the classic decompensated-before-the-vent presentation.
  copd: {
    mode: 'niv',
    epapPeepCmH2O: 4,
    ipapPipCmH2O: 8,
    ventRatePerMin: 18,
    fiO2: 0.28,
    complianceMLPerCmH2O: 90,
    airwayResistanceCmH2OPerLPerSec: 14,
    deadSpaceFraction: 0.45,
    shuntFraction: 0.1,
    nativeDrive: 0.5,
    nativeRatePerMin: 18,
    nativeTidalVolumeML: 500,
    recruitability: 0.2,
    upperAirwayCollapse: 0.3,
    intrinsicPeepCmH2O: 6,
    co2ProductionMultiplier: 1.1,
    chronicKidneyCompensation: 1,
  },
  // A floppy, collapsible airway: CPAP splints it open and recovers tidal volume. Under-dialled
  // (EPAP 4, at rest) the splint is weak and the patient is a type-2 failure; turn EPAP up past
  // 8 and the collapse disappears — the single most satisfying slider in the module.
  osaHypoventilation: {
    mode: 'cpap',
    epapPeepCmH2O: 4,
    ipapPipCmH2O: 8,
    ventRatePerMin: 14,
    fiO2: 0.21,
    complianceMLPerCmH2O: 90,
    airwayResistanceCmH2OPerLPerSec: 3,
    deadSpaceFraction: 0.3,
    shuntFraction: 0.05,
    nativeDrive: 0.5,
    nativeRatePerMin: 12,
    nativeTidalVolumeML: 500,
    recruitability: 0.2,
    upperAirwayCollapse: 0.8,
    intrinsicPeepCmH2O: 0,
    co2ProductionMultiplier: 1,
    chronicKidneyCompensation: 1,
  },
  // Weak muscles, normal lungs: the ventilator has to supply the work. Set conservatively the
  // way the textbook does, this patient is briskly OVER-ventilated and lands in respiratory
  // alkalosis — the argument for the low-normal volumes a 6 mL/kg strategy actually buys.
  neuromuscular: {
    mode: 'invasive',
    epapPeepCmH2O: 5,
    ipapPipCmH2O: 14,
    ventRatePerMin: 10,
    fiO2: 0.35,
    complianceMLPerCmH2O: 90,
    airwayResistanceCmH2OPerLPerSec: 3,
    deadSpaceFraction: 0.3,
    shuntFraction: 0.03,
    nativeDrive: 0.2,
    nativeRatePerMin: 6,
    nativeTidalVolumeML: 500,
    recruitability: 0.3,
    upperAirwayCollapse: 0,
    intrinsicPeepCmH2O: 0,
    co2ProductionMultiplier: 1,
    chronicKidneyCompensation: 0,
  },
};

export const MV_PRESET_LABELS: Record<MvPresetName, string> = {
  normal: 'Normal',
  ards: 'ARDS (stiff, shunted)',
  copd: 'COPD (obstructed, trapping)',
  osaHypoventilation: 'OSA hypoventilation',
  neuromuscular: 'Neuromuscular weakness',
};

export const PRESET_ORDER: MvPresetName[] = ['normal', 'ards', 'copd', 'osaHypoventilation', 'neuromuscular'];
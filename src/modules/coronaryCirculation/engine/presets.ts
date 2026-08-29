import type { CoronaryInputs } from './types';
import { COLLATERAL } from './constants';

export const DEFAULT_CORONARY_INPUTS: CoronaryInputs = {
  heartRateBpm: 72,
  aorticSystolicPressureMmHg: 122,
  aorticDiastolicPressureMmHg: 80,
  endDiastolicVolumeMl: 120,
  contractilityFraction: 1,
  stenosisPercentDiameter: 0,
  coronaryTonePercent: 0,
  collateralFraction: COLLATERAL.BASELINE_FRACTION,
  haemoglobinGPerDl: 15,
  arterialOxygenSaturationPct: 98,
  nitrateDosePercent: 0,
  betaBlockerDosePercent: 0,
};

export type CoronaryPresetName =
  | 'normal'
  | 'stableAngina'
  | 'criticalStenosis'
  | 'vasospastic'
  | 'tachycardicDanger'
  | 'anaemiaHeartDisease'
  | 'supplyStarved'
  | 'hypertrophied'
  | 'collateralisedOcclusion';

/**
 * Each preset is a patient the learner will recognise. The fixed lesions set how much reserve
 * exists; what happens next belongs to events (exertion, spasm) and to the levers that move
 * supply and demand against each other.
 */
export const CORONARY_PRESETS: Record<CoronaryPresetName, Partial<CoronaryInputs>> = {
  normal: { ...DEFAULT_CORONARY_INPUTS },
  // A significant but not critical lesion: quiet at rest, angina on the stairs.
  stableAngina: { ...DEFAULT_CORONARY_INPUTS, stenosisPercentDiameter: 75 },
  // Beyond critical severity: reserve gone at rest, flow itself beginning to fall.
  criticalStenosis: { ...DEFAULT_CORONARY_INPUTS, stenosisPercentDiameter: 88 },
  // Minimal fixed plaque with a constrictor tendency — the spasm button does the damage.
  vasospastic: { ...DEFAULT_CORONARY_INPUTS, stenosisPercentDiameter: 15, coronaryTonePercent: 20 },
  // The dangerous combination: demand climbing while the perfusion window closes.
  tachycardicDanger: {
    ...DEFAULT_CORONARY_INPUTS,
    stenosisPercentDiameter: 70,
    heartRateBpm: 150,
    aorticDiastolicPressureMmHg: 62,
  },
  // Flow-limiting disease plus thin blood: the supply side fails without any new narrowing.
  anaemiaHeartDisease: {
    ...DEFAULT_CORONARY_INPUTS,
    stenosisPercentDiameter: 70,
    haemoglobinGPerDl: 7.5,
    heartRateBpm: 96,
  },
  // A low diastolic head starves the myocardium even though nothing is occluded further.
  supplyStarved: { ...DEFAULT_CORONARY_INPUTS, aorticDiastolicPressureMmHg: 42, heartRateBpm: 110 },
  // High wall stress from pressure load: demand is high before any exertion begins.
  hypertrophied: {
    ...DEFAULT_CORONARY_INPUTS,
    aorticSystolicPressureMmHg: 190,
    endDiastolicVolumeMl: 165,
    stenosisPercentDiameter: 55,
  },
  // A chronically occluded vessel kept alive by collaterals grown over months.
  collateralisedOcclusion: {
    ...DEFAULT_CORONARY_INPUTS,
    stenosisPercentDiameter: 97,
    collateralFraction: 0.9,
    heartRateBpm: 78,
  },
};

export const CORONARY_PRESET_LABELS: Record<CoronaryPresetName, string> = {
  normal: 'Normal',
  stableAngina: 'Stable angina',
  criticalStenosis: 'Critical stenosis',
  vasospastic: 'Vasospastic',
  tachycardicDanger: 'Tachycardic + stenosed',
  anaemiaHeartDisease: 'Anaemia + CAD',
  supplyStarved: 'Low diastolic head',
  hypertrophied: 'Hypertrophied',
  collateralisedOcclusion: 'Collateralised occlusion',
};

export const CORONARY_PRESET_ORDER: CoronaryPresetName[] = [
  'normal',
  'stableAngina',
  'criticalStenosis',
  'vasospastic',
  'tachycardicDanger',
  'anaemiaHeartDisease',
  'supplyStarved',
  'hypertrophied',
  'collateralisedOcclusion',
];

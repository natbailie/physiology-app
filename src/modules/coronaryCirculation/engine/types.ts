export type CoronaryState_Classification =
  | 'balanced'
  | 'subendocardial ischaemia'
  | 'transmural injury'
  | 'established infarct';

export interface CoronaryInputs {
  /** Heart rate, bpm (40-180). Drives demand up and the diastolic perfusion window down. */
  heartRateBpm: number;
  /** Aortic systolic pressure, mmHg (70-210). The demand side of the rate-pressure product. */
  aorticSystolicPressureMmHg: number;
  /** Aortic diastolic pressure, mmHg (30-130). The head that perfuses the left ventricle. */
  aorticDiastolicPressureMmHg: number;
  /** Left-ventricular end-diastolic volume, mL (50-280). Sets wall stress by Laplace and the
   * intramyocardial closing pressure the coronary vessels must work against. */
  endDiastolicVolumeMl: number;
  /** Contractility, multiple of normal (0-2). Raises oxygen demand; falls when ischaemic. */
  contractilityFraction: number;
  /** Epicardial stenosis, percent diameter narrowing (0-98). */
  stenosisPercentDiameter: number;
  /** Diffuse constrictor tone added to the epicardial segment, percent (0-100). Models
   * alpha-mediated vasoconstriction and endothelial dysfunction. */
  coronaryTonePercent: number;
  /** Collateral supply to the distal vessel, fraction of full capacity (0-1). Grows over weeks
   * to months in chronic disease; near-absent acutely. */
  collateralFraction: number;
  /** Haemoglobin, g/dL (4-18). The other half of oxygen delivery: flow without carriage
   * delivers nothing. */
  haemoglobinGPerDl: number;
  /** Arterial oxygen saturation, percent (70-100). */
  arterialOxygenSaturationPct: number;
  /** Nitrate dose, percent of a standard effect range (0-100). Venodilates (less preload),
   * relieves tone and spasm on the epicardial segment — and drops the diastolic head. */
  nitrateDosePercent: number;
  /** Beta-blocker dose, percent of a standard effect range (0-100). Slows the rate and
   * blunts contractility: less demand, longer diastole. */
  betaBlockerDosePercent: number;
}

export interface CoronaryInternalState {
  simTimeSeconds: number;
  /** Smoothed fractional shortfall of oxygen supply against demand (0-1). Lags the gap by a few
   * seconds, as metabolic signalling does. */
  ischaemiaLevel: number;
  /** Sympathetic drive from an exertional event (0-1), decaying over minutes. Raises both the
   * rate and the metabolic demand above what the sliders set. */
  exertionDrive: number;
  /** A focal vasospastic event superimposed on the epicardial segment (0-1), decaying. */
  spasmBurst: number;
  /** Fraction of the jeopardised territory already infarcted (0-1). Accumulates while
   * transmural injury persists; heals only glacially. */
  necrosisLoad: number;
}

export interface CoronaryDerived {
  // Effective inputs after the drug layer.
  effectiveHeartRateBpm: number;
  effectiveSystolicPressureMmHg: number;
  effectiveDiastolicPressureMmHg: number;
  effectiveEndDiastolicVolumeMl: number;
  effectiveContractilityFraction: number;

  // Demand side.
  systolicDurationSeconds: number;
  diastolicTimeFraction: number;
  ratePressureProduct: number;
  wallStressIndex: number;
  demandIndex: number;
  /** Oxygen demand expressed as "normal resting flow" units — 1.0 is the resting heart. */
  requiredFlow: number;

  // Supply side.
  leftVentricularEndDiastolicPressureMmHg: number;
  closingPressureMmHg: number;
  drivingPressureMmHg: number;
  effectiveDrivingPressureMmHg: number;
  oxygenCarriageRatio: number;
  /** Largest flow the circulation could deliver right now, in the same units as requiredFlow:
   * driving pressure × maximal conductance, throttled by the lesion, plus collaterals,
   * multiplied by oxygen carriage. */
  maximalFlowCapacity: number;
  /** Maximal capacity divided by what rest would need if demand were normal — the classic
   * coronary flow reserve. Below about 2 is where exertion starts to hurt. */
  flowReserveRatio: number;

  // Balance and consequence.
  supplyGap: number;
  ischaemiaLevel: number;
  functionalContractility: number;
  transmuralInjuryActive: boolean;
  anginaActive: boolean;
  necrosisLoadPct: number;
  classification: CoronaryState_Classification;
  patternSummary: string;

  // Passthroughs so tick() stays a pure (state, derived, dt) function.
  stenosisEffectiveFraction: number;
  collateralFraction: number;
  nitrateDosePercent: number;
  betaBlockerDosePercent: number;
  haemoglobinGPerDl: number;
  arterialOxygenSaturationPct: number;
}

export interface CoronarySnapshot {
  state: CoronaryInternalState;
  derived: CoronaryDerived;
}

export interface CoronaryHistoryPoint {
  t: number;
  requiredFlow: number;
  maximalFlowCapacity: number;
  ischaemiaLevel: number;
  diastolicTimeFraction: number;
}

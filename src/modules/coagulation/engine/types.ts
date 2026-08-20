export interface CoagInputs {
  /** Factor VIII activity, % of normal (0-150) — deficient in hemophilia A */
  factorVIIIActivity: number;
  /** Factor IX activity, % of normal (0-150) — deficient in hemophilia B */
  factorIXActivity: number;
  /** Activity of the vitamin K-dependent factors II, VII, IX and X, % (0-150) — reduced by
   * warfarin, vitamin K deficiency and liver disease */
  vitaminKDependentFactors: number;
  /** von Willebrand factor, % (0-150) — carries factor VIII and mediates platelet adhesion,
   * so a deficiency causes both a platelet-type and a mild factor-type defect */
  vonWillebrandFactor: number;
  /** Platelet count, ×10⁹/L (0-400) */
  plateletCount: number;
  /** Fibrinogen, % of normal (0-150) — consumed in DIC */
  fibrinogenLevel: number;
  /** Heparin dose, % of a therapeutic dose (0-100) — potentiates antithrombin */
  heparinDose: number;
  /** Aspirin dose, % (0-100) — irreversibly inhibits platelet cyclo-oxygenase */
  aspirinDose: number;
  /** Fibrinolytic (tPA) activity, % of normal (0-300) — grossly elevated in DIC */
  fibrinolyticActivity: number;
}

export interface CoagState {
  simTimeSeconds: number;
  /** Tissue factor exposed by the injury, 0..1 — set by the perturbation, then decays as the
   * vessel is sealed */
  tissueFactorExposure: number;
  /** Smoothed cascade intermediates, each 0..1 */
  factorXa: number;
  thrombin: number;
  fibrin: number;
  plateletPlug: number;
  plasmin: number;
  /** Fibrin degradation products released by plasmin, 0..1 */
  dDimer: number;
  /** Seconds since the vessel was injured; -1 when no injury is in progress */
  secondsSinceInjury: number;
  /** Time from injury to a haemostatic clot, seconds; 0 while none has formed */
  timeToClotSeconds: number;
}

export interface CoagDerived {
  tissueFactorExposure: number;
  factorXa: number;
  thrombin: number;
  fibrin: number;
  plateletPlug: number;
  plasmin: number;
  dDimer: number;
  /** Overall clot integrity, 0..1 — needs both a platelet plug and a fibrin mesh */
  clotStrength: number;
  timeToClotSeconds: number;
  isBleeding: boolean;
  /** --- The lab panel: the module's real payoff --- */
  /** Prothrombin time, seconds — probes the extrinsic and common pathways */
  ptSeconds: number;
  inr: number;
  /** Activated partial thromboplastin time, seconds — probes the intrinsic and common pathways */
  apttSeconds: number;
  /** Bleeding time, minutes — probes platelet number and function, not the cascade */
  bleedingTimeMinutes: number;
  fibrinogenMgDl: number;
  plateletCountValue: number;
  dDimerNgMl: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  factorVIIIActivity: number;
  factorIXActivity: number;
  vitaminKDependentFactors: number;
  vonWillebrandFactor: number;
  plateletCount: number;
  fibrinogenLevel: number;
  heparinDose: number;
  aspirinDose: number;
  fibrinolyticActivity: number;
}

export interface CoagSnapshot {
  state: CoagState;
  derived: CoagDerived;
}

export interface CoagHistoryPoint {
  t: number;
  thrombin: number;
  fibrin: number;
  plateletPlug: number;
}

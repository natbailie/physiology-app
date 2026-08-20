export type TissueBed = 'systemic' | 'pulmonary' | 'hepatic' | 'glomerulus';

export type EdemaMechanism =
  | 'none'
  | 'raisedCapillaryPressure'
  | 'lowPlasmaOncotic'
  | 'increasedPermeability'
  | 'lymphaticFailure';

export interface CapillaryInputs {
  /** Pressure at the arteriolar end feeding this bed, mmHg (20-180). */
  arterialInflowPressure: number;
  /** Pressure the bed drains into, mmHg (0-40). Raising it is what heart failure and portal
   * hypertension do, and it is transmitted almost fully back to the capillary. */
  venousOutflowPressure: number;
  /** Precapillary sphincter / arteriolar tone, multiple of normal (0.2-3). Constricting
   * upstream SHIELDS the capillary from arterial pressure; dilating exposes it. */
  precapillaryTone: number;
  /** Plasma albumin, g/dL (1-5.5). The dominant plasma protein, and the one that holds fluid
   * in the circulation. */
  plasmaAlbuminGDl: number;
  /** Filtration coefficient Kf, multiple of normal (0.2-5) — surface area times how leaky the
   * wall is to WATER. */
  capillaryPermeability: number;
  /** Reflection coefficient sigma (0.05-1) — how completely the wall reflects PROTEIN. At 1 the
   * full oncotic gradient is exerted; at 0 protein crosses freely and exerts nothing. */
  reflectionCoefficient: number;
  /** Lymphatic pumping capacity, multiple of normal (0-3). */
  lymphaticFlowCapacity: number;
  /** Compliance of the interstitial matrix, multiple of normal (0.3-3). A stiffer matrix
   * resists swelling harder; a lax one lets fluid pour in with little back-pressure. */
  interstitialCompliance: number;
  /** Which capillary bed — each has genuinely different geometry, and the differences explain
   * why the liver makes ascites, the lung drowns, and the glomerulus filters. */
  tissueBed: TissueBed;
}

export interface CapillaryState {
  simTimeSeconds: number;
  /** Interstitial fluid volume as a multiple of this bed's normal volume — the plant variable.
   * Held as a fraction rather than millilitres so that switching tissue bed stays coherent:
   * every bed has a different normal interstitium, but "20% above normal" means the same thing
   * in all of them. */
  interstitialVolumeFraction: number;
  /** Plasma volume, mL — the mirror compartment fluid is filtered out of. */
  plasmaVolumeMl: number;
  /** Protein in the plasma, grams. Held as a mass rather than a concentration so that protein
   * is CONSERVED as it moves between plasma and interstitium: what leaks out of one arrives in
   * the other, and only the lymph brings it back. This is what makes a leaky capillary lower the
   * plasma oncotic pressure instead of raising it. */
  plasmaProteinG: number;
  /** Interstitial protein as a multiple of this bed's normal protein content. Lymphatics return
   * it; a leaky wall floods it in. Its CONCENTRATION sets interstitial oncotic pressure, one of
   * the three safety factors resisting oedema — and concentration falls when volume rises even
   * if the protein content does not change, which is the washout effect. */
  interstitialProteinFraction: number;
}

export interface CapillaryDerived {
  /** Mean capillary hydrostatic pressure, mmHg, and the values at each end of the capillary. */
  capillaryPressureMmHg: number;
  arteriolarEndPressure: number;
  venularEndPressure: number;
  interstitialPressureMmHg: number;
  plasmaOncoticMmHg: number;
  interstitialOncoticMmHg: number;
  /** Net filtration pressure, mmHg — the sum of the four Starling forces. */
  netFiltrationPressure: number;
  /** And the same at each end, so the reversal along the capillary is visible. */
  arteriolarNetPressure: number;
  venularNetPressure: number;
  filtrationRateMlPerMin: number;
  lymphFlowMlPerMin: number;
  lymphaticCapacityMlPerMin: number;
  /** How much of the lymphatic reserve is still unused, 0-1. Oedema does not begin until this
   * reaches zero — which is why filtration can rise several-fold with nothing visible. */
  lymphaticReserveFraction: number;
  netAccumulationMlPerMin: number;
  interstitialVolumeMl: number;
  plasmaVolumeMl: number;
  interstitialProteinGDl: number;
  /** Interstitial volume as a fraction above normal. */
  interstitialExcess: number;
  oedemaSeverity: number;
  /** True once free fluid has appeared in the matrix — the point at which oedema pits. */
  isPitting: boolean;
  dominantMechanism: EdemaMechanism;
  /** 0-1: for the pulmonary bed, how much the accumulating fluid is impairing gas exchange. */
  oxygenationImpairment: number;
  /** Combined safety factor still in hand, mmHg — how much further capillary pressure could
   * rise before oedema appears. */
  safetyFactorMmHg: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  arterialInflowPressure: number;
  venousOutflowPressure: number;
  precapillaryTone: number;
  plasmaAlbuminGDl: number;
  capillaryPermeability: number;
  reflectionCoefficient: number;
  lymphaticFlowCapacity: number;
  interstitialCompliance: number;
  tissueBed: TissueBed;
}

export interface CapillarySnapshot {
  state: CapillaryState;
  derived: CapillaryDerived;
}

export interface CapillaryHistoryPoint {
  t: number;
  interstitialVolume: number;
  filtrationRate: number;
  lymphFlow: number;
  capillaryPressure: number;
}

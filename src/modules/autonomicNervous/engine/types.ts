export interface AnsInputs {
  /** Sympathetic outflow, % of resting tone (0-100) */
  sympatheticTone: number;
  /** Parasympathetic (vagal) outflow, % of resting tone (0-100) */
  parasympatheticTone: number;
  /** Circulating epinephrine from the adrenal medulla, % (0-100) — hormonal rather than
   * neural, so it reaches beta-2 receptors on tissue with little direct sympathetic
   * innervation; models a pheochromocytoma or an exogenous infusion */
  circulatingEpinephrine: number;
  /** Beta-adrenoceptor blockade, % (0-100) */
  betaBlockade: number;
  /** Muscarinic (cholinergic) blockade, % (0-100) — atropine and friends */
  muscarinicBlockade: number;
  /** Alpha-1 adrenoceptor blockade, % (0-100) */
  alphaBlockade: number;
  /** Acetylcholinesterase inhibition, % (0-100) — organophosphates and neostigmine; amplifies
   * whatever parasympathetic outflow is present rather than creating it */
  cholinesteraseInhibition: number;
}

export interface AnsState {
  simTimeSeconds: number;
  /** Smoothed second messengers — the intracellular step between receptor and effector */
  campLevel: number; // Gs/beta pathway, 0..1
  ip3CalciumLevel: number; // Gq/alpha-1 and muscarinic pathways, 0..1
  /** Smoothed organ effector levels, each 0..1 */
  heartRateEffect: number;
  pupilEffect: number;
  giMotilityEffect: number;
  bronchialToneEffect: number;
  secretionEffect: number;
}

export interface AnsDerived {
  /** Effective receptor activation after tone, circulating catecholamine and blockade, 0..1 */
  alpha1Activation: number;
  beta1Activation: number;
  beta2Activation: number;
  muscarinicActivation: number;
  campLevel: number;
  ip3CalciumLevel: number;
  /** Organ-level outputs in interpretable units */
  heartRateBpm: number;
  pupilDiameterMm: number;
  giMotilityIndex: number;
  bronchialDiameterPercent: number;
  secretionIndex: number;
  /** Net autonomic balance, -1 (fully parasympathetic) .. +1 (fully sympathetic) */
  autonomicBalance: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  sympatheticTone: number;
  parasympatheticTone: number;
  circulatingEpinephrine: number;
  betaBlockade: number;
  muscarinicBlockade: number;
  alphaBlockade: number;
  cholinesteraseInhibition: number;
}

export interface AnsSnapshot {
  state: AnsState;
  derived: AnsDerived;
}

export interface AnsHistoryPoint {
  t: number;
  heartRate: number;
  giMotility: number;
  pupilDiameter: number;
}

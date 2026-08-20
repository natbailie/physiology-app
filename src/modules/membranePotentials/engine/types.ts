export interface MembraneInputs {
  /** Continuous depolarizing stimulus current, arbitrary units (0-50) — above threshold this
   * drives repetitive firing rather than a single spike */
  stimulusIntensity: number;
  /** Extracellular potassium, mEq/L (2-10) — the dominant determinant of resting potential;
   * raising it depolarizes the cell and paradoxically reduces excitability */
  extracellularK: number;
  /** Extracellular sodium, mEq/L (100-160) — sets the sodium equilibrium potential and
   * therefore how high the action potential can overshoot */
  extracellularNa: number;
  /** Available voltage-gated sodium channel density, fraction (0-2) — local anesthetics and
   * class I antiarrhythmics reduce it; 0 abolishes the action potential entirely */
  gNaMaxDensity: number;
  /** Available voltage-gated potassium channel density, fraction (0-2) — class III
   * antiarrhythmics reduce it, prolonging repolarization and the action potential duration */
  gKMaxDensity: number;
  /** Body temperature, °C (30-42) — scales gating kinetics via a Q10 relationship */
  temperature: number;
  /** Myelination, fraction (0-1.5) — sets conduction velocity; demyelination slows propagation
   * without preventing the action potential from firing at all */
  myelination: number;
}

export interface MembraneState {
  simTimeSeconds: number;
  /** Membrane potential, mV (the plant variable) */
  vmMillivolts: number;
  /** Sodium activation gate (m), 0..1 — fastest gate, opens on depolarization */
  gNaActivation: number;
  /** Sodium inactivation gate (h), 0..1 — 1 = available, 0 = inactivated. Closes more slowly
   * than m opens, which is what terminates the upstroke and creates the refractory period */
  gNaInactivation: number;
  /** Potassium activation gate (n), 0..1 — slowest gate; its delayed opening drives
   * repolarization and the afterhyperpolarization */
  gKActivation: number;
  /** Transient stimulus bolus from the "Stimulate" perturbation, decays quickly */
  stimulusBolus: number;
}

export interface MembraneDerived {
  vmMillivolts: number;
  /** Equilibrium potentials from the Nernst equation, mV */
  eNa: number;
  eK: number;
  /** Instantaneous conductances (normalized) */
  gNa: number;
  gK: number;
  gLeak: number;
  /** Net ionic currents, positive = depolarizing */
  iNa: number;
  iK: number;
  gNaActivation: number;
  gNaInactivation: number;
  gKActivation: number;
  /** Resting membrane potential the cell would settle at with all gates at rest, mV */
  restingPotentialMv: number;
  thresholdMv: number;
  /** True while sodium inactivation is too deep for another spike to fire */
  isRefractory: boolean;
  /** Conduction velocity, m/s */
  conductionVelocityMPerS: number;
  /** Fraction of sodium channels still available (the h gate) — the excitability reserve */
  excitability: number;
  // Passthrough of inputs so tick() can stay a pure (state, derived, dt) function.
  stimulusIntensity: number;
  extracellularK: number;
  extracellularNa: number;
  gNaMaxDensity: number;
  gKMaxDensity: number;
  temperature: number;
  myelination: number;
}

export interface MembraneSnapshot {
  state: MembraneState;
  derived: MembraneDerived;
}

export interface MembraneHistoryPoint {
  t: number;
  vm: number;
  gNa: number;
  gK: number;
}

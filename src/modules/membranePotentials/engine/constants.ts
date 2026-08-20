export const IONS = {
  // Intracellular concentrations are treated as fixed — the Na+/K+-ATPase maintains them
  // against the tiny per-spike fluxes, so a single action potential barely dents them.
  INTRACELLULAR_K_MEQ_L: 140,
  INTRACELLULAR_NA_MEQ_L: 14,
  // Nernst slope at 37°C: (RT/zF)·ln10 ≈ 61.5 mV per decade for a monovalent cation.
  NERNST_SLOPE_37C_MV: 61.5,
  KELVIN_OFFSET: 273.15,
  REFERENCE_TEMP_C: 37,
  // Background leak is dominated by K+ but carries a little Na+, which is why the resting
  // potential sits near E_K yet slightly positive to it rather than exactly on it. This
  // ratio is what makes extracellular K+ the strongest determinant of resting Vm.
  LEAK_K_CONDUCTANCE: 0.1,
  LEAK_NA_CONDUCTANCE: 0.006,
};

export const GATING = {
  // Half-activation voltages and slopes for the three Hodgkin-Huxley-style gates. These are
  // the simplified logistic stand-ins for HH's rate equations — same qualitative behavior
  // (m fast and depolarization-activated, h slow and depolarization-INactivated, n slowest),
  // without integrating the full alpha/beta rate formulation.
  M_HALF_MV: -45,
  M_SLOPE_MV: 6,
  // Sits near the resting potential, so a cell held even mildly depolarized (hyperkalemia)
  // already has a meaningful fraction of its sodium channels inactivated and unavailable.
  H_HALF_MV: -65,
  H_SLOPE_MV: 7,
  N_HALF_MV: -32,
  N_SLOPE_MV: 10,

  // Time constants at the reference temperature, in seconds. m is roughly an order of
  // magnitude faster than h and n — that separation is what makes the spike rise steeply and
  // then terminate, rather than settling at some intermediate voltage.
  M_TAU_SECONDS: 0.0001,
  H_TAU_SECONDS: 0.0008,
  N_TAU_SECONDS: 0.0012,

  // Q10 = 3: every 10°C rise roughly triples gating speed. Cooling therefore prolongs the
  // action potential and slows conduction, which is the basis of therapeutic hypothermia's
  // effect on excitable tissue.
  Q10: 3,
};

export const CONDUCTANCE = {
  // Large relative to the background leak (~0.11): this ratio is what makes the sodium
  // current regenerative once m starts to rise, rather than settling at some intermediate
  // voltage. Without it there is no all-or-nothing spike.
  MAX_GNA: 40,
  MAX_GK: 12,
};

export const MEMBRANE = {
  // Membrane time constant scale: capacitance per unit conductance, in seconds.
  CAPACITANCE_SECONDS: 0.0001,
  MIN_MV: -100,
  MAX_MV: 60,
  // Approximate voltage at which the regenerative Na+ influx outruns K+ efflux.
  THRESHOLD_MV: -52,
  // Sodium availability (h) below this means another spike can't be generated — the
  // absolute refractory period.
  REFRACTORY_H_THRESHOLD: 0.25,
};

export const STIMULUS = {
  // Converts the stimulus input (0-50) into a depolarizing current.
  CURRENT_GAIN: 0.02,
  // Just suprathreshold — enough to carry Vm past threshold but not so much that it forcibly
  // depolarizes a cell whose sodium channels are blocked. Keeping it modest is what lets
  // channel availability, rather than the stimulus itself, decide whether a spike fires.
  DEFAULT_BOLUS: 0.84,
  // Brief, but long enough relative to the resting membrane time constant for the pulse to
  // actually drag Vm to threshold before it fades.
  DECAY_TAU_SECONDS: 0.003,
};

export const CONDUCTION = {
  // Velocity scales with myelination (saltatory conduction) and with the available sodium
  // current driving each successive node.
  BASE_VELOCITY_M_PER_S: 2,
  MYELINATION_GAIN: 45,
  Q10_REFERENCE_C: 37,
};

export const MEMBRANE_SIMULATION = {
  MAX_DT_SECONDS: 0.0004,
  RENDER_INTERVAL_MS: 33,
  // ~240 points at a 33ms render interval ≈ 8s of real time ≈ 16ms of simulated time, so a
  // single 2ms spike occupies a readable fraction of the trace rather than a hairline.
  HISTORY_CAPACITY: 240,
  // Action potentials last ~1-2 ms; run far SLOWER than real time so the upstroke,
  // repolarization and refractory period are all visible. At this scale a spike unfolds over
  // about a second. This is the only module in the app whose physiology is too FAST to watch
  // rather than too slow.
  TIME_SCALE: 0.002,
};

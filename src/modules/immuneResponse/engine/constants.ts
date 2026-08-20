export const PATHOGEN = {
  // Replication is exponential until something restrains it — the reason a delayed response
  // costs so much more than a prompt one.
  // Calibrated so innate immunity alone slows but cannot clear the organism — it buys the
  // days the adaptive response needs — while the two together clear it comfortably.
  BASE_REPLICATION_PER_DAY: 0.6,
  MAX_LOAD: 1,
  // Below this the infection counts as cleared.
  CLEARED_THRESHOLD: 0.02,
  INITIAL_INOCULUM: 0.04,
};

export const INNATE = {
  // Fast but fixed: active within hours, no specificity, and — crucially — no memory, so it
  // performs identically on a first and a hundredth exposure.
  ACTIVATION_TAU_DAYS: 0.35,
  KILLING_GAIN: 0.85,
  // Deliberately BELOW the replication rate: innate immunity alone slows an infection without
  // clearing it, which is exactly why the slow adaptive response is worth waiting for.
  MAX_KILLING: 0.45,
};

export const ANTIGEN_PRESENTATION = {
  // Dendritic cells must sample antigen, migrate to a lymph node and find a matching naive
  // lymphocyte. This trafficking delay is the single biggest reason a PRIMARY response takes
  // the better part of a week.
  TAU_DAYS: 1.6,
  FALL_TAU_DAYS: 3,
  GAIN: 1.1,
};

export const ADAPTIVE = {
  // Helper T cells are the hub: they license cytotoxic T cells AND provide the second signal
  // B cells need. Losing them therefore cripples both arms at once, which is precisely why
  // CD4 depletion in HIV is so much more devastating than losing either arm alone.
  HELPER_TAU_DAYS: 1.4,
  HELPER_GAIN: 1.2,
  CYTOTOXIC_TAU_DAYS: 1.8,
  CYTOTOXIC_GAIN: 1.15,
  B_CELL_TAU_DAYS: 1.9,
  B_CELL_GAIN: 1.2,
  // Effector populations CONTRACT far more slowly than they expand. Without this asymmetry
  // the response would collapse the moment antigen fell and the infection would simply
  // rebound, oscillating forever instead of resolving.
  HELPER_FALL_TAU_DAYS: 6,
  CYTOTOXIC_FALL_TAU_DAYS: 8,
  B_CELL_FALL_TAU_DAYS: 8,
  // How much faster the whole adaptive arm engages when memory already exists.
  MEMORY_SPEEDUP: 4.5,
  // ...and how much LARGER it is. Memory raises the frequency of antigen-specific precursors
  // by orders of magnitude, so a recall response is not merely quicker off the mark, it is
  // bigger for the same amount of antigen. Speed alone was not enough: without this the
  // second exposure ramped from the same near-zero baseline and did no better than the first.
  MEMORY_AMPLIFICATION: 3,
};

export const HUMORAL = {
  // IgM is made first, without needing class switching, so it appears early but binds weakly.
  IGM_TAU_DAYS: 1.6,
  IGM_GAIN: 1,
  IGM_FALL_TAU_DAYS: 10,
  // IgG requires class switching (which itself needs helper T cells), so it lags — but it is
  // far more potent, and it is the isotype memory reproduces on a second exposure.
  IGG_TAU_DAYS: 3.2,
  IGG_GAIN: 1.3,
  IGG_SWITCH_DELAY_DAYS: 2.5,
  // IgG has a circulating half-life of about three weeks, so it keeps neutralising long after
  // the antigen that provoked it has gone. That persistence is what finishes an infection off
  // rather than letting it recrudesce.
  IGG_FALL_TAU_DAYS: 28,
};

export const EFFECTOR = {
  // Antibody neutralises EXTRACELLULAR organisms but cannot reach inside a host cell...
  ANTIBODY_VS_EXTRACELLULAR: 3,
  ANTIBODY_VS_INTRACELLULAR: 0.3,
  // ...so an intracellular pathogen has to be handled by cytotoxic T cells killing the
  // infected cell itself. Getting this asymmetry right is what makes the pathogen-type toggle
  // change the clinical picture rather than merely relabelling it.
  CYTOTOXIC_VS_INTRACELLULAR: 3.2,
  CYTOTOXIC_VS_EXTRACELLULAR: 0.35,
};

export const MEMORY = {
  // Memory forms in proportion to how much adaptive response was mounted, and then persists
  // essentially indefinitely — this is the state that makes the second exposure different.
  FORMATION_GAIN: 1.8,
  FORMATION_TAU_DAYS: 4,
  // Decays over years rather than weeks; on this module's timescale it is effectively permanent.
  DECAY_TAU_DAYS: 4000,
};

export const VACCINE = {
  // A vaccine deposits antigen that persists for days without ever replicating — enough to
  // prime the adaptive response and lay down memory, with no infection at any point.
  DOSE: 0.9,
  TAU_DAYS: 4,
};

export const CYTOKINES = {
  NORMAL_TEMPERATURE_C: 37,
  MAX_FEVER_RISE_C: 3.2,
  TAU_DAYS: 0.5,
  // Fever tracks the inflammatory response, which is driven by innate activity and pathogen
  // burden rather than by antibody.
  INNATE_WEIGHT: 0.55,
  PATHOGEN_WEIGHT: 0.75,
};

export const IMMUNE_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  // One simulated second is one day of infection, so a fortnight's course plays out in a
  // comfortably watchable time.
  DAYS_PER_SECOND: 1,
  TIME_SCALE: 3,
};

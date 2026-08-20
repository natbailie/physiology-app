export const LAB_BASELINE = {
  // Reference values a normal panel should reproduce.
  PT_SECONDS: 12,
  APTT_SECONDS: 30,
  BLEEDING_TIME_MINUTES: 4,
  FIBRINOGEN_MG_DL: 300,
  D_DIMER_NG_ML: 200,
  // How far each clotting time stretches as its pathway fails. Times lengthen steeply as
  // factor activity falls, which is why a factor level around 30% already shows up on a
  // screen while a level around 60% does not.
  PT_MAX_SECONDS: 60,
  APTT_MAX_SECONDS: 130,
  BLEEDING_TIME_MAX_MINUTES: 22,
  D_DIMER_MAX_NG_ML: 8000,
  // INR is the PT expressed as a ratio to the laboratory's normal control.
  INR_REFERENCE_SECONDS: 12,
};

export const EXTRINSIC = {
  // Tissue factor plus factor VII — the fast initiator, and the limb the PT interrogates.
  // Factor VII has the shortest half-life of all the clotting factors, so it falls FIRST when
  // vitamin K is antagonised. That is why warfarin prolongs the PT before the APTT.
  VII_SENSITIVITY: 1,
  TF_ACTIVATION_GAIN: 1.1,
  // Tissue factor pathway inhibitor shuts the TF–VIIa complex down almost as soon as it has
  // produced its first trace of thrombin. This is the reason haemophilia matters: the
  // extrinsic limb only ever provides the SPARK, and all sustained thrombin generation has to
  // come from the intrinsic amplification loop. Without modelling TFPI, a normal factor VII
  // would carry the whole reaction and a factor VIII deficiency would look harmless — which
  // is exactly the misconception the normal PT in haemophilia tends to create.
  TFPI_SUPPRESSION: 0.85,
};

export const INTRINSIC = {
  // Factors XII, XI, IX and VIII — the limb the APTT interrogates. Slower to get going, but
  // it carries the bulk of thrombin generation once amplified.
  VIII_SENSITIVITY: 1,
  IX_SENSITIVITY: 1,
  CONTACT_ACTIVATION_GAIN: 0.55,
  // von Willebrand factor is factor VIII's carrier protein, so losing vWF also lowers
  // circulating factor VIII — the reason von Willebrand disease mildly prolongs the APTT.
  VWF_CARRIES_VIII_FRACTION: 0.45,
};

export const COMMON = {
  // Factor Xa with factor Va converts prothrombin (II) to thrombin, which converts fibrinogen
  // to fibrin. Both limbs converge here, so a common-pathway defect prolongs BOTH times.
  XA_TO_THROMBIN_GAIN: 1.5,
  THROMBIN_TO_FIBRIN_GAIN: 1.4,
  XA_TAU_SECONDS: 1.6,
  THROMBIN_TAU_SECONDS: 1.5,
  FIBRIN_TAU_SECONDS: 2.4,
};

export const AMPLIFICATION = {
  // Thrombin feeds back to activate factors V, VIII and XI, so a trace of thrombin recruits
  // far more of its own production. This positive feedback is what makes haemostasis
  // explosive rather than gradual — the only way to seal a vessel fast enough to matter.
  // It is also why the cascade needs such powerful brakes to stay local.
  FEEDBACK_GAIN: 1.5,
  // Below this the burst cannot get going, which is what a severe factor deficiency causes.
  THRESHOLD: 0.02,
};

export const ANTICOAGULANTS = {
  // Antithrombin neutralises thrombin and factor Xa continuously; heparin accelerates it
  // roughly a thousandfold, which is why heparin acts immediately while warfarin takes days.
  ANTITHROMBIN_BASE: 0.16,
  HEPARIN_POTENTIATION: 1.5,
  // Thrombin bound to thrombomodulin activates protein C, which switches off factors Va and
  // VIIIa. The cascade thus contains its own brake, triggered by its own product.
  PROTEIN_C_GAIN: 0.32,
};

export const PLATELETS = {
  NORMAL_COUNT: 250,
  // Adhesion needs von Willebrand factor to bridge platelets to exposed collagen.
  VWF_ADHESION_WEIGHT: 0.5,
  // Aspirin blocks thromboxane-mediated aggregation but leaves adhesion and count untouched,
  // so it prolongs the bleeding time without touching PT or APTT.
  ASPIRIN_MAX_INHIBITION: 0.62,
  PLUG_TAU_SECONDS: 2.2,
  // Activated platelets provide the phospholipid surface the cascade assembles on, so a very
  // low count slows thrombin generation as well as plug formation.
  SURFACE_CONTRIBUTION: 0.35,
};

export const FIBRINOLYSIS = {
  // tPA converts plasminogen to plasmin, which digests fibrin into D-dimer and other split
  // products. It runs alongside clotting from the start, remodelling rather than merely
  // clearing up afterwards.
  PLASMIN_GAIN: 0.5,
  PLASMIN_TAU_SECONDS: 6,
  FIBRIN_LYSIS_GAIN: 0.4,
  D_DIMER_GAIN: 1.1,
  D_DIMER_TAU_SECONDS: 14,
  // A single sealed injury raises the D-dimer only modestly...
  LOCAL_WEIGHT: 0.2,
  // ...whereas the widespread fibrin turnover of DIC sends it through the roof.
  SYSTEMIC_GAIN: 0.55,
};

export const INJURY = {
  DEFAULT_MAGNITUDE: 1,
  // The exposed surface is progressively covered as the plug forms and the vessel is sealed.
  SEALING_TAU_SECONDS: 26,
  // Clot strength above which haemostasis is achieved.
  HEMOSTASIS_THRESHOLD: 0.45,
};

export const COAG_SIMULATION = {
  MAX_DT_SECONDS: 0.25,
  RENDER_INTERVAL_MS: 100,
  HISTORY_CAPACITY: 600,
  TIME_SCALE: 4,
};

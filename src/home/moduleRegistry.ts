export interface ModuleDescriptor {
  id: string;
  name: string;
  tagline: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  /** 'reference' marks non-simulation utility pages (e.g. the formula sheet) so
   * ModuleCard can visually distinguish them from feedback-loop simulators. */
  kind?: 'simulator' | 'reference';
  /**
   * Modules that model a neighbouring part of the same problem.
   *
   * The app siloes concepts that a patient does not: hyperkalaemia is modelled in three places,
   * DKA in three, heart failure in four. Until now the footnotes referenced each other in prose
   * and nothing linked, so a learner had to already know the connection existed to follow it.
   *
   * `why` is the point of each link, not a label — "see this on the ECG" tells a learner what
   * they will get, where "ECG & Cardiac Conduction" only tells them where they will land.
   */
  related?: { id: string; why: string }[];
}

export const MODULES: ModuleDescriptor[] = [
  {
    id: 'cardiorenal',
    name: 'Cardiorenal',
    tagline: 'Heart & kidney feedback simulator',
    status: 'available',
    accentColorVar: 'var(--artery)',
    related: [
      { id: 'venousReturn', why: 'the two-curve analysis behind the output this assumes' },
      { id: 'renalTubular', why: 'what the nephron does with the filtrate' },
    ],
  },
  {
    id: 'respiratory',
    name: 'Respiratory & Acid-Base',
    tagline: 'Ventilation, gas exchange & reading a blood gas',
    status: 'available',
    accentColorVar: 'var(--o2)',
    related: [
      { id: 'respiratoryMechanics', why: 'how the ventilation this assumes is actually generated' },
      { id: 'electrolyteBalance', why: 'the other half of an acid-base disturbance' },
    ],
  },
  {
    id: 'hpaAxis',
    name: 'HPA Axis',
    tagline: 'Cortisol, stress response & adrenal insufficiency',
    status: 'available',
    accentColorVar: 'var(--cortisol)',
    related: [
      { id: 'glucoseRegulation', why: 'cortisol as a counter-regulatory hormone' },
    ],
  },
  {
    id: 'hptAxis',
    name: 'Thyroid (HPT) Axis',
    tagline: 'TSH, T4/T3 & thyroid function tests',
    status: 'available',
    accentColorVar: 'var(--thyroid)',
    related: [
      { id: 'cardiorenal', why: 'what thyroid hormone does to the circulation' },
    ],
  },
  {
    id: 'gastrointestinal',
    name: 'GI Physiology',
    tagline: 'Gastric acid, gut hormones & motility along the meal',
    status: 'available',
    accentColorVar: 'var(--gastrin)',
    related: [
      { id: 'glucoseRegulation', why: 'the incretin response to the same meal' },
    ],
  },
  {
    id: 'glucoseRegulation',
    name: 'Glucose Regulation',
    tagline: 'Insulin, glucagon & counter-regulatory hormones',
    status: 'available',
    accentColorVar: 'var(--glucose)',
    related: [
      { id: 'electrolyteBalance', why: 'what insulin does to serum potassium' },
      { id: 'respiratory', why: 'the Kussmaul breathing of ketoacidosis' },
    ],
  },
  {
    id: 'calciumHomeostasis',
    name: 'Calcium & Bone/Mineral',
    tagline: 'PTH, calcitriol & phosphate regulation',
    status: 'available',
    accentColorVar: 'var(--pth)',
    related: [
      { id: 'membranePotentials', why: 'why calcium changes membrane excitability' },
    ],
  },
  {
    id: 'hpgAxis',
    name: 'HPG Axis',
    tagline: 'GnRH, LH/FSH & the ovulatory LH surge',
    status: 'available',
    accentColorVar: 'var(--lh)',
    related: [
      { id: 'hpaAxis', why: 'the same hypothalamic-pituitary architecture' },
    ],
  },
  {
    id: 'membranePotentials',
    name: 'Membrane & Action Potentials',
    tagline: 'Ion conductances, Nernst/GHK & the action potential',
    status: 'available',
    accentColorVar: 'var(--vm)',
    related: [
      { id: 'ecgConduction', why: 'the same ion currents summed into a surface trace' },
      { id: 'neuromuscularJunction', why: 'where the action potential is handed on' },
      { id: 'muscleContraction', why: 'what the action potential triggers' },
    ],
  },
  {
    id: 'autonomicNervous',
    name: 'Autonomic Nervous System',
    tagline: 'Sympathetic/parasympathetic balance across organ effectors',
    status: 'available',
    accentColorVar: 'var(--sympathetic)',
    related: [
      { id: 'cardiorenal', why: 'sympathetic drive on the circulation' },
      { id: 'ecgConduction', why: 'autonomic effect on rate and conduction' },
    ],
  },
  {
    id: 'respiratoryMechanics',
    name: 'Respiratory Mechanics & Spirometry',
    tagline: 'Lung volumes, compliance & V/Q matching',
    status: 'available',
    accentColorVar: 'var(--compliance)',
    related: [
      { id: 'respiratory', why: 'what the ventilation does to gas exchange and pH' },
    ],
  },
  {
    id: 'ecgConduction',
    name: 'ECG & Cardiac Conduction',
    tagline: 'How one dipole, seen twelve ways, writes an ECG',
    status: 'available',
    accentColorVar: 'var(--ecg-trace)',
    related: [
      { id: 'cardiacElectro', why: 'the mechanical consequence of the same cycle' },
      { id: 'membranePotentials', why: 'the ion currents underneath each wave' },
      { id: 'electrolyteBalance', why: 'what moves the potassium that peaks the T wave' },
    ],
  },
  {
    id: 'cardiacElectro',
    name: 'Cardiac Cycle & PV Loop',
    tagline: 'Preload, afterload, contractility & the pressure-volume loop',
    status: 'available',
    accentColorVar: 'var(--pv-loop)',
    related: [
      { id: 'ecgConduction', why: 'the electrical event that starts each cycle' },
      { id: 'venousReturn', why: 'where the preload on this loop comes from' },
    ],
  },
  {
    id: 'renalTubular',
    name: 'Renal Tubular Physiology',
    tagline: 'Nephron segments, countercurrent multiplication & ADH',
    status: 'available',
    accentColorVar: 'var(--tubule)',
    related: [
      { id: 'electrolyteBalance', why: 'what the tubule does to serum sodium' },
      { id: 'cardiorenal', why: 'the pressure this nephron is filtering at' },
    ],
  },
  {
    id: 'coagulation',
    name: 'Coagulation & Hemostasis',
    tagline: 'The clotting cascade, PT/APTT & anticoagulants',
    status: 'available',
    accentColorVar: 'var(--fibrin)',
    related: [
      { id: 'erythropoiesis', why: 'the other half of a blood film' },
    ],
  },
  {
    id: 'erythropoiesis',
    name: 'Erythropoiesis & Anemia',
    tagline: 'EPO feedback, iron & B12, and classifying an anemia',
    status: 'available',
    accentColorVar: 'var(--hemoglobin)',
    related: [
      { id: 'coagulation', why: 'the other half of a blood film' },
      { id: 'respiratory', why: 'what haemoglobin does for oxygen carriage' },
    ],
  },
  {
    id: 'immuneResponse',
    name: 'Immune Response',
    tagline: 'Innate to adaptive, and how memory changes everything',
    status: 'available',
    accentColorVar: 'var(--memory)',
    related: [
      { id: 'hypersensitivity', why: 'the same machinery injuring its own host' },
    ],
  },
  {
    id: 'hypersensitivity',
    name: 'Hypersensitivity',
    tagline: 'Types I-IV, and every transfusion reaction among them',
    status: 'available',
    accentColorVar: 'var(--ige)',
    related: [
      { id: 'immuneResponse', why: 'how the sensitisation was laid down' },
      { id: 'erythropoiesis', why: 'the anaemia a haemolytic reaction produces' },
      { id: 'shockStates', why: 'anaphylaxis as a distributive shock' },
    ],
  },
  {
    id: 'muscleContraction',
    name: 'Muscle & EC Coupling',
    tagline: 'Calcium, cross-bridges, length-tension & force-velocity',
    status: 'available',
    accentColorVar: 'var(--sarcomere)',
    related: [
      { id: 'neuromuscularJunction', why: 'the synapse that triggers this' },
      { id: 'membranePotentials', why: 'the action potential arriving at the T-tubule' },
    ],
  },
  {
    id: 'electrolyteBalance',
    name: 'Potassium & Sodium-Water Balance',
    tagline: 'Serum vs total body, and tonicity vs volume',
    status: 'available',
    accentColorVar: 'var(--potassium)',
    related: [
      { id: 'ecgConduction', why: 'see hyperkalaemia on the ECG' },
      { id: 'renalTubular', why: 'the tubule doing the reabsorbing' },
      { id: 'membranePotentials', why: 'why serum potassium sets the resting membrane' },
    ],
  },
  {
    id: 'capillaryExchange',
    name: 'Capillary Exchange & Oedema',
    tagline: 'Starling forces, the interstitium & lymphatic reserve',
    status: 'available',
    accentColorVar: 'var(--capillary)',
    related: [
      { id: 'venousReturn', why: 'what sets the capillary hydrostatic pressure' },
      { id: 'cardiorenal', why: 'the oedema of heart failure end to end' },
    ],
  },
  {
    id: 'venousReturn',
    name: 'Venous Return & Cardiac Function',
    tagline: 'Filling pressure, the two curves & where they cross',
    status: 'available',
    accentColorVar: 'var(--venous)',
    related: [
      { id: 'cardiorenal', why: 'what the kidney does with the resulting pressure' },
      { id: 'shockStates', why: 'the four ways this circulation fails' },
    ],
  },
  {
    id: 'shockStates',
    name: 'Shock States',
    tagline: 'Four ways to fail, and the numbers that separate them',
    status: 'available',
    accentColorVar: 'var(--artery)',
    related: [
      { id: 'venousReturn', why: 'the curves behind these filling pressures' },
      { id: 'capillaryExchange', why: 'why septic capillaries leak' },
      { id: 'hypersensitivity', why: 'anaphylaxis as an immune mechanism' },
    ],
  },
  {
    id: 'fetalCirculation',
    name: 'Fetal & Neonatal Circulation',
    tagline: 'Three shunts, and the minute two circulations become one',
    status: 'available',
    accentColorVar: 'var(--o2)',
    related: [
      { id: 'venousReturn', why: 'the adult circulation this becomes' },
    ],
  },
  {
    id: 'neuromuscularJunction',
    name: 'Neuromuscular Junction',
    tagline: 'Safety factor, fade, and telling presynaptic from postsynaptic',
    status: 'available',
    accentColorVar: 'var(--vm)',
    related: [
      { id: 'muscleContraction', why: 'what happens once the fibre fires' },
      { id: 'membranePotentials', why: 'the action potential arriving presynaptically' },
    ],
  },
  {
    id: 'cerebralPerfusion',
    name: 'Cerebral Perfusion, ICP & CSF',
    tagline: 'Monro-Kellie, the pressure-volume curve and CPP = MAP − ICP',
    status: 'available',
    accentColorVar: 'var(--vm)',
    related: [
      { id: 'cardiorenal', why: 'where the mean arterial pressure comes from' },
      { id: 'respiratory', why: 'the CO2 this autoregulation responds to' },
    ],
  },
  {
    id: 'reference',
    name: 'Formula Reference',
    tagline: 'High-yield equations & calculators for cardio, renal & respiratory',
    status: 'available',
    kind: 'reference',
  },
];

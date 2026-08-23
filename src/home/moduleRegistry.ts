export interface ModuleDescriptor {
  id: string;
  name: string;
  tagline: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  /** 'reference' marks non-simulation utility pages (e.g. the formula sheet) so
   * ModuleCard can visually distinguish them from feedback-loop simulators. */
  kind?: 'simulator' | 'reference';
}

export const MODULES: ModuleDescriptor[] = [
  {
    id: 'cardiorenal',
    name: 'Cardiorenal',
    tagline: 'Heart & kidney feedback simulator',
    status: 'available',
    accentColorVar: 'var(--artery)',
  },
  {
    id: 'respiratory',
    name: 'Respiratory & Acid-Base',
    tagline: 'Ventilation, gas exchange & reading a blood gas',
    status: 'available',
    accentColorVar: 'var(--o2)',
  },
  {
    id: 'hpaAxis',
    name: 'HPA Axis',
    tagline: 'Cortisol, stress response & adrenal insufficiency',
    status: 'available',
    accentColorVar: 'var(--cortisol)',
  },
  {
    id: 'hptAxis',
    name: 'Thyroid (HPT) Axis',
    tagline: 'TSH, T4/T3 & thyroid function tests',
    status: 'available',
    accentColorVar: 'var(--thyroid)',
  },
  {
    id: 'gastrointestinal',
    name: 'GI Physiology',
    tagline: 'Gastric acid, gut hormones & motility along the meal',
    status: 'available',
    accentColorVar: 'var(--gastrin)',
  },
  {
    id: 'glucoseRegulation',
    name: 'Glucose Regulation',
    tagline: 'Insulin, glucagon & counter-regulatory hormones',
    status: 'available',
    accentColorVar: 'var(--glucose)',
  },
  {
    id: 'calciumHomeostasis',
    name: 'Calcium & Bone/Mineral',
    tagline: 'PTH, calcitriol & phosphate regulation',
    status: 'available',
    accentColorVar: 'var(--pth)',
  },
  {
    id: 'hpgAxis',
    name: 'HPG Axis',
    tagline: 'GnRH, LH/FSH & the ovulatory LH surge',
    status: 'available',
    accentColorVar: 'var(--lh)',
  },
  {
    id: 'membranePotentials',
    name: 'Membrane & Action Potentials',
    tagline: 'Ion conductances, Nernst/GHK & the action potential',
    status: 'available',
    accentColorVar: 'var(--vm)',
  },
  {
    id: 'autonomicNervous',
    name: 'Autonomic Nervous System',
    tagline: 'Sympathetic/parasympathetic balance across organ effectors',
    status: 'available',
    accentColorVar: 'var(--sympathetic)',
  },
  {
    id: 'respiratoryMechanics',
    name: 'Respiratory Mechanics & Spirometry',
    tagline: 'Lung volumes, compliance & V/Q matching',
    status: 'available',
    accentColorVar: 'var(--compliance)',
  },
  {
    id: 'ecgConduction',
    name: 'ECG & Cardiac Conduction',
    tagline: 'How one dipole, seen twelve ways, writes an ECG',
    status: 'available',
    accentColorVar: 'var(--ecg-trace)',
  },
  {
    id: 'cardiacElectro',
    name: 'Cardiac Cycle & PV Loop',
    tagline: 'Preload, afterload, contractility & the pressure-volume loop',
    status: 'available',
    accentColorVar: 'var(--pv-loop)',
  },
  {
    id: 'renalTubular',
    name: 'Renal Tubular Physiology',
    tagline: 'Nephron segments, countercurrent multiplication & ADH',
    status: 'available',
    accentColorVar: 'var(--tubule)',
  },
  {
    id: 'coagulation',
    name: 'Coagulation & Hemostasis',
    tagline: 'The clotting cascade, PT/APTT & anticoagulants',
    status: 'available',
    accentColorVar: 'var(--fibrin)',
  },
  {
    id: 'erythropoiesis',
    name: 'Erythropoiesis & Anemia',
    tagline: 'EPO feedback, iron & B12, and classifying an anemia',
    status: 'available',
    accentColorVar: 'var(--hemoglobin)',
  },
  {
    id: 'immuneResponse',
    name: 'Immune Response',
    tagline: 'Innate to adaptive, and how memory changes everything',
    status: 'available',
    accentColorVar: 'var(--memory)',
  },
  {
    id: 'hypersensitivity',
    name: 'Hypersensitivity',
    tagline: 'Types I-IV, and every transfusion reaction among them',
    status: 'available',
    accentColorVar: 'var(--ige)',
  },
  {
    id: 'muscleContraction',
    name: 'Muscle & EC Coupling',
    tagline: 'Calcium, cross-bridges, length-tension & force-velocity',
    status: 'available',
    accentColorVar: 'var(--sarcomere)',
  },
  {
    id: 'electrolyteBalance',
    name: 'Potassium & Sodium-Water Balance',
    tagline: 'Serum vs total body, and tonicity vs volume',
    status: 'available',
    accentColorVar: 'var(--potassium)',
  },
  {
    id: 'capillaryExchange',
    name: 'Capillary Exchange & Oedema',
    tagline: 'Starling forces, the interstitium & lymphatic reserve',
    status: 'available',
    accentColorVar: 'var(--capillary)',
  },
  {
    id: 'venousReturn',
    name: 'Venous Return & Cardiac Function',
    tagline: 'Filling pressure, the two curves & where they cross',
    status: 'available',
    accentColorVar: 'var(--venous)',
  },
  {
    id: 'shockStates',
    name: 'Shock States',
    tagline: 'Four ways to fail, and the numbers that separate them',
    status: 'available',
    accentColorVar: 'var(--artery)',
  },
  {
    id: 'fetalCirculation',
    name: 'Fetal & Neonatal Circulation',
    tagline: 'Three shunts, and the minute two circulations become one',
    status: 'available',
    accentColorVar: 'var(--o2)',
  },
  {
    id: 'neuromuscularJunction',
    name: 'Neuromuscular Junction',
    tagline: 'Safety factor, fade, and telling presynaptic from postsynaptic',
    status: 'available',
    accentColorVar: 'var(--vm)',
  },
  {
    id: 'cerebralPerfusion',
    name: 'Cerebral Perfusion, ICP & CSF',
    tagline: 'Monro-Kellie, the pressure-volume curve and CPP = MAP − ICP',
    status: 'available',
    accentColorVar: 'var(--vm)',
  },
  {
    id: 'reference',
    name: 'Formula Reference',
    tagline: 'High-yield equations & calculators for cardio, renal & respiratory',
    status: 'available',
    kind: 'reference',
  },
];

/** The top tier of the catalogue: the subject a learner picks before anything else. A
 * discipline owns themes, a theme owns modules. Route ids are `discipline/<id>` (see
 * useHashRoute and App.tsx). */
export interface DisciplineDescriptor {
  id: string;
  name: string;
  /** One line saying what lives here, shown under the discipline's name. */
  blurb: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  /**
   * Where the tile goes when this discipline's only theme is itself a browseable hub, so the
   * generated `#discipline/<id>` page would hold a single tile and teach nobody anything.
   * Absent for the normal case, and a discipline that sets it gets no generated route at all.
   */
  href?: string;
}

/** The disciplines, in the order they should be presented. The unbuilt ones ship as
 * coming-soon tiles on purpose: the roadmap is worth showing, and an empty subject is more
 * honest than a subject that is silently missing. */
export const DISCIPLINES: DisciplineDescriptor[] = [
  {
    id: 'physiology',
    name: 'Physiology',
    blurb: 'The feedback-loop simulators, one organ system at a time.',
    status: 'available',
    accentColorVar: 'var(--artery)',
  },
  {
    id: 'pharmacology',
    name: 'Pharmacology',
    blurb: 'The high-yield drug classes of the UK top-100, and the diagrams that show how each works.',
    status: 'available',
    accentColorVar: 'var(--raas)',
    // Its one theme IS the hub, so the tile skips the tier that would hold a single card.
    href: '#theme/medications',
  },
  {
    id: 'microbiology',
    name: 'Microbiology',
    blurb: 'The organisms, what they infect and the drugs that reach them.',
    status: 'comingSoon',
    accentColorVar: 'var(--pathogen)',
  },
  {
    id: 'biochemistry',
    name: 'Biochemistry',
    blurb: 'The pathways underneath the physiology, and where each one fails.',
    status: 'comingSoon',
    accentColorVar: 'var(--glucose)',
  },
  {
    id: 'anatomy',
    name: 'Anatomy',
    blurb: 'Structure and the relationships that make the clinical signs make sense.',
    status: 'comingSoon',
    accentColorVar: 'var(--sarcomere)',
  },
  {
    id: 'pathology',
    name: 'Pathology',
    blurb: 'How disease processes begin, spread and show themselves.',
    status: 'comingSoon',
    accentColorVar: 'var(--fibrin)',
  },
];

export type DisciplineId = (typeof DISCIPLINES)[number]['id'];

/** One way of slicing the simulator catalogue. The home page is a grid of these; each opens
 * its own page of module cards (see ThemePage). A module belongs to exactly one theme. */
export interface ThemeDescriptor {
  id: string;
  name: string;
  /** One line saying what lives here, shown under the theme's name. */
  blurb: string;
  /** The subject this theme sits under. Required, so a new theme cannot belong to nothing
   * and quietly disappear from every discipline page. */
  discipline: DisciplineId;
  accentColorVar?: string;
}

/** The themes, in the order they should be presented. Route ids are `theme/<id>` (see
 * useHashRoute and App.tsx), which is why none of them collide with a module route. */
export const THEMES: ThemeDescriptor[] = [
  {
    id: 'cardiovascular',
    name: 'Cardiovascular',
    blurb: 'The pump, its pipes and the pressures that keep both honest.',
    discipline: 'physiology',
    accentColorVar: 'var(--artery)',
  },
  {
    id: 'respiratory',
    name: 'Respiratory',
    blurb: 'Ventilation, gas exchange and the blood-gas numbers they produce.',
    discipline: 'physiology',
    accentColorVar: 'var(--o2)',
  },
  {
    id: 'renalFluids',
    name: 'Renal & Fluids',
    blurb: 'The nephron, the electrolytes and the bladder they drain into.',
    discipline: 'physiology',
    accentColorVar: 'var(--kidney)',
  },
  {
    id: 'endocrine',
    name: 'Endocrine',
    blurb: 'The axes — every gland, its hormone and the feedback loop around it.',
    discipline: 'physiology',
    accentColorVar: 'var(--cortisol)',
  },
  {
    id: 'gastrointestinal',
    name: 'Gastrointestinal',
    blurb: 'From gastric acid to the stool that names the broken segment.',
    discipline: 'physiology',
    accentColorVar: 'var(--gastrin)',
  },
  {
    id: 'haematology',
    name: 'Haematology & Immunity',
    blurb: 'Cells, clotting, transfusion and the immune systems that guard them.',
    discipline: 'physiology',
    accentColorVar: 'var(--fibrin)',
  },
  {
    id: 'neuroMuscle',
    name: 'Neuro & Muscle',
    blurb: 'Nerves, synapses, muscle and the circuits that command them.',
    discipline: 'physiology',
    accentColorVar: 'var(--sarcomere)',
  },
  {
    id: 'specialSenses',
    name: 'Special Senses',
    blurb: 'How each sense turns a physical signal into a nerve impulse.',
    discipline: 'physiology',
    accentColorVar: 'var(--retina)',
  },
  {
    id: 'reproduction',
    name: 'Reproduction & Development',
    blurb: 'The maternal adaptations of pregnancy and the two circulations of birth.',
    discipline: 'physiology',
    accentColorVar: 'var(--placenta)',
  },
  {
    id: 'integrative',
    name: 'Integrative Physiology',
    blurb: 'Whole-body physiology that no single organ owns.',
    discipline: 'physiology',
    accentColorVar: 'var(--exercise)',
  },
  {
    id: 'cellMolecular',
    name: 'Cell & Molecular',
    blurb: 'The cell-level machinery underneath the organ systems.',
    discipline: 'physiology',
    accentColorVar: 'var(--marrow)',
  },
  {
    id: 'medications',
    name: 'Medications',
    blurb: 'The high-yield drug classes of the UK top-100 — how each works, and the diagrams that show it.',
    discipline: 'pharmacology',
    accentColorVar: 'var(--raas)',
  },
];

export type ThemeId = (typeof THEMES)[number]['id'];

export interface ModuleDescriptor {
  id: string;
  name: string;
  tagline: string;
  status: 'available' | 'comingSoon';
  accentColorVar?: string;
  /** Which theme page this card lives behind on the home screen. Absent only for
   * non-simulator utility pages (the reference sheet stays pinned on home). */
  theme?: ThemeId;
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
    theme: 'cardiovascular',
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
    theme: 'respiratory',
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
    theme: 'endocrine',
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
    theme: 'endocrine',
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
    theme: 'gastrointestinal',
    accentColorVar: 'var(--gastrin)',
    related: [
      { id: 'glucoseRegulation', why: 'the incretin response to the same meal' },
      { id: 'digestionAbsorption', why: 'what the small intestine does with what this stomach delivers' },
    ],
  },
  {
    id: 'glucoseRegulation',
    name: 'Glucose Regulation',
    tagline: 'Insulin, glucagon & counter-regulatory hormones',
    status: 'available',
    theme: 'endocrine',
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
    theme: 'endocrine',
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
    theme: 'endocrine',
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
    theme: 'neuroMuscle',
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
    theme: 'neuroMuscle',
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
    theme: 'respiratory',
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
    theme: 'cardiovascular',
    accentColorVar: 'var(--ecg-trace)',
    related: [
      { id: 'cardiacElectro', why: 'the mechanical consequence of the same cycle' },
      { id: 'membranePotentials', why: 'the ion currents underneath each wave' },
      { id: 'electrolyteBalance', why: 'what moves the potassium that peaks the T wave' },
      { id: 'coronaryCirculation', why: 'the ischaemia this ECG records, from the supply side' },
    ],
  },
  {
    id: 'cardiacElectro',
    name: 'Cardiac Cycle & PV Loop',
    tagline: 'Preload, afterload, contractility & the pressure-volume loop',
    status: 'available',
    theme: 'cardiovascular',
    accentColorVar: 'var(--pv-loop)',
    related: [
      { id: 'ecgConduction', why: 'the electrical event that starts each cycle' },
      { id: 'venousReturn', why: 'where the preload on this loop comes from' },
      { id: 'coronaryCirculation', why: 'the pump is also the customer of its own supply' },
    ],
  },
  {
    id: 'coronaryCirculation',
    name: 'Coronary Circulation',
    tagline: 'Supply, demand & the vasodilatory reserve in between',
    status: 'available',
    theme: 'cardiovascular',
    accentColorVar: 'var(--artery)',
    related: [
      { id: 'ecgConduction', why: 'territorial ST elevation vs subendocardial depression' },
      { id: 'cardiacElectro', why: 'the pressure-volume work that sets the demand' },
      { id: 'shockStates', why: 'what a falling diastolic head does systemically' },
      { id: 'exercisePhysiology', why: 'the demand surges this heart must meet' },
    ],
  },
  {
    id: 'renalTubular',
    name: 'Renal Tubular Physiology',
    tagline: 'Nephron segments, countercurrent multiplication & ADH',
    status: 'available',
    theme: 'renalFluids',
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
    theme: 'haematology',
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
    theme: 'haematology',
    accentColorVar: 'var(--hemoglobin)',
    related: [
      { id: 'coagulation', why: 'the other half of a blood film' },
      { id: 'respiratory', why: 'what haemoglobin does for oxygen carriage' },
      { id: 'digestionAbsorption', why: 'where the iron and B12 were supposed to come from' },
    ],
  },
  {
    id: 'immuneResponse',
    name: 'Immune Response',
    tagline: 'Innate to adaptive, and how memory changes everything',
    status: 'available',
    theme: 'haematology',
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
    theme: 'haematology',
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
    theme: 'neuroMuscle',
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
    theme: 'renalFluids',
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
    theme: 'cardiovascular',
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
    theme: 'cardiovascular',
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
    theme: 'cardiovascular',
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
    theme: 'reproduction',
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
    theme: 'neuroMuscle',
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
    theme: 'neuroMuscle',
    accentColorVar: 'var(--vm)',
    related: [
      { id: 'cardiorenal', why: 'where the mean arterial pressure comes from' },
      { id: 'respiratory', why: 'the CO2 this autoregulation responds to' },
    ],
  },
  {
    id: 'vision',
    name: 'Vision & Phototransduction',
    tagline: 'Rods vs cones, dark adaptation & the pupil reflexes',
    status: 'available',
    theme: 'specialSenses',
    accentColorVar: 'var(--retina)',
    related: [
      { id: 'membranePotentials', why: 'the ion channels under phototransduction' },
      { id: 'cerebralPerfusion', why: 'the pressure perfusing this retina' },
    ],
  },
  {
    id: 'hearing',
    name: 'Hearing & Cochlear Mechanics',
    tagline: 'The audiogram, recruitment & telling conductive from cochlear',
    status: 'available',
    theme: 'specialSenses',
    accentColorVar: 'var(--cochlea)',
    related: [
      { id: 'vestibular', why: 'the neighbouring labyrinth and its vertigo' },
    ],
  },
  {
    id: 'vestibular',
    name: 'Vestibular System & Vertigo',
    tagline: 'Canal firing, compensation, BPPV & the head impulse',
    status: 'available',
    theme: 'specialSenses',
    accentColorVar: 'var(--vestibular)',
    related: [
      { id: 'hearing', why: 'the cochlea sharing the same inner ear' },
      { id: 'cerebralPerfusion', why: 'the brainstem circuits being driven here' },
    ],
  },
  {
    id: 'somaticSensation',
    name: 'Somatosensation & Pain Pathways',
    tagline: 'The dorsal-horn gate, sensitisation & the tract dissociations',
    status: 'available',
    theme: 'neuroMuscle',
    accentColorVar: 'var(--nociception)',
    related: [
      { id: 'membranePotentials', why: 'the conduction block local anaesthetics exploit' },
      { id: 'autonomicNervous', why: 'the sympathetic afferents feeding the same horn' },
    ],
  },
  {
    id: 'motorControl',
    name: 'Motor Control: Basal Ganglia & Cerebellum',
    tagline: 'Slowness, error & release across the movement disorders',
    status: 'available',
    theme: 'neuroMuscle',
    accentColorVar: 'var(--basal-ganglia)',
    related: [
      { id: 'muscleContraction', why: 'the contractile machinery these circuits command' },
      { id: 'neuromuscularJunction', why: 'the final synapse every command must cross' },
    ],
  },
  {
    id: 'liverPhysiology',
    name: 'Liver & Bilirubin Metabolism',
    tagline: 'One pigment, three places to fail, read from urine and stool',
    status: 'available',
    theme: 'gastrointestinal',
    accentColorVar: 'var(--liver)',
    related: [
      { id: 'erythropoiesis', why: 'where the bilirubin comes from' },
      { id: 'gastrointestinal', why: 'the gut the bile drains into' },
      { id: 'digestionAbsorption', why: 'the bile salts this liver makes keep fat absorption alive' },
    ],
  },
  {
    id: 'pregnancy',
    name: 'Maternal Physiology, Labour & Lactation',
    tagline: 'Every maternal number changes, and most look like disease',
    status: 'available',
    theme: 'reproduction',
    accentColorVar: 'var(--placenta)',
    related: [
      { id: 'respiratory', why: 'the compensated alkalosis this progesterone drives' },
      { id: 'cardiorenal', why: 'the circulation being expanded and redistributed' },
    ],
  },
  {
    id: 'anteriorPituitary',
    name: 'Anterior Pituitary: GH & Prolactin',
    tagline: 'Autonomy, the dopamine brake & the glucose suppression test',
    status: 'available',
    theme: 'endocrine',
    accentColorVar: 'var(--pituitary)',
    related: [
      { id: 'hptAxis', why: 'the TRH that lifts prolactin in hypothyroidism' },
      { id: 'hpaAxis', why: 'the same hypothalamic-pituitary architecture' },
    ],
  },
  {
    id: 'adrenalCortex',
    name: 'Adrenal Cortex: Steroidogenesis & CAH',
    tagline: 'One pathway, four enzymes, a fingerprint at every block',
    status: 'available',
    theme: 'endocrine',
    accentColorVar: 'var(--cortisol)',
    related: [
      { id: 'hpaAxis', why: 'the ACTH driving everything this pathway makes' },
      { id: 'calciumHomeostasis', why: 'another endocrine axis read through its labs' },
    ],
  },
  {
    id: 'adrenalMedulla',
    name: 'Adrenal Medulla & Phaeochromocytoma',
    tagline: 'Alpha raises it, beta moves the rest — block in the right order',
    status: 'available',
    theme: 'endocrine',
    accentColorVar: 'var(--adrenal-medulla)',
    related: [
      { id: 'autonomicNervous', why: 'the receptor biology these tumours hijack' },
      { id: 'shockStates', why: 'where catecholamine collapse lands haemodynamically' },
    ],
  },
  {
    id: 'bloodGroups',
    name: 'Blood Groups & Transfusion Reactions',
    tagline: 'Preformed antibodies, and two reaction timelines that never overlap',
    status: 'available',
    theme: 'haematology',
    accentColorVar: 'var(--transfusion)',
    related: [
      { id: 'erythropoiesis', why: 'the cells being transfused and destroyed' },
      { id: 'hypersensitivity', why: 'type II reactions are exactly this machinery' },
    ],
  },
  {
    id: 'thermoregulation',
    name: 'Thermoregulation, Fever & Heat Illness',
    tagline: 'Fever is defended and hyperthermia is overwhelmed',
    status: 'available',
    theme: 'integrative',
    accentColorVar: 'var(--thermal)',
    related: [
      { id: 'hypersensitivity', why: 'the pyrogen cytokines behind a raised set point' },
      { id: 'exercisePhysiology', why: 'the metabolic heat an exercising body must dump' },
    ],
  },
  {
    id: 'exercisePhysiology',
    name: 'Exercise Physiology',
    tagline: 'Every system answers one question: how much oxygen do the muscles need',
    status: 'available',
    theme: 'integrative',
    accentColorVar: 'var(--exercise)',
    related: [
      { id: 'cardiacElectro', why: 'the cardiac cycle being multiplied by rate and stroke volume' },
      { id: 'respiratoryMechanics', why: 'the ventilation matched to this metabolism' },
      { id: 'thermoregulation', why: 'where all of this heat ends up' },
    ],
  },
  {
    id: 'enzymeKinetics',
    name: 'Enzyme Kinetics & Inhibition',
    tagline: 'One equation explains saturation, competition & drug class',
    status: 'available',
    theme: 'cellMolecular',
    accentColorVar: 'var(--ecg-trace)',
    related: [
      { id: 'glucoseRegulation', why: 'the hormonal switches acting on metabolic enzymes' },
      { id: 'respiratory', why: 'what systemic acidaemia does to every reaction at once' },
    ],
  },
  {
    id: 'cellCycle',
    name: 'Cell Cycle & Checkpoints',
    tagline: 'Four phases, three checkpoints, and every cancer drug names one',
    status: 'available',
    theme: 'cellMolecular',
    accentColorVar: 'var(--o2)',
    related: [
      { id: 'enzymeKinetics', why: 'the same inhibition logic at the level of a whole cell' },
      { id: 'immuneResponse', why: 'surveillance over cells that evade these checkpoints' },
    ],
  },
  {
    id: 'digestionAbsorption',
    name: 'Digestion & Absorption',
    tagline: 'Pancreas, bile, brush border & the stool that names the broken link',
    status: 'available',
    theme: 'gastrointestinal',
    accentColorVar: 'var(--gastrin)',
    related: [
      { id: 'gastrointestinal', why: 'the acid and hormones that prepare this meal upstream' },
      { id: 'liverPhysiology', why: 'the liver that makes the detergent this module spends' },
      { id: 'erythropoiesis', why: 'the anaemia that B12 and iron loss eventually cause' },
    ],
  },
  {
    id: 'inflammation',
    name: 'Inflammation',
    tagline: 'Acute response, resolution, and the conditions that prevent it',
    status: 'available',
    theme: 'haematology',
    accentColorVar: 'var(--danger)',
    related: [
      { id: 'immuneResponse', why: 'the adaptive arm that takes over once the acute wave recedes' },
      { id: 'thermoregulation', why: 'fever is the systemic price of one tissue\'s local war' },
      { id: 'shockStates', why: 'when the inflammatory cascade spills over into the circulation' },
    ],
  },
  {
    id: 'micturition',
    name: 'Micturition',
    tagline: 'Bladder filling, storage and the voluntary control of voiding',
    status: 'available',
    theme: 'renalFluids',
    accentColorVar: 'var(--o2)',
    related: [
      { id: 'renalTubular', why: 'what the nephron does with the filtrate before it reaches the bladder' },
      { id: 'autonomicNervous', why: 'the sympathetic and parasympathetic pathways that control the detrusor and sphincters' },
    ],
  },
  {
    id: 'reference',
    name: 'Formula Reference',
    tagline: 'High-yield equations & calculators for cardio, renal & respiratory',
    status: 'available',
    kind: 'reference',
  },
  {
    id: 'medications',
    name: 'Medications',
    tagline: 'The top-100 drug classes — mechanism, examples and the systems they change',
    status: 'available',
    theme: 'medications',
    accentColorVar: 'var(--raas)',
    kind: 'reference',
  },
];

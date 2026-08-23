/**
 * Definitions for the jargon on the readout tiles.
 *
 * Keyed by the tile's own label, normalised, so a module gains hover definitions without any
 * per-module change — `ReadoutItem` looks its own label up. Coverage therefore grows by adding
 * entries here rather than by editing twenty-six panels.
 *
 * Each definition answers two questions in order: what the number IS, and what it being
 * abnormal would mean. A glossary that only expands the acronym has told a learner nothing they
 * could not have guessed.
 */
export interface GlossaryEntry {
  /** Expanded name, when the label is an abbreviation. */
  expansion?: string;
  definition: string;
}

const ENTRIES: Record<string, GlossaryEntry> = {
  // --- Circulation ---
  'mean arterial pressure': {
    expansion: 'MAP',
    definition:
      'Time-averaged arterial pressure over a cardiac cycle, closer to diastolic than systolic because diastole lasts about twice as long. It is the pressure driving organ perfusion, which is why it is the number vasopressors are titrated to rather than the systolic.',
  },
  map: {
    expansion: 'Mean arterial pressure',
    definition:
      'Time-averaged arterial pressure over a cardiac cycle. Below roughly 60 mmHg organ perfusion is threatened, whatever the systolic reads.',
  },
  'cardiac output': {
    definition:
      'Blood ejected per minute — stroke volume times heart rate, normally about 5 L/min. Raising the rate does not raise output indefinitely, because filling time falls as rate climbs.',
  },
  'cardiac index': {
    definition:
      'Cardiac output divided by body surface area, so a large and a small patient can be compared. Below about 2.2 L/min/m² is the threshold for cardiogenic shock.',
  },
  'stroke volume': {
    definition:
      'Blood ejected in one beat, normally 70 mL. Set by preload, afterload and contractility, and the quantity Frank-Starling describes.',
  },
  'ejection fraction': {
    expansion: 'EF',
    definition:
      'Stroke volume as a fraction of end-diastolic volume. A ratio, so it says how completely the ventricle empties rather than how much blood it moves — which is why heart failure can occur with a normal one.',
  },
  cvp: {
    expansion: 'Central venous pressure',
    definition:
      'Filling pressure of the right heart. High in cardiogenic and obstructive shock, low in hypovolaemia — and misleadingly high in tamponade, where the heart is compressed from outside despite being underfilled.',
  },
  'wedge pressure': {
    definition:
      'Pulmonary capillary wedge pressure, a surrogate for left atrial filling pressure. Raised when blood dams back into the lungs, and the number that separates cardiogenic shock from a pulmonary embolism.',
  },
  svr: {
    expansion: 'Systemic vascular resistance',
    definition:
      'How constricted the arterioles are. Low in distributive shock (sepsis, anaphylaxis) and high wherever the circulation is compensating for a low output.',
  },
  'systemic resistance': {
    definition:
      'How constricted the arterioles are. Low in distributive shock and high wherever the circulation is clamping down to defend the pressure.',
  },
  'right atrial pressure': {
    definition:
      'Pressure where venous return meets the heart. It is both the output of the venous system and the input to the cardiac one, which is why the two curves are plotted against it.',
  },
  'stressed volume': {
    definition:
      'The part of the blood volume actually distending the vessels and generating pressure. Venoconstriction converts unstressed volume into stressed without adding a millilitre.',
  },
  'unstressed volume': {
    definition:
      'Blood filling the veins without stretching them, so it generates no pressure. A reservoir the sympathetic system can recruit.',
  },
  'svo₂': {
    expansion: 'Mixed venous oxygen saturation',
    definition:
      'How much oxygen comes back unused. Low when extraction is working hard against poor delivery; paradoxically HIGH in sepsis, where the tissue cannot extract what it is given.',
  },
  lactate: {
    definition:
      'The product of anaerobic metabolism, and the marker that tissue oxygen delivery has become inadequate. A raised lactate alongside a reassuring saturation is the combination that matters.',
  },

  // --- Respiratory and acid-base ---
  pao2: {
    expansion: 'Arterial oxygen tension',
    definition:
      'Dissolved oxygen tension, not content. Above about 60 mmHg the dissociation curve is flat and saturation barely moves; below it, small further falls cost a great deal.',
  },
  paco2: {
    expansion: 'Arterial carbon dioxide tension',
    definition:
      'Set by alveolar ventilation against CO2 production. The respiratory half of acid-base: it moves within minutes, where bicarbonate takes days.',
  },
  sao2: {
    expansion: 'Arterial oxygen saturation',
    definition:
      'What fraction of haemoglobin carries oxygen. Says how full the carriers are, not how many there are — which is why a profoundly anaemic patient can read 100%.',
  },
  ph: {
    definition:
      'Set by the RATIO of bicarbonate to dissolved CO2, not by either alone. A near-normal pH with two grossly abnormal components is compensation, not health.',
  },
  'hco3-': {
    expansion: 'Bicarbonate',
    definition:
      'The metabolic half of acid-base. Consumed by acid, generated by the kidney over days — which is why a raised value in a CO2 retainer is an answer rather than a problem.',
  },
  'anion gap': {
    definition:
      'Na minus chloride and bicarbonate, normally about 12. Widens only when an acid brings an unmeasured anion with it, which is what separates a ketoacidosis from a diarrhoeal one at identical pH.',
  },
  'a-a gradient': {
    expansion: 'Alveolar-arterial oxygen gradient',
    definition:
      'The difference between alveolar and arterial oxygen tension. Normal in hypoventilation, widened by V/Q mismatch, shunt or diffusion failure — so it separates a lung problem from a breathing problem.',
  },
  'minute ventilation': {
    definition:
      'Air moved per minute. Only the alveolar portion participates in gas exchange, which is why rapid shallow breathing can raise it while CO2 climbs.',
  },
  'tidal volume': {
    definition:
      'Volume of one breath, normally about 500 mL. Roughly a third of it never reaches alveoli.',
  },
  compliance: {
    definition:
      'Volume gained per unit of distending pressure — how easily the lung stretches. Low in fibrosis and ARDS. Must be measured at the plateau pressure, or airway resistance is counted as stiffness.',
  },
  'time constant': {
    definition:
      'Resistance times compliance: how long the lung takes to empty. Three of them empty 95% of a breath, which is the arithmetic behind breath stacking.',
  },

  // --- Renal and electrolytes ---
  gfr: {
    expansion: 'Glomerular filtration rate',
    definition:
      'Volume filtered by the glomeruli per minute, normally about 125 mL/min. Defended by autoregulation across a wide range of perfusion pressures.',
  },
  'urine osmolality': {
    definition:
      'How concentrated the urine is. The direct readout of ADH action on the collecting duct — dilute despite dehydration means diabetes insipidus.',
  },
  'free water clearance': {
    definition:
      'Net water excreted beyond what is needed to carry the solute. Negative means water is being retained, which is how a low sodium is defended or created.',
  },
  ttkg: {
    expansion: 'Transtubular potassium gradient',
    definition:
      'How hard aldosterone is driving potassium secretion, corrected for urinary concentration. Low in hyperkalaemia points at hypoaldosteronism.',
  },
  'serum k+': {
    definition:
      'Extracellular potassium, which is about 2% of the body total. It sets the resting membrane potential, so small serum changes have large electrical consequences while total body stores may be moving the other way.',
  },
  'total body k+': {
    definition:
      'Nearly all of it intracellular. Can be severely depleted while the serum value looks normal or high, which is exactly the trap in diabetic ketoacidosis.',
  },
  'serum na+': {
    definition:
      'A measure of TONICITY, not of sodium content or volume status. A low value usually means too much water rather than too little salt.',
  },
  'transcellular shift': {
    definition:
      'Potassium moving between cells and plasma without any entering or leaving the body. Driven by insulin, pH and beta agonists — the reason a serum potassium can fall dramatically within minutes.',
  },

  // --- Cardiac electrophysiology ---
  qtc: {
    expansion: 'Rate-corrected QT interval',
    definition:
      'QT adjusted for heart rate, since action potential duration genuinely shortens as rate rises. Above roughly 500 ms the risk of torsades climbs steeply.',
  },
  'pr interval': {
    definition:
      'Atrial onset to ventricular onset. Above 200 ms is first-degree block; the segment is flat because the AV node holds too little tissue to register at the surface.',
  },
  'resting potential': {
    definition:
      'The membrane voltage between action potentials, normally about -90 mV in cardiac muscle. Set mainly by the potassium gradient, which is why hyperkalaemia depolarises it.',
  },
  'safety factor': {
    definition:
      'How much more transmitter is released than is needed to fire the muscle fibre. Large in health, which is why a neuromuscular junction can lose most of its function before weakness appears.',
  },
  'train-of-four ratio': {
    definition:
      'Fourth twitch as a fraction of the first. Fade indicates a presynaptic or non-depolarising block; a depolarising block produces no fade at all.',
  },

  // --- Haematology and immunology ---
  'retic index': {
    expansion: 'Reticulocyte production index',
    definition:
      'Reticulocyte count corrected for anaemia and for early release. Above 2 the marrow is responding and the problem is destruction or loss; below 2 the marrow itself is the problem.',
  },
  mcv: {
    expansion: 'Mean corpuscular volume',
    definition:
      'Average red cell size. Small in iron deficiency, large in B12 and folate deficiency — the first fork in classifying an anaemia.',
  },
  ferritin: {
    definition:
      'Iron stores. Also an acute-phase protein, so a normal value does not exclude iron deficiency in an inflamed patient.',
  },
  'd-dimer': {
    definition:
      'A fibrin breakdown product, so it is raised only when clot has formed AND been broken down. Raised in DIC and normal in liver disease, which is what separates two otherwise identical coagulation screens.',
  },
  haptoglobin: {
    definition:
      'Binds free haemoglobin and is cleared with it, so it FALLS in haemolysis. The most specific routine marker that red cells are being destroyed rather than underproduced.',
  },
  tryptase: {
    definition:
      'Released from mast cell granules alongside histamine, so it rises only in a type I reaction. Falls within hours, which is why the sample must be taken early.',
  },
  'direct coombs': {
    definition:
      'Detects antibody sitting ON the red cell surface. Positive only where the antigen is fixed to the cell — the test that separates a type II reaction from an immune complex one.',
  },
  bnp: {
    expansion: 'B-type natriuretic peptide',
    definition:
      'Released by a stretched ventricle. High when a lung is wet from volume overload and normal when it is wet from leaking capillaries, which is the one row separating TACO from TRALI.',
  },

  // --- Neuro ---
  icp: {
    expansion: 'Intracranial pressure',
    definition:
      'Pressure inside the rigid skull, normally under 15 mmHg. Rises steeply once compensatory reserve is exhausted, because the Monro-Kellie relationship is exponential rather than linear.',
  },
  cpp: {
    expansion: 'Cerebral perfusion pressure',
    definition:
      'Mean arterial pressure minus intracranial pressure. Below about 50 mmHg autoregulation is exhausted and cerebral blood flow falls with pressure.',
  },
};

/** Normalises a readout label to a glossary key. */
function keyFor(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function lookupTerm(label: string): GlossaryEntry | undefined {
  return ENTRIES[keyFor(label)];
}

export const GLOSSARY = ENTRIES;

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
      'How much oxygen comes back unused. Low when extraction is working hard against poor delivery; paradoxically high in sepsis, where the tissue cannot extract what it is given.',
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
      'Set by the ratio of bicarbonate to dissolved CO2, not by either alone. A near-normal pH with two grossly abnormal components is compensation, not health.',
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
      'Binds free haemoglobin and is cleared with it, so it falls in haemolysis. The most specific routine marker that red cells are being destroyed rather than underproduced.',
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

  // --- Special senses ---
  acuity: {
    expansion: 'Snellen visual acuity',
    definition:
      'The smallest resolvable detail, written as a fraction of the distance at which a healthy eye solves it. Foveal cones set the ceiling (6/6 or better); rod-only vision collapses toward 6/60 no matter how dark-adapted.',
  },
  'right pupil': {
    definition:
      'Pupil diameter of the right eye, mm. Constricts to light through an afferent limb shared bilaterally and its own efferent parasympathetic supply — failure of either limb changes this number differently.',
  },
  'left pupil': {
    definition:
      'Pupil diameter of the left eye, mm. Equal to the right at rest and under illumination in either eye unless the efferent limbs differ.',
  },
  anisocoria: {
    definition:
      'Difference in diameter between the two pupils. Significant (>1.5 mm) anisocoria with preserved consensual response points at an efferent lesion — third-nerve palsy, anticholinergic, tonic pupil — not an afferent one.',
  },
  'perceived brightness': {
    definition:
      'Modelled brightness of the scene as the retina reports it. Falls when receptors are damaged or bleached even if the light itself is unchanged — sensitivity belongs to the detector as much as the stimulus.',
  },
  'glutamate release': {
    definition:
      'Transmitter output of the photoreceptors. Light reduces it (hyperpolarisation), and it is the fall that ON-bipolar cells read as light — the sign inversion at the heart of retinal processing.',
  },
  'rod drive': {
    definition:
      'Fraction of the retinal signal carried by rods. Zero above daylight because rods saturate, not because they are absent; near-total below moonlight, where cones cannot follow.',
  },
  'cone drive': {
    definition:
      'Fraction of the signal carried by cones. Owns photopic vision, colour and all useful acuity; fades out below moonlight whatever their integrity.',
  },
  'swinging torch': {
    definition:
      'Constriction achieved by whichever eye is currently illuminated, as a percentage. A weak score from one eye with a normal score from the other is a relative afferent pupillary defect.',
  },
  pta: {
    expansion: 'Pure-tone average',
    definition:
      'Mean air-conduction threshold at 0.5, 1 and 2 kHz. The single number that grades hearing loss severity, though the audiogram shape usually says more about cause than the average does.',
  },
  'air-bone gap': {
    definition:
      'How much worse air conduction is than bone conduction. Present only when sound is blocked before the cochlea — effusion, otosclerosis, ossicular disruption.',
  },
  'speech discrimination': {
    definition:
      'Percentage of words identified correctly at comfortable loudness. Preserved in conductive loss once volume is restored; degraded when inner hair cells distort what reaches the nerve.',
  },
  recruitment: {
    definition:
      'Abnormally fast growth of loudness past threshold, from loss of cochlear compression. The recruited ear is deaf to whispers yet intolerant of shouts — a cochlear, never a conductive, signature.',
  },
  weber: {
    definition:
      'Tuning fork on the vertex. Heard LOUDER in the blocked ear = conductive; heard better in the better ear = sensorineural; central = normal or equal loss.',
  },
  rinne: {
    definition:
      'Air versus bone conduction beside the ear. Normal is air > bone (positive); bone ≥ air (negative) means conductive loss on that side.',
  },
  'spontaneous nystagmus': {
    definition:
      'Nystagmus with no provocation, driven by firing imbalance between the two vestibular nerves. Beats away from a destructive lesion, toward an irritative one, and vanishes with compensation.',
  },
  vertigo: {
    definition:
      'The hallucination of motion produced by a vestibular firing mismatch read as head acceleration. Its intensity tracks the imbalance, so central compensation quiets it without repairing anything.',
  },
  'vor gain': {
    expansion: 'Vestibulo-ocular reflex gain',
    definition:
      'Eye velocity divided by head velocity during a turn; ~1 keeps gaze locked on the world. Mechanical and irrecoverable after nerve loss even once vertigo has compensated away.',
  },
  'head impulse': {
    definition:
      'Brief high-acceleration turn while the patient fixates. A corrective saccade at the end betrays VOR gain <0.75 — positive in unilateral loss even when fully compensated.',
  },
  'positional nystagmus': {
    definition:
      'Nystagmus provoked by the Dix-Hallpike position. Latency then fatigability = BPPV (canalith debris, mechanical). Immediate and non-fatiguing = central.',
  },
  'romberg unsteadiness': {
    definition:
      'Fall tendency with eyes closed. Vestibular (especially otolith) failure makes vision indispensable, so unsteadiness worsens dramatically in the dark.',
  },
  'pain score': {
    definition:
      'Perceived pain on a 0-10 scale — an output of dorsal-horn transmission cells after gating, not a measure of tissue damage. Rubbing, descending modulation and opioids lower it without touching the injury.',
  },
  gate: {
    definition:
      'Fraction of nociceptive traffic allowed through the dorsal horn. Opened by C-fibre input, closed by Aβ touch fibres, rubbing, descending modulation and opioid action.',
  },
  'touch below': {
    definition:
      'Light touch preserved below the cord lesion, per side. Travels in the dorsal columns IPSILATERALLY to the cortex, so loss here marks the same side as the lesion.',
  },
  'pain/temp below': {
    definition:
      'Pinprick and temperature preserved below the lesion, per side. Spinothalamic fibres crossed already at entry, so loss here marks the opposite side — the Brown-Séquard dissociation.',
  },
  'segmental pain/temp': {
    definition:
      'Pain/temperature preserved AT the syrinx level, where crossing fibres are picked off in front of the dilated canal. Cape-like arm involvement with legs spared until late.',
  },
  'initiation latency': {
    definition:
      'Time from command to movement onset. Dopamine-dependent: triples in advanced parkinsonism while cerebellar, pyramidal and tremor syndromes leave it untouched.',
  },
  'resting tremor': {
    definition:
      '4-6 Hz tremor with the limb supported and no voluntary task — the parkinsonian oscillator, suppressed by movement and by dopamine restoration.',
  },
  'intention tremor': {
    definition:
      'Tremor appearing only during voluntary action, worsening as the target nears, with dysmetria. Cerebellar, with initiation and tone normal.',
  },
  'postural tremor': {
    definition:
      'Tremor holding a position against gravity — essential tremor territory. Eased by alcohol and beta-blockade, unlike every other tremor class.',
  },
  'involuntary movement': {
    definition:
      'Chorea plus ballism amplitude: movement RELEASED by loss of indirect-pathway braking rather than produced by weakness or tremor. Random, continuous, invading a normally-initiating system.',
  },

  // --- Liver ---
  'total bilirubin': {
    definition:
      'Sum of both pigment pools in plasma. Visible jaundice past roughly 40 µmol/L; the total alone never tells you where it is failing — the split does.',
  },
  unconjugated: {
    definition:
      'Indirect bilirubin: albumin-bound, lipid-soluble, unable to enter urine but able to enter the brain. Rises with haemolysis or failed conjugation (Gilbert, Crigler-Najjar, the newborn).',
  },
  conjugated: {
    definition:
      'Direct bilirubin: water-soluble after UGT conjugation. Spills into urine once plasma passes the renal threshold — its presence means hepatocellular regurgitation or obstructed outflow.',
  },
  'conjugated fraction': {
    definition:
      'Conjugated as a percentage of total bilirubin. Under 20% points upstream of the liver; over 55% points at drainage or ducts; between lies the mixed picture.',
  },
  'urine bilirubin': {
    definition:
      'Dipstick for conjugated pigment. Absent in deep unconjugated jaundice (it cannot cross into urine) — a negative strip in a yellow patient is itself localising information.',
  },
  'urine urobilinogen': {
    definition:
      'Flora convert gut bilirubin to urobilinogen; some reabsorbs and reaches urine. High when haemolysis floods an open pathway; absent when obstruction stops bile reaching the gut at all.',
  },
  'stool colour': {
    definition:
      'Stercobilin from gut bilirubin. Pale (acholic) stool means bile is not arriving — surgical jaundice until proven otherwise.',
  },
  ammonia: {
    definition:
      'Gut-derived nitrogen the liver should convert to urea. Rising levels track failing hepatic mass and correlate with encephalopathy grade better than jaundice does.',
  },
  'kernicterus risk': {
    definition:
      'Unbound unconjugated bilirubin relative to albumin binding capacity — the fraction that can cross the neonatal blood-brain barrier. Albumin IS the defence, which is why hypoalbuminaemia multiplies risk.',
  },

  // --- Pregnancy ---
  'maternal haemoglobin': {
    definition:
      'In pregnancy, falls by dilution: plasma expands ~45% while red cell mass gains ~25%. Trough near 30 weeks around 11 g/dL is physiological, not deficiency.',
  },
  'maternal cardiac output': {
    definition:
      'Rises toward +40% by mid-pregnancy via stroke volume first, then rate. Remains elevated briefly postpartum before normalising.',
  },
  'maternal map': {
    definition:
      'Mean arterial pressure dips in mid-pregnancy under low SVR. A rise after mid-gestation signals a placental problem, not a cardiovascular triumph.',
  },
  'maternal creatinine': {
    definition:
      'Falls through pregnancy as GFR rises ~50%. A value of 0.9 mg/dL that reads "normal" on adult ranges may represent real renal impairment in a term woman.',
  },
  progesterone: {
    definition:
      'Drives the hyperventilation of pregnancy, smooth-muscle relaxation everywhere, and blocks milk secretion until it withdraws after delivery.',
  },
  prolactin: {
    definition:
      'Primed through pregnancy, unopposed after the placenta leaves, then sustained only by suckling. Supply follows demand because production follows this signal.',
  },
  oxytocin: {
    definition:
      'Contracts the uterus in labour (via the Ferguson stretch reflex) and ejects stored milk within seconds of a feed. Ejection and production are different hormones on different clocks.',
  },

  // --- Anterior pituitary ---
  gh: {
    expansion: 'Growth hormone',
    definition:
      'Pulsatile pituitary hormone acting largely through hepatic IGF-1. Regulated by the hypothalamus — which is why a glucose load suppresses it in health, and fails to in acromegaly.',
  },
  'igf-1': {
    expansion: 'Insulin-like growth factor 1',
    definition:
      'The liver-made integrator of GH over days; the screening value of choice because random GH pulses mislead. Above roughly 320 ng/mL with unsuppressible GH, acromegaly is confirmed.',
  },
  'pituitary prolactin': {
    definition:
      'The one anterior hormone under tonic inhibition (dopamine). Rises moderately with stalk compression, drugs or TRH drive; into the hundreds only with a secretoma.',
  },
  'glucose suppression test': {
    definition:
      '75 g oral glucose should drive GH below 1 ng/mL. Failure to suppress is diagnostic of autonomous GH secretion — acromegaly before any imaging.',
  },
  'dopamine brake': {
    definition:
      'Effective inhibition reaching the lactotroph: hypothalamic tone × receptor function × stalk patency. Drugs attack the receptor; any sellar mass attacks the stalk.',
  },
  'sellar mass': {
    definition:
      'Volume proxy for whatever occupies the fossa. Past roughly 1.5 cm of upward extension it threatens the chiasma (bitemporal fields) and compresses the portal stalk.',
  },
  'gonadal axis': {
    definition:
      'Prolactin above ~30 suppresses GnRH: LH and FSH fall next. Amenorrhoea and low libido are therefore often the presenting complaint of a silent prolactinoma.',
  },
  'somatic effect': {
    definition:
      'Height velocity while epiphyses stay open (gigantism); acral tissue overgrowth once they fuse (acromegaly). Same excess, different skeleton.',
  },

  // --- Adrenal cortex ---
  cortisol: {
    definition:
      'The glucocorticoid output of the fasciculata. Needs every enzyme on the line, so any block lowers it — and the resulting ACTH surge drives precursor pile-up behind the block.',
  },
  mineralocorticoid: {
    definition:
      'Combined salt-retaining activity: aldosterone plus weak DOC effect. Low means salt-wasting crisis; high without aldosterone means DOC is doing it, with hypertension.',
  },
  androgens: {
    definition:
      'Adrenal sex-steroid output. Rise when flux diverts around a 21 or 11β block; vanish with 17α or 3β-HSD failure — the axis that separates virilising from undervirilising CAH.',
  },
  '17-ohp marker': {
    expansion: '17-hydroxyprogesterone',
    definition:
      'The substrate trapped immediately before 21-hydroxylase. High only in 21-OH deficiency — which is why newborn screening measures it.',
  },
  'doc excess': {
    expansion: '11-deoxycorticosterone',
    definition:
      'Weak mineralocorticoid that accumulates when 11β or 17α is blocked. Enough of it causes hypertension without salt-wasting.',
  },
  'acth drive': {
    definition:
      'Pituitary demand amplified by cortisol deficit. It flogs the blocked gland, which is why precursors accumulate — and why replacement therapy treats the biochemistry twice over.',
  },
  'crisis risk': {
    definition:
      'Addisonian crisis likelihood from effective cortisol coverage. Illness multiplies requirement; replacement plus stress-dosing closes the gap.',
  },

  // --- Adrenal medulla ---
  'catecholamine map': {
    definition:
      'Driven here by alpha-mediated vasoconstriction. Beta-blockade without alpha cover removes beta2 dilatation and sends MAP higher than no treatment at all.',
  },
  'heart rate': {
    definition:
      'Beta1 chronotropy minus baroreflex braking. Adrenaline-predominant tumours push it hard; noradrenaline raises pressure that reflexly slows the node.',
  },
  'orthostatic drop': {
    definition:
      'Fall in pressure on standing from contracted plasma volume — weeks of vasoconstriction leak volume away. Hypertension with postural hypotension smells like phaeochromocytoma.',
  },
  'arrhythmia risk': {
    definition:
      'Beta-driven irritability, worsened when beta-blockade is given without alpha cover, and lowered by proper sequential blockade.',
  },
  'classical triad': {
    definition:
      'Headache, sweating, palpitations — each tracks a different catecholamine action. All three together makes phaeochromocytoma near-certain until metanephrines say otherwise.',
  },
  paroxysm: {
    definition:
      'A burst of secretion clearing within minutes. Events rather than states — which is why patients describe attacks and why metanephrines beat random sampling.',
  },

  // --- Blood groups ---
  crossmatch: {
    definition:
      'The laboratory meeting of recipient serum against donor cells. Major mismatch means preformed antibodies will destroy the unit — the check that stands between routine therapy and disaster.',
  },
  'reaction arm': {
    definition:
      'Immediate intravascular IgM (ABO) versus delayed extravascular IgG (Rh): different antibodies, different speeds, different clinical syndromes.',
  },
  haemolysis: {
    definition:
      'Destruction of the transfused cells. Severity scales with incompatible volume infused — stopping at ten millilitres aborts the entire syndrome.',
  },
  'free haemoglobin': {
    definition:
      'Haemoglobin released directly into plasma by intravascular lysis — the ABO signature, absent or minimal in extravascular (Rh) clearance.',
  },
  'complement consumed': {
    definition:
      'IgM fixing complement on transfused cells uses the cascade up. Its consumption marks an intravascular event and drives the shock physiology.',
  },
  'dic risk': {
    definition:
      'Disseminated intravascular coagulation triggered by massive haemolysis — the reason severe ABO reactions bleed and clot simultaneously.',
  },
  'renal injury': {
    definition:
      'Acute tubular damage from free haemoglobin plus shock. The consequence fluids are given for, and the reason early recognition matters more than anything downstream.',
  },
  haemoglobinuria: {
    definition:
      'Free haemoglobin spilling into urine past haptoglobin capacity — the dark urine of an acute reaction, and never present in uncomplicated extravascular clearance.',
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

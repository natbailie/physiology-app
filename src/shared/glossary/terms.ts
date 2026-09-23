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

  // --- Autonomic ---
  'autonomic balance': {
    definition:
      'Net sympathetic minus parasympathetic drive on a single axis. Useful because most organs receive both and the resting state of each is set by which one dominates there — the heart is vagally braked at rest, the arterioles have almost no parasympathetic supply at all.',
  },
  'gut motility': {
    definition:
      'Peristaltic and secretory activity in the gut, driven by the vagus. It falls with sympathetic activity, which is why fight-or-flight and an ileus after surgery are the same physiology at different intensities.',
  },
  pupil: {
    definition:
      'Pupil diameter. Dilator muscle is sympathetic (alpha-1), constrictor is parasympathetic (muscarinic, via cranial nerve III), so the pupil reports on both arms at once and is why it is checked in every unconscious patient.',
  },
  'bronchial calibre': {
    definition:
      'Airway diameter as a percentage of resting. Constriction is muscarinic and dilatation is beta-2, which is exactly why an inhaler is a beta-2 agonist and ipratropium is a muscarinic blocker.',
  },
  secretions: {
    definition:
      'Salivary, lacrimal and gastrointestinal secretion, almost entirely parasympathetic. The dry mouth of anxiety and the dry mouth of an anticholinergic drug arrive by the same route, from opposite ends.',
  },
  'alpha-1': {
    definition:
      'Activation of the alpha-1 adrenoceptor — vascular smooth muscle constriction, pupillary dilatation, sphincter tone. The receptor noradrenaline acts on to raise blood pressure, and the one prazosin blocks.',
  },
  'beta-1': {
    definition:
      'Activation of the beta-1 adrenoceptor — cardiac rate, contractility and conduction, plus renin release. Cardioselective beta-blockers aim here and spare beta-2, which is what makes them tolerable in mild asthma.',
  },
  'beta-2': {
    definition:
      'Activation of the beta-2 adrenoceptor — bronchodilatation, vasodilatation in skeletal muscle, uterine relaxation, glycogenolysis. Adrenaline reaches it and noradrenaline barely does, which is the main functional difference between the two.',
  },
  muscarinic: {
    definition:
      'Activation of muscarinic acetylcholine receptors — the parasympathetic effector everywhere except the sweat glands and the neuromuscular junction. Atropine blocks these, which is why it does everything at once: dry, hot, dilated, tachycardic.',
  },

  // --- Blood groups and haemolytic disease ---
  'fetal haemoglobin': {
    definition:
      'Haemoglobin concentration in the fetus. Maternal anti-D crossing the placenta destroys fetal red cells, and this falling is the primary event in haemolytic disease of the newborn — everything else on the panel follows from it.',
  },
  'cord bilirubin': {
    definition:
      'Bilirubin in cord blood at delivery. Before birth the placenta clears it and the fetus stays yellow-free despite brisk haemolysis; after birth an immature liver cannot, and unconjugated bilirubin crossing into the basal ganglia is kernicterus.',
  },
  'hydrops risk': {
    definition:
      'Probability of fetal hydrops — generalised oedema, ascites and effusions from high-output failure on top of severe anaemia. The end point severe haemolytic disease reaches if it is not interrupted by transfusion.',
  },
  'next pregnancy risk': {
    definition:
      'Chance that this delivery sensitises the mother, so that a subsequent Rh-positive fetus is attacked. It is the number anti-D prophylaxis exists to zero, and the reason a first affected pregnancy is usually the second one.',
  },

  // --- Calcium ---
  'serum calcium': {
    definition:
      'Total plasma calcium, about half of it bound to albumin and only the ionised half physiologically active. That split is why a low albumin gives a low total with a normal ionised calcium, and why alkalosis causes tetany without changing the total at all.',
  },
  'serum phosphate': {
    definition:
      'Plasma phosphate. It moves OPPOSITE to calcium under PTH — which drives it into the urine — and WITH calcium under calcitriol, which absorbs both from gut. That pair of behaviours separates hyperparathyroidism from vitamin D excess.',
  },
  pth: {
    expansion: 'Parathyroid hormone',
    definition:
      'The minute-to-minute defender of ionised calcium: it resorbs bone, reabsorbs calcium and wastes phosphate in the kidney, and activates vitamin D. Secreted in response to a calcium-sensing receptor, so it is suppressed by a high calcium from any cause other than itself.',
  },
  calcitriol: {
    expansion: '1,25-dihydroxyvitamin D',
    definition:
      'Active vitamin D, made in the kidney under PTH. It is the only mechanism that absorbs calcium from the gut, which is why renal failure causes hypocalcaemia and why the kidney, not the skin or liver, is the step that limits it.',
  },
  calcitonin: {
    definition:
      'Thyroid C-cell hormone that lowers calcium by inhibiting osteoclasts. Physiologically minor in adults — thyroidectomy causes no calcium disorder — but useful pharmacologically and as a tumour marker for medullary thyroid carcinoma.',
  },
  'bone resorption': {
    definition:
      'Osteoclast activity releasing calcium and phosphate from bone. The fastest of the three calcium sources; gut absorption takes days and renal reabsorption is limited by filtered load, so acute defence of calcium is bone.',
  },
  'gut ca absorption': {
    definition:
      'Fraction of dietary calcium absorbed, set almost entirely by calcitriol. It rises steeply when intake is low — which is why calcium balance is defended over a wide range of diets, and why the failure mode is renal rather than dietary.',
  },
  'ca × po4 product': {
    definition:
      'Calcium multiplied by phosphate. Above roughly 55 mg²/dL² the two precipitate in soft tissue — vessels, cornea, skin — which is the mechanism of vascular calcification in chronic kidney disease and the reason phosphate is controlled there.',
  },

  // --- Capillary exchange ---
  'capillary pressure': {
    definition:
      'Hydrostatic pressure inside the capillary, the force pushing fluid out. It falls along the capillary and is set far more by the arteriolar sphincter upstream than by arterial pressure, which is why the capillary bed is protected from a hypertensive surge.',
  },
  'interstitial pressure': {
    definition:
      'Hydrostatic pressure in the tissue space, normally slightly NEGATIVE — the lymphatics hold the interstitium under mild suction. That negativity is a safety factor: fluid must fill it before pressure rises and oedema appears.',
  },
  'plasma oncotic': {
    definition:
      'Colloid osmotic pressure of plasma proteins, mostly albumin, pulling fluid back in. About 25 mmHg, and the only substantial inward force in Starling’s equation, which is why hypoalbuminaemia causes oedema.',
  },
  'interstitial oncotic': {
    definition:
      'Colloid osmotic pressure of protein that has leaked into the tissue, pulling fluid outward. Normally small; it rises sharply when capillaries become leaky, which is why inflammatory oedema resists albumin infusion.',
  },
  'net filtration pressure': {
    definition:
      'The four Starling forces added together. Positive means fluid leaves the capillary, negative means it returns. Normally slightly positive overall — the body filters a little more than it reabsorbs and the lymphatics carry away the difference.',
  },
  'filtration rate': {
    definition:
      'Volume leaving the capillary per minute, net filtration pressure times permeability. About 20 L/day across the whole body, of which the lymphatics return the 2–4 L that the venous end does not.',
  },
  'lymph flow': {
    definition:
      'Rate at which the lymphatics clear filtered fluid and leaked protein. The only route by which protein leaves the interstitium, which is why lymphatic obstruction causes a high-protein oedema that does not pit easily.',
  },
  'lymphatic reserve': {
    definition:
      'How much more the lymphatics could carry before they are saturated. They can increase flow roughly tenfold, and oedema appears only once filtration exceeds that — which is why a modest rise in venous pressure causes none at all.',
  },
  'interstitial volume': {
    definition:
      'Fluid held in the tissue space. It is already about 10.5 L at baseline, so clinically obvious oedema is a small percentage change against a large number — read the excess beside it rather than this.',
  },
  oedema: {
    definition:
      'Excess interstitial fluid. It becomes visible only after roughly 2–3 L has accumulated, which is why "no oedema" is compatible with substantial fluid overload, and why weight is a better early measure than inspection.',
  },
  'safety factor left': {
    definition:
      'How much further capillary pressure could rise before fluid accumulates. It is the sum of three protections — rising interstitial pressure, falling interstitial oncotic pressure and rising lymph flow — which together buy about 17 mmHg.',
  },
  'plasma volume': {
    definition:
      'Circulating fluid inside the vessels. It falls when filtration outruns lymphatic return, so a patient can be oedematous and intravascularly depleted at the same time — the trap in giving diuretics for the swelling.',
  },

  // --- Cardiac mechanics ---
  edv: {
    expansion: 'End-diastolic volume',
    definition:
      'Ventricular volume at the end of filling, normally about 120 mL. It is the preload the Frank-Starling relationship acts on, and the denominator of ejection fraction.',
  },
  esv: {
    expansion: 'End-systolic volume',
    definition:
      'Ventricular volume left after ejection, normally about 50 mL. Set by contractility and afterload; a rising ESV with an unchanged EDV is failing contractility rather than inadequate filling.',
  },
  'lv pressure': {
    definition:
      'Pressure inside the left ventricle through the cardiac cycle. It crosses aortic pressure to open the valve and falls below atrial pressure to open the mitral valve — the two crossings that define the four phases of the loop.',
  },
  'lv volume': {
    definition:
      'Left ventricular volume through the cycle. Constant during both isovolumetric phases, which is what makes the pressure-volume loop a rectangle rather than a curve at those two edges.',
  },

  // --- Cardiorenal ---
  'urine output': {
    definition:
      'Rate of urine formation. Below about 0.5 mL/kg/h is oliguria, and it is the earliest bedside sign that renal perfusion is failing — the kidney defends filtration long before creatinine moves.',
  },
  'raas activity': {
    expansion: 'Renin-angiotensin-aldosterone system',
    definition:
      'Activation of the pressure- and volume-defending axis: renin from the juxtaglomerular cells, angiotensin II constricting arterioles, aldosterone retaining sodium. Appropriate in haemorrhage and harmful in heart failure, which is why it is the main drug target there.',
  },
  'anp activity': {
    expansion: 'Atrial natriuretic peptide',
    definition:
      'Hormone released by stretched atria that excretes sodium and water and opposes the RAAS. Its level tracks filling pressure, which is why BNP — the same family — is used to identify heart failure as the cause of breathlessness.',
  },

  // --- Cell cycle ---
  'current phase': {
    definition:
      'Which phase the cell is in — G1, S, G2, M or G0. Only S and M actually do anything irreversible; the gaps exist to check that the previous step succeeded, which is why they are where the checkpoints sit.',
  },
  'doubling time': {
    definition:
      'How long the population takes to double, given the current cycling fraction and cycle length. Infinite when nothing is cycling. Tumour doubling time depends far more on the cycling fraction and cell loss than on how fast an individual cell divides.',
  },
  'cyclin d drive': {
    definition:
      'Growth-factor signal driving the cell past the restriction point in late G1, through cyclin D–CDK4/6 and Rb phosphorylation. Past that point the cell no longer needs the growth factor — which is why constitutive cyclin D signalling is a common oncogenic route.',
  },
  'p53 activity': {
    definition:
      'Activation of the damage-response transcription factor. It arrests the cycle to allow repair, and triggers apoptosis when the damage is too great. Lost in more than half of human cancers, which is why it is called the guardian of the genome.',
  },
  'lesion load': {
    definition:
      'Unrepaired DNA damage carried by the population. It is what p53 responds to; a cell that divides with this above threshold passes the damage on, which is the mutational step behind malignant transformation.',
  },
  apoptosis: {
    definition:
      'Fraction of the cohort undergoing programmed cell death. Unlike necrosis it is silent — the cell packages itself for phagocytosis without inflammation — and it is the intended endpoint of most cytotoxic chemotherapy.',
  },

  // --- Cerebral perfusion ---
  'cerebral blood flow': {
    definition:
      'Perfusion of brain tissue, normally about 50 mL/100 g/min. Below 20 the EEG flattens and below 10 the tissue infarcts — the gap between those two is the ischaemic penumbra that reperfusion is trying to save.',
  },
  'reserve remaining': {
    definition:
      'How much more volume can be added intracranially before pressure rises steeply. The Monro-Kellie doctrine in one number: CSF and venous blood are displaced first, and once they are gone the compliance is exhausted.',
  },
  elastance: {
    definition:
      'The pressure cost of adding one more millilitre inside the skull. It is the SLOPE of the pressure-volume curve, so it rises long before the pressure itself does — which is why a normal ICP does not mean there is room to spare.',
  },
  'cerebral blood volume': {
    definition:
      'Blood held inside the cranium at any moment. It rises with vasodilatation, which is why a high CO2 raises intracranial pressure and why controlled hyperventilation lowers it — briefly.',
  },
  'csf excess': {
    definition:
      'Cerebrospinal fluid accumulated above normal. Produced at about 0.35 mL/min regardless of pressure, so obstruction to its absorption raises volume relentlessly — production does not switch off.',
  },
  'vasogenic oedema': {
    definition:
      'Fluid crossing a broken blood-brain barrier into the extracellular space, chiefly white matter. It is the oedema of tumours and abscesses, and the one that responds to steroids — cytotoxic oedema does not.',
  },
  autoregulation: {
    definition:
      'Whether cerebral flow is still being held constant across changing perfusion pressure. Intact over roughly 50–150 mmHg; once lost, flow follows pressure passively, so every swing in blood pressure becomes a swing in brain perfusion.',
  },

  // --- Coagulation ---
  pt: {
    expansion: 'Prothrombin time',
    definition:
      'Time to clot after adding tissue factor: the EXTRINSIC and common pathways — factors VII, X, V, II, fibrinogen. Factor VII has the shortest half-life, which is why the PT is the first test to move in liver disease and on warfarin.',
  },
  inr: {
    expansion: 'International normalised ratio',
    definition:
      'The PT expressed as a ratio corrected for reagent sensitivity, so a result means the same in any laboratory. Standardised precisely because warfarin dosing depends on it; the target is 2–3 for most indications.',
  },
  aptt: {
    expansion: 'Activated partial thromboplastin time',
    definition:
      'Time to clot on contact activation: the INTRINSIC and common pathways — XII, XI, IX, VIII and downstream. Prolonged in haemophilia and by heparin, and the counterpart to the PT in localising a factor deficiency.',
  },
  'bleeding time': {
    definition:
      'How long a standardised skin cut bleeds. It tests PLATELETS and vessel wall rather than the coagulation cascade, which is why it is prolonged in von Willebrand disease and thrombocytopenia while the PT and APTT are normal.',
  },
  platelets: {
    definition:
      'Circulating platelet count, normally 150–400 ×10⁹/L. Spontaneous bleeding is unusual above 50 and expected below 10 — the count matters far less than that threshold, and function can be lost at a normal count.',
  },
  fibrinogen: {
    definition:
      'The substrate thrombin converts to fibrin. An acute-phase protein, so it RISES in inflammation; a low fibrinogen in a sick patient therefore means consumption — disseminated intravascular coagulation until proven otherwise.',
  },
  thrombin: {
    definition:
      'Peak of the thrombin burst. Thrombin is the convergence of the whole cascade: it makes fibrin, activates platelets, activates factors V, VIII and XI, and — through protein C — switches itself off.',
  },
  'clot strength': {
    definition:
      'Mechanical strength of the formed clot, from fibrin cross-linking by factor XIII and platelet contraction. A clot can form at a normal PT and still be too weak to hold, which is what viscoelastic testing measures and the standard tests miss.',
  },
  'time to clot': {
    definition:
      'How long the sample took to form a clot at all. The single most direct measure here, and the one that separates a laboratory abnormality from a bleeding patient.',
  },

  // --- Coronary circulation ---
  'flow reserve': {
    definition:
      'How many times resting flow the coronary bed can still deliver at maximal vasodilatation. Normally about four to five times; a lesion that has consumed the reserve produces angina on exertion while resting flow stays normal.',
  },
  'maximal supply': {
    definition:
      'The most flow this coronary bed could deliver if fully dilated, as a multiple of resting. Set by the stenosis, the collaterals and the oxygen content of the blood — anaemia lowers it without any narrowing at all.',
  },
  ischaemia: {
    definition:
      'The shortfall of supply against demand. Ischaemia is reversible and infarction is not; the tile beside this one says how much has already crossed over.',
  },
  'diastolic window': {
    definition:
      'Fraction of the cardiac cycle spent in diastole, which is when the left ventricle is actually perfused — systolic compression stops subendocardial flow. Tachycardia shortens diastole disproportionately, so it raises demand and cuts supply at the same time.',
  },
  'driving head': {
    definition:
      'Aortic diastolic pressure minus the pressure the vessel is being squeezed at. It is the true perfusion pressure of the coronary bed, which is why aortic regurgitation — with its low diastolic pressure — causes angina with clean arteries.',
  },
  'wall stress': {
    definition:
      'Tension in the ventricular wall, by Laplace proportional to pressure times radius over thickness. A major determinant of oxygen demand, and the reason a dilated ventricle is metabolically expensive and hypertrophy is initially protective.',
  },
  'functional contractility': {
    definition:
      'Contractility actually achieved, after ischaemia and infarction are subtracted from the intrinsic value. Ischaemic myocardium stops contracting within seconds — long before it dies — which is stunning and hibernation, and it recovers if flow returns.',
  },
  'infarcted territory': {
    definition:
      'Percentage of myocardium irreversibly dead. Unlike ischaemia this does not come back, and the number is the strongest single predictor of what the ventricle will do afterwards.',
  },

  // --- Digestion and absorption ---
  'fat uptake': {
    definition:
      'Percentage of dietary fat absorbed. It needs pancreatic lipase, bile salts and an intact mucosa in series, so failure of any one produces steatorrhoea — and the faecal fat figure beside it cannot say which.',
  },
  'bile salt pool': {
    definition:
      'Total circulating bile salts, recycled through the enterohepatic circulation several times per meal. The liver only replaces what is lost, so ileal disease — which loses them — depletes the pool far faster than liver disease does.',
  },
  emulsification: {
    definition:
      'How effectively bile salts have broken fat into micelles. Lipase is water-soluble and fat is not, so this step sets the surface area the enzyme can work on — without it, lipase is present and useless.',
  },
  'lactose uptake': {
    definition:
      'Percentage of dietary lactose hydrolysed and absorbed. Lactase is on the brush border and is the first disaccharidase lost in any mucosal injury, which is why transient lactose intolerance follows gastroenteritis.',
  },
  'stool water': {
    definition:
      'Water in stool per day. Above about 200 mL is diarrhoea. The colon can reabsorb several litres a day, so diarrhoea means either that capacity is exceeded or that the colon itself is secreting.',
  },
  'osmotic gap': {
    definition:
      'Whether unabsorbed solute is holding water in the lumen. A HIGH gap is osmotic diarrhoea, which stops with fasting; a LOW gap is secretory, which does not. That single distinction organises the whole differential.',
  },
  'b12 store': {
    definition:
      'Vitamin B12 reserve. Absorbed only in the terminal ileum and only bound to intrinsic factor, so it fails in pernicious anaemia and after ileal resection. Stores last years, which is why the deficiency appears long after the cause.',
  },
  'iron store': {
    definition:
      'Body iron reserve. Absorbed in the duodenum and regulated at absorption rather than excretion — there is no route to excrete iron — which is why overload is as much a disease as deficiency.',
  },
  nutrition: {
    definition:
      'Overall nutritional status, drifting toward whatever absorption is actually delivering. It lags the absorption numbers above by weeks, which is why a malabsorption syndrome presents late and with weight loss rather than with symptoms of any one deficiency.',
  },

  // --- ECG ---
  segment: {
    definition:
      'Which part of the ECG complex is being inscribed right now — P, PR, QRS, ST or T. Each corresponds to a specific electrical event, and matching the waveform to the event is what makes the trace readable rather than memorised.',
  },
  voltage: {
    definition:
      'Instantaneous ECG deflection in the displayed lead. A lead records the projection of the heart’s dipole onto its own axis, so the same beat is positive in one lead and negative in another — that is the basis of axis determination.',
  },
  'qrs duration': {
    definition:
      'Time for ventricular depolarisation, normally under 120 ms. Widening means the impulse is spreading muscle-to-muscle rather than through the His-Purkinje system — bundle branch block, a ventricular origin, or hyperkalaemia.',
  },
  qt: {
    definition:
      'Start of the QRS to the end of the T wave: the whole of ventricular depolarisation and repolarisation. It shortens as heart rate rises, which is why the raw value is nearly uninterpretable without correction.',
  },
  'qtc (bazett)': {
    definition:
      'QT corrected for heart rate by Bazett’s formula (QT divided by the square root of the RR interval). Above about 460 ms predisposes to torsades de pointes, which is why it is checked before starting many common drugs.',
  },
  'atrial rate': {
    definition:
      'Rate of atrial depolarisation. It is the same as the ventricular rate only while conduction is 1:1 — in flutter and in heart block the two diverge, and comparing them is how the block is identified.',
  },
  'ventricular rate': {
    definition:
      'Rate at which the ventricles actually depolarise, which is what determines cardiac output and what the pulse reports. In atrial fibrillation it is irregular and the mean is the useful figure.',
  },
  'mean qrs axis': {
    definition:
      'Average direction of ventricular depolarisation in the frontal plane, normally −30° to +90°. It shifts toward hypertrophy and away from infarction, so it is a cheap structural clue in an electrical recording.',
  },
  rhythm: {
    definition:
      'Whether the beats are regular, and what is driving them. Regularity plus the presence and relation of P waves classifies almost every arrhythmia before any measurement is made.',
  },

  // --- Electrolytes ---
  'effective osmolality': {
    definition:
      'Osmolality from solutes that cannot cross cell membranes — chiefly sodium and glucose. Urea raises measured osmolality without shifting water, which is why uraemia is hyperosmolar but not hypertonic, and why this figure and the measured one differ.',
  },
  'ecf volume': {
    definition:
      'Extracellular fluid volume, about a third of total body water. Sodium CONTENT sets it, while sodium CONCENTRATION sets tonicity — the single most confused pair in electrolyte physiology, and the reason a hyponatraemic patient may be dry, normal or overloaded.',
  },
  'na+ excretion': {
    definition:
      'Sodium leaving in the urine per day. In steady state it equals intake; a value that does not is the kidney actively changing extracellular volume, which takes days to complete.',
  },
  'na+ change rate': {
    definition:
      'How fast plasma sodium is moving. The rate matters more than the value: correcting chronic hyponatraemia faster than about 8–10 mEq/L/day risks osmotic demyelination, because the brain has already adapted to the low sodium.',
  },
  'brain-adapted na+': {
    definition:
      'The sodium concentration the brain has adjusted its own osmolytes to. When plasma sodium is corrected past this too quickly, water leaves brain cells that are no longer able to hold it — which is the mechanism of osmotic demyelination.',
  },

  // --- Enzyme kinetics ---
  'reaction rate': {
    definition:
      'Velocity of the enzyme-catalysed reaction at the current substrate concentration. The quantity Michaelis-Menten predicts, and the one every inhibition pattern is read from.',
  },
  'apparent km′': {
    definition:
      'Substrate concentration giving half-maximal velocity, as it appears under the current inhibitor. Km is an inverse measure of affinity, and it is RAISED by competitive inhibition and unchanged by non-competitive — which is how the two are told apart.',
  },
  'apparent vmax′': {
    definition:
      'Maximum velocity under the current conditions. Unchanged by competitive inhibition, because enough substrate still outcompetes the inhibitor, and reduced by non-competitive and irreversible inhibition, which remove functional enzyme.',
  },
  'site saturation': {
    definition:
      'Fraction of active sites currently occupied by substrate. At Km it is 50% by definition; the rate becomes zero-order once it approaches 100%, which is why ethanol and phenytoin clear at a fixed amount per hour rather than a fixed fraction.',
  },
  'temperature factor': {
    definition:
      'Rate multiplier from temperature. Roughly doubles per 10°C up to the optimum (the Q10 effect), then falls off a cliff as the protein denatures — the curve is asymmetric, unlike the pH one.',
  },
  'ph factor': {
    definition:
      'Rate multiplier from pH, acting through the ionisation of catalytic residues and of the substrate. Sharply peaked, which is why pepsin works at pH 2 and is destroyed at pH 7 while trypsin does the reverse.',
  },

  // --- Erythropoiesis ---
  hemoglobin: {
    definition:
      'Oxygen-carrying protein concentration in blood. It is a CONCENTRATION, so it falls with plasma expansion as well as with red cell loss — the dilutional anaemia of pregnancy and of fluid resuscitation.',
  },
  haemoglobin: {
    definition:
      'Oxygen-carrying protein concentration in blood. It is a CONCENTRATION, so it falls with plasma expansion as well as with red cell loss — which is why it is normal immediately after an acute bleed and only drops once fluid shifts in.',
  },
  hematocrit: {
    definition:
      'Fraction of blood volume occupied by red cells. It drives viscosity steeply, so polycythaemia impairs flow enough to cause thrombosis, and the optimum for oxygen DELIVERY is lower than the optimum for oxygen content.',
  },
  epo: {
    expansion: 'Erythropoietin',
    definition:
      'Renal hormone released in response to tissue hypoxia that drives red cell production. Made by peritubular fibroblasts, which is why chronic kidney disease causes anaemia and why the anaemia responds to replacing it.',
  },
  'marrow output': {
    definition:
      'Rate of red cell production. It can rise six- to eightfold given iron, B12 and folate — so a low reticulocyte response in anaemia points to the marrow or its substrates rather than to blood loss.',
  },
  hepcidin: {
    definition:
      'Liver hormone that BLOCKS iron release from gut and macrophages by degrading ferroportin. Raised by inflammation, which is the entire mechanism of anaemia of chronic disease: iron is present but locked away.',
  },
  'transferrin saturation': {
    definition:
      'Percentage of iron-binding capacity actually carrying iron. Low in both iron deficiency and anaemia of chronic disease; the TIBC separates them — high when iron is absent, low when it is merely sequestered.',
  },
  'serum iron / tibc': {
    definition:
      'Circulating iron and the total capacity to bind it. Iron deficiency raises TIBC as the body makes more transferrin; inflammation lowers it. That divergence is what makes the pair more useful than either alone.',
  },
  'o2 delivery': {
    definition:
      'Oxygen delivered to the tissues per minute — cardiac output times arterial oxygen content. Content depends mostly on haemoglobin, not on PaO2, which is why anaemia impairs delivery with a perfectly normal saturation.',
  },

  // --- Exercise ---
  vo2: {
    expansion: 'Oxygen consumption',
    definition:
      'Oxygen used per minute — cardiac output times the arteriovenous difference (the Fick principle). Its maximum is limited by cardiac output in almost everyone, not by the lungs, which is why endurance training enlarges the heart.',
  },
  'a-v o2 difference': {
    definition:
      'Oxygen extracted per 100 mL of blood passing the tissues. It roughly triples during maximal exercise, so extraction contributes as much as flow to the rise in VO2 — the half of the Fick equation that is easy to forget.',
  },
  ventilation: {
    definition:
      'Total air moved per minute. During moderate exercise it tracks CO2 production almost exactly; above the lactate threshold it rises out of proportion, buffering acid, which is what makes the ventilatory threshold detectable.',
  },
  'muscle blood flow': {
    definition:
      'Share of cardiac output going to working muscle, up to about 85% at maximum. That share is taken from gut and kidney by sympathetic vasoconstriction — active muscle escapes it through local metabolic vasodilatation.',
  },
  'core temp / fatigue': {
    definition:
      'Core temperature and accumulated fatigue together, because in prolonged exercise they are the same limit: rising core temperature diverts blood to skin, which competes with muscle for the same cardiac output.',
  },

  // --- Fetal circulation ---
  'pre-ductal spo₂': {
    definition:
      'Saturation in blood reaching the right arm — before the ductus arteriosus joins the aorta. It reflects what the left ventricle received, and comparing it with the post-ductal value is the bedside test for a right-to-left ductal shunt.',
  },
  'post-ductal spo₂': {
    definition:
      'Saturation below the ductal insertion, measured at a foot. In the fetus it is normally LOWER than pre-ductal; a persisting gap after birth means desaturated right-heart blood is still crossing the duct.',
  },
  'pulmonary resistance': {
    definition:
      'Vascular resistance in the lungs, as a multiple of the mature value. High in the fetus — the lungs are fluid-filled and hypoxic — and it falls with the first breaths, which is the event that reverses every shunt.',
  },
  'pulmonary flow': {
    definition:
      'Share of combined ventricular output actually going through the lungs. Only about 10% before birth, since the rest is diverted through the duct; it becomes 100% once the duct closes.',
  },
  'ductal shunt': {
    definition:
      'Flow through the ductus arteriosus, and its direction. Right-to-left before birth (bypassing the lungs), it reverses to left-to-right as pulmonary resistance falls — which is why a persistent duct causes pulmonary overload rather than cyanosis.',
  },
  'duct patency': {
    definition:
      'How open the ductus arteriosus is. Held open by prostaglandin E2 and by low oxygen; it constricts when oxygen rises after birth. That dependence is why prostaglandin keeps it open in duct-dependent lesions and indometacin closes it.',
  },
  'foramen ovale': {
    definition:
      'Patency of the atrial flap valve. It is held open by right atrial pressure exceeding left; once pulmonary flow rises the left atrium wins and the flap is pressed shut — a functional closure long before anatomical fusion.',
  },

  // --- Gastrointestinal ---
  'gastric ph': {
    definition:
      'Acidity of stomach contents, normally 1.5–3.5 in the fasted state. Low pH activates pepsinogen, kills organisms and is the signal that switches gastrin OFF — which is why blocking acid raises gastrin.',
  },
  'duodenal ph': {
    definition:
      'Acidity in the duodenum, normally near neutral because pancreatic bicarbonate neutralises arriving chyme. Acid here is the stimulus for secretin, and persistent acid is what ulcerates the duodenal mucosa.',
  },
  'acid output': {
    definition:
      'Parietal cell acid secretion as a percentage of maximal. Driven by gastrin, histamine and acetylcholine converging on the H+/K+ ATPase — which is why blocking the pump works regardless of which stimulus is raised.',
  },
  'gastric volume': {
    definition:
      'How full the stomach is. Distension itself is a stimulus — through vagal and local reflexes — so volume drives both acid secretion and the emptying that relieves it.',
  },
  gastrin: {
    definition:
      'G-cell hormone from the antrum that drives acid secretion and mucosal growth. Suppressed by luminal acid, so it rises on proton pump inhibitors; a very high gastrin with a very acid stomach is Zollinger-Ellison syndrome.',
  },
  somatostatin: {
    definition:
      'D-cell hormone that inhibits almost every gut secretion, gastrin included. It is the brake in the antral loop: acid stimulates it, and it then shuts gastrin down — negative feedback with one intermediary.',
  },
  cck: {
    expansion: 'Cholecystokinin',
    definition:
      'Duodenal hormone released by FAT and protein. It contracts the gallbladder, relaxes the sphincter of Oddi, drives pancreatic enzyme secretion and slows gastric emptying — one hormone matching every step of fat digestion.',
  },
  secretin: {
    definition:
      'Duodenal hormone released by ACID. It drives bicarbonate from pancreatic duct cells and inhibits gastric acid — the loop that keeps the duodenum near neutral. Historically the first hormone ever described.',
  },
  'gip / glp-1': {
    definition:
      'Incretins released by nutrients in the small bowel that potentiate insulin release BEFORE glucose rises. They are why oral glucose provokes more insulin than the same glucose given intravenously, and the target of GLP-1 agonist drugs.',
  },

  // --- Glucose ---
  'blood glucose': {
    definition:
      'Plasma glucose. Held between roughly 70 and 140 mg/dL by insulin on one side and four counter-regulatory hormones on the other — an asymmetry that reflects how much worse hypoglycaemia is in the short term.',
  },
  insulin: {
    definition:
      'The only hormone that lowers glucose: it drives uptake into muscle and fat, and shuts off hepatic glucose production. That second action matters more in the fasting state, which is why fasting glucose reports on hepatic insulin sensitivity.',
  },
  glucagon: {
    definition:
      'Alpha-cell hormone that raises glucose by glycogenolysis and gluconeogenesis. It acts almost entirely on the liver, and it is the first defence against hypoglycaemia — lost early in type 1 diabetes, which is why hypoglycaemia becomes dangerous there.',
  },
  'counter-regulation': {
    definition:
      'Combined glucagon, adrenaline, cortisol and growth hormone drive opposing insulin. Adrenaline also produces the warning symptoms; blunting it — by beta-blockade or by repeated hypoglycaemia — causes hypoglycaemia unawareness.',
  },
  'glycogen reserve': {
    definition:
      'Hepatic glycogen available for immediate release, roughly 100 g or about 24 hours of fasting. Once it is gone, glucose must be made from amino acids and glycerol, which is the switch into gluconeogenesis and ketosis.',
  },
  'meal remaining': {
    definition:
      'Carbohydrate still to be absorbed from the last meal. The absorption curve, not the insulin curve, is what determines how long a post-meal glucose rise lasts — which is why the glycaemic index matters.',
  },

  // --- Hearing ---
  loudness: {
    definition:
      'Perceived intensity, relative to threshold. Loudness grows roughly as the cube root of intensity, which is why the decibel scale is logarithmic and why a 10 dB rise sounds like "twice as loud" rather than ten times.',
  },
  'stapedius reflex': {
    definition:
      'Reflex contraction of the middle-ear muscles above about 85 dB, stiffening the ossicular chain to attenuate transmission. It is too slow for a gunshot but protects against sustained noise, and its absence localises lesions in the facial nerve.',
  },

  // --- HPA axis ---
  acth: {
    expansion: 'Adrenocorticotropic hormone',
    definition:
      'Pituitary hormone driving cortisol synthesis in the adrenal cortex. Whether it is high or low with a given cortisol is what separates a pituitary from an adrenal cause — the single most useful measurement in the axis.',
  },
  'crh drive': {
    expansion: 'Corticotropin-releasing hormone',
    definition:
      'Hypothalamic drive at the top of the axis, pulsatile with a marked diurnal rhythm. Suppressed by cortisol from any source, which is why exogenous steroids shut down the whole axis and cannot be stopped abruptly.',
  },
  'adrenal reserve': {
    definition:
      'How much more cortisol the adrenal could make if maximally stimulated. Reserve is normally large, so basal cortisol stays normal until most of the gland is lost — which is why Addison disease presents as a crisis under stress.',
  },

  // --- HPG axis ---
  'feedback mode': {
    definition:
      'Whether oestrogen is currently inhibiting or driving the pituitary. Oestrogen suppresses LH for most of the cycle, then — once it is high enough for long enough — switches to POSITIVE feedback and triggers the LH surge. That single reversal produces ovulation.',
  },
  'gnrh drive': {
    expansion: 'Gonadotropin-releasing hormone',
    definition:
      'Hypothalamic drive at the top of the reproductive axis. It must be PULSATILE: continuous GnRH downregulates the pituitary and shuts the axis off, which is exactly how GnRH agonists are used to treat prostate cancer.',
  },
  lh: {
    expansion: 'Luteinising hormone',
    definition:
      'Pituitary gonadotropin that triggers ovulation and maintains the corpus luteum in women, and drives testosterone from Leydig cells in men. Its mid-cycle surge is the most abrupt event in the cycle.',
  },
  fsh: {
    expansion: 'Follicle-stimulating hormone',
    definition:
      'Pituitary gonadotropin that recruits ovarian follicles and supports Sertoli cells and spermatogenesis. Selectively suppressed by inhibin, which is how the axis regulates follicle number and sperm production separately from steroid output.',
  },
  estrogen: {
    definition:
      'Ovarian steroid from the granulosa cells of the growing follicle. It thickens the endometrium, feeds back on the pituitary, and above a threshold reverses that feedback to positive — the trigger for ovulation.',
  },
  follicle: {
    definition:
      'Maturity of the dominant follicle. One follicle is selected each cycle and the rest undergo atresia; the selected one is the main source of oestrogen and becomes the corpus luteum after ovulation.',
  },
  'cycle day': {
    definition:
      'Day of the menstrual cycle, counted from the first day of bleeding. It is the reference every other reading here is interpreted against: the same LH value means something different on day 3 and on day 14.',
  },
  testosterone: {
    definition:
      'Principal androgen, from Leydig cells under LH. Intratesticular concentration is far higher than circulating and is what spermatogenesis needs — which is why exogenous testosterone suppresses LH and causes infertility.',
  },
  inhibin: {
    definition:
      'Gonadal peptide from granulosa and Sertoli cells that selectively suppresses FSH. It lets the axis report on gamete production separately from steroid production, and its fall is the first sign of ovarian ageing.',
  },
  'pituitary responsiveness': {
    definition:
      'How strongly the gonadotrophs answer a given GnRH pulse. It is upregulated by pulsatile GnRH and lost under continuous exposure — the receptor-level explanation for why pulsatility is the whole design of this axis.',
  },
  axis: {
    definition:
      'Which reproductive axis is being modelled, and where it currently sits. The hypothalamic, pituitary and gonadal levels can each fail, and localising the failure is what the gonadotropins are measured for.',
  },
  'gnrh pulse frequency': {
    definition:
      'How often GnRH is released. Frequency, not amplitude, selects the output: fast pulses favour LH, slow pulses favour FSH. It is the mechanism behind the shifting LH:FSH ratio across the cycle.',
  },
  'hypothalamic suppression': {
    definition:
      'Suppression of GnRH by energy deficit, stress or excessive exercise. It is the mechanism of functional hypothalamic amenorrhoea — a normal pituitary and normal ovaries with nothing driving them.',
  },
  'gonadal function': {
    definition:
      'How much the gonad is producing given the gonadotropin it receives. High gonadotropins with low output is primary gonadal failure; low gonadotropins with low output places the lesion above the gonad.',
  },

  // --- Thyroid axis ---
  tsh: {
    expansion: 'Thyroid-stimulating hormone',
    definition:
      'Pituitary hormone driving thyroid output. It responds logarithmically to free T4, so it moves far more than the hormone it is reporting on — which is why it is the most sensitive single test of thyroid status.',
  },
  t4: {
    expansion: 'Thyroxine',
    definition:
      'The main secretory product of the thyroid, and largely a PROHORMONE: it is converted peripherally to the active T3. Long half-life of about a week, which is why levothyroxine is dosed once daily and adjusted only every six weeks.',
  },
  t3: {
    expansion: 'Triiodothyronine',
    definition:
      'The active thyroid hormone at the nuclear receptor. Most of it is made outside the thyroid by deiodination of T4, so illness and drugs can change thyroid status without the thyroid doing anything.',
  },
  'conversion efficiency': {
    definition:
      'How well T4 is being deiodinated to T3. Suppressed by acute illness, starvation, steroids, amiodarone and propranolol — which produces the low-T3 pattern of sick euthyroid syndrome.',
  },

  // --- Hypersensitivity ---
  'tissue injury': {
    definition:
      'Damage done to the target tissue by the reaction. In hypersensitivity the injury is caused by the immune response rather than by the antigen — which is why the same harmless protein is trivial in one person and lethal in another.',
  },
  'c3 / c4': {
    definition:
      'Complement components C3 and C4. Both fall when immune complexes activate the classical pathway, so LOW complement supports a type III reaction; a normal level argues against it. C4 alone is low in hereditary angioedema.',
  },
  'wheal / induration': {
    definition:
      'The two kinds of skin reaction, and the pair that separates the mechanisms. A wheal is soft, immediate and IgE-driven; induration is firm, takes 48–72 hours and is T-cell driven — the difference between an allergy prick test and a tuberculin test.',
  },

  // --- Immune response ---
  'pathogen load': {
    definition:
      'How much organism is still present. The response is driven by it, so clearance is what allows the response to contract — a load that cannot be cleared produces chronic activation instead of resolution.',
  },
  'helper t': {
    definition:
      'CD4 T-cell activity. It licenses both arms — it is required for B-cell class switching and for full cytotoxic T-cell responses — which is why losing CD4 cells in HIV disables antibody and cellular immunity together.',
  },
  'cytotoxic t': {
    definition:
      'CD8 T-cell activity, killing cells that display foreign peptide on MHC class I. The only arm that can reach a pathogen already INSIDE a cell, which is why it dominates the response to viruses.',
  },
  igm: {
    definition:
      'The first antibody made in a primary response — pentameric, high avidity, low affinity, and unable to cross the placenta. Present without IgG means recent infection, which is the basis of most serological dating.',
  },
  igg: {
    definition:
      'The dominant antibody after class switching — high affinity, long-lived, and the only class that crosses the placenta. Its presence with absent IgM means past exposure or vaccination rather than acute infection.',
  },

  // --- Inflammation ---
  'cardinal signs': {
    definition:
      'Rubor, calor, tumor and dolor — redness, heat, swelling and pain, with loss of function as the fifth. All five follow from two changes: arteriolar vasodilatation and increased venular permeability.',
  },
  neutrophils: {
    definition:
      'Circulating neutrophil count. Rises within hours of an acute insult and is the first cell to reach the tissue; a rise WITH immature forms (a left shift) means the marrow is being emptied faster than it can mature cells.',
  },
  crp: {
    expansion: 'C-reactive protein',
    definition:
      'Hepatic acute-phase protein made under IL-6. It rises within six hours and falls just as fast, so it tracks the current state rather than the history — which is why it is used to follow a response to treatment.',
  },

  // --- Liver ---
  'alt / alp': {
    definition:
      'Alanine aminotransferase and alkaline phosphatase, each as a multiple of the upper limit. ALT comes from injured hepatocytes and ALP from bile ducts, so their RATIO — not either alone — separates hepatitic from cholestatic disease.',
  },

  // --- Ventilation ---
  'alveolar ventilation': {
    definition:
      'The part of minute ventilation that reaches perfused alveoli and takes part in gas exchange. PaCO2 is set by this and nothing else, which is why rapid shallow breathing can raise minute ventilation and CO2 at the same time.',
  },
  'driving pressure': {
    definition:
      'Plateau pressure minus PEEP — the pressure actually distending the lung with each breath. It is tidal volume divided by compliance, and it predicts mortality in ARDS better than either tidal volume or plateau pressure alone.',
  },
  'peak pressure': {
    definition:
      'Highest airway pressure during inspiration. It includes the pressure lost to airway RESISTANCE, so a rising peak with an unchanged plateau means an airway problem — secretions, bronchospasm, a kinked tube — not a stiffer lung.',
  },
  'total peep': {
    definition:
      'End-expiratory pressure actually present, set PEEP plus any intrinsic PEEP from incomplete emptying. Intrinsic PEEP is invisible on the ventilator unless it is looked for, and it is what makes an obstructed patient hard to trigger a breath.',
  },
  hco3: {
    expansion: 'Bicarbonate',
    definition:
      'Plasma bicarbonate, the metabolic axis of acid-base. The kidney adjusts it over days, so a bicarbonate that has already moved in a respiratory disorder tells you the disorder is chronic.',
  },
  'p/f ratio': {
    definition:
      'PaO2 divided by inspired oxygen fraction — oxygenation corrected for how much oxygen is being given. Below 300 defines ARDS and below 100 is its severe form, which is why the same PaO2 means different things on air and on 80%.',
  },

  // --- Membrane potentials ---
  'membrane potential': {
    definition:
      'Voltage across the cell membrane, about −70 mV at rest. Set by which ions the membrane is currently permeable to, weighted by permeability — which is why it sits near the potassium equilibrium potential at rest and swings toward sodium during a spike.',
  },
  'e(na+)': {
    definition:
      'Sodium equilibrium potential, about +60 mV — the voltage at which the electrical and chemical gradients for sodium balance. The action potential peak approaches but never reaches it, because potassium conductance is already rising.',
  },
  'e(k+)': {
    definition:
      'Potassium equilibrium potential, about −90 mV. The resting membrane sits close to it because potassium is the dominant resting conductance, which is why extracellular potassium changes the resting potential so directly.',
  },
  'na+ activation (m)': {
    definition:
      'The Hodgkin-Huxley activation gate of the sodium channel: fast, voltage-dependent, and the reason depolarisation is regenerative. It opens quicker than it inactivates, which is what makes the upstroke possible at all.',
  },
  'na+ available (h)': {
    definition:
      'The sodium channel inactivation gate — the fraction of channels not yet inactivated. Its slow recovery is the absolute refractory period, which sets the maximum firing rate and enforces one-way propagation.',
  },
  'k+ activation (n)': {
    definition:
      'The delayed rectifier potassium activation gate. Slower than sodium activation, so it repolarises the cell after the peak and, by overshooting, produces the afterhyperpolarisation.',
  },
  'conduction velocity': {
    definition:
      'How fast the impulse travels along the axon. Raised by myelination and by diameter; demyelination slows it and, if severe, blocks it entirely — which is the physiology behind conduction studies in Guillain-Barré and multiple sclerosis.',
  },

  // --- Motor control ---
  'achieved amplitude': {
    definition:
      'How much of the commanded movement was actually produced. Basal ganglia disease scales movements DOWN while the command is intact — the mechanism of hypokinesia and micrographia in Parkinson disease.',
  },
  'rigidity vs spasticity': {
    definition:
      'Two kinds of increased tone, and the pair worth separating. Rigidity is constant through the range and velocity-INdependent (basal ganglia); spasticity is velocity-DEPENDENT with a catch and release (corticospinal).',
  },
  'co-contraction': {
    definition:
      'Simultaneous activation of agonist and antagonist. A small amount stabilises a joint; excess is dystonic overflow, and it wastes force against itself rather than producing movement.',
  },

  // --- Muscle ---
  'cytosolic ca2+': {
    definition:
      'Free calcium in the cytosol, the trigger for contraction. It rises about a hundredfold on stimulation and is pumped back by SERCA — an ATP-dependent step, which is why relaxation fails first when ATP runs out.',
  },
  'troponin occupied': {
    definition:
      'Fraction of troponin C bound by calcium. Binding moves tropomyosin off the myosin binding sites on actin, which is the switch between a relaxed and an activated thin filament.',
  },
  'cross-bridges attached': {
    definition:
      'Fraction of myosin heads currently bound to actin. Force is proportional to this number, and detachment REQUIRES ATP — which is why rigor mortis is a muscle full of attached cross-bridges that cannot let go.',
  },
  'active tension': {
    definition:
      'Force generated by cross-bridge cycling. It depends on sarcomere length through filament overlap, peaking near 2.0–2.2 µm where the most heads can reach actin.',
  },
  'passive tension': {
    definition:
      'Force from stretching titin and connective tissue, with no cross-bridges involved. Negligible at short lengths and dominant at long ones, which is why the total length-tension curve rises again beyond optimum.',
  },
  'sarcomere length': {
    definition:
      'Distance between Z-lines, which sets thick-thin filament overlap. Too short and the filaments collide; too long and there is nothing to grip — the Gordon-Huxley curve is a direct picture of that geometry.',
  },
  'shortening velocity': {
    definition:
      'How fast the muscle is shortening. Maximal against zero load and zero at maximal isometric force, which is Hill’s hyperbola — and the reason power peaks at about a third of maximum load.',
  },
  'power output': {
    definition:
      'Tension multiplied by shortening velocity. Zero at both ends of the force-velocity curve — no movement, or no load — so peak power sits in between, which is what training for power aims at.',
  },
  'stimulus interval': {
    definition:
      'Time between stimuli. As it shortens below the twitch duration, calcium accumulates and twitches sum — summation, then unfused and finally fused tetanus, which is how firing rate grades force.',
  },
  'motor units active': {
    definition:
      'How many motor units are recruited. The size principle recruits smallest and most fatigue-resistant first, which gives fine control at low forces and reserves the large fast units for maximal effort.',
  },
  'relaxation time': {
    definition:
      'Time to return to baseline force, set by SERCA pumping calcium back into the sarcoplasmic reticulum. It is the ATP-dependent half of the cycle, which is why relaxation slows in fatigue and in hypothyroidism.',
  },

  // --- Neuromuscular junction ---
  'muscle force': {
    definition:
      'Force produced by the muscle as a percentage of normal. The junction has a large safety factor, so force is maintained until well over half the receptors or released quanta are lost — which is why myasthenia presents with fatigue rather than constant weakness.',
  },
  'end-plate potential': {
    definition:
      'Depolarisation at the motor end plate from acetylcholine binding. Normally about four times the threshold needed to fire the muscle fibre — that margin IS the safety factor, and it is what disease erodes.',
  },
  'quanta released': {
    definition:
      'Number of vesicles released per nerve impulse, normally 50–100 and calcium-dependent. Reduced presynaptically in Lambert-Eaton syndrome and by botulinum toxin, with a normal postsynaptic receptor population.',
  },
  'high-rate response': {
    definition:
      'How force changes on rapid repetitive stimulation. It DECREMENTS in myasthenia as vesicles deplete against too few receptors, and INCREMENTS in Lambert-Eaton as calcium accumulates and rescues release. The single most diagnostic manoeuvre here.',
  },
  'vesicle pool': {
    definition:
      'Readily releasable acetylcholine vesicles remaining. Depletes with sustained high-frequency firing and is refilled between bursts, which is the mechanism of normal fatigue and of the decrement in myasthenia.',
  },
  desensitisation: {
    definition:
      'Acetylcholine receptors that have entered a closed, unresponsive state despite bound agonist. Caused by prolonged agonist exposure — which is how depolarising blockade with suxamethonium produces phase II block.',
  },

  // --- Pregnancy ---
  creatinine: {
    definition:
      'Plasma creatinine. In pregnancy GFR rises about 50%, so a "normal" creatinine may be abnormal — a value of 1.0 mg/dL that would be unremarkable outside pregnancy signals significant renal impairment within it.',
  },
  'serum sodium': {
    definition:
      'Plasma sodium concentration. In pregnancy it sits about 5 mmol/L below the non-pregnant range because the osmostat is reset downward — a normal adaptation rather than hyponatraemia to be corrected.',
  },
  'fetal weight': {
    definition:
      'Estimated fetal weight for gestation. Growth is placenta-limited late in pregnancy, so restriction that begins in the third trimester spares the head and shortens the abdomen — asymmetrical growth restriction.',
  },
  'oxytocin / milk': {
    definition:
      'Oxytocin drive and resulting milk output. Oxytocin causes EJECTION (letdown) and prolactin causes PRODUCTION; suckling drives both, which is why supply follows demand and why stress inhibits letdown specifically.',
  },

  // --- Renal tubular ---
  'plasma osmolality': {
    definition:
      'Solute concentration of plasma, normally 275–295 mOsm/kg. It is the variable ADH defends, sensed by hypothalamic osmoreceptors — and it is defended in preference to volume only until volume loss becomes severe.',
  },
  adh: {
    expansion: 'Antidiuretic hormone (vasopressin)',
    definition:
      'Posterior pituitary hormone that inserts aquaporin-2 into the collecting duct, allowing water to be reabsorbed. It controls water independently of sodium, which is why it changes concentration rather than volume.',
  },
  'adh action at duct': {
    definition:
      'How much water permeability is actually achieved at the collecting duct. It is the ADH level MULTIPLIED by receptor responsiveness — which is why nephrogenic diabetes insipidus has a high ADH and a duct that ignores it.',
  },
  'medullary gradient': {
    definition:
      'Strength of the corticopapillary osmotic gradient built by countercurrent multiplication, up to about 1200 mOsm/kg at the papilla. ADH can only concentrate urine as far as this gradient allows — loop diuretics work by abolishing it.',
  },
  'urine flow': {
    definition:
      'Rate of urine formation. Water reabsorption in the collecting duct sets it, so it is the direct readout of ADH action — from about 0.5 mL/min when maximally antidiuretic to over 15 mL/min in a full water diuresis.',
  },
  'gfr (after tgf)': {
    expansion: 'Glomerular filtration rate after tubuloglomerular feedback',
    definition:
      'Filtration rate once the macula densa has adjusted the afferent arteriole. High distal sodium delivery constricts the afferent and lowers GFR — a within-nephron brake that protects against losing salt faster than it can be reabsorbed.',
  },
  'serum bicarbonate': {
    definition:
      'Plasma bicarbonate. The kidney reclaims filtered bicarbonate in the proximal tubule and generates new bicarbonate distally, so a proximal defect (type 2 RTA) and a distal one (type 1) fail in different ways and at different urine pH.',
  },
  'urine ph': {
    definition:
      'Acidity of urine, normally 4.5–8 depending on the acid load. An inappropriately HIGH urine pH during systemic acidosis means the distal tubule cannot secrete H+ — which is the definition of type 1 renal tubular acidosis.',
  },
  'urine anion gap': {
    definition:
      'Urine sodium plus potassium minus chloride, used as a proxy for ammonium excretion. A NEGATIVE gap means ammonium is being excreted appropriately (so the acidosis is gastrointestinal); a positive gap points to a renal cause.',
  },
  'serum potassium': {
    definition:
      'Plasma potassium, normally 3.5–5.0 mEq/L. Only about 2% of body potassium is extracellular, so shifts between compartments — driven by pH, insulin and beta agonists — change the measured value without changing total body content.',
  },
  'serum creatinine': {
    definition:
      'Plasma creatinine, produced at a near-constant rate by muscle. Its relation to GFR is HYPERBOLIC: the first half of renal function is lost with barely a movement, and the last quarter with a steep rise.',
  },
  'creatinine clearance': {
    definition:
      'Volume of plasma cleared of creatinine per minute, an estimate of GFR. It slightly overestimates, because creatinine is secreted as well as filtered — which is why it is not a true clearance marker and inulin is.',
  },
  fena: {
    expansion: 'Fractional excretion of sodium',
    definition:
      'Percentage of filtered sodium excreted. Below 1% means the tubules are working and avidly retaining sodium — prerenal — and above 2% means they are not, which is acute tubular necrosis. Uninterpretable after a diuretic.',
  },

  // --- Respiratory ---
  interpretation: {
    definition:
      'The acid-base disorder the current pH, PaCO2 and bicarbonate add up to, with whether compensation is appropriate. Compensation never fully corrects the pH, so a normal pH with abnormal components means two disorders rather than one.',
  },
  'fev1/fvc': {
    definition:
      'Proportion of the vital capacity blown out in the first second, normally above 0.7. It is the single measurement that separates OBSTRUCTION (low ratio) from RESTRICTION (normal or high ratio with small volumes).',
  },
  fvc: {
    expansion: 'Forced vital capacity',
    definition:
      'Total volume exhaled in a forced effort from full inspiration. Reduced in restriction, and reduced in severe obstruction too — because air is trapped rather than because the lung is small.',
  },
  fev1: {
    expansion: 'Forced expiratory volume in one second',
    definition:
      'Volume blown out in the first second. Effort-independent over most of its range because of dynamic airway compression, which is what makes it reproducible enough to grade severity and follow treatment.',
  },
  'peak flow': {
    definition:
      'Maximum expiratory flow rate. Effort-DEPENDENT and reflecting large airways, so it is a good monitor of a known asthmatic against their own best value and a poor diagnostic test in anyone else.',
  },
  tlc: {
    expansion: 'Total lung capacity',
    definition:
      'Gas in the lungs at full inspiration. It is the measurement that confirms true restriction, and it is RAISED in emphysema — which is why spirometry alone cannot distinguish a small lung from a trapped one.',
  },
  frc: {
    expansion: 'Functional residual capacity',
    definition:
      'Volume left at the end of a quiet breath out, where inward lung recoil and outward chest wall recoil balance. It is the oxygen reservoir during apnoea, which is why it determines how long preoxygenation buys you.',
  },
  rv: {
    expansion: 'Residual volume',
    definition:
      'Gas that cannot be exhaled. Raised by air trapping in obstruction, so a rising RV/TLC ratio is the signature of hyperinflation even while FVC still looks acceptable.',
  },
  'v/q unit a': {
    definition:
      'Ventilation-perfusion ratio of the first modelled lung unit, normally about 0.8. A ratio approaching zero is a shunt — perfused but not ventilated — and gives hypoxaemia that does NOT correct with oxygen.',
  },
  'v/q unit b': {
    definition:
      'Ventilation-perfusion ratio of the second unit. A ratio far above 1 is dead space — ventilated but not perfused — which wastes ventilation and raises CO2 rather than causing hypoxaemia.',
  },
  'work of breathing': {
    definition:
      'Energy spent moving air per minute, against elastic and resistive loads. Normally about 2% of resting oxygen consumption and up to 30% in severe disease — the point at which the respiratory muscles become the thing that fails.',
  },
  'hpv diversion': {
    expansion: 'Hypoxic pulmonary vasoconstriction',
    definition:
      'How much blood has been diverted away from poorly ventilated lung. Unique to the pulmonary circulation — every other bed dilates in hypoxia — and it is what limits shunt in pneumonia. Anaesthetic agents blunt it.',
  },

  // --- Shock ---
  'oxygen delivery': {
    definition:
      'Oxygen reaching the tissues per minute, cardiac output times arterial content. Consumption is normally independent of it until delivery falls to a critical point, below which the tissue extracts what it can and accrues an oxygen debt.',
  },
  pattern: {
    definition:
      'Which shock state the current haemodynamics add up to. All four kinds share a low blood pressure and separate on cardiac output, filling pressures and resistance — which is why those three, not the pressure, make the diagnosis.',
  },

  // --- Somatic sensation ---
  'c-fibre traffic': {
    definition:
      'Traffic in unmyelinated C fibres — slow, poorly localised second pain, plus temperature and itch. Their slowness is why a stubbed toe hurts twice, with the dull ache arriving about a second after the sharp one.',
  },
  'aβ traffic': {
    definition:
      'Traffic in large myelinated Aβ fibres carrying touch and vibration. They also inhibit pain transmission in the dorsal horn — the gate control mechanism, and the reason rubbing an injury helps and TENS works.',
  },
  'touch below (l/r)': {
    definition:
      'Fine touch and vibration below the lesion, each side separately. This modality ascends in the dorsal columns IPSILATERALLY and crosses in the medulla, so a cord lesion loses it on the SAME side.',
  },
  'pain/temp below (l/r)': {
    definition:
      'Pain and temperature below the lesion, each side separately. The spinothalamic tract crosses within a segment or two of entry, so a cord lesion loses it on the OPPOSITE side — the dissociation that defines Brown-Séquard.',
  },
  'proprioception below': {
    definition:
      'Joint position sense below the lesion. It travels with the dorsal columns, so it is lost with fine touch and on the same side — which is why a dorsal column lesion causes a sensory ataxia that worsens with the eyes closed.',
  },

  // --- Thermoregulation ---
  'core temp': {
    definition:
      'Deep body temperature, defended within a few tenths of a degree. What is defended is a SET POINT, so the same 39°C means opposite things depending on whether the set point moved with it.',
  },
  'set point': {
    definition:
      'The temperature the hypothalamus is currently defending. Raised by pyrogens in fever — so the patient feels cold and shivers at 39°C — and normal in hyperthermia, where defence has simply been overwhelmed. Antipyretics move this; cooling does not.',
  },
  shivering: {
    definition:
      'Heat produced by involuntary muscle activity, up to about five times resting metabolic rate. It is the main defence against cold in adults; newborns use brown fat instead, because they cannot shiver effectively.',
  },
  sweating: {
    definition:
      'Evaporative heat loss, the only mechanism that still works when ambient temperature exceeds skin temperature. It fails in high humidity — sweat that does not evaporate removes no heat at all, which is why humid heat kills.',
  },
  'skin flow': {
    definition:
      'Cutaneous blood flow as a percentage of normal, the variable that couples the core to the surface. It can vary roughly thirtyfold, and diverting that much output to skin is why heat stress and exercise compete for the same cardiac output.',
  },
  'net storage': {
    definition:
      'Heat gained minus heat lost. Positive means core temperature is rising; the body has no way to store heat harmlessly, so a sustained positive balance ends in hyperthermia whatever the set point is doing.',
  },

  // --- Venous return ---
  'venous return': {
    definition:
      'Blood returning to the right heart per minute. In steady state it MUST equal cardiac output — the two curves are plotted against right atrial pressure precisely to find the one point where they do.',
  },
  'mean systemic filling': {
    definition:
      'Pressure everywhere in the circulation if the heart stopped and pressures equalised, about 7 mmHg. Set by blood volume and venous tone — by the VESSELS, not the heart — and it is the upstream pressure driving venous return.',
  },
  'resistance to vr': {
    definition:
      'Resistance the returning blood meets, mostly venous. Because veins hold most of the blood at low pressure, a small change in venous tone alters return far more than the same change in arteriolar tone would.',
  },
  'cardiac curve plateau': {
    definition:
      'The maximum output this heart can produce however well it is filled. Set by contractility and afterload; once venous return reaches it, giving more fluid raises filling pressure and no output at all.',
  },
  'limiting factor': {
    definition:
      'Which side of the equilibrium is currently capping output — the heart’s pumping ability or the circulation’s ability to return blood. It is the question fluid responsiveness is really asking, and the two answers need opposite treatments.',
  },
  'intrathoracic pressure': {
    definition:
      'Pressure surrounding the heart and great veins. It is subtracted from the gradient driving venous return, which is why spontaneous inspiration increases return and positive pressure ventilation reduces it.',
  },

  // --- Vestibular ---
  'cupula deflection': {
    definition:
      'Bending of the cupula in the semicircular canal by endolymph inertia. It signals angular ACCELERATION, not velocity — which is why sustained constant rotation stops being felt after about 20 seconds.',
  },
  oscillopsia: {
    definition:
      'Apparent movement of the visual world during head motion, from a failed vestibulo-ocular reflex. The reflex normally holds gaze within milliseconds; when it is lost bilaterally, the world bounces with every step.',
  },

  // --- Vision ---
  'intraocular pressure': {
    definition:
      'Pressure inside the eye, normally 10–21 mmHg, set by aqueous production against drainage. Most glaucoma is a drainage problem, and pressure is the only modifiable risk factor — though a third of cases occur at a normal pressure.',
  },
  'angle closure': {
    definition:
      'How far the iridocorneal angle is occluded, blocking aqueous drainage. Closure raises pressure within hours rather than years, which is why acute angle closure is painful, sight-threatening and an emergency.',
  },
  accommodation: {
    definition:
      'Focusing power added by the lens, in dioptres. Ciliary muscle CONTRACTION relaxes the zonules and lets the lens round up — the counter-intuitive step, and the one presbyopia defeats as the lens stiffens.',
  },
  'near point': {
    definition:
      'Closest distance that can be focused. About 10 cm in a child and beyond 40 cm by the mid-forties, which is precisely when reading glasses become necessary — presbyopia is this number receding.',
  },
  'visual fields': {
    definition:
      'The pattern of field loss, which localises the lesion along the visual pathway better than any other sign: one eye means anterior to the chiasm, bitemporal means the chiasm itself, and a homonymous defect means behind it.',
  },
  // --- Metabolism & Energy Balance ---
  'energy expenditure': {
    definition:
      'Whole-body daily energy use: resting metabolic rate multiplied by activity and by any catabolic stress. An ITU or trauma patient\'s bill can double or more, which is why critically ill muscle is lost faster than any feeding can replace it.',
  },
  ketones: {
    definition:
      'Fat-derived fuel molecules (acetoacetate, beta-hydroxybutyrate, acetone) made by the liver when fasting, partly replacing glucose as the brain\'s fuel. Trace levels are normal; over 1 mmol/L means the fast has moved into ketosis, and a high level with high glucose is a ketotic emergency rather than a fast.',
  },
  'carbohydrate oxidation': {
    definition:
      'The share of the fuel mix being burnt as carbohydrate. High just after a meal, it collapses once glycogen is spent, which is the metabolic switch fasting is really about — the body is not burning less, it is burning different fuel.',
  },
  'fat oxidation': {
    definition:
      'The share of the fuel mix being burnt as fat. It rises through the fast as glucagon takes over and collapses the carbohydrate share, so in starvation the body runs most of its economy on fat.',
  },
  'protein oxidation': {
    definition:
      'The share of the fuel mix coming from protein, and the visible cost of catabolic states. A small resting leak grows under starvation (protein feeds gluconeogenesis) and under trauma or sepsis, where muscle is consumed faster than any feeding replaces it.',
  },
  'respiratory quotient': {
    definition:
      'Carbon dioxide produced per oxygen consumed — 1.0 for pure carbohydrate, 0.7 for pure fat, so a mixed diet sits near 0.8 and deep starvation leans toward the fat end. It is how a spirometer reads which fuel the body is on.',
  },
  'insulin signal': {
    definition:
      'The relative anabolic drive of insulin, high after a meal and low in fasting. High insulin is the fed signal: store glucose, stop gluconeogenesis, switch off ketone production — which is why resistance to it distorts every fuel decision downstream.',
  },
  'glycogen remaining': {
    definition:
      'Leftover stored sugar, as a percentage of capacity. Liver glycogen spares gluconeogenesis for the first stretch of a fast and is spent after roughly a day; after it is gone, glucose is made from protein — which is what the protein oxidation reading shows climbing in its place.',
  },
  // --- Toxicology ---
  'plasma paracetamol': {
    definition:
      'Circulating paracetamol in the blood at the presented hour, in mg/L. Its danger comes only from where it sits on the falling post-absorption curve relative to the treatment line — a high number late in the curve can be safe, and a modest number early can be anything but.',
  },
  'nomogram line': {
    definition:
      'The Rumack-Matthew treatment threshold: 100 mg/L at four hours falling to 15 mg/L at twenty-four hours. A plasma level above the line at any point predicts hepatotoxicity without NAC; the line is why "is this overdose dangerous" is answered with a graph rather than a tablet count.',
  },
  'absorbed dose': {
    definition:
      'The dose that actually reached the circulation, after activated charcoal has sequestered its share, in mg/kg. Crossing 75 mg/kg is the UK cut-off at which NAC is indicated whatever the measured plasma — the threshold this module treats as the line between "history" and "overdose".',
  },
  'hepatotoxicity risk': {
    definition:
      'The combined risk of liver toxicity for this presentation, driving off nomogram position and how early NAC started. The same curve is almost benign with NAC inside its window and severe without it — this is the single number the race against the eight-hour clock is trying to keep down.',
  },
  'antidote window': {
    definition:
      'Hours of the eight-hour window still unused at the presented time. It only ever falls, and it is the clock that converts the nomogram into urgency: NAC is near-total protection within eight hours of ingestion, partial by twenty-four, and little help to a liver already injured after that.',
  },
  'charcoal uptake': {
    definition:
      'The share of the load activated charcoal captured before it reached the blood, as a percentage. Its only real value lives in the first hour or two after ingestion, because it works on drug still in the gut — the same charcoal that halves the plasma at one hour changes almost nothing at twelve.',
  },
  'alveolar concentration': {
    definition:
      'The fraction of agent actually reaching the alveolar gas, as a percent of the dial setting. It is only ever a compromise: the circuit dilutes the dial with re-breathed gas, the blood strips what arrives, and the displayed number is the ceiling that is left after both. The patient is asleep at the effect-site number, not this one.',
  },
  'effect-site (brain)': {
    definition:
      'The agent concentration at the site that actually produces anaesthesia, lagging the alveolar level across a blood–brain step the solubility coefficient sets. This is the number worth waiting for: induction is complete not when the monitor plateaus but when this curve has caught up to it.',
  },
  'wash-in progress': {
    definition:
      'How far the alveolar concentration has travelled toward its own equilibrium ceiling, 0 to 1. One means fully charged, near zero means the curve has barely left the floor. Emergence is the same fraction running backwards — the dial decides which way it moves.',
  },
  'inspired fraction': {
    definition:
      'The effective inspired concentration at the Y-piece after the circuit has diluted the dial with re-breathed and partially used gas, expressed as a percent. At low fresh gas flows this falls well below the vaporizer reading, which is the mechanical explanation for why "two percent on the dial" is not two percent at the alveolus.',
  },
  'minutes to 90%': {
    definition:
      'How long the alveolar wash-in takes to reach ninety percent of its ceiling at the current fresh gas flow and solubility. It is the induction clock of the whole model — a doubling of the blood:gas coefficient roughly doubles it, and a flush of fresh gas cuts it by the same factor.',
  },
  'agent absorption': {
    definition:
      'The uptake index of agent leaving the gas and entering the body — roughly solubility times cardiac output times the current alveolar level. It is the accounting half of anaesthesia: the same dial extracts more from a high-output patient, and that is why the vaporizer has to lead the cardiac output rather than follow it.',
  },
  'performance index': {
    definition:
      'The composite outcome of the Yerkes-Dodson inverted-U: near a hundred percent when arousal sits at the task\'s optimum, the memory ceiling has headroom and demand stays inside the reserve, collapsing toward its floor when any one of those breaks. It is a teaching score, not a clinical test, but every pre-clinical question about "why did performance fall" is really asking for its factors.',
  },
  'working memory occupancy': {
    definition:
      'How much of the seven-plus-or-minus-two ceiling is being spent, including the friction distraction and fatigue spend for free: one hundred percent means the rack is full and nothing else can be held while it is. It packages load and interference into the single number that actually predicts whether a problem will fit long enough to solve.',
  },
  'deployed effort': {
    definition:
      'The effort an executive reserve can actually mount, cut in two ways: distance from the task\'s optimum arousal (effort far off the peak is moot) and fatigue (which withdraws from the reserve itself). A motivated but exhausted learner reads low here — the physiological record of being unable to start, however much they want to.',
  },
  'arousal optimality': {
    definition:
      'Closeness to the arousal this task wants, rather than to any fixed ideal — a hard problem wants low arousal, so a learner at forty-five percent can be optimally placed for one task and far over-peak for another. Zero means the learner sits on a shoulder of the inverted-U, where performance wastes away despite effort.',
  },
  'demand overshoot': {
    definition:
      'How far the task demand runs past what the current reserve and arousal state can cover, before the demand cliff: past about twenty-five percent the performance curve falls through rather than downhill, so this is the number that separates hard-but-doable from overwhelmed. The panic preset is parked deliberately beyond it.',
  },
  'task optimum': {
    definition:
      'The arousal level the current task performs best at, which difficulty relocates downward: an easy task peaks near forty-five percent, while a demanding one may want only fifteen. It is the Yerkes-Dodson insight made numeric — the same dial reading can be exactly right for one problem and ruination for another.',
  },
};

/**
 * The `State` tile, as each module means it.
 *
 * Every one of these prints `derived.classification` with `patternSummary` underneath, so the
 * MECHANISM is identical — the engine names the pattern its current numbers add up to, and the
 * line beneath lists the findings that produced the name. What differs is the set of names it
 * can produce, and that set is the thing worth knowing, so each module states its own.
 */
const STATE_ENTRIES: Record<string, GlossaryEntry> = {
  adrenalCortex: {
    definition:
      'Which adrenal picture the current cortisol, ACTH and aldosterone add up to — normal, Cushing, Addison, congenital adrenal hyperplasia or Conn. The line beneath lists the findings that produced the name, and the useful skill is predicting it from the hormones before reading it.',
  },
  adrenalMedulla: {
    definition:
      'Which catecholamine picture the current adrenaline and noradrenaline add up to — resting, exercise, haemorrhage or phaeochromocytoma. Note that the same two hormones produce all of them; it is the ratio and the time course that separate a run from a tumour.',
  },
  anteriorPituitary: {
    definition:
      'Which pituitary picture the six trophic hormones add up to — intact, a single-axis deficiency, panhypopituitarism or a secreting adenoma. Sheehan and a compressive macroadenoma both lose axes, but in a different order.',
  },
  bloodGroups: {
    definition:
      'Which transfusion or haemolytic-disease picture the current antibodies and cell survival add up to. Reads as compatible until an incompatibility is present, then names whether the destruction is intravascular (ABO, IgM) or extravascular (Rh, IgG).',
  },
  cerebralPerfusion: {
    definition:
      'Where on the intracranial pressure–volume curve the brain currently sits — compensated, at the knee, or herniating. Compensated and nearly-decompensated can look identical in the ICP number alone, which is why reserve is the tile beside it.',
  },
  coronaryCirculation: {
    definition:
      'Which ischaemic syndrome supply and demand currently add up to — adequate, demand ischaemia, unstable angina or infarction. Demand ischaemia and an occlusion produce the same chest pain and separate on whether reducing demand relieves it.',
  },
  digestionAbsorption: {
    definition:
      'Which malabsorption picture the current uptake numbers add up to — normal, pancreatic insufficiency, bile-salt deficiency, coeliac disease, lactase deficiency or ileal resection. Each fails a different step, and the pattern of what is NOT absorbed identifies the step.',
  },
  exercisePhysiology: {
    definition:
      'Which exercise domain the current work rate sits in — rest, moderate, heavy, severe or exhaustion. The boundaries are the lactate and ventilatory thresholds, not fixed watts, so a trained and an untrained subject cross them at very different loads.',
  },
  hearing: {
    definition:
      'Which hearing picture the current thresholds add up to — normal, conductive loss, sensorineural loss or mixed. The distinction is the whole point of Rinne and Weber, and it is made here on air-bone gap rather than tuning forks.',
  },
  inflammation: {
    definition:
      'Which stage the inflammatory response is in — quiescent, acute, abscess, resolving or chronic. Acute and chronic are not severities of one thing: they have different cells, different time courses and different endings.',
  },
  liverPhysiology: {
    definition:
      'Which liver picture the current enzymes, synthesis and clearance add up to — normal, hepatocellular injury, cholestasis, cirrhosis or failure. The ALT/ALP ratio names the pattern; albumin and INR say how much reserve is left behind it.',
  },
  motorControl: {
    definition:
      'Which motor syndrome the current tone, amplitude and gait add up to — normal, parkinsonian, cerebellar, pyramidal or dystonic. Rigidity and spasticity both read as "stiff" at the bedside and separate on velocity dependence, which is the tile above.',
  },
  pregnancy: {
    definition:
      'Which pregnancy picture the current maternal physiology adds up to — normal adaptation, anaemia, pre-eclampsia or growth restriction. Most of the alarming numbers in pregnancy are normal dilution, so the value of this tile is in saying when they are not.',
  },
  somaticSensation: {
    definition:
      'Which sensory lesion the current modality losses add up to — intact, a dorsal-column lesion, a spinothalamic lesion, hemisection (Brown-Séquard) or a peripheral neuropathy. The level and the SIDE of each loss localise the lesion; the numbers above are what you localise from.',
  },
  thermoregulation: {
    definition:
      'What the current core temperature and set point add up to — normothermia, fever, hyperthermia, heat stroke or hypothermia. Fever and hyperthermia are the crucial pair: in fever the set point has moved and the body is defending it, in hyperthermia the set point is normal and defence has been overwhelmed.',
  },
  vestibular: {
    definition:
      'Which vestibular picture the current cupular and ocular signals add up to — normal, BPPV, vestibular neuritis, Ménière disease or bilateral loss. The nystagmus direction and whether it fatigues are what separate them.',
  },
  vision: {
    definition:
      'Which ocular picture the current pressure, accommodation and fields add up to — normal, refractive error, presbyopia, glaucoma or a specific field defect. A field defect names WHERE in the visual pathway the lesion is, which no other reading here can do.',
  },
};

/** The rest of the module-owned labels: a generic word, or a concept only this module has. */
const MODULE_OWNED: Record<string, Record<string, GlossaryEntry>> = {
  cellCycle: {
    cycling: {
      definition:
        'The share of the cell population still moving through the cycle rather than sitting in G0. Chemotherapy that targets dividing cells works on this fraction and no other, which is why slowly-cycling tumours resist it and marrow, gut and hair suffer.',
    },
  },

  cardiorenal: {
    'blood volume': {
      definition:
        'Circulating volume as a percentage of normal. The kidney has no receptor for it and infers it from pressure and flow, which is why haemorrhage and heart failure — opposite volume states — can trigger the same renin release.',
    },
  },

  coronaryCirculation: {
    lesion: {
      definition:
        'The effective narrowing of the epicardial artery, after any collateral supply is subtracted. Resting flow is defended until roughly 70% stenosis and only then falls, which is why a lesion can be severe and silent until demand rises.',
    },
    demand: {
      definition:
        'Myocardial oxygen demand as a multiple of resting, driven mostly by rate-pressure product. Unlike other organs the heart cannot raise extraction to meet demand — it already extracts near-maximally at rest — so demand can only be met by more flow.',
    },
  },

  hypersensitivity: {
    onset: {
      definition:
        'Time from exposure to reaction, and the single most discriminating piece of history here. Minutes means preformed IgE (type I); hours to a day means antibody or immune complex (II/III); two to three days means T cells (type IV).',
    },
    temperature: {
      definition:
        'Core temperature. Fever accompanies the complement-driven reactions (types II and III) and is characteristically ABSENT in an uncomplicated type I reaction, where the collapse is vasodilatation rather than inflammation.',
    },
    mechanism: {
      definition:
        'Which Gell and Coombs type is dominant, or the non-immune mimic when no antibody or T cell is involved. Direct mast-cell degranulation and hereditary angioedema reproduce anaphylaxis without IgE, and neither responds to the same treatment.',
    },
  },

  immuneResponse: {
    phase: {
      definition:
        'Where the response has reached: innate, adaptive priming, effector, contraction or memory. The phase determines which cell is doing the work, and a re-challenge starts several phases further along than a first exposure.',
    },
    day: {
      definition:
        'Days since the challenge. The reason it is on the panel is that the ANTIBODY curves are only interpretable against it — IgM at day 5 is a primary response, the same IgM at day 2 is not.',
    },
    temperature: {
      definition:
        'Core temperature, driven here by IL-1, IL-6 and TNF raising the hypothalamic set point. Fever is a defence rather than a side effect: it slows several pathogens and speeds lymphocyte trafficking, which is the argument against suppressing every degree of it.',
    },
    innate: {
      definition:
        'Activity of the non-specific arm — neutrophils, macrophages, complement. Fast, unchanging on repeat exposure, and the arm that has to hold the line for the several days the adaptive response needs to arrive.',
    },
    memory: {
      definition:
        'Persisting antigen-specific lymphocytes after the response contracts. Memory is what makes a second exposure faster, larger and IgG rather than IgM, and it is the quantity a vaccine is trying to create.',
    },
  },

  fetalCirculation: {
    phase: {
      definition:
        'Where in the transition the circulation is: fetal, transitional or transitioned. The three shunts close in sequence over minutes to days, and a neonate that deteriorates on day two is usually one that has re-opened a shunt rather than one that never closed it.',
    },
  },

  inflammation: {
    temperature: {
      definition:
        'Core temperature, raised by pyrogenic cytokines resetting the hypothalamic set point. It follows the systemic response rather than the local one — a large abscess can run a high fever while a small one runs none.',
    },
    load: {
      definition:
        'The size of the insult still present. Inflammation resolves only when this reaches zero; while it persists the response cannot switch off, which is the mechanism by which acute inflammation becomes chronic.',
    },
    pus: {
      definition:
        'Accumulated dead neutrophils, liquefied tissue and organisms. Once it collects into an abscess, antibiotics stop working — the drug does not reach the middle of a collection — and it has to be drained. That is the whole clinical point of this reading.',
    },
    chronic: {
      definition:
        'How far the response has switched from neutrophils to macrophages and lymphocytes. Chronic inflammation is not old acute inflammation: it repairs and destroys simultaneously, which is why it ends in fibrosis rather than resolution.',
    },
  },

  micturition: {
    volume: {
      definition:
        'Urine currently in the bladder. First sensation comes at about 150 mL and a strong desire at about 400 mL, but the bladder is compliant enough that this can double while the pressure barely moves.',
    },
    pressure: {
      definition:
        'Intravesical pressure. It stays low across normal filling because the detrusor relaxes as it stretches — a bladder that does not do this stores at high pressure and eventually damages the kidneys above it.',
    },
    detrusor: {
      definition:
        'Contractile drive in the bladder wall, parasympathetic and pelvic-nerve driven. It must stay quiet during filling and contract during voiding; involuntary contraction while filling is the definition of an overactive bladder.',
    },
    sphincter: {
      definition:
        'Tone in the external urethral sphincter — striated muscle, pudendal nerve, voluntary. It is the part of continence under conscious control, and it must RELAX for a detrusor contraction to empty anything.',
    },
    afferent: {
      definition:
        'Stretch-receptor traffic from the bladder wall. It rises with filling and is what the pontine micturition centre integrates; sustained maximal firing is the sensation of urgency.',
    },
    flow: {
      definition:
        'Net rate into or out of the bladder — positive while filling, negative while voiding. A void that is slow despite a good detrusor pressure means obstruction rather than a weak bladder.',
    },
    phase: {
      definition:
        'Storage or voiding. The two are opposite reflex settings, not points on a scale: storage is sympathetic with a closed sphincter, voiding is parasympathetic with an open one, and the switch between them is the pontine centre.',
    },
  },

  muscleContraction: {
    temperature: {
      definition:
        'Muscle temperature, which rises with ATP turnover during activity. Warmer muscle has faster cross-bridge cycling and faster calcium reuptake — more power, quicker relaxation — which is the physiology behind warming up.',
    },
  },

  motorControl: {
    gait: {
      definition:
        'The walking pattern the current motor state produces. Gait is diagnostically dense because it loads the basal ganglia, cerebellum and corticospinal tract at once: shuffling, ataxic and circumducting patterns each name a different one of the three.',
    },
  },

  neuromuscularJunction: {
    lesion: {
      definition:
        'Where in the junction transmission is failing — presynaptic release, the synaptic cleft, or the postsynaptic receptor. Myasthenia (postsynaptic) fatigues with use, Lambert-Eaton (presynaptic) improves with it, and that single reversal is how they are told apart.',
    },
  },

  venousReturn: {
    'blood volume': {
      definition:
        'Total circulating volume, of which only the stressed portion generates pressure. Adding volume raises mean systemic filling pressure and shifts the venous return curve right; venoconstriction does the same without adding a millilitre.',
    },
  },
};

/**
 * Definitions that belong to ONE module, consulted before the shared table.
 *
 * Some labels are a generic English word standing for something specific: seventeen modules
 * print a tile called `State`, micturition's `Volume` is a bladder and `Pressure` is the
 * detrusor pushing on it, and `Lesion` names a coronary stenosis in one module and a
 * neuromuscular blockade in another. A single global entry for any of those would be wrong
 * almost everywhere it appeared, and dropping them would leave the most-clicked tile on several
 * pages unexplained.
 *
 * Keyed module id -> normalised label. A label a module does not own falls through to `ENTRIES`,
 * which is where every unambiguous term still lives — `Serum calcium` means the same thing in
 * whichever module prints it, and should not be written out twice.
 */
const MODULE_SCOPED: Record<string, Record<string, GlossaryEntry>> = (() => {
  const merged: Record<string, Record<string, GlossaryEntry>> = {};
  for (const [moduleId, entry] of Object.entries(STATE_ENTRIES)) merged[moduleId] = { state: entry };
  for (const [moduleId, entries] of Object.entries(MODULE_OWNED)) {
    merged[moduleId] = { ...merged[moduleId], ...entries };
  }
  return merged;
})();

/** Normalises a readout label to a glossary key. */
function keyFor(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * The definition for a readout label, preferring the module's own where it has one.
 *
 * `moduleId` is optional so the many callers that have no module in scope — the tutor corpus
 * reader, a test — keep working against the shared table alone.
 */
export function lookupTerm(label: string, moduleId?: string): GlossaryEntry | undefined {
  const key = keyFor(label);
  return (moduleId ? MODULE_SCOPED[moduleId]?.[key] : undefined) ?? ENTRIES[key];
}

/** The shared table: every term that means the same thing wherever it is printed. Keyed in the
 *  normalised form `lookupTerm` looks up by. */
export const GLOSSARY = ENTRIES;

/** The module-owned tables, for consumers that want every definition the app can show — the
 *  tutor's retrieval corpus, and the tests. Keyed module id -> normalised label. */
export const MODULE_GLOSSARY: Record<string, Record<string, GlossaryEntry>> = MODULE_SCOPED;

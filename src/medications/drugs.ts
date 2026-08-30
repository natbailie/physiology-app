/**
 * The formulary backing the Medications module — the drug classes of the UK top-100 list.
 *
 * This is pure data (no React), mirroring the engine-purity rule: a learner browses the class
 * list here, and each class links to an info page that may embed a live engine-driven diagram.
 *
 * `id` is a URL-safe slug; `family` groups the classes on the hub page in the rough order a
 * pre-clinical course meets them. Every class is a single pharmacological class — the formulary
 * is deliberately de-grouped, so "Heparins" and "Fondaparinux" are separate classes rather than
 * one "Heparins and fondaparinux" tile. The example drugs list (e.g. bisoprolol for
 * beta-blockers) names members of the class; the tile names the class itself.
 *
 * `mechanism` is the exam-flavoured explainer shown on the class page — the mechanism first,
 * ending on the clinical payoff, in the same voice as the module explainers. `moduleId`, when
 * present, links to the simulator whose engine models the system the drug acts on, so a learner
 * can watch the mechanism rather than read about it.
 *
 * Families are the top-level groupings, and each has a slug + one-line `blurb` for the home-tile
 * grid; a family's page then lists its classes as tiles.
 */

export interface DrugClass {
  /** URL slug, e.g. 'beta-blockers'. */
  id: string;
  /** Display name, e.g. 'Beta-blockers'. */
  className: string;
  /** Human grouping for the hub page. */
  family: DrugFamily;
  /** Example drugs, exactly as given in the source list. */
  drugs: string[];
  /** A short explainer of how the class works, in the app's voice. */
  mechanism: string;
  /**
   * A simulator module that models the system this class acts on, so a learner can watch the
   * mechanism rather than read about it. Absent classes get no fabricated diagram.
   */
  moduleId?: string;
  /**
   * For the Infection family only: which of the four antimicrobial branches this class belongs to.
   * It drives the extra navigation tier under `#medications/infection`. Absent for every other
   * family, and for no class that lives outside Infection (enforced by the test suite).
   */
  microGroup?: MicroGroup;
  /**
   * For antibiotic classes only (a `microGroup` of 'antibiotic'): the mechanism-of-action group
   * the class is taught under, so antibiotics are reached via `#medications/infection/antibiotics/
   * <moa>`. Marked with the mechanism the class acts through, not the drug's own name — the tier
   * is the classification students learn (cell wall, protein, nucleic acid, folate, membrane).
   */
  moa?: MoAId;
}

/**
 * The four antimicrobial branches of the Infection family. Each is a navigation tile directly
 * under the family, so a learner first chooses Antibiotics, Antivirals, Antifungals or
 * Antiparasitics before reaching a broad class.
 */
export type MicroGroup = 'antibiotics' | 'antivirals' | 'antifungals' | 'antiparasitics';

/**
 * The mechanism-of-action groups antibiotic classes are sorted into. These are the standard
 * pharmacology buckets — the mechanism is the thing being taught, and the broad class (penicillin,
 * cephalosporin) then sits under it. `antituberculous` is kept apart because the class is defined
 * by the disease it treats rather than a single molecular target.
 */
export type MoAId =
  | 'cell-wall'
  | 'protein'
  | 'nucleic-acid'
  | 'folate'
  | 'membrane'
  | 'antituberculous';

export type DrugFamily =
  | 'Cardiovascular'
  | 'Respiratory'
  | 'Renal & electrolytes'
  | 'Endocrine & metabolic'
  | 'Gastrointestinal'
  | 'Infection'
  | 'Haematology & oncology'
  | 'CNS & psychiatry'
  | 'Musculoskeletal & inflammation'
  | 'Dermatology, eyes & allergy'
  | 'Anaesthetics & pain'
  | 'Emergency, fluids & vitamins'
  | 'Reproduction & immunology';

/** Returns a URL-safe slug from a class name. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface FamilyMeta {
  /** URL slug for `#medications/<familySlug>`, derived from the name. */
  id: string;
  name: DrugFamily;
  /** One-line description for the hub tile, in the app's voice. */
  blurb: string;
  /** Number of classes in this family. */
  classCount: number;
}

/** The top-level groupings, in display order, each with the tile copy shown on the hub. These
 * mirror `THEMES` in width: the hub is a grid of family tiles, and each tile opens that family's
 * grid of class tiles. The count is filled in below once `MEDICATIONS` is built. */
export const FAMILY_META: Omit<FamilyMeta, 'classCount'>[] = [
  { id: 'cardiovascular', name: 'Cardiovascular', blurb: 'The circulatory drugs — pressures, rhythms, clotting and the lipid risk that drives them.' },
  { id: 'respiratory', name: 'Respiratory', blurb: 'Airway relief and control — bronchodilators, controllers and the inhaled workhorses.' },
  { id: 'renal-electrolytes', name: 'Renal & electrolytes', blurb: 'Salt, water, calcium and the diuretics and replacements that balance them.' },
  { id: 'endocrine-metabolic', name: 'Endocrine & metabolic', blurb: 'The hormonal axes and the glucose, thyroid and bone agents that act on them.' },
  { id: 'gastrointestinal', name: 'Gastrointestinal', blurb: 'Acid, motility and the gut’s secretions — where the stomach and bowel are the target.' },
  { id: 'infection', name: 'Infection', blurb: 'Antibiotics, antivirals, antifungals and antiparasitics — the agents that hit a pathogen.' },
  { id: 'haematology-oncology', name: 'Haematology & oncology', blurb: 'The blood and its cancers — marrow, clotting, folate and hormonal manipulation.' },
  { id: 'cns-psychiatry', name: 'CNS & psychiatry', blurb: 'Seizures, mood, psychosis, pain and sleep — the synapse and the neuron as target.' },
  { id: 'musculoskeletal-inflammation', name: 'Musculoskeletal & inflammation', blurb: 'Joint, bone and the inflammation that feeds them — from urate to corticosteroids.' },
  { id: 'dermatology-eyes-allergy', name: 'Dermatology, eyes & allergy', blurb: 'Skin, the eye and allergic disease — the topical habit of these organs and pathways.' },
  { id: 'anaesthetics-pain', name: 'Anaesthetics & pain', blurb: 'The agents that take away consciousness or sensation, and the analgesia that follows.' },
  { id: 'emergency-fluids-vitamins', name: 'Emergency, fluids & vitamins', blurb: 'The resuscitation shelf — arrest drugs, oxygen, fluids and the electrolyte rescues.' },
  { id: 'reproduction-immunology', name: 'Reproduction & immunology', blurb: 'The pregnancy, contraception and immune tools — uterotonics, hormones, vaccines.' },
];

/** Internal builder — the id comes from the class name at the end. */
interface Seed {
  className: string;
  family: DrugFamily;
  drugs: string[];
  mechanism: string;
  moduleId?: string;
  microGroup?: MicroGroup;
  moa?: MoAId;
}

const SEEDS: Seed[] = [
  // ------------------------------------------------------------ Cardiovascular
  {
    className: '5 alpha-reductase inhibitors',
    family: 'Cardiovascular',
    drugs: ['Finasteride', 'dutasteride'],
    mechanism:
      'Testosterone is reduced to the more potent dihydrotestosterone (DHT) by type 2 5-alpha-reductase in prostate and scalp. Inhibiting the enzyme lowers DHT without lowering testosterone itself, so the prostate stops growing and hair fall slows. The payoff is a slower PSA climb and a slower hairline — and a warning that measures of disease, not of androgens, are the way to follow it.',
  },
  {
    className: 'Aldosterone antagonists',
    family: 'Cardiovascular',
    drugs: ['Spironolactone', 'eplerenone'],
    mechanism:
      'Blocking the mineralocorticoid receptor in the distal nephron stops aldosterone from driving sodium reabsorption and potassium loss, so sodium (and water) is excreted while potassium is retained — a potassium-sparing diuretic. In heart failure the same receptor antagonism resists the maladaptive remodelling aldosterone drives in the myocardium. The payoff is survival gain in NYHA class III–IV failure, bought at the price of hyperkalaemia that must be watched with the ACE inhibitor it is usually paired with.',
    moduleId: 'cardiorenal',
  },
  {
    className: 'Alpha-blockers',
    family: 'Cardiovascular',
    drugs: ['Tamsulosin', 'doxazosin', 'alfuzosin'],
    mechanism:
      'Alpha-1 adrenergic receptors mediate sympathetic vasoconstriction and, in the prostate and bladder neck, smooth-muscle tone. Antagonising them relaxes both. In benign prostatic hyperplasia that means urinary flow; at the level of the arteriole it means a fall in peripheral resistance and blood pressure. The effect is orthostatic by design — the receptors you block are the ones holding up standing blood pressure — so the first dose is cautioned against dizziness and postural hypotension.',
  },
  {
    className: 'Amiodarone',
    family: 'Cardiovascular',
    drugs: ['Amiodarone'],
    mechanism:
      'A class III antiarrhythmic that prolongs the action potential and refractory period by blocking potassium channels, but with added sodium-, calcium- and beta-blocking activity, which is why it is so broad. It is the most effective agent for atrial fibrillation and ventricular arrhythmia, yet every dose carries iodine fallout: lung fibrosis, thyroid disease, corneal deposits, photosensitivity and hepatotoxicity. The deal is stark — one of the most powerful antiarrhythmics and one of the most dangerous — which is why it is followed with a chest film and thyroid function.',
    moduleId: 'ecgConduction',
  },
  {
    className: 'Angiotensin receptor blockers',
    family: 'Cardiovascular',
    drugs: ['Losartan', 'candesartan', 'irbesartan'],
    mechanism:
      'By blocking the type 1 angiotensin II receptor, ARBs stop angiotensin II from vasoconstricting and from telling the adrenal to make aldosterone, so pressure falls and sodium (with water) is lost. They protect the failing heart and the diabetic kidney through the same renin–angiotensin brake that makes ACE inhibitors work, but without the bradykinin accumulation, which is why it is ARBs, not ACEs, that are turned to when a dry cough forbids the other. The cost is the shared one: hyperkalaemia and a creatinine blip.',
    moduleId: 'cardiorenal',
  },
  {
    className: 'Angiotensin-converting enzyme (ACE) inhibitors',
    family: 'Cardiovascular',
    drugs: ['Ramipril', 'lisinopril', 'perindopril'],
    mechanism:
      'ACE converts angiotensin I to the potent vasoconstrictor angiotensin II and breaks down bradykinin. Inhibiting it does both: angiotensin II levels fall, so resistance drops and aldosterone-driven salt retention eases; bradykinin rises, causing the class-signature dry cough and, rarely, angioedema. Because the enzyme also falls off with the glomerular filtration pressure, ACE inhibitors are the drugs of choice for heart failure, post-infarct remodelling and proteinuric diabetic nephropathy — checked against a creatinine and potassium because both climb.',
    moduleId: 'cardiorenal',
  },
  {
    className: 'Antimuscarinics, cardiovascular and GI uses',
    family: 'Cardiovascular',
    drugs: ['Hyoscine butylbromide', 'atropine', 'glycopyrronium'],
    mechanism:
      'Blocking muscarinic acetylcholine receptors removes vagal tone. In the heart that raises sinus rate — the basis of atropine for bradycardia; in the gut it relaxes spasm, the basis of hyoscine for cramps. Atropine is the antimuscarinic for life-threatening rhythms, given in escalating doses and followed by its own double act of dry mouth, pupil dilation, urinary retention and the racing heart it was meant to correct. The therapeutic effect and the side effects are the same receptor turned off everywhere at once.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antiplatelet drugs, ADP-receptor antagonists',
    family: 'Cardiovascular',
    drugs: ['Clopidogrel', 'ticagrelor', 'prasugrel'],
    mechanism:
      'Platelets amplify each other by releasing ADP, which binds the P2Y12 receptor to recruit more platelets. Blocking P2Y12 stops that amplification, so the growing arterial plug is starved of reinforcements. These drugs are the second half of dual antiplatelet therapy after a stent or an acute coronary syndrome, because aspirin alone blocks only the thromboxane route. The trade is bleeding — the mechanism and the harm are inseparable, and clopidogrel, a prodrug, loses effect if CYP2C19 is weak.',
    moduleId: 'coagulation',
  },
  {
    className: 'Antiplatelet drugs, aspirin',
    family: 'Cardiovascular',
    drugs: ['Aspirin'],
    mechanism:
      'Irreversibly acetylates platelet COX-1, stopping thromboxane A2 production and so blocking the prostaglandin pathway that recruits and aggregates platelets for the life of the platelet. Low-dose aspirin exploits this: a once-daily dose enough to shut down platelet COX-1 while sparing vascular prostacyclin. The clinical payoff is the cornerstone of secondary prevention in ischaemic heart disease and stroke — and the price is bleeding and gastric irritation, which is why it is stopped around surgery.',
    moduleId: 'coagulation',
  },
  {
    className: 'Beta-blockers',
    family: 'Cardiovascular',
    drugs: ['Bisoprolol', 'atenolol', 'propranolol', 'metoprolol', 'carvedilol'],
    mechanism:
      'By blocking beta-1 receptors the heart slows, its contractility falls and renin release drops, so both rate and output come down against a hard ischaemic demand. That makes beta-blockers the survival drug after an infarct and the rate controller in atrial fibrillation. Non-selective agents like propranolol also block beta-2 receptors in the airway, which is why they are avoided in asthma, and why cardioselective beta-1 blockers still carry a warning. The patient is a heart failure model personified — lower the load and the heart remodels slower.',
    moduleId: 'cardiacElectro',
  },
  {
    className: 'Calcium channel blockers',
    family: 'Cardiovascular',
    drugs: ['Amlodipine', 'felodipine', 'nifedipine', 'diltiazem', 'verapamil'],
    mechanism:
      'Blocking L-type calcium channels lowers the calcium that triggers contraction in vascular smooth muscle and the conducting heart. Dihydropyridines (amlodipine, nifedipine) hit the arteriole hardest — vasodilate, drop pressure, with reflex mild tachycardia. Verapamil and diltiazem hit the node — slow AV conduction and rate, so they treat supraventricular tachycardias and angina. The split is exactly which tissue the calcium entry matters most to: the vessel wall or the node.',
    moduleId: 'cardiorenal',
  },
  {
    className: 'Digoxin',
    family: 'Cardiovascular',
    drugs: ['Digoxin'],
    mechanism:
      'Inhibits the sodium–potassium ATPase, raising intracellular sodium so the sodium–calcium exchanger must work harder, raising intracellular calcium and strengthening contraction. It also slows the AV node via increased vagal tone. Two effects, one molecule: a stronger beat for heart failure and a slower ventricle in atrial fibrillation. The therapeutic window is famously narrow — hypokalaemia makes it toxic, and toxicity shows in the eye (yellow vision) and on the ECG (scooped ST segments, then arrhythmia).',
    moduleId: 'ecgConduction',
  },
  {
    className: 'Direct oral anticoagulants',
    family: 'Cardiovascular',
    drugs: ['Apixaban', 'rivaroxaban', 'edoxaban', 'dabigatran'],
    mechanism:
      'DOACs interrupt a single step of the coagulation cascade directly: dabigatran inhibits thrombin (factor IIa), and apixaban/rivaroxaban/edoxaban inhibit factor Xa, the point where intrinsic and extrinsic pathways converge. Because they act on one enzyme they are fast, predictable and need no routine monitoring — and because they act on a procoagulant enzyme without touching vitamin K, the diet and drug interactions that plague warfarin disappear. The price is bleeding that, unlike warfarin, has only a partial reversal agent.',
    moduleId: 'coagulation',
  },
  {
    className: 'Heparins',
    family: 'Cardiovascular',
    drugs: ['Enoxaparin', 'dalteparin', 'unfractionated heparin'],
    mechanism:
      'Heparin does not clot-bust; it catalyses antithrombin, the body’s own inactivator of thrombin and factor Xa. Unfractionated heparin works on both but needs monitoring and can trigger heparin-induced thrombocytopenia; the low-molecular-weight heparins work on Xa preferentially, are given by weight and need no monitoring, so they have replaced it for most prophylaxis and treatment. The common thread is an instant anticoagulant you can stop and reverse — the reason anaesthesia and acute cardiology rely on it, and why it is used where warfarin (which acts on synthesis) is too slow.',
    moduleId: 'coagulation',
  },
  {
    className: 'Fondaparinux',
    family: 'Cardiovascular',
    drugs: ['Fondaparinux'],
    mechanism:
      'Fondaparinux is a synthetic pentasaccharide that binds antithrombin selectively to inactivate factor Xa — a pure, predictable anticoagulant with no effect on thrombin itself. Because it works solely on one enzyme through antithrombin, it needs no monitoring and carries a very low risk of the heparin-induced thrombocytopenia that complicates the heparin-related agent. It is used for prophylaxis and treatment of venous thromboembolism and in acute coronary syndromes. Its selectivity is also its boundary: it cannot treat conditions needing thrombin inhibition, and like every anticoagulant its price is bleeding.',
    moduleId: 'coagulation',
  },
  {
    className: 'Nitrates',
    family: 'Cardiovascular',
    drugs: ['Glyceryl trinitrate', 'isosorbide mononitrate'],
    mechanism:
      'Nitrates donate nitric oxide, which relaxes vascular smooth muscle via cyclic GMP. Most of the effect is venous: veins dilate, preload falls, and the heart’s oxygen demand drops — the fastest way to abort angina. At higher doses arterial dilatation follows, useful in heart failure and hypertensive emergencies. Tolerance to the resting dose is the classic trap, which is why a nitrate-free interval is built into the day. It is the supply–demand balance of the heart, tilted back in the patient’s favour.',
    moduleId: 'coronaryCirculation',
  },
  {
    className: 'Phosphodiesterase (type 5) inhibitors',
    family: 'Cardiovascular',
    drugs: ['Sildenafil', 'tadalafil', 'vardenafil'],
    mechanism:
      'Blocking PDE5 stops the breakdown of cGMP, letting the nitric-oxide signal linger in vascular smooth muscle. In the corpus cavernosum that sustains the erection nitric oxide initiates; in pulmonary arterioles it lowers pulmonary vascular resistance. Both effects are the same biochemistry in different beds. The risk is the interaction: with any nitrate the two vasodilators multiply into dangerous hypotension, so the drugs are permanently contraindicated together — the reason chest-pain patients are asked about these by name.',
  },
  {
    className: 'Statins',
    family: 'Cardiovascular',
    drugs: ['Atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'],
    mechanism:
      'Inhibiting HMG-CoA reductase, the rate-limiting step of hepatic cholesterol synthesis, both lowers LDL directly and upregulates LDL receptors that clear it from plasma. The cholesterol falls, and with it the atherosclerotic burden. But statins also stabilise plaque beyond the lipid number, reducing inflammation and cardiovascular events even at modest LDL reduction, which is why they are given for risk, not just for a level. Myopathy is the recognised cost, dose- and interaction-dependent.',
    moduleId: 'enzymeKinetics',
  },
  {
    className: 'Warfarin',
    family: 'Cardiovascular',
    drugs: ['Warfarin'],
    mechanism:
      'Blocks vitamin K epoxide reductase, starving the liver of the active vitamin K it needs to carboxylate clotting factors II, VII, IX and X. Because it acts on synthesis, its onset is delayed until existing factors decay, and its dose is balanced between the procoagulant and haemorrhagic edges of the same lever. That is why it needs INR monitoring and why its effect is so sensitive to diet and interacting drugs. The therapeutic aim is a target INR on the anticoagulant scale — too low and you clot, too high and you bleed.',
    moduleId: 'coagulation',
  },

  // ------------------------------------------------------------ Respiratory
  {
    className: 'Acetylcysteine',
    family: 'Respiratory',
    drugs: ['Acetylcysteine'],
    mechanism:
      'Acetylcysteine breaks the disulphide bonds that glue mucus glycoproteins together, thinning tenacious sputum so it can be coughed up — and, far more urgently, it replenishes hepatic glutathione as the antidote for paracetamol overdose. In the overdose the same sulphydryl chemistry that splits mucus restores the liver’s main antioxidant defence, given early within the antidote window to stop the toxic metabolite damaging hepatocytes. The two uses are one molecule: a thiol donor, thrown at whichever structure needs its disulphides handled — a blocked airway or a poisoned liver.',
  },
  {
    className: 'Carbocisteine',
    family: 'Respiratory',
    drugs: ['Carbocisteine'],
    mechanism:
      'Carbocisteine is the everyday mucolytic: it reduces the viscosity of mucus by breaking the disulphide bonds that hold its glycoprotein chains together, so sputum becomes thinner and easier to clear. Its home is chronic obstructive pulmonary disease and bronchiectasis where tenacious secretions block the airways and feed recurrent infection. The mechanism is entirely within the mucus itself — it does not open airways or quiet inflammation — which is why it is an add-on for the patient who cannot clear their own phlegm, and why it is of no use in the asthma that needs an anti-inflammatory instead.',
    moduleId: 'respiratory',
  },
  {
    className: 'Antimuscarinics, bronchodilators',
    family: 'Respiratory',
    drugs: ['Tiotropium', 'umeclidinium', 'glycopyrronium', 'ipratropium'],
    mechanism:
      'Bronchial smooth muscle is held in tone by vagal acetylcholine acting on muscarinic receptors. Antimuscarinic bronchodilators block that resting bronchoconstrictor drive, relaxing the airway — a small effect at rest but a difference you can measure in COPD and asthma, where vagal tone keeps the airway tight. Short-acting ipratropium is first-line for acute exacerbations of COPD alongside a beta-2 agonist; the long-acting agents (tiotropium and the others) give once-daily control because they stay on the receptor.',
    moduleId: 'respiratoryMechanics',
  },
  {
    className: 'Beta2-agonists',
    family: 'Respiratory',
    drugs: ['Salbutamol', 'formoterol', 'salmeterol', 'indacaterol'],
    mechanism:
      'Stimulating beta-2 receptors in bronchial smooth muscle raises cyclic amp and relaxes the airway, giving bronchodilatation within minutes of an inhaled dose — the rescue of an acute asthma attack. They also increase mucociliary clearance and reduce mast-cell mediator release. Short-acting salbutamol is first-line relief; the long-acting agents (salmeterol, formoterol) provide 12-hour control but are never used alone in asthma because they mask deterioration without treating the underlying inflammation, which is why they are paired with an inhaled corticosteroid.',
    moduleId: 'respiratoryMechanics',
  },
  {
    className: 'Corticosteroids, inhaled',
    family: 'Respiratory',
    drugs: ['Beclometasone', 'fluticasone', 'budesonide'],
    mechanism:
      'Inhaled corticosteroids diffuse into airway cells, bind the glucocorticoid receptor and quietly turn down the transcription of inflammatory mediators — the eosinophilic and mast-cell inflammation that is the substrate of asthma. They do not relieve acutely; they prevent, which is why they are the everyday preventive inhaler and why a rescue inhaler is used on top for symptoms. Delivered topically they achieve control at a fraction of the systemic dose, but the price of chronic use is still the local one: oral candidiasis and dysphonia.',
    moduleId: 'respiratory',
  },
  {
    className: 'Leukotriene receptor antagonists',
    family: 'Respiratory',
    drugs: ['Montelukast', 'zafirlukast'],
    mechanism:
      'Cysteinyl leukotrienes released by mast cells and eosinophils are powerful bronchoconstrictors and recruiter chemokines. Antagonising their receptor blocks that arm of the allergic response without touching the histamine or cholinergic ones. Montelukast is the add-on preventive for patients whose asthma, especially in exercise or aspirin-sensitive disease, is driven by the leukotriene pathway. It is a tablet — a compliance win in children — and it works best when leukotrienes are actually the culprit.',
    moduleId: 'respiratory',
  },

  // ------------------------------------------------------------ Renal & electrolytes
  {
    className: 'Bisphosphonates',
    family: 'Renal & electrolytes',
    drugs: ['Alendronic acid', 'risedronate', 'disodium pamidronate', 'zoledronic acid'],
    mechanism:
      'Bisphosphonates bind avidly to bone mineral, then inhibit the osteoclast that tries to resorb that site — its internal mevalonate pathway is blocked by a non-hydrolysable pyrophosphate analogue, so the bone-removing cell dies instead. Net bone resorption falls, protecting against osteoporotic fracture. Because the drug parks in bone for months, dosing is weekly, monthly or even yearly, and the stomach (or, intravenously, the kidney) is where the tolerance is bought. On top of fracture prevention, they lower the calcium of malignancy and Paget’s disease.',
    moduleId: 'calciumHomeostasis',
  },
  {
    className: 'Calcium',
    family: 'Renal & electrolytes',
    drugs: ['Calcium carbonate', 'calcium gluconate'],
    mechanism:
      'Calcium supplements top up intake so the body’s calcium balance does not have to be raided from bone. Oral calcium carbonate corrects deficiency and, with vitamin D, treats rickets, osteomalacia and osteoporosis; intravenous calcium gluconate is the rescue for acutely dangerous low calcium, acting within minutes on the very excitable nerves and muscle that hypocalcaemia threatens with tetany and arrhythmia. The same ion that mineralises bone is the one every excitable cell rests on, which is why the intravenous route is the emergency and the oral route is the maintenance.',
    moduleId: 'calciumHomeostasis',
  },
  {
    className: 'Vitamin D',
    family: 'Renal & electrolytes',
    drugs: ['Colecalciferol', 'alfacalcidol'],
    mechanism:
      'Vitamin D is the hormone that regulates calcium absorption, converted in the liver and kidney to its active form which drives gut and renal calcium uptake. Deficiency collapses that uptake, so the parathyroid gland overworks and the skeleton is stripped to keep serum calcium normal — the rickets and osteomalacia of the deficient. Colecalciferol supplies the parent compound for the body to convert; alfacalcidol is already hydroxylated and so works even when renal conversion fails. The molecule itself is the lever that tells the gut to absorb the calcium the body needs.',
    moduleId: 'calciumHomeostasis',
  },
  {
    className: 'Diuretics, loop',
    family: 'Renal & electrolytes',
    drugs: ['Furosemide', 'bumetanide'],
    mechanism:
      'Blocking the sodium–potassium–chloride cotransporter in the thick ascending limb of Henle stops the kidney reclaiming a quarter of filtered sodium, so massive natriuresis follows with the water that crowds it — the most powerful diuresis available. That is why loop diuretics are the standard for pulmonary oedema, heart failure and any state needing bulk fluid offload. Henle also reclaims calcium and magnesium along the same gradient, so acute high doses push those out too, and the price of efficacy is hypokalaemia, hyponatraemia and a falling blood pressure.',
    moduleId: 'renalTubular',
  },
  {
    className: 'Diuretics, thiazide',
    family: 'Renal & electrolytes',
    drugs: ['Bendroflumethiazide'],
    mechanism:
      'Thiazides block the sodium–chloride cotransporter in the distal convoluted tubule, promoting modest natriuresis but, crucially, sustained lowering of vascular resistance — which is why they are first-line antihypertensives as much as diuretics. The distal tubule is also where calcium is reclaimed, so thiazides retain calcium (protecting bone) while wasting potassium. The textbook pattern is a middle-aged hypertensive treated with a thiazide who needs her potassium watched and her urate checked, because gout is a recognised cost.',
    moduleId: 'renalTubular',
  },
  {
    className: 'Diuretics, thiazide-like',
    family: 'Renal & electrolytes',
    drugs: ['Indapamide', 'chlortalidone'],
    mechanism:
      'Thiazide-like diuretics (indapamide, chlortalidone) act at the same distal sodium–chloride cotransporter as the thiazides, and bendroflumethiazide-like pharmacology, but differ in structure and duration — chlortalidone and indapamide are longer-acting and are the agents of real cardiovascular-outcome trials. Like the thiazides they lower blood pressure partly by natriuresis and partly by reducing vascular resistance, retain calcium and waste potassium. Chlortalidone is often preferred where a true once-daily 24-hour antihypertensive effect is wanted; the potassium and urate costs of the class remain.',
    moduleId: 'renalTubular',
  },
  {
    className: 'Potassium, oral',
    family: 'Renal & electrolytes',
    drugs: ['Potassium bicarbonate', 'potassium chloride'],
    mechanism:
      'Replace the ion that every excitable cell’s resting membrane rests on. Potassium chloride is the standard replacement, because most deficits are of chloride too and it corrects alkalosis; potassium bicarbonate is chosen when the loss is metabolic rather than acid-base. The whole point of oral replacement is to replete intracellular potassium slowly and safely, because intravenous potassium is a rhythm hazard. The rule is never pushed fast: hyperkalaemia kills by the same excitability that hypokalaemia disturbs, so replacement is graded against the ECG and the level.',
    moduleId: 'electrolyteBalance',
  },

  // ------------------------------------------------------------ Endocrine & metabolic
  {
    className: 'Dipeptidylpeptidase-4 inhibitors',
    family: 'Endocrine & metabolic',
    drugs: ['Sitagliptin', 'linagliptin', 'alogliptin'],
    mechanism:
      'The incretin hormone GLP-1 amplifies insulin release in response to a meal and is normally destroyed within minutes by the enzyme DPP-4. Inhibiting DPP-4 lets endogenous GLP-1 last longer, so insulin rises exactly when glucose does. Because the effect is glucose-dependent, DPP-4 inhibitors carry little hypoglycaemia risk and are weight-neutral — the gentlest of the oral agents, added when metformin is not enough. They protect the beta cell’s own feedback loop rather than forcing it.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Insulin',
    family: 'Endocrine & metabolic',
    drugs: ['Insulin aspart', 'insulin glargine', 'biphasic insulin', 'soluble insulin'],
    mechanism:
      'Insulin is the body’s master switch for glucose disposal: it opens glucose uptake in muscle and fat, switches the liver from making to storing glucose, and drives potassium into cells alongside glucose. Different formulations bend the same molecule’s time course — rapid aspart before meals, long-acting glargine as basal cover, biphasic mixtures for convenience. The clinical essence is matching the pharmacokinetics to the patient’s eating and activity, because the drug that rescues DKA and hyperkalaemia is the same one that, overdone, drops a patient into hypoglycaemia.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Metformin',
    family: 'Endocrine & metabolic',
    drugs: ['Metformin'],
    mechanism:
      'Metformin lowers hepatic glucose output and improves peripheral insulin sensitivity without directly raising insulin, so it works in type 2 diabetes without causing hypoglycaemia. It is first-line because it is weight-neutral, cardiovascular-neutral and cheap — the baseline every other agent is added to. Its dose limit is the price of the mechanism: it is cleared by the kidney, and when renal function collapses, the accumulated drug can drive the lactic acidosis that metformin’s name is attached to, so it is held around contrast and acute illness.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Sodium-glucose co-transporter 2 inhibitors',
    family: 'Endocrine & metabolic',
    drugs: ['Empagliflozin', 'dapagliflozin', 'canagliflozin'],
    mechanism:
      'SGLT2 in the proximal tubule is where most filtered glucose is reclaimed; blocking it lets glucose spill into the urine, lowering plasma glucose independently of insulin and without hypoglycaemia. The glycosuria also drags sodium and water out, which is why these drugs protect kidneys and hearts far beyond their glucose-lowering — diuresis and reduced intraglomerular pressure. The payoff is outcome benefit in heart failure and diabetic nephropathy; the costs are genital thrush, euglycaemic ketoacidosis and, in the dehydrated, the perfusion that a true diuretic threatens.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Sulfonylureas',
    family: 'Endocrine & metabolic',
    drugs: ['Gliclazide', 'glimepride', 'glipizide'],
    mechanism:
      'Sulfonylureas close the ATP-sensitive potassium channel on the beta cell, depolarising it and triggering insulin release regardless of glucose — an effective secretagogue that lowers glucose in type 2 diabetes when the beta cells still have output to give. Because release is not glucose-dependent, the price is hypoglycaemia, the reason they are second-line and used with care in the elderly, and weight gain, as extra insulin stores more. They are the direct proof that when the pancreas still works, forcing it works.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Thyroid hormones',
    family: 'Endocrine & metabolic',
    drugs: ['Levothyroxine', 'liothyronine'],
    mechanism:
      'Thyroid hormone sets the metabolic thermostat of every cell, driving oxygen consumption, heat production and cardiac output. Levothyroxine (T4) is the replacement for hypothyroidism because it is stable and converted to the active T3 as needed, restoring the normal axis when the gland cannot. The artistry is dose: enough to normalise TSH, not so much that the patient is over-replaced into atrial fibrillation and bone loss. Thyroid-stimulating hormone is the gauge the dose is titrated against — the axis reads the treatment back to you.',
    moduleId: 'hptAxis',
  },
  {
    className: 'Aminosalicylates',
    family: 'Endocrine & metabolic',
    drugs: ['Mesalazine', 'sulfasalazine'],
    mechanism:
      '5-aminosalicylates act topically on the gut wall, where they reduce the local inflammatory cascade of ulcerative colitis without the systemic immunosuppression of steroids or biologics. Mesalazine is the maintenance and acute-mild treatment for colonic inflammation, delivered where it is needed — orally as pH- or time-released, or rectally. Sulfasalazine couples the salicylate to a sulphonamide carrier that gut bacteria release. The mechanism is local, and so is the side-effect profile, though the sulphonamide part carries the occasional allergy and the folate-deficiency warning.',
  },

  // ------------------------------------------------------------ Gastrointestinal
  {
    className: 'Alginates',
    family: 'Gastrointestinal',
    drugs: ['Alginic acid compound preparations'],
    mechanism:
      'Alginates form a floating raft on top of the gastric contents that physically damps reflux into the oesophagus — a mechanical barrier rather than a chemical one. They are the fast, safe, ingredient-level relief for intermittent heartburn and reflux in pregnancy, where the heavier acid-suppressing drugs are avoided, and they are often added on top of a PPI for breakthrough reflux symptoms. The mechanism works entirely at the surface: no acid is suppressed, so alginates are symptomatic but not disease-modifying and best used for the symptoms they physically block.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Antacids',
    family: 'Gastrointestinal',
    drugs: ['Sodium bicarbonate', 'aluminium hydroxide', 'magnesium trisilicate'],
    mechanism:
      'Antacids are simple bases that neutralise the acid already in the stomach, giving rapid symptomatic relief for heartburn and dyspepsia within minutes — the fastest fix in the acid armamentarium. Because they act on acid that has already been secreted rather than on the secretion itself, the effect is short-lived and must be repeated; magnesium salts loosen the bowel while aluminium salts bind it, which is why the two are often combined. Their simplicity is the appeal for occasional symptoms and reflux in pregnancy, and their brevity is the reason they are not a treatment for ulcer disease.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Antiemetics, dopamine D2-receptor antagonists',
    family: 'Gastrointestinal',
    drugs: ['Metoclopramide', 'prochlorperazine', 'domperidone'],
    mechanism:
      'Dopamine D2 antagonism breaks the loop by which dopamine in the chemoreceptor trigger zone and gut promotes vomiting, and prokinetic agents like metoclopramide add a boost to gastric emptying. Domperidone blocks the same receptor without crossing the blood–brain barrier, so its dystonias are rarer. The class covers the two great sources of nausea at once — the brainstem trigger zone and the gut itself. The caution is the extrapyramidal side effects of the brain-penetrant agents, especially in the young.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Antiemetics, histamine H1-receptor antagonists',
    family: 'Gastrointestinal',
    drugs: ['Cyclizine', 'promethazine', 'cinnarizine'],
    mechanism:
      'H1 antihistamines with a central action damp the vestibular and vomiting circuitry that histamine participates in, making them first choice for motion sickness and vestibular nausea. Cyclizine and promethazine are the reference drugs on a surgical ward’s antiemetic chart, useful for postoperative and opioid-related nausea too. Their mechanism is the same sedation that makes them work — they cross into the brain to act, and the drowsiness (and antimuscarinic dryness) is the price paid at the receptor beside the one that matters.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antiemetics, serotonin 5-HT3-receptor antagonists',
    family: 'Gastrointestinal',
    drugs: ['Ondansetron', 'granisetron'],
    mechanism:
      'Blocking the 5-HT3 receptor where serotonin triggers the vomiting reflex — both in the gut after chemotherapy has hit the mucosa and in the brainstem’s chemoreceptor trigger zone — makes these the most powerful acute antiemetics available, the standard for chemotherapy- and radiotherapy-induced nausea. Ondansetron is also the safe, effective choice for gastroenteritis vomiting. Because one receptor is being blocked, the effect is clean; the cautions are QT prolongation and, because serotonin helps constipation home, a propensity to it.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'H2-receptor antagonists',
    family: 'Gastrointestinal',
    drugs: ['Ranitidine', 'cimetidine', 'famotidine'],
    mechanism:
      'Histamine, released by the enterochromaffin-like cell, is one of the three main drives to acid secretion acting on the parietal cell’s H2 receptor. Blocking that receptor removes histamine’s contribution, cutting acid output substantially — healing peptic ulcers and controlling reflux, and still useful where full suppression is unnecessary. PPIs have largely eclipsed them for severe disease, but H2 blockers remain quick, well tolerated and shorter-acting. Cimetidine carries the incidental cost of inhibiting liver enzymes that metabolise other drugs.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Laxatives, oral',
    family: 'Gastrointestinal',
    drugs: ['Macrogol 3350', 'lactulose (osmotic)', 'senna', 'docusate sodium (stimulant)'],
    mechanism:
      'Laxatives work by either softening or driving the stool. Osmotic agents (macrogol, lactulose) hold water in the bowel lumen, so the stool arrives larger, softer and easier to pass — lactulose also feeds colonic bacteria that ferment it, giving it a slow gentle action. Stimulants like senna act on the enteric nerves to push the colon along, faster but crampy. The logic of choice is physiological: build stool bulk and water for chronic constipation, reach for a stimulant for the sluggish or drug-induced bowel.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Laxatives, rectal',
    family: 'Gastrointestinal',
    drugs: ['Glycerol', 'sodium citrate', 'phosphates'],
    mechanism:
      'Rectal preparations act from the inside out because the rectum is the final chamber. Glycerol and phosphate suppositories draw water in and locally irritate the mucosa, igniting a coordinated defaecation reflex within minutes — reliable and fast, ideal for the constipated patient about to need a procedure or who cannot push. Because they work locally and predictably, they are the pragmatic bridge between oral laxatives and manual evacuation, and the phosphate enema carries a warning against renal patients who cannot excrete the absorbed phosphate.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Proton pump inhibitors',
    family: 'Gastrointestinal',
    drugs: ['Omeprazole', 'lansoprazole', 'esomeprazole'],
    mechanism:
      'The final common step of acid secretion is the H+/K+ ATPase (the proton pump) on the parietal cell, where every stimulus — histamine, gastrin, vagal acetylcholine — converges. PPIs irreversibly inhibit this enzyme, so acid output falls more completely and lastingly than any other drug, because the cell must make new pumps to recover. That is why they heal peptic ulcers, control reflux and protect the stomach from the ulceration of NSAIDs. The catch is the same completeness: lifelong acid suppression carries the risks of hypomagnesaemia, B12 and calcium malabsorption.',
    moduleId: 'gastrointestinal',
  },
  {
    className: 'Prostaglandins and analogues',
    family: 'Gastrointestinal',
    drugs: ['Dinoprostone', 'misoprostol', 'alprostadil', 'iloprost'],
    mechanism:
      'A series of drugs that share a molecule, not a purpose. As prostaglandin analogues they reproduce the hormone’s effects where the prostaglandin is wanted: misoprostol protects the gastric mucosa (countering NSAID damage), softens the cervix and is a uterine oxytocic; dinoprostone induces labour; alprostadil maintains the ductus arteriosus in duct-dependent congenital heart disease; iloprost vasodilates in pulmonary hypertension. The common thread is the receptor each tissue carries for prostaglandins — one molecule, many beds, and the reader must stay alert to which effect is being asked for.',
  },

  // ------------------------------------------------------------ Infection
  {
    className: 'Aminoglycoside',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Gentamicin', 'amikacin', 'neomycin'],
    mechanism:
      'Aminoglycosides bind the 30S ribosomal subunit and corrupt bacterial protein synthesis, causing misreading and cell death — bactericidal, concentration-dependent and active mainly against aerobic Gram-negatives and, combined with a beta-lactam, the enterococcus. Their potency is their constraint: they cross into renal tubular cells and the cochlea, so nephrotoxicity and ototoxicity accumulate with dose, which is why levels are monitored and courses are short. Gentamicin is the workhorse for serious Gram-negative sepsis, dosed by weight and followed to a level.',
  },
  {
    className: 'Azole antifungals',
    family: 'Infection',
    microGroup: 'antifungals',
    drugs: ['Fluconazole', 'itraconazole', 'clotrimazole', 'voriconazole'],
    mechanism:
      'Azoles block the fungal enzyme that converts lanosterol to ergosterol, the load-bearing structural lipid of the fungal cell membrane — without ergosterol the membrane thins, leaks and the yeast cannot survive. Because ergosterol does not exist in human membranes, the selectivity is real, which is why azoles are so safe. Fluconazole is the systemic azole for candida and the easiest choice for mucosal disease; itraconazole and voriconazole broaden into invasive mould infection while inhibiting human cyp enzymes, so drug interactions are the price of their reach.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Echinocandins',
    family: 'Infection',
    microGroup: 'antifungals',
    drugs: ['Caspofungin', 'anidulafungin', 'micafungin'],
    mechanism:
      'Echinocandins inhibit the synthesis of beta-glucan, the polymer that forms the fungal cell wall — a structure human cells simply do not have, so the selectivity against the fungus is absolute. Without beta-glucan the wall cannot withstand the fungus’s own osmotic pressure and the cell lyses. They are fungicidal against candida and active against aspergillus, making them first-line for invasive and candida bloodstream infection, especially in the sick. They are given intravenously because they are not absorbed orally, and their safety, including in liver and kidney disease, matches their specificity.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Polyene antifungals',
    family: 'Infection',
    microGroup: 'antifungals',
    drugs: ['Amphotericin', 'nystatin'],
    mechanism:
      'The polyenes bind ergosterol directly in the fungal membrane and punch holes in it, killing the fungus for as long as the drug is present — fungicidal, broad and, because ergosterol is fungal-specific, selective between the yeast and the host. Their power is their toxicity: intravenous amphotericin is the reserve treatment for the most serious invasive fungal disease but carries nephrotoxicity and infusion reactions, so it is used hard but not often. Nystatin, being unabsorbed, is the same chemistry confined to the mouth and gut, clearing oral and vaginal thrush with almost no systemic effect.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Allylamine antifungals',
    family: 'Infection',
    microGroup: 'antifungals',
    drugs: ['Terbinafine'],
    mechanism:
      'Terbinafine inhibits squalene epoxidase, blocking an early step of fungal ergosterol synthesis and letting the precursor squalene accumulate to toxic levels inside the fungus — it is fungicidal against dermatophytes, the fungi of skin and nail. Because it concentrates in keratin, it is the reference treatment for ringworm and onychomycosis of the nail, given for the weeks or months the new keratin needs to grow out. The mechanism is selective for the fungal enzyme, so it is well tolerated systemically, though oral courses carry a rare hepatotoxicity that means the liver is checked.',
  },
  {
    className: 'Antivirals, nucleoside analogues (anti-herpes)',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Aciclovir', 'valaciclovir'],
    mechanism:
      'Nucleoside analogues look like the building blocks of viral DNA but only become active after a viral enzyme — the thymidine kinase of herpes viruses — phosphorylates them into chain terminators, so they are selectively toxic to infected cells. Aciclovir stops DNA synthesis in herpes simplex and varicella-zoster, treating cold sores, genital herpes, shingles and herpes encephalitis. Because activation is specific to the virus, side effects are mild, but in renal insufficiency the crystallised drug can injure the kidney, and resistance matters in the immunocompromised.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antiretrovirals, nucleoside reverse-transcriptase inhibitors',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Tenofovir', 'emtricitabine', 'abacavir', 'lamivudine'],
    mechanism:
      'The NRTIs are nucleotide or nucleoside analogues that are incorporated into the growing HIV DNA strand by reverse transcriptase — the viral enzyme that transcribes RNA into DNA — and, because they lack the 3′ end needed to continue, they terminate the chain. They are the backbone of combination antiretroviral therapy, given with agents of other classes because a single drug rapidly selects resistant virus. Tenofovir pairs breadth with renal and bone toxicity, abacavir with a hypersensitivity reaction in some patients; their strength is that they stall HIV replication at its very first enzymatic step.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antiretrovirals, non-nucleoside reverse-transcriptase inhibitors',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Efavirenz', 'nevirapine', 'rilpivirine'],
    mechanism:
      'NNRTIs bind to a hydrophobic pocket beside the active site of HIV reverse transcriptase and distort it allosterically, so the enzyme can no longer transcribe viral RNA into DNA — no incorporation into the growing strand happens at all, and replication is halted at its first step. They are potent, orally bioavailable and taken once daily, but the pocket they hit is fragile: a single mutation erases the whole class, so a low genetic barrier to resistance defines them. Efavirenz brings vivid dreams and rash, nevirapine a serious hepatic and skin hypersensitivity, and rilpivirine a gentler profile for the already-suppressed.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antiretrovirals, protease inhibitors',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Darunavir', 'atazanavir', 'ritonavir'],
    mechanism:
      'HIV protease is the enzyme that cleaves the viral polyprotein into the separate functional proteins of the mature virion; protease inhibitors block that cleavage, so the virus is assembled immature and cannot infect new cells. They are potent antiretrovirals, and because the protease is essential they are a mainstay of salvage and first-line therapy. Ritonavir is used at a small dose purely to inhibit the liver enzyme that would otherwise clear its partner, boosting that drug’s level — the notorious “boosting” trick. The costs are the metabolic ones of protease inhibition: lipodystrophy, dyslipidaemia, hyperglycaemia, and drug interactions from the same enzyme they exploit.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antiretrovirals, integrase inhibitors',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Dolutegravir', 'raltegravir', 'bictegravir'],
    mechanism:
      'HIV integrase is what splices the copied viral DNA into the host chromosome, and integrase strand-transfer inhibitors block exactly that insertion step — the last enzymatic step before HIV becomes a permanent, integrated provirus. Because they act so late and so specifically, they are fast, potent and well tolerated, and the modern UK first-line regimens are built around integrase inhibitors (usually dolutegravir) paired with two NRTIs. The integrase enzyme also has built-in resistance that can strike swiftly, so the class is never used alone, and the price of their cleanliness is the attention any antiretroviral demands.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antiretrovirals, fusion and entry inhibitors (CCR5)',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Maraviroc'],
    mechanism:
      'For HIV to enter a host immune cell, the virus’s envelope protein must first dock with the CD4 receptor and then with a co-receptor — most commonly the chemokine receptor CCR5. Maraviroc binds that co-receptor, so the virus has nowhere to grip and cannot fuse with the cell, blocking entry at the very first step rather than inside. It is the sole entry-inhibitor in common use, and it only works against the CCR5-tropic virus (not the CXCR4-tropic variant), so a tropism test gates its use. Its advantage is that it acts outside the cell, where the virus’s mutation cannot readily evade it.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antivirals, neuraminidase inhibitors (anti-influenza)',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Oseltamivir', 'zanamivir'],
    mechanism:
      'Influenza must cut itself free of the infected cell to go on and infect its neighbours, and the enzyme it uses is the surface neuraminidase that severs its bond to the cell’s sialic acid. Neuraminidase inhibitors block that enzyme, so new virus stays tethered to the cell it came from and the infection is contained at its source. Oseltamivir is the oral agent, zanamivir the inhaled one — given early in the illness because the block only helps while virus is still replicating. Their value is modest in the healthy and real in those at risk, curtailing symptoms and spread when started within a day or two.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antivirals, hepatitis',
    family: 'Infection',
    microGroup: 'antivirals',
    drugs: ['Sofosbuvir', 'entecavir', 'tenofovir'],
    mechanism:
      'The hepatitis antivirals attack the enzymes that replicate the hepatitis viruses. Against hepatitis C, the direct-acting antivirals — sofosbuvir is a nucleotide inhibitor of the viral NS5B polymerase — block RNA replication so completely that combination regimens cure over 95% of patients. Against hepatitis B, entecavir and tenofovir inhibit the viral reverse transcriptase/polymerase and so suppress the chronic virus in the liver, keeping viral load and liver damage down. In both, the principle is the same: hit an enzyme the virus needs and the human cell does not, and replication stalls.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Cephalosporins',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Cefalexin', 'cefuroxime', 'ceftriaxone'],
    mechanism:
      'Like all beta-lactams, cephalosporins inhibit bacterial cell-wall cross-linking, weakening the wall until the cell lyses — bactericidal against a wide Gram-positive and Gram-negative net, and safe to dose widely because the target is bacterial. The generations trade coverage: early agents like cefalexin cover skin and Gram-positives, cefuroxime adds respiratory and surgical prophylaxis, and ceftriaxone reaches the meninges and serious Gram-negatives, making it the single daily injection of meningitis and gonorrhoea. The price of breadth is collateral ecology: Clostridioides difficile and resistant organisms flourish where broad beta-lactams go.',
  },
  {
    className: 'Carbapenems',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Meropenem', 'ertapenem'],
    mechanism:
      'Carbapenems are beta-lactams with the widest and most hydrolysis-resistant cell-wall killing of the class: they inhibit the same cross-linking of the bacterial wall as the penicillins and cephalosporins, but their structure shrugs off the beta-lactamase enzymes that destroy those agents, including the extended-spectrum enzymes of resistant Gram-negatives. They are reserve antibiotics, held for serious hospital and multidrug-resistant infection precisely because their reach is broad. That breadth is their own risk — using them widely selects for the carbapenem-resistant organisms nothing else treats, so they are culture-directed and spent sparingly.',
  },
  {
    className: 'Chloramphenicol',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Chloramphenicol'],
    mechanism:
      'Chloramphenicol binds the 50S ribosomal subunit and blocks peptide-bond formation, halting bacterial protein synthesis — broad-spectrum, bacteristatic, and uniquely able to penetrate the eye and cerebrospinal fluid. That utility is what keeps it alive today in topical eye preparations and as a reserve drug for meningitis and typhoid. Its notoriety is haematological: an idiosyncratic, sometimes irreversible aplastic anaemia, which is exactly why systemic use is now reserved for cases with no safer alternative.',
  },
  {
    className: 'Clindamycin',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Clindamycin'],
    mechanism:
      'Clindamycin binds the 50S subunit and inhibits protein synthesis with a particular strength against anaerobes, staphylococci and streptococci — the flora of dental, bone and necrotising infections. It is the standard for anaerobic lung and bone disease and a key player in the antibiotics that cover aspiration and necrotising fasciitis. Its mechanism extends beyond killing: it suppresses toxin production, useful in toxin-mediated disease. The price is a notoriously high risk of Clostridioides difficile colitis because, being biliary-excreted, it concentrates in the gut where it kills the anaerobes that would normally keep C. difficile in check.',
  },
  {
    className: 'Glycopeptide antibiotics',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Vancomycin', 'teicoplanin'],
    mechanism:
      'Glycopeptides bind to the terminal amino-acid of the peptidoglycan precursor, physically preventing the cell wall from being cross-linked — killing Gram-positive organisms, including MRSA, whose beta-lactam ring they do not need. Vancomycin is the reserve drug for serious resistant Gram-positive infection and, given orally (it is not absorbed), the treatment for Clostridioides difficile colitis. Dosing is monitored by trough levels because accumulation injures the kidneys; red-man syndrome is the histamine-release infusion reaction that teaches every new prescriber its delivery.',
    moduleId: 'coagulation',
  },
  {
    className: 'Macrolides',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Clarithromycin', 'azithromycin', 'erythromycin'],
    mechanism:
      'Macrolides bind the 50S ribosomal subunit and halt protein synthesis — bacteriostatic coverage of atypicals, legionella, mycoplasma, chlamydia and pertussis, with a role in Helicobacter pylori eradication and community pneumonia. They inhibit CYP3A4, so they raise the levels of many drugs, the classic interaction being the statin-and-clarithromycin myopathy. They even carry a weak motilin-agonist activity used as a prokinetic in gastroparesis. The caution that unites the class is QT prolongation and, in the thorough antibiotic stewardship sense, resistance from overuse.',
  },
  {
    className: 'Metronidazole',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'nucleic-acid',
    drugs: ['Metronidazole'],
    mechanism:
      'Metronidazole is reduced inside anaerobic bacteria and protozoa to an active free-radical form that damages their DNA — selectively lethal to organisms whose metabolism reduces it: anaerobes, Giardia, amoebae and Trichomonas. It is therefore the reference drug for anaerobic infection (intra-abdominal, dental, brain abscess), pelvic inflammatory disease and a long list of parasitic syndromes. It interferes with alcohol metabolism, so the classic counselling is the disulfiram-like reaction, and it is generally safe enough to use while pregnant.',
  },
  {
    className: 'Nitrofurantoin',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'nucleic-acid',
    drugs: ['Nitrofurantoin'],
    mechanism:
      'Nitrofurantoin is activated by bacterial enzymes into reactive intermediates that damage DNA, RNA and proteins, and it concentrates in urine — the perfect profile for a pure urinary-tract antiseptic. It is the standard for acute uncomplicated cystitis and for long-term prophylaxis against recurrent infection, precisely because it stays in the urine and barely touches the body. The mechanism confines it to the bladder, so it cannot treat pyelonephritis or bacteraemia, and prolonged therapy risks pulmonary fibrosis and a peripheral neuropathy.',
  },
  {
    className: 'Penicillins, antipseudomonal',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Piperacillin with tazobactam'],
    mechanism:
      'A broad-spectrum penicillin (piperacillin) joined to a beta-lactamase inhibitor (tazobactam) that neutralises the enzymes many resistant bacteria use to destroy penicillins. The combination extends beta-lactam cell-wall killing against Enterobacteriaceae, anaerobes and Pseudomonas — a workhorse for severe hospital and nosocomial sepsis where broad empiric cover is urgent. It is the anti-bacterial pharmacy in one infusion, but the very breadth that makes it first-line is what selects for multidrug-resistant organisms, so it is used hard, short and with culture-directed de-escalation.',
  },
  {
    className: 'Penicillins, broad-spectrum',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Co-amoxiclav', 'amoxicillin'],
    mechanism:
      'Amoxicillin, a beta-lactam, inhibits cell-wall synthesis across a wide Gram-positive and Gram-negative range; co-amoxiclav couples it with clavulanic acid, a beta-lactamase inhibitor that disarms the enzymes resistant staphylococci and Gram-negatives use, so the penicillin’s killing is restored. Together they cover respiratory, urinary, skin and dental infection as first-line empiric therapy. The trade is the breadth: clavulanate adds activity but also the colic and the antibiotic-associated diarrhoea, and every course adds selection pressure for the resistant organisms broad spectrum creates.',
  },
  {
    className: 'Penicillins, narrow-spectrum',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'cell-wall',
    drugs: ['Flucloxacillin', 'benzylpenicillin', 'phenoxymethylpenicillin'],
    mechanism:
      'Narrow-spectrum penicillins kill by the same cell-wall mechanism but are prized for what they do not cover. Flucloxacillin is the anti-staphylococcal penicillin, the first-line treatment of skin and soft-tissue infection and osteomyelitis; benzylpenicillin (IV) and phenoxymethylpenicillin (oral) target streptococci and cover endocarditis, cellulitis and prophylaxis of rheumatic fever. Choosing the narrow drug is itself the stewardship lesson — the penicillin that does least collateral damage to the gut flora while stopping the target organism is the right penicillin.',
  },
  {
    className: 'Quinine',
    family: 'Infection',
    microGroup: 'antiparasitics',
    drugs: ['Quinine sulfate'],
    mechanism:
      'Quinine disrupts the malaria parasite’s haem detoxification inside the red cell — the parasite digests haemoglobin into toxic haem, and quinine stops it polymerising that haem into harmless pigment, so the growing trophozoite poisons itself. It remains the treatment for severe and chloroquine-resistant falciparum malaria even though artemisinin combinations now lead elsewhere. It is also a potassium-avid and QT-prolonging drug, and its classic legacy is the cramp cure — an off-licence use built on the same membrane effects that can harm.',
  },
  {
    className: 'Quinolones',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'nucleic-acid',
    drugs: ['Ciprofloxacin', 'levofloxacin', 'ofloxacin', 'moxifloxacin'],
    mechanism:
      'Quinolones poison bacterial DNA gyrase and topoisomerase IV, the enzymes that unwind and separate DNA as bacteria replicate, so DNA synthesis stalls and the organism dies — bactericidal, broad, and orally bioavailable enough to treat serious infection at home. Ciprofloxacin is the reference for Pseudomonas and urinary infection; levofloxacin and moxifloxacin cover respiratory and resistant organisms. Their Achilles heel is connective tissue and cartilage: tendon rupture and a warning in the young and elderly, and they push the risk of C. difficile and aortic dissection high enough to reserve the steepest agents.',
  },
  {
    className: 'Sulfonamides',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'folate',
    drugs: ['Sulfamethoxazole', 'sulfadiazine'],
    mechanism:
      'Sulfonamides block bacterial dihydrofolate synthase, the enzyme that builds folate from para-aminobenzoic acid — so the bacterium cannot make the tetrahydrofolate it needs for DNA synthesis, and growth stalls. They are bacteriostatic and now used sparingly because resistance has spread; their place today is largely inside fixed combinations, most famously as the sulfamethoxazole half of co-trimoxazole, and in topical use. The mechanism is selective because mammals take up pre-formed folate rather than synthesising it, and the clinical cost is the classic sulfa allergies and the photosensitivity that still warn every prescriber about the class.',
  },
  {
    className: 'Oxazolidinones',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Linezolid', 'tedizolid'],
    mechanism:
      'Linezolid binds the 50S ribosomal subunit and blocks the very first step of protein synthesis — the joining of the two ribosomal subunits around the message — so no bacterial protein is made at all, and it does so in a way that resists the cross-resistance of other agents. It is a reserve drug for serious Gram-positive infection, above all meticillin-resistant Staphylococcus aureus and vancomycin-resistant enterococci, and is fully orally bioavailable, letting serious infection be treated at home. The price is its mechanism’s mitochondrial echo: courses beyond a couple of weeks bring bone-marrow suppression, neuropathy and the serotonin-syndrome interaction with serotonergic drugs.',
  },
  {
    className: 'Polymyxins',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'membrane',
    drugs: ['Colistin'],
    mechanism:
      'Colistin, the polymyxin in clinical use, is a cationic peptide that binds the lipopolysaccharide of the Gram-negative outer membrane and disrupts it, so the membrane leaks and the bacterium dies — a detergent-like attack on the very structure that shields many Gram-negatives from other antibiotics. Because no other agent penetrates that membrane in the resistant organisms it targets, colistin is the last-resort drug for multidrug-resistant Acinetobacter and Pseudomonas. That desperation is matched by its toxicity: nephrotoxicity and neurotoxicity limit it to the infections nothing else can touch, and its use is a marker of how far resistance has run.',
  },
  {
    className: 'Lipopeptides',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'membrane',
    drugs: ['Daptomycin'],
    mechanism:
      'Daptomycin is a cyclic lipopeptide that inserts into the bacterial cell membrane in a calcium-dependent way and disrupts it, depolarising the membrane so the bacterium loses its gradient and dies — rapidly bactericidal and, crucially, active against the Gram-positive organisms that resist so many others, including MRSA and vancomycin-resistant enterococci. It is used for serious skin infection, bacteraemia and endocarditis. Because its mechanism is a membrane assault, it is inactivated by the surfactant in lung lining fluid and so cannot treat pneumonia, and muscle toxicity means liver enzymes and a creatine kinase are followed.',
  },
  {
    className: 'Rifamycins',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'nucleic-acid',
    drugs: ['Rifampicin', 'rifabutin'],
    mechanism:
      'Rifampicin binds the bacterial DNA-dependent RNA polymerase and blocks transcription — no messenger RNA, so no protein, and the organism cannot grow. It is one of the most important drugs in the antituberculous regimen and in the treatment of leprosy, and its sterilising action on slowly dividing mycobacteria is why it is the cornerstone that allows a short course. It is also a powerful enzyme inducer that accelerates its own metabolism and that of warfarin, the pill and many antiretrovirals, so it strips the effect out of co-prescribed drugs; orange discoloration of secretions is its benign biological signature.',
  },
  {
    className: 'Antituberculous drugs',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'antituberculous',
    drugs: ['Isoniazid', 'ethambutol', 'pyrazinamide'],
    mechanism:
      'Tuberculosis is treated by a regimen that pairs drugs hitting different steps of the mycobacterium, so no population of bacilli is left to a single mechanism. Isoniazid inhibits the synthesis of mycolic acid, the mycobacterial wall’s signature lipid; pyrazinamide acts in the acidic intracellular compartment where the dormant bacilli hide; ethambutol blocks arabinogalactan of the wall. The standard short-course is a rifampicin-plus-these rhythm, under direct observation because compliance is treatment. Each carries its own cost — isoniazid the peripheral neuropathy (prevented by pyridoxine) and hepatitis, ethambutol the red-green colour-vision loss, pyrazinamide the gout — and the combination is what makes cure possible and resistance rare.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Antimalarials',
    family: 'Infection',
    microGroup: 'antiparasitics',
    drugs: ['Chloroquine', 'artemether-lumefantrine', 'mefloquine'],
    mechanism:
      'Antimalarials attack the parasite at the point where it is most vulnerable — inside the red cell, digesting haemoglobin. Chloroquine accumulates in the parasite’s food vacuole and blocks the detoxification of haem, so the parasite is poisoned by its own digestion; the artemisinin derivatives (artemether, in combination with lumefantrine) generate free radicals that damage parasite proteins. Artemisinin-based combinations are now the standard, first-line cure for uncomplicated falciparum malaria because they are fast and potent. The mechanism drives the choice at every step — speed for the dangerously sick, and treatment in combination because the parasite mutates away from single agents.',
  },
  {
    className: 'Anthelminthics',
    family: 'Infection',
    microGroup: 'antiparasitics',
    drugs: ['Albendazole', 'mebendazole'],
    mechanism:
      'Anthelminthics bind the beta-tubulin of the worm and stop it polymerising into the microtubules the parasite needs for its gut and its uptake of glucose, so the worm starves and dies slowly — and because the human microtubule is far less sensitive, the selectivity spares the host. Albendazole and mebendazole are the broad-spectrum agents for intestinal roundworm, hookworm, whipworm and threadworm, routinely given to whole populations where soil-transmitted helminths are common. The mechanism’s slow action is also why a second dose is often needed, and why treating the family, not just the index case, is the worm’s defeat.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Tetracyclines',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Doxycycline', 'lymecycline'],
    mechanism:
      'Tetracyclines bind the 30S ribosomal subunit and block aminoacyl-tRNA docking, starving bacterial protein synthesis — broad-spectrum bacteriostatic agents with a special place in atypical respiratory infection, acne, Lyme disease, rickettsia and malaria prophylaxis. Doxycycline is the everyday choice for its long half-life and skin penetration. Chelation with calcium and iron is their famous dietary interaction, so they are taken apart from the mineral supplements that would bind them, and they are avoided in children and pregnancy because they discolour growing teeth.',
  },
  {
    className: 'Glycylcyclines',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'protein',
    drugs: ['Tigecycline'],
    mechanism:
      'The glycylcycline tigecycline is a modified tetracycline engineered to evade the two resistance mechanisms that defeat the parent drugs: the active-efflux pumps and the ribosomal-protection proteins that stop doxycycline working. It binds the 30S subunit with higher affinity than the tetracyclines and holds on even in resistant bacteria, restoring broad Gram-positive, Gram-negative and anaerobe coverage. That potency is reserved for resistant intra-abdominal and skin infections because it is intravenous-only and carries significant nausea, plus a mortality warning in some uses — the price of the drug that beats the pumps.',
  },
  {
    className: 'Trimethoprim',
    family: 'Infection',
    microGroup: 'antibiotics',
    moa: 'folate',
    drugs: ['Trimethoprim', 'co-trimoxazole'],
    mechanism:
      'Trimethoprim blocks bacterial dihydrofolate reductase, halting folate synthesis and so DNA building — a selective inhibitor because the bacterial enzyme is far more sensitive than the human one. It concentrates in urine, making it a urinary-tract workhorse; co-trimoxazole adds a sulphonamide that blocks an earlier step in the same folate pathway, the double blockade used in Pneumocystis pneumonia and toxoplasmosis. The folate mechanism is also the caution: prolonged or high-dose therapy can produce a megaloblastic picture, and it is potassium-avid.',
  },

  // ------------------------------------------------------------ Haematology & oncology
  {
    className: 'Hormone antagonists used in breast and prostate cancer',
    family: 'Haematology & oncology',
    drugs: ['Tamoxifen', 'letrozole', 'anastrozole', 'bicalutamide'],
    mechanism:
      'Hormone-sensitive cancers are fed by the hormones that drive their tissue of origin, and the antagonists cut that supply at the receptor or its production. Tamoxifen blocks the oestrogen receptor (and in bone acts as a partial agonist); letrozole and anastrozole are aromatase inhibitors that stop oestrogen being made; bicalutamide blocks the androgen receptor. Each attacks a different step of the same hormonal loop, which is why sequencing them slows breast and prostate cancer — and why the side effects are the hormones themselves: hot flushes, osteoporosis and endocrine upset.',
    moduleId: 'hpgAxis',
  },
  {
    className: 'Hormone agonists used in breast and prostate cancer',
    family: 'Haematology & oncology',
    drugs: ['Goserelin'],
    mechanism:
      'Goserelin is a gonadotrophin-releasing-hormone agonist that, by sustained stimulation, paradoxically shuts down the pituitary’s LH and FSH drive — after a brief flare the receptors desensitise and the testis stops making testosterone (or, with the same chemistry, the ovary stops oestrogen). That medical “castration” is how hormone-sensitive prostate cancer is starved of its fuel without surgery. The initial flare is the mechanism’s signature: androgen surges before they fall, which is why it is sometimes combined with an anti-androgen at the start, and why men get the hot flushes of the very hormone being removed.',
    moduleId: 'hpgAxis',
  },
  {
    className: 'Iron',
    family: 'Haematology & oncology',
    drugs: ['Ferrous sulfate', 'ferrous fumarate'],
    mechanism:
      'Iron is the substrate the erythron needs to build haemoglobin, and oral replacement replenishes the exhausted stores that produce the microcytic anaemia of deficiency. Ferrous sulfate is the standard: absorbed in the proximal duodenum, then ferried to the marrow. Improvement is deliberately gradual — the reticulocyte count climbs over a week and the haemoglobin over a month, and the treatment is continued to refill stores, not just normalise the level. The side effects are the same chemistry in the gut: dark stools and constipation from the unabsorbed iron.',
    moduleId: 'erythropoiesis',
  },
  {
    className: 'Methotrexate',
    family: 'Haematology & oncology',
    drugs: ['Methotrexate'],
    mechanism:
      'Methotrexate inhibits dihydrofolate reductase, starving cells of the reduced folate needed for DNA synthesis — most toxic to rapidly dividing cells, which is how it treats malignancy, psoriasis and rheumatoid arthritis. At the low weekly doses used in inflammatory disease the cellular-flux mechanism shifts to an anti-inflammatory one, which is why it is the anchor disease-modifying drug in rheumatology. The dose route could not matter more here: weekly in autoimmune disease, and a mistaken daily dose is a medical emergency, protected against by checking the folate and the blood count at the same time.',
    moduleId: 'cellCycle',
  },
  {
    className: 'Monoclonal antibodies',
    family: 'Haematology & oncology',
    drugs: ['Infliximab', 'adalimumab', 'denosumab', 'rituximab', 'omalizumab'],
    mechanism:
      'Monoclonal antibodies are engineered to bind a single target with precision, and they treat by what they stick to. Infliximab and adalimumab neutralise tumour necrosis factor, damping the inflammation of Crohn’s and rheumatoid arthritis; rituximab depletes B cells via CD20; omalizumab binds IgE; denosumab blocks RANKL to stop osteoclasts. Each is a lock and key aimed at one molecule, so the effects are targeted — and the price of that precision is immunosuppression, infusion reactions, and progressive multifocal leucoencephalopathy risk from the very specificity that makes them effective.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Tranexamic acid',
    family: 'Haematology & oncology',
    drugs: ['Tranexamic acid'],
    mechanism:
      'Fibrinolysis dissolves the clot; tranexamic acid competitively blocks the lysine-binding site on plasminogen, stopping it being converted to the active plasmin that would chew the clot away. It therefore holds a clot together that the body is trying to take down — useful in menorrhagia, dental and surgical bleeding, and trauma, where early use in significant bleeding that cannot be controlled reduces death. The mechanism is a brake on breakdown rather than a boost to clotting, and that distinction is why it is safe where pro-coagulants would not be.',
    moduleId: 'coagulation',
  },
  {
    className: 'Vitamins',
    family: 'Haematology & oncology',
    drugs: ['Folic acid', 'thiamine', 'hydroxocobalamin', 'phytomenadione'],
    mechanism:
      'These vitamins each feed a specific metabolic step that, when deficient, produces a characteristic syndrome. Folic acid and hydroxocobalamin (B12) are both cofactors in DNA synthesis, and deficiency of either gives a megaloblastic anaemia — but B12 also sustains the nervous system, so its deficiency adds neurological damage that folate replacement would not prevent. Thiamine powers carbohydrate oxidation and its deficiency causes beriberi and Wernicke’s; phytomenadione (vitamin K) carboxylates the clotting factors, and deficiency bleeds. Replacement is aimed at the exact deficient step, and B12 is repleted rather than left to diet because the gut cannot absorb it in pernicious anaemia.',
    moduleId: 'erythropoiesis',
  },

  // ------------------------------------------------------------ CNS & psychiatry
  {
    className: 'Acetylcholinesterase inhibitors',
    family: 'CNS & psychiatry',
    drugs: ['Donepezil', 'rivastigmine', 'pyridostigmine'],
    mechanism:
      'By inhibiting the enzyme that breaks down acetylcholine, these drugs make the neurotransmitter last longer at the synapse. In Alzheimer’s disease that preserves the depleted central cholinergic transmission that memory depends on, delivering modest cognitive benefit. Pyridostigmine aims the same mechanism at the neuromuscular junction, boosting the acetylcholine that myasthenia gravis is destroying — the first-line treatment there. The side effects are the flip side of the mechanism: too much acetylcholine means bradycardia, salivation, lacrimation, urination and diarrhoea, the cholinergic cascade, and all of them are acetylcholine doing too well everywhere at once.',
    moduleId: 'neuromuscularJunction',
  },
  {
    className: 'Antidepressants, selective serotonin reuptake inhibitors',
    family: 'CNS & psychiatry',
    drugs: ['Sertraline', 'citalopram', 'fluoxetine', 'escitalopram'],
    mechanism:
      'SSRIs block the serotonin transporter, so serotonin stays longer in the synaptic cleft and transmission is enhanced. They are first-line for depression, generalised anxiety, panic, OCD and PMDD because this single mechanism is well tolerated, non-sedating and overdose-forgiving relative to the older tricyclics. The effects lag the mechanism by weeks, and the discontinuation syndrome comes from the same transporter rebound, so drugs are tapered. Sexual dysfunction and, in the young or early, a transient rise in suicidal thinking are the recognised costs of boosting one monoamine system on its own.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antidepressants, tetracyclic',
    family: 'CNS & psychiatry',
    drugs: ['Mirtazapine'],
    mechanism:
      'Mirtazapine is the tetracyclic antidepressant, and its mechanism is presynaptic disinhibition: it blocks the alpha-2 autoreceptors that normally hold back the release of serotonin and noradrenaline, so both monoamines pour out and mood lifts. Its special shape is the histamine H1 antagonism that gives it sedation, and the serotonin-2 block that adds to sleep and appetite. That makes it useful in depression with insomnia and poor appetite, and largely free of the sexual and gastrointestinal side effects of the SSRIs. Its price is sedation, weight gain and, rarely, blood dyscrasia.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antidepressants, serotonin-noradrenaline reuptake inhibitors',
    family: 'CNS & psychiatry',
    drugs: ['Venlafaxine', 'duloxetine'],
    mechanism:
      'SNRIs block the reuptake of both serotonin and noradrenaline, raising two monoamines where the SSRIs raise one. Because they engage noradrenaline as well, they are effective where an SSRI alone has failed, and the noradrenergic component is what makes duloxetine a first-line drug for neuropathic pain as much as depression, and venlafaxine useful in anxiety. The trade is the additional noradrenergic load: raised blood pressure, a pronounced withdrawal syndrome on stopping, and serotonin toxicity when combined with other serotonergic drugs — the price of widening the net beyond the single transporter.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antidepressants, tricyclics',
    family: 'CNS & psychiatry',
    drugs: ['Amitriptyline', 'nortriptyline', 'lofepramine'],
    mechanism:
      'Tricyclics block reuptake of both serotonin and noradrenaline, lifting mood, but they also block histamine, muscarinic and alpha-adrenergic receptors — which is why they cause sedation, dry mouth, constipation, postural hypotension and are cardiotoxic in overdose with arrhythmia. Nowadays they are prescribed more for the side-effect pharmacology than the mood: low-dose amitriptyline for neuropathic pain and migraine prophylaxis exploits the noradrenergic analgesia while the sedation helps sleep. The class is effective and dangerous, and the modern role is largely in the sub-antidepressant doses that keep the benefit and shed some risk.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antidepressants, related',
    family: 'CNS & psychiatry',
    drugs: ['Trazodone'],
    mechanism:
      'Trazodone is the “related” antidepressant that works mainly by blocking the serotonin-2 receptor and the serotonin transporter, and at low doses its effect is dominated by the histamine and serotonin-2 antagonism that produce marked sedation. It is therefore used far more often as a sleep aid in depression and anxiety — at doses well below its antidepressant range — than as a true mood-lifting agent. The serotonin-2 block also frees noradrenaline and dopamine, which is why it is less likely to cause the sexual and sleep-suppressing side effects of the SSRIs, its sedation being its defining and most useful property.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antipsychotics, first-generation (typical)',
    family: 'CNS & psychiatry',
    drugs: ['Haloperidol', 'chlorpromazine', 'flupentixol'],
    mechanism:
      'Typical antipsychotics are dopamine D2 receptor antagonists, and it is this single blockade that treats the positive symptoms of schizophrenia — hallucination and delusion — by damping mesolimbic dopamine. The same blockade elsewhere is the cost: the nigrostriatal D2 block causes the parkinsonism, dystonia and tardive dyskinesia that gave the class its motor notoriety, and the tuberoinfundibular block raises prolactin. Haloperidol is also the potent choice for acute behavioural disturbance. The mechanism is pure dopamine antagonism, and the motor price is written into it.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Antipsychotics, second-generation (atypical)',
    family: 'CNS & psychiatry',
    drugs: ['Quetiapine', 'olanzapine', 'risperidone', 'clozapine'],
    mechanism:
      'Atypical antipsychotics antagonise dopamine D2 less tightly (or transiently, as with quetiapine) and add serotonin 5-HT2 blockade, which is why they control the positive and negative symptoms of schizophrenia with far fewer extrapyramidal side effects than the typicals — the 5-HT2 block sits on the D2 block and loosens its motor grip. That gentler receptor profile, however, buys a metabolic price: weight gain, diabetes and dyslipidaemia are the new signature toxicities. Clozapine is the most effective but carries the idiosyncratic agranulocytosis risk that mandates blood-count monitoring, the cost of the drug that works when all others fail.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Benzodiazepines',
    family: 'CNS & psychiatry',
    drugs: ['Diazepam', 'midazolam', 'lorazepam', 'chlordiazepoxide'],
    mechanism:
      'Benzodiazepines bind an allosteric site on the GABA-A receptor and increase the frequency of chloride-channel opening, so the brain’s main inhibitory neurotransmitter works harder — producing anxiolysis, sedation, muscle relaxation and, at sufficient dose, anticonvulsant action. Lorazepam and diazepam stop status epilepticus by this enhancement; midazolam is the procedural sedative; diazepam treats alcohol withdrawal because it replaces the CNS depression alcohol leaves behind. They are effective and widely useful, and their limitation is that they potentiate, not mediate, inhibition — tolerance, dependence and a dangerous synergy with other depressants are built into potentiation.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Carbamazepine',
    family: 'CNS & psychiatry',
    drugs: ['Carbamazepine'],
    mechanism:
      'Carbamazepine blocks voltage-gated sodium channels in their inactivated state, preferentially silencing the rapidly firing neurons that drive epileptic discharge and neuropathic pain. It is first-line for focal and generalised tonic-clonic seizures, and the reference drug for trigeminal neuralgia, where the same channel blockade calms a hyperexcitable nerve. It is also a powerful enzyme inducer — it upregulates the very liver enzymes that clear it, which is why it induces its own metabolism and why it strips the effect out of the pill, warfarin and the contraceptive it is prescribed alongside.',
    moduleId: 'membranePotentials',
  },
  {
    className: 'Dopaminergic drugs for Parkinson\u2019s disease',
    family: 'CNS & psychiatry',
    drugs: ['Levodopa (as co-careldopa, co-beneldopa)', 'ropinirole', 'pramipexol'],
    mechanism:
      'Parkinson’s disease is the progressive death of the dopaminergic cells of the substantia nigra, and these drugs replace or imitate the missing dopamine. Levodopa crosses into the brain and is converted to dopamine; it is given with a peripheral decarboxylase inhibitor (carbidopa in co-careldopa) so the dopamine is made in the brain, not the gut. Dopamine agonists like ropinirole and pramipexol act directly on the receptors. Their limitation is the mechanism: continued receptor stimulation becomes dyskinesia and motor fluctuations with time, the dopamine that relieves also distorting movement after prolonged use.',
    moduleId: 'motorControl',
  },
  {
    className: 'Gabapentinoids',
    family: 'CNS & psychiatry',
    drugs: ['Pregabalin', 'gabapentin'],
    mechanism:
      'Gabapentinoids bind the alpha-2-delta subunit of voltage-gated calcium channels, reducing the release of excitatory neurotransmitters in the overactive pain and seizure circuits they quieten. Pregabalin and gabapentin are first-line for neuropathic pain of all sorts — post-herpetic, diabetic, fibromyalgia — and adjuncts in focal epilepsy and generalised anxiety. They are remarkably well tolerated for the breadth they cover, but the mechanism’s neuronal calming is also the tapering problem: abrupt withdrawal precipitates anxiety, insomnia and rebound, so they must be reduced gradually.',
    moduleId: 'somaticSensation',
  },
  {
    className: 'Lamotrigine',
    family: 'CNS & psychiatry',
    drugs: ['Lamotrigine'],
    mechanism:
      'Lamotrigine blocks voltage-gated sodium channels and inhibits glutamate release, stabilising the neuronal membrane so that hypersynchronous, spreading discharge is suppressed. It is broad-spectrum for focal and generalised seizures, and effective in bipolar depression because of the same excitatory-calming effect. Its one serious price is the mechanism’s immunogenicity: a potentially severe rash, including Stevens–Johnson syndrome, if the dose is escalated too quickly — so lamotrigine is always introduced slowly, a titration that is as much safety as it is tolerability.',
    moduleId: 'membranePotentials',
  },
  {
    className: 'Opioids',
    family: 'CNS & psychiatry',
    drugs: ['Morphine', 'oxycodone', 'codeine', 'dihydrocodeine', 'tramadol'],
    mechanism:
      'Opioids act on mu receptors in the brain and spinal cord and on the gut, suppressing the transmission of pain while simultaneously releasing the descending inhibition of it. Morphine is the reference strong analgesic and the drug of respiratory distress and acute severe pain; codeine and tramadol are weaker, and tramadol adds a serotonergic component. The mu mechanism is the whole contract: analgesia and the euphoria that makes it addictive, respiratory depression that makes it lethal, and constipation and miosis that follow at the same receptor. Chronic use meets tolerance, and withdrawal is the mirror of the effect.',
    moduleId: 'somaticSensation',
  },
  {
    className: 'Paracetamol',
    family: 'CNS & psychiatry',
    drugs: ['Paracetamol'],
    mechanism:
      'Paracetamol’s mechanism is still debated but it likely acts as a weak COX inhibitor centrally and, in a newly understood pathway, reduces a pro-nociceptive oxidant in the spinal cord — raising the pain threshold without the peripheral anti-inflammatory action or gastrointestinal toxicity of the NSAIDs. That makes it the safe everyday analgesic and antipyretic for mild pain and fever, and the foundation of the who pain ladder. Its danger is metabolic rather than mechanism-specific: at overdose the excess is shunted to a toxic metabolite that depletes glutathione and destroys the liver, which is why acetylcysteine, the glutathione donor, is the antidote.',
    moduleId: 'somaticSensation',
  },
  {
    className: 'Racetams',
    family: 'CNS & psychiatry',
    drugs: ['Levetiracetam', 'brivaracetam'],
    mechanism:
      'Levetiracetam is unusual: rather than blocking a channel, it binds the synaptic vesicle protein SV2A, blunting the release of neurotransmitter that sustains seizure spread — broad-spectrum and, when measured by side effects, cleaner than many alternatives. It is now first-line for focal and generalised-onset seizures precisely because that mechanism spares the sedation and cognition that other agents trade away. The price is behavioural rather than metabolic: irritability and, occasionally, mood disturbance, usually dose-dependent.',
    moduleId: 'membranePotentials',
  },
  {
    className: 'Serotonin 5-HT1-receptor agonists (triptans)',
    family: 'CNS & psychiatry',
    drugs: ['Sumatriptan', 'zolmitriptan'],
    mechanism:
      'Triptans stimulate serotonin 5-HT1B/1D receptors on cranial blood vessels, constricting the dilated, throbbing vessels of a migraine attack, and on trigeminal nerve terminals, blocking the release of the inflammatory peptides that drive the pain. Given early in an attack they abort it rather than merely palliate. Their power is also their limit: because they constrict vessels, they are contraindicated in ischaemic heart disease and after stroke — the pain-relieving vasoconstriction cannot be used where vasoconstriction is itself the danger.',
    moduleId: 'cerebralPerfusion',
  },
  {
    className: 'Valproate (valproic acid)',
    family: 'CNS & psychiatry',
    drugs: ['Sodium valproate', 'valproic acid'],
    mechanism:
      'Valproate blocks voltage-gated sodium channels, enhances GABA-mediated inhibition and dampens the runaway neuronal firing of seizures — broad-spectrum and the first line for generalised epilepsy, especially juvenile myoclonic, and for bipolar mania. It is also the most teratogenic antiepileptic, causing neural-tube defects and lowering IQ in the exposed fetus, so its prescription in women of childbearing age is governed by a prevention programme. The price of the broad mechanism in the adult is hepatotoxicity and weight gain, and the risk is why it sits behind a tightly controlled licence in young women.',
    moduleId: 'membranePotentials',
  },
  {
    className: 'Z-drugs',
    family: 'CNS & psychiatry',
    drugs: ['Zopliclone', 'zolpidem'],
    mechanism:
      'Zopiclone and zolpidem bind the same benzodiazepine site on the GABA-A receptor but select the alpha-1 subunit, favouring the sleep-promoting sedative effect over the anxiolytic and muscle-relaxant ones. They are intended as short, hypnotic-only treatment for insomnia — induction mainly, with less daytime hangover than the benzodiazepines. The selectivity is relative, not absolute: they still carry tolerance, dependence and rebound insomnia, and they add their own signature of morning drowsiness and, occasionally, the parasomnias that name them (zolpidem’s sleep-walking and amnesia). Prescribing is therefore short and reviewed.',
    moduleId: 'autonomicNervous',
  },

  // ------------------------------------------------------------ Musculoskeletal & inflammation
  {
    className: 'Allopurinol',
    family: 'Musculoskeletal & inflammation',
    drugs: ['Allopurinol'],
    mechanism:
      'Allopurinol inhibits xanthine oxidase, the final enzyme that makes uric acid from purine breakdown, so urate production falls and the monosodium urate crystal deposits of gout can dissolve. It is the urate-lowering therapy that prevents future attacks, and it must be started at a low dose and escalated because, counterintuitively, shifting urate can first precipitate an attack and, in rare severe cases, a hypersensitivity reaction. The mechanism addresses the cause — the urate load — rather than the acute inflammation, which is why prophylaxis is the long-term treatment and an NSAID covers the flare while it settles.',
  },
  {
    className: 'Non-steroidal anti-inflammatory drugs (NSAIDs)',
    family: 'Musculoskeletal & inflammation',
    drugs: ['Ibuprofen', 'diclofenac', 'naproxen'],
    mechanism:
      'NSAIDs inhibit cyclo-oxygenase, blocking the conversion of arachidonic acid to prostaglandins — the mediators of pain, fever and inflammation — but also the renal and gastric prostaglandins that protect the stomach and kidney. Ibuprofen and naproxen are first-line for musculoskeletal pain, fever and gout flares; diclofenac is a potent non-selective agent. The mechanism binds the anti-inflammatory benefit and the ulcer and renal cost to the same enzyme: blocked in pain-transmitting tissue it treats, blocked in the stomach it injures, blocked in the kidney it impairs. The dose range and the warnings come from that single shared target.',
    moduleId: 'inflammation',
  },
  {
    className: 'COX-2 inhibitors',
    family: 'Musculoskeletal & inflammation',
    drugs: ['Etoricoxib', 'celecoxib'],
    mechanism:
      'COX-2 inhibitors selectively block the inducible cyclo-oxygenase-2 that makes the prostaglandins of inflammation, while sparing the constitutive COX-1 that protects the gastric lining — so they treat the same pain and inflammation as a NSAID with measurably fewer ulcers. The selectivity is their famous boundary: COX-2 is not confined to inflammation, and blocking it in the vessel wall and kidney removes the protection of prostacyclin, so they carry the same renal effects and a greater cardiovascular risk than traditional NSAIDs. Etoricoxib and celecoxib are chosen where gastrointestinal safety matters more than cardiac caution.',
    moduleId: 'inflammation',
  },
  {
    className: 'Corticosteroids, systemic',
    family: 'Musculoskeletal & inflammation',
    drugs: ['Dexamethasone', 'prednisolone', 'hydrocortisone'],
    mechanism:
      'Glucocorticoids bind an intracellular receptor that both increases and decreases gene transcription, broadly suppressing the cytokines and leukocytes of inflammation and immunity. Prednisolone is the everyday systemic anti-inflammatory for asthma, inflammatory bowel, autoimmune disease and many inflammatory emergencies; hydrocortisone is the stress-replacement for adrenal crisis; dexamethasone is the potent anti-oedema steroid of brain tumours and the adjunct of severe covid pneumonia. The price of the wide net is its own physiology — weight gain, hyperglycaemia, osteoporosis, immunosuppression — and suppression of the HPA axis, so withdrawal must be gradual.',
    moduleId: 'hpaAxis',
  },

  // ------------------------------------------------------------ Dermatology, eyes & allergy
  {
    className: 'Antihistamines (H1-receptor antagonists)',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Cetirizine', 'fexofenadine', 'loratadine', 'chlorphenamine'],
    mechanism:
      'H1 antihistamines block the histamine receptor that drives the itch, wheal and flare of allergy at the skin and mucosa. The modern nonsedating agents (cetirizine, loratadine, fexofenadine) stay out of the brain and are the everyday treatment for allergic rhinitis and urticaria; chlorphenamine is the classical sedating antihistamine used in anaphylaxis and acute allergy for its additional central calming. The mechanism reverses the hives and runny nose, not the bronchospasm of severe reaction, and the split between sedating and nonsedating is exactly which side of the blood–brain barrier the receptor block acts on.',
    moduleId: 'hypersensitivity',
  },
  {
    className: 'Corticosteroids, nasal',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Beclometasone', 'mometasone', 'fluticasone'],
    mechanism:
      'Topical nasal corticosteroids suppress the allergic inflammation of the nasal mucosa directly, in the same glucocorticoid manner as their inhaled and systemic relatives but concentrated where it is needed. They are the most effective preventive treatment for allergic rhinitis, superior to antihistamines for the congestion and nasal blockage that histamine alone does not fully explain, and used also for nasal polyps. Because the dose is local, systemic absorption is minimal; the price is the local one of dryness, epistaxis and, occasionally, the same mucosal thinning of any chronic topical steroid whilst on it.',
    moduleId: 'hypersensitivity',
  },
  {
    className: 'Corticosteroids, topical',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Hydrocortisone', 'betamethasone', 'clobetasone'],
    mechanism:
      'Applied to the skin, topical corticosteroids suppress the local inflammatory infiltrate of eczema, psoriasis and dermatitis by the same glucocorticoid receptor mechanism used systemically, but without meaningful absorption. Potency is graded — hydrocortisone mild for the face and flexures, clobetasone moderate, betamethasone strong — matching the treatment to the site and thickness of skin. The harm comes from misuse in exactly that gradient: overpotent steroid on thin skin thins it further, and the same suppression that clears eczema can, used wrongly, cause striae, telangiectasia and tachyphylaxis.',
    moduleId: 'hypersensitivity',
  },
  {
    className: 'Emollients',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Liquid paraffin', 'white soft paraffin'],
    mechanism:
      'Emollients restore the damaged skin barrier by laying down a water-retentive lipid film, trapping moisture and reducing the trans-epidermal water loss that drives the dryness, itching and cracking of eczema and ichthyosis. Liquid paraffin and white soft paraffin are the simplest occlusive forms, and they are the foundation of all eczema management — the first-line, unlimited treatment that corticosteroids are layered on top of at the active patches. Their role is mechanical: rebuilt skin that is less irritated and less permeable to the irritants that would inflame it.',
  },
  {
    className: 'Ocular lubricants (artificial tears)',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Hypromellose', 'carbomers', 'liquid and white soft paraffin'],
    mechanism:
      'Artificial tears replace the deficient aqueous layer of a dry eye, re-establishing a stable tear film that keeps the corneal surface moist and comfortable. Hypromellose and carbomers are aqueous gels that lubricate and delay evaporation; paraffin-based ointments are more viscous and better for night-time cover because they sit on the lid margin and hold moisture longest. None of them treats the cause of dry eye — inflammation or tear-gland failure — but they restore the symptom, which is why they are the safe, ubiquitous first-line and the base on which specific dry-eye therapy is built.',
  },
  {
    className: 'Oestrogens',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Ethinylestradiol', 'estradiol'],
    mechanism:
      'Oestrogen is the hormonal lever of the menstrual cycle and its replacement. Given as ethinylestradiol with a progestogen in the combined pill, it prevents ovulation by negative feedback on the pituitary, suppressing the mid-cycle surge that releases an egg. Given alone as estradiol, it is hormone-replacement that treats the vasomotor and atrophic symptoms of the menopause. Oestrogen drives endometrial proliferation, and that is exactly why it is never given unopposed in a woman with a uterus — the risk of endometrial cancer — which is why the progestogen almost always travels with it.',
    moduleId: 'hpgAxis',
  },
  {
    className: 'Progestogens',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Levonorgestrel', 'desogestrel', 'medroxyprogesterone'],
    mechanism:
      'Progestogens act on the progesterone receptor to convert the oestrogen-primed endometrium into its secretory phase, and that single action drives their uses. As the progestogen-only pill (desogestrel), they suppress ovulation and thicken cervical mucus so sperm cannot pass — contraception without oestrogen for those who cannot take it. In combined contraception they prevent the endometrial hyperplasia that unopposed oestrogen would cause, and in the mirena-like and menopause settings they control bleeding and protect the endometrium. The mechanism is the hormone that readies the uterus, which is both the contraceptive purpose and the protective one.',
    moduleId: 'hpgAxis',
  },
  {
    className: 'Prostaglandin analogue eye drops',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Latanoprost'],
    mechanism:
      'Latanoprost is a prostaglandin analogue that lowers the raised intraocular pressure of glaucoma by increasing uveoscleral outflow — the eye’s aqueous humour drains faster through a second, pressure-independent pathway, so the pressure falls overnight and is held down with once-daily dosing. It is the most effective single drug for primary open-angle glaucoma, and its side effects are all local consequences of prostaglandin biology: eyelash growth, iris darkening and red eye. Because it works by improving drainage rather than slowing production, it sits naturally beside the agents that reduce aqueous production.',
  },
  {
    className: 'Carbonic anhydrase inhibitor eye drops',
    family: 'Dermatology, eyes & allergy',
    drugs: ['Brinzolamide', 'dorzolamide'],
    mechanism:
      'The ciliary body makes aqueous humour by secreting bicarbonate, and carbonic anhydrase inhibitor eye drops block the enzyme that drives that secretion, so less aqueous is produced and the intraocular pressure of glaucoma falls. Brinzolamide and dorzolamide are the topical forms — the same enzyme inhibition that the old systemic agent acetazolamide used, confined now to the eye to avoid the generalised metabolic upset. Because they act by slowing inflow rather than speeding outflow, they complement the prostaglandin analogues and are the add-on when a single agent no longer reaches target pressure.',
  },

  // ------------------------------------------------------------ Anaesthetics & pain
  {
    className: 'Anaesthetics, general',
    family: 'Anaesthetics & pain',
    drugs: ['Propofol', 'thiopental', 'sevoflurane', 'nitrous oxide', 'ketamine'],
    mechanism:
      'General anaesthetics produce unconsciousness by enhancing inhibitory GABA transmission (propofol, thiopental, sevoflurane) and, in ketamine’s case, by blocking excitatory NMDA receptors — a state of reversible, deliberate CNS depression that also blunts cardiovascular and respiratory reflexes. Propofol is the intravenous induction agent of choice; sevoflurane the inhalational maintenance; ketamine the dissociative agent that preserves airway and breathing, valuable in trauma and the shocked. The mechanism, and therefore the depth and recuperation, is a measured, reversible shutting down of the brain’s excitability, monitored by the effect on the patient, not a fixed dose.',
    moduleId: 'membranePotentials',
  },
  {
    className: 'Anaesthetics, local',
    family: 'Anaesthetics & pain',
    drugs: ['Lidocaine', 'bupivacaine', 'levobupivacaine'],
    mechanism:
      'Local anaesthetics block voltage-gated sodium channels from inside the nerve, stopping the inward sodium current that generates the action potential — so no impulse travels, and the territory the nerve serves is anaesthetised. Lidocaine is the short-acting workhorse, bupivacaine longer-acting and more potent. The block is use-dependent and non-selective: it spares no fibre type at sufficient concentration, and that is both its beauty and its danger, because accidental intravascular injection of the potent agents causes cardiac and CNS toxicity. The nerve is silenced, but only because its sodium channels are all occupied.',
    moduleId: 'somaticSensation',
  },

  // ------------------------------------------------------------ Emergency, fluids & vitamins
  {
    className: 'Adenosine (emergency)',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Adenosine'],
    mechanism:
      'Adenosine interrupts re-entry through the AV node by activating potassium channels and hyperpolarising nodal cells, transiently blocking AV conduction — the first-line emergency conversion of supraventricular tachycardia back to sinus rhythm. It acts and clears in seconds because it is rapidly metabolised, which is why it is given as a fast push and why it can be repeated with escalating dose. The mechanism is both the therapy and the diagnosis: if the rhythm is AV-node dependent it stops, and the transient asystole, flushing and chest tightness are all the brief nodal pause in action.',
    moduleId: 'ecgConduction',
  },
  {
    className: 'Adrenaline (emergency)',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Adrenaline (epinephrine)'],
    mechanism:
      'Adrenaline is the emergency alpha- and beta-adrenergic agonist. In anaphylaxis its alpha effect reverses vasodilatation and the falling blood pressure and reduces laryngeal oedema, while its beta effect relaxes bronchospasm — the single drug that treats the whole anaphylactic collapse. In cardiac arrest the same alpha vasoconstriction drives coronary and cerebral perfusion during compressions. In cardiac life support it is given every few minutes; in anaphylaxis, intramuscularly at a defined dose. It is the fastest, most reversible correction of circulatory collapse, bought with the tachycardia and hypertension its own receptor activation produces.',
    moduleId: 'autonomicNervous',
  },
  {
    className: 'Naloxone (emergency)',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Naloxone'],
    mechanism:
      'Naloxone is a pure competitive opioid antagonist at the mu receptor, displacing the opioid from the same site that caused the respiratory depression, and so reversing opioid overdose within minutes — the immediate antidote for opioid-induced respiratory depression and the diagnostic test that confirms it. Because it competes, the dose is titrated to restore breathing without precipitating the full withdrawal syndrome, and because the opioid may outlast it, the reversal must be repeated and the patient observed. It is the cleanest demonstration of the lock-and-key principle in emergency medicine: take the key off the lock and the lock works again.',
    moduleId: 'somaticSensation',
  },
  {
    className: 'Thrombolytics (emergency)',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Alteplase', 'streptokinase'],
    mechanism:
      'Thrombolytics convert circulating plasminogen to plasmin, the enzyme that digests fibrin, actively dissolving the clot that is blocking an artery. Alteplase, tissue plasminogen activator, is given within a time window for ST-elevation myocardial infarction and ischaemic stroke; streptokinase is the older, cheaper but antigenic agent. The mechanism is the full force of fibrinolysis: it breaks the blockage but also the haemostatic plugs the body has made, so intracranial and major bleeding are the risk that time the treatment against the benefit. Every decision to thrombolyse is the balance between the clot you are dissolving and the bleed you may create.',
    moduleId: 'coagulation',
  },
  {
    className: 'Oxygen (emergency)',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Oxygen'],
    mechanism:
      'Oxygen is a drug and is dosed like one. Increasing the inspired fraction raises the arterial oxygen content and, by saturating the haemoglobin that carries it, improves oxygen delivery to tissue in hypoxic states. But excess oxygen has its own toxicity: in chronic type 2 respiratory failure it blunts the hypoxic drive and can suppress breathing, and in the newborn and at very high concentrations it damages the lung. So oxygen is titrated to a target saturation — the whole approach of a hospital oxygen prescription — because giving oxygen treats hypoxia, not breathlessness, and the wrong amount is an active harm.',
    moduleId: 'respiratory',
  },
  {
    className: 'Intravenous fluid therapy \u2013 crystalloids',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Compound sodium lactate (Hartmann\u2019s)', 'sodium chloride 0.9%', 'sodium chloride 0.45%'],
    mechanism:
      'Crystalloids are water with electrolytes, distributed across the body’s fluid spaces according to tonicity. Balanced solutions like compound sodium lactate (Hartmann’s) replicate plasma electrolyte composition and are the preferred first-line for resuscitation and routine replacement, because they disturb acid–base less than a large chloride load. Normal saline (0.9% sodium chloride) expands the extracellular space but delivers chloride that can cause a hyperchloraemic acidosis; 0.45% is hypotonic, used for maintenance where water, not salt, is the deficit. The choice is matching the fluid to where the water is missing.',
  },
  {
    className: 'Intravenous fluid therapy \u2013 colloids',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Gelatins (plasma substitutes)', 'albumin'],
    mechanism:
      'Colloids carry large molecules that stay in the vascular space, so they expand the plasma volume more per litre than crystalloid, holding fluid within the vessels by oncotic pressure. Human albumin is the physiological colloid, used in septic and cirrhotic states where oncotic pressure has fallen; gelatins are synthetic plasma substitutes. They are effective volume expanders, but the extra molecular weight does not reliably translate into better outcomes than crystalloid, and synthetic colloids carry their own risks of coagulopathy and renal injury — which is why the modern reflex is balanced crystalloid first, colloid reserved for specific indications.',
  },
  {
    className: 'Intravenous glucose',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Glucose 5%, 10%, 20% and 50%'],
    mechanism:
      'Intravenous glucose provides calories and, because it is freely filtered and reabsorbed up to a threshold, water without salt when given at the lower concentrations. Five per cent glucose is essentially maintenance water with a little substrate — used for hydration while potassium is added as needed; the higher concentrations (20%, 50%) are used for the rapid glucose of severe hypoglycaemia or in small volumes for specific metabolic needs. Glucose itself moves into cells on insulin, so a severely dehydrated or hyperkalaemic patient will not be fixed by glucose alone — it replaces the substrate, not the perfusion.',
    moduleId: 'glucoseRegulation',
  },
  {
    className: 'Potassium, intravenous',
    family: 'Emergency, fluids & vitamins',
    drugs: ['Potassium chloride (as an additive)'],
    mechanism:
      'Intravenous potassium chloride replaces the ion that underpins every cell’s resting membrane and is given only when oral replacement cannot or must not wait — severe hypokalaemia that threatens arrhythmia or is accompanied by paralysis. Because hyperkalaemia is immediately lethal to the heart, the infusion is rate-limited and never pushed, given through a controlled additive under monitoring, with the ECG as a live witness. The mechanism is a repletion of the gradient that every excitable tissue depends on, and the danger is the same gradient overshot: too much potassium and the heart’s resting membrane drifts toward firing catastrophically.',
    moduleId: 'electrolyteBalance',
  },

  // ------------------------------------------------------------ Reproduction & immunology
  {
    className: 'Uterotonics',
    family: 'Reproduction & immunology',
    drugs: ['Oxytocin', 'ergometrine'],
    mechanism:
      'Uterotonics contract the uterus, and their use is defined by when that is wanted: oxytocin stimulates uterine smooth-muscle contraction through its receptor and is the standard for induction and augmentation of labour and for the third stage of delivery to prevent postpartum haemorrhage. Ergometrine acts through serotonin and alpha-adrenergic receptors with a stronger, tetanic contraction. The mechanism’s timing is everything — oxytocin to start and sustain efficient labour, and to clamp down after delivery; the same contraction that delivers the baby is the one that, overdone, tetanises and harms the fetus or the uterus.',
    moduleId: 'pregnancy',
  },
  {
    className: 'Vaccines',
    family: 'Reproduction & immunology',
    drugs: ['Live attenuated and inactivated vaccines'],
    mechanism:
      'Vaccination is the most physiological of therapeutics: it presents antigen so the adaptive immune system lays down memory, so a later real exposure is met by a rapid, protective response rather than by disease. Live attenuated vaccines (MMR, varicella) give the closest thing to natural immunity with a single dose or two; inactivated and subunit vaccines (influenza, hepatitis B, HPV) are safer but need boosting. The principle is the same throughout — provoke protective immunity without causing the disease — and the contraindication that matters is giving a live vaccine to the immunocompromised.',
    moduleId: 'immuneResponse',
  },
  {
    className: 'Immunoglobulins',
    family: 'Reproduction & immunology',
    drugs: ['Normal immunoglobulin', 'tetanus immunoglobulin', 'hepatitis B immunoglobulin'],
    mechanism:
      'Immunoglobulins confer the finished product instead of teaching the lesson — preformed antibodies for immediate but temporary protection, in passive immunisation against tetanus, hepatitis B and rabies exposure, and in replacement for antibody deficiency. Normal immunoglobulin provides a broad pool of antibody for the acutely exposed who cannot make their own fast enough; specific immunoglobulins deliver the exact antibody for a single threat. Unlike vaccination the protection is given, not learned, so it works at once but wanes within weeks — the immune system borrowed, not taught.',
    moduleId: 'immuneResponse',
  },
];

/** Assign URL slugs and export the enriched list. */
export const MEDICATIONS: DrugClass[] = SEEDS.map((seed) => ({
  id: slug(seed.className),
  className: seed.className,
  family: seed.family,
  drugs: seed.drugs,
  mechanism: seed.mechanism,
  moduleId: seed.moduleId,
  microGroup: seed.microGroup,
  moa: seed.moa,
}));

/** Distinct family names in display order (order of first appearance above). */
export const DRUG_FAMILIES: DrugFamily[] = [...new Set(MEDICATIONS.map((c) => c.family))];

/** Family metadata with the class counts filled in. `id` is the `#medications/<family>` slug. */
export const FAMILIES: FamilyMeta[] = FAMILY_META.map((meta) => ({
  ...meta,
  classCount: MEDICATIONS.filter((c) => c.family === meta.name).length,
}));

/** Every family slug that is a valid `#medications/<family>` route. */
export const FAMILY_SLUGS: ReadonlySet<string> = new Set(FAMILY_META.map((m) => m.id));

/** Look up a family by its URL slug. */
export function getFamily(id: string): FamilyMeta | undefined {
  return FAMILIES.find((f) => f.id === id);
}

/** Every class id, for route validation. */
export const CLASS_IDS: ReadonlySet<string> = new Set(MEDICATIONS.map((c) => c.id));

/** Look up a class by its URL slug. */
export function getDrugClass(id: string): DrugClass | undefined {
  return MEDICATIONS.find((drug) => drug.id === id);
}

// ------------------------------------------------------------------- Infection tiers

export interface MicroGroupMeta {
  /** URL slug for `#medications/infection/<slug>`. */
  id: MicroGroup;
  /** Display name, e.g. 'Antibiotics'. */
  name: string;
  /** One-line description for the tile, in the app's voice. */
  blurb: string;
  /** Number of classes in this branch. */
  classCount: number;
  /** True only for the antibiotic branch, which has a further mechanism-of-action tier. */
  hasMoa: boolean;
}

/** The four antimicrobial branches, in display order. Counts are filled in below. */
const MICRO_GROUP_META: Omit<MicroGroupMeta, 'classCount'>[] = [
  {
    id: 'antibiotics',
    name: 'Antibiotics',
    blurb: 'Agents that kill bacteria — grouped by the bacterial process they attack.',
    hasMoa: true,
  },
  {
    id: 'antivirals',
    name: 'Antivirals',
    blurb: 'Agents that stop viruses replicating — the antiretrovirals and the rest.',
    hasMoa: false,
  },
  {
    id: 'antifungals',
    name: 'Antifungals',
    blurb: 'Agents that damage the fungal membrane or cell wall the host does not share.',
    hasMoa: false,
  },
  {
    id: 'antiparasitics',
    name: 'Antiparasitics',
    blurb: 'Agents that hit the parasite inside the host — malaria, worms and the protozoa.',
    hasMoa: false,
  },
];

/**
 * The mechanism-of-action groups the antibiotic classes are sorted into, in display order.
 * This is the tier a learner reads before reaching penicillin or cephalosporin — the standard
 * pharmacology buckets, with the classes that act through each mechanism counted beneath.
 */
export interface MoaMeta {
  /** URL slug for `#medications/infection/antibiotics/<id>`. */
  id: MoAId;
  /** Display name, e.g. 'Inhibit cell wall synthesis'. */
  name: string;
  /** One-line description for the tile. */
  blurb: string;
  /** Number of antibiotic classes acting through this mechanism. */
  classCount: number;
}

const MOA_GROUP_META: Omit<MoaMeta, 'classCount'>[] = [
  {
    id: 'cell-wall',
    name: 'Inhibit cell wall synthesis',
    blurb: 'Beta-lactams and glycopeptides weaken the bacterial wall until the cell lyses.',
  },
  {
    id: 'protein',
    name: 'Inhibit protein synthesis',
    blurb: 'Ribosome-targeting agents — aminoglycosides, tetracyclines, macrolides and more.',
  },
  {
    id: 'nucleic-acid',
    name: 'Inhibit nucleic acid synthesis',
    blurb: 'Quinolones, rifamycins and the DNA-damaging agents that stall replication.',
  },
  {
    id: 'folate',
    name: 'Inhibit folate metabolism',
    blurb: 'Sulfonamides and trimethoprim starve the bacterium of the folate it needs for DNA.',
  },
  {
    id: 'membrane',
    name: 'Disrupt the cell membrane',
    blurb: 'Colistin and daptomycin punch holes in or depolarise the bacterial membrane.',
  },
  {
    id: 'antituberculous',
    name: 'Antituberculous therapy',
    blurb: 'A combined regimen for mycobacteria, hitting several targets in one short course.',
  },
];

/** The four antimicrobial branch tiles, with class counts filled in. */
export const MICRO_GROUPS: MicroGroupMeta[] = MICRO_GROUP_META.map((meta) => ({
  ...meta,
  classCount: MEDICATIONS.filter((c) => c.microGroup === meta.id).length,
}));

/** Every valid `#medications/infection/<microGroup>` branch slug. */
export const MICRO_GROUP_SLUGS: ReadonlySet<string> = new Set(MICRO_GROUPS.map((m) => m.id));

/** Look up an antimicrobial branch by its slug. */
export function getMicroGroup(id: string): MicroGroupMeta | undefined {
  return MICRO_GROUPS.find((m) => m.id === id);
}

/** The antibiotic mechanism-of-action tiles, with their class counts filled in (non-empty). */
export const MOA_GROUPS: MoaMeta[] = MOA_GROUP_META.map((meta) => ({
  ...meta,
  classCount: MEDICATIONS.filter((c) => c.moa === meta.id).length,
}));

/** Every valid `#medications/infection/antibiotics/<moa>` slug. */
export const MOA_SLUGS: ReadonlySet<string> = new Set(MOA_GROUPS.map((m) => m.id));

/** Look up an antibiotic mechanism-of-action group by its slug. */
export function getMoaGroup(id: string): MoaMeta | undefined {
  return MOA_GROUPS.find((m) => m.id === id);
}

/** The classes that sit in an antimicrobial branch (a subfamily page's tile list). */
export function getMicroGroupClasses(microGroup: MicroGroup): DrugClass[] {
  return MEDICATIONS.filter((c) => c.microGroup === microGroup);
}

/** The classes that act through a given antibiotic mechanism of action. */
export function getMoaClasses(moa: MoAId): DrugClass[] {
  return MEDICATIONS.filter((c) => c.moa === moa);
}

/**
 * A resolved `#medications/<...>` sub-route. The formulary has two shapes: most families are a
 * single flat tier of classes (`#medications/<family>/` and `#medications/<class>`), but Infection
 * descends two levels deeper — a family into antimicrobial branches, and the antibiotic branch into
 * mechanism-of-action groups before reaching classes.
 */
export type MedicationRoute =
  | { kind: 'family'; familyId: string }
  | { kind: 'class'; classId: string }
  | { kind: 'subfamily'; familyId: string; microGroup: MicroGroup }
  | { kind: 'moa'; familyId: string; microGroup: MicroGroup; moa: MoAId };

export const MEDICATION_INVALID = Symbol('medication-invalid');

/**
 * Validate and resolve the segments that follow the `medications/` prefix. Segments come from
 * splitting the hash remainder on `/`. Returns a discriminated route, or `MEDICATION_INVALID` for
 * a route that names no real family, class, branch or mechanism (so the hub can be shown instead of
 * a blank page). Only Infection descends past one level, and only antibiotics past two.
 */
export function resolveMedicationRoute(
  segments: string[],
): MedicationRoute | typeof MEDICATION_INVALID {
  const [familyOrClass, branch, moaSlug] = segments;

  if (segments.length === 1) {
    if (familyOrClass === undefined) return MEDICATION_INVALID;
    if (FAMILY_SLUGS.has(familyOrClass)) return { kind: 'family', familyId: familyOrClass };
    if (CLASS_IDS.has(familyOrClass)) return { kind: 'class', classId: familyOrClass };
    return MEDICATION_INVALID;
  }

  if (segments.length === 2) {
    const family = getFamily(familyOrClass ?? '');
    if (!family || family.name !== 'Infection') return MEDICATION_INVALID;
    const microGroup = getMicroGroup(branch ?? '');
    if (!microGroup) return MEDICATION_INVALID;
    return { kind: 'subfamily', familyId: family.id, microGroup: microGroup.id };
  }

  if (segments.length === 3) {
    const family = getFamily(familyOrClass ?? '');
    if (!family || family.name !== 'Infection') return MEDICATION_INVALID;
    const microGroup = getMicroGroup(branch ?? '');
    if (!microGroup || !microGroup.hasMoa) return MEDICATION_INVALID;
    const moa = getMoaGroup(moaSlug ?? '');
    if (!moa) return MEDICATION_INVALID;
    return { kind: 'moa', familyId: family.id, microGroup: microGroup.id, moa: moa.id };
  }

  return MEDICATION_INVALID;
}

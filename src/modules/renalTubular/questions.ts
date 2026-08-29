import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { RenalTubularDerived, RenalTubularInputs, RenalTubularState } from './engine/types';
import type { RenalTubularPresetName } from './engine/presets';

type Snapshot = { state: RenalTubularState; derived: RenalTubularDerived };
export type RenalTubularQuestion = ModuleQuestion<RenalTubularInputs, RenalTubularPresetName, Snapshot>;

export const RENAL_TUBULAR_QUESTIONS: readonly RenalTubularQuestion[] = [
  {
    id: 'desmopressin-central-di',
    stem: 'A patient passes enormous volumes of dilute urine and is constantly thirsty. Their posterior pituitary cannot release ADH, but the collecting duct is entirely normal.',
    setup: { preset: 'centralDI' },
    intervention: { label: 'You give desmopressin.', inputs: { exogenousADH: 100 } },
    prompt: 'What happens to urine osmolality?',
    watch: 'urine osmolality',
    correctDirection: 'rises',
    explanation:
      'It concentrates sharply, because the duct was always able to respond — it simply had nothing to respond to. Desmopressin acts on the same V2 receptor as endogenous ADH, so supplying it from outside completes the pathway. This is what makes the water deprivation test with desmopressin genuinely diagnostic rather than merely descriptive: it separates a missing hormone from a deaf receptor, and the two have completely different treatments.',
    metric: (s) => s.derived.finalUrineOsmolality,
  },
  {
    id: 'desmopressin-nephrogenic-di',
    stem: 'A second patient has the identical bedside picture — huge volumes of dilute urine, unquenchable thirst, rising plasma osmolality. Here ADH is being secreted normally but the collecting duct cannot respond to it.',
    setup: { preset: 'nephrogenicDI' },
    intervention: { label: 'You give desmopressin.', inputs: { exogenousADH: 100 } },
    prompt: 'What happens to urine osmolality?',
    watch: 'urine osmolality',
    correctDirection: 'unchanged',
    explanation:
      'Almost nothing happens, and that is the answer. Desmopressin acts through the same receptor the duct is already failing to use, so adding more agonist to an unresponsive tubule changes little. Run this question and the previous one back to back: identical presentations, identical test, opposite results. That single divergence is the whole diagnostic value of the desmopressin step, and it is why lithium- or hypercalcaemia-induced nephrogenic DI is treated by removing the cause rather than by giving hormone.',
    metric: (s) => s.derived.finalUrineOsmolality,
  },
  {
    id: 'loop-diuretic-gradient',
    stem: 'A patient is started on a high-dose loop diuretic. Their kidneys were previously normal and their ADH axis is intact.',
    setup: { preset: 'normal' },
    intervention: { label: 'A loop diuretic is started.', inputs: { loopDiureticDose: 80 } },
    prompt: 'What happens to the medullary osmotic gradient?',
    watch: 'the medullary gradient',
    correctDirection: 'falls',
    explanation:
      'The gradient washes out. The thick ascending limb builds it by pumping NaCl into the interstitium via NKCC2, which is precisely the transporter a loop diuretic blocks — so the kidney loses the tool it uses to concentrate urine. Note the ceiling this imposes: however much ADH is present, urine can never become more concentrated than the medulla, so concentrating ability is blunted even in a patient with plenty of hormone. A thiazide acts further downstream and leaves the gradient intact, which is one reason it is the milder diuretic.',
    metric: (s) => s.derived.medullaryGradientStrength,
  },

  {
    id: 'adh-concentrates-urine',
    stem: 'A patient is given desmopressin. Their loop of Henle is intact, so the medullary gradient is normal, and their collecting duct responds normally.',
    setup: { preset: 'normal' },
    intervention: { label: 'Exogenous ADH is given.', inputs: { exogenousADH: 90 } },
    prompt: 'What happens to the final urine osmolality?',
    watch: 'the urine osmolality',
    correctDirection: 'rises',
    observeSeconds: 600,
    explanation:
      'The urine concentrates, which is the visible output of the whole countercurrent apparatus working. ADH inserts aquaporins into the collecting duct and water leaves down the gradient the loop of Henle built — so the response needs all three: the hormone, a duct that can answer it, and a gradient to answer it into. That is exactly why a water deprivation test followed by desmopressin localises the lesion: no response to either identifies the duct, response only to desmopressin identifies the pituitary.',
    metric: (s) => s.derived.finalUrineOsmolality,
  },
  {
    id: 'thiazide-distal-delivery',
    stem: 'A patient is started on a thiazide diuretic for hypertension. Their loop of Henle is working normally.',
    setup: { preset: 'normal' },
    intervention: { label: 'A thiazide is given.', inputs: { thiazideDose: 80 } },
    prompt: 'What happens to urine flow rate?',
    watch: 'the urine flow rate',
    correctDirection: 'rises',
    observeSeconds: 600,
    explanation:
      'Flow rises, but far less than a loop diuretic would produce at an equivalent dose, and the reason is anatomical. The thick ascending limb reabsorbs a quarter of the filtered sodium; the distal tubule the thiazide blocks handles only about five per cent. So the ceiling is set by how much sodium reaches the segment being blocked. That is why a loop diuretic is the drug for fluid overload and a thiazide is the drug for blood pressure, and why the two given together are far more than additive.',
    metric: (s) => s.derived.urineFlowRateMLPerMin,
  },
  {
    id: 'tubuloglomerular-feedback',
    stem: 'A loop diuretic is given, sharply increasing the sodium chloride arriving at the macula densa. The tubuloglomerular feedback mechanism is intact.',
    setup: { preset: 'normal' },
    intervention: { label: 'A loop diuretic is given.', inputs: { loopDiureticDose: 90 } },
    prompt: 'What happens to the GFR after tubuloglomerular feedback?',
    watch: 'the GFR after feedback',
    correctDirection: 'falls',
    observeSeconds: 600,
    explanation:
      'The GFR falls, because the macula densa reads high distal sodium chloride as evidence that the glomerulus above it is filtering too fast and constricts the afferent arteriole in response. It is a single-nephron autoregulatory loop, and it normally protects against losing enormous volumes when filtration transiently rises. Here it is being fooled: the sodium is high because reabsorption was blocked, not because filtration rose — which is part of why the diuretic response to a loop agent plateaus.',
    metric: (s) => s.derived.gfrAfterTGF,
  },

  // --- The RTAs: one acid arm, three different failures ---

  {
    id: 'distal-rta-alkaline-urine',
    stem: 'A patient with recurrent calcium phosphate stones is found to have a serum bicarbonate of 14. Their distal H+-ATPase has failed.',
    setup: { preset: 'normal' },
    intervention: { label: 'Distal H+ secretion fails (type 1 RTA).', inputs: { distalAcidSecretion: 0.08 } },
    prompt: 'What happens to the urine pH?',
    watch: 'the urine pH',
    correctDirection: 'rises',
    observeSeconds: 7200,
    explanation:
      'It rises ABOVE 5.5 — inappropriately alkaline for an acidemic patient, and that contradiction IS the diagnosis. Every other acidotic kidney pushes urine pH toward 4.5; a distal RTA cannot, because the alpha-intercalated cell\'s pump is what creates the hydrogen ion gradient in the first place. The stones follow mechanically: alkaline urine precipitates calcium phosphate, and chronic citrate loss leaves nothing to hold the calcium in solution. Compare with proximal RTA, where the pump works and the urine can still be acidified.',
    metric: (s) => s.derived.urinePH,
  },
  {
    id: 'type4-rta-hyperkalaemia',
    stem: 'A diabetic patient with CKD has a bicarbonate of 17 and a potassium of 6.0. Hypoaldosteronism is suspected.',
    setup: { preset: 'normal' },
    intervention: { label: 'Aldosterone tone collapses (type 4 RTA).', inputs: { aldosteroneTone: 0.12 } },
    prompt: 'What happens to serum potassium?',
    watch: 'serum potassium',
    correctDirection: 'rises',
    observeSeconds: 7200,
    explanation:
      'It climbs toward 6, and the potassium is the danger that makes type 4 worth catching early. Aldosterone does three jobs through one distal mechanism: it secretes potassium, drives ammoniagenesis so acid can be buffered and excreted, and reclaims sodium. Its failure therefore produces hyperkalaemia, a positive urine anion gap, and a mild acidosis from a single cause. Note the urine still acidifies below 5.5 — the pump is fine; only the hormone is missing — which separates this from distal RTA on the plainest of tests.',
    metric: (s) => s.derived.serumPotassiumEstimateMeqL,
  },
  {
    id: 'acetazolamide-bicarbonate-diuresis',
    stem: 'A climber takes acetazolamide for altitude prophylaxis. The drug blocks carbonic anhydrase in the proximal tubule.',
    setup: { preset: 'normal' },
    intervention: { label: 'Acetazolamide is started.', inputs: { acetazolamideDose: 85 } },
    prompt: 'What happens to serum bicarbonate?',
    watch: 'serum bicarbonate',
    correctDirection: 'falls',
    observeSeconds: 7200,
    explanation:
      'It falls by several points, because blocking carbonic anhydrase paralyzes the reaction the proximal tubule uses to reclaim filtered bicarbonate. What cannot be reclaimed is lost, taking water with it — an osmotic-style diuresis of alkaline fluid, which is why the drug produces both a metabolic acidosis and an ALKALINE urine, a combination no other common agent causes. The acidosis is exactly why it helps at altitude: it mimics acclimatisation by ventilatory drive, compensating for the bicarbonate the kidney has been made to waste.',
    metric: (s) => s.derived.serumBicarbonateMeqL,
  },
  {
    id: 'mannitol-osmotic-diuresis',
    stem: 'A patient with rising intracranial pressure is given mannitol. It is filtered at the glomerulus and then not reabsorbed anywhere at all.',
    setup: { preset: 'normal' },
    intervention: { label: 'An osmotic load is infused.', inputs: { osmoticLoad: 120 } },
    prompt: 'What happens to urine flow?',
    watch: 'urine flow',
    correctDirection: 'rises',
    observeSeconds: 2400,
    explanation:
      'It rises sharply, and no transporter was blocked to make it happen. Mannitol stays in the tubular lumen purely by being un-reclaimable, and the water that would have followed solute out of the nephron instead follows the mannitol OUT — osmotic diuresis is hydraulics, not pharmacology. This is also why any uncontrolled solute does the same thing: glucose above threshold in diabetes produces precisely this pattern, which is the polyuria that first brings those patients to medical attention.',
    metric: (s) => s.derived.urineFlowRateMLPerMin,
  },
  {
    id: 'tolvaptan-overcomes-siadh',
    stem: 'A patient with SIADH remains hyponatraemic despite fluid restriction. A V2-receptor antagonist (tolvaptan) is started on top of their inappropriately high ADH.',
    setup: { preset: 'siadh' },
    intervention: { label: 'The V2 receptor is blocked.', inputs: { v2Blockade: 85 } },
    prompt: 'What happens to urine osmolality?',
    watch: 'urine osmolality',
    correctDirection: 'falls',
    observeSeconds: 2400,
    explanation:
      'It falls toward dilute, even though the ADH level itself never dropped — because tolvaptan does not argue with the hormone, it deafens the receptor. SIADH is the one sodium-water disorder treated by promoting water EXCRETION rather than by replacing or removing hormone, and this is the mechanism: aquaporin-2 never inserts, the duct stays water-tight, and free water that would have been retained leaves as dilute urine. Watch electrolyte-free water clearance rise while sodium handling is untouched — aquaretic, not diuretic, in the strict sense.',
    metric: (s) => s.derived.finalUrineOsmolality,
  },
  {
    id: 'atn-wastes-sodium',
    stem: 'Two patients both have a creatinine of 2.3 and falling urine output. In this one the tubules themselves have died (acute tubular necrosis).',
    setup: { preset: 'normal' },
    intervention: { label: 'Tubular injury develops.', inputs: { tubularInjury: 0.9, gfrMLPerMin: 45 } },
    prompt: 'What happens to the fractional excretion of sodium?',
    watch: 'FENa',
    correctDirection: 'rises',
    observeSeconds: 7200,
    explanation:
      'It climbs above 2%, because active sodium reabsorption along the proximal tubule and loop is exactly what necrosis destroys. This number is how a rising creatinine is split into its two great families: prerenal kidneys are intact and starving, so they reclaim sodium ferociously under aldosterone and the FENa sits below 1%; post-renal-of-the-tubule kidneys shed it. The creatinine looks identical in both — it lags by hours and reflects filtration alone. When the question is "is this kidney failing because of perfusion or because of injury", the urine answers and the blood does not.',
    metric: (s) => s.derived.fractionalExcretionNaPct,
  },

  // --- Naming the AKI from the urine ---

  {
    id: 'aki-urine-differentiation',
    stem: 'A hypotensive postoperative patient has a creatinine of 2.4. The panel below was sent before any fluids were given.',
    answer: 'preRenalAzotaemia',
    options: ['preRenalAzotaemia', 'atn', 'type4RTA'],
    panel: [
      { label: 'FENa (%)', unit: '%', value: (s: Snapshot) => s.derived.fractionalExcretionNaPct, decimals: 2 },
      { label: 'Urine Na (mEq/L)', unit: '', value: (s: Snapshot) => s.derived.urineSodiumMeqL, decimals: 0 },
      { label: 'Urine osmolality (mOsm/kg)', unit: '', value: (s: Snapshot) => s.derived.finalUrineOsmolality, decimals: 0 },
      { label: 'Serum K (mEq/L)', unit: '', value: (s: Snapshot) => s.derived.serumPotassiumEstimateMeqL, decimals: 1 },
      { label: 'Creatinine (mg/dL)', unit: '', value: (s: Snapshot) => s.derived.serumCreatinineMgDl, decimals: 2 },
    ] as readonly PanelField<Snapshot>[],
    settleSeconds: 90000,
    explanation:
      'FENa under 1% with urine sodium below 20 and concentrated urine: an intact, aldosterone-driven nephron is scavenging every millimole it can while the glomerulus starves — prerenal azotaemia, and the right treatment is volume, not diuretics. Acute tubular necrosis produces the same creatinine but sheds sodium (FENa >2%) into an isosthenuric urine, because dead tubules cannot scavenge anything. Type 4 RTA raises the potassium with a positive anion gap but spares the creatinine entirely. One panel, three completely different resuscitation decisions.',
  }
];

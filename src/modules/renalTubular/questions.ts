import type { PredictQuestion } from '@/shared/assessment/types';
import type { RenalTubularDerived, RenalTubularInputs, RenalTubularState } from './engine/types';
import type { RenalTubularPresetName } from './engine/presets';

type Snapshot = { state: RenalTubularState; derived: RenalTubularDerived };
export type RenalTubularQuestion = PredictQuestion<RenalTubularInputs, RenalTubularPresetName, Snapshot>;

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
  }
];

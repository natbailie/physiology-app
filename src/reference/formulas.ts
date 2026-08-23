import { nernstPotential } from '@/modules/membranePotentials/engine/nernst';
import { pH as hendersonHasselbalch } from '@/modules/respiratory/engine/acidBase';
import { deltaRatio } from '@/modules/respiratory/engine/anionGap';
import { bazettQtc } from '@/modules/ecgConduction/engine/intervals';
import { correctedSodium } from '@/modules/electrolyteBalance/engine/fluidCompartments';
import { netFiltrationPressure } from '@/modules/capillaryExchange/engine/starlingForces';
import {
  cardiacOutputLPerMin,
  ejectionFractionPercent,
  strokeVolume,
} from '@/modules/cardiacElectro/engine/cardiacOutput';
import { cerebralPerfusionPressure } from '@/modules/cerebralPerfusion/engine/cerebralMechanics';

export interface FormulaInputField {
  key: string;
  label: string;
  unit?: string;
  default: number;
  min: number;
  max: number;
  step?: number;
}

/**
 * Grouping on the reference page. Kept broad — a learner looking for Bazett is thinking
 * "heart", not "electrophysiology".
 */
export type FormulaDomain =
  | 'Cardiovascular'
  | 'Renal'
  | 'Respiratory'
  | 'Acid-base'
  | 'Neuro & muscle'
  | 'Haematology';

export interface FormulaDefinition {
  id: string;
  domain: FormulaDomain;
  name: string;
  formulaDisplay: string;
  inputs: FormulaInputField[];
  compute: (values: Record<string, number>) => number;
  resultLabel: string;
  resultUnit: string;
  explanation: string;
  /**
   * The module that simulates this, if one does.
   *
   * A calculator tells you what a number is; the simulator shows you what moves it. Roughly
   * two thirds of these are computed by an engine somewhere in the app, and the point of
   * linking them is that a learner who has just worked out a Winter's expected PaCO2 by hand
   * can go and watch a ketoacidotic patient produce it.
   */
  moduleId?: string;
}

export const FORMULAS: FormulaDefinition[] = [
  {
    id: 'fickCardiacOutput',
    domain: 'Cardiovascular',
    name: 'Fick Principle (Cardiac Output)',
    formulaDisplay: 'CO = VO2 / (CaO2 − CvO2)',
    inputs: [
      { key: 'vo2', label: 'O2 consumption (VO2)', unit: 'mL/min', default: 250, min: 50, max: 800, step: 10 },
      { key: 'cao2', label: 'Arterial O2 content (CaO2)', unit: 'mL/dL', default: 20, min: 5, max: 24, step: 0.5 },
      { key: 'cvo2', label: 'Venous O2 content (CvO2)', unit: 'mL/dL', default: 15, min: 0, max: 22, step: 0.5 },
    ],
    compute: (v) => (v.vo2 ?? 0) / (((v.cao2 ?? 0) - (v.cvo2 ?? 0)) * 10),
    resultLabel: 'Cardiac output',
    resultUnit: 'L/min',
    moduleId: 'cardiacElectro',
    explanation:
      'The Fick principle treats the lungs as a mixing chamber: total O2 uptake equals blood flow times the arteriovenous O2 content difference. Rearranged for flow, it estimates cardiac output directly from oxygen consumption and content — the reference method invasive cath labs use to validate CO, and the basis for detecting intracardiac shunts by tracking O2 step-ups between chambers.',
  },
  {
    id: 'meanArterialPressure',
    domain: 'Cardiovascular',
    name: 'Mean Arterial Pressure',
    formulaDisplay: 'MAP = DBP + ⅓(SBP − DBP)',
    inputs: [
      { key: 'sbp', label: 'Systolic BP (SBP)', unit: 'mmHg', default: 120, min: 60, max: 260, step: 1 },
      { key: 'dbp', label: 'Diastolic BP (DBP)', unit: 'mmHg', default: 80, min: 30, max: 160, step: 1 },
    ],
    compute: (v) => (v.dbp ?? 0) + ((v.sbp ?? 0) - (v.dbp ?? 0)) / 3,
    resultLabel: 'MAP',
    resultUnit: 'mmHg',
    moduleId: 'cardiorenal',
    explanation:
      'Diastole lasts roughly twice as long as systole at a resting heart rate, so time-averaged arterial pressure sits closer to diastolic than the midpoint between systolic and diastolic. A MAP below ~60 mmHg threatens organ perfusion — the target most vasopressor titration protocols use, regardless of what the systolic number reads.',
  },
  {
    id: 'clearance',
    domain: 'Renal',
    name: 'Renal Clearance',
    formulaDisplay: 'Cx = (Ux × V) / Px',
    inputs: [
      { key: 'ux', label: 'Urine concentration (Ux)', unit: 'mg/dL', default: 60, min: 0, max: 500, step: 1 },
      { key: 'v', label: 'Urine flow rate (V)', unit: 'mL/min', default: 1, min: 0.1, max: 20, step: 0.1 },
      { key: 'px', label: 'Plasma concentration (Px)', unit: 'mg/dL', default: 1, min: 0.1, max: 50, step: 0.1 },
    ],
    compute: (v) => ((v.ux ?? 0) * (v.v ?? 0)) / (v.px ?? 1),
    resultLabel: 'Clearance',
    resultUnit: 'mL/min',
    explanation:
      'Clearance is the volume of plasma a substance is completely removed from per minute. Inulin (freely filtered, neither reabsorbed nor secreted) gives the gold-standard GFR; PAH (filtered and almost completely secreted) approximates renal plasma flow instead. Creatinine clearance sits between the two, running slightly high because of a small amount of tubular secretion.',
  },
  {
    id: 'anionGap',
    domain: 'Renal',
    name: 'Serum Anion Gap',
    formulaDisplay: 'AG = Na⁺ − (Cl⁻ + HCO3⁻)',
    inputs: [
      { key: 'na', label: 'Sodium (Na+)', unit: 'mEq/L', default: 140, min: 100, max: 170, step: 1 },
      { key: 'cl', label: 'Chloride (Cl-)', unit: 'mEq/L', default: 104, min: 70, max: 130, step: 1 },
      { key: 'hco3', label: 'Bicarbonate (HCO3-)', unit: 'mEq/L', default: 24, min: 5, max: 40, step: 1 },
    ],
    compute: (v) => (v.na ?? 0) - ((v.cl ?? 0) + (v.hco3 ?? 0)),
    moduleId: 'respiratory',
    resultLabel: 'Anion gap',
    resultUnit: 'mEq/L',
    explanation:
      'The gap represents unmeasured anions — mostly albumin, plus lactate/ketoacids/toxins when elevated. A normal gap (~8-12 mEq/L) with metabolic acidosis points toward bicarbonate loss (diarrhea, RTA) or Cl- gain; a high gap points toward an added acid: lactate, ketoacids, or toxic alcohols (MUDPILES).',
  },
  {
    id: 'alveolarGasEquation',
    domain: 'Respiratory',
    name: 'Alveolar Gas Equation',
    formulaDisplay: 'PAO2 = FiO2 × (Patm − 47) − PaCO2 / R',
    inputs: [
      { key: 'fio2', label: 'Inspired O2 fraction (FiO2)', unit: '', default: 0.21, min: 0.21, max: 1, step: 0.01 },
      { key: 'patm', label: 'Atmospheric pressure', unit: 'mmHg', default: 760, min: 400, max: 780, step: 5 },
      { key: 'paco2', label: 'Arterial CO2 (PaCO2)', unit: 'mmHg', default: 40, min: 10, max: 100, step: 1 },
      { key: 'r', label: 'Respiratory quotient (R)', unit: '', default: 0.8, min: 0.7, max: 1, step: 0.01 },
    ],
    compute: (v) => (v.fio2 ?? 0) * ((v.patm ?? 0) - 47) - (v.paco2 ?? 0) / (v.r ?? 1),
    resultLabel: 'PAO2 (alveolar)',
    resultUnit: 'mmHg',
    explanation:
      "Water vapor at body temperature takes up a fixed 47 mmHg of the inspired gas mixture, built into the formula rather than left as an input. Comparing this calculated alveolar PO2 to a measured arterial PaO2 gives the A-a gradient — normal (~5-15 mmHg, widening with age) points to hypoventilation, while a widened gradient points to a diffusion, V/Q mismatch, or shunt problem instead.",
  },
  {
    id: 'wintersFormula',
    domain: 'Respiratory',
    name: "Winter's Formula",
    formulaDisplay: 'Expected PaCO2 = 1.5×HCO3 + 8 (±2)',
    inputs: [{ key: 'hco3', label: 'Bicarbonate (HCO3-)', unit: 'mEq/L', default: 12, min: 5, max: 40, step: 1 }],
    compute: (v) => 1.5 * (v.hco3 ?? 0) + 8,
    resultLabel: 'Expected PaCO2',
    resultUnit: 'mmHg',
    explanation:
      'Applies only to a primary metabolic acidosis, predicting the respiratory compensation a healthy lung should already be providing. If the measured PaCO2 sits within ±2 of this expected value, compensation is appropriate; higher than expected suggests a co-existing respiratory acidosis, lower suggests a co-existing respiratory alkalosis — a mixed disorder either way.',
  },

  // --- Harvested from the engines. Where `compute` calls an engine function directly, the
  // reference cannot drift from the simulation: there is one implementation, not two. ---

  {
    id: 'nernst',
    domain: 'Neuro & muscle',
    name: 'Nernst Equilibrium Potential',
    formulaDisplay: 'E = 61.5 · log10([out] / [in])  (at 37°C)',
    inputs: [
      { key: 'out', label: 'Extracellular concentration', unit: 'mM', default: 4, min: 0.1, max: 200, step: 0.1 },
      { key: 'inside', label: 'Intracellular concentration', unit: 'mM', default: 140, min: 1, max: 200, step: 1 },
      { key: 'temperature', label: 'Temperature', unit: '°C', default: 37, min: 15, max: 42, step: 0.5 },
    ],
    compute: (v) => nernstPotential(v.out ?? 4, v.inside ?? 140, v.temperature ?? 37),
    resultLabel: 'Equilibrium potential',
    resultUnit: 'mV',
    moduleId: 'membranePotentials',
    explanation:
      'The voltage at which the electrical force on an ion exactly balances its concentration gradient, so net flow stops. Put potassium in and you get about −95 mV, which is why the resting membrane sits near there; put sodium in and you get about +60 mV, the ceiling the action potential overshoots toward. Raise extracellular potassium and E_K moves toward zero — that single line is the whole reason hyperkalaemia depolarises the resting membrane and eventually stops the heart. Note the slope scales with absolute temperature, so cooled tissue produces slightly less driving force from the same gradient.',
  },
  {
    id: 'hendersonHasselbalch',
    domain: 'Acid-base',
    name: 'Henderson-Hasselbalch',
    formulaDisplay: 'pH = 6.1 + log10(HCO3 / (0.03 × PaCO2))',
    inputs: [
      { key: 'hco3', label: 'Bicarbonate', unit: 'mEq/L', default: 24, min: 2, max: 50, step: 1 },
      { key: 'paco2', label: 'PaCO2', unit: 'mmHg', default: 40, min: 10, max: 150, step: 1 },
    ],
    compute: (v) => hendersonHasselbalch(v.hco3 ?? 24, v.paco2 ?? 40),
    resultLabel: 'pH',
    resultUnit: '',
    moduleId: 'respiratory',
    explanation:
      'It is the RATIO that sets the pH, not either number alone, and that single fact explains most acid-base interpretation. A patient can have a grossly abnormal bicarbonate and a grossly abnormal PaCO2 and a pH close to normal, because the two moved together — which is exactly what compensation is. Try it: halve both and the pH barely moves. That is why reading only the pH hides the disorder while reading only the components hides the severity.',
  },
  {
    id: 'wintersFormulaExpected',
    domain: 'Acid-base',
    name: "Winter's Formula (expected PaCO2)",
    formulaDisplay: 'expected PaCO2 = 1.5 × HCO3 + 8  (± 2)',
    inputs: [{ key: 'hco3', label: 'Bicarbonate', unit: 'mEq/L', default: 12, min: 2, max: 30, step: 1 }],
    compute: (v) => 1.5 * (v.hco3 ?? 12) + 8,
    resultLabel: 'Expected PaCO2',
    resultUnit: 'mmHg',
    moduleId: 'respiratory',
    explanation:
      'How far a patient with a metabolic acidosis SHOULD have blown their CO2 down. Compensation never overshoots, so a measured PaCO2 within about 2 mmHg of this is appropriate and needs no further explanation. Above it, respiratory compensation is failing and a second disorder is present — often exhaustion in a patient who has been hyperventilating for hours. Below it, they are hyperventilating for a reason of their own, which is how salicylate poisoning declares itself.',
  },
  {
    id: 'deltaRatio',
    domain: 'Acid-base',
    name: 'Delta Ratio',
    formulaDisplay: 'ΔAG / ΔHCO3 = (AG − 12) / (24 − HCO3)',
    inputs: [
      { key: 'gap', label: 'Anion gap', unit: 'mEq/L', default: 24, min: 4, max: 45, step: 1 },
      { key: 'hco3', label: 'Bicarbonate', unit: 'mEq/L', default: 12, min: 2, max: 24, step: 1 },
    ],
    compute: (v) => deltaRatio(v.gap ?? 24, v.hco3 ?? 12),
    resultLabel: 'Delta ratio',
    resultUnit: '',
    moduleId: 'respiratory',
    explanation:
      'How far the gap has opened compared with how far the bicarbonate has fallen. Near 1 in a pure organic acidosis, because each bicarbonate consumed leaves one unmeasured anion behind. Well below 1 means bicarbonate has dropped further than the gap explains, so a normal-gap acidosis is present as well. Well above 2 means something has propped the bicarbonate up — a metabolic alkalosis hiding underneath. This is how a third disorder is found in a patient whose pH looks almost reasonable. Reports 0 when the bicarbonate has barely moved, where the ratio is noise divided by noise.',
  },
  {
    id: 'bazettQtc',
    domain: 'Cardiovascular',
    name: "Bazett's Correction (QTc)",
    formulaDisplay: 'QTc = QT / √(RR in seconds)',
    inputs: [
      { key: 'qt', label: 'Measured QT', unit: 'ms', default: 400, min: 200, max: 700, step: 5 },
      { key: 'rate', label: 'Heart rate', unit: 'bpm', default: 60, min: 30, max: 200, step: 1 },
    ],
    compute: (v) => bazettQtc(v.qt ?? 400, 60000 / Math.max(v.rate ?? 60, 1)),
    resultLabel: 'QTc',
    resultUnit: 'ms',
    moduleId: 'ecgConduction',
    explanation:
      'Action potential duration genuinely shortens as rate rises — the tissue repolarises faster when driven harder — so a raw QT measured at 100 bpm is not comparable to one at 50. The correction exists to undo exactly that, which is why the corrected value is the one that carries meaning. Above roughly 500 ms the risk of torsades climbs steeply. Note Bazett over-corrects at high rates, which is why a tachycardic patient can be reported as having a long QTc they do not have.',
  },
  {
    id: 'correctedSodium',
    domain: 'Renal',
    name: 'Corrected Sodium (for hyperglycaemia)',
    formulaDisplay: 'corrected Na = measured Na + 1.6 × (glucose − 100) / 100',
    inputs: [
      { key: 'sodium', label: 'Measured sodium', unit: 'mEq/L', default: 128, min: 100, max: 170, step: 1 },
      { key: 'glucose', label: 'Serum glucose', unit: 'mg/dL', default: 600, min: 70, max: 1200, step: 10 },
    ],
    compute: (v) => correctedSodium(v.sodium ?? 128, v.glucose ?? 600),
    resultLabel: 'Corrected sodium',
    resultUnit: 'mEq/L',
    moduleId: 'electrolyteBalance',
    explanation:
      'Glucose is an effective osmole, so hyperglycaemia pulls water out of cells and dilutes the sodium that is there. The measured value therefore understates the real tonicity, and a diabetic patient with a sodium of 128 and a glucose of 600 is not hyponatraemic at all — they are close to normal once corrected. Getting this backwards leads to treating a dilution that will correct itself the moment the glucose comes down.',
  },
  {
    id: 'starlingEquation',
    domain: 'Cardiovascular',
    name: 'Starling Forces (net filtration pressure)',
    formulaDisplay: 'NFP = (Pc − Pi) − σ(πc − πi)',
    inputs: [
      { key: 'pc', label: 'Capillary hydrostatic (Pc)', unit: 'mmHg', default: 25, min: 0, max: 80, step: 1 },
      { key: 'pi', label: 'Interstitial hydrostatic (Pi)', unit: 'mmHg', default: -2, min: -10, max: 30, step: 1 },
      { key: 'oncoticC', label: 'Plasma oncotic (πc)', unit: 'mmHg', default: 25, min: 5, max: 40, step: 1 },
      { key: 'oncoticI', label: 'Interstitial oncotic (πi)', unit: 'mmHg', default: 5, min: 0, max: 30, step: 1 },
      { key: 'sigma', label: 'Reflection coefficient (σ)', default: 0.9, min: 0, max: 1, step: 0.05 },
    ],
    compute: (v) =>
      netFiltrationPressure(v.pc ?? 25, v.pi ?? -2, v.oncoticC ?? 25, v.oncoticI ?? 5, v.sigma ?? 0.9),
    resultLabel: 'Net filtration pressure',
    resultUnit: 'mmHg',
    moduleId: 'capillaryExchange',
    explanation:
      'Four forces: two pushing fluid out of the capillary and two holding it in. Every cause of oedema is a change in one of them, or in one of the two coefficients. The reflection coefficient σ is the one most easily forgotten because it is not a pressure at all — it is how well the wall keeps protein in. Drop σ toward zero and the entire oncotic term stops working however much albumin is in the plasma, which is exactly why albumin infusion helps a nephrotic patient and fails a septic one.',
  },
  {
    id: 'strokeVolume',
    domain: 'Cardiovascular',
    name: 'Stroke Volume & Ejection Fraction',
    formulaDisplay: 'SV = EDV − ESV;  EF = SV / EDV',
    inputs: [
      { key: 'edv', label: 'End-diastolic volume', unit: 'mL', default: 120, min: 40, max: 300, step: 5 },
      { key: 'esv', label: 'End-systolic volume', unit: 'mL', default: 50, min: 10, max: 250, step: 5 },
    ],
    compute: (v) => ejectionFractionPercent(strokeVolume(v.edv ?? 120, v.esv ?? 50), v.edv ?? 120),
    resultLabel: 'Ejection fraction',
    resultUnit: '%',
    moduleId: 'cardiacElectro',
    explanation:
      'Ejection fraction is a RATIO, which is why it can mislead. A dilated failing ventricle with an end-diastolic volume of 250 mL and a stroke volume of 75 mL has an EF of 30% and a perfectly adequate output; a small stiff ventricle can have an EF of 65% and be in florid heart failure because it never fills. The fraction says how well the ventricle empties, not how much blood it moves — and heart failure with preserved ejection fraction is the whole clinical consequence of that distinction.',
  },
  {
    id: 'cardiacOutputHrSv',
    domain: 'Cardiovascular',
    name: 'Cardiac Output',
    formulaDisplay: 'CO = SV × HR',
    inputs: [
      { key: 'sv', label: 'Stroke volume', unit: 'mL', default: 70, min: 10, max: 200, step: 5 },
      { key: 'hr', label: 'Heart rate', unit: 'bpm', default: 70, min: 20, max: 220, step: 1 },
    ],
    compute: (v) => cardiacOutputLPerMin(v.sv ?? 70, v.hr ?? 70),
    resultLabel: 'Cardiac output',
    resultUnit: 'L/min',
    moduleId: 'venousReturn',
    explanation:
      'True by definition, and misleading if read as a lever. Raising the heart rate does not raise output indefinitely, because filling time falls as rate climbs — past about 150 bpm the stroke volume drops faster than the rate rises and output falls. That is why a tachyarrhythmia causes shock rather than compensating for it, and why rate control can be the treatment.',
  },
  {
    id: 'cerebralPerfusionPressure',
    domain: 'Neuro & muscle',
    name: 'Cerebral Perfusion Pressure',
    formulaDisplay: 'CPP = MAP − ICP',
    inputs: [
      { key: 'map', label: 'Mean arterial pressure', unit: 'mmHg', default: 90, min: 30, max: 160, step: 1 },
      { key: 'icp', label: 'Intracranial pressure', unit: 'mmHg', default: 10, min: 0, max: 80, step: 1 },
      { key: 'cvp', label: 'Central venous pressure', unit: 'mmHg', default: 5, min: -5, max: 30, step: 1 },
    ],
    compute: (v) => cerebralPerfusionPressure(v.map ?? 90, v.icp ?? 10, v.cvp ?? 5),
    resultLabel: 'CPP',
    resultUnit: 'mmHg',
    moduleId: 'cerebralPerfusion',
    explanation:
      'The brain sits in a rigid box, so its perfusion pressure is what is left of the arterial pressure after the pressure inside the skull is subtracted. Below about 50 mmHg autoregulation is exhausted and flow falls with pressure. This is the equation behind two opposite bedside instincts being right at once: in a head injury you can improve perfusion either by raising the MAP or by lowering the ICP, and lowering an ICP of 30 is worth far more than the blood pressure manoeuvre that would achieve the same arithmetic.',
  },
  {
    id: 'fena',
    domain: 'Renal',
    name: 'Fractional Excretion of Sodium',
    formulaDisplay: 'FENa = (UNa × PCr) / (PNa × UCr) × 100',
    inputs: [
      { key: 'una', label: 'Urine sodium', unit: 'mEq/L', default: 10, min: 1, max: 200, step: 1 },
      { key: 'pna', label: 'Plasma sodium', unit: 'mEq/L', default: 140, min: 110, max: 170, step: 1 },
      { key: 'ucr', label: 'Urine creatinine', unit: 'mg/dL', default: 100, min: 5, max: 400, step: 5 },
      { key: 'pcr', label: 'Plasma creatinine', unit: 'mg/dL', default: 2, min: 0.3, max: 15, step: 0.1 },
    ],
    compute: (v) =>
      (((v.una ?? 10) * (v.pcr ?? 2)) / Math.max((v.pna ?? 140) * (v.ucr ?? 100), 1e-9)) * 100,
    resultLabel: 'FENa',
    resultUnit: '%',
    moduleId: 'renalTubular',
    explanation:
      'What fraction of the filtered sodium actually leaves in the urine. Below 1% means the tubules are avidly reabsorbing sodium, which is what a well-functioning kidney does when it is underperfused — the pre-renal picture. Above 2% means the tubules are not holding on to it, which points at tubular injury. It is scaled by creatinine because the raw urine sodium is confounded by how concentrated the urine is; a dehydrated patient can have a low urine sodium simply because there is little water in it. Unreliable on a diuretic, which forces sodium out regardless.',
  },
  {
    id: 'ttkg',
    domain: 'Renal',
    name: 'Transtubular Potassium Gradient',
    formulaDisplay: 'TTKG = (UK / PK) / (Uosm / Posm)',
    inputs: [
      { key: 'uk', label: 'Urine potassium', unit: 'mEq/L', default: 40, min: 1, max: 150, step: 1 },
      { key: 'pk', label: 'Plasma potassium', unit: 'mEq/L', default: 5.5, min: 2, max: 9, step: 0.1 },
      { key: 'uosm', label: 'Urine osmolality', unit: 'mOsm/kg', default: 600, min: 50, max: 1400, step: 10 },
      { key: 'posm', label: 'Plasma osmolality', unit: 'mOsm/kg', default: 290, min: 250, max: 340, step: 1 },
    ],
    compute: (v) =>
      ((v.uk ?? 40) / Math.max(v.pk ?? 5.5, 1e-9)) / Math.max((v.uosm ?? 600) / Math.max(v.posm ?? 290, 1e-9), 1e-9),
    resultLabel: 'TTKG',
    resultUnit: '',
    moduleId: 'renalTubular',
    explanation:
      'An estimate of how hard aldosterone is driving potassium secretion in the collecting duct, correcting the urine potassium for how much water has been reabsorbed downstream. In hyperkalaemia a TTKG below about 5 says the kidney is NOT excreting potassium as it should, which points at hypoaldosteronism or a tubule that cannot respond to it. Above 7 in hypokalaemia says renal wasting rather than gut losses. The osmolality term is what makes it interpretable: without it a concentrated urine looks like potassium wasting.',
  },
  {
    id: 'osmolarGap',
    domain: 'Renal',
    name: 'Osmolar Gap',
    formulaDisplay: 'calculated = 2×Na + glucose/18 + urea/2.8;  gap = measured − calculated',
    inputs: [
      { key: 'measured', label: 'Measured osmolality', unit: 'mOsm/kg', default: 320, min: 250, max: 400, step: 1 },
      { key: 'sodium', label: 'Sodium', unit: 'mEq/L', default: 140, min: 110, max: 170, step: 1 },
      { key: 'glucose', label: 'Glucose', unit: 'mg/dL', default: 90, min: 40, max: 1000, step: 10 },
      { key: 'urea', label: 'BUN', unit: 'mg/dL', default: 14, min: 2, max: 150, step: 1 },
    ],
    compute: (v) =>
      (v.measured ?? 320) - (2 * (v.sodium ?? 140) + (v.glucose ?? 90) / 18 + (v.urea ?? 14) / 2.8),
    resultLabel: 'Osmolar gap',
    resultUnit: 'mOsm/kg',
    explanation:
      'The difference between the osmolality the lab measured and the one the measured solutes account for. Normally under 10. A wide gap means something osmotically active is present that nobody has measured — classically methanol, ethylene glycol or ethanol. Paired with a wide anion gap metabolic acidosis it is close to diagnostic of toxic alcohol poisoning, and it matters because the treatment is time-critical and the patient often cannot tell you what they took.',
  },
  {
    id: 'reticulocyteIndex',
    domain: 'Haematology',
    name: 'Reticulocyte Production Index',
    formulaDisplay: 'RPI = retic% × (Hct / 45) / maturation factor',
    inputs: [
      { key: 'retic', label: 'Reticulocytes', unit: '%', default: 6, min: 0.1, max: 30, step: 0.1 },
      { key: 'hct', label: 'Haematocrit', unit: '%', default: 25, min: 10, max: 55, step: 1 },
      { key: 'maturation', label: 'Maturation factor', default: 2, min: 1, max: 2.5, step: 0.5 },
    ],
    compute: (v) => ((v.retic ?? 6) * ((v.hct ?? 25) / 45)) / Math.max(v.maturation ?? 2, 0.1),
    resultLabel: 'Production index',
    resultUnit: '',
    moduleId: 'erythropoiesis',
    explanation:
      'The single most useful number in working up an anaemia, because it splits every cause in two. Above about 2 the marrow is responding vigorously and the problem is downstream — destruction or bleeding. Below 2 the marrow is not responding, which points at deficiency, renal failure or marrow disease. The corrections matter: a raw reticulocyte PERCENTAGE rises in anaemia simply because its denominator shrank, and immature cells released early survive longer in the blood, so both are divided out before the number means anything.',
  },
  {
    id: 'oxygenContent',
    domain: 'Respiratory',
    name: 'Arterial Oxygen Content',
    formulaDisplay: 'CaO2 = 1.34 × Hb × SaO2 + 0.003 × PaO2',
    inputs: [
      { key: 'hb', label: 'Haemoglobin', unit: 'g/dL', default: 15, min: 2, max: 22, step: 0.5 },
      { key: 'sao2', label: 'SaO2', unit: '%', default: 98, min: 40, max: 100, step: 1 },
      { key: 'pao2', label: 'PaO2', unit: 'mmHg', default: 95, min: 20, max: 600, step: 5 },
    ],
    compute: (v) => 1.34 * (v.hb ?? 15) * ((v.sao2 ?? 98) / 100) + 0.003 * (v.pao2 ?? 95),
    resultLabel: 'CaO2',
    resultUnit: 'mL O2/dL',
    moduleId: 'erythropoiesis',
    explanation:
      'Almost all the oxygen in blood is bound to haemoglobin; the dissolved term is tiny and only matters under hyperbaric conditions. Halve the haemoglobin and you halve the oxygen content at a saturation of 100% — which is why a profoundly anaemic patient can have a perfect saturation probe reading and still be starving their tissues, and why transfusion rather than oxygen is the treatment. The saturation tells you how full the carriers are, not how many there are.',
  },
  {
    id: 'oxygenDelivery',
    domain: 'Respiratory',
    name: 'Oxygen Delivery (DO2)',
    formulaDisplay: 'DO2 = CO × CaO2 × 10',
    inputs: [
      { key: 'co', label: 'Cardiac output', unit: 'L/min', default: 5, min: 1, max: 15, step: 0.1 },
      { key: 'hb', label: 'Haemoglobin', unit: 'g/dL', default: 15, min: 2, max: 22, step: 0.5 },
      { key: 'sao2', label: 'SaO2', unit: '%', default: 98, min: 40, max: 100, step: 1 },
    ],
    compute: (v) => (v.co ?? 5) * (1.34 * (v.hb ?? 15) * ((v.sao2 ?? 98) / 100)) * 10,
    resultLabel: 'Oxygen delivery',
    resultUnit: 'mL/min',
    moduleId: 'shockStates',
    explanation:
      'Three terms, and shock can come from any one of them failing. Flow fails in cardiogenic and hypovolaemic shock; carriage fails in anaemia; saturation fails in respiratory failure. Normal delivery is around 1000 mL/min against a consumption of about 250, so there is a fourfold reserve — which is why a patient can lose a great deal of any one term before lactate appears, and why they then deteriorate very quickly once the reserve is gone.',
  },
  {
    id: 'respiratoryTimeConstant',
    domain: 'Respiratory',
    name: 'Expiratory Time Constant',
    formulaDisplay: 'τ = R × C',
    inputs: [
      { key: 'resistance', label: 'Airway resistance', unit: 'cmH2O/L/s', default: 2, min: 0.5, max: 25, step: 0.5 },
      { key: 'compliance', label: 'Compliance', unit: 'L/cmH2O', default: 0.1, min: 0.01, max: 0.3, step: 0.01 },
    ],
    compute: (v) => (v.resistance ?? 2) * (v.compliance ?? 0.1),
    resultLabel: 'Time constant',
    resultUnit: 's',
    moduleId: 'respiratoryMechanics',
    explanation:
      'How long the lung takes to empty. One time constant empties about 63% of the breath, three empty 95%, so a normal lung needs roughly 0.6 seconds and an obstructed one several times that. This is the arithmetic behind breath stacking: if the expiratory time set on a ventilator is shorter than three time constants, the next breath begins before the last one has left and pressure accumulates with every cycle. Slowing the rate is the treatment, which is counter-intuitive in a patient who looks like they need more ventilation.',
  },
  {
    id: 'lungCompliance',
    domain: 'Respiratory',
    name: 'Static Lung Compliance',
    formulaDisplay: 'C = ΔV / ΔP',
    inputs: [
      { key: 'volume', label: 'Tidal volume', unit: 'mL', default: 500, min: 50, max: 1200, step: 10 },
      { key: 'plateau', label: 'Plateau pressure', unit: 'cmH2O', default: 15, min: 2, max: 60, step: 1 },
      { key: 'peep', label: 'PEEP', unit: 'cmH2O', default: 5, min: 0, max: 25, step: 1 },
    ],
    compute: (v) => (v.volume ?? 500) / Math.max((v.plateau ?? 15) - (v.peep ?? 5), 1e-9),
    resultLabel: 'Compliance',
    resultUnit: 'mL/cmH2O',
    moduleId: 'respiratoryMechanics',
    explanation:
      'How much volume a given distending pressure buys. Normal is around 50-100 mL/cmH2O; below about 30 the lung is stiff, as in fibrosis or ARDS. It must be measured against the PLATEAU pressure, not the peak — the peak includes the pressure spent overcoming airway resistance during flow, so using it would report a stiff lung in a patient who simply has narrow airways. That distinction is how the two are told apart at the bedside: a high peak with a normal plateau is obstruction, both high is stiffness.',
  },
];

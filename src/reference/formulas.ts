export interface FormulaInputField {
  key: string;
  label: string;
  unit?: string;
  default: number;
  min: number;
  max: number;
  step?: number;
}

export interface FormulaDefinition {
  id: string;
  domain: 'Cardiovascular' | 'Renal' | 'Respiratory';
  name: string;
  formulaDisplay: string;
  inputs: FormulaInputField[];
  compute: (values: Record<string, number>) => number;
  resultLabel: string;
  resultUnit: string;
  explanation: string;
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
];

import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { ShockDerived, ShockInputs, ShockState } from './engine/types';
import type { ShockPresetName } from './engine/presets';
import { perturbFluidBolus } from './engine/engine';

type Snapshot = { state: ShockState; derived: ShockDerived };
export type ShockQuestion = ModuleQuestion<ShockInputs, ShockPresetName, Snapshot>;

/** The haemodynamic panel: output, both filling pressures, resistance, and the two oxygen
 * numbers. Between them these name the cause; no one of them does it alone. */
const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Cardiac index', unit: 'L/min/m²', value: (s) => s.derived.cardiacIndex, decimals: 1 },
  { label: 'CVP', unit: 'mmHg', value: (s) => s.derived.centralVenousPressureMmHg, decimals: 0 },
  { label: 'Wedge', unit: 'mmHg', value: (s) => s.derived.wedgePressureMmHg, decimals: 0 },
  { label: 'SVR', value: (s) => s.derived.effectiveSvr, decimals: 2 },
  { label: 'SvO₂', unit: '%', value: (s) => s.derived.mixedVenousSaturationPercent, decimals: 0 },
  { label: 'Lactate', unit: 'mmol/L', value: (s) => s.derived.lactateMmolL, decimals: 1 },
];

const SETTLE = 3000;

export const SHOCK_QUESTIONS: readonly ShockQuestion[] = [
  {
    id: 'empty-on-both-sides',
    stem: 'A young trauma patient is cool and tachycardic. Their blood pressure is not yet alarming, but a pulmonary artery catheter shows the numbers below.',
    answer: 'haemorrhagic',
    options: ['haemorrhagic', 'cardiogenic', 'septic', 'tamponade'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Both filling pressures are empty and the resistance is up — there is simply not enough blood in the circuit, and the circulation has clamped down to compensate. Note the mixed venous saturation: it is low because extraction is intact and the tissue is taking everything it can from a reduced delivery. That is the opposite of the septic pattern. Note also the blood pressure, which is close to acceptable while the cardiac index is not. Compensation is hiding the severity, and it will keep hiding it until it fails.',
  },
  {
    id: 'full-on-both-sides',
    stem: 'A patient is breathless and hypotensive some hours after chest pain. Their lungs are wet on examination.',
    answer: 'cardiogenic',
    options: ['cardiogenic', 'haemorrhagic', 'septic', 'pulmonaryEmbolism'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Low output with both filling pressures raised is a pump that cannot clear what reaches it. The high wedge is the blood damming back into the lungs, which is what is making the patient breathless, and the raised CVP follows because a congested pulmonary circulation loads the right heart in turn. This is the state where a fluid bolus makes matters worse: filling was never the problem, and adding volume simply pushes the wedge higher.',
  },
  {
    id: 'high-svo2-with-lactate',
    stem: 'A patient is warm, vasodilated and hypotensive after two days of fever. The team is reassured by the mixed venous saturation.',
    answer: 'septic',
    options: ['septic', 'cardiogenic', 'haemorrhagic', 'tamponade'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Output is high, resistance is on the floor, and the mixed venous saturation is high — alongside a markedly raised lactate. That combination only makes sense one way: oxygen is being delivered in abundance and returned unused, because the tissue cannot extract it. The team should not be reassured. A high SvO₂ is reassuring only next to a normal lactate, and here the lactate is doing the talking. Treatment is vasopressors and source control, not more inotropy.',
  },
  {
    id: 'wedge-separates-obstruction',
    stem: 'A patient collapses suddenly with a low output and a visibly raised jugular venous pressure. The picture could pass for cardiogenic shock.',
    answer: 'pulmonaryEmbolism',
    options: ['pulmonaryEmbolism', 'cardiogenic', 'septic', 'haemorrhagic'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The CVP is high and the output is low, exactly as in cardiogenic shock — and then the wedge is low, which settles it. The obstruction sits between the two measurements: blood is dammed on the right because it cannot cross the lungs, so very little reaches the left heart to raise the wedge. One number separates two states that look the same at the bedside and are treated in opposite ways.',
  },
  {
    id: 'fluid-in-cardiogenic',
    stem: 'A patient in cardiogenic shock is hypotensive, and a fluid bolus is being considered because the blood pressure is low.',
    setup: { preset: 'cardiogenic' },
    intervention: { label: 'A 1.5 L crystalloid bolus is given.', perturb: (state) => perturbFluidBolus(state, 1500) },
    prompt: 'What happens to the wedge pressure?',
    watch: 'the wedge pressure',
    correctDirection: 'rises',
    settleSeconds: 2400,
    observeSeconds: 2400,
    explanation:
      'The wedge climbs, which is pulmonary congestion getting worse. A little extra output may come from Frank-Starling, but the ventricle is already on the flat part of its curve, so the volume mostly ends up as pressure behind a pump that cannot clear it. This is why the shock state must be named before it is treated: the identical bolus that rescues a bleeding patient drowns this one.',
    metric: (s) => s.derived.wedgePressureMmHg,
  },
  {
    id: 'reflex-was-holding-the-pressure',
    stem: 'A bleeding patient has maintained an almost normal blood pressure for an hour. Their heart rate is high and their extremities are cold.',
    setup: { preset: 'haemorrhagic' },
    intervention: { label: 'The baroreflex is lost.', inputs: { baroreflexGain: 0 } },
    prompt: 'What happens to mean arterial pressure?',
    watch: 'MAP',
    correctDirection: 'falls',
    settleSeconds: 2400,
    observeSeconds: 2400,
    explanation:
      'The pressure falls at once, because the reflex — not the circulating volume — was what had been holding it up. Sympathetic outflow was raising the resistance, the heart rate and the filling pressure simultaneously, and all three vanish together. This is why hypotension in haemorrhage is a late sign: by the time the pressure falls, the compensation has already been exhausted, and a great deal of blood has already gone.',
    metric: (s) => s.derived.meanArterialPressureMmHg,
  },
];

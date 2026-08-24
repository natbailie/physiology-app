import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { ThermoDerived, ThermoInputs, ThermoInternalState } from './engine/types';
import type { ThermoPresetName } from './engine/presets';
import { perturbActiveCooling, perturbGiveAntipyretic } from './engine/engine';

type Snapshot = { state: ThermoInternalState; derived: ThermoDerived };
export type ThermoQuestion = ModuleQuestion<ThermoInputs, ThermoPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Core temp', unit: '°C', value: (s) => s.derived.coreTempC, decimals: 1 },
  { label: 'Set point', unit: '°C', value: (s) => s.derived.setPointC, decimals: 1 },
  { label: 'Shivering', unit: 'W', value: (s) => s.derived.shiveringW, decimals: 0, tolerance: 0.3 },
  { label: 'Sweating', unit: 'W', value: (s) => s.derived.sweatW, decimals: 0, tolerance: 0.3 },
  {
    label: 'Net storage',
    unit: 'W',
    value: (s) => s.derived.netStorageW,
    decimals: 0,
    tolerance: 0.5,
  },
];

const SETTLE = 500000;

export const THERMO_QUESTIONS: readonly ThermoQuestion[] = [
  {
    id: 'hot-but-feeling-cold',
    stem: 'A patient with a chest infection is shivering violently under three blankets, teeth chattering, skin pale and cool to touch — yet the thermometer reads 39 C.',
    answer: 'feverViral',
    options: ['feverViral', 'heatStrokeExertional', 'normothermic', 'mildHypothermia'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The set point has been RAISED by pyrogen-driven prostaglandins, so a core of 39 is still BELOW where the hypothalamus wants it — the patient experiences genuine cold and generates heat to reach it. Shivering under blankets with a high reading is the signature of DEFENDED temperature. Exertional heat stroke shows hot dry skin and a NORMAL set point; the treatments are entirely different because the mechanisms are.',
  },
  {
    id: 'collapsed-runner-hot-dry',
    stem: 'A runner collapses at the finish of a summer race held in humid conditions. Core temperature is 40.6 C and his skin is hot but barely sweating.',
    answer: 'heatStrokeExertional',
    options: ['heatStrokeExertional', 'feverViral', 'deepHypothermia', 'normothermic'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Nine-fold metabolic production in humid air with impaired sweating overwhelms the same defences that handle fever — the set point never moved. Hot DRY skin past 40 C means evaporation has failed completely, which is the emergency inside the emergency: cooling must be immediate and external (ice water immersion), because nothing physiological will fix a ledger this far out of balance.',
  },
  {
    id: 'antipyretic-lowers-point',
    stem: 'The febrile patient is given paracetamol.',
    setup: { preset: 'feverViral' },
    intervention: { label: 'Antipyretic given.', perturb: (state) => perturbGiveAntipyretic(state) },
    prompt: 'What happens to sweating?',
    watch: 'sweating',
    correctDirection: 'rises',
    settleSeconds: 500000,
    observeSeconds: 900,
    explanation:
      'It begins — often profusely. Antipyretics block prostaglandin synthesis in the hypothalamus, releasing the raised point back toward 37 while every pyrogen remains; the core is suddenly ABOVE the defended target, so the body answers with vasodilatation and sweat. This visible swing from rigors to drenching sweats is the fever "breaking", and it is pure pharmacology: the infection was never touched.',
    metric: (s) => s.derived.sweatW,
  },
  {
    id: 'rubbing-does-not-exist-in-cold',
    stem: 'A hiker spends the night outdoors in wind and wet clothing. On rescue he is confused and shivering has stopped despite a core of 31 C.',
    setup: { preset: 'mildHypothermia' },
    intervention: { label: 'Core falls below 32 C.', inputs: { windWetnessPct: 70 } },
    prompt: 'What happens to shivering?',
    watch: 'shivering',
    correctDirection: 'falls',
    settleSeconds: 100000,
    observeSeconds: 60000,
    explanation:
      'It fades and then stops — deep hypothermia silences the very mechanism that was fighting the cold, because cold tissue shivers poorly just as cold muscle produces little. The absence of shivering in a hypothermic patient is deterioration, not improvement. From here management is gentle active rewarming, since rough handling of a cold heart risks ventricular fibrillation.',
    metric: (s) => s.state.shiveringW,
  },
  {
    id: 'cooling-blunts-the-spike',
    stem: 'The collapsed runner is treated with aggressive evaporative cooling — fans and tepid water.',
    setup: { preset: 'heatStrokeExertional' },
    intervention: { label: 'Active cooling applied.', perturb: (state) => perturbActiveCooling(state) },
    prompt: 'What happens to net heat storage?',
    watch: 'net storage',
    correctDirection: 'falls',
    settleSeconds: 200000,
    observeSeconds: 30000,
    tolerance: 0.02,
    explanation:
      'Storage falls — external cooling adds hundreds of watts to the loss side of the ledger, finally out-running metabolic production. Note what this does NOT require: sweating, which has failed, or a changed set point, which was never wrong. In hyperthermia the treatment replaces the environment; in fever it would be pointless, because a defended point simply re-asserts itself through vasoconstriction.',
    metric: (s) => s.derived.netStorageW,
  },
];

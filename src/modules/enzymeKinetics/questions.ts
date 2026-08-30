import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import { rateAt } from './engine/kinetics';
import type { KineticsDerived, KineticsInputs, KineticsInternalState } from './engine/types';
import type { KineticsPresetName } from './engine/presets';

type Snapshot = { state: KineticsInternalState; derived: KineticsDerived };
export type KineticsQuestion = ModuleQuestion<KineticsInputs, KineticsPresetName, Snapshot>;

/** Velocity at a probe substrate concentration of 1 mmol/L — how much the enzyme manages at
 * a clinically typical load. Read from the pure function so it is stable for any snapshot. */
const rateAtProbe = (s: Snapshot) => rateAt(1, s.derived.apparentVmaxUmPerMin, s.derived.apparentKmMm);

/** The Lineweaver-Burk slope, Vmax′/Km′ — its invariance under uncompetitive inhibition is
 * the signature examiners test. */
const lbSlope = (s: Snapshot) => s.derived.apparentVmaxUmPerMin / Math.max(s.derived.apparentKmMm, 1e-9);

export const KINETICS_QUESTIONS: readonly KineticsQuestion[] = [
  {
    id: 'competitive-raises-km',
    stem: 'A drug that competes for the enzyme\'s active site is added at ten times its Ki.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'A competitive inhibitor is added.',
      inputs: { inhibitorType: 'competitive', inhibitorUm: 50 },
    },
    prompt: 'What happens to the apparent Km?',
    watch: 'apparent Km',
    correctDirection: 'rises',
    explanation:
      'It rises roughly eleven-fold, because the competitive inhibitor and the substrate are fighting for the same site — the enzyme now behaves as if it holds its substrate far more weakly, which is precisely what apparent Km measures. Note what did not move: Vmax is untouched, because with enough substrate every inhibitor molecule can still be displaced from every site. That surmountability is why competitive inhibition is treated by dose escalation, and why the treatment works until it does not.',
    metric: (s) => s.derived.apparentKmMm,
  },
  {
    id: 'noncompetitive-cuts-vmax',
    stem: 'A different drug binds the enzyme away from the active site and disables it whether or not substrate is bound.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'A pure noncompetitive inhibitor is added.',
      inputs: { inhibitorType: 'noncompetitive', inhibitorUm: 50 },
    },
    prompt: 'What happens to the maximum velocity?',
    watch: 'Vmax',
    correctDirection: 'falls',
    explanation:
      'Vmax collapses to about a tenth, because the disabled enzyme cannot process anything no matter what occupies its active site — some of the enzyme population has simply left the workforce. Km is unchanged: whatever enzyme remains functional holds substrate exactly as tightly as before. This is the fundamental contrast with competitive inhibition, and it decides management: raising substrate recovers nothing here, so you stop the drug rather than push through it.',
    metric: (s) => s.derived.apparentVmaxUmPerMin,
  },
  {
    id: 'substrate-saturation-ceiling',
    stem: 'An enzyme is running at a substrate concentration twenty times its Km, deep in saturation.',
    setup: { preset: 'normal', inputs: { substrateMm: 10 } },
    intervention: { label: 'Substrate concentration doubles.', inputs: { substrateMm: 20 } },
    prompt: 'What happens to the reaction rate?',
    watch: 'reaction rate',
    correctDirection: 'unchanged',
    explanation:
      'Barely moves — the enzyme is already working flat out. Every active site is occupied essentially all the time, so extra substrate changes nothing but the queue length; this is zero-order kinetics, the regime most drugs occupy at therapeutic doses once their enzymes saturate. It explains why dose increases eventually stop producing proportional effect, why alcohol elimination runs on a clock rather than a rate, and why "just give more" stops working exactly when the pathway matters most.',
    metric: (s) => s.derived.reactionRateUmPerMin,
    tolerance: 0.04,
  },
  {
    id: 'fever-accelerates-denature-decides',
    stem: 'A patient with malignant hyperthermia-like physiology is heating rapidly. Enzymes obey Q10 kinetics — until they denature.',
    setup: { preset: 'febrile' },
    intervention: { label: 'Core temperature reaches 47°C.', inputs: { temperatureC: 47 } },
    prompt: 'What happens to overall reaction velocity?',
    watch: 'reaction velocity',
    correctDirection: 'falls',
    explanation:
      'It falls below even normal baseline, despite the Q10 rule that says heat should accelerate everything — because above about 42°C denaturation outruns acceleration. The protein\'s shape IS its catalytic function; heat unravels the shape, and an unravelled enzyme processes nothing however energetically its molecules move. This crossover is the whole difference between fever, where modest heat speeds you up, and heat stroke or malignant hyperthermia, where the same physics has passed its tipping point and active cooling becomes the treatment.',
    metric: (s) => s.derived.reactionRateUmPerMin,
    settleSeconds: 10,
    observeSeconds: 10,
  },
  {
    id: 'acidaemia-slows-everything',
    stem: 'A patient in diabetic ketoacidosis has a pH of 6.8. Consider what that does to enzymatic reactions throughout the body.',
    setup: { preset: 'normal' },
    intervention: { label: 'Systemic acidaemia develops.', inputs: { ph: 6.8 } },
    prompt: 'What happens to enzyme activity?',
    watch: 'residual activity',
    correctDirection: 'falls',
    explanation:
      'It falls to well under half, because the charged amino-acid residues that bind substrates and stabilise transition states only carry the right charges near physiological pH. Nothing dramatic happens to any single enzyme — each just runs a little slower — but everything runs slower at once, which is why severe acidaemia produces global depression of consciousness, contractility and respiration rather than one failing organ. The blood gas reports one number; the patient experiences this graph applied to every reaction they own.',
    metric: (s) => s.derived.residualActivityPct,
    settleSeconds: 8,
    observeSeconds: 8,
  },

  // --- Naming the inhibitor class from its constants ---

  {
    id: 'inhibitor-class-discrimination',
    stem: 'An unknown inhibitor is titrated onto an enzyme of known Km 0.5 and Vmax 50. The panel shows the apparent constants it leaves behind.',
    answer: 'competitive',
    options: ['competitive', 'noncompetitive', 'uncompetitive'],
    panel: [
      { label: 'Apparent Km (mmol/L)', unit: '', value: (s: Snapshot) => s.derived.apparentKmMm, decimals: 2 },
      { label: 'Apparent Vmax (µmol/min)', unit: '', value: (s: Snapshot) => s.derived.apparentVmaxUmPerMin, decimals: 0 },
      { label: 'Rate at [S]=1', unit: '', value: rateAtProbe, decimals: 1 },
      { label: 'LB slope (Vmax/Km)', unit: '', value: lbSlope, decimals: 1 },
    ] as readonly PanelField<Snapshot>[],
    settleSeconds: 5,
    explanation:
      'Km inflated, Vmax untouched, and the double-reciprocal line steeper through the same y-intercept: competitive. The noncompetitive option fails on Km — it leaves it alone while cutting Vmax — and the uncompetitive option fails on both plus the signature it cannot hide: Vmax/Km stays constant, so its Lineweaver-Burk line shifts sideways without changing slope. In practice this discrimination is done exactly this way, from apparent constants measured across substrate concentrations — never from watching one reaction run once.',
  },
];

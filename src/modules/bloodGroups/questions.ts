import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { BloodDerived, BloodInputs, BloodInternalState } from './engine/types';
import type { BloodPresetName } from './engine/presets';

type Snapshot = { state: BloodInternalState; derived: BloodDerived };
export type BloodQuestion = ModuleQuestion<BloodInputs, BloodPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Haemolysis', unit: '% severity', value: (s) => s.derived.haemolyticSeverity, decimals: 0, tolerance: 0.25 },
  { label: 'Free haemoglobin', value: (s) => s.derived.plasmaFreeHaemoglobin, decimals: 0 },
  {
    label: 'Complement consumed',
    unit: '%',
    value: (s) => s.derived.complementConsumedPct,
    decimals: 0,
    tolerance: 0.3,
  },
  { label: 'DIC risk', unit: '%', value: (s) => s.derived.dicRiskPct, decimals: 0, tolerance: 0.3 },
  {
    label: 'Reaction arm',
    value: (s) =>
      s.derived.reactionArm.startsWith('immediate') ? 2 : s.derived.reactionArm.startsWith('delayed') ? 1 : 0,
    decimals: 0,
    tolerance: 0.5,
  },
];

const SETTLE = 60000;

export const BLOOD_QUESTIONS: readonly BloodQuestion[] = [
  {
    id: 'acute-abo-collapse',
    stem: 'During transfusion of a unit of packed cells, a patient develops fever, loin pain and dark urine within minutes. The blood pressure is falling.',
    answer: 'massiveMismatch',
    options: ['massiveMismatch', 'rhSensitisedMismatch', 'compatibleMatch', 'abUniversal'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Collapse DURING the infusion with dark urine means preformed antibodies have met antigen on the transfused cells — ABO incompatibility at meaningful volume. IgM fixes complement immediately: free haemoglobin, haemoglobinuria, shock, then DIC and renal injury if the volume was large. Stop the unit, run fluids for the kidney, support the pressure. The delayed Rh reaction looks nothing like this today — it presents next week.',
  },
  {
    id: 'falling-hb-next-week',
    stem: 'Two weeks after transfusion, a patient has unexplained anaemia with jaundice and a positive direct antiglobulin test. There was no episode during the transfusion itself.',
    answer: 'rhSensitisedMismatch',
    options: ['rhSensitisedMismatch', 'massiveMismatch', 'compatibleMatch', 'oRecipientGetsAb'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Delayed extravascular clearance is IgG biology: sensitised cells are eaten by the spleen over days, so the presentation is a falling haemoglobin with mild jaundice — never the free-haemoglobin storm of an ABO reaction. Complement barely moves because extravascular destruction does not consume it. The prior sensitisation (earlier transfusion or pregnancy) is what made this response possible.',
  },
  {
    id: 'universal-donor-silence',
    stem: 'An AB-positive patient in haemorrhagic shock receives emergency O-negative red cells while the blood bank crossmatches exact units.',
    answer: 'abUniversal',
    options: ['abUniversal', 'oRecipientGetsAb', 'massiveMismatch', 'rhSensitisedMismatch'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Nothing happens immunologically — O red cells carry neither A nor B antigen, so there is nothing for the recipient\'s antibodies (and an AB recipient has none anyway) to meet. The universal-donor trick works because red-cell units contain almost none of the DONOR\'s plasma; it is about absent antigens on the cells given, not absent antibodies in the patient.',
  },
  {
    id: 'volume-drives-severity',
    stem: 'A ward nurse notices the mismatch at ten millilitres and stops the transfusion immediately. Another unit elsewhere ran to completion before anyone looked.',
    setup: { preset: 'massiveMismatch' },
    intervention: { label: 'Transfused volume limited to 40 mL.', inputs: { transfusionVolumeMl: 40 } },
    prompt: 'What happens to DIC risk?',
    watch: 'DIC risk',
    correctDirection: 'falls',
    settleSeconds: 30000,
    observeSeconds: 30000,
    explanation:
      'It collapses toward zero — severity scales with the VOLUME of incompatible cells infused, which is why stopping at the first few millilitres aborts the entire syndrome before free haemoglobin reaches the kidney or thrombin generation begins. The fifteen-minute supervised start of every transfusion is not ceremony; it is the single most effective safety intervention in transfusion medicine.',
    metric: (s) => s.derived.dicRiskPct,
  },
];

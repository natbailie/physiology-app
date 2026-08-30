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
      'Collapse during the infusion with dark urine means preformed antibodies have met antigen on the transfused cells — ABO incompatibility at meaningful volume. IgM fixes complement immediately: free haemoglobin, haemoglobinuria, shock, then DIC and renal injury if the volume was large. Stop the unit, run fluids for the kidney, support the pressure. The delayed Rh reaction looks nothing like this today — it presents next week.',
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
      'Nothing happens immunologically — O red cells carry neither A nor B antigen, so there is nothing for the recipient\'s antibodies (and an AB recipient has none anyway) to meet. The universal-donor trick works because red-cell units contain almost none of the donor\'s plasma; it is about absent antigens on the cells given, not absent antibodies in the patient.',
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
      'It collapses toward zero — severity scales with the volume of incompatible cells infused, which is why stopping at the first few millilitres aborts the entire syndrome before free haemoglobin reaches the kidney or thrombin generation begins. The fifteen-minute supervised start of every transfusion is not ceremony; it is the single most effective safety intervention in transfusion medicine.',
    metric: (s) => s.derived.dicRiskPct,
  },

  // --- Haemolytic disease of the newborn: prevention is a TIMING question ---

  {
    id: 'hdn-fetus-anaemia',
    stem: 'A Rh-negative mother who was sensitised by a previous pregnancy now carries a Rh-positive fetus. Nothing intervenes.',
    setup: { preset: 'compatibleMatch' },
    intervention: {
      label: 'The maternal-fetal pair is followed through the third trimester.',
      inputs: { hdnScenario: 1, recipientRhPositive: 0, rhSensitised: 1 },
    },
    prompt: 'What happens to fetal haemoglobin?',
    watch: 'fetal haemoglobin',
    correctDirection: 'falls',
    settleSeconds: 600000,
    observeSeconds: 200000,
    explanation:
      'It drifts down week after week, because maternal IgG crosses the placenta continuously and clears fetal red cells in the spleen — extravascularly, slowly, with no complement burst and no free haemoglobin surge. That slowness is why HDN announces itself as progressive anaemia and jaundice rather than collapse, and why surveillance (and intrauterine transfusion when needed) is timed against the antibody titre rather than against any acute event. Same antibody chemistry as an Rh transfusion reaction; completely different tempo and completely different patient.',
    metric: (s) => s.derived.fetalHaemoglobinGDl,
  },
  {
    id: 'anti-d-prevents-next-time',
    stem: 'A Rh-negative mother has just delivered her first Rh-positive baby. She was not previously sensitised, and no anti-D has been given yet.',
    setup: { preset: 'hdnMissedProphylaxis' },
    intervention: { label: 'Anti-D immunoglobulin is given at this delivery.', inputs: { antiDProtectionPct: 95 } },
    prompt: 'What happens to the sensitisation risk for her next pregnancy?',
    watch: 'next-pregnancy risk',
    correctDirection: 'falls',
    observeSeconds: 30000,
    explanation:
      'It collapses from near-certain to almost nil, and that is the entire point of anti-D: it destroys any fetal cells that crossed into the maternal circulation at this delivery before her immune system can learn them. Note what it did not do — it did not treat this baby, because this baby never needed treating; sensitisation happens around delivery, too late for significant harm the first time. The disease anti-D prevents belongs to the next child, which is why the dose is audited with the same rigour as a blood product, because that is what it is.',
    metric: (s) => s.derived.nextPregnancySensitisationRiskPct,
  },

  // --- The HDN trio as pattern discrimination ---

  {
    id: 'hdn-trio',
    stem: 'Three Rh-negative mothers, each carrying a Rh-positive fetus. One panel explains why only one baby is at risk.',
    answer: 'hdnAffected',
    options: ['hdnAffected', 'hdnProtected', 'hdnMissedProphylaxis'],
    panel: [
      { label: 'Fetal Hb (g/dL)', unit: '', value: (s) => s.derived.fetalHaemoglobinGDl, decimals: 1 },
      { label: 'Cord bilirubin (µmol/L)', unit: '', value: (s) => s.derived.cordBilirubinUmolL, decimals: 0 },
      { label: 'Hydrops risk (%)', unit: '', value: (s) => s.derived.hydropsRiskPct, decimals: 0 },
      { label: 'Next-pregnancy risk (%)', unit: '', value: (s) => s.derived.nextPregnancySensitisationRiskPct, decimals: 0 },
    ] as readonly PanelField<Snapshot>[],
    settleSeconds: 900000,
    explanation:
      'Only the sensitised mother threatens this fetus: falling Hb, rising bilirubin, hydrops on the horizon — the antibody already exists and the placenta is a highway for IgG. The other two fetuses are both healthy today, and the panel separates them by exactly one row: whether anti-D was given when it could still work. Missed prophylaxis leaves this pregnancy unscathed while writing a blank cheque against the next one. That asymmetry is why anti-D is counted, signed for, and given within seventy-two hours of every qualifying delivery.',
  },
];

import type { PatternQuestion } from '@/shared/assessment/types';
import type { CoagDerived, CoagState } from './engine/types';
import type { CoagPresetName } from './engine/presets';

type Snapshot = { state: CoagState; derived: CoagDerived };
export type CoagQuestion = PatternQuestion<CoagPresetName, Snapshot>;

/** The panel every question is read from — the four tests that between them localise a defect
 * to the extrinsic limb, the intrinsic limb, the common pathway or the platelets. */
const SCREEN = [
  { label: 'PT', unit: 's', value: (s: Snapshot) => s.derived.ptSeconds, decimals: 1 },
  { label: 'APTT', unit: 's', value: (s: Snapshot) => s.derived.apttSeconds, decimals: 1 },
  { label: 'Platelets', unit: 'x10^9/L', value: (s: Snapshot) => s.derived.plateletCountValue, decimals: 0 },
  { label: 'Bleeding time', unit: 'min', value: (s: Snapshot) => s.derived.bleedingTimeMinutes, decimals: 1 },
] as const;

const FULL = [
  ...SCREEN,
  { label: 'Fibrinogen', unit: 'mg/dL', value: (s: Snapshot) => s.derived.fibrinogenMgDl, decimals: 0 },
  { label: 'D-dimer', unit: 'ng/mL', value: (s: Snapshot) => s.derived.dDimerNgMl, decimals: 0 },
] as const;

export const COAGULATION_QUESTIONS: readonly CoagQuestion[] = [
  {
    id: 'isolated-aptt',
    stem: 'A boy has bled into the same knee joint several times. The screening panel shows one abnormal result and three normal ones.',
    answer: 'hemophiliaA',
    options: ['hemophiliaA', 'warfarin', 'thrombocytopenia', 'vonWillebrand'],
    panel: SCREEN,
    explanation:
      'A prolonged APTT with a normal PT localises the defect to the intrinsic limb, and normal platelets with a normal bleeding time rule out the platelet arm entirely. That is haemophilia. Note the model cannot tell A from B here, and neither can this panel — the intrinsic tenase is a multiplicative pairing of VIIIa and IXa, so losing either produces the identical result and only a factor assay separates them. Deep joint and muscle bleeding, rather than mucosal oozing, is the clinical signature.',
  },
  {
    id: 'prolonged-bleeding-time',
    stem: 'A young woman reports heavy periods, frequent nosebleeds and prolonged bleeding after a dental extraction. Her platelet count is normal.',
    answer: 'vonWillebrand',
    options: ['vonWillebrand', 'thrombocytopenia', 'hemophiliaA', 'normal'],
    panel: SCREEN,
    explanation:
      'A prolonged bleeding time with a NORMAL platelet count points at platelet function rather than platelet number, and von Willebrand factor is what platelets need to stick to damaged vessel wall. The APTT is prolonged too, which surprises people until you remember vWF is the carrier for factor VIII — lose it and factor VIII falls with it. Mucosal bleeding is the clinical signature, in contrast to the deep joint bleeds of haemophilia.',
  },
  {
    id: 'dic-vs-liver',
    stem: 'A septic patient is oozing from every cannula site. Both the PT and the APTT are prolonged and the platelet count has fallen. The team is debating whether this is consumption or simply a failing liver.',
    answer: 'dic',
    options: ['dic', 'liverDisease', 'warfarin', 'thrombocytopenia'],
    panel: FULL,
    explanation:
      'Liver disease and DIC both prolong PT and APTT, because a failing liver makes fewer of the same factors that DIC consumes. The D-dimer is what separates them: DIC is active clotting AND active lysis throughout the circulation, so fibrin degradation products are high, while a liver that is merely underproducing has nothing extra to break down. The falling fibrinogen and platelets point the same way — they are being consumed, not just under-made.',
  },
  {
    id: 'isolated-pt',
    stem: 'A patient on long-term medication for atrial fibrillation comes in for routine monitoring. One arm of the screening panel is prolonged and the platelet count is untouched.',
    answer: 'warfarin',
    options: ['warfarin', 'hemophiliaA', 'thrombocytopenia', 'heparin'],
    panel: SCREEN,
    explanation:
      'A prolonged PT with a relatively preserved APTT points to the extrinsic limb, and factor VII — the shortest-lived of the vitamin K dependent factors — is the first to fall when that pathway is blocked. This is why the INR tracks warfarin. Heparin would hit the APTT hardest instead, by accelerating antithrombin against thrombin and factor Xa, which is the reason the two drugs are monitored with different tests.',
  },
];

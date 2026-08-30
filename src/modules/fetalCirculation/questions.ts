import type { ModuleQuestion, PanelField } from '@/shared/assessment/types';
import type { FetalDerived, FetalInputs, FetalState } from './engine/types';
import type { FetalPresetName } from './engine/presets';

type Snapshot = { state: FetalState; derived: FetalDerived };
export type FetalQuestion = ModuleQuestion<FetalInputs, FetalPresetName, Snapshot>;

const PANEL: readonly PanelField<Snapshot>[] = [
  { label: 'Pre-ductal SpO₂', unit: '%', value: (s) => s.derived.preDuctalSaturationPercent, decimals: 0 },
  { label: 'Post-ductal SpO₂', unit: '%', value: (s) => s.derived.postDuctalSaturationPercent, decimals: 0 },
  { label: 'Pulmonary resistance', value: (s) => s.derived.pulmonaryVascularResistance, decimals: 1 },
  { label: 'Ductal shunt', value: (s) => s.derived.ductalShuntFraction, decimals: 2, tolerance: 0.15 },
  { label: 'Duct patency', value: (s) => s.derived.ductusArteriosusPatency, decimals: 2, tolerance: 0.15 },
];

const SETTLE = 5000;

export const FETAL_QUESTIONS: readonly FetalQuestion[] = [
  {
    id: 'pphn-differential-cyanosis',
    stem: 'A term newborn is well ventilated but remains cyanosed. Saturation probes are placed on the right hand and on a foot.',
    answer: 'pphn',
    options: ['pphn', 'transitioned', 'fetal', 'patentDuctus'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The right hand is in the nineties and the foot is far below it — differential cyanosis, and it localises the problem precisely. The shunt enters the aorta below the vessels supplying the head and right arm, so only the lower body receives it. Pulmonary resistance has failed to fall after birth, the fetal gradient has survived the delivery, and the duct is still shunting right to left. Note the duct has stayed open, because it responds to the oxygen tension of the blood flowing through it and that blood is desaturated.',
  },
  {
    id: 'left-to-right-duct',
    stem: 'An infant some weeks old has a continuous murmur, bounding pulses and is slow to feed. Their saturations are normal and equal in all four limbs.',
    answer: 'patentDuctus',
    options: ['patentDuctus', 'pphn', 'fetal', 'transitioned'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'The duct is still open, but the saturations are equal — so it cannot be shunting right to left. Pulmonary resistance has fallen normally, and the duct now sits between a high-pressure aorta and a low-pressure pulmonary artery, carrying flow left to right and flooding the lungs. Nothing about the duct changed after birth; the pressures either side of it did. That is why the same anatomical lesion presents as cyanosis in one baby and as heart failure in another.',
  },
  {
    id: 'in-utero-pattern',
    stem: 'A circulation is running with almost no blood reaching the lungs at all, and its best-oxygenated blood is only about 80% saturated.',
    answer: 'fetal',
    options: ['fetal', 'pphn', 'transitioned', 'ductDependent'],
    panel: PANEL,
    settleSeconds: SETTLE,
    explanation:
      'Pulmonary resistance is enormous, the duct is wide open shunting right to left, and both saturations are low — this is the circulation working exactly as designed, because the lung is not the oxygenating organ yet. The saturations that would signal catastrophe after birth are simply normal before it. Note the two ventricles are working in parallel into one aorta rather than in series, which is what makes the whole arrangement possible.',
  },
  {
    id: 'oxygen-closes-the-duct',
    stem: 'A newborn with a duct-dependent systemic circulation is being maintained on a prostaglandin infusion. Someone suggests increasing the inspired oxygen because the saturations look low.',
    setup: { preset: 'ductDependent' },
    intervention: { label: 'The prostaglandin infusion is stopped.', inputs: { prostaglandinLevel: 0 } },
    prompt: 'What happens to ductal patency?',
    watch: 'the duct',
    correctDirection: 'falls',
    settleSeconds: 3000,
    observeSeconds: 4000,
    explanation:
      'The duct closes, and in a duct-dependent lesion that is fatal. Prostaglandin was the only thing holding it open against an oxygen tension high enough to constrict it — in utero the placenta supplied that prostaglandin, which is why the duct was patent before birth and starts closing after. The same logic is why oxygen is given cautiously in these babies: the instinct to correct a low saturation would shut the one channel keeping them perfused.',
    metric: (s) => s.derived.ductusArteriosusPatency,
  },
  {
    id: 'clamping-raises-svr',
    stem: 'At delivery the umbilical cord is clamped. Nothing else about the baby has changed yet — the lungs have not been aerated.',
    setup: { preset: 'fetal' },
    intervention: { label: 'The cord is clamped.', inputs: { placentalCirculation: 0 } },
    prompt: 'What happens to systemic vascular resistance?',
    watch: 'systemic resistance',
    correctDirection: 'rises',
    settleSeconds: 2000,
    observeSeconds: 2000,
    explanation:
      'It rises sharply, because the placenta was an enormous low-resistance bed receiving a large share of combined ventricular output. Removing it is half of the transition, and the half usually forgotten — the other half is pulmonary resistance falling as the lung aerates. The two move in opposite directions and cross over, and every fetal shunt was running on the old gradient. Understanding the crossover is understanding why the shunts reverse and then close.',
    metric: (s) => s.derived.systemicVascularResistance,
  },
];

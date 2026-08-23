import type { PredictQuestion } from '@/shared/assessment/types';
import type { VenousReturnDerived, VenousReturnInputs, VenousReturnState } from './engine/types';
import type { VenousReturnPresetName } from './engine/presets';

type Snapshot = { state: VenousReturnState; derived: VenousReturnDerived };
export type VenousReturnQuestion = PredictQuestion<VenousReturnInputs, VenousReturnPresetName, Snapshot>;

export const VENOUS_RETURN_QUESTIONS: readonly VenousReturnQuestion[] = [
  {
    id: 'venoconstriction-output',
    stem: 'A patient stands up and their sympathetic nervous system responds by constricting the veins. Not a millilitre of blood has been added or lost, and the heart is unchanged.',
    setup: { preset: 'normal' },
    intervention: {
      label: 'Venoconstriction converts unstressed volume into stressed volume.',
      inputs: { unstressedVolumeFraction: 0.76 },
    },
    prompt: 'What happens to cardiac output?',
    watch: 'cardiac output',
    correctDirection: 'rises',
    explanation:
      'Output rises with the blood volume completely unchanged, which is the single most counter-intuitive result in this module. About 86% of blood volume merely fills the vessels without stretching them and generates no pressure at all; only the stressed remainder produces the mean systemic filling pressure that drives venous return. Venoconstriction converts one into the other, shifting the venous return curve right. This is how output is defended within seconds of standing or bleeding, long before any fluid could be given.',
    metric: (s) => s.derived.cardiacOutputLPerMin,
  },
  {
    id: 'ppv-transmural',
    stem: 'A patient is switched from breathing spontaneously to positive-pressure ventilation. Their blood volume, contractility and vascular resistance are all unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Intrathoracic pressure rises to +8 mmHg.', inputs: { intrathoracicPressure: 8 } },
    prompt: 'What happens to cardiac output?',
    watch: 'cardiac output',
    correctDirection: 'falls',
    explanation:
      'The heart is a pump inside a pressure chamber, and what distends it is transmural pressure — inside minus outside. Raising the pressure around it shifts the entire cardiac function curve to the right, so the same measured right atrial pressure now fills it less. Output falls. This is the mechanism behind the drop in output during a Valsalva strain and under positive-pressure ventilation, and it is why a high central venous pressure in a ventilated patient does not mean what the same number would mean in someone breathing spontaneously.',
    metric: (s) => s.derived.cardiacOutputLPerMin,
  },
  {
    id: 'av-fistula-output',
    stem: 'A patient has a large arteriovenous fistula created for dialysis access. Their heart is structurally normal and their blood volume is normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'A large arteriovenous shunt opens.', inputs: { arteriovenousShunt: 0.8 } },
    prompt: 'What happens to cardiac output?',
    watch: 'cardiac output',
    correctDirection: 'rises',
    explanation:
      'A fistula bypasses the arterioles entirely, collapsing the resistance to venous return and letting blood race back to the heart. The result is a high cardiac output produced by a completely normal heart. It also shows why resistance to venous return is dominated by the VEINS rather than the arterioles: what matters is resistance weighted by the compliance downstream of it, and almost all the compliance is venous. Doubling systemic vascular resistance moves the venous return curve far less than it moves arterial pressure.',
    metric: (s) => s.derived.cardiacOutputLPerMin,
  },

  {
    id: 'haemorrhage-drops-filling-pressure',
    stem: 'A trauma patient loses a substantial volume of blood. Their heart is entirely normal.',
    setup: { preset: 'normal' },
    intervention: { label: 'They lose 1.5 L of blood.', inputs: { bloodVolumeMl: 3500 } },
    prompt: 'What happens to the mean systemic filling pressure?',
    watch: 'the mean systemic filling pressure',
    correctDirection: 'falls',
    explanation:
      'It falls, and that is the reason the output falls with it. Mean systemic filling pressure is the pressure in the circulation with the heart stopped — the upstream head that drives blood back to the right atrium — and it is set by the stressed volume against the venous compliance. A normal heart cannot pump blood that does not arrive, so in haemorrhage the limit is the filling pressure, not the pump. That is why the treatment is volume rather than inotropes.',
    metric: (s) => s.derived.meanSystemicFillingPressureMmHg,
  },
  {
    id: 'failing-heart-raises-atrial-pressure',
    stem: 'A patient develops a severe cardiomyopathy. Their blood volume and vascular tone are unchanged.',
    setup: { preset: 'normal' },
    intervention: { label: 'Contractility falls to a third of normal.', inputs: { contractility: 0.33 } },
    prompt: 'What happens to the right atrial pressure?',
    watch: 'the right atrial pressure',
    correctDirection: 'rises',
    explanation:
      'The right atrial pressure rises, because a weaker heart operates further up the venous return curve. The two curves cross wherever cardiac function meets venous return, and flattening the cardiac curve moves the crossing to a higher pressure and a lower flow. The raised jugular venous pressure at the bedside IS that new crossing point, which is why it is a sign of the pump failing rather than of too much fluid.',
    metric: (s) => s.derived.rightAtrialPressureMmHg,
  },
  {
    id: 'venodilation-drops-return',
    stem: 'A patient is given a large dose of a venodilator. Their blood volume is completely unchanged — not a millilitre has been lost.',
    setup: { preset: 'normal' },
    intervention: { label: 'Venous compliance doubles.', inputs: { venousCompliance: 2 } },
    prompt: 'What happens to venous return?',
    watch: 'venous return',
    correctDirection: 'falls',
    explanation:
      'Return falls despite the blood volume being identical, because what drives it is the STRESSED volume — the part actually distending the vessels — and dilating the veins converts stressed volume into unstressed at a stroke. The same blood is now sitting in a larger container at a lower pressure. This is how nitrates relieve angina, and it is also why they drop the blood pressure of a patient who is already volume-deplete.',
    metric: (s) => s.derived.venousReturnLPerMin,
  }
];

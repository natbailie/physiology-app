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
];
